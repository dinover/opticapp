import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import Modal from '../components/Modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Texto del botón que confirma. Por defecto "Confirmar". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta el botón de confirmar en rojo, para acciones destructivas. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

/**
 * Reemplazo de window.confirm() con una promesa, para poder usarlo igual de
 * directo que el nativo:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '...', message: '...', danger: true }))) return;
 */
export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal
          open
          onClose={() => settle(false)}
          title={options.title}
          maxWidth={420}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => settle(false)}>
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                className={`btn ${options.danger ? 'btn-danger-solid' : 'btn-primary'}`}
                onClick={() => settle(true)}
              >
                {options.confirmLabel || 'Confirmar'}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {options.message}
          </p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  return ctx;
};

import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  /** Una línea explicando qué va acá y por qué está vacío. */
  description?: string;
  /** Acción directa: un estado vacío sin salida obliga al usuario a buscarla. */
  actionLabel?: string;
  onAction?: () => void;
  /** Variante para "no hay resultados de búsqueda", distinta de "no hay nada cargado". */
  searchTerm?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  searchTerm,
}) => {
  const searching = Boolean(searchTerm);

  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <p className="empty-state-title">
        {searching ? `Sin resultados para “${searchTerm}”` : title}
      </p>
      {(searching || description) && (
        <p className="empty-state-desc">
          {searching ? 'Probá con otro término o revisá la ortografía.' : description}
        </p>
      )}
      {!searching && actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

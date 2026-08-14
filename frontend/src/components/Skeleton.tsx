import React from 'react';

/**
 * Placeholders de carga. Preferidos por sobre un spinner suelto porque
 * mantienen la forma de la pantalla y evitan el salto de layout cuando
 * llegan los datos.
 */

export const SkeletonLine: React.FC<{ width?: string | number; height?: number }> = ({
  width = '100%',
  height = 12,
}) => <span className="skeleton" style={{ width, height, display: 'block' }} />;

/** Filas de tabla en carga. `columns` debe coincidir con el <thead> real. */
export const SkeletonRows: React.FC<{ rows?: number; columns: number }> = ({
  rows = 5,
  columns,
}) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} aria-hidden="true">
        {Array.from({ length: columns }).map((_, c) => (
          <td key={c}>
            <SkeletonLine width={c === 0 ? '70%' : '45%'} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/** Tarjetas en carga, para vistas de grilla (ej. productos). */
export const SkeletonCards: React.FC<{ count?: number; height?: number }> = ({
  count = 8,
  height = 220,
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height, borderRadius: 'var(--radius-lg)' }} aria-hidden="true" />
    ))}
  </>
);

/** Bloques de estadística en carga, para el dashboard. */
export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 108, borderRadius: 'var(--radius-lg)' }} aria-hidden="true" />
    ))}
  </>
);

export default SkeletonLine;

import React from 'react';
import SortableTh, { SortOrder } from './SortableTh';
import { SkeletonLine, SkeletonRows } from './Skeleton';
import { useIsMobile } from '../hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  /** Columna real para ordenar en el backend (habilita el encabezado ordenable). */
  sortKey?: string;
  align?: 'left' | 'right';
  className?: string;
  /**
   * Cómo aparece en la tarjeta de celular:
   * 'primary' encabeza la tarjeta, 'secondary' va debajo, 'meta' en la grilla
   * etiqueta/valor, 'hidden' no se muestra.
   */
  mobile?: 'primary' | 'secondary' | 'meta' | 'hidden';
  /** Etiqueta en la grilla de la tarjeta (por defecto, el header). */
  mobileLabel?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => React.Key;
  /** Botones de la fila: última columna en escritorio, pie de la tarjeta en celular. */
  actions?: (row: T) => React.ReactNode;
  actionsLabel?: string;
  loading?: boolean;
  skeletonRows?: number;
  /** Contenido cuando no hay filas (normalmente un <EmptyState/>). */
  empty?: React.ReactNode;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (column: string, order: SortOrder) => void;
  /** Paginación u otro pie. */
  footer?: React.ReactNode;
}

/**
 * Tabla en escritorio, tarjetas en celular. Se renderiza una sola de las dos
 * variantes (no ambas ocultas por CSS) para que cada botón exista una vez.
 */
function DataTable<T>({
  rows, columns, rowKey, actions, actionsLabel = 'Acciones',
  loading = false, skeletonRows = 5, empty, sortBy, sortOrder, onSort, footer,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const hasRows = rows.length > 0;

  if (isMobile) {
    const primary = columns.filter(c => c.mobile === 'primary');
    const secondary = columns.filter(c => c.mobile === 'secondary');
    const meta = columns.filter(c => (c.mobile ?? 'meta') === 'meta');

    return (
      <div>
        {loading ? (
          <div className="dt-cards" aria-hidden="true">
            {Array.from({ length: Math.min(skeletonRows, 4) }).map((_, i) => (
              <div key={i} className="dt-card"><SkeletonLine width="60%" height={14} /><SkeletonLine width="85%" /></div>
            ))}
          </div>
        ) : hasRows ? (
          <div className="dt-cards">
            {rows.map(row => (
              <article key={rowKey(row)} className="dt-card">
                {(primary.length > 0 || secondary.length > 0) && (
                  <div className="dt-card-head">
                    {primary.map(c => <div key={c.key}>{c.render(row)}</div>)}
                    {secondary.map(c => <div key={c.key} className="dt-card-secondary">{c.render(row)}</div>)}
                  </div>
                )}
                {meta.length > 0 && (
                  <dl className="dt-card-meta">
                    {meta.map(c => (
                      <div key={c.key}>
                        <dt>{c.mobileLabel ?? c.header}</dt>
                        <dd>{c.render(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {actions && <div className="dt-card-actions">{actions(row)}</div>}
              </article>
            ))}
          </div>
        ) : (
          <div className="card">{empty}</div>
        )}
        {footer && <div className="dt-pagination-mobile">{footer}</div>}
      </div>
    );
  }

  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map(c =>
                c.sortKey && onSort && sortBy !== undefined && sortOrder ? (
                  <SortableTh key={c.key} column={c.sortKey} sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align={c.align}>
                    {c.header}
                  </SortableTh>
                ) : (
                  <th key={c.key} style={c.align === 'right' ? { textAlign: 'right' } : undefined}>{c.header}</th>
                ),
              )}
              {actions && <th style={{ textAlign: 'right' }}>{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={skeletonRows} columns={colCount} />
            ) : hasRows ? rows.map(row => (
              <tr key={rowKey(row)}>
                {columns.map(c => (
                  <td key={c.key} className={c.className} style={c.align === 'right' ? { textAlign: 'right' } : undefined}>
                    {c.render(row)}
                  </td>
                ))}
                {actions && <td><div className="cell-actions">{actions(row)}</div></td>}
              </tr>
            )) : (
              <tr><td colSpan={colCount}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

export default DataTable;

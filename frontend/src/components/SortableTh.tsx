import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export type SortOrder = 'ASC' | 'DESC';

interface SortableThProps {
  /**
   * Columna real de la base. El backend valida contra una lista blanca
   * (ver src/utils/pagination.ts), hoy: id, name, created_at, updated_at,
   * price, quantity, total_price, sale_date, email, phone. Una columna
   * fuera de esa lista se ignora silenciosamente y ordena por id.
   */
  column: string;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (column: string, order: SortOrder) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

const SortableTh: React.FC<SortableThProps> = ({
  column,
  sortBy,
  sortOrder,
  onSort,
  children,
  align = 'left',
}) => {
  const active = sortBy === column;
  // Primer clic en una columna nueva ordena descendente (lo más común: lo más
  // reciente / lo más caro arriba); volver a clickearla alterna.
  const nextOrder: SortOrder = active && sortOrder === 'DESC' ? 'ASC' : 'DESC';

  return (
    <th style={{ textAlign: align }} aria-sort={active ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`th-sort ${active ? 'is-active' : ''}`}
        onClick={() => onSort(column, nextOrder)}
        style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
      >
        {children}
        <span aria-hidden="true" className="th-sort-icon">
          {!active && <ChevronUpDownIcon className="w-3.5 h-3.5" />}
          {active && sortOrder === 'ASC' && <ChevronUpIcon className="w-3.5 h-3.5" />}
          {active && sortOrder === 'DESC' && <ChevronDownIcon className="w-3.5 h-3.5" />}
        </span>
      </button>
    </th>
  );
};

export default SortableTh;

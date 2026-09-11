import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="pagination" aria-label={t('Paginación', 'Pagination')}>
      <span className="pagination-info">
        {t('Página', 'Page')} <strong>{page}</strong> {t('de', 'of')} <strong>{totalPages}</strong>
      </span>

      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label={t('Página anterior', 'Previous page')}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {start > 1 && (
          <>
            <button type="button" className="page-btn" onClick={() => onPageChange(1)}>1</button>
            {start > 2 && <span className="page-gap">…</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            type="button"
            className={`page-btn${p === page ? ' is-current' : ''}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="page-gap">…</span>}
            <button type="button" className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label={t('Página siguiente', 'Next page')}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;

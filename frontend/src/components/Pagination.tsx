import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end   = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    fontWeight: 600, fontSize: '.8rem',
    cursor: 'pointer', transition: 'all .15s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '.875rem 1rem',
      borderTop: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
        Página <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? .4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} style={btnBase}>1</button>
            {start > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 .25rem', fontSize: '.8rem' }}>…</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background: p === page ? '#4f46e5' : 'var(--surface)',
              color: p === page ? '#fff' : 'var(--text-secondary)',
              borderColor: p === page ? '#4f46e5' : 'var(--border)',
              boxShadow: p === page ? '0 2px 8px rgba(79,70,229,.3)' : 'none',
            }}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 .25rem', fontSize: '.8rem' }}>…</span>}
            <button onClick={() => onPageChange(totalPages)} style={btnBase}>{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? .4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

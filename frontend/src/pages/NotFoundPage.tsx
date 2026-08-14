import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => (
  <div className="centered-screen">
    <div style={{ maxWidth: 420, textAlign: 'center' }}>
      <div className="status-icon status-icon-muted">
        <MagnifyingGlassIcon style={{ width: 28, height: 28 }} />
      </div>
      <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 .625rem' }}>
        Esta página no existe
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
        Puede que el link esté mal escrito o que la sección se haya movido.
      </p>
      <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
        Volver al inicio
      </Link>
    </div>
  </div>
);

export default NotFoundPage;

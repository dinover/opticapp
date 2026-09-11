import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AUTH_COPY } from '../i18n/auth';
import { useLanguage } from '../contexts/LanguageContext';

const NotFoundPage: React.FC = () => {
  const { lang } = useLanguage();
  const t = AUTH_COPY[lang].notFound;

  return (
    <div className="centered-screen">
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div className="status-icon status-icon-muted">
          <MagnifyingGlassIcon style={{ width: 28, height: 28 }} />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 .625rem' }}>
          {t.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
          {t.desc}
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          {t.back}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

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
        <h1 className="status-title">{t.title}</h1>
        <p className="status-text">{t.desc}</p>
        <Link to="/" className="btn btn-cta">{t.back}</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

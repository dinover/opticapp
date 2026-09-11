import React from 'react';
import type { Lang } from '../utils/lang';

interface LangToggleProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
  label: string;
  style?: React.CSSProperties;
}

/** Selector ES/EN compacto de las páginas públicas (login, registro). */
const LangToggle: React.FC<LangToggleProps> = ({ lang, onChange, label, style }) => (
  <div className="lang-toggle" role="group" aria-label={label} style={style}>
    {(['es', 'en'] as const).map((l) => (
      <button key={l} type="button" className={lang === l ? 'is-on' : ''} aria-pressed={lang === l} onClick={() => onChange(l)}>
        {l.toUpperCase()}
      </button>
    ))}
  </div>
);

export default LangToggle;

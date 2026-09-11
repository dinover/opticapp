import React from 'react';

interface PageHeaderProps {
  /** Etiqueta chica arriba del título (sección o fecha). */
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  /** Botones a la derecha; la acción principal va con `btn btn-cta`. */
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

export default PageHeader;

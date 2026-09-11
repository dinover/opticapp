import React, { useEffect, useRef } from 'react';

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface StatCardProps {
  label: string;
  /** Valor final ya formateado (es lo que se ve sin animación). */
  value: string;
  sub?: React.ReactNode;
  subTone?: 'accent' | 'success';
  icon: IconType;
  tone?: 'violet' | 'success' | 'warning' | 'indigo';
  /** Si se pasa, el número sube desde 0 al entrar (anime.js, cargado bajo demanda). */
  countTo?: number;
  format?: (n: number) => string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, subTone = 'accent', icon: Icon, tone = 'violet', countTo, format }) => {
  const valueRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = valueRef.current;
    if (countTo === undefined || !format || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let anim: { revert: () => unknown } | undefined;
    // anime.js se importa acá adentro para que no entre al bundle principal.
    import('animejs').then(({ animate }) => {
      if (cancelled) return;
      const state = { v: 0 };
      anim = animate(state, {
        v: countTo,
        duration: 1400,
        ease: 'out(4)',
        onUpdate: () => { el.textContent = format(state.v); },
        onComplete: () => { el.textContent = format(countTo); },
      });
    });
    return () => {
      cancelled = true;
      anim?.revert();
      el.textContent = value;
    };
    // Solo al montar: los indicadores se cargan una vez por visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countTo]);

  return (
    <div className="stat-card">
      <div className="kpi">
        <p className="kpi-label">{label}</p>
        <div className={`kpi-icon${tone === 'violet' ? '' : ` tone-${tone}`}`} aria-hidden="true"><Icon /></div>
        <p className="kpi-value" ref={valueRef}>{value}</p>
        {sub && <p className={`kpi-sub${subTone === 'success' ? ' is-success' : ''}`}>{sub}</p>}
      </div>
    </div>
  );
};

export default StatCard;

import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  TruckIcon,
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  CubeIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  LockClosedIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import type { Copy, Lang } from './i18n';

/*
 * Pantallas de muestra de la landing. No son capturas: son réplicas en HTML de
 * la UI real (mismas clases de index.css: .stat-card, .tbl, .optic-grid,
 * .nav-link…), así se ven nítidas a cualquier tamaño, siguen el tema
 * claro/oscuro, se traducen y se pueden animar.
 *
 * Atributos que usa LandingPage para animar:
 *   data-row   → entra con un fade escalonado
 *   data-count → contador (data-kind="money" para importes)
 *   data-bar / data-hbar → barras que crecen
 *   data-rx    → valor de la ficha óptica que se "enfoca"
 */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
export interface ScreenProps {
  t: Copy;
  lang: Lang;
}

const locale = (lang: Lang) => (lang === 'es' ? 'es-UY' : 'en-US');
export const fmtInt = (n: number, lang: Lang) => Math.round(n).toLocaleString(locale(lang));
export const fmtMoney = (n: number, lang: Lang) => (lang === 'es' ? '$ ' : '$') + fmtInt(n, lang);
const fmtDate = (d: Date, lang: Lang, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString(locale(lang), opts);
const shortDate = (d: Date, lang: Lang) => fmtDate(d, lang, { day: 'numeric', month: 'short' });
const numDate = (d: Date, lang: Lang) => fmtDate(d, lang, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Tinte translúcido del color: funciona en tema claro y oscuro (igual que en el dashboard). */
const tint = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ── Datos de muestra ─────────────────────────────────────────
export const CLIENTS = [
  { name: 'María García', addr: 'Av. Italia 2345', doc: '4.512.338-7', email: 'maria.garcia@mail.com', phone: '099 123 456', color: '#6366f1', since: new Date(2026, 8, 11) },
  { name: 'Juan Pérez', addr: 'Bulevar Artigas 1180', doc: '3.908.114-2', email: 'jperez@mail.com', phone: '098 456 210', color: '#f59e0b', since: new Date(2026, 8, 10) },
  { name: 'Lucía Fernández', addr: '18 de Julio 1620', doc: '5.021.774-9', email: 'lucia.f@mail.com', phone: '094 778 301', color: '#10b981', since: new Date(2026, 8, 8) },
  { name: 'Diego Rodríguez', addr: 'Rambla Wilson 845', doc: '2.845.009-1', email: 'diegorod@mail.com', phone: '091 332 845', color: '#ec4899', since: new Date(2026, 8, 5) },
  { name: 'Sofía Martínez', addr: 'Av. Brasil 2890', doc: '4.776.520-3', email: 'sofi.martinez@mail.com', phone: '099 640 118', color: '#0ea5e9', since: new Date(2026, 8, 2) },
  { name: 'Mariana López', addr: 'Canelones 1034', doc: '4.130.662-5', email: 'mlopez@mail.com', phone: '092 115 907', color: '#8b5cf6', since: new Date(2026, 7, 29) },
];

/** Mismo orden que `mock.products` en i18n (ya ordenado por facturación). */
const PRODUCTS = [
  { units: 305, price: 3000 },
  { units: 142, price: 6400 },
  { units: 118, price: 5900 },
  { units: 87, price: 4500 },
  { units: 64, price: 3200 },
];

const RECENT_SALES = [
  { client: 0, total: 12400, date: new Date(2026, 8, 11) },
  { client: 1, total: 8900, date: new Date(2026, 8, 10) },
  { client: 2, total: 15750, date: new Date(2026, 8, 10) },
  { client: 3, total: 6300, date: new Date(2026, 8, 9) },
  { client: 4, total: 21200, date: new Date(2026, 8, 9) },
];

/** La venta de María: la misma que aparece en la tarjeta flotante y el comprobante. */
export const SALE_LINES = [
  { product: 1, qty: 1, price: 6400 },
  { product: 0, qty: 2, price: 3000 },
];
export const SALE_TOTAL = SALE_LINES.reduce((sum, l) => sum + l.qty * l.price, 0);

export const RX = {
  od: ['-1.25', '-0.50', '180', '+2.00'],
  oi: ['-1.00', '-0.75', '170', '+2.00'],
};

const MONTHS = [612400, 688100, 655800, 734500, 702900, 786500];

// ── Íconos propios ───────────────────────────────────────────
export const GlassesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="13" r="8" />
    <circle cx="36" cy="13" r="8" />
    <path d="M20 12c2.5-2 5.5-2 8 0" />
    <path d="M4 12 1.5 7M44 12l2.5-5" />
  </svg>
);

export const XlsxIcon: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M8 3h12l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#16a34a" />
    <path d="M20 3l7 7h-5a2 2 0 0 1-2-2z" fill="#86efac" />
    <path d="M12 15l6 8M18 15l-6 8" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

// ── Marco escalado ───────────────────────────────────────────
/**
 * Renderiza el contenido a su ancho "real" y lo escala para que entre en el
 * contenedor, como si fuera una captura. La altura se reserva ya escalada.
 */
export const ScaledFrame: React.FC<{ width: number; children: React.ReactNode }> = ({ width, children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; height?: number }>({ scale: 1 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const scale = Math.min(1, outer.clientWidth / width);
      setBox({ scale, height: inner.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outerRef} className="mk-scaled" style={{ maxWidth: width, height: box.height }}>
      <div ref={innerRef} style={{ width, transform: `scale(${box.scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
};

// ── Shell de la app ──────────────────────────────────────────
type NavKey = Exclude<keyof Copy['mock']['nav'], 'settings'>;

const NAV: { key: NavKey; icon: IconType }[] = [
  { key: 'dashboard', icon: HomeIcon },
  { key: 'clients', icon: UserGroupIcon },
  { key: 'products', icon: ShoppingBagIcon },
  { key: 'sales', icon: ChartBarIcon },
  { key: 'suppliers', icon: TruckIcon },
  { key: 'import', icon: ArrowUpTrayIcon },
  { key: 'reports', icon: DocumentChartBarIcon },
  { key: 'team', icon: UserGroupIcon },
];

export const AppFrame: React.FC<{ t: Copy; active: NavKey; trial?: boolean; children: React.ReactNode }> = ({
  t,
  active,
  trial,
  children,
}) => {
  const m = t.mock;
  return (
    <div className="mk-window">
      <div className="mk-chrome">
        <div className="mk-dots"><i /><i /><i /></div>
        <div className="mk-url"><LockClosedIcon />opticapp</div>
      </div>
      {trial && <div className="mk-trial">⏳ {m.trial}</div>}
      <div className="mk-topbar">
        <div className="mk-logo"><img src="/logo.png" alt="" />OpticApp</div>
        <div className="mk-user">
          <div className="mk-pill"><span className="mk-avatar">L</span>{m.user}</div>
          <div className="btn btn-ghost mk-logout"><ArrowRightOnRectangleIcon />{m.logout}</div>
        </div>
      </div>
      <div className="mk-body">
        <div className="mk-sidebar">
          <div className="mk-nav">
            {NAV.map(({ key, icon: Icon }) => (
              <div key={key} className={`nav-link${key === active ? ' active' : ''}`}>
                <Icon />
                <span>{m.nav[key]}</span>
              </div>
            ))}
          </div>
          <div className="mk-sidebar-foot">
            <div className="nav-link"><Cog6ToothIcon /><span>{m.nav.settings}</span></div>
          </div>
        </div>
        <div className="mk-main">{children}</div>
      </div>
    </div>
  );
};

const PageHeader: React.FC<{ title: string; sub: string; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <div className="page-header">
    <div>
      <div className="page-title">{title}</div>
      <p className="page-subtitle">{sub}</p>
    </div>
    {action}
  </div>
);

const Count: React.FC<{ value: number; money?: boolean; lang: Lang }> = ({ value, money, lang }) => (
  <span data-count={value} data-kind={money ? 'money' : 'int'}>
    {money ? fmtMoney(value, lang) : fmtInt(value, lang)}
  </span>
);

// ── Dashboard ────────────────────────────────────────────────
export const DashboardScreen: React.FC<ScreenProps> = ({ t, lang }) => {
  const d = t.mock.dash;
  const stats: { label: string; value: number; money?: boolean; sub: string; icon: IconType; color: string }[] = [
    { label: d.totalSales, value: 1284, sub: `96 ${d.thisMonth}`, icon: ShoppingBagIcon, color: 'var(--brand-light)' },
    { label: d.totalRevenue, value: 4862300, money: true, sub: `${fmtMoney(386500, lang)} ${d.thisMonth}`, icon: CurrencyDollarIcon, color: 'var(--success)' },
    { label: d.clients, value: 862, sub: d.activeClients, icon: UserGroupIcon, color: 'var(--brand)' },
    { label: d.products, value: 347, sub: d.inCatalog, icon: CubeIcon, color: 'var(--warning)' },
  ];

  return (
    <>
      <PageHeader title={d.title} sub={d.sub} />
      <div className="mk-stats">
        {stats.map(({ label, value, money, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card" data-row>
            <div className="mk-stat">
              <div style={{ minWidth: 0 }}>
                <p className="mk-stat-label">{label}</p>
                <p className="mk-stat-value"><Count value={value} money={money} lang={lang} /></p>
                <p className="mk-stat-sub">
                  <ArrowTrendingUpIcon style={{ width: 12, height: 12, color }} />
                  {sub}
                </p>
              </div>
              <div className="mk-stat-icon" style={{ background: tint(color), color }}><Icon /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mk-2col">
        <div className="card" data-row>
          <div className="mk-card-head"><ChartBarIcon style={{ color: 'var(--brand-light)' }} />{d.topProducts}</div>
          <div className="mk-list">
            {PRODUCTS.map((p, i) => (
              <div key={i} className="mk-list-row" data-row>
                <span className="mk-rank">{i + 1}</span>
                <div className="mk-grow">
                  <p className="mk-strong">{t.mock.products[i]}</p>
                  <p className="mk-muted">{fmtInt(p.units, lang)} {d.units}</p>
                </div>
                <span className="mk-amount">{fmtMoney(p.units * p.price, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" data-row>
          <div className="mk-card-head"><CalendarDaysIcon style={{ color: 'var(--success)' }} />{d.recentSales}</div>
          <div className="mk-list">
            {RECENT_SALES.map((s, i) => {
              const c = CLIENTS[s.client];
              return (
                <div key={i} className="mk-list-row" data-row>
                  <span className="mk-av" style={{ background: tint('var(--success)', 18), color: 'var(--success)' }}>{c.name[0]}</span>
                  <div className="mk-grow">
                    <p className="mk-strong">{c.name}</p>
                    <p className="mk-muted">{shortDate(s.date, lang)}</p>
                  </div>
                  <span className="mk-amount is-pos">{fmtMoney(s.total, lang)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Clientes ─────────────────────────────────────────────────
export const ClientsScreen: React.FC<ScreenProps> = ({ t, lang }) => {
  const c = t.mock.clients;
  return (
    <>
      <PageHeader
        title={c.title}
        sub={c.sub}
        action={<div className="btn btn-primary"><PlusIcon className="mk-i16" />{c.add}</div>}
      />
      <div className="mk-search"><MagnifyingGlassIcon /><span>{c.search}</span></div>
      <div className="card" style={{ overflow: 'hidden' }} data-row>
        <table className="tbl">
          <thead>
            <tr>
              {c.cols.map((col, i) => (
                <th key={col} style={i === c.cols.length - 1 ? { textAlign: 'right' } : undefined}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((cl) => (
              <tr key={cl.name} data-row>
                <td>
                  <div className="mk-client">
                    <span className="mk-av" style={{ background: tint(cl.color, 16), color: cl.color }}>{cl.name[0]}</span>
                    <div>
                      <p className="mk-strong">{cl.name}</p>
                      <p className="mk-muted">{cl.addr}</p>
                    </div>
                  </div>
                </td>
                <td className="mk-mono">{cl.doc}</td>
                <td>
                  <div className="mk-contact">
                    <div>{cl.email}</div>
                    <div className="mk-muted">{cl.phone}</div>
                  </div>
                </td>
                <td className="mk-muted">{numDate(cl.since, lang)}</td>
                <td>
                  <div className="mk-actions">
                    <PencilIcon />
                    <TrashIcon style={{ color: 'var(--danger)' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Ficha óptica (se reusa en venta, tarjeta flotante y bento) ──
export const RxGrid: React.FC<{ t: Copy; compact?: boolean }> = ({ t, compact }) => {
  const s = t.mock.sale;
  return (
    <div className={`mk-rx${compact ? ' is-compact' : ''}`}>
      <div className="optic-grid mk-rx-row">
        <div />
        {s.rxCols.map((h) => <div key={h} className="col-header">{h}</div>)}
      </div>
      {(['od', 'oi'] as const).map((eye) => (
        <div key={eye} className="optic-grid mk-rx-row">
          <div className="eye-label"><span className={`mk-eye ${eye}`}>{eye === 'od' ? s.od : s.oi}</span></div>
          {RX[eye].map((v, i) => (
            <div key={i} className="mk-field mk-rx-cell"><span data-rx={v}>{v}</span></div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ── Nueva venta ──────────────────────────────────────────────
export const SaleScreen: React.FC<ScreenProps> = ({ t, lang }) => {
  const s = t.mock.sale;
  return (
    <div className="mk-sale">
      <div className="mk-sale-bg">
        <PageHeader title={s.page} sub={s.pageSub} />
        <div className="card mk-ghost">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mk-ghost-row"><span /><span /><span /></div>
          ))}
        </div>
      </div>
      <div className="mk-overlay" />
      <div className="modal-box mk-modal" data-row>
        <div className="modal-header">
          <div className="modal-title">{s.title}</div>
          <span className="modal-close"><XMarkIcon className="mk-i16" /></span>
        </div>
        <div className="modal-body">
          <div className="mk-grid2">
            <div>
              <div className="mk-flabel">{s.client}</div>
              <div className="mk-field">María García<ChevronDownIcon className="mk-chev" /></div>
            </div>
            <div>
              <div className="mk-flabel">{s.date}</div>
              <div className="mk-field">{numDate(new Date(2026, 8, 11), lang)}</div>
            </div>
          </div>
          <div>
            <div className="section-title">{s.rx}</div>
            <RxGrid t={t} />
          </div>
          <div>
            <div className="section-title">{s.products}</div>
            <div className="mk-lines">
              {SALE_LINES.map((l) => (
                <div key={l.product} className="mk-line" data-row>
                  <span className="mk-strong">{t.mock.products[l.product]}</span>
                  <span className="mk-muted">{l.qty} × {fmtMoney(l.price, lang)}</span>
                  <span className="mk-amount">{fmtMoney(l.qty * l.price, lang)}</span>
                </div>
              ))}
              <div className="mk-line mk-total">
                <span>{s.total}</span>
                <span />
                <span className="mk-amount"><Count value={SALE_TOTAL} money lang={lang} /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="btn btn-ghost">{s.cancel}</div>
          <div className="btn btn-primary">{s.save}</div>
        </div>
      </div>
    </div>
  );
};

// ── Reportes ─────────────────────────────────────────────────
export const ReportsScreen: React.FC<ScreenProps> = ({ t, lang }) => {
  const r = t.mock.reports;
  const max = Math.max(...MONTHS);
  const billed = MONTHS.reduce((a, b) => a + b, 0);
  const salesCount = 1096;
  const ranking = PRODUCTS.map((p, i) => ({ ...p, name: t.mock.products[i] })).sort((a, b) => b.units - a.units);
  const topUnits = ranking[0].units;

  return (
    <>
      <PageHeader title={r.title} sub={r.sub} />
      <div className="card mk-report" data-row>
        <div className="mk-report-head">
          <div>
            <div className="mk-report-title">{r.byPeriod}</div>
            <p className="mk-muted">{r.byPeriodDesc}</p>
          </div>
          <div className="mk-report-actions">
            <div className="btn btn-ghost"><EyeIcon className="mk-i16" />{r.view}</div>
            <div className="btn btn-primary"><ArrowDownTrayIcon className="mk-i16" />{r.download}</div>
          </div>
        </div>
        <div className="mk-tiles">
          <div className="mk-tile"><div className="mk-tile-label">{r.billed}</div><div className="mk-tile-value"><Count value={billed} money lang={lang} /></div></div>
          <div className="mk-tile"><div className="mk-tile-label">{r.sales}</div><div className="mk-tile-value"><Count value={salesCount} lang={lang} /></div></div>
          <div className="mk-tile"><div className="mk-tile-label">{r.avg}</div><div className="mk-tile-value"><Count value={billed / salesCount} money lang={lang} /></div></div>
        </div>
        <div className="mk-chart">
          {MONTHS.map((v, i) => (
            <div key={i} className="mk-col">
              <span className="mk-col-val">{fmtMoney(v / 1000, lang)}k</span>
              <div className="mk-bar-track">
                <div className={`mk-bar${i === MONTHS.length - 1 ? ' is-hot' : ''}`} data-bar style={{ height: `${(v / max) * 100}%` }} />
              </div>
              <span className="mk-col-label">{r.months[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card mk-report" data-row>
        <div className="mk-report-title" style={{ marginBottom: '.75rem' }}>{r.ranking}</div>
        {ranking.slice(0, 4).map((p) => (
          <div key={p.name} className="mk-hrow">
            <span className="mk-strong">{p.name}</span>
            <div className="mk-htrack"><div className="mk-hbar" data-hbar style={{ width: `${(p.units / topUnits) * 100}%` }} /></div>
            <span className="mk-amount">{fmtInt(p.units, lang)}</span>
          </div>
        ))}
      </div>
    </>
  );
};

// ── Visuales del bento de funciones ──────────────────────────
export const RxFeature: React.FC<ScreenProps> = ({ t }) => (
  <div className="fv-rx">
    <svg className="fv-glasses" viewBox="0 0 260 120" aria-hidden="true">
      <circle className="fv-draw" cx="68" cy="64" r="48" />
      <circle className="fv-draw" cx="192" cy="64" r="48" />
      <path className="fv-draw" d="M116 58c9-9 19-9 28 0" />
      <path className="fv-draw" d="M20 56 6 32M240 56l14-24" />
    </svg>
    <div className="fv-card">
      <div className="fv-card-head">
        <EyeIcon className="mk-i16" />
        {t.mock.sale.rxShort}
        <span className="fv-card-who">María García</span>
      </div>
      <RxGrid t={t} compact />
      <div className="fv-saved" data-pop><CheckIcon className="mk-i14" />{t.mock.feat.saved}</div>
    </div>
  </div>
);

const SEARCH_LIST = [0, 1, 5, 3, 4];

export const ClientsFeature: React.FC<ScreenProps> = ({ t }) => {
  const typed = t.mock.feat.typed;
  return (
    <div className="fv-card fv-search">
      <div className="fv-searchbox">
        <MagnifyingGlassIcon className="mk-i16" />
        <span data-typed={typed}>{typed}</span>
        <i className="fv-caret" />
      </div>
      {SEARCH_LIST.map((i) => {
        const c = CLIENTS[i];
        const hit = c.name.toLowerCase().startsWith(typed.toLowerCase());
        return (
          <div key={c.name} className={`fv-result ${hit ? 'is-hit' : 'is-dim'}`} data-item>
            <span className="mk-av sm" style={{ background: tint(c.color, 16), color: c.color }}>{c.name[0]}</span>
            <span className="mk-strong">{c.name}</span>
            <span className="fv-phone">{c.phone}</span>
          </div>
        );
      })}
    </div>
  );
};

const STOCK = [
  { product: 1, stock: 12, hue: '#7c3aed' },
  { product: 2, stock: 3, hue: '#d97706' },
  { product: 3, stock: 0, hue: '#2563eb' },
];

export const StockFeature: React.FC<ScreenProps> = ({ t, lang }) => (
  <div className="fv-stock">
    {STOCK.map(({ product, stock, hue }) => (
      <div key={product} className="fv-tile" data-item>
        <div className="fv-tile-img" style={{ background: `linear-gradient(135deg, ${tint(hue, 30)}, ${tint(hue, 10)})`, color: hue }}>
          <GlassesIcon />
        </div>
        <div className="fv-tile-info">
          <div className="fv-tile-name">{t.mock.products[product]}</div>
          <div className="fv-tile-price">{fmtMoney(PRODUCTS[product].price, lang)}</div>
        </div>
        <span className={`badge ${stock === 0 ? 'badge-red' : stock < 5 ? 'badge-yellow' : 'badge-green'}`}>
          {stock === 0 ? t.mock.feat.noStock : <>{t.mock.feat.stock}&nbsp;<span data-count={stock} data-kind="int">{stock}</span></>}
        </span>
      </div>
    ))}
  </div>
);

export const ReceiptFeature: React.FC<ScreenProps> = ({ t, lang }) => {
  const f = t.mock.feat;
  return (
    <div className="fv-printer">
      <div className="fv-slot" />
      <div className="fv-paper-clip">
        <div className="fv-paper" data-paper>
          <div className="fv-paper-head">
            <img src="/logo.png" alt="" />
            <div>
              <b>{t.mock.optics}</b>
              <span>{f.receipt} · {f.receiptNo}</span>
            </div>
          </div>
          <div className="fv-sep" />
          <div className="fv-pline"><span>María García</span><span>{shortDate(new Date(2026, 8, 11), lang)}</span></div>
          <div className="fv-sep" />
          {SALE_LINES.map((l) => (
            <div key={l.product} className="fv-pline">
              <span>{l.qty}× {t.mock.products[l.product]}</span>
              <span>{fmtMoney(l.qty * l.price, lang)}</span>
            </div>
          ))}
          <div className="fv-sep" />
          <div className="fv-pline fv-ptotal"><span>{t.mock.sale.total}</span><span>{fmtMoney(SALE_TOTAL, lang)}</span></div>
          <div className="fv-thanks">{f.thanks}</div>
          <div className="fv-barcode" />
        </div>
      </div>
    </div>
  );
};

const YEAR = [48, 57, 53, 66, 61, 72, 64, 78, 71, 84, 80, 96];

export const ReportsFeature: React.FC<ScreenProps> = ({ t }) => (
  <div className="fv-reports">
    <div className="fv-card fv-chart-card">
      <div className="fv-card-head"><DocumentChartBarIcon className="mk-i16" />{t.mock.reports.byPeriod}</div>
      <div className="fv-chart">
        {YEAR.map((v, i) => (
          <div key={i} className="fv-bar-wrap">
            <div className={`fv-bar${i === YEAR.length - 1 ? ' is-hot' : ''}`} data-bar style={{ height: `${v}%` }} />
          </div>
        ))}
      </div>
    </div>
    <div className="fv-chip" data-drop>
      <XlsxIcon size={30} />
      <div className="fv-chip-text">
        <b>{t.mock.feat.report}</b>
        <span>{t.mock.reports.download}</span>
      </div>
      <ArrowDownTrayIcon className="mk-i16 fv-chip-dl" />
    </div>
  </div>
);

export const ImportFeature: React.FC<ScreenProps> = ({ t }) => {
  const f = t.mock.feat;
  return (
    <div className="fv-drop">
      <div className="fv-file" data-file>
        <XlsxIcon size={36} />
        <div className="fv-file-meta">
          <b>{f.file}</b>
          <div className="fv-progress"><div className="fv-progress-bar" data-progress /></div>
        </div>
      </div>
      <div className="fv-status">
        <span className="fv-status-loading" data-loading>{f.importing}</span>
        <span className="fv-status-done" data-done>
          <CheckIcon className="mk-i14" />
          <span data-count={124} data-kind="int">124</span>
          {f.imported}
        </span>
      </div>
    </div>
  );
};

const TEAM = [
  { name: 'lucia', owner: true, color: '#7c3aed' },
  { name: 'martin.suarez', owner: false, color: '#0ea5e9' },
  { name: 'sofia.m', owner: false, color: '#10b981' },
];

export const TeamFeature: React.FC<ScreenProps> = ({ t }) => {
  const f = t.mock.feat;
  return (
    <div className="fv-card fv-team">
      {TEAM.map((m) => (
        <div key={m.name} className="fv-member" data-item>
          <span
            className="mk-av sm"
            style={m.owner
              ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff' }
              : { background: tint(m.color, 18), color: m.color }}
          >
            {m.name[0].toUpperCase()}
          </span>
          <span className="mk-strong">{m.name}</span>
          <span className={`fv-role ${m.owner ? 'is-owner' : 'is-employee'}`}>{m.owner ? f.owner : f.employee}</span>
        </div>
      ))}
      <div className="fv-add" data-pulse><UserPlusIcon className="mk-i16" />{f.addEmployee}</div>
    </div>
  );
};

export const CustomFeature: React.FC<ScreenProps> = ({ t, lang }) => {
  const f = t.mock.feat;
  return (
    <div className="fv-card fv-custom">
      <div className="fv-setting">
        <span>{f.theme}</span>
        <div className="fv-switch">
          <SunIcon className="fv-sw-ic" />
          <MoonIcon className="fv-sw-ic" />
          <span className="fv-knob" data-knob />
        </div>
      </div>
      <div className="fv-setting">
        <span>{f.currency}</span>
        <div className="fv-seg">
          <span className="fv-seg-bg" data-seg />
          <span className="fv-seg-opt">UYU</span>
          <span className="fv-seg-opt">USD</span>
        </div>
      </div>
      <div className="fv-mini-stat">
        <span className="mk-stat-label">{f.revenue}</span>
        <span className="fv-swap">
          <span data-swap-a>{fmtMoney(4862300, lang)}</span>
          <span data-swap-b>US$ {fmtInt(121558, lang)}</span>
        </span>
      </div>
    </div>
  );
};

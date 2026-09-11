import React from 'react';
import Modal from './Modal';
import { Sale, Client } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface SaleReceiptProps {
  open: boolean;
  onClose: () => void;
  /** Venta a imprimir, con sus productos ya cargados. */
  sale: Sale | null;
  /** Cliente completo (documento, teléfono…). La venta sólo trae el nombre. */
  client?: Client;
}

/**
 * Comprobante de venta imprimible.
 *
 * Se muestra dentro del Modal compartido y se imprime con `window.print()`.
 * El aspecto en pantalla sale de las clases .receipt-* de index.css; los
 * estilos de impresión van inline en este mismo componente (etiqueta <style>
 * con @media print) para que sólo existan mientras el comprobante está
 * abierto y no afecten a otras pantallas. La técnica es la clásica de ocultar
 * todo el documento y volver visible únicamente el árbol de #sale-receipt, que
 * evita tener que abrir una ventana nueva (bloqueada por los popup blockers)
 * o sumar dependencias.
 */

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    #sale-receipt, #sale-receipt * { visibility: visible; }
    #sale-receipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 0;
      background: #fff;
      color: #000;
    }
    #sale-receipt * { color: #000 !important; }
    /* El overlay del modal es fixed y con blur: en papel estorba. */
    .modal-overlay { position: static !important; padding: 0 !important; background: none !important; backdrop-filter: none !important; overflow: visible !important; }
    .modal-box { box-shadow: none !important; border: none !important; animation: none !important; }
    .no-print { display: none !important; }
    #sale-receipt .receipt-table th,
    #sale-receipt .receipt-table td,
    #sale-receipt .receipt-head,
    #sale-receipt .receipt-section { border-color: #94a3b8 !important; }
    #sale-receipt .receipt-muted,
    #sale-receipt .receipt-label { color: #334155 !important; }
    @page { margin: 16mm; }
  }
`;

/** Dioptrías en notación óptica: siempre con signo y dos decimales (+1.25 / -0.75). */
const fmtDiopter = (v?: number | null): string => {
  if (v === null || v === undefined || v === '' as any) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}`;
};

/** El eje es un ángulo entero en grados, no una dioptría. */
const fmtAxis = (v?: number | null): string => {
  if (v === null || v === undefined || v === '' as any) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  return `${Math.round(n)}°`;
};

const center: React.CSSProperties = { textAlign: 'center' };
const right: React.CSSProperties = { textAlign: 'right' };

const SaleReceipt: React.FC<SaleReceiptProps> = ({ open, onClose, sale, client }) => {
  const { fmt } = useCurrency();
  const { t, locale } = useLanguage();

  if (!sale) return null;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const products = sale.products || [];
  const hasPrescription = [
    sale.od_esf, sale.od_cil, sale.od_eje, sale.od_add,
    sale.oi_esf, sale.oi_cil, sale.oi_eje, sale.oi_add,
  ].some(v => v !== null && v !== undefined);

  const eyeRow = (
    label: string,
    esf?: number | null,
    cil?: number | null,
    eje?: number | null,
    add?: number | null,
  ) => (
    <tr>
      <th scope="row" style={{ textAlign: 'left', fontSize: '.8rem', letterSpacing: 0, color: 'var(--text-primary)' }}>{label}</th>
      <td className="mono" style={center}>{fmtDiopter(esf)}</td>
      <td className="mono" style={center}>{fmtDiopter(cil)}</td>
      <td className="mono" style={center}>{fmtAxis(eje)}</td>
      <td className="mono" style={center}>{fmtDiopter(add)}</td>
    </tr>
  );

  const dataLine = (label: string, value?: string | null) =>
    value ? (
      <div style={{ fontSize: '.8rem', marginBottom: '.15rem' }}>
        <span className="receipt-muted">{label}: </span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(`Comprobante de venta #${sale.id}`, `Sales receipt #${sale.id}`)}
      maxWidth={640}
      footer={
        <>
          <button type="button" className="btn btn-ghost no-print" onClick={onClose}>
            {t('Cerrar', 'Close')}
          </button>
          <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
            <PrinterIcon className="w-4 h-4" />
            {t('Imprimir', 'Print')}
          </button>
        </>
      }
    >
      <style>{PRINT_STYLES}</style>

      <div id="sale-receipt">
        {/* ── Encabezado: óptica + número y fecha ─────────────── */}
        <div className="receipt-head">
          <div>
            <div className="receipt-optics">{sale.optics_name || t('Óptica', 'Optical store')}</div>
            <div className="receipt-muted" style={{ fontSize: '.75rem', marginTop: '.15rem' }}>
              {t('Comprobante de venta', 'Sales receipt')}
            </div>
          </div>
          <div style={right}>
            <div className="mono" style={{ fontWeight: 600, fontSize: '.9rem' }}>
              {t('N.º', 'No.')} {sale.id}
            </div>
            <div className="receipt-muted" style={{ fontSize: '.75rem' }}>{fmtDate(sale.sale_date)}</div>
          </div>
        </div>

        {/* ── Cliente ─────────────────────────────────────────── */}
        <div className="receipt-section">
          <div className="receipt-label">{t('Cliente', 'Client')}</div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>
            {client?.name || sale.client_name || t('Cliente', 'Client')}
          </div>
          {dataLine(t('Documento', 'ID'), client?.document_id)}
          {dataLine(t('Teléfono', 'Phone'), client?.phone)}
          {dataLine('Email', client?.email)}
        </div>

        {/* ── Ficha óptica ────────────────────────────────────── */}
        {hasPrescription && (
          <div className="receipt-section">
            <div className="receipt-label">{t('Ficha óptica', 'Prescription')}</div>
            <table className="receipt-table">
              <caption className="no-print" style={{ display: 'none' }}>{t('Graduación por ojo', 'Prescription per eye')}</caption>
              <thead>
                <tr>
                  <th />
                  {[t('Esf', 'Sph'), t('Cil', 'Cyl'), t('Eje', 'Axis'), 'Add'].map(h => (
                    <th key={h} scope="col" className="receipt-muted" style={center}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eyeRow('OD', sale.od_esf, sale.od_cil, sale.od_eje, sale.od_add)}
                {eyeRow(t('OI', 'OS'), sale.oi_esf, sale.oi_cil, sale.oi_eje, sale.oi_add)}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Detalle de productos ────────────────────────────── */}
        <div className="receipt-section">
          <div className="receipt-label">{t('Detalle', 'Details')}</div>
          <table className="receipt-table">
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left' }}>{t('Producto', 'Product')}</th>
                <th scope="col" style={center}>{t('Cant.', 'Qty')}</th>
                <th scope="col" style={right}>{t('P. unit.', 'Unit price')}</th>
                <th scope="col" style={right}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map((item, i) => {
                const qty = Number(item.quantity) || 0;
                const unit = Number(item.unit_price) || 0;
                return (
                  <tr key={item.id ?? i}>
                    <td style={{ fontWeight: 600 }}>
                      {item.product_name || item.product?.name || t(`Producto #${item.product_id}`, `Product #${item.product_id}`)}
                    </td>
                    <td className="mono" style={center}>{qty}</td>
                    <td className="mono" style={right}>{fmt(unit)}</td>
                    <td className="mono" style={{ ...right, fontWeight: 600 }}>{fmt(qty * unit)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="receipt-muted">{t('Sin productos registrados', 'No products recorded')}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="receipt-total">
            <span className="receipt-label" style={{ margin: 0 }}>Total</span>
            <span className="receipt-total-value">{fmt(Number(sale.total_price) || 0)}</span>
          </div>
        </div>

        {/* ── Notas ───────────────────────────────────────────── */}
        {sale.notes && (
          <div className="receipt-section">
            <div className="receipt-label">{t('Notas', 'Notes')}</div>
            <div style={{ fontSize: '.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sale.notes}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SaleReceipt;

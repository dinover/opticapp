import React from 'react';
import Modal from './Modal';
import { Sale, Client } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
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
 * Los estilos de impresión van inline en este mismo componente (etiqueta
 * <style> con @media print) para no depender de index.css: sólo existen
 * mientras el comprobante está abierto, así que no pueden afectar a otras
 * pantallas. La técnica es la clásica de ocultar todo el documento y volver
 * visible únicamente el árbol de #sale-receipt, que evita tener que abrir una
 * ventana nueva (bloqueada por los popup blockers) o sumar dependencias.
 */

const PRINT_STYLES = `
  #sale-receipt { color: #0f172a; }

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
    /* El overlay del modal es fixed y con blur: en papel estorba. */
    .modal-overlay { position: static !important; padding: 0 !important; background: none !important; backdrop-filter: none !important; overflow: visible !important; }
    .modal-box { box-shadow: none !important; border: none !important; animation: none !important; }
    .no-print { display: none !important; }
    #sale-receipt .receipt-table th,
    #sale-receipt .receipt-table td { border-color: #94a3b8 !important; color: #000 !important; }
    #sale-receipt .receipt-muted { color: #334155 !important; }
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

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const cellStyle: React.CSSProperties = {
  padding: '.4rem .5rem',
  borderBottom: '1px solid var(--border)',
  fontSize: '.8rem',
};

const SaleReceipt: React.FC<SaleReceiptProps> = ({ open, onClose, sale, client }) => {
  const { fmt } = useCurrency();

  if (!sale) return null;

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
      <th scope="row" style={{ ...cellStyle, textAlign: 'left', fontWeight: 700 }}>{label}</th>
      <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{fmtDiopter(esf)}</td>
      <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{fmtDiopter(cil)}</td>
      <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{fmtAxis(eje)}</td>
      <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{fmtDiopter(add)}</td>
    </tr>
  );

  const dataLine = (label: string, value?: string | null) =>
    value ? (
      <div style={{ fontSize: '.8rem', marginBottom: '.15rem' }}>
        <span className="receipt-muted" style={{ color: 'var(--text-muted)' }}>{label}: </span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Comprobante de venta #${sale.id}`}
      maxWidth={640}
      footer={
        <>
          <button type="button" className="btn btn-ghost no-print" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
            <PrinterIcon className="w-4 h-4" />
            Imprimir
          </button>
        </>
      }
    >
      <style>{PRINT_STYLES}</style>

      <div id="sale-receipt">
        {/* ── Encabezado: óptica + número y fecha ─────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: '1rem', paddingBottom: '.75rem', borderBottom: '2px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {sale.optics_name || 'Óptica'}
            </div>
            <div className="receipt-muted" style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
              Comprobante de venta
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontFamily: 'DM Mono, monospace', fontSize: '.9rem' }}>
              N.º {sale.id}
            </div>
            <div className="receipt-muted" style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
              {fmtDate(sale.sale_date)}
            </div>
          </div>
        </div>

        {/* ── Cliente ─────────────────────────────────────────── */}
        <div style={{ padding: '.85rem 0', borderBottom: '1px solid var(--border)' }}>
          <div className="receipt-muted" style={{
            fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.35rem',
          }}>
            Cliente
          </div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>
            {client?.name || sale.client_name || 'Cliente'}
          </div>
          {dataLine('Documento', client?.document_id)}
          {dataLine('Teléfono', client?.phone)}
          {dataLine('Email', client?.email)}
        </div>

        {/* ── Ficha óptica ────────────────────────────────────── */}
        {hasPrescription && (
          <div style={{ padding: '.85rem 0', borderBottom: '1px solid var(--border)' }}>
            <div className="receipt-muted" style={{
              fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em',
              textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.35rem',
            }}>
              Ficha óptica
            </div>
            <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption className="no-print" style={{ display: 'none' }}>Graduación por ojo</caption>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, textAlign: 'left' }} />
                  {['Esf', 'Cil', 'Eje', 'Add'].map(h => (
                    <th key={h} scope="col" className="receipt-muted" style={{
                      ...cellStyle, textAlign: 'center', fontSize: '.65rem', fontWeight: 700,
                      letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eyeRow('OD', sale.od_esf, sale.od_cil, sale.od_eje, sale.od_add)}
                {eyeRow('OI', sale.oi_esf, sale.oi_cil, sale.oi_eje, sale.oi_add)}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Detalle de productos ────────────────────────────── */}
        <div style={{ padding: '.85rem 0' }}>
          <div className="receipt-muted" style={{
            fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.35rem',
          }}>
            Detalle
          </div>
          <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={{ ...cellStyle, textAlign: 'left', fontSize: '.7rem' }}>Producto</th>
                <th scope="col" style={{ ...cellStyle, textAlign: 'center', fontSize: '.7rem' }}>Cant.</th>
                <th scope="col" style={{ ...cellStyle, textAlign: 'right', fontSize: '.7rem' }}>P. unit.</th>
                <th scope="col" style={{ ...cellStyle, textAlign: 'right', fontSize: '.7rem' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map((item, i) => {
                const qty = Number(item.quantity) || 0;
                const unit = Number(item.unit_price) || 0;
                return (
                  <tr key={item.id ?? i}>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>
                      {item.product_name || item.product?.name || `Producto #${item.product_id}`}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{qty}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{fmt(unit)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
                      {fmt(qty * unit)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="receipt-muted" style={{ ...cellStyle, color: 'var(--text-muted)' }}>
                    Sin productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline',
            gap: '1rem', paddingTop: '.75rem',
          }}>
            <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'DM Mono, monospace' }}>
              {fmt(Number(sale.total_price) || 0)}
            </span>
          </div>
        </div>

        {/* ── Notas ───────────────────────────────────────────── */}
        {sale.notes && (
          <div style={{ paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
            <div className="receipt-muted" style={{
              fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em',
              textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.25rem',
            }}>
              Notas
            </div>
            <div style={{ fontSize: '.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sale.notes}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SaleReceipt;

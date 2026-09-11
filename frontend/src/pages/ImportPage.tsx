import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { suppliersService } from '../services/suppliers';
import { Supplier } from '../types';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translateApiMessage } from '../i18n/apiMessages';
import {
  ArrowUpTrayIcon,
  DocumentCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type UploadState = 'idle' | 'dragging' | 'selected' | 'uploading' | 'success' | 'error';

interface ImportResult {
  message: string;
  created: number;
  /** Productos que ya existían (mismo nombre y proveedor) y se actualizaron
      en vez de duplicarse. */
  updated: number;
  skipped: number;
  sinPrecio: number;
  errors?: string[];
}

const codeStyle: React.CSSProperties = {
  background: 'var(--surface-3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'DM Mono, monospace', fontSize: '.8rem',
};

const ImportPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>('none');
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { t, lang } = useLanguage();

  useEffect(() => {
    suppliersService.getAll().then(setSuppliers).catch(() => {});
  }, []);

  /** El resumen del backend viene en español; en inglés se arma con los contadores. */
  const summary = (r: ImportResult) => {
    if (lang === 'es') return r.message;
    const parts = [`${r.created} frame${r.created !== 1 ? 's' : ''} created`];
    if (r.updated > 0) parts.push(`${r.updated} updated`);
    if (r.skipped > 0) parts.push(`${r.skipped} empty row${r.skipped !== 1 ? 's' : ''} skipped`);
    if (r.sinPrecio > 0) parts.push(`${r.sinPrecio} without price`);
    return `Import complete: ${parts.join(', ')}.`;
  };

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg(t('Solo se aceptan archivos Excel (.xlsx o .xls)', 'Only Excel files (.xlsx or .xls) are accepted'));
      setUploadState('error');
      return;
    }
    setFile(f);
    setUploadState('selected');
    setErrorMsg('');
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }, [lang]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setUploadState('dragging'); };
  const onDragLeave = () => { if (uploadState === 'dragging') setUploadState(file ? 'selected' : 'idle'); };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('uploading');
    setResult(null);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('supplier_id', supplierId === 'none' ? '' : supplierId);

      const response = await api.post('/import/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      setUploadState('success');
      toast.success(summary(response.data) || t('Importación completada', 'Import complete'));
    } catch (err: any) {
      const message = err.response?.data?.error || t('Error al procesar el archivo', 'Could not process the file');
      setErrorMsg(message);
      setUploadState('error');
      toast.error(message);
    }
  };

  const isDragging = uploadState === 'dragging';
  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';
  const isError = uploadState === 'error' && !file;

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Importar armazones', 'Import frames')}</h1>
            <p className="page-subtitle">{t('Cargá un Excel con tu listado de armazones', 'Upload an Excel file with your frames list')}</p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <ExclamationTriangleIcon style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            {lang === 'en' ? (
              <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Expected Excel format:</strong>{' '}
                the file must have at least one column named <code style={codeStyle}>name</code> (or <code style={codeStyle}>articulo</code>) with the frame name.
                It can optionally include <code style={codeStyle}>quantity</code> and <code style={codeStyle}>price</code> columns.
                Frames without a price are set to $0 and you can edit them later from Products.
              </div>
            ) : (
              <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Formato esperado del Excel:</strong>{' '}
                el archivo debe tener al menos una columna llamada <code style={codeStyle}>articulo</code> con el nombre del armazón.
                Opcionalmente puede incluir columnas <code style={codeStyle}>cantidad</code> y <code style={codeStyle}>precio</code>.
                Los armazones sin precio quedarán en $0 y podrás editarlos luego desde Productos.
              </div>
            )}
          </div>
        </div>

        {/* Selector de proveedor */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '.5rem', fontSize: '.9rem', color: 'var(--text-primary)' }}>
            {t('Proveedor', 'Supplier')}
          </label>
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="none">{t('Sin proveedor (pertenece a la óptica)', 'No supplier (belongs to the store)')}</option>
            {suppliers.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.375rem' }}>
              {t(
                'No hay proveedores registrados — podés crear uno en la sección Proveedores.',
                'No suppliers registered yet — you can create one in the Suppliers section.',
              )}
            </p>
          )}
        </div>

        {/* Zona de subida */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !isUploading && !isSuccess && fileInputRef.current?.click()}
          role="button"
          tabIndex={isUploading || isSuccess ? -1 : 0}
          aria-label={t('Seleccionar archivo Excel para importar', 'Select an Excel file to import')}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && !isUploading && !isSuccess) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          style={{
            border: `2px dashed ${isDragging ? 'var(--brand)' : isSuccess ? 'var(--success)' : isError ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: isUploading || isSuccess ? 'default' : 'pointer',
            background: isDragging || isSuccess ? 'var(--surface-2)' : 'var(--surface)',
            transition: 'all .2s',
            position: 'relative',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
          />

          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{t('Procesando archivo…', 'Processing file…')}</p>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)' }}>{file?.name}</p>
            </div>
          ) : isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <CheckCircleIcon style={{ width: 44, height: 44, color: 'var(--success)' }} />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--success)', fontSize: '1.05rem' }}>{t('Importación exitosa', 'Import successful')}</p>
              <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>{file?.name}</p>
            </div>
          ) : file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <DocumentCheckIcon style={{ width: 44, height: 44, color: 'var(--brand)' }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '.95rem' }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB · {t('Hacé clic para cambiar el archivo', 'Click to change the file')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: isDragging ? 'var(--brand)' : 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .2s',
              }}>
                <ArrowUpTrayIcon style={{ width: 26, height: 26, color: isDragging ? '#fff' : 'var(--brand)' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 .25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isDragging ? t('Soltá el archivo aquí', 'Drop the file here') : t('Arrastrá tu Excel aquí', 'Drag your Excel file here')}
                </p>
                <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)' }}>
                  {t('o', 'or')} <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{t('hacé clic para seleccionar', 'click to select')}</span>
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                {t('Archivos .xlsx y .xls · Máximo 10 MB', '.xlsx and .xls files · Max 10 MB')}
              </p>
            </div>
          )}
        </div>

        {/* Error en el archivo */}
        {uploadState === 'error' && errorMsg && (
          <div role="alert" style={{ marginTop: '1rem', display: 'flex', gap: '.625rem', alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--danger)', borderRadius: 10, padding: '.875rem 1rem' }}>
            <XCircleIcon style={{ width: 18, height: 18, color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '.875rem', color: 'var(--text-primary)' }}>{errorMsg}</span>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ marginTop: '1.25rem', background: 'var(--surface)', border: '1px solid var(--success)', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <p style={{ margin: '0 0 .5rem', fontWeight: 700, color: 'var(--success)', fontSize: '.95rem' }}>{summary(result)}</p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>{t('Creados', 'Created')}: <strong style={{ color: 'var(--text-primary)' }}>{result.created}</strong></span>
              {result.updated > 0 && (
                <span>
                  {t('Actualizados', 'Updated')}: <strong style={{ color: 'var(--text-primary)' }}>{result.updated}</strong>
                  {' '}— {t('ya existían y se les actualizó stock y precio', 'they already existed; stock and price were updated')}
                </span>
              )}
              {result.skipped > 0 && <span>{t('Omitidos', 'Skipped')}: <strong style={{ color: 'var(--text-primary)' }}>{result.skipped}</strong></span>}
              {result.sinPrecio > 0 && (
                <span style={{ color: 'var(--warning)' }}>
                  {t('Sin precio', 'Without price')}: <strong>{result.sinPrecio}</strong> — {t('podés editarlos en Productos', 'you can edit them in Products')}
                </span>
              )}
            </div>
            {result.errors && result.errors.length > 0 && (
              <details style={{ marginTop: '.75rem' }}>
                <summary style={{ fontSize: '.8rem', color: 'var(--warning)', cursor: 'pointer' }}>
                  {t(
                    `${result.errors.length} fila${result.errors.length !== 1 ? 's' : ''} con error`,
                    `${result.errors.length} row${result.errors.length !== 1 ? 's' : ''} with errors`,
                  )}
                </summary>
                <ul style={{ margin: '.5rem 0 0', padding: '0 0 0 1.25rem', fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                  {result.errors.map((e, i) => <li key={i}>{translateApiMessage(e, lang)}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          {(file || isSuccess) && (
            <button className="btn btn-ghost" onClick={reset}>
              {isSuccess ? t('Nueva importación', 'New import') : t('Cancelar', 'Cancel')}
            </button>
          )}
          {file && !isSuccess && (
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={isUploading}
              style={{ minWidth: 140 }}
            >
              {isUploading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  {t('Subiendo…', 'Uploading…')}
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  {t('Importar armazones', 'Import frames')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ImportPage;

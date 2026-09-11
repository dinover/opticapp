import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
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
  InformationCircleIcon,
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
  const zoneState = isDragging ? 'is-dragging' : isSuccess ? 'is-success' : isError ? 'is-error' : 'is-idle';
  const interactive = !isUploading && !isSuccess;

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
        <PageHeader
          eyebrow={t('Catálogo', 'Catalog')}
          title={t('Importar armazones', 'Import frames')}
          subtitle={t('Cargá un Excel con tu listado de armazones', 'Upload an Excel file with your frames list')}
        />

        {/* Instrucciones */}
        <div className="alert" style={{ marginBottom: '1.25rem', background: 'var(--tint)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <InformationCircleIcon style={{ color: 'var(--accent-text)' }} />
          {lang === 'en' ? (
            <div style={{ lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Expected Excel format:</strong>{' '}
              the file must have at least one column named <code className="chip-code">name</code> (or <code className="chip-code">articulo</code>) with the frame name.
              It can optionally include <code className="chip-code">quantity</code> and <code className="chip-code">price</code> columns.
              Frames without a price are set to $0 and you can edit them later from Products.
            </div>
          ) : (
            <div style={{ lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Formato esperado del Excel:</strong>{' '}
              el archivo debe tener al menos una columna llamada <code className="chip-code">articulo</code> con el nombre del armazón.
              Opcionalmente puede incluir columnas <code className="chip-code">cantidad</code> y <code className="chip-code">precio</code>.
              Los armazones sin precio quedarán en $0 y podrás editarlos luego desde Productos.
            </div>
          )}
        </div>

        {/* Selector de proveedor */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div className="field">
            <label htmlFor="import-supplier">{t('Proveedor', 'Supplier')}</label>
            <select id="import-supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="none">{t('Sin proveedor (pertenece a la óptica)', 'No supplier (belongs to the store)')}</option>
              {suppliers.map(s => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="hint">
                {t(
                  'No hay proveedores registrados — podés crear uno en la sección Proveedores.',
                  'No suppliers registered yet — you can create one in the Suppliers section.',
                )}
              </p>
            )}
          </div>
        </div>

        {/* Zona de subida */}
        <div
          className={`dropzone ${zoneState}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => interactive && fileInputRef.current?.click()}
          role="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={t('Seleccionar archivo Excel para importar', 'Select an Excel file to import')}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && interactive) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
          />

          <div className="dropzone-inner">
            {isUploading ? (
              <>
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p className="dropzone-title">{t('Procesando archivo…', 'Processing file…')}</p>
                <p className="dropzone-sub">{file?.name}</p>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircleIcon style={{ width: 44, height: 44, color: 'var(--success)' }} />
                <p className="dropzone-title" style={{ color: 'var(--success-text)' }}>{t('Importación exitosa', 'Import successful')}</p>
                <p className="dropzone-sub">{file?.name}</p>
              </>
            ) : file ? (
              <>
                <DocumentCheckIcon style={{ width: 44, height: 44, color: 'var(--accent-text)' }} />
                <p className="dropzone-title">{file.name}</p>
                <p className="dropzone-sub">
                  {(file.size / 1024).toFixed(1)} KB · {t('Hacé clic para cambiar el archivo', 'Click to change the file')}
                </p>
              </>
            ) : (
              <>
                <div className="dropzone-icon"><ArrowUpTrayIcon /></div>
                <div>
                  <p className="dropzone-title">
                    {isDragging ? t('Soltá el archivo aquí', 'Drop the file here') : t('Arrastrá tu Excel aquí', 'Drag your Excel file here')}
                  </p>
                  <p className="dropzone-sub">
                    {t('o', 'or')} <span style={{ color: 'var(--brand-text)', fontWeight: 650 }}>{t('hacé clic para seleccionar', 'click to select')}</span>
                  </p>
                </div>
                <p className="dropzone-sub" style={{ fontSize: '.76rem' }}>
                  {t('Archivos .xlsx y .xls · Máximo 10 MB', '.xlsx and .xls files · Max 10 MB')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error en el archivo */}
        {uploadState === 'error' && errorMsg && (
          <div role="alert" className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <XCircleIcon />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="alert alert-success" style={{ marginTop: '1.25rem', flexDirection: 'column', gap: '.5rem' }}>
            <p className="alert-title" style={{ margin: 0 }}>{summary(result)}</p>
            <div className="result-stats">
              <span>{t('Creados', 'Created')}: <strong>{result.created}</strong></span>
              {result.updated > 0 && (
                <span>
                  {t('Actualizados', 'Updated')}: <strong>{result.updated}</strong>
                  {' '}— {t('ya existían y se les actualizó stock y precio', 'they already existed; stock and price were updated')}
                </span>
              )}
              {result.skipped > 0 && <span>{t('Omitidos', 'Skipped')}: <strong>{result.skipped}</strong></span>}
              {result.sinPrecio > 0 && (
                <span style={{ color: 'var(--warning-text)' }}>
                  {t('Sin precio', 'Without price')}: <strong>{result.sinPrecio}</strong> — {t('podés editarlos en Productos', 'you can edit them in Products')}
                </span>
              )}
            </div>
            {result.errors && result.errors.length > 0 && (
              <details>
                <summary style={{ fontSize: '.8rem', color: 'var(--warning-text)', cursor: 'pointer' }}>
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
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {(file || isSuccess) && (
            <button className="btn btn-ghost" onClick={reset}>
              {isSuccess ? t('Nueva importación', 'New import') : t('Cancelar', 'Cancel')}
            </button>
          )}
          {file && !isSuccess && (
            <button
              className="btn btn-cta"
              onClick={handleUpload}
              disabled={isUploading}
              style={{ minWidth: 160 }}
            >
              {isUploading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} />
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

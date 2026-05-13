import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { suppliersService } from '../services/suppliers';
import { Supplier } from '../types';
import api from '../services/api';
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

  useEffect(() => {
    suppliersService.getAll().then(setSuppliers).catch(() => {});
  }, []);

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg('Solo se aceptan archivos Excel (.xlsx o .xls)');
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
  }, []);

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
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error al procesar el archivo');
      setUploadState('error');
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
            <h1 className="page-title">Importar armazones</h1>
            <p className="page-subtitle">Cargá un Excel con tu listado de armazones</p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <ExclamationTriangleIcon style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Formato esperado del Excel:</strong>{' '}
              el archivo debe tener al menos una columna llamada <code style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'DM Mono, monospace', fontSize: '.8rem' }}>articulo</code> con el nombre del armazón.
              Opcionalmente puede incluir columnas <code style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'DM Mono, monospace', fontSize: '.8rem' }}>cantidad</code> y <code style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'DM Mono, monospace', fontSize: '.8rem' }}>precio</code>.
              Los armazones sin precio quedarán en $0 y podrás editarlos luego desde Productos.
            </div>
          </div>
        </div>

        {/* Selector de proveedor */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '.5rem', fontSize: '.9rem', color: 'var(--text-primary)' }}>
            Proveedor
          </label>
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="none">Sin proveedor (pertenece a la óptica)</option>
            {suppliers.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.375rem' }}>
              No hay proveedores registrados — podés crear uno en la sección Proveedores.
            </p>
          )}
        </div>

        {/* Zona de subida */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !isUploading && !isSuccess && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#4f46e5' : isSuccess ? '#10b981' : isError ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: isUploading || isSuccess ? 'default' : 'pointer',
            background: isDragging ? '#eef2ff' : isSuccess ? '#f0fdf4' : 'var(--surface)',
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
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Procesando archivo…</p>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)' }}>{file?.name}</p>
            </div>
          ) : isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <CheckCircleIcon style={{ width: 44, height: 44, color: '#10b981' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#065f46', fontSize: '1.05rem' }}>Importación exitosa</p>
              <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>{file?.name}</p>
            </div>
          ) : file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <DocumentCheckIcon style={{ width: 44, height: 44, color: '#4f46e5' }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '.95rem' }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB · Hacé clic para cambiar el archivo
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: isDragging ? '#4f46e5' : 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .2s',
              }}>
                <ArrowUpTrayIcon style={{ width: 26, height: 26, color: isDragging ? '#fff' : '#4f46e5' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 .25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá tu Excel aquí'}
                </p>
                <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)' }}>
                  o <span style={{ color: '#4f46e5', fontWeight: 600 }}>hacé clic para seleccionar</span>
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-muted)' }}>Archivos .xlsx y .xls · Máximo 10 MB</p>
            </div>
          )}
        </div>

        {/* Error en el archivo */}
        {uploadState === 'error' && errorMsg && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.625rem', alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.875rem 1rem' }}>
            <XCircleIcon style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '.875rem', color: '#991b1b' }}>{errorMsg}</span>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <p style={{ margin: '0 0 .5rem', fontWeight: 700, color: '#065f46', fontSize: '.95rem' }}>{result.message}</p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.85rem', color: '#047857', flexWrap: 'wrap' }}>
              <span>Creados: <strong>{result.created}</strong></span>
              {result.skipped > 0 && <span>Omitidos: <strong>{result.skipped}</strong></span>}
              {result.sinPrecio > 0 && (
                <span style={{ color: '#b45309' }}>
                  Sin precio: <strong>{result.sinPrecio}</strong> — podés editarlos en Productos
                </span>
              )}
            </div>
            {result.errors && result.errors.length > 0 && (
              <details style={{ marginTop: '.75rem' }}>
                <summary style={{ fontSize: '.8rem', color: '#b45309', cursor: 'pointer' }}>
                  {result.errors.length} fila{result.errors.length !== 1 ? 's' : ''} con error
                </summary>
                <ul style={{ margin: '.5rem 0 0', padding: '0 0 0 1.25rem', fontSize: '.78rem', color: '#92400e' }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          {(file || isSuccess) && (
            <button className="btn btn-ghost" onClick={reset}>
              {isSuccess ? 'Nueva importación' : 'Cancelar'}
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
                  Subiendo…
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Importar armazones
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

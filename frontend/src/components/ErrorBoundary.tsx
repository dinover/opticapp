import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, cualquier excepción durante el render deja la pantalla en blanco
 * sin ninguna pista de qué pasó, ni para el usuario ni para soporte.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en el render:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="centered-screen">
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div className="status-icon status-icon-danger">
            <ExclamationTriangleIcon style={{ width: 30, height: 30 }} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 .625rem' }}>
            Algo se rompió en esta pantalla
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            El error quedó registrado. Podés volver al inicio y seguir trabajando; si vuelve a pasar,
            contactá al administrador contándole qué estabas haciendo.
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => this.setState({ error: null })}>
              Reintentar
            </button>
            <button className="btn btn-primary" onClick={() => { window.location.href = '/'; }}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

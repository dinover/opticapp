import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getCurrentLang } from '../utils/lang';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, cualquier excepción durante el render deja la pantalla en blanco
 * sin ninguna pista de qué pasó, ni para el usuario ni para soporte.
 *
 * Es una clase (no puede usar hooks) y envuelve al LanguageProvider, así que
 * lee el idioma actual directo de utils/lang.
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

    const en = getCurrentLang() === 'en';

    return (
      <div className="centered-screen">
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div className="status-icon status-icon-danger">
            <ExclamationTriangleIcon style={{ width: 30, height: 30 }} />
          </div>
          <h1 className="status-title">
            {en ? 'Something broke on this screen' : 'Algo se rompió en esta pantalla'}
          </h1>
          <p className="status-text">
            {en
              ? 'The error was logged. You can go back home and keep working; if it happens again, contact the administrator and tell them what you were doing.'
              : 'El error quedó registrado. Podés volver al inicio y seguir trabajando; si vuelve a pasar, contactá al administrador contándole qué estabas haciendo.'}
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => this.setState({ error: null })}>
              {en ? 'Try again' : 'Reintentar'}
            </button>
            <button className="btn btn-cta" onClick={() => { window.location.href = '/'; }}>
              {en ? 'Back to home' : 'Volver al inicio'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

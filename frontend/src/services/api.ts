import axios from 'axios';
import { getCurrentLang } from '../utils/lang';
import { translateApiMessage } from '../i18n/apiMessages';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * El backend responde en español; con la interfaz en inglés se traducen
 * `error` y `message` acá, en un solo lugar, en vez de en cada pantalla.
 */
const localizeBody = (data: any) => {
  const lang = getCurrentLang();
  if (lang === 'es' || !data || typeof data !== 'object') return;
  if (typeof data.error === 'string') data.error = translateApiMessage(data.error, lang);
  if (typeof data.message === 'string') data.message = translateApiMessage(data.message, lang);
};

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para traducir mensajes y manejar errores de autenticación
api.interceptors.response.use(
  (response) => {
    localizeBody(response.data);
    return response;
  },
  (error) => {
    localizeBody(error.response?.data);
    if (error.response?.status === 401 || error.response?.status === 403) {
      const hadSession = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Solo redirigir si había una sesión activa (token expirado, etc.)
      // Si no había token, el error lo maneja el componente (ej: login con credenciales inválidas)
      if (hadSession) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

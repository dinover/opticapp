/**
 * Convierte una URL de Google Drive compartida a una URL de proxy del backend
 * Esto evita problemas de CORS al servir las imágenes a través del backend
 * @param url - URL de Google Drive (ej: https://drive.google.com/file/d/ID/view?usp=sharing)
 * @returns URL del proxy del backend o la URL original si no es de Google Drive
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return '';

  // Patrones para detectar URLs de Google Drive (diferentes formatos)
  const drivePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,  // Formato estándar
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,  // Formato alternativo
    /id=([a-zA-Z0-9_-]+)/,                           // Solo el parámetro id
  ];

  let fileId: string | null = null;

  // Intentar extraer el ID con cada patrón
  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  if (fileId) {
    // Usar el proxy del backend para evitar problemas de CORS
    // El backend se encargará de obtener la imagen de Google Drive y servirla
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    return `${API_URL}/images/drive?fileId=${fileId}&method=thumbnail&size=w1000`;
  }

  // Si no es de Google Drive, devolver la URL original
  return url;
}

/**
 * Extrae el ID del archivo de una URL de Google Drive
 * @param url - URL de Google Drive
 * @returns ID del archivo o null si no se encuentra
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;

  const drivePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(drivePattern);
  return match && match[1] ? match[1] : null;
}


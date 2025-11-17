import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * Proxy para imágenes de Google Drive
 * Resuelve problemas de CORS al servir las imágenes a través del backend
 * 
 * Uso: GET /api/images/drive?fileId=FILE_ID&method=thumbnail
 * 
 * Parámetros:
 * - fileId: ID del archivo de Google Drive (obligatorio)
 * - method: Método a usar ('thumbnail' o 'view') - default: 'thumbnail'
 * - size: Tamaño para thumbnail (solo si method=thumbnail) - default: 'w1000'
 */
router.get('/drive', async (req: Request, res: Response) => {
  try {
    const { fileId, method = 'thumbnail', size = 'w1000' } = req.query;

    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ error: 'fileId es requerido' });
    }

    // Construir la URL según el método
    let driveUrl: string;
    if (method === 'thumbnail') {
      driveUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
    } else if (method === 'view') {
      driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    } else {
      return res.status(400).json({ error: 'method debe ser "thumbnail" o "view"' });
    }

    // Headers CORS siempre
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Función auxiliar para hacer la petición con seguimiento de redirecciones
    const makeRequest = (url: string, isRetry = false, redirectCount = 0): void => {
      // Prevenir loops de redirección
      if (redirectCount > 5) {
        if (!isRetry && method === 'thumbnail') {
          const altUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
          makeRequest(altUrl, true, 0);
          return;
        }
        res.status(500).json({ error: 'Demasiadas redirecciones' });
        return;
      }

      https.get(url, (driveRes) => {
        // Manejar redirecciones (códigos 3xx)
        if (driveRes.statusCode && driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
          const redirectUrl = driveRes.headers.location;
          // Si es redirección, seguirla
          if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
            return makeRequest(redirectUrl, isRetry, redirectCount + 1);
          }
        }

        // Si la respuesta es exitosa, servir la imagen
        if (driveRes.statusCode && driveRes.statusCode >= 200 && driveRes.statusCode < 300) {
          // Copiar headers importantes
          if (driveRes.headers['content-type']) {
            res.setHeader('Content-Type', driveRes.headers['content-type']);
          }
          if (driveRes.headers['content-length']) {
            res.setHeader('Content-Length', driveRes.headers['content-length']);
          }
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          driveRes.pipe(res);
        } else if (!isRetry && method === 'thumbnail') {
          // Si falla con thumbnail, intentar con uc?export=view
          const altUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
          makeRequest(altUrl, true, 0);
          return;
        } else {
          res.status(driveRes.statusCode || 500).json({ error: 'Error al obtener la imagen de Google Drive' });
        }
      }).on('error', (err) => {
        if (!isRetry && method === 'thumbnail') {
          // Si hay error, intentar con método alternativo
          const altUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
          makeRequest(altUrl, true, 0);
          return;
        }
        console.error('Error al obtener imagen de Google Drive:', err);
        res.status(500).json({ error: 'Error al obtener la imagen de Google Drive' });
      });
    };

    // Iniciar la petición
    makeRequest(driveUrl);
  } catch (error: any) {
    console.error('Error en proxy de imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;


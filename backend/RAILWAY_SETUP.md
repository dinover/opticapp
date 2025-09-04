# Railway Deployment Setup

## Variables de Entorno Requeridas

Configura las siguientes variables de entorno en tu proyecto de Railway:

### Base de Datos
- `DATABASE_URL`: Automáticamente proporcionado por Railway PostgreSQL
- `NODE_ENV`: `production`

### JWT y Seguridad
- `JWT_SECRET`: Una clave secreta fuerte para JWT (ej: `your-super-secret-jwt-key-here`)
- `ADMIN_SECRET`: Clave secreta para admin (ej: `your-admin-secret-key`)

### Cloudinary (para imágenes)
- `CLOUDINARY_CLOUD_NAME`: Tu nombre de cloud de Cloudinary
- `CLOUDINARY_API_KEY`: Tu API key de Cloudinary
- `CLOUDINARY_API_SECRET`: Tu API secret de Cloudinary

### Configuración del Servidor
- `PORT`: Automáticamente configurado por Railway
- `FRONTEND_URL`: URL de tu frontend desplegado (ej: `https://tu-app.vercel.app`)

## Pasos de Configuración

1. **Crear proyecto PostgreSQL en Railway**
   - Ve a Railway Dashboard
   - Crea un nuevo proyecto PostgreSQL
   - Railway automáticamente proporcionará `DATABASE_URL`

2. **Configurar variables de entorno**
   - En tu proyecto de Railway, ve a la pestaña "Variables"
   - Agrega todas las variables listadas arriba

3. **Deploy**
   - Conecta tu repositorio de GitHub
   - Railway detectará automáticamente que es un proyecto Node.js
   - El build y deploy se ejecutarán automáticamente

## Troubleshooting

### Error ECONNRESET
Si ves este error, verifica:
- Que `DATABASE_URL` esté configurado correctamente
- Que el proyecto PostgreSQL esté activo en Railway
- Que las credenciales de la base de datos sean correctas

### Error de SSL
Railway requiere SSL en producción. La configuración ya está preparada para esto.

### Health Check
El servidor incluye endpoints de health check:
- `/health` - Para Railway
- `/api/health` - Para la aplicación

## Logs y Debugging

Para ver los logs en Railway:
1. Ve a tu proyecto en Railway Dashboard
2. Selecciona el servicio
3. Ve a la pestaña "Logs"

Los logs mostrarán:
- Intentos de conexión a la base de datos
- Errores de inicialización
- Estado del servidor

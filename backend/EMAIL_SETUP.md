# 📧 Configuración de Email - OpticApp

## 🚀 Configuración de SendGrid

### 1. Crear Cuenta en SendGrid

1. Ve a [SendGrid](https://sendgrid.com/)
2. Crea una cuenta gratuita (100 emails/día gratis)
3. Verifica tu email

### 2. Crear API Key

1. En el dashboard de SendGrid, ve a **Settings** → **API Keys**
2. Haz clic en **Create API Key**
3. Selecciona **Restricted Access**
4. Configura los permisos:
   - ✅ **Mail Send**: Full Access
   - ❌ Otros permisos (no necesarios)
5. Copia la API Key generada

### 3. Configurar Variables de Entorno

#### Para Desarrollo Local:
Crea un archivo `.env` en la carpeta `backend/` con:

```env
# Email Configuration
SENDGRID_API_KEY=SG.tu-api-key-aqui
FROM_EMAIL=noreply@tu-dominio.com
FROM_NAME=OpticApp
FRONTEND_URL=http://localhost:5173
```

#### Para Railway (Producción):
En Railway Dashboard → Variables:

```
SENDGRID_API_KEY=SG.tu-api-key-aqui
FROM_EMAIL=noreply@tu-dominio.com
FROM_NAME=OpticApp
FRONTEND_URL=https://tu-frontend.vercel.app
```

### 4. Verificar Dominio (Opcional pero Recomendado)

Para evitar que los emails vayan a spam:

1. En SendGrid → **Settings** → **Sender Authentication**
2. Haz clic en **Authenticate Your Domain**
3. Sigue las instrucciones para verificar tu dominio
4. Actualiza `FROM_EMAIL` con tu dominio verificado

## 📋 Funcionalidades de Email

### ✅ Implementadas:

1. **Reset de Contraseña**
   - Email automático cuando se solicita reset
   - Enlace seguro con expiración de 1 hora
   - Diseño profesional y responsive

2. **Email de Bienvenida**
   - Se envía cuando un admin aprueba un usuario
   - Información de la óptica y funcionalidades

### 🔧 Configuración de Desarrollo

Si no tienes SendGrid configurado en desarrollo:
- Los emails se mostrarán en la consola
- No se enviarán emails reales
- Perfecto para testing

### 📊 Monitoreo

SendGrid proporciona:
- Estadísticas de entrega
- Tasa de apertura
- Logs de errores
- Dashboard completo

## 🚨 Troubleshooting

### Error: "Invalid API Key"
- Verifica que la API Key esté correcta
- Asegúrate de que tenga permisos de "Mail Send"

### Emails van a Spam
- Verifica tu dominio en SendGrid
- Usa un dominio propio, no gmail/hotmail
- Configura SPF y DKIM records

### Error: "Forbidden"
- Verifica que la API Key tenga permisos de "Mail Send"
- Revisa que el FROM_EMAIL esté verificado

## 💡 Tips

1. **Gratis**: SendGrid permite 100 emails/día gratis
2. **Testing**: En desarrollo, los emails se logean en consola
3. **Producción**: Siempre usa un dominio verificado
4. **Seguridad**: Nunca commits la API Key al repositorio

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Railway
2. Verifica las variables de entorno
3. Consulta la documentación de SendGrid

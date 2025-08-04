# 🚀 Despliegue Completo - OpticApp

## 📋 Resumen del Despliegue

### **🏗️ Arquitectura**
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Base de Datos**: SQLite (Railway)
- **Imágenes**: Almacenamiento local (Railway)

### **🌐 URLs de Producción**
- **Frontend**: `https://tu-app.vercel.app`
- **Backend**: `https://tu-backend.railway.app`
- **API**: `https://tu-backend.railway.app/api`

---

## 🎯 Paso a Paso del Despliegue

### **Paso 1: Desplegar Backend (Railway)**

#### **1.1 Preparar Repositorio**
```bash
# Asegúrate de tener estos archivos
backend/
├── package.json          # ✅ Configurado
├── tsconfig.json         # ✅ Configurado
├── railway.json          # ✅ Configurado
├── nixpacks.toml        # ✅ Configurado
├── Procfile             # ✅ Configurado
└── build.sh             # ✅ Configurado
```

#### **1.2 Conectar a Railway**
1. **Crear cuenta**: https://railway.app
2. **Conectar repositorio**: GitHub/GitLab
3. **Seleccionar directorio**: `backend`
4. **Configurar variables de entorno**:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=tu-clave-super-secreta-de-64-caracteres
FRONTEND_URL=https://tu-frontend.vercel.app
```

#### **1.3 Verificar Despliegue**
```bash
# Test de conectividad
curl https://tu-backend.railway.app/api/health

# Test de API
curl -X POST https://tu-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@test.com",
    "password": "123456",
    "optic_name": "Test Optic",
    "optic_address": "Test Address",
    "optic_phone": "123456789",
    "optic_email": "optic@test.com"
  }'
```

### **Paso 2: Desplegar Frontend (Vercel)**

#### **2.1 Preparar Repositorio**
```bash
# Asegúrate de tener estos archivos
frontend/
├── package.json          # ✅ Configurado
├── vite.config.ts        # ✅ Configurado
├── vercel.json           # ✅ Configurado
├── env.example           # ✅ Configurado
└── build.sh              # ✅ Configurado
```

#### **2.2 Conectar a Vercel**
1. **Crear cuenta**: https://vercel.com
2. **Conectar repositorio**: GitHub/GitLab
3. **Configurar proyecto**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### **2.3 Configurar Variables de Entorno**
En Vercel Dashboard → Settings → Environment Variables:

```env
# Obligatorias
VITE_API_URL=https://tu-backend.railway.app/api

# Opcionales
VITE_APP_NAME=OpticApp
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

#### **2.4 Verificar Despliegue**
```bash
# Test de conectividad
curl https://tu-app.vercel.app

# Test de API connection
curl https://tu-app.vercel.app/api/health
```

---

## 🔧 Configuración de Dominio Personalizado

### **Frontend (Vercel)**
1. **Settings** → **Domains**
2. **Add Domain**: `app.tu-dominio.com`
3. **Configurar DNS**:
   ```
   A Record: @ → 76.76.19.76
   CNAME: www → tu-dominio.vercel.app
   ```

### **Backend (Railway)**
1. **Settings** → **Domains**
2. **Add Domain**: `api.tu-dominio.com`
3. **Configurar DNS**:
   ```
   A Record: @ → IP_DE_RAILWAY
   ```

---

## 📊 Monitoreo y Analytics

### **Vercel Analytics**
- **Page Views**: Métricas de uso
- **Performance**: Core Web Vitals
- **Errors**: JavaScript errors
- **Functions**: API calls

### **Railway Metrics**
- **CPU Usage**: < 80%
- **Memory Usage**: < 512MB
- **Response Time**: < 200ms
- **Uptime**: > 99.9%

---

## 🛠️ Troubleshooting

### **Backend Issues**

#### **Build Fails**
```bash
# Verificar logs
railway logs

# Rebuild manual
railway up
```

#### **Runtime Errors**
```bash
# Ver logs en tiempo real
railway logs --follow

# Restart service
railway service restart
```

### **Frontend Issues**

#### **Build Fails**
```bash
# Verificar logs
vercel logs

# Build local
npm run build

# Deploy manual
vercel --prod
```

#### **API Connection**
```bash
# Verificar variables de entorno
vercel env ls

# Agregar variable
vercel env add VITE_API_URL
```

---

## 🎯 Testing Post-Deploy

### **Funcionalidades Críticas**
- ✅ **Registro de óptica**
- ✅ **Login/logout**
- ✅ **CRUD de productos**
- ✅ **CRUD de clientes**
- ✅ **Crear ventas**
- ✅ **Subir imágenes**
- ✅ **Responsive design**

### **Performance Tests**
- ✅ **Lighthouse Score**: > 90
- ✅ **Core Web Vitals**: Optimizados
- ✅ **API Response**: < 200ms
- ✅ **Bundle Size**: < 500KB

---

## 🔐 Seguridad

### **Variables de Entorno**
```env
# Backend (Railway)
JWT_SECRET=clave-super-secreta-de-64-caracteres
NODE_ENV=production

# Frontend (Vercel)
VITE_API_URL=https://tu-backend.railway.app/api
```

### **Headers de Seguridad**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 📈 Optimizaciones

### **Frontend (Vercel)**
- ✅ **Code Splitting**: Manual chunks
- ✅ **Compresión**: Gzip + Brotli
- ✅ **Minificación**: Terser
- ✅ **CDN**: Automático

### **Backend (Railway)**
- ✅ **CORS**: Configurado
- ✅ **Helmet**: Headers de seguridad
- ✅ **Rate Limiting**: Implementado
- ✅ **Logging**: Estructurado

---

## 🚀 Checklist Final

### **✅ Antes del Despliegue**
- [ ] Repositorio conectado a Railway y Vercel
- [ ] Variables de entorno configuradas
- [ ] Archivos de configuración creados
- [ ] Build local exitoso
- [ ] Tests locales pasando

### **✅ Después del Despliegue**
- [ ] Backend funcionando (Railway)
- [ ] Frontend funcionando (Vercel)
- [ ] API conectada correctamente
- [ ] Variables de entorno correctas
- [ ] Dominios configurados

### **✅ Testing Completo**
- [ ] Registro de óptica
- [ ] Login/logout
- [ ] CRUD de productos
- [ ] CRUD de clientes
- [ ] Crear ventas
- [ ] Subir imágenes
- [ ] Responsive design
- [ ] Performance optimizada

---

## 📞 Soporte

### **Documentación**
- **Railway**: `RAILWAY_DEPLOYMENT.md`
- **Vercel**: `VERCEL_DEPLOYMENT.md`
- **Producción**: `PRODUCTION_SETUP.md`

### **Contacto**
- **Email**: [tu-email@ejemplo.com]
- **WhatsApp**: [tu-numero]
- **Horarios**: Lunes a Viernes 9-18hs

---

**¡OpticApp está listo para producción! 🕶️✨**

**Frontend**: https://tu-app.vercel.app
**Backend**: https://tu-backend.railway.app
**API**: https://tu-backend.railway.app/api 
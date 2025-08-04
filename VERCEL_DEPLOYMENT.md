# 🚀 Despliegue en Vercel - OpticApp Frontend

## 📋 Configuración para Vercel

### **1. Preparar el Repositorio**

Asegúrate de que tu repositorio tenga estos archivos:

```
frontend/
├── package.json          # ✅ Configurado
├── vite.config.ts        # ✅ Configurado
├── vercel.json           # ✅ Configurado
├── env.example           # ✅ Configurado
└── dist/                 # ✅ Generado por build
```

### **2. Conectar a Vercel**

1. **Crear cuenta**: https://vercel.com
2. **Conectar repositorio**: GitHub/GitLab
3. **Configurar proyecto**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### **3. Variables de Entorno**

En Vercel Dashboard → Settings → Environment Variables:

```env
# Obligatorias
VITE_API_URL=https://tu-backend.railway.app/api

# Opcionales
VITE_APP_NAME=OpticApp
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

### **4. Configuración de Build**

Vercel detectará automáticamente:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### **5. Configuración de Dominio**

#### **Dominio Personalizado**
1. **Settings** → **Domains**
2. **Add Domain**: `tu-dominio.com`
3. **Configurar DNS**:
   ```
   A Record: @ → 76.76.19.76
   CNAME: www → tu-dominio.vercel.app
   ```

#### **Subdominio**
- **Automático**: `tu-proyecto.vercel.app`
- **Personalizado**: `app.tu-dominio.com`

### **6. Optimizaciones de Build**

#### **Code Splitting**
```javascript
// vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      router: ['react-router-dom'],
      ui: ['lucide-react', 'clsx', 'tailwind-merge'],
      forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
      utils: ['axios', 'date-fns', 'react-hot-toast'],
      charts: ['recharts']
    }
  }
}
```

#### **Compresión**
- **Gzip**: Automático
- **Brotli**: Automático
- **Minificación**: Terser

### **7. Verificar Despliegue**

1. **Build Status**: Verde en Vercel
2. **Preview URL**: Funcionando
3. **Production URL**: Funcionando
4. **API Connection**: Conectado al backend

### **8. Testing Post-Deploy**

```bash
# Test de conectividad
curl https://tu-app.vercel.app

# Test de API connection
curl https://tu-app.vercel.app/api/health
```

### **9. Monitoreo**

Vercel Dashboard → Analytics:
- **Page Views**: Métricas de uso
- **Performance**: Core Web Vitals
- **Errors**: JavaScript errors
- **Functions**: API calls

### **10. Troubleshooting**

#### **Build Fails**
```bash
# Verificar logs
vercel logs

# Build local
npm run build

# Deploy manual
vercel --prod
```

#### **Runtime Errors**
```bash
# Ver logs en tiempo real
vercel logs --follow

# Function logs
vercel logs --function=api
```

#### **Environment Variables**
```bash
# Listar variables
vercel env ls

# Agregar variable
vercel env add VITE_API_URL
```

---

## 🎯 Checklist de Despliegue

### **✅ Antes del Despliegue**
- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] `vite.config.ts` optimizado
- [ ] `vercel.json` configurado
- [ ] Backend desplegado (Railway)

### **✅ Después del Despliegue**
- [ ] Build exitoso (verde)
- [ ] Preview URL funcionando
- [ ] Production URL funcionando
- [ ] API conectada al backend
- [ ] Variables de entorno correctas

### **✅ Testing**
- [ ] Registro de óptica
- [ ] Login/logout
- [ ] CRUD de productos
- [ ] CRUD de clientes
- [ ] Crear ventas
- [ ] Subir imágenes
- [ ] Responsive design

---

## 🚀 Configuración Avanzada

### **Custom Headers**
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

### **Redirects**
```json
{
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

### **Rewrites**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 📊 Performance Optimization

### **Lighthouse Score Targets**
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

### **Core Web Vitals**
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### **Bundle Analysis**
```bash
# Analizar bundle
npm run build
npx vite-bundle-analyzer dist
```

---

**¡OpticApp está listo para Vercel! 🚀✨** 
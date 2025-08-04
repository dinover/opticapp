# 🚀 Despliegue en Railway - OpticApp

## 📋 Configuración para Railway

### **1. Preparar el Repositorio**

Asegúrate de que tu repositorio tenga estos archivos:

```
backend/
├── package.json          # ✅ Configurado
├── tsconfig.json         # ✅ Configurado (strict: false)
├── railway.json          # ✅ Configurado
├── nixpacks.toml        # ✅ Configurado
├── Procfile             # ✅ Configurado
└── build.sh             # ✅ Configurado
```

### **2. Conectar a Railway**

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

### **3. Variables de Entorno Críticas**

En Railway Dashboard → Variables:

```env
# Obligatorias
PORT=3001
NODE_ENV=production
JWT_SECRET=clave-super-secreta-de-64-caracteres

# Opcionales (para desarrollo)
FRONTEND_URL=https://tu-frontend.vercel.app
```

### **4. Build Configuration**

Railway usará automáticamente:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

### **5. Solución de Errores Comunes**

#### **Error: TypeScript Build Fails**
- ✅ **Solución**: `tsconfig.json` configurado con `strict: false`
- ✅ **Solución**: Tipos explícitos agregados en callbacks

#### **Error: Port Already in Use**
- ✅ **Solución**: Variable `PORT` configurada
- ✅ **Solución**: Railway asigna puerto automáticamente

#### **Error: Database Not Found**
- ✅ **Solución**: SQLite se crea automáticamente
- ✅ **Solución**: Migraciones ejecutadas en startup

### **6. Verificar Despliegue**

1. **Build Status**: Verde en Railway
2. **Logs**: Sin errores críticos
3. **Health Check**: `https://tu-app.railway.app/api/health`
4. **API Test**: `https://tu-app.railway.app/api/auth/login`

### **7. Configurar Frontend**

En tu frontend (Vercel), actualizar:

```env
VITE_API_URL=https://tu-backend.railway.app/api
```

### **8. Testing Post-Deploy**

```bash
# Test de conectividad
curl https://tu-app.railway.app/api/health

# Test de API
curl -X POST https://tu-app.railway.app/api/auth/register \
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

### **9. Monitoreo**

Railway Dashboard → Metrics:
- **CPU Usage**: < 80%
- **Memory Usage**: < 512MB
- **Response Time**: < 200ms

### **10. Troubleshooting**

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

#### **Database Issues**
```bash
# Verificar archivo SQLite
railway shell
ls -la database.sqlite
```

---

## 🎯 Checklist de Despliegue

### **✅ Antes del Despliegue**
- [ ] Repositorio conectado a Railway
- [ ] Variables de entorno configuradas
- [ ] `tsconfig.json` con `strict: false`
- [ ] Tipos explícitos en callbacks
- [ ] `package.json` con scripts correctos

### **✅ Después del Despliegue**
- [ ] Build exitoso (verde)
- [ ] Health check responde
- [ ] API endpoints funcionando
- [ ] Frontend conectado
- [ ] Variables de entorno correctas

### **✅ Testing**
- [ ] Registro de óptica
- [ ] Login/logout
- [ ] CRUD de productos
- [ ] CRUD de clientes
- [ ] Crear ventas
- [ ] Subir imágenes

---

**¡OpticApp está listo para Railway! 🚀✨** 
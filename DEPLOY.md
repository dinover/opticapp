# Guía de Despliegue en Render

Esta guía te ayudará a desplegar OpticApp en Render paso a paso.

## 📋 Requisitos Previos

1. Una cuenta en [Render.com](https://render.com) (gratis)
2. Tu código en un repositorio de GitHub, GitLab o Bitbucket
3. Acceso al repositorio desde Render

## 🚀 Opción 1: Despliegue Automático con render.yaml (Recomendado)

### Paso 1: Subir código a GitHub

1. Si tu código no está en GitHub, créalo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/opticapp.git
   git push -u origin main
   ```

### Paso 2: Conectar con Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el archivo `render.yaml`
5. Review la configuración y click en **"Apply"**

Render creará automáticamente:
- ✅ Servicio Web (Backend)
- ✅ Base de datos PostgreSQL

### Paso 3: Configurar Variables de Entorno

Después de crear los servicios, ve a cada uno y configura:

**Backend (Web Service):**
- `NODE_ENV`: `production` (ya configurado)
- `PORT`: `10000` (ya configurado)
- `JWT_SECRET`: Generado automáticamente, o puedes crear uno personalizado (mínimo 32 caracteres)
- `DATABASE_URL`: Se conecta automáticamente a la base de datos

**IMPORTANTE**: Una vez desplegado, Render te dará una URL como:
- Backend: `https://opticapp-backend.onrender.com`

### Paso 4: Desplegar Frontend

1. En Render Dashboard, click en **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio
3. Configura:
   - **Name**: `opticapp-frontend`
   - **Branch**: `main` (o tu rama principal)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://opticapp-backend.onrender.com/api`

4. Click en **"Create Static Site"**

### Paso 5: Inicializar la Base de Datos

La base de datos se inicializa automáticamente durante el build gracias al comando en `render.yaml`.

Si necesitas reinicializarla manualmente:

1. Ve al dashboard del backend en Render
2. Abre la pestaña **"Shell"** (o "Shell Access")
3. Ejecuta:
   ```bash
   npm run db:init
   ```

Esto creará todas las tablas necesarias y el usuario admin inicial.

**Nota sobre PostgreSQL:**
- El código está configurado para usar **PostgreSQL** en producción
- PostgreSQL proporciona persistencia de datos permanente
- La URL de la base de datos ya está configurada en `render.yaml`
- La base de datos se inicializa automáticamente durante el build

### Paso 6: Acceder a la Aplicación

1. **Frontend**: Render te dará una URL como `https://opticapp-frontend.onrender.com`
2. **Backend API**: `https://opticapp-backend.onrender.com`

**Credenciales por defecto del admin:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña del admin después del primer login.

---

## 📊 Configuración de PostgreSQL

✅ **El código ya está configurado para PostgreSQL.** 

La URL de la base de datos está configurada en `render.yaml` con la siguiente conexión:
```
postgresql://opticapp_database_user:fSnX6LmogG58c0ecbqaIYumc17FkTFZx@dpg-d4dpejfdiees73bp2sl0-a/opticapp_database
```

### Si necesitas cambiar la URL de la base de datos:

1. Obtén la nueva URL de conexión de Render (Internal Database URL)
2. Actualiza `render.yaml` con la nueva URL:
   ```yaml
   envVars:
     - key: DATABASE_URL
       value: postgresql://usuario:contraseña@host/database
   ```

Para más detalles sobre la migración, consulta **[MIGRATION_NOTES.md](MIGRATION_NOTES.md)**.

---

## 🔧 Opción 2: Despliegue Manual

### Backend (Web Service)

1. **Crear Base de Datos PostgreSQL:**
   - Click en **"New +"** → **"PostgreSQL"**
   - Name: `opticapp-database`
   - Plan: Free
   - Click en **"Create Database"**
   - Copia la **Internal Database URL**

2. **Crear Web Service:**
   - Click en **"New +"** → **"Web Service"**
   - Conecta tu repositorio
   - Configura:
     - **Name**: `opticapp-backend`
     - **Environment**: `Node`
     - **Region**: `Oregon` (o el más cercano)
     - **Branch**: `main`
     - **Root Directory**: (dejar vacío - raíz del proyecto)
     - **Build Command**: `npm install && npm run build && npm run db:init`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Variables de Entorno del Backend:**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=tu_secreto_seguro_mínimo_32_caracteres_aqui
   ```
   
   **Nota**: `DATABASE_URL` ya está configurada en `render.yaml`. Si necesitas cambiarla, actualiza el valor con tu Internal Database URL de Render.

4. Click en **"Create Web Service"**

5. **Verificar Inicialización de Base de Datos:**
   - La base de datos PostgreSQL se inicializa automáticamente durante el build
   - Si necesitas reinicializarla, ve a la pestaña **"Shell"** y ejecuta: `npm run db:init`

### Frontend (Static Site)

1. Click en **"New +"** → **"Static Site"**
2. Conecta tu repositorio
3. Configura:
   - **Name**: `opticapp-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Variables de Entorno:**
   ```
   VITE_API_URL=https://opticapp-backend.onrender.com/api
   ```
   (Reemplaza con la URL real de tu backend)
5. Click en **"Create Static Site"**

---

## 🔄 Actualizar la Aplicación

Render detecta automáticamente los cambios en tu repositorio:

1. Haz tus cambios localmente
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push
   ```
3. Render detectará los cambios y redeplegará automáticamente

**Nota**: El primer deploy puede tardar 5-10 minutos. Los siguientes suelen ser más rápidos.

---

## 🐛 Troubleshooting

### Backend no inicia

1. Revisa los logs en Render Dashboard
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que `DATABASE_URL` apunte a la base de datos PostgreSQL

### Frontend no se conecta al backend

1. Verifica que `VITE_API_URL` en el frontend apunte a la URL correcta del backend
2. Asegúrate de incluir `/api` al final: `https://tu-backend.onrender.com/api`
3. Verifica que el backend esté corriendo y accesible

### Errores de CORS

El backend ya tiene CORS configurado para aceptar peticiones desde cualquier origen. Si hay problemas:
- Verifica que `cors()` esté habilitado en `src/index.ts`

### Base de datos vacía

1. Ve a la Shell del backend
2. Ejecuta: `npm run db:init`
3. Verifica que se hayan creado las tablas

### Plan Free - Inactividad

⚠️ **IMPORTANTE**: En el plan gratuito, el servicio web se "duerme" después de 15 minutos de inactividad. La primera petición puede tardar 30-60 segundos en "despertar" el servicio.

Para evitar esto:
- Considera hacer una petición periódica (p. ej., cada 14 minutos) usando un servicio como UptimeRobot
- O actualiza a un plan de pago

---

## 📝 Notas Importantes

1. **SQLite vs PostgreSQL**: El código actual usa SQLite localmente. En Render, la base de datos será PostgreSQL. El código debería funcionar igual ya que SQLite y PostgreSQL comparten sintaxis SQL similar para las operaciones básicas.

2. **Archivos Estáticos**: Si necesitas almacenar archivos permanentemente (como imágenes subidas), considera usar un servicio de almacenamiento como AWS S3, Cloudinary o similar, ya que el sistema de archivos en Render es efímero.

3. **Logs**: Revisa los logs regularmente en Render Dashboard para detectar problemas.

4. **Seguridad**: 
   - Cambia el `JWT_SECRET` por uno seguro y aleatorio
   - Cambia la contraseña del admin después del primer login
   - Considera usar HTTPS (ya incluido en Render)

---

## 🏢 Antes de tener clientes reales pagando

El plan gratuito de Render está pensado para pruebas, no para un servicio con clientes reales:

- **El servicio se duerme por inactividad** — el primer request después de un rato tarda ~30-50s en responder. Con clientes pagando, eso se nota.
- **La base de datos gratuita se borra a los 90 días.** No es negociable, Render la elimina.
- **Sin backups automáticos** en el plan free. Si algo sale mal, no hay forma de recuperar los datos.

Antes de cobrarle a alguien:

- [ ] Subir el Web Service y la base de datos a un plan pago en Render (o migrar a otro proveedor con backups)
- [ ] Confirmar que los backups automáticos de Postgres están habilitados y probar una restauración al menos una vez
- [ ] Revisar que las variables de entorno sensibles (`JWT_SECRET`, `ADMIN_PASSWORD`, `RESEND_API_KEY`) están marcadas como secretas en el dashboard de Render, no visibles en logs de build
- [ ] Configurar `EMAIL_FROM` con un dominio propio verificado en Resend (con `onboarding@resend.dev` los emails no le llegan a los clientes, ver `src/utils/emailService.ts`)
- [ ] Configurar `APP_URL` con el dominio real de producción (se usa para los links de los emails y para restringir CORS)
- [ ] Tener un plan de qué hacer si el servicio se cae fuera de horario laboral (alertas, quién responde)

## ✅ Checklist de Despliegue

- [ ] Código subido a GitHub/GitLab/Bitbucket
- [ ] Backend desplegado en Render (Web Service) — sirve también el frontend compilado, no hace falta un Static Site separado
- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas: `JWT_SECRET` y `ADMIN_PASSWORD` (ver `render.yaml` — ambas se autogeneran en el blueprint; sin ellas el servidor no arranca)
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, `APP_URL` configuradas para que los emails de licencia funcionen
- [ ] Prueba de acceso al frontend
- [ ] Login funcional con el usuario admin (username `admin`, contraseña = el valor de `ADMIN_PASSWORD` que configuraste)

¡Listo! Tu aplicación debería estar funcionando en producción. 🎉


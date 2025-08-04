# 🚀 Configuración para Producción - OpticApp

## 📋 Opciones de Despliegue

### **Opción 1: Vercel + Railway (Recomendado)**

#### **Frontend (Vercel)**
1. **Crear cuenta en Vercel**: https://vercel.com
2. **Conectar repositorio**: GitHub/GitLab
3. **Configurar build**:
   ```bash
   Build Command: cd frontend && npm install && npm run build
   Output Directory: frontend/dist
   Install Command: npm install
   ```
4. **Variables de entorno**:
   ```
   VITE_API_URL=https://tu-backend.railway.app
   ```

#### **Backend (Railway)**
1. **Crear cuenta en Railway**: https://railway.app
2. **Conectar repositorio**: GitHub/GitLab
3. **Configurar servicio**:
   ```bash
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
4. **Variables de entorno**:
   ```
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=tu-clave-super-secreta
   FRONTEND_URL=https://tu-frontend.vercel.app
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```

### **Opción 2: Netlify + Heroku**

#### **Frontend (Netlify)**
1. **Crear cuenta en Netlify**: https://netlify.com
2. **Conectar repositorio**
3. **Configurar build**:
   ```bash
   Build command: cd frontend && npm install && npm run build
   Publish directory: frontend/dist
   ```

#### **Backend (Heroku)**
1. **Crear cuenta en Heroku**: https://heroku.com
2. **Conectar repositorio**
3. **Configurar Procfile**:
   ```
   web: cd backend && npm start
   ```
4. **Variables de entorno**: Configurar en dashboard

### **Opción 3: VPS Propio**

#### **Requisitos del Servidor**
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **RAM**: 2GB mínimo, 4GB recomendado
- **CPU**: 2 cores mínimo
- **Storage**: 20GB mínimo
- **Node.js**: 18.x+
- **PostgreSQL**: 13+

#### **Instalación en VPS**
```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 4. Instalar Nginx
sudo apt install nginx -y

# 5. Clonar repositorio
git clone [URL_REPO]
cd opticapp

# 6. Configurar backend
cd backend
npm install
npm run build

# 7. Configurar frontend
cd ../frontend
npm install
npm run build

# 8. Configurar PM2
sudo npm install -g pm2
pm2 start backend/dist/index.js --name "opticapp-backend"
pm2 startup
pm2 save
```

## 🗄️ Migración de Base de Datos

### **SQLite → PostgreSQL**

#### **1. Instalar PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql postgresql-server
```

#### **2. Crear base de datos**
```bash
sudo -u postgres psql
CREATE DATABASE opticapp;
CREATE USER opticapp_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE opticapp TO opticapp_user;
\q
```

#### **3. Migrar datos**
```bash
# Instalar herramientas de migración
npm install -g sqlite3-to-postgres

# Migrar datos
sqlite3-to-postgres backend/database.sqlite postgresql://user:pass@localhost/opticapp
```

#### **4. Actualizar configuración**
```env
# backend/.env
DATABASE_URL=postgresql://opticapp_user:tu_password@localhost/opticapp
```

## 🔧 Configuración de Dominio

### **Configurar DNS**
```
A Record: @ → IP_DEL_SERVIDOR
CNAME: www → tu-dominio.com
```

### **Configurar SSL (Let's Encrypt)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### **Configurar Nginx**
```nginx
# /etc/nginx/sites-available/opticapp
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name tu-dominio.com www.tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/opticapp/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Seguridad en Producción

### **Variables de Entorno Críticas**
```env
# Backend
NODE_ENV=production
JWT_SECRET=clave-super-secreta-de-64-caracteres
FRONTEND_URL=https://tu-dominio.com
DATABASE_URL=postgresql://user:pass@host:port/db

# Frontend
VITE_API_URL=https://tu-dominio.com/api
```

### **Configuraciones de Seguridad**
```javascript
// backend/src/index.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configurado para producción
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

## 📊 Monitoreo y Logs

### **Configurar Logs**
```bash
# PM2 logs
pm2 logs opticapp-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Monitoreo de Recursos**
```bash
# Instalar herramientas
sudo apt install htop iotop

# Monitorear
htop
iotop
df -h
free -h
```

## 🔄 Backup y Restore

### **Backup Automático**
```bash
#!/bin/bash
# /usr/local/bin/backup-opticapp.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/opticapp"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump opticapp > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/opticapp

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### **Cron Job para Backup**
```bash
# Agregar a crontab
0 2 * * * /usr/local/bin/backup-opticapp.sh
```

## 🚀 Checklist de Producción

### **✅ Antes del Despliegue**
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada a PostgreSQL
- [ ] SSL configurado
- [ ] Dominio configurado
- [ ] Backup configurado
- [ ] Monitoreo configurado

### **✅ Después del Despliegue**
- [ ] Aplicación accesible
- [ ] API funcionando
- [ ] Base de datos conectada
- [ ] Imágenes subiéndose
- [ ] Logs funcionando
- [ ] Backup ejecutándose

### **✅ Pruebas de Producción**
- [ ] Registro de nueva óptica
- [ ] Login/logout
- [ ] CRUD de productos
- [ ] CRUD de clientes
- [ ] Crear ventas
- [ ] Ver detalles
- [ ] Responsive design

---

**¡OpticApp está listo para producción! 🕶️✨** 
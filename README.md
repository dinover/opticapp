# OpticApp - Sistema de Gestión de Óptica

Sistema completo para gestión de una óptica con sistema de autenticación y solicitudes de usuario.

## Estructura del Proyecto

```
opticapp/
├── backend/          # Backend Node.js + Express + TypeScript
├── frontend/         # Frontend React + TypeScript + Vite
└── README.md
```

## Características

### Backend
- Sistema de solicitud de usuarios
- Panel de administración para aprobar/rechazar solicitudes
- Autenticación con JWT
- Base de datos SQLite (configurable para PostgreSQL en producción)
- API REST completa

### Frontend
- Pantalla de login
- Pantalla de solicitud de usuario
- Panel de administración para gestionar solicitudes
- Dashboard principal
- Diseño moderno con Tailwind CSS
- Navegación protegida con rutas privadas

## Instalación

### Backend

```bash
cd backend
npm install
npm run db:init
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

**Usuario admin por defecto:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña del admin en producción

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Desarrollo

### Backend

```bash
# Inicializar base de datos
npm run db:init

# Modo desarrollo (con watch)
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar producción
npm start
```

### Frontend

```bash
# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview
```

## API Endpoints

### Autenticación

- `POST /api/auth/request-user` - Solicitar creación de usuario
- `GET /api/auth/request-status/:username` - Verificar estado de solicitud
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener perfil (requiere autenticación)

### Administración (requiere rol admin)

- `GET /api/auth/admin/requests` - Listar todas las solicitudes
- `POST /api/auth/admin/requests/:id/approve` - Aprobar solicitud
- `POST /api/auth/admin/requests/:id/reject` - Rechazar solicitud

## Flujo de Usuario

1. **Solicitar cuenta**: Los nuevos usuarios pueden solicitar una cuenta completando el formulario
2. **Aprobación**: Un administrador revisa y aprueba/rechaza la solicitud
3. **Login**: Una vez aprobado, el usuario puede iniciar sesión con sus credenciales
4. **Dashboard**: Acceso a las funcionalidades del sistema según su rol

## Despliegue en Render

Para una guía completa y detallada paso a paso, consulta **[DEPLOY.md](DEPLOY.md)**.

### Resumen Rápido

1. **Sube tu código a GitHub** (si aún no lo has hecho)
2. **Conecta tu repositorio a Render**
3. **Usa el archivo `render.yaml`** incluido para despliegue automático, o sigue la guía manual en DEPLOY.md
4. **Inicializa la base de datos** usando la Shell de Render: `npm run db:init`

### Variables de Entorno Requeridas

**Backend:**
- `NODE_ENV=production`
- `PORT=10000` (o el puerto que Render asigne)
- `JWT_SECRET`: Secreto seguro (mínimo 32 caracteres)
- `DATABASE_URL`: URL de PostgreSQL (proporcionada por Render)

**Frontend:**
- `VITE_API_URL`: URL completa del backend (ej: `https://tu-backend.onrender.com/api`)

📖 **Ver [DEPLOY.md](DEPLOY.md) para instrucciones completas**

## Tecnologías

### Backend
- Node.js
- Express
- TypeScript
- SQLite3 (PostgreSQL para producción)
- JWT para autenticación
- bcryptjs para hash de contraseñas

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios

## Estado del Proyecto

✅ Sistema de autenticación completo
✅ Solicitudes de usuario
✅ Panel de administración
✅ Dashboard básico

🚧 Próximamente: Funcionalidades de gestión de la óptica (clientes, productos, ventas, etc.)

# AppDelStream - Control de Stock Óptico

Sistema web completo para gestión de stock, clientes y ventas de ópticas. Desarrollado con React, TypeScript, Node.js y SQLite.

## 🚀 Características Principales

### ✅ **Gestión Completa**
- **Productos**: CRUD completo con imágenes, stock, precios
- **Clientes**: Registro con DNI, contacto, notas
- **Ventas**: Registro con prescripción óptica (8 campos)
- **Usuarios**: Sistema multi-óptica con autenticación

### 🎯 **Funcionalidades Avanzadas**
- **Cliente/Producto no registrado**: Venta sin registro previo
- **Prescripción óptica**: 8 campos (OD/OI Esf, Cil, Eje, Add)
- **Stock inteligente**: Alertas de bajo stock
- **Interfaz moderna**: Diseño Slack-like con gradientes
- **Responsive**: Funciona en desktop, tablet y móvil

### 🔧 **Tecnologías**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Autenticación**: JWT
- **Validación**: Zod + React Hook Form

## 📦 Instalación Rápida

### **Opción 1: Script Automático (Recomendado)**
```bash
# En Windows, simplemente ejecuta:
start.bat
```

### **Opción 2: Instalación Manual**
```bash
# 1. Clonar el repositorio
git clone [URL_DEL_REPO]
cd AppDelStream

# 2. Instalar dependencias
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Configurar variables de entorno
copy backend\env.example backend\.env

# 4. Iniciar la aplicación
npm run dev
```

## 🌐 Acceso a la Aplicación

Una vez iniciada, accede a:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 👤 Primer Uso

1. **Registrar nueva óptica**: Crea una cuenta con datos de la óptica
2. **Iniciar sesión**: Usa las credenciales creadas
3. **Agregar productos**: Comienza con el inventario
4. **Registrar clientes**: Crea la base de datos de clientes
5. **Realizar ventas**: Registra las primeras ventas

## 📋 Funcionalidades por Sección

### **Dashboard**
- Resumen de ventas, productos, clientes
- Gráficos de rendimiento
- Alertas de stock bajo

### **Productos**
- ✅ Ver detalles completos
- ✅ Editar información
- ✅ Eliminar productos
- ✅ Subir imágenes
- ✅ Control de stock

### **Clientes**
- ✅ Ver perfil completo
- ✅ Editar información
- ✅ Eliminar clientes
- ✅ Historial de ventas

### **Ventas**
- ✅ Ver detalles completos con prescripción
- ✅ Cliente/Producto no registrado
- ✅ 8 campos de prescripción óptica
- ✅ Notas y observaciones

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros
- **Validación**: Frontend y backend
- **Multi-óptica**: Cada óptica ve solo sus datos
- **CORS**: Configurado para desarrollo

## 📱 Compatibilidad

- ✅ **Desktop**: Chrome, Firefox, Safari, Edge
- ✅ **Tablet**: iPad, Android tablets
- ✅ **Móvil**: iPhone, Android phones

## 🛠️ Desarrollo

### **Estructura del Proyecto**
```
AppDelStream/
├── frontend/          # React + TypeScript
├── backend/           # Node.js + Express
├── package.json       # Scripts principales
└── README.md         # Este archivo
```

### **Scripts Disponibles**
```bash
npm run dev          # Inicia frontend + backend
npm run dev:frontend # Solo frontend
npm run dev:backend  # Solo backend
npm run build        # Build de producción
```

## 🚀 Despliegue

### **Para Demostración Local**
1. Ejecuta `start.bat` (Windows)
2. Abre http://localhost:5173
3. Registra una nueva óptica
4. ¡Listo para usar!

### **Para Producción**
- **Frontend**: Vercel, Netlify, o servidor estático
- **Backend**: Railway, Heroku, o VPS
- **Base de datos**: PostgreSQL (migración desde SQLite)

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: [tu-email@ejemplo.com]
- **Documentación**: [URL_DOCUMENTACION]

## 📄 Licencia

Este proyecto es propiedad de [Tu Empresa] y está destinado para uso interno.

---

**AppDelStream v1.0** - Sistema completo de gestión óptica 🕶️ 
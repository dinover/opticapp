# 🎯 Guía de Demostración - AppDelStream

## 📋 Preparación para la Demostración

### **1. Iniciar la Aplicación**
```bash
# Opción A: Script automático (Recomendado)
start.bat

# Opción B: Manual
npm install
npm run dev
```

### **2. Acceder a la Aplicación**
- **URL**: http://localhost:5173
- **Puerto Backend**: http://localhost:3001

---

## 🎬 Script de Demostración

### **Paso 1: Registro de Óptica**
1. Abrir http://localhost:5173
2. Click en "Registrarse"
3. Completar datos de la óptica:
   - **Nombre**: "Óptica Demo"
   - **Dirección**: "Av. Principal 123"
   - **Teléfono**: "011-1234-5678"
   - **Email**: "demo@optica.com"
   - **Usuario**: "admin"
   - **Email**: "admin@optica.com"
   - **Contraseña**: "123456"

### **Paso 2: Agregar Productos**
1. Ir a "Productos"
2. Click en "Agregar Producto"
3. Agregar 3-4 productos de ejemplo:
   ```
   Producto 1:
   - Nombre: "Gafas de Sol Ray-Ban"
   - Marca: "Ray-Ban"
   - Modelo: "Aviator"
   - Color: "Dorado"
   - Tamaño: "58mm"
   - Precio: 25000
   - Stock: 10

   Producto 2:
   - Nombre: "Gafas de Lectura"
   - Marca: "Generic"
   - Modelo: "Clásica"
   - Color: "Negro"
   - Tamaño: "55mm"
   - Precio: 8000
   - Stock: 25
   ```

### **Paso 3: Registrar Clientes**
1. Ir a "Clientes"
2. Click en "Agregar Cliente"
3. Agregar 2-3 clientes:
   ```
   Cliente 1:
   - DNI: "12345678"
   - Nombre: "Juan"
   - Apellido: "Pérez"
   - Teléfono: "011-9876-5432"
   - Email: "juan@email.com"
   - Notas: "Cliente frecuente"

   Cliente 2:
   - DNI: "87654321"
   - Nombre: "María"
   - Apellido: "González"
   - Teléfono: "011-1111-2222"
   - Email: "maria@email.com"
   ```

### **Paso 4: Realizar Ventas**
1. Ir a "Ventas"
2. Click en "Nueva Venta"
3. Demostrar diferentes escenarios:

#### **Escenario A: Venta con Cliente y Producto Registrados**
- Seleccionar "Cliente registrado" → Juan Pérez
- Seleccionar "Producto registrado" → Gafas Ray-Ban
- Cantidad: 1
- Precio total: 25000
- Agregar prescripción:
  - OD Esf: -2.50, Cil: -1.00, Eje: 90, Add: 1.50
  - OI Esf: -2.25, Cil: -0.75, Eje: 85, Add: 1.50
- Notas: "Primera consulta"

#### **Escenario B: Venta con Cliente No Registrado**
- Seleccionar "Cliente no registrado"
- Nombre: "Cliente Ocasional"
- Seleccionar "Producto registrado" → Gafas de Lectura
- Cantidad: 2
- Precio total: 16000
- Sin prescripción

#### **Escenario C: Venta con Producto No Registrado**
- Seleccionar "Cliente registrado" → María González
- Seleccionar "Producto no registrado"
- Nombre: "Gafas de Sol Importadas"
- Cantidad: 1
- Precio total: 35000
- Con prescripción completa

### **Paso 5: Demostrar Funcionalidades**

#### **Gestión de Productos**
- ✅ Ver detalles: Click en el ojo azul
- ✅ Editar: Click en el lápiz verde
- ✅ Eliminar: Click en la papelera roja
- ✅ Búsqueda: Usar el buscador
- ✅ Ordenamiento: Click en columnas

#### **Gestión de Clientes**
- ✅ Ver perfil: Click en el ojo azul
- ✅ Editar: Click en el lápiz verde
- ✅ Eliminar: Click en la papelera roja
- ✅ Búsqueda: Por DNI o nombre

#### **Gestión de Ventas**
- ✅ Ver detalles: Click en el ojo azul
- ✅ Prescripción: Mostrar campos OD/OI
- ✅ Cliente no registrado: Mostrar nombre ingresado
- ✅ Producto no registrado: Mostrar nombre ingresado

### **Paso 6: Dashboard y Estadísticas**
1. Ir a "Dashboard"
2. Mostrar:
   - Total de ventas
   - Ingresos totales
   - Productos con bajo stock
   - Gráficos de rendimiento

---

## 🎯 Puntos Clave a Destacar

### **✅ Funcionalidades Únicas**
1. **Cliente/Producto no registrado**: Flexibilidad total
2. **Prescripción óptica**: 8 campos especializados
3. **Multi-óptica**: Cada óptica es independiente
4. **Interfaz moderna**: Diseño profesional
5. **Responsive**: Funciona en todos los dispositivos

### **🔧 Características Técnicas**
1. **Base de datos**: SQLite (fácil migración)
2. **Autenticación**: JWT seguro
3. **Validación**: Frontend y backend
4. **Imágenes**: Subida de fotos de productos
5. **Stock automático**: Actualización en tiempo real

### **📱 Compatibilidad**
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ✅ Móvil (iPhone, Android)

---

## 🚀 Para Producción

### **Opciones de Despliegue**
1. **Vercel + Railway**: Frontend + Backend
2. **Netlify + Heroku**: Alternativa popular
3. **VPS propio**: Control total
4. **Docker**: Containerización

### **Migración de Base de Datos**
- SQLite → PostgreSQL/MySQL
- Scripts de migración incluidos
- Sin pérdida de datos

---

## 📞 Contacto

Para soporte técnico o consultas:
- **Email**: [tu-email@ejemplo.com]
- **WhatsApp**: [tu-numero]
- **Horarios**: Lunes a Viernes 9-18hs

---

**¡AppDelStream está listo para revolucionar la gestión de tu óptica! 🕶️✨** 
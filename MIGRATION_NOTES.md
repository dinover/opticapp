# Notas de Migración a PostgreSQL

## Cambios Realizados

### 1. Dependencias
- ✅ Removido: `sqlite3`
- ✅ Agregado: `pg` (driver de PostgreSQL)
- ✅ Agregado: `@types/pg` (tipos de TypeScript)

### 2. Archivos Modificados

#### `src/config/database.ts`
- Completamente reescrito para usar PostgreSQL con `pg` (Pool)
- Conversión automática de placeholders de SQLite (`?`) a PostgreSQL (`$1`, `$2`, etc.)
- Manejo de SSL para conexiones seguras (necesario en Render)
- Soporte para `RETURNING id` en queries INSERT
- Fallback a `lastval()` si no se usa RETURNING

#### `src/database/init.ts`
- Sintaxis SQL actualizada para PostgreSQL:
  - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
  - `DATETIME` → `TIMESTAMP`
  - `REAL` → `NUMERIC(10, 2)` para mejor precisión en decimales
  - `TEXT` se mantiene (compatible en PostgreSQL)

#### `src/routes/dashboard.ts`
- Queries de fecha actualizadas:
  - `date(s.sale_date)` → `s.sale_date::date` (sintaxis PostgreSQL)

#### `src/routes/sales.ts`
- Query INSERT actualizada para usar `RETURNING id`

#### `render.yaml`
- Configurado con `DATABASE_URL` para conexión a PostgreSQL en Render

#### `package.json`
- Dependencias actualizadas para PostgreSQL

## Configuración

### Variables de Entorno Requeridas

**Producción (Render):**
```env
DATABASE_URL=postgresql://opticapp_database_user:fSnX6LmogG58c0ecbqaIYumc17FkTFZx@dpg-d4dpejfdiees73bp2sl0-a/opticapp_database
NODE_ENV=production
JWT_SECRET=<tu_secreto_seguro>
PORT=10000
```

**Desarrollo Local (opcional - si quieres usar PostgreSQL local):**
```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/opticapp
NODE_ENV=development
JWT_SECRET=desarrollo_secret
PORT=3001
```

## Próximos Pasos

1. **Desplegar en Render:**
   - El código ya está configurado con la URL de PostgreSQL
   - El build automáticamente inicializará la base de datos

2. **Inicializar Base de Datos:**
   - Se ejecuta automáticamente durante el build (`npm run db:init`)
   - O manualmente después del deploy usando la Shell de Render

3. **Verificar Conexión:**
   - Revisa los logs del backend en Render
   - Deberías ver: "Conexión a PostgreSQL establecida"
   - Y: "Base de datos PostgreSQL inicializada correctamente"

## Diferencias SQLite vs PostgreSQL

### Compatibilidad
- ✅ La mayoría de las queries funcionan sin cambios
- ✅ Los placeholders `?` se convierten automáticamente a `$1, $2, etc.`
- ✅ Las funciones de agregación (`COUNT`, `SUM`, etc.) son similares
- ✅ Los JOINs funcionan igual

### Diferencias Principales
- ❌ SQLite: `AUTOINCREMENT` → PostgreSQL: `SERIAL`
- ❌ SQLite: `DATETIME` → PostgreSQL: `TIMESTAMP`
- ❌ SQLite: `REAL` (float) → PostgreSQL: `NUMERIC` (decimal exacto)
- ❌ SQLite: `date()` función → PostgreSQL: `::date` cast
- ❌ SQLite: `last_insert_rowid()` → PostgreSQL: `lastval()` o `RETURNING id`

### Características Adicionales de PostgreSQL
- ✅ Mejor soporte para transacciones complejas
- ✅ Tipos de datos más robustos
- ✅ Mejor rendimiento en queries complejas
- ✅ Persistencia de datos permanente (en Render)
- ✅ SSL/TLS nativo para conexiones seguras

## Troubleshooting

### Error: "DATABASE_URL no está configurada"
- Verifica que la variable de entorno `DATABASE_URL` esté configurada en Render
- Formato: `postgresql://usuario:contraseña@host:puerto/database`

### Error: "SSL required"
- El código ya está configurado para usar SSL en producción
- Verifica que `connectionString.includes('dpg-')` detecte tu URL de Render

### Error: "relation does not exist"
- La base de datos no se ha inicializado
- Ejecuta: `npm run db:init` en la Shell de Render

### Error: "syntax error near ?"
- Esto no debería pasar porque los placeholders se convierten automáticamente
- Si ocurre, verifica que no haya queries con sintaxis SQLite específica sin convertir

## Migración de Datos (si tienes datos existentes)

Si tienes datos en SQLite que quieres migrar a PostgreSQL:

1. Exportar datos de SQLite a CSV/JSON
2. Ajustar formato de fechas si es necesario
3. Importar en PostgreSQL usando scripts de migración

**Nota:** Para una nueva instalación, simplemente ejecuta `npm run db:init` que creará todas las tablas vacías.


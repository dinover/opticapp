# E2E con Cypress

Dos suites, mismo framework, distinto propósito:

| Suite | Dónde vive | Cuándo corre | Qué cubre |
|---|---|---|---|
| **Sanity** | `cypress/e2e/sanity/` | Automático, después de cada deploy exitoso en Vercel ([.github/workflows/sanity.yml](../.github/workflows/sanity.yml)) | Los flujos básicos: login/logout, navegación por las secciones principales, alta de cliente + producto + venta. Rápida (unos pocos minutos) y no destructiva. |
| **Regression** | `cypress/e2e/regression/` | Manual, desde la pestaña **Actions** de GitHub → *Regression E2E* → *Run workflow* ([.github/workflows/regression.yml](../.github/workflows/regression.yml)) | CRUD completo y validaciones de cada entidad, alta de óptica y aprobación/rechazo del admin, equipo, cambio de contraseña, control de acceso por rol, 404. Más lenta y con acciones más invasivas (crea solicitudes reales, usa la cuenta admin). |

## Correr localmente

```bash
# contra el frontend local (npm run dev en /frontend, puerto 5173 por default)
CYPRESS_QA_USERNAME=optica_prueba CYPRESS_QA_PASSWORD=prueba123 npm run test:e2e:sanity

# con la UI interactiva de Cypress
CYPRESS_QA_USERNAME=optica_prueba CYPRESS_QA_PASSWORD=prueba123 npm run cypress:open
```

`CYPRESS_BASE_URL` es opcional en local (default `http://localhost:5173`); en CI la pone cada workflow.

## Cuentas necesarias

Ambas suites corren contra una app real (local o desplegada), así que necesitan cuentas reales, no mocks.

### Cuenta QA (`CYPRESS_QA_USERNAME` / `CYPRESS_QA_PASSWORD`)

Una cuenta `owner` dedicada, separada de cualquier óptica real. Se crea una sola vez desde `/request-user` como cualquier óptica nueva.

**Importante — la licencia vence:** como cualquier cuenta, arranca en trial (7 días) y si el admin la aprueba pasa a activa (30 días). Si vence, la API empieza a devolver 403 en todo y el Sanity se rompe *sin que haya ningún bug real* — se decidió conscientemente no automatizar esto (ver decisión abajo), así que hay que **renovarle la licencia a mano desde `/admin` antes de que venza** (recomendado: aprobarla para que quede en modo activo de 30 días en vez de trial de 7, y poner un recordatorio mensual para extenderla).

Si el Sanity empieza a fallar en el paso de login con "Tu período de prueba... ha vencido" o "Tu licencia ha vencido", es este el motivo — no un bug de la app.

### Cuenta admin (`CYPRESS_ADMIN_USERNAME` / `CYPRESS_ADMIN_PASSWORD`)

Solo la usa Regression (aprobar/rechazar solicitudes, listar usuarios). Es el admin real del sistema. Los tests que la usan (`request-user-flow.cy.ts`) están escritos para operar **solo sobre las solicitudes que ellos mismos crean** (las ubican por su username único, nunca "la primera pendiente" de la lista), así que no deberían tocar solicitudes de clientes reales — pero al correr Regression con esta cuenta, tené en cuenta que tiene los mismos permisos que el admin real.

## Secrets de GitHub a configurar

En el repo → Settings → Secrets and variables → Actions:

```bash
gh secret set CYPRESS_QA_USERNAME
gh secret set CYPRESS_QA_PASSWORD
gh secret set CYPRESS_ADMIN_USERNAME     # solo Regression
gh secret set CYPRESS_ADMIN_PASSWORD     # solo Regression
gh secret set CYPRESS_PRODUCTION_URL     # solo Regression, ej: https://opticapp.vercel.app
```

Sanity no necesita `CYPRESS_PRODUCTION_URL`: la toma del evento `deployment_status` que dispara Vercel en cada deploy.

## Un límite a tener en cuenta: el rate limit de `/login` y `/request-user`

El backend limita `/api/auth/login` y `/api/auth/request-user` a 20 pedidos cada 15 minutos **por IP** (`authLimiter` en [src/routes/auth.ts](../src/routes/auth.ts)) — es una protección real contra fuerza bruta, no algo que haya que esquivar. Regression, al probar a fondo login/registro/equipo/contraseña, hace bastantes pedidos contra esos dos endpoints en una sola corrida (fácilmente 20+): si todos salen desde el mismo runner de GitHub Actions (una sola IP), es esperable que algún test tardío se encuentre con un 429 y falle sin que haya ningún bug real de por medio.

Si eso pasa: esperá a que pase la ventana de 15 minutos y volvé a correr el workflow. No es flakiness del test ni de la app — es el límite haciendo su trabajo. (Sanity no debería verse afectada: hace un solo login por corrida.)

## Decisiones de diseño (y por qué)

- **Trigger de Sanity = `deployment_status`, no `push`.** Un `push` a `main` dispara el build de Vercel, pero no espera a que termine; correr los tests ahí probaría la versión anterior de la app. `deployment_status` llega recién cuando el deploy ya está listo, con la URL exacta.
- **Datos de prueba únicos y con limpieza.** Cada test genera nombres únicos (`uniqueName()` en `cypress/support/testData.ts`) y borra lo que crea en un `after()` — vía API, no UI, para que la limpieza no dependa de que el resto del test haya pasado.
- **Licencia de la cuenta QA: renovación manual, no un `license_type` que nunca vence.** Se evaluó marcar la cuenta con un `license_type` especial en la base para que nunca expire (la función `getLicenseStatus()` solo bloquea `'trial'` y `'active'`, así que cualquier otro valor ya pasa siempre). Se descartó a favor de renovarla a mano — ver la nota de arriba para no dejar que esto rompa Sanity en silencio.
- **`request-user-flow.cy.ts` vive solo en Regression.** Cada corrida crea una óptica y un usuario reales (soft-delete al final, no hay borrado físico), así que no tiene sentido correrlo en cada deploy.

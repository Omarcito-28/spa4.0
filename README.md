# Essence De Toi

Sistema web de control operativo y agendamiento para Centros de Cuidado Personal. Permite a los clientes reservar servicios con un estilista en un horario disponible, a los estilistas gestionar su agenda y sus citas, y al administrador controlar usuarios, servicios, citas y reportes del centro.

## Roles

| Rol | Qué puede hacer |
|-----|-----------------|
| **Cliente** (`CLIENT`) | Registrarse e iniciar sesión, recuperar su contraseña por correo, consultar el catálogo de servicios y la disponibilidad, agendar citas, reprogramarlas o cancelarlas mientras no estén completadas, ver su historial y editar su perfil. |
| **Estilista** (`STYLIST`) | Ver su panel con las citas del día, confirmar y cancelar las citas que tiene asignadas, marcar como completadas las citas confirmadas que ya empezaron, y configurar su horario semanal de atención. |
| **Administrador** (`ADMIN`) | Todo lo anterior sobre cualquier cita, además de crear cuentas con el rol que elija (por ejemplo, de estilista), gestionar usuarios y roles, administrar el catálogo de servicios y consultar reportes de citas e ingresos por servicios completados. |

Los estados de una cita son `PENDING`, `CONFIRMED`, `CANCELLED` y `COMPLETED`. Solo el estilista asignado o un administrador pueden completar una cita, y una cita completada ya no se puede reprogramar ni cancelar.

## Arquitectura

Arquitectura cliente-servidor: una aplicación de una sola página (SPA) consume una API REST que guarda los datos en MongoDB.

```
Navegador ──► Frontend React (Vercel) ──HTTP/JSON──► API REST Express (Render) ──► MongoDB Atlas
                                       Authorization: Bearer <JWT>                    │
                                                                                      └─► SMTP (correos)
```

- **Frontend** (`frontend/`): React con React Router. Las páginas llaman a la API desde `src/services/api.js`; la sesión se guarda en un contexto de autenticación con el token JWT. Los paneles de citas y los dashboards se actualizan cada 30 segundos mientras la pestaña está visible y de inmediato cuando una cita cambia en otra pestaña del mismo navegador.
- **Backend** (`backend/`): API Express organizada en capas orientadas a objetos:
  - `routes/` define los endpoints y aplica el `AuthMiddleware` (token y rol).
  - `controllers/` traduce peticiones HTTP a llamadas de servicio.
  - `services/` contiene las reglas de negocio (citas, disponibilidad, autenticación, usuarios, catálogo, correo).
  - `models/` son los esquemas de Mongoose (`User`, `Service`, `Appointment`, `BookingLock`).
  - `errors/` define la jerarquía `AppError` que el `ErrorMiddleware` convierte en respuestas JSON con su código HTTP.
  - `container.js` crea e inyecta todas las dependencias, y `database/database-seeder.js` siembra el catálogo inicial y el administrador.
  - Las reservas usan transacciones de MongoDB y bloqueos por estilista y fecha para evitar citas superpuestas.

### Endpoints principales

Todos bajo `/api`. "Auth" requiere el encabezado `Authorization: Bearer <token>`.

| Método y ruta | Acceso | Descripción |
|---------------|--------|-------------|
| `GET /health` | Público | Estado del servicio |
| `POST /auth/register` · `POST /auth/login` | Público | Registro e inicio de sesión |
| `POST /auth/password-reset/request` · `/confirm` | Público | Recuperación de contraseña por correo |
| `GET /auth/me` · `PUT /auth/profile` | Auth | Perfil del usuario |
| `GET /services` | Público | Catálogo de servicios |
| `POST /services` · `PUT /services/:id` · `DELETE /services/:id` | Admin | Gestión del catálogo |
| `GET /appointments/availability` | Público | Horarios disponibles |
| `GET /appointments` · `POST /appointments` | Auth | Citas visibles para el rol y nueva reserva |
| `PUT /appointments/:id/reschedule` · `PUT /appointments/:id/status` | Auth | Reprogramar y cambiar estado |
| `PUT /appointments/:id` · `DELETE /appointments/:id` | Admin | Edición y eliminación |
| `GET /users/stylists` | Público | Estilistas disponibles |
| `GET /users/me/schedule` · `PUT /users/me/schedule` | Estilista | Horario semanal |
| `GET /users` · `POST /users` · `PUT /users/:id` · `DELETE /users/:id` | Admin | Gestión de usuarios: listar, crear cuentas con cualquier rol, editar y eliminar |

## Tecnologías

| Capa | Tecnologías |
|------|-------------|
| Frontend | React 19.2.5, React DOM 19.2.5, React Router DOM 7.14.1, Styled Components 6.4.0, Vite 8.0.8 |
| Backend | Node.js 22, Express 4.22.2, Mongoose 9.9.4, jsonwebtoken 9.0.3, bcryptjs 2.4.3, Nodemailer 7.0.13, cors 2.8.6, dotenv 16.6.1 |
| Base de datos | MongoDB Atlas |
| Pruebas | Vitest 5.0.5, Testing Library (React 16.3.3), jsdom 29.1.1, supertest 7.3.1, mongodb-memory-server 11.3.0 |
| Calidad y CI | ESLint 9, GitHub Actions |
| Despliegue | Vercel (frontend), Render (backend) |

## Estructura

```
.
├── frontend/     Aplicación React + Vite (páginas, componentes, hooks, servicios y pruebas de interfaz)
├── backend/      API Express + Mongoose (rutas, controladores, servicios, modelos, errores y pruebas)
├── docs/         Entregables del proyecto (ver docs/README.md)
├── .github/      Integración continua y plantillas de issues y pull requests
├── render.yaml   Blueprint del backend en Render
└── package.json  Atajos para ejecutar comandos de ambos proyectos desde la raíz
```

Cada carpeta es un proyecto independiente con su propio `package.json` y sus dependencias.

## Puesta en marcha

### Requisitos

- Node.js 22 y npm.
- Una base de datos de MongoDB Atlas (o un MongoDB con réplica, porque las reservas usan transacciones).
- Opcional: una cuenta SMTP para la recuperación de contraseña y los avisos de citas.

### 1. Instalar dependencias

Desde la raíz:

```bash
npm run install:all
```

Equivale a ejecutar `npm ci` dentro de `frontend/` y dentro de `backend/`.

### 2. Configurar variables de entorno

Copia `backend/.env.example` a `backend/.env` y completa:

- `MONGODB_URI`: la URI de MongoDB Atlas.
- `JWT_SECRET`: un valor aleatorio de al menos 32 caracteres.
- `FRONTEND_URL`: `http://localhost:5173` en desarrollo.
- `BOOTSTRAP_ADMIN_*`: las cuatro variables, solo si la base todavía no tiene administrador. Se crea una sola vez y no se restablece en arranques posteriores.
- `SMTP_*`: si quieres enviar correos.

Para el frontend, copia `frontend/.env.example` a `frontend/.env.local` si quieres configurar los datos de contacto y redes (`VITE_CONTACT_*`, `VITE_*_URL`), WhatsApp (`VITE_WHATSAPP_NUMBER`), medios de pago (`VITE_PAYMENT_METHODS`) o la política de cancelación (`VITE_CANCELLATION_POLICY`). Los campos vacíos no muestran datos de ejemplo. En desarrollo deja `VITE_API_URL` vacía.

Las variables `VITE_*` se incluyen en el frontend compilado: nunca pongas secretos en ellas. Tampoco subas `backend/.env` al repositorio.

### 3. Ejecutar

En una terminal, el backend (se reinicia solo al guardar cambios):

```bash
npm run dev:backend
```

En otra terminal, el frontend:

```bash
npm run dev:frontend
```

Abre http://localhost:5173. Vite redirige `/api` al backend en el puerto 5000; puedes comprobarlo en http://localhost:5000/api/health. También puedes entrar a cada carpeta y usar `npm run dev` directamente.

El asistente del sitio consulta los servicios, duraciones, horarios y disponibilidad del backend y guía a la persona al formulario de reserva, pero no crea reservas desde el chat.

### 4. Comprobar

Desde la raíz:

```bash
npm run lint    # ESLint en frontend/ y backend/
npm run build   # compila el frontend en frontend/dist/
npm test        # pruebas del frontend y luego del backend
```

## Pruebas

Las pruebas usan [Vitest](https://vitest.dev) en ambos proyectos. Desde la raíz, `npm test` corre las del frontend y luego las del backend; `npm run test:coverage` hace lo mismo con reporte de cobertura.

**Frontend** (`frontend/`), con Testing Library y jsdom. Prueban las utilidades de fechas y resúmenes, el cliente de la API, el hook de actualización automática, los formularios de inicio de sesión y registro, y los paneles de citas, dashboards y reportes:

```bash
cd frontend
npm test                 # una corrida
npx vitest               # modo observación mientras desarrollas
npm run test:coverage    # reporte de cobertura en frontend/coverage/
```

**Backend** (`backend/`). Las pruebas unitarias cubren los servicios (`AuthService`, `AppointmentService`, `AvailabilityService`, `ServiceCatalogService`, `UserService`), las utilidades de fecha y hora, la jerarquía de errores y el controlador base. Las de integración llaman a la API con supertest:

```bash
cd backend
npm test
npm run test:coverage    # reporte de cobertura en backend/coverage/
```

Las pruebas del backend levantan un MongoDB temporal en memoria con `mongodb-memory-server`; nunca usan la base de Atlas ni el `MONGODB_URI` de `backend/.env`, y no necesitan variables de entorno. La primera corrida descarga el binario de MongoDB (unos 100 MB) y lo guarda en caché.

El flujo `.github/workflows/ci.yml` ejecuta en cada push y pull request el lint, el build y las pruebas con cobertura de ambos proyectos; los reportes quedan como artefactos de la ejecución.

## Despliegue

El backend se publica en Render (`render.yaml`) y el frontend en Vercel (`frontend/vercel.json`), con la base en MongoDB Atlas. El paso a paso, las variables de cada servicio y la lista de comprobación están en [docs/despliegue.md](docs/despliegue.md).

## Cómo contribuir

1. Crea una rama desde `main` (`feature/...`, `fix/...`, `docs/...`).
2. Abre un issue con la plantilla que corresponda (historia de usuario, tarea o error).
3. Antes del pull request, ejecuta `npm run lint`, `npm run build` y `npm test`.
4. Abre el pull request con la plantilla y enlaza el issue.

## Equipo

| Integrante | Rol en el proyecto | Contacto |
|------------|--------------------|----------|
| _Nombre completo_ | _Rol_ | _Correo o usuario de GitHub_ |
| _Nombre completo_ | _Rol_ | _Correo o usuario de GitHub_ |
| _Nombre completo_ | _Rol_ | _Correo o usuario de GitHub_ |
| _Nombre completo_ | _Rol_ | _Correo o usuario de GitHub_ |

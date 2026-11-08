# Essence De Toi

Sistema web de control operativo y agendamiento para Centros de Cuidado Personal. Permite a los clientes reservar servicios con un estilista en un horario disponible, a los estilistas gestionar su agenda y sus citas, y al administrador controlar usuarios, servicios, citas y reportes del centro.

Proyecto final de **Ingeniería de Software Orientada a Objetos**, programa de Ingeniería de Software de la Universidad Surcolombiana. Docente: Eduardo Martínez Vidal. Repositorio: https://github.com/Omarcito-28/spa4.0.

Los entregables del curso (propuesta, requerimientos, historias de usuario, SAD, UML, etc.) están en [`docs/`](docs/README.md).

## Roles

| Rol | Qué puede hacer |
|-----|-----------------|
| **Cliente** (`CLIENT`) | Registrarse e iniciar sesión con usuario y contraseña o con su cuenta de Google, recuperar su contraseña por correo, consultar el catálogo de servicios y la disponibilidad, agendar citas, reprogramarlas o cancelarlas con la anticipación mínima de la política de cancelación, agregarlas a su calendario (`.ics`), calificar las citas completadas, ver su historial y editar su perfil. Todo eso está en *Mi cuenta*: pestañas Mi Panel, Mis Citas, Agendar Cita y Mi Perfil. Al reservar ve la imagen, descripción, duración y precio del servicio elegido. Recibe un recordatorio por correo el día anterior a cada cita. |
| **Estilista** (`STYLIST`) | Trabajar desde su propio panel (`/stylist`, con menú lateral): ver las citas del día, su agenda en lista o calendario semanal y su historial, confirmar y cancelar las citas que tiene asignadas, marcar como completadas o como inasistencia las citas que ya empezaron, escribir notas internas sobre sus clientes, configurar su horario semanal y bloquear sus días libres o vacaciones. |
| **Administrador** (`ADMIN`) | Trabajar desde su propio panel (`/admin`, con menú lateral, indicadores en vivo y gráficas de ventas de 7, 14 o 30 días). Todo lo anterior sobre cualquier cita (incluido moverla de fecha y hora o eliminarla, y verlas en un calendario por estilista), además de crear y editar cuentas con el rol que elija, gestionar usuarios y roles, administrar el catálogo de servicios, cerrar el spa en festivos, enviar recordatorios a mano, moderar reseñas y consultar reportes de citas, ingresos, inasistencias y calificaciones, exportables a Excel (`.xlsx`) con formato de la marca, totales y una hoja por sección. |

Cualquier rol puede entrar con Google si su cuenta usa el mismo correo; las cuentas nuevas creadas con Google son siempre de cliente. Ver [Inicio de sesión con Google](#inicio-de-sesión-con-google).

Los estados de una cita son `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` y `NO_SHOW` (el cliente no asistió). Solo el estilista asignado o un administrador pueden completar una cita o registrar una inasistencia, y en ambos casos la cita queda cerrada: ya no se puede reprogramar ni cancelar.

## Arquitectura

Arquitectura cliente-servidor: una aplicación de una sola página (SPA) consume una API REST que guarda los datos en MongoDB.

```
Navegador ──► Frontend React (Vercel) ──HTTP/JSON──► API REST Express (Render) ──► MongoDB Atlas
    │                                  Authorization: Bearer <JWT>        │           │
    └─► Google Identity Services (botón "Continuar con Google")           │           └─► SMTP (correos)
                                                                          └─► claves públicas de Google (verifica el ID token)
```

- **Frontend** (`frontend/`): React con React Router. Las páginas llaman a la API desde `src/services/api.js`; la sesión se guarda en un contexto de autenticación con el token JWT. El administrador y el estilista tienen un layout propio con menú lateral según el rol (`components/dashboard/`); el cliente usa el sitio público con las pestañas de *Mi cuenta* (`components/account/`). Los paneles de citas y los dashboards se actualizan cada 30 segundos mientras la pestaña está visible y de inmediato cuando una cita cambia en otra pestaña del mismo navegador.
- **Backend** (`backend/`): API Express organizada en capas orientadas a objetos:
  - `routes/` define los endpoints y aplica el `AuthMiddleware` (token y rol).
  - `controllers/` traduce peticiones HTTP a llamadas de servicio.
  - `services/` contiene las reglas de negocio: citas, disponibilidad, días libres y cierres, recordatorios, reseñas, notas de clientes, autenticación (con contraseña y con Google), usuarios, catálogo, imágenes y correo.
  - `models/` son los esquemas de Mongoose: `User`, `Service`, `ServiceImage`, `Appointment`, `BookingLock`, `TimeOff`, `Review` y `ClientNote`.
  - `errors/` define la jerarquía `AppError` que el `ErrorMiddleware` convierte en respuestas JSON con su código HTTP.
  - `container.js` crea e inyecta todas las dependencias, y `database/database-seeder.js` siembra el catálogo inicial y el administrador.
  - Las reservas usan transacciones de MongoDB y bloqueos por estilista y fecha para evitar citas superpuestas.

### Endpoints principales

Todos bajo `/api`. "Auth" requiere el encabezado `Authorization: Bearer <token>`.

| Método y ruta | Acceso | Descripción |
|---------------|--------|-------------|
| `GET /health` | Público | Estado del servicio |
| `POST /auth/register` · `POST /auth/login` | Público | Registro e inicio de sesión (tras 5 intentos fallidos del mismo usuario desde la misma IP, el login se bloquea 15 minutos) |
| `GET /auth/providers` | Público | Métodos de inicio de sesión disponibles: `{ google: { clientId } }` o `{ google: null }` |
| `POST /auth/google` | Público | Inicia sesión o crea la cuenta con el ID token de Google (`{ credential }`). Responde la sesión e `isNewUser`. Comparte el límite de intentos del login |
| `POST /auth/password-reset/request` · `/confirm` | Público | Recuperación de contraseña por correo |
| `GET /auth/me` · `PUT /auth/profile` | Auth | Perfil del usuario |
| `GET /services` | Público | Catálogo de servicios publicados |
| `GET /services/all` · `POST /services` · `PUT /services/:id` · `DELETE /services/:id` | Admin | Gestión del catálogo, incluidos los servicios ocultos (`isActive: false`). No se puede borrar un servicio con citas próximas |
| `GET /service-images/:id` | Público | Imagen de un servicio guardada en la base |
| `GET /service-images` · `POST /service-images` | Admin | Listar y subir imágenes de servicios (JPEG, PNG o WebP) |
| `GET /appointments/availability` | Público | Horarios disponibles (con `closedReason` si el día está bloqueado) |
| `GET /appointments/policy` | Público | Horas mínimas para cancelar o reprogramar |
| `POST /appointments/reminders` | Admin | Envía ya los recordatorios de las citas de mañana |
| `GET /appointments` · `POST /appointments` | Auth | Citas visibles para el rol y nueva reserva |
| `PUT /appointments/:id/reschedule` · `PUT /appointments/:id/status` | Auth | Reprogramar y cambiar estado |
| `PUT /appointments/:id` · `DELETE /appointments/:id` | Admin | Edición (estado, estilista, fecha y hora) y eliminación |
| `GET /users/stylists` | Público | Estilistas disponibles |
| `GET /users/me/schedule` · `PUT /users/me/schedule` | Estilista | Horario semanal |
| `GET /users` · `POST /users` · `PUT /users/:id` · `DELETE /users/:id` | Admin | Gestión de usuarios: listar, crear cuentas con cualquier rol, editar y eliminar |
| `GET /time-off` · `POST /time-off` · `DELETE /time-off/:id` | Estilista, Admin | Días libres del estilista y cierres del spa |
| `GET /reviews` · `GET /reviews/summary` | Público | Reseñas recientes y promedios por servicio y estilista |
| `GET /reviews/mine` · `POST /reviews` | Cliente | Citas ya calificadas y nueva reseña de una cita completada |
| `GET /reviews/all` · `DELETE /reviews/:id` | Admin | Moderación de reseñas |
| `GET /client-notes/:client` · `POST /client-notes/:client` · `DELETE /client-notes/note/:id` | Estilista, Admin | Notas internas sobre un cliente |

## Tecnologías

| Capa | Tecnologías |
|------|-------------|
| Frontend | React 19.2.5, React DOM 19.2.5, React Router DOM 7.18.4, Styled Components 6.4.0, Vite 8.0.8, ExcelJS 4.4 (exportaciones, se carga solo al exportar), Google Identity Services |
| Backend | Node.js 22, Express 4.22.3, Mongoose 9.9.4, jsonwebtoken 9.0.3, bcryptjs 2.4.3, Nodemailer 10.2.1, cors 2.8.6, dotenv 16.6.1, google-auth-library 11 |
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
- `GOOGLE_CLIENT_ID` (opcional): el Client ID de OAuth de Google para "Continuar con Google". Vacío, el botón no aparece y todo lo demás funciona igual. Ver [Inicio de sesión con Google](#inicio-de-sesión-con-google).
- `BOOTSTRAP_ADMIN_*`: las cuatro variables, solo si la base todavía no tiene administrador. Se crea una sola vez y no se restablece en arranques posteriores.
- `SMTP_*`: si quieres enviar correos (recuperación de contraseña, avisos de citas y recordatorios del día anterior).
- `CANCELLATION_NOTICE_HOURS`: horas mínimas para que un cliente cancele o reprograme desde la página (por defecto 24; `0` desactiva la regla).

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

### 4. Cargar datos de prueba (opcional)

Para recorrer todas las funciones sin crear todo a mano:

```bash
npm run seed:test
```

El script `backend/scripts/seedTestData.js` crea:

- **Usuarios de cada rol**, todos con la contraseña `Prueba123*`:

  | Rol | Usuarios |
  |-----|----------|
  | Administrador | `admin_prueba` |
  | Estilista | `laura_estilista` (lunes a viernes, 9:00 a 18:00), `camila_estilista` (martes a sábado, 10:00 a 19:00), `sofia_estilista` (horario general del spa), `paula_inactiva` (desactivada) |
  | Cliente | `ana_cliente`, `juan_cliente`, `valentina_cliente`, `carlos_cliente`, `mariana_cliente`, `daniel_cliente`, `isabella_cliente`, `cliente_inactivo` (desactivado) y `cliente01` a `cliente12` para probar la paginación |

- **Citas en los cinco estados**, pasadas, de hoy, de mañana (para probar los recordatorios) y de las próximas semanas, algunas sin estilista asignado. Las horas respetan el horario y los días libres de cada estilista y no se cruzan.
- **Reseñas** de 2 a 5 estrellas, y citas completadas sin reseña para calificarlas desde la cuenta del cliente.
- **Notas internas** sobre clientes, **días libres** de estilistas y un **cierre del spa** por festivo.
- **Tres servicios extra**, uno de ellos oculto. Si faltan los seis servicios base, también los crea.

Se puede ejecutar varias veces: cada corrida borra primero solo lo que creó la anterior (usuarios con correo `@prueba.essencedetoi.com` y todo lo asociado a ellos) y no toca el administrador ni los clientes reales.

Escribe en la base de `MONGODB_URI`, así que úsalo con una base de desarrollo, no con la del sitio publicado. El script se niega a correr si `NODE_ENV=production`. Los correos de prueba no existen: con SMTP configurado, los avisos a esas cuentas fallarán.

Para restaurar solo el catálogo de servicios a los seis servicios base existe `node scripts/resetServices.js` (desde `backend/`); este sí borra todos los servicios actuales.

### 5. Comprobar

Desde la raíz:

```bash
npm run lint    # ESLint en frontend/ y backend/
npm run build   # compila el frontend en frontend/dist/
npm test        # pruebas del frontend y luego del backend
```

## Pruebas

Las pruebas usan [Vitest](https://vitest.dev) en ambos proyectos. Desde la raíz, `npm test` corre las del frontend y luego las del backend; `npm run test:coverage` hace lo mismo con reporte de cobertura.

**Frontend** (`frontend/`), con Testing Library y jsdom. Prueban las utilidades de fechas, ingresos y resúmenes, la exportación a Excel, el cliente de la API, el hook de actualización automática, el inicio de sesión, el registro y el perfil (incluido Google), los layouts por rol, y los paneles de citas, dashboards, gráficas y reportes:

```bash
cd frontend
npm test                 # una corrida
npx vitest               # modo observación mientras desarrollas
npm run test:coverage    # reporte de cobertura en frontend/coverage/
```

**Backend** (`backend/`). Las pruebas unitarias cubren los servicios (`AuthService`, `GoogleIdentityService`, `AppointmentService`, `AvailabilityService`, `ServiceCatalogService`, `UserService`, `ReviewService`, `ClientNoteService`), la agenda (días libres y cierres, inasistencias, política de cancelación y recordatorios), las utilidades de fecha y hora, la política de CORS, el límite de intentos de inicio de sesión, la jerarquía de errores y el controlador base. Las de integración llaman a la API con supertest:

```bash
cd backend
npm test
npm run test:coverage    # reporte de cobertura en backend/coverage/
```

Las pruebas del backend levantan un MongoDB temporal en memoria con `mongodb-memory-server`; nunca usan la base de Atlas ni el `MONGODB_URI` de `backend/.env`, y no necesitan variables de entorno. La primera corrida descarga el binario de MongoDB (unos 100 MB) y lo guarda en caché.

El flujo `.github/workflows/ci.yml` ejecuta en cada push y pull request el lint, el build y las pruebas con cobertura de ambos proyectos; los reportes quedan como artefactos de la ejecución.

## Inicio de sesión con Google

El login y el registro muestran el botón oficial **Continuar con Google** cuando el backend tiene `GOOGLE_CLIENT_ID`. Se usa [Google Identity Services](https://developers.google.com/identity/gsi/web) en modo ventana emergente:

1. El frontend pide `GET /api/auth/providers` para saber si Google está activo y con qué Client ID (es público). Solo entonces descarga el script de Google y dibuja el botón.
2. Al elegir la cuenta, Google entrega al navegador un **ID token** firmado, que se envía a `POST /api/auth/google`.
3. El backend (`GoogleIdentityService`) verifica con `google-auth-library` la firma, el emisor, la audiencia (nuestro Client ID) y la vigencia, y responde con la misma sesión JWT del login normal.

Reglas de las cuentas:

- **Un correo, una cuenta.** Si el correo ya tiene cuenta (registrada con contraseña o creada por el administrador), Google se vincula a ella y conserva su rol. Si no existe, se crea una cuenta de **cliente** con el nombre y correo de Google y un usuario tomado del correo (`ana.perez`, o `ana.perez1234` si ya está en uso). La persona nueva llega a *Mi perfil* para agregar su teléfono.
- **Solo correos verificados por Google** se crean o vinculan, y un correo ya vinculado a otra cuenta de Google se rechaza. Las cuentas desactivadas no pueden entrar.
- La cuenta se identifica por el identificador de Google (`googleId`, el claim `sub`), no por el correo: si después cambia el correo en el perfil, puede seguir entrando con Google.
- Las cuentas creadas con Google **no tienen contraseña**. Pueden crearla desde *Mi perfil* sin pedir la actual, o con *¿Olvidaste tu contraseña?*. Si intentan entrar con contraseña, el login les indica que usen Google.
- No se guarda ningún token de Google ni el client secret: solo el `googleId`.

Cómo crear el Client ID en Google Cloud: [docs/despliegue.md](docs/despliegue.md#4-inicio-de-sesión-con-google-opcional).

## Despliegue

El backend se publica en Render (`render.yaml`) y el frontend en Vercel (`frontend/vercel.json`), con la base en MongoDB Atlas. El paso a paso, las variables de cada servicio y la lista de comprobación están en [docs/despliegue.md](docs/despliegue.md).

## Cómo contribuir

1. Crea una rama desde `main` (`feature/...`, `fix/...`, `docs/...`).
2. Abre un issue con la plantilla que corresponda (historia de usuario, tarea o error).
3. Antes del pull request, ejecuta `npm run lint`, `npm run build` y `npm test`.
4. Abre el pull request con la plantilla y enlaza el issue.

## Equipo

| Integrante | Código | Rol en el proyecto | Correo |
|------------|--------|--------------------|--------|
| Lauren Dayanna Villanueva Camero | 20241220012 | Desarrolladora frontend y apoyo en documentación | u20241220012@usco.edu.co |
| Omar Gabriel Viana Sepúlveda | 20232218083 | Scrum Master, arquitecto de software y desarrollador backend | u20232218083@usco.edu.co |
| Carlos Esteban Castro Caicedo | 20231213568 | Product Owner y analista de requerimientos | u20231213568@usco.edu.co |
| Carlos David Neira Vega | 20232215447 | Desarrollador backend, pruebas y despliegue | u20232215447@usco.edu.co |

Docente: Eduardo Martínez Vidal, Universidad Surcolombiana.

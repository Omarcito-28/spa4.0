# Despliegue en la nube

Esta guía publica **Essence De Toi** con tres servicios gratuitos:

| Parte | Servicio | Carpeta del repositorio | URL de ejemplo |
|---|---|---|---|
| Base de datos | MongoDB Atlas | — | `mongodb+srv://…` |
| API (Express) | Render (Web Service) | `backend/` | `https://essence-de-toi-api.onrender.com` |
| Sitio (React/Vite) | Vercel | `frontend/` | `https://essence-de-toi.vercel.app` |

El navegador carga el sitio desde Vercel y este llama a la API de Render (`VITE_API_URL`). La API solo acepta peticiones de navegador que vengan del dominio de Vercel (`FRONTEND_URL`).

> **Nunca subas valores reales al repositorio.** Los secretos se cargan solo en los paneles de Render y Vercel. Los archivos `.env.example` muestran qué variables existen, sin valores.

---

## 0. Antes de empezar

Necesitas:

- Acceso de escritura al repositorio en GitHub, con todos los cambios subidos a la rama que vas a desplegar (normalmente `main`).
- Una cuenta en [MongoDB Atlas](https://cloud.mongodb.com), [Render](https://render.com) y [Vercel](https://vercel.com). Puedes entrar a Render y a Vercel con la misma cuenta de GitHub.
- Decidir dos nombres, porque cada servicio necesita la URL del otro:
  - **Nombre del servicio en Render**, por ejemplo `essence-de-toi-api`. Su URL será `https://essence-de-toi-api.onrender.com`. Si el nombre ya está tomado, Render agrega un sufijo; mira la URL real en el panel.
  - **Nombre del proyecto en Vercel**, por ejemplo `essence-de-toi`. Su URL será `https://essence-de-toi.vercel.app`.

> ⚠️ **Rota las credenciales antes de publicar.** Un archivo `backend/.env` con la URI de Atlas y el `JWT_SECRET` quedó guardado en commits anteriores del repositorio. Antes del primer despliegue:
> 1. Cambia la contraseña del usuario de base de datos en Atlas (paso 1.2).
> 2. Usa en Render un `JWT_SECRET` nuevo. El blueprint lo genera solo.

---

## 1. MongoDB Atlas

Si el equipo ya tiene un clúster con datos, úsalo y salta al paso 1.2.

### 1.1 Crear el clúster

1. En Atlas: **Create** → plan **M0 (Free)** → proveedor y región cercanos a la región de Render (el blueprint usa **Oregon**, es decir AWS `us-west-2`).
2. Espera a que el clúster quede en estado *Active*.

### 1.2 Usuario de base de datos

1. **Security → Database Access → Add New Database User**.
2. Método *Password*, rol **Read and write to any database**. Si vas a cambiar la contraseña de un usuario existente: **Edit → Edit Password**.
3. Guarda el usuario y la contraseña en un gestor de contraseñas, no en el repositorio.

### 1.3 Permitir la conexión desde Render (Network Access)

Atlas rechaza cualquier IP que no esté en su lista de acceso.

1. Crea primero el servicio de Render (paso 2) para conocer sus IP de salida: en el panel de Render abre el servicio → botón **Connect** (arriba a la derecha) → pestaña **Outbound**. Verás varios rangos de IP de la región.
2. En Atlas: **Security → Network Access → Add IP Address** y agrega **cada uno** de esos rangos (por ejemplo `44.229.0.0/16`, en formato CIDR tal como lo muestra Render). En el comentario pon "Render".
3. **Alternativa** si el plan no muestra IP de salida o cambian con frecuencia: agrega `0.0.0.0/0` (*Allow access from anywhere*). Es más simple, pero cualquier IP puede intentar conectarse. En ese caso, la contraseña del usuario de base de datos tiene que ser larga y aleatoria.

### 1.4 Cadena de conexión

1. **Database → Connect → Drivers → Node.js**.
2. Copia la URI y reemplaza `<password>`. Agrega el nombre de la base antes de `?`:
   ```
   mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/<base>?retryWrites=true&w=majority
   ```
   Si la contraseña tiene símbolos como `@`, `:` o `/`, escríbelos codificados para URL (`@` → `%40`).
3. Esta URI es el valor de `MONGODB_URI` en Render.

---

## 2. Backend en Render

El archivo [`render.yaml`](../render.yaml) en la raíz del repositorio describe el servicio:

- `rootDir: backend`
- instalación con `npm install --omit=dev` (no instala las herramientas de prueba)
- arranque con `npm start`
- health check en `/api/health`
- Node 22 y `NODE_ENV=production`

### 2.1 Crear el servicio con el Blueprint

1. En Render: **New → Blueprint** → conecta GitHub y elige el repositorio.
2. Render detecta `render.yaml` y muestra el servicio `essence-de-toi-api`. Si quieres otro nombre, cámbialo en `render.yaml` antes de este paso.
3. Render pide las variables marcadas como `sync: false`. Llénalas con la tabla del paso 2.2.
4. Pulsa **Apply**. El primer despliegue tarda unos minutos.

<details>
<summary>Sin Blueprint (creación manual equivalente)</summary>

**New → Web Service** → elige el repositorio y completa:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` (en *Advanced*) |
| Instance Type | Free |

Después agrega las variables del paso 2.2, más `NODE_VERSION=22` y `NODE_ENV=production`.
</details>

### 2.2 Variables de entorno del backend

Se configuran en **Environment** dentro del servicio. Todas están documentadas en [`backend/.env.example`](../backend/.env.example).

| Variable | Obligatoria | Qué poner |
|---|---|---|
| `MONGODB_URI` | Sí | La URI del paso 1.4. |
| `JWT_SECRET` | Sí | El blueprint la genera sola. En modo manual: una cadena aleatoria de al menos 32 caracteres (por ejemplo, la salida de `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). |
| `FRONTEND_URL` | Sí | La URL de Vercel, **sin `/` al final**: `https://<proyecto>.vercel.app`. Es el origen que CORS acepta y la base de los enlaces de recuperación de contraseña. |
| `NODE_ENV` | Sí | `production`. Ya viene en el blueprint. Con este valor, el servidor no arranca si falta `FRONTEND_URL`. |
| `NODE_VERSION` | Sí | `22`. Ya viene en el blueprint. |
| `CORS_ORIGINS` | No | Otros orígenes permitidos, separados por comas (por ejemplo un dominio propio `https://www.tuspa.co`). |
| `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME` | Solo si la base no tiene administrador | Crean el primer usuario ADMIN en el primer arranque. Después puedes borrarlas. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Para la recuperación de contraseña y los correos de citas. Sin SMTP, la recuperación de contraseña responde que no está configurada y no se envían correos de citas; el resto funciona. |

**No definas `PORT`.** Render asigna el puerto y el backend lo lee de `PORT`.

Cada vez que cambias una variable, Render vuelve a desplegar el servicio.

### 2.3 Comprobar el backend

1. En **Logs** deben aparecer estas líneas:
   ```
   ✅ Conectado a MongoDB correctamente
   🚀 Servidor backend escuchando en el puerto 10000
   🔒 CORS permitido para: https://<proyecto>.vercel.app
   ```
2. Abre `https://<servicio>.onrender.com/api/health` en el navegador. Debe responder `{"status":"ok"}`.
3. Abre `https://<servicio>.onrender.com/api/services`. Debe devolver el catálogo en JSON.

> El plan gratuito de Render **apaga el servicio tras 15 minutos sin tráfico**. La primera petición después de eso tarda alrededor de un minuto; es normal. Mientras alguien tenga un panel abierto, la actualización automática cada 30 s mantiene el servicio despierto.

---

## 3. Frontend en Vercel

El archivo [`frontend/vercel.json`](../frontend/vercel.json) define:

- el build de Vite (`npm ci`, `npm run build`, carpeta de salida `dist`)
- una regla `rewrites` que envía cualquier ruta a `index.html`. Así React Router funciona al recargar o al abrir directamente rutas como `/dashboard` o `/reset-password?token=…`.

### 3.1 Crear el proyecto

1. En Vercel: **Add New → Project** → importa el repositorio de GitHub.
2. **Project Name:** el nombre que decidiste (define `https://<proyecto>.vercel.app`).
3. **Root Directory:** pulsa *Edit* y elige **`frontend`**. Este paso es imprescindible: el `package.json` del sitio está ahí.
4. **Framework Preset:** Vite (lo detecta solo).
5. Abre **Environment Variables** y agrega las del paso 3.2.
6. Pulsa **Deploy**.

### 3.2 Variables de entorno del frontend

Todas están documentadas en [`frontend/.env.example`](../frontend/.env.example). Las variables `VITE_*` se copian dentro del sitio compilado: **son públicas, nunca pongas secretos en ellas.**

| Variable | Obligatoria | Qué poner |
|---|---|---|
| `VITE_API_URL` | Sí | La URL de Render: `https://<servicio>.onrender.com`. Funciona con o sin `/api` al final. |
| `VITE_WHATSAPP_NUMBER`, `VITE_WHATSAPP_URL`, `VITE_CONTACT_PHONE`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_ADDRESS` | No | Datos de contacto que muestra el sitio. |
| `VITE_PAYMENT_METHODS`, `VITE_CANCELLATION_POLICY` | No | Respuestas del asistente sobre pagos y cancelaciones. |
| `VITE_FACEBOOK_URL`, `VITE_INSTAGRAM_URL`, `VITE_TIKTOK_URL` | No | Enlaces a redes sociales. |

Vite lee estas variables **al compilar**. Si cambias una, ve a **Deployments → ⋯ → Redeploy** para que tome efecto.

### 3.3 Enlazar los dos servicios

1. Copia el dominio de producción que muestra Vercel (**Settings → Domains**).
2. Si no coincide con el `FRONTEND_URL` que pusiste en Render, corrígelo en Render (paso 2.2). El servicio se vuelve a desplegar solo.
3. Si agregas un dominio propio en Vercel, añádelo en Render a `FRONTEND_URL` (si pasa a ser el principal) o a `CORS_ORIGINS`.

> Los despliegues de vista previa de Vercel (`https://<proyecto>-<hash>.vercel.app`) tienen otro dominio, así que CORS los bloquea. Para probar uno, agrega su URL temporalmente a `CORS_ORIGINS`.

---

## 4. Comprobar que todo funciona

Haz esta lista después de cada despliegue importante:

1. **API:** `https://<servicio>.onrender.com/api/health` responde `{"status":"ok"}`.
2. **Sitio:** `https://<proyecto>.vercel.app` carga y muestra el catálogo de servicios en la página de inicio.
3. **Conexión entre ambos:** en el navegador abre las herramientas de desarrollo (F12) → pestaña **Red/Network** y recarga. Las peticiones deben ir a `https://<servicio>.onrender.com/api/...` con estado 200, y la consola no debe mostrar errores de CORS.
4. **Rutas de React Router:** entra a `https://<proyecto>.vercel.app/login` directamente y recarga. Debe aparecer la página de inicio de sesión, no un 404 de Vercel.
5. **Registro e inicio de sesión:** crea una cuenta de cliente, cierra sesión y vuelve a entrar.
6. **Citas:** agenda una cita como cliente. En otra ventana, inicia sesión como administrador: en *Todas las citas* la cita debe aparecer en 30 segundos o menos, sin recargar.
7. **Recuperación de contraseña** (solo con SMTP configurado): pide el enlace desde *¿Olvidaste tu contraseña?*. El correo debe traer un enlace a `https://<proyecto>.vercel.app/reset-password?token=…`.

---

## 5. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El despliegue de Render falla con `No se pudo iniciar el servidor: Configura FRONTEND_URL…` | Falta `FRONTEND_URL`. | Agrégala en **Environment** (paso 2.2). |
| Log: `JWT_SECRET debe contener al menos 32 caracteres` | Secreto ausente o corto. | Genera uno nuevo (paso 2.2). |
| Log: `Error al conectar a MongoDB` o tiempo de espera agotado | La IP de Render no está permitida en Atlas, o la URI o la contraseña están mal. | Revisa el paso 1.3 (Network Access) y la URI del paso 1.4. Codifica los símbolos de la contraseña. |
| Log: `querySrv ENOTFOUND` o error de DNS | No se resolvió el registro SRV de Atlas. | Verifica que el host de la URI sea el de tu clúster. `backend/db.js` usa los DNS públicos 8.8.8.8 y 1.1.1.1; si la red los bloquea, usa la cadena de conexión estándar (no `+srv`) que ofrece Atlas en *Connect*. |
| La consola del navegador dice `blocked by CORS policy` | El dominio del sitio no coincide con `FRONTEND_URL` o `CORS_ORIGINS`. | Copia el dominio exacto (con `https://`, sin `/` final) en Render. |
| Las peticiones van a `https://<proyecto>.vercel.app/api/...` y responden 404 | Faltaba `VITE_API_URL` al compilar. | Agrégala en Vercel y haz **Redeploy**. |
| 404 de Vercel al recargar `/dashboard` | Vercel no está usando `frontend/vercel.json`. | Revisa que el *Root Directory* del proyecto sea `frontend`. |
| La primera carga tarda mucho | El servicio gratuito de Render estaba dormido. | Espera alrededor de un minuto. Si molesta, usa un plan pago de Render. |
| "La recuperación de contraseña no está configurada" | No hay SMTP. | Configura las variables `SMTP_*` (paso 2.2). |

---

## 6. Actualizaciones posteriores

- Render y Vercel vuelven a desplegar solos con cada push a la rama conectada (`autoDeploy: true` en Render; Vercel lo hace por defecto).
- El flujo de GitHub Actions (`.github/workflows/ci.yml`) corre lint, build y pruebas en cada push. Conviene esperar a que pase antes de fusionar a `main`.
- Las pruebas del backend usan un MongoDB en memoria: nunca tocan la base de Atlas de producción.

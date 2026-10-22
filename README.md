# Essence De Toi

Aplicación de reservas para el spa con frontend React/Vite y API Express/MongoDB.

## Tecnologías

- React 19.2.4
- Vite 8.0.4
- Styled Components 6.4.0
- React Router DOM 7.1.1

## Desarrollo local

Instala las dependencias del frontend y del backend:
   ```bash
   npm install
   cd backend
   npm install
   ```

Configura `backend/.env` a partir de `backend/.env.example`. Usa una URI de MongoDB Atlas, un `JWT_SECRET` aleatorio de al menos 32 caracteres y, si la base todavía no tiene administrador, las cuatro variables `BOOTSTRAP_ADMIN_*`. El administrador inicial se crea una sola vez y no se restablece en arranques posteriores. Nunca publiques esos valores.

Inicia el backend en una terminal:
   ```bash
   cd backend
   npm run dev
   ```

Inicia Vite desde otra terminal en la raíz:
   ```bash
   npm run dev
   ```

El proxy de desarrollo envía `/api` al puerto 5000. Comprueba el backend en `/api/health`. Los valores de contacto y redes sociales se configuran con las variables `VITE_CONTACT_*`, `VITE_*_URL` del `.env.local`; los campos sin configurar no muestran datos de ejemplo.

El asistente consulta los servicios, duraciones, horarios y disponibilidad actual del backend; guía a la persona al formulario, pero no confirma ni crea reservas desde el chat. Configura `VITE_WHATSAPP_NUMBER` para derivar consultas a WhatsApp, `VITE_CONTACT_EMAIL` como alternativa y, cuando el negocio los confirme, `VITE_PAYMENT_METHODS` y `VITE_CANCELLATION_POLICY` para responder esas preguntas sin inventar datos. Estas variables `VITE_*` se incluyen en el frontend compilado y no deben contener secretos.

## Comprobaciones

```bash
npm run lint
npm run build
```

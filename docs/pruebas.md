# Pruebas de software

El proyecto tiene pruebas automatizadas en el backend y en el frontend. Se ejecutan en cada push y pull request con GitHub Actions (`.github/workflows/ci.yml`), junto con el lint (análisis estático con ESLint) y el build.

| Parte | Tipo | Herramientas | Dónde |
|---|---|---|---|
| Backend | Unitarias (servicios, utilidades, middlewares, errores) | Vitest | `backend/test/unit/` |
| Backend | Integración de la API por HTTP contra un MongoDB temporal en memoria | Vitest, Supertest, mongodb-memory-server | `backend/test/integration/api.test.js` |
| Frontend | Componentes y páginas | Vitest, Testing Library, jsdom | `frontend/src/**/*.test.jsx` |
| Frontend | Utilidades (fechas, ingresos, Excel, .ics, eventos, redirección tras el login) | Vitest | `frontend/src/utils/*.test.js` |
| Ambos | Estáticas | ESLint | `npm run lint` |

## Cómo correrlas

```bash
cd backend && npm test        # la primera vez descarga el binario de MongoDB
cd frontend && npm test
npm run test:coverage         # en cada carpeta, genera el reporte de cobertura
```

## Evidencia

- Revisión del 04/11/2026 sobre la rama `mejoras-frontend` (commit `479e6d6`): el frontend pasa lint, build y sus **143 pruebas** (24 archivos); el backend pasa lint. La última corrida de GitHub Actions sobre ese commit pasó los dos trabajos (frontend y backend).
- Se agregaron dos pruebas unitarias en `backend/test/unit/service-catalog.service.test.js` para la regla nueva de no renombrar un servicio con citas próximas.
- Revisión del 07/11/2026 sobre la rama `feat-oauth`, después de agregar el inicio de sesión con Google: el backend pasa lint y sus **252 pruebas** (12 archivos); el frontend pasa lint, build y sus **187 pruebas** (34 archivos).
- Revisión general del 07/11/2026 sobre la rama `review-full`, después del carrusel de la portada y el nuevo registro: el backend pasa lint y sus **257 pruebas** (13 archivos); el frontend pasa lint, build y sus **196 pruebas** (36 archivos). Se recorrió el sitio en el navegador como visitante, cliente, estilista y administrador (1366 px y 390 px) sin desbordes, textos rotos, imágenes caídas ni errores en consola. `npm audit` queda en 0 vulnerabilidades en el backend; en el frontend quedan 2 moderadas de `uuid` dentro de `exceljs`, que no afectan al sitio (exceljs no usa la función vulnerable y su arreglo exige bajar a una versión vieja).
  - `backend/test/unit/google-auth.test.js` cubre la verificación del token de Google (firma y audiencia simuladas), la creación de cuentas, la vinculación por correo verificado, los rechazos (correo sin verificar, correo de otra cuenta de Google, cuenta desactivada, token falso) y las cuentas sin contraseña.
  - Las pruebas de integración comprueban `/api/auth/providers`, la respuesta 503 sin Client ID y el índice único de `googleId`.
  - En el frontend: `GoogleSignInButton.test.jsx`, `Profile.test.jsx`, `sessionRedirect.test.js` y los flujos de Google en `Login.test.jsx` y `Register.test.jsx`.
  - `excel.test.js` genera el archivo, lo vuelve a leer y comprueba formatos, colores de estado, totales, anchos de columna y que el texto no se ejecute como fórmula.
- Cobertura del frontend (corrida del 08/11/2026, 196 pruebas en 36 archivos): 74,3 % de líneas, 72,67 % de sentencias, 62,62 % de ramas y 64,61 % de funciones. La del backend necesita MongoDB en memoria; su última medición registrada es 86,64 % de líneas.
- [Pendiente: captura de la pestaña Actions de GitHub y del reporte de cobertura para la sustentación.]

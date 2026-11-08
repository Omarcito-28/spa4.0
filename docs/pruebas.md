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
  - `backend/test/unit/google-auth.test.js` cubre la verificación del token de Google (firma y audiencia simuladas), la creación de cuentas, la vinculación por correo verificado, los rechazos (correo sin verificar, correo de otra cuenta de Google, cuenta desactivada, token falso) y las cuentas sin contraseña.
  - Las pruebas de integración comprueban `/api/auth/providers`, la respuesta 503 sin Client ID y el índice único de `googleId`.
  - En el frontend: `GoogleSignInButton.test.jsx`, `Profile.test.jsx`, `sessionRedirect.test.js` y los flujos de Google en `Login.test.jsx` y `Register.test.jsx`.
  - `excel.test.js` genera el archivo, lo vuelve a leer y comprueba formatos, colores de estado, totales, anchos de columna y que el texto no se ejecute como fórmula.
- [Pendiente: captura de la pestaña Actions de GitHub y del reporte de cobertura para la sustentación.]

# Pruebas de software

El proyecto tiene pruebas automatizadas en el backend y en el frontend. Se ejecutan en cada push y pull request con GitHub Actions (`.github/workflows/ci.yml`), junto con el lint (análisis estático con ESLint) y el build.

| Parte | Tipo | Herramientas | Dónde |
|---|---|---|---|
| Backend | Unitarias (servicios, utilidades, middlewares, errores) | Vitest | `backend/test/unit/` |
| Backend | Integración de la API por HTTP contra un MongoDB temporal en memoria | Vitest, Supertest, mongodb-memory-server | `backend/test/integration/api.test.js` |
| Frontend | Componentes y páginas | Vitest, Testing Library, jsdom | `frontend/src/**/*.test.jsx` |
| Frontend | Utilidades (fechas, CSV, .ics, eventos) | Vitest | `frontend/src/utils/*.test.js` |
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
- [Pendiente: captura de la pestaña Actions de GitHub y del reporte de cobertura para la sustentación.]

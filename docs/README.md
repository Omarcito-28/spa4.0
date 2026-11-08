# Documentación del proyecto

Entregables de **Essence De Toi**, el sistema web de control operativo y agendamiento para Centros de Cuidado Personal (Ingeniería de Software Orientada a Objetos, Universidad Surcolombiana, docente Eduardo Martínez Vidal).

| Integrante | Código | Correo |
|------------|--------|--------|
| Lauren Dayanna Villanueva Camero | 20241220012 | u20241220012@usco.edu.co |
| Omar Gabriel Viana Sepúlveda | 20232218083 | u20232218083@usco.edu.co |
| Carlos Esteban Castro Caicedo | 20231213568 | u20231213568@usco.edu.co |
| Carlos David Neira Vega | 20232215447 | u20232215447@usco.edu.co |

La instalación, la arquitectura del código y los datos de prueba están en el [README principal](../README.md).

Cada carpeta corresponde a un entregable de las condiciones del proyecto final (`CONDICIONES_PARCIAL_FINAL.pdf`). Los entregables 3 a 11 son los nueve documentos que siguen las plantillas del docente; el 1 (proceso de desarrollo) y el 2 (prototipo en Figma) también se piden en las condiciones.

| # | Entregable | Dónde está | Estado |
|---|------------|------------|--------|
| 1 | Proceso de desarrollo (esquema gráfico, fases, actividades, tareas y roles) | [`01-proceso-de-desarrollo/`](01-proceso-de-desarrollo/) | Listo (versión 1.1, siete sprints con fechas) |
| 2 | Prototipo de la solución (Figma) | [`02-prototipo/`](02-prototipo/) | Listo: enlace de Figma y capturas de la versión 1.3 (08/11/2026) |
| 3 | Propuesta | [`03-propuesta/`](03-propuesta/) | Listo (versión 1.2, plan de siete sprints y honorarios estimados) |
| 4 | Documento de requerimientos | [`04-requerimientos/`](04-requerimientos/) | Listo (versión 1.3: REQ-01 a REQ-40) |
| 5 | Historias de usuario (Excel y tarjetas) | [`05-historias-de-usuario/`](05-historias-de-usuario/) | Listo (EDT-HU-001 a EDT-HU-038 y EDT-HT-004, con capturas) |
| 6 | Pila del producto (Product Backlog) | [`06-pila-del-producto/`](06-pila-del-producto/) | Listo (historias hasta EDT-HU-038) |
| 7 | Lista de tareas de la iteración (Sprint Backlog) | [`07-lista-de-tareas/`](07-lista-de-tareas/) | Listo (sprints 4 a 7, con fechas y responsables) |
| 8 | SAD (documento de arquitectura) | [`08-sad/`](08-sad/) | Listo (Google Identity, HeroSlide y ExcelJS) |
| 9 | UML: clases, secuencia, componentes y actividades (más despliegue) | [`09-uml/`](09-uml/) | Listo: imágenes regeneradas desde las fuentes `.mmd` |
| 10 | Lógica de los datos (MongoDB, base no relacional) | [`10-logica-de-datos/`](10-logica-de-datos/) | Listo (versión 1.1, con `heroslides` y `users.googleId`) |
| 11 | Uso de inteligencia artificial | [`11-uso-de-ia/`](11-uso-de-ia/) | Listo (con enlace a las evidencias) |
| — | Pruebas de software | [`pruebas.md`](pruebas.md) | Listo |
| — | Despliegue en la nube | [`despliegue.md`](despliegue.md) | Guía lista; falta publicar |

## Pendientes del equipo

Busca `[Pendiente` dentro de los documentos. Solo quedan los que necesitan evidencia real:

- Evidencias de la entrevista o encuesta al salón (Propuesta y SAD).
- Aporte del docente en la sesión de QAW y la medición con usuarios del tiempo de reserva (SAD).
- Borrar `backend/data/*.json` del repositorio y cambiar la contraseña de MongoDB Atlas y el `JWT_SECRET`; después, publicar en Render y Vercel y poner la URL en la Propuesta.
- Archivo del pendón para INNOVASOFT (Propuesta).
- Captura de la pestaña Actions de GitHub para la sustentación ([`pruebas.md`](pruebas.md)).

## Convenciones

- Los documentos siguen las plantillas del docente (Word y Excel). Los diagramas se generan con Mermaid; las fuentes `.mmd` están junto a cada imagen para poder editarlos.
- No guardes aquí contraseñas, URIs de bases de datos ni otros secretos.

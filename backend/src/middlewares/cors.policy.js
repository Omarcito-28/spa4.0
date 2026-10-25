// Orígenes que pueden llamar a la API desde el navegador: FRONTEND_URL más los
// de CORS_ORIGINS (separados por comas). Sin ninguno configurado (desarrollo local
// y pruebas) se acepta cualquier origen, como antes.
export default class CorsPolicy {
  #origins;

  constructor(origins = []) {
    this.#origins = new Set(origins.map(CorsPolicy.#normalize).filter(Boolean));
  }

  static fromEnv(env = process.env) {
    return new CorsPolicy([env.FRONTEND_URL, ...(env.CORS_ORIGINS || '').split(',')]);
  }

  get allowsAnyOrigin() {
    return this.#origins.size === 0;
  }

  get origins() {
    return [...this.#origins];
  }

  // Las peticiones sin Origin (health checks, curl, servidor a servidor) no son de un navegador.
  isAllowed(origin) {
    return this.allowsAnyOrigin || !origin || this.#origins.has(CorsPolicy.#normalize(origin));
  }

  // Opciones para el paquete `cors`: a un origen no permitido no se le envían
  // cabeceras CORS y el navegador bloquea la respuesta.
  toOptions() {
    return { origin: (origin, callback) => callback(null, this.isAllowed(origin)) };
  }

  static #normalize(origin) {
    return (origin || '').trim().replace(/\/+$/, '').toLowerCase();
  }
}

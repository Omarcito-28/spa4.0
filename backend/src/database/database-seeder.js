// Datos iniciales de MongoDB: bloqueo de reservas, administrador y catálogo.
export default class DatabaseSeeder {
  static DEFAULT_SERVICES = Object.freeze([
    {
      name: 'Manicura Clásica',
      description: 'Servicio completo de manicura que incluye limado, pulido y esmaltado para unas manos perfectamente cuidadas y elegantes.',
      price: '$30.000',
      image: '/images/services/manicura_clasica.jpg'
    },
    {
      name: 'Tintura de Cabello',
      description: 'Coloración profesional con productos de alta calidad para un color vibrante, uniforme y de larga duración en tu cabello.',
      price: '$150.000',
      image: '/images/services/tintura.webp'
    },
    {
      name: 'Tratamiento Capilar',
      description: 'Tratamiento nutritivo e hidratante para restaurar la salud, brillo y suavidad de tu cabello dañado o reseco.',
      price: '$60.000',
      image: '/images/services/tratamiento_capilar.webp'
    },
    {
      name: 'Corte para Dama',
      description: 'Corte de cabello profesional para mujer, adaptado a tu tipo de rostro y estilo personal con acabado impecable.',
      price: '$35.000',
      image: '/images/services/corte_dama.jpg'
    },
    {
      name: 'Peinado para Evento',
      description: 'Peinados elegantes y creativos para bodas, graduaciones y eventos especiales que te harán lucir espectacular.',
      price: '$200.000',
      image: '/images/services/peinado_evento.jpg'
    },
    {
      name: 'Masaje Relajante',
      description: 'Masaje terapéutico para aliviar el estrés, relajar tensiones musculares y renovar tu energía.',
      price: '$70.000',
      image: '/images/services/masaje.jpg'
    }
  ].map(Object.freeze));

  #users;
  #services;
  #locks;
  #hasher;
  #env;

  constructor({ userModel, serviceModel, bookingLockService, passwordHasher, env = process.env }) {
    this.#users = userModel;
    this.#services = serviceModel;
    this.#locks = bookingLockService;
    this.#hasher = passwordHasher;
    this.#env = env;
  }

  async run() {
    await this.#locks.initialize();
    await this.#seedAdmin();
    await this.#seedServices();
    await this.#repairServiceDescriptions();
  }

  async #seedAdmin() {
    if (await this.#users.countDocuments({ role: 'ADMIN' })) return;
    const { BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME } = this.#env;
    if (!BOOTSTRAP_ADMIN_USERNAME || !BOOTSTRAP_ADMIN_PASSWORD || !BOOTSTRAP_ADMIN_EMAIL || !BOOTSTRAP_ADMIN_NAME) {
      console.warn('⚠️ No hay administrador. Configura BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_NAME para crear uno.');
      return;
    }
    await this.#users.create({
      username: BOOTSTRAP_ADMIN_USERNAME.trim().toLowerCase(),
      password: await this.#hasher.hash(BOOTSTRAP_ADMIN_PASSWORD, 12),
      email: BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(),
      fullName: BOOTSTRAP_ADMIN_NAME.trim(),
      role: 'ADMIN'
    });
    console.log('✅ Administrador inicial creado desde variables de entorno.');
  }

  async #seedServices() {
    if (await this.#services.countDocuments()) return;
    await this.#services.insertMany(DatabaseSeeder.DEFAULT_SERVICES.map(service => ({ ...service })));
    console.log('✅ Servicios iniciales creados.');
  }

  // Las bases sembradas con la versión anterior guardaron la descripción con
  // caracteres de reemplazo (U+FFFD); se corrige sin tocar ediciones del administrador.
  async #repairServiceDescriptions() {
    for (const service of DatabaseSeeder.DEFAULT_SERVICES) {
      await this.#services.updateMany(
        { name: service.name, description: { $regex: '\uFFFD' } },
        { $set: { description: service.description } }
      );
    }
  }
}

// Espacios de trabajo con layout propio (sidebar) según el rol. El Navbar público
// solo enlaza a la raíz de cada uno desde el menú de la cuenta.
// `end` evita que el enlace a la raíz quede activo en las subrutas.
export const WORKSPACES = {
  ADMIN: {
    root: '/admin',
    linkLabel: 'Panel de Administración',
    linkIcon: 'fa-gauge-high',
    area: 'Administración',
    roleLabel: 'Administrador',
    navLabel: 'Secciones de administración',
    profile: '/admin/profile',
    sections: [
      {
        title: 'General',
        links: [
          { to: '/admin', label: 'Dashboard', icon: 'fa-gauge-high', end: true },
        ],
      },
      {
        title: 'Operación',
        links: [
          { to: '/admin/appointments', label: 'Citas y reservas', icon: 'fa-calendar-check' },
          { to: '/admin/agenda', label: 'Agenda y cierres', icon: 'fa-calendar-xmark' },
        ],
      },
      {
        title: 'Gestión',
        links: [
          { to: '/admin/services', label: 'Catálogo de servicios', icon: 'fa-spa' },
          { to: '/admin/home-carousel', label: 'Carrusel del inicio', icon: 'fa-images' },
          { to: '/admin/users', label: 'Usuarios', icon: 'fa-users' },
        ],
      },
      {
        title: 'Análisis',
        links: [
          { to: '/admin/reports', label: 'Reportes', icon: 'fa-chart-line' },
        ],
      },
    ],
  },
  STYLIST: {
    root: '/stylist',
    linkLabel: 'Mi Panel',
    linkIcon: 'fa-gauge-high',
    area: 'Espacio de estilista',
    roleLabel: 'Estilista',
    navLabel: 'Secciones del panel de estilista',
    profile: '/stylist/profile',
    sections: [
      {
        title: 'General',
        links: [
          { to: '/stylist', label: 'Mi panel', icon: 'fa-gauge-high', end: true },
        ],
      },
      {
        title: 'Mi trabajo',
        links: [
          { to: '/stylist/appointments', label: 'Mis citas', icon: 'fa-calendar-check' },
          { to: '/stylist/history', label: 'Historial de citas', icon: 'fa-clock-rotate-left' },
          { to: '/stylist/schedule', label: 'Mi horario', icon: 'fa-business-time' },
        ],
      },
    ],
  },
};

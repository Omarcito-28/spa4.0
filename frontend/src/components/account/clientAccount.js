// Secciones del área "Mi cuenta" del cliente: pestañas del layout y botón "Mi cuenta" del Navbar.
export const CLIENT_ACCOUNT_LINKS = [
  { to: '/dashboard', label: 'Mi Panel', icon: 'fa-gauge-high' },
  { to: '/appointments/my', label: 'Mis Citas', icon: 'fa-calendar-check' },
  { to: '/appointments/new', label: 'Agendar Cita', icon: 'fa-calendar-plus' },
  { to: '/profile', label: 'Mi Perfil', icon: 'fa-user-pen' },
];

export const isClientAccountPath = pathname => CLIENT_ACCOUNT_LINKS.some(link => link.to === pathname);

// Enlace de reserva con el servicio ya elegido; si no hay sesión pasa por el login y vuelve.
export const bookingPath = (serviceName, isAuthenticated) => {
  const target = `/appointments/new?service=${encodeURIComponent(serviceName)}`;
  return isAuthenticated ? target : `/login?returnTo=${encodeURIComponent(target)}`;
};

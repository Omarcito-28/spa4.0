import { WORKSPACES } from '../components/dashboard/workspaces';

// A dónde ir después de iniciar sesión o crear la cuenta:
// 1. Administrador y estilista van a su panel.
// 2. Un cliente que venía de reservar o de ver sus citas vuelve ahí.
// 3. Un cliente nuevo (creado con Google) va a su perfil a completar el teléfono.
// 4. El resto de clientes, a su panel.
const RETURN_PATHS = ['/appointments/new', '/appointments/my'];

export const pathAfterLogin = (user, { returnTo, isNewUser = false } = {}) => {
  const workspace = WORKSPACES[user?.role];
  if (workspace) return workspace.root;
  // Solo rutas propias conocidas: evita redirigir a otro sitio con ?returnTo=.
  if (RETURN_PATHS.some(path => returnTo === path || returnTo?.startsWith(`${path}?`))) return returnTo;
  return isNewUser ? '/profile' : '/dashboard';
};

import { WORKSPACES } from '../components/dashboard/workspaces';

// A dónde ir después de iniciar sesión o crear la cuenta:
// 1. Si venía de reservar, vuelve a la reserva.
// 2. Administrador y estilista van a su panel.
// 3. Un cliente nuevo (creado con Google) va a su perfil a completar el teléfono.
// 4. El resto de clientes, a su panel.
export const pathAfterLogin = (user, { returnTo, isNewUser = false } = {}) => {
  if (returnTo?.startsWith('/appointments/new')) return returnTo;
  const workspace = WORKSPACES[user?.role];
  if (workspace) return workspace.root;
  return isNewUser ? '/profile' : '/dashboard';
};

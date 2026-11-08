import { NavLink, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const MOBILE = '992px';
// Altura del Navbar público fijo: el sidebar se pega justo debajo.
const NAVBAR_OFFSET = '88px';

const CLIENT_ACCOUNT_LINKS = [
  { to: '/dashboard', label: 'Mi panel', icon: 'fa-gauge-high' },
  { to: '/appointments/my', label: 'Mis citas', icon: 'fa-calendar-check' },
  { to: '/appointments/new', label: 'Agendar cita', icon: 'fa-calendar-plus' },
  { to: '/profile', label: 'Mi perfil', icon: 'fa-user-pen' },
];

const Shell = styled.div`
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  align-items: start;
  gap: 1.5rem;
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem 1.5rem 0;

  @media (max-width: ${MOBILE}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 1rem 1rem 0;
  }
`;

const Aside = styled.aside`
  position: sticky;
  top: ${NAVBAR_OFFSET};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${theme.colors.sidebarBorder};
  border-radius: ${theme.borderRadius.medium};
  background: linear-gradient(180deg, ${theme.colors.sidebarBg} 0%, ${theme.colors.sidebarBgEnd} 100%);
  box-shadow: 0 12px 32px rgba(26, 20, 11, 0.16);
  color: ${theme.colors.sidebarText};

  @media (max-width: ${MOBILE}) {
    position: static;
    border-radius: 14px;
  }
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.1rem 1.1rem;
  border-bottom: 1px solid ${theme.colors.sidebarBorder};

  div {
    min-width: 0;
    line-height: 1.25;
  }

  strong {
    display: block;
    overflow: hidden;
    color: white;
    font-size: 1.02rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: ${theme.colors.accent};
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  @media (max-width: ${MOBILE}) {
    display: none;
  }
`;

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  font-weight: 700;
  text-transform: uppercase;
`;

const Nav = styled.nav`
  padding: 0.85rem 0.75rem 1rem;

  p {
    margin: 0 0 0.4rem;
    padding: 0 0.75rem;
    color: ${theme.colors.sidebarMuted};
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  @media (max-width: ${MOBILE}) {
    padding: 0.4rem;

    p {
      display: none;
    }

    /* En móvil el menú es una fila de pestañas desplazable. */
    ul {
      flex-direction: row;
      overflow-x: auto;
      scrollbar-width: none;
    }

    li {
      flex-shrink: 0;
    }
  }
`;

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  color: ${theme.colors.sidebarText};
  font-size: 1.05rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};

  i {
    width: 20px;
    color: ${theme.colors.accent};
    font-size: 0.95rem;
    text-align: center;
  }

  &:hover {
    background: rgba(201, 148, 42, 0.1);
    color: white;
    text-decoration: none;
  }

  &.active {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 4px 14px rgba(153, 101, 21, 0.35);
    color: white;

    i {
      color: white;
    }
  }

  @media (max-width: ${MOBILE}) {
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.98rem;
  }
`;

const Content = styled.div`
  min-width: 0;

  /* Páginas con fondo propio (p. ej. la reserva) se integran como una tarjeta redondeada. */
  > * {
    border-radius: ${theme.borderRadius.medium};
  }
`;

// Área "Mi cuenta" del cliente dentro del sitio público (con Navbar y Footer):
// un menú lateral con sus opciones siempre a la vista. El administrador y el
// estilista tienen su propio panel, así que para ellos solo se muestra la página.
function ClientAccountLayout({ user }) {
  if (user?.role !== 'CLIENT') return <Outlet />;
  const displayName = user.fullName || user.username;

  return (
    <Shell>
      <Aside aria-label="Mi cuenta">
        <UserCard>
          <Avatar aria-hidden="true">{displayName.charAt(0)}</Avatar>
          <div>
            <strong>{displayName}</strong>
            <small>Cliente</small>
          </div>
        </UserCard>
        <Nav aria-label="Opciones de mi cuenta">
          <p>Mi cuenta</p>
          <ul>
            {CLIENT_ACCOUNT_LINKS.map(link => (
              <li key={link.to}>
                <Item to={link.to} end>
                  <i className={`fas ${link.icon}`} aria-hidden="true"></i>{link.label}
                </Item>
              </li>
            ))}
          </ul>
        </Nav>
      </Aside>
      <Content>
        <Outlet />
      </Content>
    </Shell>
  );
}

export default ClientAccountLayout;

import { Link, NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export const SIDEBAR_WIDTH = '272px';
export const ADMIN_MOBILE = '992px';

// Secciones del panel. `end` evita que "Dashboard" (/admin) quede activo en las subrutas.
const ADMIN_SECTIONS = [
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
      { to: '/admin/users', label: 'Usuarios', icon: 'fa-users' },
    ],
  },
  {
    title: 'Análisis',
    links: [
      { to: '/admin/reports', label: 'Reportes', icon: 'fa-chart-line' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { to: '/admin/profile', label: 'Mi perfil', icon: 'fa-user-pen' },
    ],
  },
];

const Aside = styled.aside`
  position: sticky;
  top: 0;
  z-index: 1040;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: ${SIDEBAR_WIDTH};
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(180deg, ${theme.colors.sidebarBg} 0%, ${theme.colors.sidebarBgEnd} 100%);
  border-right: 1px solid ${theme.colors.sidebarBorder};
  color: ${theme.colors.sidebarText};

  @media (max-width: ${ADMIN_MOBILE}) {
    position: fixed;
    left: 0;
    width: min(${SIDEBAR_WIDTH}, 85vw);
    box-shadow: ${props => props.$open ? '12px 0 40px rgba(0, 0, 0, 0.35)' : 'none'};
    transform: translateX(${props => props.$open ? '0' : '-100%'});
    /* Cerrado no debe recibir foco con el teclado. */
    visibility: ${props => props.$open ? 'visible' : 'hidden'};
    transition: transform ${theme.transitions.normal}, visibility ${theme.transitions.normal};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.25rem 1.4rem 1.1rem;
  border-bottom: 1px solid ${theme.colors.sidebarBorder};

  @media (max-width: ${ADMIN_MOBILE}) {
    padding-inline: 1rem;
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  box-shadow: 0 4px 14px rgba(153, 101, 21, 0.35);
  color: white;
  font-size: 1.15rem;
`;

const BrandText = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.1;

  strong {
    color: ${theme.colors.navbarLinkHover};
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    white-space: nowrap;

    @media (max-width: ${ADMIN_MOBILE}) {
      font-size: 1.35rem;
    }
  }

  span {
    margin-top: 0.15rem;
    color: ${theme.colors.sidebarMuted};
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }
`;

const CloseButton = styled.button`
  display: none;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid ${theme.colors.sidebarBorder};
  border-radius: ${theme.borderRadius.small};
  background: rgba(255, 255, 255, 0.04);
  color: ${theme.colors.sidebarText};
  font-size: 1.05rem;

  @media (max-width: ${ADMIN_MOBILE}) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.9rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(201, 148, 42, 0.35) transparent;
`;

const Section = styled.div`
  & + & {
    margin-top: 1.1rem;
  }
`;

const SectionTitle = styled.p`
  margin: 0 0 0.35rem;
  padding: 0 0.75rem;
  color: ${theme.colors.sidebarMuted};
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
`;

const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const itemStyles = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  border-radius: 10px;
  background: none;
  color: ${theme.colors.sidebarText};
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};

  i {
    width: 20px;
    color: ${theme.colors.accent};
    font-size: 0.95rem;
    text-align: center;
    opacity: 0.85;
    transition: color ${theme.transitions.fast}, opacity ${theme.transitions.fast};
  }

  &:hover {
    background: rgba(201, 148, 42, 0.1);
    color: white;
    text-decoration: none;

    i {
      opacity: 1;
    }
  }
`;

const Item = styled(NavLink)`
  ${itemStyles}

  &.active {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 4px 14px rgba(153, 101, 21, 0.35);
    color: white;

    i {
      color: white;
      opacity: 1;
    }
  }
`;

const Footer = styled.div`
  padding: 0.85rem 0.9rem 1rem;
  border-top: 1px solid ${theme.colors.sidebarBorder};
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 0.6rem 0.6rem 0.6rem 0.75rem;
  border: 1px solid ${theme.colors.sidebarBorder};
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);

  div {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }

  strong {
    display: block;
    overflow: hidden;
    color: white;
    font-size: 1rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${theme.colors.accent};
    font-size: 0.82rem;
    font-weight: 700;
  }
`;

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  font-weight: 700;
  text-transform: uppercase;
`;

const FooterLink = styled(Link)`
  ${itemStyles}
`;

const LogoutButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid ${theme.colors.sidebarBorder};
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: ${theme.colors.sidebarText};
  font-size: 0.95rem;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  &:hover {
    border-color: rgba(231, 76, 60, 0.4);
    background: rgba(231, 76, 60, 0.16);
    color: #ffb4ab;
  }
`;

function AdminSidebar({ user, onLogout, open = false, onClose }) {
  const displayName = user?.fullName || user?.username || 'Administrador';

  return (
    <Aside id="admin-sidebar" $open={open} aria-label="Menú de administración">
      <Header>
        <Brand to="/admin" aria-label="Essence De Toi · Panel de administración">
          <BrandMark aria-hidden="true">✦</BrandMark>
          <BrandText>
            <strong>Essence De Toi</strong>
            <span>Administración</span>
          </BrandText>
        </Brand>
        <CloseButton type="button" aria-label="Cerrar menú" onClick={onClose}>
          <i className="fas fa-times" aria-hidden="true"></i>
        </CloseButton>
      </Header>

      <Nav aria-label="Secciones de administración">
        {ADMIN_SECTIONS.map(section => (
          <Section key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            <NavList>
              {section.links.map(link => (
                <li key={link.to}>
                  <Item to={link.to} end={link.end}>
                    <i className={`fas ${link.icon}`} aria-hidden="true"></i>
                    {link.label}
                  </Item>
                </li>
              ))}
            </NavList>
          </Section>
        ))}
      </Nav>

      <Footer>
        <UserCard>
          <Avatar aria-hidden="true">{displayName.charAt(0)}</Avatar>
          <div>
            <strong>{displayName}</strong>
            <span>Administrador</span>
          </div>
          <LogoutButton type="button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
          </LogoutButton>
        </UserCard>
        <FooterLink to="/">
          <i className="fas fa-arrow-left" aria-hidden="true"></i>Volver al sitio público
        </FooterLink>
      </Footer>
    </Aside>
  );
}

export default AdminSidebar;

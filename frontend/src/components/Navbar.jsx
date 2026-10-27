import { useState, useEffect, useRef } from 'react';
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { theme } from '../styles/theme';

const MOBILE = '992px';

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const glowPulse = keyframes`
  0%, 100% { text-shadow: 0 0 4px rgba(201, 148, 42, 0.3), 0 0 8px rgba(153, 101, 21, 0.15); }
  50% { text-shadow: 0 0 12px rgba(201, 148, 42, 0.6), 0 0 24px rgba(153, 101, 21, 0.3); }
`;

const borderShine = keyframes`
  0% { border-color: rgba(153, 101, 21, 0.05); }
  50% { border-color: rgba(201, 148, 42, 0.35); }
  100% { border-color: rgba(153, 101, 21, 0.05); }
`;

const buttonGlow = keyframes`
  0%, 100% { box-shadow: 0 2px 10px rgba(153, 101, 21, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(153, 101, 21, 0.55), 0 0 30px rgba(201, 148, 42, 0.15); }
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NavbarContainer = styled.nav`
  position: sticky;
  top: 0;
  z-index: 1030;
  background-color: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: ${props => props.$scrolled
    ? '0 4px 30px rgba(0, 0, 0, 0.3)'
    : '0 1px 0 rgba(255,255,255,0.05)'};
  padding: 0;
  transition: all ${theme.transitions.normal};
  border-bottom: 1px solid rgba(153, 101, 21, ${props => props.$scrolled ? '0.2' : '0.05'});
  animation: ${borderShine} 4s ease-in-out infinite;
`;

const Container = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: ${MOBILE}) {
    flex-wrap: wrap;
  }
`;

const Brand = styled(Link)`
  font-family: ${theme.fonts.primary};
  font-size-adjust: none;
  font-size: 2.2rem;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: all ${theme.transitions.normal};
  position: relative;
  background: linear-gradient(
    90deg,
    ${theme.colors.primary} 0%,
    ${theme.colors.navbarLinkHover} 25%,
    #fff 50%,
    ${theme.colors.navbarLinkHover} 75%,
    ${theme.colors.primary} 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 4s linear infinite, ${glowPulse} 3s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.navbarLinkHover});
    transition: width ${theme.transitions.normal};
  }

  &:hover {
    text-decoration: none;

    &::after {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

const MenuToggle = styled.button`
  display: none;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(201, 148, 42, 0.35);
  border-radius: ${theme.borderRadius.small};
  background: rgba(153, 101, 21, 0.1);
  color: ${theme.colors.navbarText};
  font-size: 1.2rem;

  @media (max-width: ${MOBILE}) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  align-items: center;

  @media (max-width: ${MOBILE}) {
    display: ${props => props.$open ? 'flex' : 'none'};
    flex-basis: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.15rem;
    padding: 0.75rem 0 0.5rem;
    border-top: 1px solid rgba(201, 148, 42, 0.15);
    animation: ${dropIn} 0.2s ease-out;
  }
`;

const Separator = styled.li`
  width: 1px;
  height: 26px;
  margin: 0 0.5rem;
  background: rgba(201, 148, 42, 0.25);

  @media (max-width: ${MOBILE}) {
    width: auto;
    height: 1px;
    margin: 0.4rem 0;
  }
`;

const linkStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: ${theme.colors.navbarText};
  font-family: ${theme.fonts.secondary};
  font-size-adjust: ${theme.fonts.secondaryAdjust};
  font-weight: 500;
  font-size: 1.15rem;
  text-decoration: none;
  transition: all ${theme.transitions.normal};
  padding: 0.5rem 0.9rem;
  border-radius: ${theme.borderRadius.small};
  position: relative;
  letter-spacing: 0.3px;
  white-space: nowrap;

  i {
    font-size: 0.85em;
    opacity: 0.85;
  }

  &:hover {
    color: ${theme.colors.navbarLinkHover};
    text-decoration: none;
    background: rgba(153, 101, 21, 0.08);
  }

  @media (max-width: ${MOBILE}) {
    width: 100%;
    padding: 0.7rem 0.9rem;
  }
`;

const NavLink = styled(RouterNavLink)`
  ${linkStyles}

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: ${theme.colors.navbarLinkHover};
    transition: width ${theme.transitions.normal};
    border-radius: 2px;
  }

  &:hover::before,
  &.active::before {
    width: 60%;
  }

  &.active {
    color: ${theme.colors.navbarLinkHover};
    background: rgba(153, 101, 21, 0.12);
  }

  @media (max-width: ${MOBILE}) {
    &::before {
      display: none;
    }
  }
`;

const LoginButton = styled(Link)`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  border: none;
  color: white;
  padding: 0.55rem 1.5rem;
  margin-left: 0.5rem;
  border-radius: ${theme.borderRadius.pill};
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
  transition: all ${theme.transitions.normal};
  letter-spacing: 0.3px;
  animation: ${buttonGlow} 3s ease-in-out infinite;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(153, 101, 21, 0.5);
    color: white;
    text-decoration: none;
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${MOBILE}) {
    display: block;
    margin: 0.5rem 0 0;
  }
`;

const Dropdown = styled.li`
  position: relative;
`;

const DropdownButton = styled.button`
  ${linkStyles}
  background: ${props => props.$active ? 'rgba(153, 101, 21, 0.12)' : 'none'};
  border: none;
  cursor: pointer;
  color: ${props => props.$active ? theme.colors.navbarLinkHover : theme.colors.navbarText};

  .caret {
    font-size: 0.7em;
    transition: transform ${theme.transitions.fast};
    transform: rotate(${props => props.$open ? '180deg' : '0'});
  }

  @media (max-width: ${MOBILE}) {
    justify-content: flex-start;

    .caret {
      margin-left: auto;
    }
  }
`;

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const DropdownContent = styled.div`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  position: absolute;
  right: 0;
  background: rgba(20, 20, 20, 0.98);
  backdrop-filter: blur(16px);
  min-width: 250px;
  box-shadow: ${theme.shadows.large};
  border-radius: ${theme.borderRadius.medium};
  z-index: 10;
  margin-top: 0.5rem;
  padding: 0.4rem 0;
  border: 1px solid rgba(153, 101, 21, 0.2);
  overflow: hidden;
  animation: ${dropIn} 0.2s ease-out;

  a, button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.7rem 1.25rem;
    border: none;
    background: none;
    text-align: left;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.9);
    font: inherit;
    font-size: 1.08rem;
    cursor: pointer;
    transition: all ${theme.transitions.fast};

    i {
      width: 18px;
      color: ${theme.colors.accent};
      text-align: center;
    }

    &:hover, &.active {
      background: rgba(153, 101, 21, 0.15);
      color: ${theme.colors.navbarLinkHover};
    }
  }

  @media (max-width: ${MOBILE}) {
    position: static;
    margin: 0.2rem 0 0.4rem 1rem;
    min-width: 0;
    box-shadow: none;
    background: rgba(255, 255, 255, 0.03);
  }
`;

const MenuSection = styled.p`
  margin: 0;
  padding: 0.55rem 1.25rem 0.3rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;

  & + a {
    margin-top: 0.1rem;
  }
`;

const MenuDivider = styled.hr`
  margin: 0.4rem 0;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const UserCard = styled.div`
  padding: 0.6rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 0.3rem;

  strong {
    display: block;
    color: white;
    font-size: 1.05rem;
  }

  span {
    color: ${theme.colors.accent};
    font-size: 0.88rem;
    font-weight: 600;
  }
`;

const ROLE_LABELS = { ADMIN: 'Administrador', STYLIST: 'Estilista', CLIENT: 'Cliente' };

// Enlaces principales según el rol. Lo que no cabe aquí va en el menú "Gestión" (admin) o en el del usuario.
const PRIMARY_LINKS = {
  GUEST: [
    { to: '/', label: 'Inicio', end: true },
    { to: '/services', label: 'Servicios' },
    { to: '/contact', label: 'Contáctanos' },
    { to: '/appointments/new', label: 'Agendar Cita' },
  ],
  CLIENT: [
    { to: '/', label: 'Inicio', end: true },
    { to: '/services', label: 'Servicios' },
    { to: '/dashboard', label: 'Mi Panel', icon: 'fa-gauge' },
    { to: '/appointments/my', label: 'Mis Citas', icon: 'fa-calendar-check' },
    { to: '/appointments/new', label: 'Agendar Cita', icon: 'fa-plus' },
    { to: '/contact', label: 'Contáctanos' },
  ],
  STYLIST: [
    { to: '/', label: 'Inicio', end: true },
    { to: '/services', label: 'Servicios' },
    { to: '/stylist/dashboard', label: 'Mi Panel', icon: 'fa-gauge' },
    { to: '/stylist/appointments', label: 'Mis Citas', icon: 'fa-calendar-check' },
    { to: '/stylist/schedule', label: 'Mi Horario', icon: 'fa-clock' },
  ],
  ADMIN: [
    { to: '/', label: 'Inicio', end: true },
    { to: '/services', label: 'Servicios' },
    { to: '/admin/dashboard', label: 'Panel', icon: 'fa-gauge' },
    { to: '/appointments/all', label: 'Citas', icon: 'fa-calendar-alt' },
  ],
};

// Secciones del menú "Gestión" del administrador.
const ADMIN_MENU = [
  {
    title: 'Administrar',
    links: [
      { to: '/admin/users', label: 'Usuarios', icon: 'fa-users-cog' },
      { to: '/admin/services', label: 'Catálogo de servicios', icon: 'fa-concierge-bell' },
      { to: '/admin/agenda', label: 'Agenda y cierres', icon: 'fa-calendar-times' },
    ],
  },
  {
    title: 'Análisis',
    links: [
      { to: '/admin/reports', label: 'Reportes', icon: 'fa-chart-line' },
    ],
  },
];
const ADMIN_MENU_PATHS = ADMIN_MENU.flatMap(section => section.links.map(link => link.to));

function Navbar({ isAuthenticated = false, user = null, onLogout }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Al navegar se cierran los menús abiertos.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clic fuera del navbar o Escape cierran el menú desplegable.
  useEffect(() => {
    if (!openMenu && !mobileOpen) return undefined;
    const handlePointer = event => {
      if (!navRef.current?.contains(event.target)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const handleKey = event => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenu, mobileOpen]);

  const toggleMenu = name => setOpenMenu(current => (current === name ? null : name));
  const role = isAuthenticated && user ? user.role : 'GUEST';
  const links = PRIMARY_LINKS[role] ?? PRIMARY_LINKS.CLIENT;
  const adminSectionActive = ADMIN_MENU_PATHS.includes(location.pathname);
  const displayName = user?.fullName || user?.username || '';

  return (
    <NavbarContainer $scrolled={scrolled} ref={navRef} aria-label="Navegación principal">
      <Container>
        <Brand to="/">✦ Essence De Toi</Brand>

        <MenuToggle
          type="button"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="main-menu"
          onClick={() => setMobileOpen(open => !open)}
        >
          <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
        </MenuToggle>

        <NavLinks id="main-menu" $open={mobileOpen}>
          {links.map(link => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end}>
                {link.icon && <i className={`fas ${link.icon}`} aria-hidden="true"></i>}
                {link.label}
              </NavLink>
            </li>
          ))}

          {role === 'ADMIN' && (
            <Dropdown>
              <DropdownButton
                type="button"
                $open={openMenu === 'admin'}
                $active={adminSectionActive}
                aria-haspopup="true"
                aria-expanded={openMenu === 'admin'}
                onClick={() => toggleMenu('admin')}
              >
                <i className="fas fa-shield-alt" aria-hidden="true"></i>
                Gestión
                <i className="fas fa-chevron-down caret" aria-hidden="true"></i>
              </DropdownButton>
              <DropdownContent $isOpen={openMenu === 'admin'}>
                {ADMIN_MENU.map((section, index) => (
                  <div key={section.title}>
                    {index > 0 && <MenuDivider />}
                    <MenuSection>{section.title}</MenuSection>
                    {section.links.map(link => (
                      <RouterNavLink key={link.to} to={link.to}>
                        <i className={`fas ${link.icon}`} aria-hidden="true"></i>{link.label}
                      </RouterNavLink>
                    ))}
                  </div>
                ))}
              </DropdownContent>
            </Dropdown>
          )}

          {role === 'GUEST' && (
            <li><LoginButton to="/login">Iniciar Sesión</LoginButton></li>
          )}

          {role !== 'GUEST' && (
            <>
              <Separator aria-hidden="true" />
              <Dropdown>
                <DropdownButton
                  type="button"
                  $open={openMenu === 'user'}
                  aria-haspopup="true"
                  aria-expanded={openMenu === 'user'}
                  aria-label={`Menú de ${user.username}`}
                  onClick={() => toggleMenu('user')}
                >
                  <Avatar aria-hidden="true">{displayName.charAt(0)}</Avatar>
                  {user.username}
                  <i className="fas fa-chevron-down caret" aria-hidden="true"></i>
                </DropdownButton>
                <DropdownContent $isOpen={openMenu === 'user'}>
                  <UserCard>
                    <strong>{displayName}</strong>
                    <span>{ROLE_LABELS[user.role] ?? user.role}</span>
                  </UserCard>
                  <RouterNavLink to="/profile"><i className="fas fa-user-edit" aria-hidden="true"></i>Mi Perfil</RouterNavLink>
                  <MenuDivider />
                  <button type="button" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt" aria-hidden="true"></i>Cerrar Sesión
                  </button>
                </DropdownContent>
              </Dropdown>
            </>
          )}
        </NavLinks>
      </Container>
    </NavbarContainer>
  );
}

export default Navbar;

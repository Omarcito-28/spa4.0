import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Brand = styled(Link)`
  font-family: ${theme.fonts.primary};
  font-size: 2.2rem;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.5px;
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
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${theme.colors.navbarText};
  font-family: ${theme.fonts.secondary};
  font-weight: 500;
  font-size: 1.15rem;
  text-decoration: none;
  transition: all ${theme.transitions.normal};
  padding: 0.5rem 0.9rem;
  border-radius: ${theme.borderRadius.small};
  position: relative;
  letter-spacing: 0.3px;

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

  &:hover {
    color: ${theme.colors.navbarLinkHover};
    text-decoration: none;
    background: rgba(153, 101, 21, 0.08);
    text-shadow: 0 0 8px rgba(201, 148, 42, 0.4);

    &::before {
      width: 60%;
    }
  }

  &.active {
    color: ${theme.colors.navbarLinkHover};
    text-shadow: 0 0 8px rgba(201, 148, 42, 0.3);
  }
`;

const LoginButton = styled(Link)`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  border: none;
  color: white;
  padding: 0.55rem 1.5rem;
  border-radius: ${theme.borderRadius.pill};
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
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
`;

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.navbarText};
  font-family: ${theme.fonts.secondary};
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0.9rem;
  font-size: 1.15rem;
  transition: color ${theme.transitions.normal};
  border-radius: ${theme.borderRadius.small};

  &:hover {
    color: ${theme.colors.navbarLinkHover};
    background: rgba(153, 101, 21, 0.08);
  }
`;

const DropdownContent = styled.div`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: absolute;
  right: 0;
  background: rgba(20, 20, 20, 0.98);
  backdrop-filter: blur(16px);
  min-width: 200px;
  box-shadow: ${theme.shadows.large};
  border-radius: ${theme.borderRadius.medium};
  z-index: 10;
  margin-top: 0.5rem;
  border: 1px solid rgba(153, 101, 21, 0.15);
  overflow: hidden;
  animation: dropIn 0.2s ease-out;

  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  a, button {
    display: block;
    padding: 0.85rem 1.25rem;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.8);
    transition: all ${theme.transitions.fast};
    font-size: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(153, 101, 21, 0.15);
      color: ${theme.colors.navbarLinkHover};
      padding-left: 1.5rem;
    }
  }
`;


function Navbar({ isAuthenticated = false, user = null, onLogout }) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [stylistDropdownOpen, setStylistDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <NavbarContainer $scrolled={scrolled}>
      <Container>
        <Brand to="/">✦ Essence De Toi</Brand>
        
        <NavLinks>
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/services">Servicios</NavLink>
          
          {isAuthenticated && (
            <>
              <NavLink to={
                user?.role === 'ADMIN' ? '/admin/dashboard' :
                user?.role === 'STYLIST' ? '/stylist/dashboard' :
                '/dashboard'
              }>Dashboard</NavLink>
              <NavLink to="/appointments/my">Mis Citas</NavLink>
            </>
          )}
          
          <NavLink to="/contact">Contáctanos</NavLink>
          
          {!isAuthenticated && (
            <>
              <NavLink to="/appointments/new">Agendar Cita</NavLink>
              <LoginButton to="/login">Iniciar Sesión</LoginButton>
            </>
          )}

          {isAuthenticated && user && (
            <Dropdown>
              <DropdownButton onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                <i className="fas fa-user-circle" style={{ marginRight: '6px' }}></i>
                {user.username}
              </DropdownButton>
              <DropdownContent isOpen={userDropdownOpen}>
                <Link to="/profile">Mi Perfil</Link>
                <button 
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: theme.fonts.secondary,
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                  Cerrar Sesión
                </button>
              </DropdownContent>
            </Dropdown>
          )}

          {isAuthenticated && user?.role === 'ADMIN' && (
            <Dropdown>
              <DropdownButton onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}>
                <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
                Admin
              </DropdownButton>
              <DropdownContent isOpen={adminDropdownOpen}>
                <Link to="/admin/dashboard">Panel de Admin</Link>
                <Link to="/admin/users">Gestionar Usuarios</Link>
                <Link to="/appointments/all">Todas las Citas</Link>
              </DropdownContent>
            </Dropdown>
          )}

          {isAuthenticated && user?.role === 'STYLIST' && (
            <Dropdown>
              <DropdownButton onClick={() => setStylistDropdownOpen(!stylistDropdownOpen)}>
                <i className="fas fa-cut" style={{ marginRight: '6px' }}></i>
                Estilista
              </DropdownButton>
              <DropdownContent isOpen={stylistDropdownOpen}>
                <Link to="/stylist/dashboard">Dashboard Estilista</Link>
                <Link to="/stylist/appointments">Mis Citas</Link>
                <Link to="/stylist/schedule">Mi Horario</Link>
              </DropdownContent>
            </Dropdown>
          )}
        </NavLinks>
      </Container>
    </NavbarContainer>
  );
}

export default Navbar;

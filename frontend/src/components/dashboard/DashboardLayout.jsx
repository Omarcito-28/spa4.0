import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { GlobalStyle, theme } from '../../styles/theme';
import DashboardSidebar, { DASHBOARD_MOBILE } from './DashboardSidebar';
import { WORKSPACES } from './workspaces';

// Layout de los paneles de trabajo (administrador y estilista): sidebar lateral
// según el rol, sin Navbar ni Footer del sitio público.
const Shell = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  background: ${theme.colors.dashboardBg};
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  width: 100%;
`;

const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 1030;
  display: none;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1.1rem;
  background: ${theme.colors.sidebarBg};
  border-bottom: 1px solid ${theme.colors.sidebarBorder};

  a {
    color: ${theme.colors.navbarLinkHover};
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    font-size: 1.6rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }

  @media (max-width: ${DASHBOARD_MOBILE}) {
    display: flex;
  }
`;

const MenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(201, 148, 42, 0.35);
  border-radius: ${theme.borderRadius.small};
  background: rgba(153, 101, 21, 0.12);
  color: ${theme.colors.accent};
  font-size: 1.15rem;
`;

const Backdrop = styled.div`
  display: none;

  @media (max-width: ${DASHBOARD_MOBILE}) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1035;
    background: ${theme.colors.overlay};
    backdrop-filter: blur(2px);
  }
`;

function DashboardLayout({ user, onLogout }) {
  const workspace = WORKSPACES[user?.role] ?? WORKSPACES.STYLIST;
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // En móvil el menú se cierra al navegar a otra sección.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  // Cada sección empieza arriba, no en el scroll que dejó la anterior.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKey = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  return (
    <>
      <GlobalStyle />
      <Shell>
        <DashboardSidebar user={user} onLogout={onLogout} open={menuOpen} onClose={() => setMenuOpen(false)} />
        {menuOpen && <Backdrop aria-hidden="true" onClick={() => setMenuOpen(false)} />}
        <Main>
          <Topbar>
            <MenuButton
              type="button"
              aria-label="Abrir menú del panel"
              aria-expanded={menuOpen}
              aria-controls="dashboard-sidebar"
              onClick={() => setMenuOpen(true)}
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </MenuButton>
            <Link to={workspace.root}>✦ Essence De Toi</Link>
          </Topbar>
          <Content>
            <Outlet />
          </Content>
        </Main>
      </Shell>
    </>
  );
}

export default DashboardLayout;

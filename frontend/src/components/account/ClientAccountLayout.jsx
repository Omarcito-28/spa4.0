import { NavLink, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { CLIENT_ACCOUNT_LINKS } from './clientAccount';

// Mismo ancho que los contenedores de las páginas, para que pestañas y contenido queden alineados.
const TabsBar = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 0;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem 0;
  }
`;

const Tabs = styled.nav`
  ul {
    display: flex;
    gap: 0.35rem;
    width: fit-content;
    max-width: 100%;
    margin: 0;
    padding: 0.35rem;
    overflow-x: auto;
    border: 1px solid ${theme.colors.dashboardCardBorder};
    border-radius: 999px;
    background: white;
    box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 6px 18px rgba(60, 40, 10, 0.06);
    list-style: none;
    scrollbar-width: none;
  }

  li {
    flex-shrink: 0;
  }
`;

const Tab = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  color: ${theme.colors.textLight};
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};

  i {
    color: ${theme.colors.primary};
    font-size: 0.92rem;
    transition: color ${theme.transitions.fast};
  }

  &:hover {
    background: #fdf8ef;
    color: ${theme.colors.primaryDark};
    text-decoration: none;
  }

  &.active {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 3px 10px rgba(153, 101, 21, 0.28);
    color: white;

    i {
      color: white;
    }
  }

  @media (max-width: 600px) {
    padding: 0.5rem 0.9rem;
    font-size: 0.98rem;
  }
`;

// Acerca el contenido a las pestañas: las páginas traen su propio margen superior amplio.
const Content = styled.div`
  && > * {
    padding-top: 1.75rem;
  }
`;

// Área "Mi cuenta" del cliente dentro del sitio público (con Navbar y Footer):
// pestañas horizontales sobre el contenido, que ocupa todo el ancho. El
// administrador y el estilista tienen su propio panel; para ellos solo se muestra la página.
function ClientAccountLayout({ user }) {
  if (user?.role !== 'CLIENT') return <Outlet />;

  return (
    <>
      <TabsBar>
        <Tabs aria-label="Opciones de mi cuenta">
          <ul>
            {CLIENT_ACCOUNT_LINKS.map(link => (
              <li key={link.to}>
                <Tab to={link.to} end>
                  <i className={`fas ${link.icon}`} aria-hidden="true"></i>{link.label}
                </Tab>
              </li>
            ))}
          </ul>
        </Tabs>
      </TabsBar>
      <Content>
        <Outlet />
      </Content>
    </>
  );
}

export default ClientAccountLayout;

import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { theme } from '../styles/theme';

const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.1rem;
    border: 1px solid #e4dccd;
    border-radius: 999px;
    background: white;
    color: ${theme.colors.text};
    font-size: 1.05rem;
    font-weight: 600;
    transition: all ${theme.transitions.fast};
  }

  a:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.primaryDark};
  }

  a.active {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primary};
    color: white;
  }

  i {
    font-size: 0.9rem;
  }
`;

const LINKS = [
  { to: '/admin/dashboard', icon: 'fa-gauge', label: 'Panel' },
  { to: '/admin/users', icon: 'fa-users-cog', label: 'Usuarios' },
  { to: '/admin/services', icon: 'fa-concierge-bell', label: 'Servicios' },
  { to: '/appointments/all', icon: 'fa-calendar-alt', label: 'Citas' },
  { to: '/admin/reports', icon: 'fa-chart-line', label: 'Reportes' },
];

// Accesos entre las secciones de administración.
function AdminNav() {
  return (
    <Tabs aria-label="Secciones de administración">
      {LINKS.map(link => (
        <NavLink key={link.to} to={link.to} end>
          <i className={`fas ${link.icon}`} aria-hidden="true"></i>{link.label}
        </NavLink>
      ))}
    </Tabs>
  );
}

export default AdminNav;

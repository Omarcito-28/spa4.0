import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { theme } from '../styles/theme';

const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 0.4rem;
  border: 1px solid #e4dccd;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 4px 16px rgba(60, 40, 10, 0.05);
  width: fit-content;
  max-width: 100%;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.1rem;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: ${theme.colors.text};
    font-size: 1.05rem;
    font-weight: 600;
    transition: all ${theme.transitions.fast};
  }

  a:hover {
    background: #faf3e6;
    color: ${theme.colors.primaryDark};
  }

  a.active {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 3px 10px rgba(153, 101, 21, 0.28);
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
  { to: '/admin/agenda', icon: 'fa-calendar-times', label: 'Agenda' },
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

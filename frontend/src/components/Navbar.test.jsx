import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (props, route = '/') => render(
  <MemoryRouter initialEntries={[route]}>
    <Navbar {...props} />
    <button type="button">Fuera del menú</button>
  </MemoryRouter>
);

const admin = { username: 'admin', fullName: 'Administradora', role: 'ADMIN' };

describe('Navbar', () => {
  it('agrupa las secciones de administración en el menú Gestión sin repetir enlaces', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: admin });

    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('link', { name: 'Citas' })).toHaveAttribute('href', '/appointments/all');
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();

    const gestion = screen.getByRole('button', { name: /Gestión/ });
    expect(gestion).toHaveAttribute('aria-expanded', 'false');
    await user.click(gestion);
    expect(gestion).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: 'Catálogo de servicios' })).toHaveAttribute('href', '/admin/services');
    expect(screen.getByRole('link', { name: 'Reportes' })).toHaveAttribute('href', '/admin/reports');
  });

  it('abre un solo menú a la vez y lo cierra con un clic fuera o con Escape', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: admin });
    const gestion = screen.getByRole('button', { name: /Gestión/ });
    const cuenta = screen.getByRole('button', { name: 'Menú de admin' });

    await user.click(gestion);
    await user.click(cuenta);
    expect(gestion).toHaveAttribute('aria-expanded', 'false');
    expect(cuenta).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Fuera del menú' }));
    expect(cuenta).toHaveAttribute('aria-expanded', 'false');

    await user.click(gestion);
    await user.keyboard('{Escape}');
    expect(gestion).toHaveAttribute('aria-expanded', 'false');
  });

  it('cierra el menú al navegar a una sección', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: admin });
    const gestion = screen.getByRole('button', { name: /Gestión/ });
    await user.click(gestion);
    await user.click(screen.getByRole('link', { name: 'Reportes' }));
    expect(gestion).toHaveAttribute('aria-expanded', 'false');
  });

  it('el menú de la cuenta muestra el rol y cierra sesión', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderNavbar({ isAuthenticated: true, user: admin, onLogout });

    await user.click(screen.getByRole('button', { name: 'Menú de admin' }));
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('marca como activa la sección actual', () => {
    renderNavbar({ isAuthenticated: true, user: admin }, '/appointments/all');
    expect(screen.getByRole('link', { name: 'Citas' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveClass('active');
  });

  it('muestra a los visitantes el acceso para iniciar sesión y sin menús de cuenta', () => {
    renderNavbar({ isAuthenticated: false });
    const menu = screen.getByRole('list');
    expect(within(menu).getByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /Gestión/ })).not.toBeInTheDocument();
  });

  it('el botón de menú móvil abre y cierra la lista de enlaces', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: false });
    // En escritorio el botón está oculto con CSS; jsdom no aplica la media query móvil.
    const toggle = screen.getByLabelText('Abrir menú');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Cerrar menú');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

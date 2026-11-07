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
  it('no muestra accesos de gestión en el sitio público y ofrece el panel desde el menú de la cuenta', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: admin });

    expect(screen.queryByRole('button', { name: /Gestión/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Panel de Administración' })).not.toBeInTheDocument();

    const cuenta = screen.getByRole('button', { name: 'Menú de admin' });
    await user.click(cuenta);
    expect(screen.getByRole('link', { name: 'Panel de Administración' })).toHaveAttribute('href', '/admin');
  });

  it('cierra el menú de la cuenta con un clic fuera, con Escape o al navegar', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: admin });
    const cuenta = screen.getByRole('button', { name: 'Menú de admin' });

    await user.click(cuenta);
    await user.click(screen.getByRole('button', { name: 'Fuera del menú' }));
    expect(cuenta).toHaveAttribute('aria-expanded', 'false');

    await user.click(cuenta);
    await user.keyboard('{Escape}');
    expect(cuenta).toHaveAttribute('aria-expanded', 'false');

    await user.click(cuenta);
    await user.click(screen.getByRole('link', { name: 'Mi Perfil' }));
    expect(cuenta).toHaveAttribute('aria-expanded', 'false');
  });

  it('el panel de administración solo aparece para el administrador', async () => {
    const user = userEvent.setup();
    renderNavbar({ isAuthenticated: true, user: { username: 'luis', fullName: 'Luis', role: 'CLIENT' } });
    await user.click(screen.getByRole('button', { name: 'Menú de luis' }));
    expect(screen.queryByRole('link', { name: 'Panel de Administración' })).not.toBeInTheDocument();
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
    renderNavbar({ isAuthenticated: true, user: admin }, '/services');
    expect(screen.getByRole('link', { name: 'Servicios' })).toHaveClass('active');
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

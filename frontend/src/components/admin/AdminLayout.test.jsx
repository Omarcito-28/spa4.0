import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const admin = { username: 'admin', fullName: 'Administradora', role: 'ADMIN' };

const renderLayout = (route = '/admin', onLogout = vi.fn()) => render(
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path="/admin" element={<AdminLayout user={admin} onLogout={onLogout} />}>
        <Route index element={<h1>Vista dashboard</h1>} />
        <Route path="users" element={<h1>Vista usuarios</h1>} />
        <Route path="reports" element={<h1>Vista reportes</h1>} />
      </Route>
      <Route path="/" element={<h1>Sitio público</h1>} />
    </Routes>
  </MemoryRouter>
);

describe('AdminLayout', () => {
  it('muestra el sidebar con todas las secciones y sin la navegación pública', () => {
    renderLayout();
    const nav = screen.getByRole('navigation', { name: 'Secciones de administración' });
    const expected = {
      Dashboard: '/admin',
      'Citas y reservas': '/admin/appointments',
      'Agenda y cierres': '/admin/agenda',
      'Catálogo de servicios': '/admin/services',
      Usuarios: '/admin/users',
      Reportes: '/admin/reports',
      'Mi perfil': '/admin/profile',
    };
    Object.entries(expected).forEach(([name, href]) => {
      expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href);
    });
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vista dashboard' })).toBeInTheDocument();
  });

  it('marca como activa solo la sección actual', () => {
    renderLayout('/admin/users');
    const nav = screen.getByRole('navigation', { name: 'Secciones de administración' });
    expect(within(nav).getByRole('link', { name: 'Usuarios' })).toHaveClass('active');
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active');
  });

  it('el pie del sidebar muestra al administrador, vuelve al sitio público y cierra sesión', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderLayout('/admin', onLogout);

    expect(screen.getByText('Administradora')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(onLogout).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('link', { name: 'Volver al sitio público' }));
    expect(screen.getByRole('heading', { name: 'Sitio público' })).toBeInTheDocument();
  });

  it('en móvil el botón hamburguesa abre el menú y se cierra con Escape o al navegar', async () => {
    const user = userEvent.setup();
    renderLayout();
    // En escritorio la barra superior está oculta con CSS; jsdom no aplica la media query.
    const toggle = screen.getByLabelText('Abrir menú de administración');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    await user.click(screen.getByRole('link', { name: 'Reportes' }));
    expect(screen.getByRole('heading', { name: 'Vista reportes' })).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    await user.click(screen.getByLabelText('Cerrar menú'));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientAccountLayout from './ClientAccountLayout';

const client = { username: 'ana', fullName: 'Ana Pérez', role: 'CLIENT' };

const renderAt = (route, user = client) => render(
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route element={<ClientAccountLayout user={user} />}>
        <Route path="/dashboard" element={<h1>Vista panel</h1>} />
        <Route path="/appointments/my" element={<h1>Vista mis citas</h1>} />
        <Route path="/appointments/new" element={<h1>Vista reserva</h1>} />
        <Route path="/profile" element={<h1>Vista perfil</h1>} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('ClientAccountLayout', () => {
  it('muestra al cliente sus opciones siempre visibles junto a la página', () => {
    renderAt('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Opciones de mi cuenta' });
    const expected = {
      'Mi panel': '/dashboard',
      'Mis citas': '/appointments/my',
      'Agendar cita': '/appointments/new',
      'Mi perfil': '/profile',
    };
    Object.entries(expected).forEach(([name, href]) => {
      expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href);
    });
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vista panel' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Mi panel' })).toHaveClass('active');
  });

  it('navega entre las secciones y marca la actual', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Opciones de mi cuenta' });

    await user.click(within(nav).getByRole('link', { name: 'Agendar cita' }));
    expect(screen.getByRole('heading', { name: 'Vista reserva' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Agendar cita' })).toHaveClass('active');
    expect(within(nav).getByRole('link', { name: 'Mi panel' })).not.toHaveClass('active');
  });

  it('a quien no es cliente le muestra solo la página, sin el menú de cuenta', () => {
    renderAt('/profile', { username: 'admin', role: 'ADMIN' });
    expect(screen.getByRole('heading', { name: 'Vista perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Opciones de mi cuenta' })).not.toBeInTheDocument();
  });
});

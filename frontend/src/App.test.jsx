import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { useAuth } from './contexts/auth';

vi.mock('./contexts/auth', () => ({ useAuth: vi.fn() }));
vi.mock('./components/ChatAssistant', () => ({ default: () => null }));

const session = user => ({
  user,
  isAuthenticated: Boolean(user),
  loading: false,
  logout: vi.fn(),
  login: vi.fn(),
  sessionNotice: '',
});

const renderAt = (route, user) => {
  useAuth.mockReturnValue(session(user));
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
};

describe('Rutas de los paneles de trabajo', () => {
  it('un cliente que entra a /admin es enviado al login', () => {
    renderAt('/admin/users', { username: 'luis', role: 'CLIENT' });
    expect(screen.queryByRole('navigation', { name: 'Secciones de administración' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('un visitante sin sesión que entra a /admin es enviado al login', () => {
    renderAt('/admin', null);
    expect(screen.queryByRole('navigation', { name: 'Secciones de administración' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('un cliente que entra al panel de estilista es enviado al login', () => {
    renderAt('/stylist/schedule', { username: 'luis', role: 'CLIENT' });
    expect(screen.queryByRole('navigation', { name: 'Secciones del panel de estilista' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('un administrador no entra al panel de estilista', () => {
    renderAt('/stylist', { username: 'admin', role: 'ADMIN' });
    expect(screen.queryByRole('navigation', { name: 'Secciones del panel de estilista' })).not.toBeInTheDocument();
  });
});

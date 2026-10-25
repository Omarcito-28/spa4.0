import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithAuth } from '../test/render';

const fillAndSubmit = async (username, password) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Usuario o correo electrónico'), username);
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
};

describe('Login', () => {
  it('muestra el formulario con campos obligatorios', () => {
    renderWithAuth(<Login />, { route: '/login', path: '/login' });

    expect(screen.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario o correo electrónico')).toBeRequired();
    expect(screen.getByLabelText('Contraseña')).toBeRequired();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Regístrate aquí' })).toHaveAttribute('href', '/register');
  });

  it('envía usuario y contraseña al contexto de autenticación', async () => {
    const login = vi.fn().mockResolvedValue({ success: false, error: 'x' });
    renderWithAuth(<Login />, { auth: { login }, route: '/login', path: '/login' });

    await fillAndSubmit('ana@correo.co', 'clave-segura');

    expect(login).toHaveBeenCalledWith('ana@correo.co', 'clave-segura');
  });

  it('muestra el error que devuelve la API', async () => {
    const login = vi.fn().mockResolvedValue({ success: false, error: 'Credenciales inválidas.' });
    renderWithAuth(<Login />, { auth: { login }, route: '/login', path: '/login' });

    await fillAndSubmit('ana', 'mala');

    expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeEnabled();
  });

  it('muestra un mensaje genérico si la API no da detalle', async () => {
    const login = vi.fn().mockResolvedValue({ success: false });
    renderWithAuth(<Login />, { auth: { login }, route: '/login', path: '/login' });

    await fillAndSubmit('ana', 'mala');

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
  });

  it('desactiva el botón mientras procesa', async () => {
    let resolveLogin;
    const login = vi.fn(() => new Promise(resolve => { resolveLogin = resolve; }));
    renderWithAuth(<Login />, { auth: { login }, route: '/login', path: '/login' });

    await fillAndSubmit('ana', 'clave-segura');

    expect(screen.getByRole('button', { name: /Procesando/ })).toBeDisabled();
    resolveLogin({ success: false, error: 'x' });
    expect(await screen.findByRole('button', { name: 'Iniciar Sesión' })).toBeEnabled();
  });

  it.each([
    ['ADMIN', '/admin/dashboard'],
    ['STYLIST', '/stylist/dashboard'],
    ['CLIENT', '/dashboard']
  ])('confirma el ingreso y redirige al panel de %s', async (role, target) => {
    const login = vi.fn().mockResolvedValue({ success: true, user: { role } });
    renderWithAuth(<Login />, { auth: { login }, route: '/login', path: '/login' });

    await fillAndSubmit('ana', 'clave-segura');

    expect(await screen.findByText('Has iniciado sesión correctamente')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent(target), { timeout: 2000 });
  });

  it('vuelve a la reserva que el cliente estaba haciendo', async () => {
    const login = vi.fn().mockResolvedValue({ success: true, user: { role: 'CLIENT' } });
    renderWithAuth(<Login />, {
      auth: { login },
      route: '/login?returnTo=/appointments/new?service=Corte',
      path: '/login'
    });

    await fillAndSubmit('ana', 'clave-segura');

    await waitFor(() => expect(screen.getByTestId('current-path'))
      .toHaveTextContent('/appointments/new?service=Corte'), { timeout: 2000 });
  });
});

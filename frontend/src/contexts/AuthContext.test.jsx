import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth';
import { apiGetAppointments } from '../services/api';

const ana = { username: 'ana', fullName: 'Ana Pérez', role: 'CLIENT' };

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });

function SessionProbe() {
  const { user, isAuthenticated, loading, sessionNotice } = useAuth();
  if (loading) return <p>Cargando</p>;
  return (
    <>
      <p>{isAuthenticated ? `Conectada: ${user.fullName}` : 'Sin sesión'}</p>
      {sessionNotice && <p>Aviso: {sessionNotice}</p>}
    </>
  );
}

const renderProvider = () => render(<AuthProvider><SessionProbe /></AuthProvider>);

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-guardado');
    localStorage.setItem('user', JSON.stringify(ana));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('conserva la sesión guardada si la red falla al cargar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderProvider();

    expect(await screen.findByText('Conectada: Ana Pérez')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('token-guardado');
  });

  it('borra la sesión si el backend rechaza el token al cargar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(401, { error: 'Token inválido o expirado.', code: 'SESSION_INVALID' })
    ));
    renderProvider();

    expect(await screen.findByText('Sin sesión')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('cierra la sesión y guarda el motivo cuando el token vence durante el uso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ana));
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    await screen.findByText('Conectada: Ana Pérez');

    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'La sesión expiró. Inicia sesión nuevamente.', code: 'SESSION_INVALID' }));
    await act(async () => {
      await expect(apiGetAppointments()).rejects.toMatchObject({ status: 401, code: 'SESSION_INVALID' });
    });

    expect(screen.getByText('Sin sesión')).toBeInTheDocument();
    expect(screen.getByText('Aviso: La sesión expiró. Inicia sesión nuevamente.')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('mantiene la sesión ante un 403 por permisos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ana));
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    await screen.findByText('Conectada: Ana Pérez');

    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Acceso denegado. Permisos insuficientes.' }));
    await act(async () => {
      await expect(apiGetAppointments()).rejects.toThrow('Acceso denegado. Permisos insuficientes.');
    });

    expect(screen.getByText('Conectada: Ana Pérez')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('token-guardado');
  });
});

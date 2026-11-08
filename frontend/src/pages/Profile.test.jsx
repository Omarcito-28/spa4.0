import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import { renderWithAuth } from '../test/render';

const client = { username: 'ana', fullName: 'Ana', email: 'ana@gmail.com', phoneNumber: '', role: 'CLIENT' };

describe('Profile', () => {
  it('con contraseña pide la actual para cambiarla', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ success: true });
    renderWithAuth(<Profile />, { auth: { user: { ...client, hasPassword: true }, updateProfile } });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nueva contraseña (opcional)'), 'nueva-clave-1');
    await user.type(screen.getByLabelText('Contraseña actual'), 'clave-actual');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ password: 'nueva-clave-1', currentPassword: 'clave-actual' }));
  });

  it('una cuenta solo con Google crea su contraseña sin pedir la actual', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ success: true });
    renderWithAuth(<Profile />, { auth: { user: { ...client, hasPassword: false, googleLinked: true }, updateProfile } });
    const user = userEvent.setup();

    expect(screen.getByText(/Tu cuenta está vinculada con Google/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Crear contraseña (opcional)'), 'nueva-clave-1');
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const [payload] = updateProfile.mock.calls[0];
    expect(payload).toMatchObject({ password: 'nueva-clave-1' });
    expect(payload).not.toHaveProperty('currentPassword');
  });

  it('da la bienvenida a quien acaba de crear la cuenta con Google', () => {
    renderWithAuth(<Profile />, {
      auth: { user: { ...client, hasPassword: false, googleLinked: true } },
      route: { pathname: '/profile', state: { welcome: 'google' } },
    });
    expect(screen.getByText(/Tu cuenta se creó con Google/)).toBeInTheDocument();
    expect(screen.getByText(/Agrega tu teléfono/)).toBeInTheDocument();
  });
});

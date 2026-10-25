import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import { apiCreateUser, apiGetUsers } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetUsers: vi.fn(),
  apiUpdateUser: vi.fn(),
  apiCreateUser: vi.fn(),
}));

const admin = { _id: 'u1', username: 'admin', fullName: 'Administradora', email: 'admin@spa.test', role: 'ADMIN' };
const lina = { _id: 'u2', username: 'lina', fullName: 'Lina Gómez', email: 'lina@spa.test', role: 'STYLIST' };

// fireEvent.change llena los campos de una vez; teclear letra por letra vuelve lenta la prueba.
const renderUsers = () => render(<MemoryRouter><AdminUsers /></MemoryRouter>);

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetUsers.mockResolvedValue([admin]);
  });

  it('crea una cuenta con el rol elegido y recarga la lista', async () => {
    const user = userEvent.setup();
    apiCreateUser.mockResolvedValue(lina);
    renderUsers();
    await screen.findByText('Administradora');

    await user.click(screen.getByRole('button', { name: /Nuevo usuario/ }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Lina Gómez' } });
    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'lina' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'lina@spa.test' } });
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: 'lina-clave-123' } });
    expect(screen.getByLabelText('Rol')).toHaveValue('STYLIST');
    apiGetUsers.mockResolvedValue([admin, lina]);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(apiCreateUser).toHaveBeenCalledWith({
      fullName: 'Lina Gómez', username: 'lina', email: 'lina@spa.test', phoneNumber: '', password: 'lina-clave-123', role: 'STYLIST'
    });
    expect(await screen.findByText('Se creó la cuenta de Lina Gómez como estilista.')).toBeInTheDocument();
    expect(screen.getByText('Lina Gómez')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear cuenta' })).not.toBeInTheDocument();
  });

  it('mantiene el formulario abierto y muestra el error de la API', async () => {
    const user = userEvent.setup();
    apiCreateUser.mockRejectedValue(new Error('El nombre de usuario ya existe.'));
    renderUsers();
    await screen.findByText('Administradora');

    await user.click(screen.getByRole('button', { name: /Nuevo usuario/ }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Otra' } });
    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'otra@spa.test' } });
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: 'clave-segura' } });
    await user.selectOptions(screen.getByLabelText('Rol'), 'ADMIN');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre de usuario ya existe.');
    expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('admin');
  });
});

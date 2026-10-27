import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import { apiCreateUser, apiDeleteUser, apiGetUsers, apiUpdateUser } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetUsers: vi.fn(),
  apiUpdateUser: vi.fn(),
  apiCreateUser: vi.fn(),
  apiDeleteUser: vi.fn(),
}));

vi.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { username: 'admin', role: 'ADMIN' } }),
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

  it('desactiva una cuenta y confirma el cambio junto a la tabla', async () => {
    const user = userEvent.setup();
    apiGetUsers.mockResolvedValue([admin, lina]);
    apiUpdateUser.mockResolvedValue({ ...lina, isActive: false });
    renderUsers();
    await screen.findByText('Lina Gómez');

    apiGetUsers.mockResolvedValue([admin, { ...lina, isActive: false }]);
    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[1]);

    expect(apiUpdateUser).toHaveBeenCalledWith('u2', { isActive: false });
    expect(await screen.findByRole('status')).toHaveTextContent('Se desactivó la cuenta de Lina Gómez.');
    expect(screen.getByRole('button', { name: 'Reactivar' })).toBeEnabled();
  });

  it('muestra el motivo cuando el backend rechaza la desactivación', async () => {
    const user = userEvent.setup();
    apiGetUsers.mockResolvedValue([admin, lina]);
    apiUpdateUser.mockRejectedValue(new Error('El estilista tiene citas próximas.'));
    renderUsers();
    await screen.findByText('Lina Gómez');

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[1]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Lina Gómez: El estilista tiene citas próximas.');
    expect(apiGetUsers).toHaveBeenCalledTimes(2);
  });

  it('elimina una cuenta tras confirmar', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiGetUsers.mockResolvedValue([admin, lina]);
    apiDeleteUser.mockResolvedValue({ success: true });
    renderUsers();
    await screen.findByText('Lina Gómez');

    apiGetUsers.mockResolvedValue([admin]);
    await user.click(screen.getByRole('button', { name: 'Eliminar a lina' }));

    expect(apiDeleteUser).toHaveBeenCalledWith('u2');
    expect(await screen.findByRole('status')).toHaveTextContent('Se eliminó la cuenta de Lina Gómez.');
    expect(screen.queryByText('Lina Gómez')).not.toBeInTheDocument();
  });

  it('vuelve a la página anterior si eliminar deja vacía la última', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const clients = Array.from({ length: 10 }, (_, index) => ({
      _id: `c${index}`, username: `cliente${index}`, fullName: `Cliente ${index}`, email: `c${index}@spa.test`, role: 'CLIENT'
    }));
    apiGetUsers.mockResolvedValue([admin, ...clients]);
    apiDeleteUser.mockResolvedValue({ success: true });
    renderUsers();
    await screen.findByText('Administradora');

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(await screen.findByText('Cliente 9')).toBeInTheDocument();

    apiGetUsers.mockResolvedValue([admin, ...clients.slice(0, 9)]);
    await user.click(screen.getByRole('button', { name: 'Eliminar a cliente9' }));

    expect(await screen.findByText('Administradora')).toBeInTheDocument();
    expect(screen.getByText('Cliente 8')).toBeInTheDocument();
  });

  it('edita nombre, correo y teléfono; si falla, conserva el formulario', async () => {
    const user = userEvent.setup();
    apiGetUsers.mockResolvedValue([admin, lina]);
    apiUpdateUser.mockRejectedValueOnce(new Error('Ese correo ya está asociado a otra cuenta.')).mockResolvedValue({});
    renderUsers();
    await screen.findByText('Lina Gómez');

    await user.click(screen.getByRole('button', { name: 'Editar a lina' }));
    const form = screen.getByRole('form', { name: 'Editar a lina' });
    fireEvent.change(within(form).getByLabelText('Teléfono'), { target: { value: '300 555' } });
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya está asociado a otra cuenta.');
    expect(within(screen.getByRole('form', { name: 'Editar a lina' })).getByLabelText('Teléfono')).toHaveValue('300 555');

    await user.click(within(screen.getByRole('form', { name: 'Editar a lina' })).getByRole('button', { name: 'Guardar cambios' }));
    expect(apiUpdateUser).toHaveBeenLastCalledWith('u2', { fullName: 'Lina Gómez', email: 'lina@spa.test', phoneNumber: '300 555' });
    expect(await screen.findByRole('status')).toHaveTextContent('Se actualizaron los datos de Lina Gómez.');
    expect(screen.queryByRole('form', { name: 'Editar a lina' })).not.toBeInTheDocument();
  });

  it('bloquea las acciones sobre la propia cuenta del administrador', async () => {
    renderUsers();
    await screen.findByText('Administradora');

    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar a admin' })).toBeDisabled();
    expect(screen.getByLabelText('Rol de admin')).toBeDisabled();
  });
});

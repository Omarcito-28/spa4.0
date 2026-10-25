import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from './Register';
import { renderWithAuth } from '../test/render';

const renderRegister = (register = vi.fn().mockResolvedValue({ success: true })) => {
  const view = renderWithAuth(<Register />, { auth: { register }, route: '/register', path: '/register' });
  return { register, form: view.container.querySelector('form') };
};

const fill = async values => {
  const user = userEvent.setup();
  const labels = {
    username: 'Usuario',
    fullName: 'Nombre Completo',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar',
    phoneNumber: 'Teléfono (Opcional)'
  };
  for (const [field, value] of Object.entries(values)) {
    await user.type(screen.getByLabelText(labels[field]), value);
  }
  return user;
};

const validData = {
  username: 'ana',
  fullName: 'Ana Pérez',
  email: 'ana@correo.co',
  password: 'clave-segura',
  confirmPassword: 'clave-segura',
  phoneNumber: '3001234567'
};

// fireEvent.submit evita la validación nativa del navegador (required, type=email)
// para comprobar los mensajes que muestra el propio formulario.
describe('Register', () => {
  it('muestra un mensaje por cada campo obligatorio vacío', () => {
    const { register, form } = renderRegister();

    fireEvent.submit(form);

    expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
    expect(screen.getByText('El nombre completo es requerido')).toBeInTheDocument();
    expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    expect(screen.getByText('Debe confirmar la contraseña')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('valida el formato del correo, el largo y la confirmación de la contraseña', async () => {
    const { register, form } = renderRegister();
    await fill({ ...validData, email: 'ana@correo', password: 'corta', confirmPassword: 'distinta' });

    fireEvent.submit(form);

    expect(screen.getByText('El correo electrónico no es válido')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(screen.queryByText('El nombre de usuario es requerido')).not.toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('borra el error de un campo cuando el usuario lo corrige', async () => {
    const { form } = renderRegister();
    fireEvent.submit(form);
    expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();

    await fill({ username: 'a' });

    expect(screen.queryByText('El nombre de usuario es requerido')).not.toBeInTheDocument();
    expect(screen.getByText('El nombre completo es requerido')).toBeInTheDocument();
  });

  it('registra al cliente con datos válidos y lo lleva a su panel', async () => {
    const { register } = renderRegister();
    const user = await fill(validData);

    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(register).toHaveBeenCalledWith({
      username: 'ana',
      fullName: 'Ana Pérez',
      email: 'ana@correo.co',
      password: 'clave-segura',
      phoneNumber: '3001234567',
      role: 'CLIENT'
    });
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard'));
  });

  it('muestra el error del servidor, por ejemplo un usuario repetido', async () => {
    const { register } = renderRegister(vi.fn().mockResolvedValue({ success: false, error: 'El nombre de usuario ya existe.' }));
    const user = await fill(validData);

    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText('El nombre de usuario ya existe.')).toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-path')).toHaveTextContent('/register');
  });

  it('muestra un error genérico si el registro lanza una excepción', async () => {
    renderRegister(vi.fn().mockRejectedValue(new Error('red caída')));
    const user = await fill(validData);

    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText('Error al registrar usuario. Por favor, intenta nuevamente.')).toBeInTheDocument();
  });
});

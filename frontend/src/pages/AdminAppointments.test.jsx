import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminAppointments from './AdminAppointments';
import { apiDeleteAppointment, apiGetAppointments, apiGetStylists, apiGetUsers, apiUpdateAppointment } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn(),
  apiGetStylists: vi.fn(),
  apiGetUsers: vi.fn(),
  apiUpdateAppointment: vi.fn(),
  apiDeleteAppointment: vi.fn(),
  apiGetStylistAvailability: vi.fn(),
  apiGetClientNotes: vi.fn().mockResolvedValue([]),
  apiCreateClientNote: vi.fn(),
  apiDeleteClientNote: vi.fn(),
}));

vi.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { username: 'admin', role: 'ADMIN' } }),
}));

const sofi = { _id: 's1', username: 'sofi', fullName: 'Sofi Rojas' };
const appointment = { _id: 'a1', username: 'luis', service: 'Masaje Relajante', date: '2030-01-07', time: '9:00 AM', stylist: 'sofi', status: 'PENDING' };

const renderPage = () => render(<MemoryRouter><AdminAppointments /></MemoryRouter>);

describe('AdminAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetStylists.mockResolvedValue([sofi]);
    apiGetUsers.mockResolvedValue([{ _id: 'u1', username: 'luis', fullName: 'Luis Gómez', phoneNumber: '300 123', role: 'CLIENT' }]);
  });

  it('muestra el nombre y teléfono del cliente', async () => {
    apiGetAppointments.mockResolvedValue([appointment]);
    renderPage();

    const row = (await screen.findByText('Luis Gómez')).closest('tr');
    expect(within(row).getByText(/@luis · 300 123/)).toBeInTheDocument();
  });

  it('elimina una cita tras confirmar', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiGetAppointments.mockResolvedValue([appointment]);
    apiDeleteAppointment.mockResolvedValue({});
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Eliminar cita de luis del 2030-01-07' }));
    expect(apiDeleteAppointment).toHaveBeenCalledWith('a1');
  });

  it('abre el calendario del día con una columna por estilista y las citas sin asignar', async () => {
    const user = userEvent.setup();
    apiGetAppointments.mockResolvedValue([]);
    renderPage();
    await screen.findByText('No hay citas que coincidan con los filtros.');

    await user.click(screen.getByRole('button', { name: 'Calendario' }));
    expect(screen.getByRole('group', { name: 'Sofi Rojas' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Por asignar' })).toBeInTheDocument();
  });

  it('muestra al estilista asignado aunque ya no esté activo', async () => {
    apiGetAppointments.mockResolvedValue([{ ...appointment, stylist: 'marta' }]);
    renderPage();

    const select = await screen.findByLabelText('Estilista de luis');
    expect(select).toHaveValue('marta');
    expect(screen.getByRole('option', { name: '@marta (no disponible)' })).toBeInTheDocument();
  });

  it('bloquea los controles de la cita mientras se guarda el cambio', async () => {
    const user = userEvent.setup();
    apiGetAppointments.mockResolvedValue([appointment]);
    let finishSave;
    apiUpdateAppointment.mockReturnValue(new Promise(resolve => { finishSave = resolve; }));
    renderPage();

    await user.selectOptions(await screen.findByLabelText('Estado de luis'), 'CONFIRMED');

    expect(apiUpdateAppointment).toHaveBeenCalledWith('a1', { status: 'CONFIRMED' });
    expect(screen.getByLabelText('Estado de luis')).toBeDisabled();
    expect(screen.getByLabelText('Estilista de luis')).toBeDisabled();

    finishSave({});
    await waitFor(() => expect(screen.getByLabelText('Estado de luis')).toBeEnabled());
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminAppointments from './AdminAppointments';
import { apiGetAppointments, apiGetStylists, apiUpdateAppointment } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn(),
  apiGetStylists: vi.fn(),
  apiUpdateAppointment: vi.fn(),
}));

const sofi = { _id: 's1', username: 'sofi', fullName: 'Sofi Rojas' };
const appointment = { _id: 'a1', username: 'luis', service: 'Masaje Relajante', date: '2030-01-07', time: '9:00 AM', stylist: 'sofi', status: 'PENDING' };

const renderPage = () => render(<MemoryRouter><AdminAppointments /></MemoryRouter>);

describe('AdminAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetStylists.mockResolvedValue([sofi]);
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

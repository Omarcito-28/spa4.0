import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ClientAppointments from './ClientAppointments';
import { apiGetAppointments } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn(),
  apiGetStylistAvailability: vi.fn(),
  apiGetStylists: vi.fn(),
  apiRescheduleAppointment: vi.fn(),
  apiUpdateAppointmentStatus: vi.fn(),
}));

describe('ClientAppointments', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra cada estado con su etiqueta y deja sin acciones las citas completadas', async () => {
    apiGetAppointments.mockResolvedValue([
      { _id: '1', service: 'Corte para Dama', date: '2030-01-07', time: '10:00 AM', stylist: 'sofi', status: 'COMPLETED' },
      { _id: '2', service: 'Masaje Relajante', date: '2030-01-08', time: '11:00 AM', stylist: '', status: 'CONFIRMED' },
      { _id: '3', service: 'Tintura de Cabello', date: '2030-01-09', time: '9:00 AM', stylist: '', status: 'CANCELLED' },
    ]);
    render(<ClientAppointments />);

    const completed = (await screen.findByText('Corte para Dama')).closest('tr');
    expect(within(completed).getByText('Completada')).toBeInTheDocument();
    expect(within(completed).queryByRole('button')).not.toBeInTheDocument();

    const confirmed = screen.getByText('Masaje Relajante').closest('tr');
    expect(within(confirmed).getByText('Confirmada')).toBeInTheDocument();
    expect(within(confirmed).getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument();

    const cancelled = screen.getByText('Tintura de Cabello').closest('tr');
    expect(within(cancelled).getByText('Cancelada')).toBeInTheDocument();
    expect(within(cancelled).queryByRole('button')).not.toBeInTheDocument();
  });
});

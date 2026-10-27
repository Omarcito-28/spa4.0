import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminAgenda from './AdminAgenda';
import { apiGetAppointmentPolicy, apiSendReminders } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetStylists: vi.fn().mockResolvedValue([{ _id: 's1', username: 'sofi', fullName: 'Sofi Rojas' }]),
  apiGetAppointmentPolicy: vi.fn(),
  apiSendReminders: vi.fn(),
  apiGetTimeOff: vi.fn().mockResolvedValue([]),
  apiCreateTimeOff: vi.fn(),
  apiDeleteTimeOff: vi.fn(),
}));

const renderAgenda = () => render(<MemoryRouter><AdminAgenda /></MemoryRouter>);

describe('AdminAgenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetAppointmentPolicy.mockResolvedValue({ cancellationNoticeHours: 24 });
  });

  it('muestra la política vigente y el formulario de cierres con los estilistas', async () => {
    renderAgenda();

    expect(await screen.findByText('24 horas')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sofi Rojas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Todo el spa (cierre)' })).toBeInTheDocument();
  });

  it('envía los recordatorios a mano y avisa cuántos salieron', async () => {
    const user = userEvent.setup();
    apiSendReminders.mockResolvedValue({ sent: 3 });
    renderAgenda();
    await screen.findByText('24 horas');

    await user.click(screen.getByRole('button', { name: /Enviar recordatorios ahora/ }));
    expect(await screen.findByText('Se enviaron 3 recordatorios para las citas de mañana.')).toBeInTheDocument();
  });

  it('explica por qué no se enviaron si el correo no está configurado', async () => {
    const user = userEvent.setup();
    apiSendReminders.mockResolvedValue({ sent: 0, skipped: 'Correo no configurado.' });
    renderAgenda();
    await screen.findByText('24 horas');

    await user.click(screen.getByRole('button', { name: /Enviar recordatorios ahora/ }));
    expect(await screen.findByText('No se enviaron recordatorios: Correo no configurado.')).toBeInTheDocument();
  });
});

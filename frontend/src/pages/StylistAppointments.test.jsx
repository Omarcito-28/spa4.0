import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StylistAppointments from './StylistAppointments';
import { apiGetAppointments, apiUpdateAppointmentStatus } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn(),
  apiUpdateAppointmentStatus: vi.fn(),
}));

const appointment = (id, overrides) => ({
  _id: id, username: `cliente-${id}`, service: 'Corte para Dama', date: '2030-01-07', time: '10:00 AM', ...overrides,
});

const rowOf = username => screen.getByText(username).closest('tr');

describe('StylistAppointments', () => {
  beforeEach(() => {
    // 11:00 AM del 7 de enero de 2030 en Bogotá. Solo se simula Date para no detener los temporizadores.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-07T16:00:00Z'));
    apiGetAppointments.mockResolvedValue([
      appointment('iniciada', { status: 'CONFIRMED' }),
      appointment('futura', { status: 'CONFIRMED', time: '3:00 PM' }),
      appointment('pendiente', { status: 'PENDING' }),
      appointment('hecha', { status: 'COMPLETED' }),
    ]);
    apiUpdateAppointmentStatus.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('ofrece completar solo las citas confirmadas que ya empezaron', async () => {
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    expect(screen.getAllByRole('button', { name: 'Marcar como completada' })).toHaveLength(1);
    expect(within(rowOf('cliente-iniciada')).getByRole('button', { name: 'Marcar como completada' })).toBeInTheDocument();
    expect(within(rowOf('cliente-futura')).queryByRole('button', { name: 'Marcar como completada' })).not.toBeInTheDocument();
    expect(within(rowOf('cliente-pendiente')).queryByRole('button', { name: 'Marcar como completada' })).not.toBeInTheDocument();
  });

  it('marca la cita como completada y recarga la lista', async () => {
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    await userEvent.click(within(rowOf('cliente-iniciada')).getByRole('button', { name: 'Marcar como completada' }));

    expect(apiUpdateAppointmentStatus).toHaveBeenCalledWith('iniciada', 'COMPLETED');
    expect(apiGetAppointments).toHaveBeenCalledTimes(2);
  });

  it('muestra la cita completada con su etiqueta y sin acciones', async () => {
    render(<StylistAppointments />);
    const row = (await screen.findByText('cliente-hecha')).closest('tr');

    expect(within(row).getByText('Completada')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra el error del servidor si no se puede completar', async () => {
    apiUpdateAppointmentStatus.mockRejectedValue(new Error('No puedes completar una cita que todavía no ha empezado.'));
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    await userEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No puedes completar una cita que todavía no ha empezado.');
  });
});

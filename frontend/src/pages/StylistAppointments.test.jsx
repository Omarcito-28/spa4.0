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

  it('registra la inasistencia solo de citas activas que ya empezaron, tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    expect(screen.getAllByRole('button', { name: 'No asistió' })).toHaveLength(2);
    expect(within(rowOf('cliente-futura')).queryByRole('button', { name: 'No asistió' })).not.toBeInTheDocument();

    await userEvent.click(within(rowOf('cliente-pendiente')).getByRole('button', { name: 'No asistió' }));
    expect(apiUpdateAppointmentStatus).toHaveBeenCalledWith('pendiente', 'NO_SHOW');
  });

  it('muestra la cita completada con su etiqueta y solo permite ver las notas del cliente', async () => {
    render(<StylistAppointments />);
    const row = (await screen.findByText('cliente-hecha')).closest('tr');

    expect(within(row).getByText('Completada')).toBeInTheDocument();
    expect(within(row).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Notas']);
  });

  it('cambia a la vista de calendario semanal con las citas no canceladas', async () => {
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    await userEvent.click(screen.getByRole('button', { name: 'Calendario' }));

    expect(screen.getByText('Semana del Lun 7/1 al Dom 13/1')).toBeInTheDocument();
    const monday = screen.getByRole('list', { name: 'Lun 7/1' });
    expect(within(monday).getAllByRole('listitem')).toHaveLength(4);
    expect(within(monday).getByLabelText('3:00 PM, Corte para Dama, cliente-futura, Confirmada')).toBeInTheDocument();
  });

  it('filtra por estado y muestra un mensaje cuando no hay citas en el filtro', async () => {
    const user = userEvent.setup();
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    await user.click(screen.getByRole('button', { name: /Por confirmar/ }));
    expect(screen.getByText('cliente-pendiente')).toBeInTheDocument();
    expect(screen.queryByText('cliente-iniciada')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Historial/ }));
    expect(screen.getByText('cliente-hecha')).toBeInTheDocument();
    expect(screen.queryByText('cliente-pendiente')).not.toBeInTheDocument();

    apiGetAppointments.mockResolvedValue([appointment('hecha', { status: 'COMPLETED' })]);
    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }));
    await user.click(screen.getByRole('button', { name: /Confirmadas/ }));
    expect(await screen.findByText('No hay citas en "Confirmadas".')).toBeInTheDocument();
  });

  it('avisa cuando todavía no hay citas asignadas', async () => {
    apiGetAppointments.mockResolvedValue([]);
    render(<StylistAppointments />);
    expect(await screen.findByText('Todavía no tienes citas asignadas.')).toBeInTheDocument();
  });

  it('muestra el error del servidor si no se puede completar', async () => {
    apiUpdateAppointmentStatus.mockRejectedValue(new Error('No puedes completar una cita que todavía no ha empezado.'));
    render(<StylistAppointments />);
    await screen.findByText('cliente-iniciada');

    await userEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No puedes completar una cita que todavía no ha empezado.');
  });
});

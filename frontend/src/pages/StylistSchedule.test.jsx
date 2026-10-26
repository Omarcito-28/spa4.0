import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StylistSchedule from './StylistSchedule';
import { apiGetSchedule, apiUpdateSchedule } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetSchedule: vi.fn(),
  apiUpdateSchedule: vi.fn(),
}));

const week = () => [0, 1, 2, 3, 4, 5, 6].map(day => ({
  day, enabled: day >= 1 && day <= 5, start: '08:00', end: day === 1 ? '16:00' : '18:00',
}));

const renderSchedule = async () => {
  render(<StylistSchedule />);
  await waitFor(() => expect(screen.queryByText('Cargando tu horario…')).not.toBeInTheDocument());
};

describe('StylistSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetSchedule.mockResolvedValue(week());
    apiUpdateSchedule.mockImplementation(async schedule => schedule);
  });

  it('muestra el horario guardado con el resumen de la semana', async () => {
    await renderSchedule();
    expect(screen.getByLabelText('Lunes: desde')).toHaveValue('08:00');
    expect(screen.getByLabelText('Lunes: hasta')).toHaveValue('16:00');
    expect(screen.getByRole('switch', { name: 'Disponible Sábado' })).not.toBeChecked();
    // 8 h el lunes + 10 h de martes a viernes.
    expect(screen.getByText('48 h')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeDisabled();
  });

  it('avisa si la hora final no es posterior a la inicial y no deja guardar', async () => {
    await renderSchedule();
    fireEvent.change(screen.getByLabelText('Martes: hasta'), { target: { value: '07:00' } });

    expect(screen.getByRole('alert')).toHaveTextContent('La hora final debe ser posterior a la inicial.');
    expect(screen.getByLabelText('Martes: hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeDisabled();
  });

  it('copia el horario del lunes a los días activos y guarda la semana completa', async () => {
    const user = userEvent.setup();
    await renderSchedule();

    await user.click(screen.getByRole('button', { name: /Usar el horario del lunes/ }));
    expect(screen.getByLabelText('Viernes: hasta')).toHaveValue('16:00');
    expect(screen.queryByLabelText('Sábado: desde')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar horario' }));
    const sent = apiUpdateSchedule.mock.calls[0][0];
    expect(sent).toHaveLength(7);
    expect(sent.filter(day => day.enabled).every(day => day.start === '08:00' && day.end === '16:00')).toBe(true);
    expect(sent.find(day => day.day === 6)).toMatchObject({ enabled: false, end: '18:00' });
    expect(await screen.findByText(/quedó guardado/)).toBeInTheDocument();
  });

  it('activar un día de descanso muestra sus horas', async () => {
    const user = userEvent.setup();
    await renderSchedule();
    await user.click(screen.getByRole('switch', { name: 'Disponible Sábado' }));
    expect(screen.getByLabelText('Sábado: desde')).toBeInTheDocument();
    expect(screen.getByText('Tienes cambios sin guardar.')).toBeInTheDocument();
  });

  it('permite guardar el horario predeterminado si aún no hay uno guardado', async () => {
    const user = userEvent.setup();
    apiGetSchedule.mockResolvedValue([]);
    await renderSchedule();

    expect(screen.getByText('Aún no has guardado tu horario.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar horario' }));
    expect(apiUpdateSchedule).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ day: 1, enabled: true, start: '09:00', end: '19:00' }),
    ]));
  });

  it('muestra el error del servidor al guardar', async () => {
    const user = userEvent.setup();
    apiUpdateSchedule.mockRejectedValue(new Error('El horario semanal no es válido.'));
    await renderSchedule();
    await user.click(screen.getByRole('switch', { name: 'Disponible Sábado' }));
    await user.click(screen.getByRole('button', { name: 'Guardar horario' }));
    expect(await screen.findByText('El horario semanal no es válido.')).toBeInTheDocument();
  });
});

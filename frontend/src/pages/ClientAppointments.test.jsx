import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientAppointments from './ClientAppointments';
import { apiCreateReview, apiGetAppointmentPolicy, apiGetAppointments, apiGetMyReviewedAppointments } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointmentPolicy: vi.fn().mockResolvedValue({ cancellationNoticeHours: 0 }),
  apiGetAppointments: vi.fn(),
  apiGetMyReviewedAppointments: vi.fn().mockResolvedValue([]),
  apiCreateReview: vi.fn(),
  apiGetStylistAvailability: vi.fn(),
  apiGetStylists: vi.fn(),
  apiRescheduleAppointment: vi.fn(),
  apiUpdateAppointmentStatus: vi.fn(),
}));

describe('ClientAppointments', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('muestra cada estado con su etiqueta; las completadas solo se pueden calificar', async () => {
    apiGetAppointments.mockResolvedValue([
      { _id: '1', service: 'Corte para Dama', date: '2030-01-07', time: '10:00 AM', stylist: 'sofi', status: 'COMPLETED' },
      { _id: '2', service: 'Masaje Relajante', date: '2030-01-08', time: '11:00 AM', stylist: '', status: 'CONFIRMED' },
      { _id: '3', service: 'Tintura de Cabello', date: '2030-01-09', time: '9:00 AM', stylist: '', status: 'CANCELLED' },
    ]);
    render(<ClientAppointments />);

    const completed = (await screen.findByText('Corte para Dama')).closest('tr');
    expect(within(completed).getByText('Completada')).toBeInTheDocument();
    expect(within(completed).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Calificar']);

    const confirmed = screen.getByText('Masaje Relajante').closest('tr');
    expect(within(confirmed).getByText('Confirmada')).toBeInTheDocument();
    expect(within(confirmed).getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument();
    expect(within(confirmed).getByRole('button', { name: /Agregar a mi calendario/ })).toBeInTheDocument();

    const cancelled = screen.getByText('Tintura de Cabello').closest('tr');
    expect(within(cancelled).getByText('Cancelada')).toBeInTheDocument();
    expect(within(cancelled).queryByRole('button')).not.toBeInTheDocument();
  });

  it('sin el plazo mínimo de la política, pide comunicarse con el spa en lugar de mostrar acciones', async () => {
    // 10:00 AM del 7 de enero de 2030 en Bogotá. Solo se simula Date para no detener los temporizadores.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-07T15:00:00Z'));
    apiGetAppointmentPolicy.mockResolvedValue({ cancellationNoticeHours: 24 });
    apiGetAppointments.mockResolvedValue([
      { _id: '1', service: 'Corte para Dama', date: '2030-01-08', time: '9:00 AM', stylist: '', status: 'CONFIRMED' },
      { _id: '2', service: 'Masaje Relajante', date: '2030-01-08', time: '11:00 AM', stylist: '', status: 'CONFIRMED' },
    ]);
    render(<ClientAppointments />);

    expect(await screen.findByText(/hasta 24 horas antes de la cita/)).toBeInTheDocument();
    const soon = screen.getByText('Corte para Dama').closest('tr');
    expect(within(soon).queryByRole('button', { name: 'Reprogramar' })).not.toBeInTheDocument();
    expect(within(soon).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    expect(within(soon).getByRole('button', { name: /Agregar a mi calendario/ })).toBeInTheDocument();
    expect(within(soon).getByText('Faltan menos de 24 h: para cambios comunícate con el spa.')).toBeInTheDocument();
    const later = screen.getByText('Masaje Relajante').closest('tr');
    expect(within(later).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('el cliente califica una cita completada y ya no vuelve a ver el botón', async () => {
    const user = userEvent.setup();
    apiGetAppointments.mockResolvedValue([
      { _id: '1', service: 'Corte para Dama', date: '2030-01-07', time: '10:00 AM', stylist: 'sofi', status: 'COMPLETED' },
    ]);
    apiCreateReview.mockResolvedValue({});
    render(<ClientAppointments />);

    await user.click(await screen.findByRole('button', { name: /Calificar/ }));
    expect(screen.getByRole('button', { name: 'Enviar reseña' })).toBeDisabled();
    await user.click(screen.getByLabelText('4 estrellas').closest('label'));
    fireEvent.change(screen.getByLabelText('Comentario (opcional)'), { target: { value: 'Muy amable' } });
    apiGetMyReviewedAppointments.mockResolvedValue(['1']);
    await user.click(screen.getByRole('button', { name: 'Enviar reseña' }));

    expect(apiCreateReview).toHaveBeenCalledWith({ appointmentId: '1', rating: 4, comment: 'Muy amable' });
    expect(await screen.findByText(/Ya la calificaste/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Calificar/ })).not.toBeInTheDocument();
  });
});

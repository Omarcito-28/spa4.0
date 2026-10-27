// Escenario de aceptación: un cliente agenda una cita en otra ventana y los
// paneles del estilista y del administrador la muestran sin recargar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminAppointments from './AdminAppointments';
import StylistDashboard from './StylistDashboard';
import StylistAppointments from './StylistAppointments';
import Dashboard from './Dashboard';
import { apiGetAppointments } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn(),
  apiGetStylists: vi.fn().mockResolvedValue([{ _id: 's1', username: 'sofi', fullName: 'Sofi' }]),
  apiGetUsers: vi.fn().mockResolvedValue([]),
  apiUpdateAppointment: vi.fn(),
  apiUpdateAppointmentStatus: vi.fn(),
}));

const existing = { _id: 'a1', username: 'luis', service: 'Masaje Relajante', date: '2030-01-07', time: '9:00 AM', stylist: 'sofi', status: 'CONFIRMED', createdAt: '2030-01-01T10:00:00Z' };
const newBooking = { _id: 'a2', username: 'ana', service: 'Corte para Dama', date: '2030-01-07', time: '2:00 PM', stylist: 'sofi', status: 'PENDING', createdAt: '2030-01-07T15:00:00Z' };

const advance = ms => act(() => vi.advanceTimersByTimeAsync(ms));
const renderPage = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Paneles en vivo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-07T15:00:00Z')); // 10:00 AM en Bogotá
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    // Primera carga sin la cita nueva; en el siguiente refresco ya existe.
    apiGetAppointments.mockResolvedValueOnce([existing]).mockResolvedValue([existing, newBooking]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it.each([
    ['la lista de citas del estilista', <StylistAppointments />],
    ['la lista de citas del administrador', <AdminAppointments />],
  ])('%s muestra la cita nueva en menos de 30 s', async (_name, page) => {
    renderPage(page);
    await advance(0);
    expect(screen.getByText('luis')).toBeInTheDocument();
    expect(screen.queryByText('ana')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizado hace 0 s')).toBeInTheDocument();

    await advance(29999);
    expect(screen.queryByText('ana')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizado hace 29 s')).toBeInTheDocument();
    await advance(1);

    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('luis')).toBeInTheDocument();
    expect(screen.queryByText('Cargando citas…')).not.toBeInTheDocument();
  });

  it('el dashboard del administrador cuenta la nueva solicitud', async () => {
    renderPage(<AdminDashboard user={{ fullName: 'Admin' }} />);
    await advance(0);
    const panel = screen.getByRole('region', { name: 'Operación en vivo' });
    expect(within(panel).getByText('No hay solicitudes pendientes.')).toBeInTheDocument();

    await advance(30000);

    expect(within(panel).getByText(/Corte para Dama · ana · sofi/)).toBeInTheDocument();
    expect(within(panel).getByText('Por confirmar').previousSibling).toHaveTextContent('1');
    expect(within(panel).getByText('Citas hoy').previousSibling).toHaveTextContent('2');
  });

  it('el dashboard del estilista muestra su agenda de hoy actualizada', async () => {
    renderPage(<StylistDashboard user={{ fullName: 'Sofi' }} />);
    await advance(0);
    const panel = screen.getByRole('region', { name: 'Tu agenda de hoy' });
    // La cita de las 9:00 AM ya empezó (son las 10:00 AM).
    expect(within(panel).getByText('Listas para completar').previousSibling).toHaveTextContent('1');

    await advance(30000);

    expect(within(panel).getByText(/Corte para Dama · ana/)).toBeInTheDocument();
    expect(within(panel).getByText('Citas hoy').previousSibling).toHaveTextContent('2');
  });

  it('el dashboard del cliente muestra sus próximas citas', async () => {
    renderPage(<Dashboard user={{ fullName: 'Ana' }} />);
    await advance(0);
    const panel = screen.getByRole('region', { name: 'Tus citas' });
    expect(within(panel).getByText('Próximas').previousSibling).toHaveTextContent('1');

    await advance(30000);

    expect(within(panel).getByText('Próximas').previousSibling).toHaveTextContent('2');
    expect(within(panel).getByText('Pendiente')).toBeInTheDocument();
  });

  it('el botón de actualizar trae los datos sin esperar los 30 s', async () => {
    renderPage(<StylistAppointments />);
    await advance(0);

    await act(async () => screen.getByRole('button', { name: 'Actualizar ahora' }).click());
    await advance(0);

    expect(screen.getByText('ana')).toBeInTheDocument();
  });
});

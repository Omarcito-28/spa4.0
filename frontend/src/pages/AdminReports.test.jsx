import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminReports from './AdminReports';

vi.mock('../services/api', () => ({
  apiGetAppointments: vi.fn().mockResolvedValue([
    { _id: '1', service: 'Corte para Dama', date: '2030-01-07', status: 'COMPLETED', price: '$35.000' },
    { _id: '2', service: 'Masaje Relajante', date: '2030-01-07', status: 'COMPLETED', price: '$70.000' },
    { _id: '3', service: 'Corte para Dama', date: '2030-01-08', status: 'CONFIRMED', price: '$35.000' },
    { _id: '4', service: 'Corte para Dama', date: '2030-01-09', status: 'CANCELLED', price: '$35.000' },
    { _id: '5', service: 'Masaje Relajante', date: '2030-01-10', status: 'PENDING', price: '$70.000' },
  ]),
  apiGetServices: vi.fn().mockResolvedValue([
    { _id: 's1', name: 'Corte para Dama', price: '$35.000' },
    { _id: 's2', name: 'Masaje Relajante', price: '$70.000' },
  ]),
  apiGetUsers: vi.fn().mockResolvedValue([{ role: 'CLIENT' }, { role: 'STYLIST' }]),
  apiGetReviewSummary: vi.fn().mockResolvedValue({ services: [], stylists: [] }),
  apiGetAllReviews: vi.fn().mockResolvedValue([]),
  apiDeleteReview: vi.fn(),
}));

// Intl separa el símbolo de la cifra con un espacio duro; se normaliza para comparar.
const cardValue = label => screen.getByText(label).closest('div').querySelector('h2').textContent.replace(/\s/g, ' ');

const renderReports = () => render(<MemoryRouter><AdminReports /></MemoryRouter>);

describe('AdminReports', () => {
  it('cuenta las citas completadas y suma sus ingresos aparte de las confirmadas', async () => {
    renderReports();
    await screen.findByText('Citas completadas');

    expect(cardValue('Citas completadas')).toBe('2');
    expect(cardValue('Ingresos de citas completadas')).toBe('$ 105.000');
    expect(cardValue('Citas confirmadas')).toBe('1');
    expect(cardValue('Valor estimado confirmado')).toBe('$ 35.000');
    expect(cardValue('Citas en el período')).toBe('5');
  });

  it('permite filtrar por el estado Completada', async () => {
    renderReports();
    await screen.findByText('Citas completadas');

    await userEvent.selectOptions(screen.getByLabelText('Filtrar reportes por estado'), 'COMPLETED');

    expect(cardValue('Citas en el período')).toBe('2');
    expect(cardValue('Citas pendientes')).toBe('0');
  });
  it('desglosa las citas y los ingresos completados por servicio', async () => {
    renderReports();
    await screen.findByText('Citas completadas');

    const cells = name => [...screen.getByRole('cell', { name }).closest('tr').children].map(cell => cell.textContent.replace(/\s/g, ' '));
    expect(cells('Corte para Dama')).toEqual(['Corte para Dama', '3', '1', '$ 35.000']);
    expect(cells('Masaje Relajante')).toEqual(['Masaje Relajante', '2', '1', '$ 70.000']);
  });

  it('muestra los accesos a las demás secciones de administración', async () => {
    renderReports();
    const nav = await screen.findByRole('navigation', { name: 'Secciones de administración' });
    expect(within(nav).getByRole('link', { name: /Servicios/ })).toHaveAttribute('href', '/admin/services');
  });
});

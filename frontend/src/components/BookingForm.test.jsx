import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BookingForm from './BookingForm';

vi.mock('../contexts/auth', () => ({ useAuth: () => ({ user: { fullName: 'Ana' } }) }));
vi.mock('../services/api', () => ({
  apiCreateAppointment: vi.fn(),
  apiGetServices: vi.fn().mockResolvedValue([
    { _id: '1', name: 'Tratamiento Capilar', description: 'Hidratación profunda.', price: '$60.000', duration: 90, image: '/images/services/tratamiento_capilar.webp' },
    { _id: '2', name: 'Corte para Dama', price: '$35.000' },
  ]),
  apiGetStylists: vi.fn().mockResolvedValue([]),
  apiGetStylistAvailability: vi.fn().mockResolvedValue({ appointments: [], schedule: null }),
  resolveImageUrl: src => src,
}));

const renderForm = () => render(<MemoryRouter><BookingForm /></MemoryRouter>);

describe('BookingForm', () => {
  it('al elegir un servicio muestra su imagen, descripción, duración y precio', async () => {
    const user = userEvent.setup();
    renderForm();
    const select = await screen.findByLabelText('Servicio');
    await screen.findByRole('option', { name: 'Tratamiento Capilar' });
    expect(screen.queryByRole('region', { name: /Detalles de/ })).not.toBeInTheDocument();

    await user.selectOptions(select, 'Tratamiento Capilar');
    const preview = screen.getByRole('region', { name: 'Detalles de Tratamiento Capilar' });
    expect(within(preview).getByRole('img', { name: 'Tratamiento Capilar' })).toHaveAttribute('src', '/images/services/tratamiento_capilar.webp');
    expect(within(preview).getByText('Hidratación profunda.')).toBeInTheDocument();
    expect(within(preview).getByText('90 min')).toBeInTheDocument();
    expect(within(preview).getByText('$60.000')).toBeInTheDocument();
  });

  it('sin imagen ni duración usa un ícono y la duración por defecto', async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByRole('option', { name: 'Corte para Dama' });
    await user.selectOptions(screen.getByLabelText('Servicio'), 'Corte para Dama');
    const preview = screen.getByRole('region', { name: 'Detalles de Corte para Dama' });
    expect(within(preview).queryByRole('img')).not.toBeInTheDocument();
    expect(within(preview).getByText('60 min')).toBeInTheDocument();
  });
});

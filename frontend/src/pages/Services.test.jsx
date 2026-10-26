import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Services from './Services';
import { apiGetServices } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetServices: vi.fn(),
  resolveImageUrl: src => src,
}));

const services = [
  { _id: 's1', name: 'Masaje Relajante', price: '$70.000', duration: 90, description: 'Para aliviar el estrés.' },
  { _id: 's2', name: 'Corte para Dama', price: '$35.000', description: 'Corte profesional.' },
];

const renderServices = props => render(<MemoryRouter><Services {...props} /></MemoryRouter>);

describe('Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetServices.mockResolvedValue(services);
  });

  it('cada servicio tiene su botón para reservarlo, con la duración a la vista', async () => {
    renderServices({ isAuthenticated: true });

    const masaje = (await screen.findByText('Masaje Relajante')).closest('div');
    expect(within(masaje).getByText('90 min')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservar Masaje Relajante' }))
      .toHaveAttribute('href', '/appointments/new?service=Masaje%20Relajante');
    expect(screen.getByRole('link', { name: 'Reservar Corte para Dama' }))
      .toHaveAttribute('href', '/appointments/new?service=Corte%20para%20Dama');
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('sin sesión el botón pasa por el login y vuelve al formulario con el servicio elegido', async () => {
    renderServices({ isAuthenticated: false });

    const link = await screen.findByRole('link', { name: 'Reservar Masaje Relajante' });
    const url = new URL(link.getAttribute('href'), 'http://localhost');
    expect(url.pathname).toBe('/login');
    const returnTo = new URL(url.searchParams.get('returnTo'), 'http://localhost');
    expect(returnTo.pathname).toBe('/appointments/new');
    expect(returnTo.searchParams.get('service')).toBe('Masaje Relajante');
  });
});

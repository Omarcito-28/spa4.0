import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServicesCarousel from './ServicesCarousel';
import { apiGetServices } from '../services/api';
import { bookingPath } from '../utils/booking';

vi.mock('../services/api', () => ({
  apiGetServices: vi.fn(),
  resolveImageUrl: src => (src.startsWith('/api/') ? `https://api.test${src}` : src),
}));

const services = [
  { _id: 's1', name: 'Masaje Relajante', price: '$70.000', duration: 90, description: 'Para aliviar el estrés.', image: '/images/services/masaje.jpg' },
  { _id: 's2', name: 'Uñas & Spa', price: '$80.000', image: '/api/service-images/abc' },
];

const renderCarousel = props => render(<MemoryRouter><ServicesCarousel {...props} /></MemoryRouter>);

describe('ServicesCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los servicios reales del catálogo, con imágenes subidas incluidas', async () => {
    apiGetServices.mockResolvedValue(services);
    renderCarousel();

    expect(await screen.findByRole('group', { name: '1 de 2: Masaje Relajante' })).toBeInTheDocument();
    expect(screen.getByText('$70.000')).toBeInTheDocument();
    expect(screen.getByText('90 min')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByAltText('Uñas & Spa')).toHaveAttribute('src', 'https://api.test/api/service-images/abc');
  });

  it('el botón Reservar deja el servicio elegido, pasando por el login si no hay sesión', async () => {
    apiGetServices.mockResolvedValue(services);
    renderCarousel({ isAuthenticated: false });
    const link = await screen.findByRole('link', { name: 'Reservar Uñas & Spa' });
    expect(link).toHaveAttribute('href', '/login?returnTo=%2Fappointments%2Fnew%3Fservice%3DU%25C3%25B1as%2520%2526%2520Spa');
  });

  it('con sesión va directo al formulario de reserva', async () => {
    apiGetServices.mockResolvedValue(services);
    renderCarousel({ isAuthenticated: true });
    const link = await screen.findByRole('link', { name: 'Reservar Masaje Relajante' });
    expect(link).toHaveAttribute('href', '/appointments/new?service=Masaje%20Relajante');
  });

  it('no muestra la sección si el catálogo falla o está vacío', async () => {
    apiGetServices.mockRejectedValue(new Error('sin conexión'));
    const { container } = renderCarousel();
    await waitFor(() => expect(container).toBeEmptyDOMElement());

    apiGetServices.mockResolvedValue([]);
    const empty = renderCarousel();
    await waitFor(() => expect(empty.container).toBeEmptyDOMElement());
  });
});

describe('bookingPath', () => {
  it('el formulario lee el servicio de ?service= y el login acepta returnTo hacia /appointments/new', () => {
    expect(bookingPath('Corte', true)).toBe('/appointments/new?service=Corte');
    const returnTo = new URLSearchParams(bookingPath('Corte', false).split('?')[1]).get('returnTo');
    expect(returnTo).toBe('/appointments/new?service=Corte');
  });
});

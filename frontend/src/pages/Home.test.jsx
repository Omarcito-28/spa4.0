import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { apiGetHeroSlides } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetHeroSlides: vi.fn(),
  resolveImageUrl: src => `https://api.test${src}`,
}));
vi.mock('../components/ServicesCarousel', () => ({ default: () => null }));
vi.mock('../components/Testimonials', () => ({ default: () => null }));

const renderHome = () => render(<MemoryRouter><Home isAuthenticated={false} /></MemoryRouter>);
const indicators = () => screen.queryAllByRole('button', { name: /^Imagen \d/ });

describe('Home: carrusel de la portada', () => {
  it('muestra las imágenes que eligió el administrador, en su orden', async () => {
    apiGetHeroSlides.mockResolvedValue([
      { _id: '1', image: '/api/service-images/0123456789abcdef01234567', alt: 'Masaje' },
      { _id: '2', image: '/images/services/pedicure.jpg', alt: '' },
    ]);
    renderHome();

    await waitFor(() => expect(indicators()).toHaveLength(2));
    expect(indicators()[0]).toHaveAccessibleName('Imagen 1: Masaje');
    expect(screen.getByRole('img', { name: 'Masaje' })).toBeInTheDocument();
  });

  it('sin imágenes configuradas usa las predeterminadas', async () => {
    apiGetHeroSlides.mockResolvedValue([]);
    renderHome();
    await waitFor(() => expect(indicators()).toHaveLength(3));
  });

  it('si la API falla, también usa las predeterminadas', async () => {
    apiGetHeroSlides.mockRejectedValue(new Error('sin red'));
    renderHome();
    await waitFor(() => expect(indicators()).toHaveLength(3));
  });

  it('con una sola imagen no muestra indicadores', async () => {
    apiGetHeroSlides.mockResolvedValue([{ _id: '1', image: '/images/services/masaje.jpg', alt: '' }]);
    renderHome();
    await waitFor(() => expect(apiGetHeroSlides).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(indicators()).toHaveLength(0);
  });
});

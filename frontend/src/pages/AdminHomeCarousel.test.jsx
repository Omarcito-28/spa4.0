import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminHomeCarousel from './AdminHomeCarousel';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAllHeroSlides: vi.fn(),
  apiGetServiceImages: vi.fn(),
  apiCreateHeroSlide: vi.fn(),
  apiUpdateHeroSlide: vi.fn(),
  apiReorderHeroSlides: vi.fn(),
  apiDeleteHeroSlide: vi.fn(),
  apiUploadServiceImage: vi.fn(),
  resolveImageUrl: src => src,
}));

const slide = (id, image, extra = {}) => ({ _id: id, image, alt: '', position: 0, isActive: true, ...extra });

describe('AdminHomeCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.apiGetServiceImages.mockResolvedValue([{ url: '/api/service-images/0123456789abcdef01234567' }]);
  });

  it('sin imágenes explica que se ven las predeterminadas y permite empezar con ellas', async () => {
    api.apiGetAllHeroSlides.mockResolvedValue([]);
    api.apiCreateHeroSlide.mockImplementation(async data => slide(data.image, data.image, { alt: data.alt }));
    render(<AdminHomeCarousel />);

    expect(await screen.findByText(/la portada muestra estas imágenes predeterminadas/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Empezar con las predeterminadas/ }));

    expect(api.apiCreateHeroSlide).toHaveBeenCalledTimes(3);
    const list = await screen.findByRole('list', { name: 'Imágenes del carrusel, en orden' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('agrega una imagen de la galería y marca las que ya están', async () => {
    api.apiGetAllHeroSlides.mockResolvedValue([slide('a', '/images/services/masaje.jpg')]);
    api.apiCreateHeroSlide.mockResolvedValue(slide('b', '/images/services/pedicure.jpg'));
    render(<AdminHomeCarousel />);

    expect(await screen.findByRole('button', { name: 'masaje.jpg ya está en el carrusel' })).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Agregar pedicure.jpg al carrusel' }));

    expect(api.apiCreateHeroSlide).toHaveBeenCalledWith({ image: '/images/services/pedicure.jpg', alt: '' });
    expect(await screen.findByText('Imagen agregada al carrusel.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar 0123456789abcdef01234567 al carrusel' })).toBeEnabled();
  });

  it('reordena, oculta, describe y quita', async () => {
    const first = slide('a', '/images/services/masaje.jpg');
    const second = slide('b', '/images/services/pedicure.jpg', { position: 1 });
    api.apiGetAllHeroSlides.mockResolvedValue([first, second]);
    api.apiReorderHeroSlides.mockResolvedValue([second, first]);
    api.apiUpdateHeroSlide.mockImplementation(async (id, changes) => ({ ...(id === 'a' ? first : second), ...changes }));
    api.apiDeleteHeroSlide.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AdminHomeCarousel />);

    await user.click(await screen.findByRole('button', { name: 'Bajar la imagen 1' }));
    expect(api.apiReorderHeroSlides).toHaveBeenCalledWith(['b', 'a']);
    expect(screen.getByRole('button', { name: 'Subir la imagen 1' })).toBeDisabled();

    await user.click(screen.getAllByRole('button', { name: /Ocultar/ })[0]);
    expect(api.apiUpdateHeroSlide).toHaveBeenCalledWith('b', { isActive: false });
    expect(await screen.findByText('Oculta')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Descripción de la imagen 2'), 'Masaje relajante');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(api.apiUpdateHeroSlide).toHaveBeenCalledWith('a', { alt: 'Masaje relajante' });

    await user.click(screen.getByRole('button', { name: 'Quitar la imagen 1' }));
    expect(api.apiDeleteHeroSlide).toHaveBeenCalledWith('b');
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });

  it('muestra el error del backend', async () => {
    api.apiGetAllHeroSlides.mockResolvedValue([]);
    api.apiCreateHeroSlide.mockRejectedValue(new Error('El carrusel admite hasta 10 imágenes.'));
    render(<AdminHomeCarousel />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar masaje.jpg al carrusel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El carrusel admite hasta 10 imágenes.');
  });
});

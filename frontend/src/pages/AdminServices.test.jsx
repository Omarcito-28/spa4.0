import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminServices from './AdminServices';
import { apiCreateService, apiGetAllServices, apiGetServiceImages, apiUpdateService, apiUploadServiceImage } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetAllServices: vi.fn(),
  apiCreateService: vi.fn(),
  apiUpdateService: vi.fn(),
  apiDeleteService: vi.fn(),
  apiGetServiceImages: vi.fn(),
  apiUploadServiceImage: vi.fn(),
  resolveImageUrl: src => src,
}));

const masaje = { _id: 's1', name: 'Masaje', price: '$90.000', duration: 60, image: '/images/services/masaje.jpg' };

const renderServices = () => render(<MemoryRouter><AdminServices /></MemoryRouter>);

const fillService = () => {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Uñas acrílicas' } });
  fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '$80.000' } });
};

describe('AdminServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetAllServices.mockResolvedValue([masaje]);
    apiGetServiceImages.mockResolvedValue([]);
    apiCreateService.mockResolvedValue({});
  });

  it('sube una imagen nueva, la muestra y la guarda con el servicio', async () => {
    const user = userEvent.setup();
    apiUploadServiceImage.mockResolvedValue({ _id: 'img1', url: '/api/service-images/img1' });
    renderServices();
    await screen.findByText('Masaje');

    fillService();
    const file = new File(['png'], 'unas.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Subir imagen del servicio'), file);

    expect(apiUploadServiceImage).toHaveBeenCalledWith(file);
    expect(await screen.findByAltText('Vista previa de la imagen seleccionada')).toHaveAttribute('src', '/api/service-images/img1');
    expect(screen.getByRole('button', { name: 'Elegir imagen img1' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Agregar servicio' }));
    await waitFor(() => expect(apiCreateService).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Uñas acrílicas', image: '/api/service-images/img1' })
    ));
  });

  it('permite elegir una imagen existente de la galería', async () => {
    const user = userEvent.setup();
    apiGetServiceImages.mockResolvedValue([{ _id: 'old', url: '/api/service-images/old' }]);
    renderServices();
    await screen.findByRole('button', { name: 'Elegir imagen old' });

    fillService();
    await user.click(screen.getByRole('button', { name: 'Elegir imagen pedicure.jpg' }));
    expect(screen.getByRole('button', { name: 'Elegir imagen pedicure.jpg' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Agregar servicio' }));
    await waitFor(() => expect(apiCreateService).toHaveBeenCalledWith(
      expect.objectContaining({ image: '/images/services/pedicure.jpg' })
    ));
  });

  it('avisa si el archivo no es una imagen admitida y no lo sube', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderServices();
    await screen.findByText('Masaje');

    await user.upload(screen.getByLabelText('Subir imagen del servicio'), new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Formato no admitido');
    expect(apiUploadServiceImage).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor si la subida falla', async () => {
    const user = userEvent.setup();
    apiUploadServiceImage.mockRejectedValue(new Error('La imagen no puede superar 5 MB.'));
    renderServices();
    await screen.findByText('Masaje');

    await user.upload(screen.getByLabelText('Subir imagen del servicio'), new File(['x'], 'big.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La imagen no puede superar 5 MB.');
  });

  it('oculta un servicio del catálogo y permite volver a publicarlo', async () => {
    const user = userEvent.setup();
    apiUpdateService.mockResolvedValue({});
    renderServices();
    await screen.findByText('Masaje');
    expect(screen.getByText('Publicado')).toBeInTheDocument();

    apiGetAllServices.mockResolvedValue([{ ...masaje, isActive: false }]);
    await user.click(screen.getByRole('button', { name: 'Ocultar Masaje' }));

    expect(apiUpdateService).toHaveBeenCalledWith('s1', { isActive: false });
    expect(await screen.findByText('"Masaje" ya no aparece en el catálogo.')).toBeInTheDocument();
    expect(screen.getByText('Oculto')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publicar Masaje' }));
    expect(apiUpdateService).toHaveBeenLastCalledWith('s1', { isActive: true });
  });
});

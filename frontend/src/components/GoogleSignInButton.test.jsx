import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GoogleSignInButton from './GoogleSignInButton';
import { apiGetAuthProviders } from '../services/api';
import { resetGoogleIdentityCache } from '../utils/googleIdentity';

vi.mock('../services/api', () => ({ apiGetAuthProviders: vi.fn() }));

// Google Identity Services simulado: guarda la configuración y "dibuja" un botón.
const installFakeGoogle = () => {
  const googleId = {
    initialize: vi.fn(),
    renderButton: vi.fn(element => {
      const button = document.createElement('div');
      button.setAttribute('role', 'button');
      button.textContent = 'Continuar con Google';
      element.appendChild(button);
    }),
  };
  window.google = { accounts: { id: googleId } };
  return googleId;
};

describe('GoogleSignInButton', () => {
  beforeEach(() => resetGoogleIdentityCache());
  afterEach(() => { delete window.google; });

  it('no muestra nada si el backend no tiene Google configurado', async () => {
    apiGetAuthProviders.mockResolvedValue({ google: null });
    const { container } = render(<GoogleSignInButton onCredential={vi.fn()} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('tampoco si el backend no responde', async () => {
    apiGetAuthProviders.mockRejectedValue(new Error('sin red'));
    const { container } = render(<GoogleSignInButton onCredential={vi.fn()} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('dibuja el botón oficial con el Client ID del backend y entrega la credencial', async () => {
    apiGetAuthProviders.mockResolvedValue({ google: { clientId: 'cliente.apps.googleusercontent.com' } });
    const googleId = installFakeGoogle();
    const onCredential = vi.fn();

    render(<GoogleSignInButton onCredential={onCredential} text="signup_with" />);

    expect(await screen.findByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
    expect(googleId.initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'cliente.apps.googleusercontent.com', ux_mode: 'popup', auto_select: false, context: 'signup',
    }));
    expect(googleId.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ text: 'signup_with', locale: 'es' }));

    googleId.initialize.mock.calls[0][0].callback({ credential: 'id-token-de-google' });
    expect(onCredential).toHaveBeenCalledWith('id-token-de-google');
  });

  it('avisa si el script de Google no carga', async () => {
    apiGetAuthProviders.mockResolvedValue({ google: { clientId: 'cliente' } });
    const append = vi.spyOn(document.head, 'appendChild').mockImplementation(script => {
      queueMicrotask(() => script.onerror?.());
      return script;
    });

    render(<GoogleSignInButton onCredential={vi.fn()} />);

    expect(await screen.findByRole('status')).toHaveTextContent('No se pudo cargar el acceso con Google');
    append.mockRestore();
  });
});

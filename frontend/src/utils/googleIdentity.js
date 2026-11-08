import { apiGetAuthProviders } from '../services/api';

// Google Identity Services: el script oficial de Google que dibuja el botón
// "Continuar con Google" y entrega un token de identidad firmado (ID token).
// Solo se descarga en las páginas que muestran el botón y cuando el backend
// tiene GOOGLE_CLIENT_ID configurado.
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
let clientIdPromise = null;

export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.google?.accounts?.id
      ? resolve(window.google.accounts.id)
      : reject(new Error('Google Identity Services no está disponible.')));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('No se pudo cargar el acceso con Google.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

// El Client ID es público y vive en el backend: así se configura en un solo lugar.
// Cadena vacía cuando Google no está configurado o el backend no responde.
export const getGoogleClientId = () => {
  clientIdPromise ??= apiGetAuthProviders()
    .then(providers => providers?.google?.clientId || '')
    .catch(() => {
      clientIdPromise = null;
      return '';
    });
  return clientIdPromise;
};

// Solo para pruebas.
export const resetGoogleIdentityCache = () => {
  scriptPromise = null;
  clientIdPromise = null;
};

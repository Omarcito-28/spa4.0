import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { getGoogleClientId, loadGoogleIdentity } from '../utils/googleIdentity';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

// Alto del botón de Google: se reserva mientras carga para que la página no salte.
const Slot = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  opacity: ${props => (props.$disabled ? 0.55 : 1)};
  pointer-events: ${props => (props.$disabled ? 'none' : 'auto')};
`;

const Hint = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: 1rem;
  text-align: center;
`;

// Botón oficial de Google (Google exige su diseño). Al elegir la cuenta, Google
// entrega un token de identidad que se envía al backend con `onCredential`.
// Si el backend no tiene Google configurado, no se muestra nada.
// text: 'continue_with' | 'signin_with' | 'signup_with'.
// `after` se muestra debajo solo cuando hay botón (por ejemplo un separador "o…").
function GoogleSignInButton({ onCredential, text = 'continue_with', disabled = false, hint, after = null }) {
  const slotRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    callbackRef.current = onCredential;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const clientId = await getGoogleClientId();
      if (!active) return;
      if (!clientId) {
        setStatus('unavailable');
        return;
      }
      const googleId = await loadGoogleIdentity();
      if (!active || !slotRef.current) return;
      googleId.initialize({
        client_id: clientId,
        callback: response => callbackRef.current?.(response.credential),
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        context: text === 'signup_with' ? 'signup' : 'signin',
      });
      const width = Math.round(Math.min(Math.max(slotRef.current.offsetWidth || 320, 200), 400));
      googleId.renderButton(slotRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
        logo_alignment: 'center',
        locale: 'es',
        width,
      });
      setStatus('ready');
    })().catch(() => {
      if (active) setStatus('error');
    });
    return () => { active = false; };
  }, [text]);

  if (status === 'unavailable') return null;

  return (
    <>
      <Wrapper>
        <Slot ref={slotRef} $disabled={disabled} aria-busy={status === 'loading' || undefined} data-testid="google-signin" />
        {status === 'error' && <Hint role="status">No se pudo cargar el acceso con Google. Usa tu usuario y contraseña.</Hint>}
        {status === 'ready' && hint && <Hint>{hint}</Hint>}
      </Wrapper>
      {status !== 'error' && after}
    </>
  );
}

export default GoogleSignInButton;

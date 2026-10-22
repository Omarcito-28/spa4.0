import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequestPasswordReset, apiResetPassword } from '../services/api';
import { Button, Card, Description, Field, Form, Notice, Page, Title } from '../components/ManagementUI';

function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setNotice(null);
    if (token && password !== confirmation) {
      setNotice({ error: true, text: 'Las contraseñas no coinciden.' });
      return;
    }
    setBusy(true);
    try {
      if (token) {
        const result = await apiResetPassword(token, password);
        setNotice({ error: false, text: result.message });
      } else {
        const result = await apiRequestPasswordReset(email);
        setNotice({ error: false, text: result.message });
      }
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Title>{token ? 'Crear nueva contraseña' : 'Recuperar contraseña'}</Title>
      <Description>
        {token
          ? 'El enlace es válido durante 30 minutos y solo puede utilizarse una vez.'
          : 'Te enviaremos un enlace si encontramos una cuenta asociada a ese correo.'}
      </Description>
      <Card>
        <Form onSubmit={submit}>
          {token ? (
            <>
              <Field>Nueva contraseña<input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></Field>
              <Field>Confirmar contraseña<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" /></Field>
            </>
          ) : (
            <Field>Correo electrónico<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></Field>
          )}
          {notice && <Notice $error={notice.error} role={notice.error ? 'alert' : 'status'}>{notice.text}</Notice>}
          <Button type="submit" disabled={busy}>
            {busy ? 'Procesando…' : token ? 'Actualizar contraseña' : 'Enviar enlace'}
          </Button>
        </Form>
        {notice && !notice.error && token && <p><Link to="/login">Ir a iniciar sesión</Link></p>}
      </Card>
    </Page>
  );
}

export default PasswordRecovery;

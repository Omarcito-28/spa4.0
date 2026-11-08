import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Button, Card, Description, Field, Form, Notice, Page, Title } from '../components/ManagementUI';

function Profile() {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  // Sesiones guardadas antes de este cambio no traen el dato: se asume que hay contraseña.
  const hasPassword = user?.hasPassword !== false;
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    password: '',
    currentPassword: '',
  });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const payload = { fullName: form.fullName, email: form.email, phoneNumber: form.phoneNumber };
    if (form.password) {
      payload.password = form.password;
      if (hasPassword) payload.currentPassword = form.currentPassword;
    }
    const result = await updateProfile(payload);
    setNotice({ error: !result.success, text: result.success ? 'Tu perfil se actualizó.' : result.error });
    if (result.success) setForm(current => ({ ...current, password: '', currentPassword: '' }));
    setBusy(false);
  };

  return (
    <Page>
      <Title>Mi perfil</Title>
      <Description>
        {hasPassword
          ? 'Actualiza tus datos personales. Para cambiar tu contraseña necesitarás verificar la actual.'
          : 'Actualiza tus datos personales. Entras con Google; si quieres, crea también una contraseña para entrar con tu usuario o correo.'}
      </Description>
      {location.state?.welcome === 'google' && (
        <Notice role="status">
          <i className="fas fa-hand-sparkles" aria-hidden="true"></i> ¡Te damos la bienvenida! Tu cuenta se creó con Google.
          Agrega tu teléfono para que el spa pueda confirmarte las citas.
        </Notice>
      )}
      {user?.googleLinked && (
        <Notice role="note">
          <i className="fab fa-google" aria-hidden="true"></i> Tu cuenta está vinculada con Google: puedes entrar con el botón “Continuar con Google”.
        </Notice>
      )}
      <Card>
        <Form onSubmit={submit}>
          <Field>Nombre completo<input name="fullName" value={form.fullName} onChange={update} required maxLength={100} /></Field>
          <Field>Correo electrónico<input name="email" type="email" value={form.email} onChange={update} required /></Field>
          <Field>Teléfono<input name="phoneNumber" value={form.phoneNumber} onChange={update} maxLength={30} /></Field>
          {form.password && hasPassword && <Field>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={update} required /></Field>}
          <Field>{hasPassword ? 'Nueva contraseña (opcional)' : 'Crear contraseña (opcional)'}<input name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} minLength={8} /></Field>
          {notice && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
          <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</Button>
        </Form>
      </Card>
    </Page>
  );
}

export default Profile;

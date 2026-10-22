import { useState } from 'react';
import { useAuth } from '../contexts/auth';
import { Button, Card, Description, Field, Form, Notice, Page, Title } from '../components/ManagementUI';

function Profile() {
  const { user, updateProfile } = useAuth();
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
      payload.currentPassword = form.currentPassword;
    }
    const result = await updateProfile(payload);
    setNotice({ error: !result.success, text: result.success ? 'Tu perfil se actualizó.' : result.error });
    if (result.success) setForm(current => ({ ...current, password: '', currentPassword: '' }));
    setBusy(false);
  };

  return (
    <Page>
      <Title>Mi perfil</Title>
      <Description>Actualiza tus datos personales. Para cambiar tu contraseña necesitarás verificar la actual.</Description>
      <Card>
        <Form onSubmit={submit}>
          <Field>Nombre completo<input name="fullName" value={form.fullName} onChange={update} required maxLength={100} /></Field>
          <Field>Correo electrónico<input name="email" type="email" value={form.email} onChange={update} required /></Field>
          <Field>Teléfono<input name="phoneNumber" value={form.phoneNumber} onChange={update} maxLength={30} /></Field>
          {form.password && <Field>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={update} required /></Field>}
          <Field>Nueva contraseña (opcional)<input name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} minLength={8} /></Field>
          {notice && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
          <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</Button>
        </Form>
      </Card>
    </Page>
  );
}

export default Profile;

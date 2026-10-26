import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { apiCreateUser, apiDeleteUser, apiGetUsers, apiUpdateUser } from '../services/api';
import { useAuth } from '../contexts/auth';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import { Button, Card, Description, EmptyCell, Field, Form, Grid, Notice, Page, ResultCount, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Cliente' },
  { value: 'STYLIST', label: 'Estilista' },
  { value: 'ADMIN', label: 'Administrador' },
];

const emptyAccount = { fullName: '', username: '', email: '', phoneNumber: '', password: '', role: 'STYLIST' };

const ROLE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'CLIENT', label: 'Clientes' },
  { value: 'STYLIST', label: 'Estilistas' },
  { value: 'ADMIN', label: 'Administradores' },
];

const AccountState = styled.span`
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: ${props => props.$active ? '#dff3e4' : '#eeeae3'};
  color: ${props => props.$active ? '#1f5f33' : '#5c564c'};
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
`;

const Person = styled.div`
  strong {
    display: block;
  }

  span {
    font-size: 0.95rem;
    color: ${theme.colors.textMuted};
  }
`;

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [account, setAccount] = useState(emptyAccount);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  // Resultado de desactivar, reactivar, eliminar o cambiar rol; se muestra junto a la tabla.
  const [feedback, setFeedback] = useState(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      setUsers(await apiGetUsers());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Tras un fallo también se recarga la lista, por si los datos en pantalla estaban desactualizados.
  const runAction = async (user, request, successText) => {
    setBusyId(user._id);
    setFeedback(null);
    try {
      await request();
      setFeedback({ error: false, text: successText });
    } catch (requestError) {
      setFeedback({ error: true, text: `${user.fullName}: ${requestError.message}` });
    } finally {
      await load();
      setBusyId('');
    }
  };

  const updateRole = (user, role) => runAction(
    user,
    () => apiUpdateUser(user._id, { role }),
    `${user.fullName} ahora es ${ROLE_OPTIONS.find(option => option.value === role)?.label.toLowerCase()}.`
  );

  const setActive = user => {
    const activate = user.isActive === false;
    return runAction(
      user,
      () => apiUpdateUser(user._id, { isActive: activate }),
      `Se ${activate ? 'reactivó' : 'desactivó'} la cuenta de ${user.fullName}.`
    );
  };

  const removeUser = user => {
    if (!window.confirm(`¿Eliminar definitivamente la cuenta de ${user.fullName}? Esta acción no se puede deshacer.`)) return;
    return runAction(user, () => apiDeleteUser(user._id), `Se eliminó la cuenta de ${user.fullName}.`);
  };

  const changeAccount = event => setAccount(current => ({ ...current, [event.target.name]: event.target.value }));

  const createAccount = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await apiCreateUser(account);
      setAccount(emptyAccount);
      setCreating(false);
      setNotice({ error: false, text: `Se creó la cuenta de ${created.fullName} como ${ROLE_OPTIONS.find(option => option.value === created.role)?.label.toLowerCase()}.` });
      await load();
    } catch (requestError) {
      setNotice({ error: true, text: requestError.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = search.trim().toLocaleLowerCase();
    return (!term || `${user.username} ${user.fullName} ${user.email} ${user.phoneNumber || ''}`.toLocaleLowerCase().includes(term)) &&
      (!roleFilter || user.role === roleFilter);
  });
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const countByRole = role => users.filter(user => user.role === role).length;

  return (
    <Page>
      <AdminNav />
      <Title>Gestionar usuarios</Title>
      <Description>Administra las cuentas, crea cuentas nuevas para estilistas o administradores y asigna roles con acceso controlado.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      {notice && !creating && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
      {creating ? (
        <Card>
          <h2>Nueva cuenta</h2>
          <Form onSubmit={createAccount}>
            <Grid>
              <Field>Nombre completo<input name="fullName" value={account.fullName} onChange={changeAccount} required maxLength={120} /></Field>
              <Field>Nombre de usuario<input name="username" value={account.username} onChange={changeAccount} required maxLength={40} autoComplete="off" /></Field>
              <Field>Correo electrónico<input name="email" type="email" value={account.email} onChange={changeAccount} required /></Field>
              <Field>Teléfono<input name="phoneNumber" type="tel" value={account.phoneNumber} onChange={changeAccount} maxLength={30} /></Field>
              <Field>Contraseña inicial<input name="password" type="password" value={account.password} onChange={changeAccount} required minLength={8} autoComplete="new-password" /></Field>
              <Field>Rol
                <select name="role" value={account.role} onChange={changeAccount}>
                  {ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
            </Grid>
            <Button type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</Button>
            <Button type="button" $secondary onClick={() => { setCreating(false); setAccount(emptyAccount); setNotice(null); }}>Cancelar</Button>
          </Form>
          {notice?.error && <Notice $error role="alert">{notice.text}</Notice>}
        </Card>
      ) : (
        <Button type="button" style={{ margin: '0 0 1.25rem' }} onClick={() => { setCreating(true); setNotice(null); }}>
          <i className="fas fa-user-plus" aria-hidden="true"></i> Nuevo usuario
        </Button>
      )}
      <Toolbar>
        <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar usuario, nombre o correo" aria-label="Buscar usuarios" />
        <select value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setPage(1); }} aria-label="Filtrar por rol">
          {ROLE_FILTERS.map(option => (
            <option key={option.value} value={option.value}>
              {option.value ? `${option.label} (${countByRole(option.value)})` : `Todos los roles (${users.length})`}
            </option>
          ))}
        </select>
      </Toolbar>
      <ResultCount>{filteredUsers.length} usuarios encontrados</ResultCount>
      {feedback && <Notice $error={feedback.error} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</Notice>}
      <TableWrap><Table>
        <thead><tr><th>Usuario</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {visibleUsers.length === 0 && <tr><EmptyCell colSpan={6}>No hay usuarios que coincidan con la búsqueda.</EmptyCell></tr>}
          {visibleUsers.map(user => {
            // El backend no permite que el administrador se desactive, se elimine ni cambie su propio rol.
            const isSelf = user.username === currentUser?.username;
            const locked = isSelf || busyId === user._id;
            return (
              <tr key={user._id}>
                <td><Person><strong>{user.fullName}</strong><span>@{user.username}{isSelf && ' (tú)'}</span></Person></td>
                <td>{user.email}</td><td>{user.phoneNumber || '—'}</td>
                <td>
                  <select aria-label={`Rol de ${user.username}`} value={user.role} disabled={locked} onChange={event => updateRole(user, event.target.value)}>
                    {ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </td>
                <td><AccountState $active={user.isActive !== false}>{user.isActive === false ? 'Desactivada' : 'Activa'}</AccountState></td>
                <td>
                  <Button type="button" $danger={user.isActive !== false} $secondary={user.isActive === false} disabled={locked} onClick={() => setActive(user)}>
                    {user.isActive === false ? 'Reactivar' : 'Desactivar'}
                  </Button>
                  <Button type="button" $secondary disabled={locked} onClick={() => removeUser(user)} aria-label={`Eliminar a ${user.username}`}>
                    <i className="fas fa-trash" aria-hidden="true"></i> Eliminar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table></TableWrap>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Page>
  );
}

export default AdminUsers;

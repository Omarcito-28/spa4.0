import { useCallback, useEffect, useState } from 'react';
import { apiGetUsers, apiUpdateUser } from '../services/api';
import { Button, Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
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

  const updateRole = async (user, role) => {
    setBusyId(user._id);
    try {
      await apiUpdateUser(user._id, { role });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const setActive = async user => {
    setBusyId(user._id);
    try {
      await apiUpdateUser(user._id, { isActive: user.isActive === false });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const filteredUsers = users.filter(user => {
    const term = search.trim().toLocaleLowerCase();
    return (!term || `${user.username} ${user.fullName} ${user.email} ${user.phoneNumber || ''}`.toLocaleLowerCase().includes(term)) &&
      (!roleFilter || user.role === roleFilter);
  });
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Page>
      <Title>Gestionar usuarios</Title>
      <Description>Administra las cuentas y asigna roles con acceso controlado.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar usuario, nombre o correo" aria-label="Buscar usuarios" />
        <select value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setPage(1); }} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option><option value="CLIENT">Clientes</option><option value="STYLIST">Estilistas</option><option value="ADMIN">Administradores</option>
        </select>
      </div>
      <p>{filteredUsers.length} usuarios encontrados</p>
      <TableWrap><Table>
        <thead><tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{visibleUsers.map(user => (
          <tr key={user._id}>
            <td>{user.username}</td><td>{user.fullName}</td><td>{user.email}</td><td>{user.phoneNumber || '—'}</td>
            <td>
              <select aria-label={`Rol de ${user.username}`} value={user.role} disabled={busyId === user._id} onChange={event => updateRole(user, event.target.value)}>
                <option value="CLIENT">Cliente</option><option value="STYLIST">Estilista</option><option value="ADMIN">Administrador</option>
              </select>
            </td>
            <td>{user.isActive === false ? 'Desactivada' : 'Activa'}</td>
            <td><Button type="button" $danger={user.isActive !== false} disabled={busyId === user._id} onClick={() => setActive(user)}>{user.isActive === false ? 'Reactivar' : 'Desactivar'}</Button></td>
          </tr>
        ))}</tbody>
      </Table></TableWrap>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</button>
        <span>Página {page} de {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => setPage(current => current + 1)}>Siguiente</button>
      </div>
    </Page>
  );
}

export default AdminUsers;

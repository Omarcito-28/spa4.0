import { useCallback, useEffect, useState } from 'react';
import { apiGetAppointments, apiGetStylists, apiUpdateAppointment } from '../services/api';
import { Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', service: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      const [allAppointments, allStylists] = await Promise.all([apiGetAppointments(), apiGetStylists()]);
      setAppointments(allAppointments);
      setStylists(allStylists);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const update = async (id, changes) => {
    try {
      await apiUpdateAppointment(id, changes);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const term = filters.search.trim().toLocaleLowerCase();
    return (!term || `${appointment.username} ${appointment.service} ${appointment.stylist}`.toLocaleLowerCase().includes(term)) &&
      (!filters.status || appointment.status === filters.status) &&
      (!filters.service || appointment.service === filters.service) &&
      (!filters.from || appointment.date >= filters.from) &&
      (!filters.to || appointment.date <= filters.to);
  });
  const pageCount = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const visibleAppointments = filteredAppointments.slice((page - 1) * pageSize, page * pageSize);
  const changeFilter = event => {
    setFilters(current => ({ ...current, [event.target.name]: event.target.value }));
    setPage(1);
  };

  return (
    <Page>
      <Title>Todas las citas</Title>
      <Description>Confirma las solicitudes y asigna un estilista para cada reserva.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <input name="search" value={filters.search} onChange={changeFilter} placeholder="Buscar cliente, servicio o estilista" aria-label="Buscar citas" />
        <select name="status" value={filters.status} onChange={changeFilter} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option><option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmada</option><option value="CANCELLED">Cancelada</option>
        </select>
        <select name="service" value={filters.service} onChange={changeFilter} aria-label="Filtrar por servicio">
          <option value="">Todos los servicios</option>{[...new Set(appointments.map(item => item.service))].sort().map(service => <option key={service} value={service}>{service}</option>)}
        </select>
        <label>Desde <input name="from" type="date" value={filters.from} onChange={changeFilter} /></label>
        <label>Hasta <input name="to" type="date" value={filters.to} onChange={changeFilter} /></label>
      </div>
      <p>{filteredAppointments.length} citas encontradas</p>
      <TableWrap><Table>
        <thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha y hora</th><th>Estilista</th><th>Estado</th><th>Notas</th></tr></thead>
        <tbody>{visibleAppointments.map(appointment => (
          <tr key={appointment._id}>
            <td>{appointment.username}</td><td>{appointment.service}</td><td>{appointment.date} · {appointment.time}</td>
            <td><select aria-label={`Estilista de ${appointment.username}`} value={appointment.stylist || ''} onChange={event => update(appointment._id, { stylist: event.target.value })}>
              <option value="">Por asignar</option>{stylists.map(stylist => <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>)}
            </select></td>
            <td><select aria-label={`Estado de ${appointment.username}`} value={appointment.status} onChange={event => update(appointment._id, { status: event.target.value })}>
              <option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmada</option><option value="CANCELLED">Cancelada</option>
            </select></td>
            <td>{appointment.notes || '—'}</td>
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

export default AdminAppointments;

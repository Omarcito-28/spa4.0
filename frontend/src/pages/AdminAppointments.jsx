import { useState } from 'react';
import { apiGetAppointments, apiGetStylists, apiUpdateAppointment } from '../services/api';
import RefreshStatus from '../components/RefreshStatus';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import { Button, Description, EmptyCell, Notice, Page, ResultCount, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';
import StatusBadge from '../components/StatusBadge';
import { STATUS_OPTIONS } from '../utils/appointmentStatus';

const loadAppointmentsAndStylists = async () => {
  const [appointments, stylists] = await Promise.all([apiGetAppointments(), apiGetStylists()]);
  return { appointments, stylists };
};

const EMPTY_FILTERS = { search: '', status: '', service: '', from: '', to: '' };

function AdminAppointments() {
  const live = useAutoRefresh(loadAppointmentsAndStylists, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data?.appointments ?? [];
  const stylists = live.data?.stylists ?? [];
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const error = actionError || live.error;
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [requestedPage, setPage] = useState(1);
  const pageSize = 10;

  // Los controles de la fila se bloquean mientras se guarda, para que dos cambios rápidos no se pisen.
  const update = async (id, changes) => {
    setBusyId(id);
    try {
      await apiUpdateAppointment(id, changes);
      setActionError('');
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      await live.refresh();
      setBusyId('');
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
  // Si un refresco reduce la lista, se queda en la última página que existe.
  const page = Math.min(requestedPage, pageCount);
  const visibleAppointments = filteredAppointments.slice((page - 1) * pageSize, page * pageSize);
  const changeFilter = event => {
    setFilters(current => ({ ...current, [event.target.name]: event.target.value }));
    setPage(1);
  };

  return (
    <Page>
      <AdminNav />
      <Title>Todas las citas</Title>
      <Description>Confirma las solicitudes, asigna un estilista para cada reserva y marca como completadas las citas ya atendidas.</Description>
      <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      {error && <Notice $error role="alert">{error}</Notice>}
      <Toolbar>
        <input name="search" value={filters.search} onChange={changeFilter} placeholder="Buscar cliente, servicio o estilista" aria-label="Buscar citas" />
        <select name="status" value={filters.status} onChange={changeFilter} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>{STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select name="service" value={filters.service} onChange={changeFilter} aria-label="Filtrar por servicio">
          <option value="">Todos los servicios</option>{[...new Set(appointments.map(item => item.service))].sort().map(service => <option key={service} value={service}>{service}</option>)}
        </select>
        <label>Desde <input name="from" type="date" value={filters.from} onChange={changeFilter} /></label>
        <label>Hasta <input name="to" type="date" value={filters.to} onChange={changeFilter} /></label>
        <Button type="button" $secondary onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}>Limpiar filtros</Button>
      </Toolbar>
      <ResultCount>{filteredAppointments.length} citas encontradas</ResultCount>
      <TableWrap><Table>
        <thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha y hora</th><th>Estilista</th><th>Estado</th><th>Notas</th></tr></thead>
        <tbody>
          {visibleAppointments.length === 0 && <tr><EmptyCell colSpan={6}>No hay citas que coincidan con los filtros.</EmptyCell></tr>}
          {visibleAppointments.map(appointment => (
          <tr key={appointment._id}>
            <td>{appointment.username}</td><td>{appointment.service}</td><td style={{ whiteSpace: 'nowrap' }}>{appointment.date} · {appointment.time}</td>
            {/* Una cita completada es definitiva: se muestra sin controles de edición. */}
            {appointment.status === 'COMPLETED' ? <>
              <td>{stylists.find(stylist => stylist.username === appointment.stylist)?.fullName || appointment.stylist || 'Por asignar'}</td>
              <td><StatusBadge status={appointment.status} /></td>
            </> : <>
              <td><select aria-label={`Estilista de ${appointment.username}`} value={appointment.stylist || ''} disabled={busyId === appointment._id} onChange={event => update(appointment._id, { stylist: event.target.value })}>
                <option value="">Por asignar</option>{stylists.map(stylist => <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>)}
                {/* La lista solo trae estilistas activos: sin esta opción, una cita de un estilista desactivado aparecería "Por asignar". */}
                {appointment.stylist && !stylists.some(stylist => stylist.username === appointment.stylist) &&
                  <option value={appointment.stylist}>@{appointment.stylist} (no disponible)</option>}
              </select></td>
              <td><div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}><StatusBadge status={appointment.status} />
                <select aria-label={`Estado de ${appointment.username}`} value={appointment.status} disabled={busyId === appointment._id} onChange={event => update(appointment._id, { status: event.target.value })}>
                  {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select></div></td>
            </>}
            <td>{appointment.notes || '—'}</td>
          </tr>
        ))}</tbody>
      </Table></TableWrap>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Page>
  );
}

export default AdminAppointments;

import { Fragment, useState } from 'react';
import { apiDeleteAppointment, apiGetAppointments, apiGetStylists, apiGetUsers, apiUpdateAppointment } from '../services/api';
import RefreshStatus from '../components/RefreshStatus';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import AppointmentCalendar from '../components/AppointmentCalendar';
import ClientNotesPanel from '../components/ClientNotesPanel';
import RescheduleForm from '../components/RescheduleForm';
import { Button, Description, EmptyCell, Notice, Page, ResultCount, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';
import StatusBadge from '../components/StatusBadge';
import { STATUS_OPTIONS, statusLabel } from '../utils/appointmentStatus';
import { downloadCsv } from '../utils/download';

const loadAgenda = async () => {
  const [appointments, stylists, users] = await Promise.all([apiGetAppointments(), apiGetStylists(), apiGetUsers()]);
  return { appointments, stylists, users };
};

const EMPTY_FILTERS = { search: '', status: '', service: '', from: '', to: '' };
// Una cita completada o con inasistencia es definitiva: se muestra sin controles de edición.
const isLocked = status => status === 'COMPLETED' || status === 'NO_SHOW';

function AdminAppointments() {
  const live = useAutoRefresh(loadAgenda, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data?.appointments ?? [];
  const stylists = live.data?.stylists ?? [];
  const users = live.data?.users ?? [];
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const error = actionError || live.error;
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [requestedPage, setPage] = useState(1);
  const [view, setView] = useState('table');
  // Fila abierta debajo de una cita: { id, panel: 'move' | 'notes' }.
  const [expanded, setExpanded] = useState(null);
  const pageSize = 10;

  const userOf = username => users.find(item => item.username === username);
  const nameOf = username => userOf(username)?.fullName || username;
  const toggle = (id, panel) => setExpanded(current => (current?.id === id && current.panel === panel ? null : { id, panel }));

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

  const remove = async appointment => {
    if (!window.confirm(`¿Eliminar definitivamente la cita de ${nameOf(appointment.username)} (${appointment.date} · ${appointment.time})? ` +
      'Si solo no se va a realizar, mejor cámbiala a "Cancelada" para conservar el historial.')) return;
    setBusyId(appointment._id);
    try {
      await apiDeleteAppointment(appointment._id);
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
    return (!term || `${appointment.username} ${nameOf(appointment.username)} ${appointment.service} ${appointment.stylist}`.toLocaleLowerCase().includes(term)) &&
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

  // Desde el calendario se abre la cita en la tabla, filtrada por cliente y día.
  const openFromCalendar = appointment => {
    setFilters({ ...EMPTY_FILTERS, search: appointment.username, from: appointment.date, to: appointment.date });
    setPage(1);
    setView('table');
  };

  const exportCsv = () => downloadCsv('citas.csv', [
    { label: 'Fecha', value: item => item.date },
    { label: 'Hora', value: item => item.time },
    { label: 'Cliente', value: item => nameOf(item.username) },
    { label: 'Usuario', value: item => item.username },
    { label: 'Teléfono', value: item => userOf(item.username)?.phoneNumber || '' },
    { label: 'Servicio', value: item => item.service },
    { label: 'Estilista', value: item => (item.stylist ? nameOf(item.stylist) : 'Por asignar') },
    { label: 'Estado', value: item => statusLabel(item.status) },
    { label: 'Precio', value: item => item.price || '' },
    { label: 'Notas', value: item => item.notes || '' },
  ], filteredAppointments);

  return (
    <Page>
      <AdminNav />
      <Title>Todas las citas</Title>
      <Description>Confirma las solicitudes, asigna un estilista, mueve citas de horario y marca como completadas las ya atendidas.</Description>
      <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      {error && <Notice $error role="alert">{error}</Notice>}
      <Toolbar>
        <Button type="button" $secondary={view !== 'table'} aria-pressed={view === 'table'} onClick={() => setView('table')}>
          <i className="fas fa-list" aria-hidden="true"></i> Tabla
        </Button>
        <Button type="button" $secondary={view !== 'calendar'} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
          <i className="fas fa-calendar-day" aria-hidden="true"></i> Calendario
        </Button>
      </Toolbar>

      {view === 'calendar' ? (
        <AppointmentCalendar view="day" appointments={appointments} stylists={stylists} nameOf={nameOf} onSelect={openFromCalendar} />
      ) : <>
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
          <Button type="button" onClick={exportCsv} disabled={!filteredAppointments.length}>
            <i className="fas fa-file-excel" aria-hidden="true"></i> Exportar CSV
          </Button>
        </Toolbar>
        <ResultCount>{filteredAppointments.length} citas encontradas</ResultCount>
        <TableWrap><Table>
          <thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha y hora</th><th>Estilista</th><th>Estado</th><th>Notas</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleAppointments.length === 0 && <tr><EmptyCell colSpan={7}>No hay citas que coincidan con los filtros.</EmptyCell></tr>}
            {visibleAppointments.map(appointment => {
              const client = userOf(appointment.username);
              const busy = busyId === appointment._id;
              const open = expanded?.id === appointment._id ? expanded.panel : null;
              return (
                <Fragment key={appointment._id}>
                  <tr>
                    <td>
                      <span>{client?.fullName || appointment.username}</span><br />
                      <small>@{appointment.username}{client?.phoneNumber && <> · {client.phoneNumber}</>}</small>
                    </td>
                    <td>{appointment.service}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{appointment.date} · {appointment.time}</td>
                    {isLocked(appointment.status) ? <>
                      <td>{appointment.stylist ? nameOf(appointment.stylist) : 'Por asignar'}</td>
                      <td><StatusBadge status={appointment.status} /></td>
                    </> : <>
                      <td><select aria-label={`Estilista de ${appointment.username}`} value={appointment.stylist || ''} disabled={busy} onChange={event => update(appointment._id, { stylist: event.target.value })}>
                        <option value="">Por asignar</option>{stylists.map(stylist => <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>)}
                        {/* La lista solo trae estilistas activos: sin esta opción, una cita de un estilista desactivado aparecería "Por asignar". */}
                        {appointment.stylist && !stylists.some(stylist => stylist.username === appointment.stylist) &&
                          <option value={appointment.stylist}>@{appointment.stylist} (no disponible)</option>}
                      </select></td>
                      <td><div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}><StatusBadge status={appointment.status} />
                        <select aria-label={`Estado de ${appointment.username}`} value={appointment.status} disabled={busy} onChange={event => update(appointment._id, { status: event.target.value })}>
                          {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select></div></td>
                    </>}
                    <td>{appointment.notes || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {!isLocked(appointment.status) &&
                        <Button type="button" $secondary disabled={busy} aria-expanded={open === 'move'} onClick={() => toggle(appointment._id, 'move')}>Mover</Button>}
                      <Button type="button" $secondary aria-expanded={open === 'notes'} onClick={() => toggle(appointment._id, 'notes')}>Notas</Button>
                      <Button type="button" $danger disabled={busy} onClick={() => remove(appointment)} aria-label={`Eliminar cita de ${appointment.username} del ${appointment.date}`}>
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </Button>
                    </td>
                  </tr>
                  {open === 'move' && <tr><td colSpan={7}>
                    <RescheduleForm
                      appointment={appointment}
                      submitLabel="Mover cita"
                      onSubmit={data => apiUpdateAppointment(appointment._id, data)}
                      onSaved={async () => { setExpanded(null); setActionError(''); await live.refresh(); }}
                      onCancel={() => setExpanded(null)}
                    />
                    <small>La cita conserva su estado y el cliente recibe un aviso por correo.</small>
                  </td></tr>}
                  {open === 'notes' && <tr><td colSpan={7}>
                    <ClientNotesPanel client={appointment.username} clientName={client?.fullName} />
                  </td></tr>}
                </Fragment>
              );
            })}
          </tbody>
        </Table></TableWrap>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </>}
    </Page>
  );
}

export default AdminAppointments;

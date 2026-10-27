import { useEffect, useState } from 'react';
import { apiDeleteReview, apiGetAllReviews, apiGetAppointments, apiGetAllServices, apiGetReviewSummary, apiGetUsers } from '../services/api';
import StarRating from '../components/StarRating';
import { downloadCsv } from '../utils/download';
import AdminNav from '../components/AdminNav';
import { Button, Description, EmptyCell, Grid, Notice, Page, SectionTitle, StatCard, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';
import { APPOINTMENT_STATUSES, STATUS_OPTIONS, statusLabel } from '../utils/appointmentStatus';

const EMPTY_FILTERS = { from: '', to: '', status: '', service: '' };

function AdminReports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Las reseñas se cargan aparte: si fallan, el resto del reporte se muestra igual.
  const [ratings, setRatings] = useState({ stylists: [] });
  const [reviews, setReviews] = useState([]);
  const [reviewError, setReviewError] = useState('');

  const loadReviews = () => Promise.all([apiGetReviewSummary(), apiGetAllReviews()])
    .then(([summary, all]) => { setRatings(summary); setReviews(all); setReviewError(''); })
    .catch(requestError => setReviewError(requestError.message));

  useEffect(() => {
    let active = true;
    Promise.all([apiGetReviewSummary(), apiGetAllReviews()])
      .then(([summary, all]) => { if (active) { setRatings(summary); setReviews(all); } })
      .catch(requestError => { if (active) setReviewError(requestError.message); });
    return () => { active = false; };
  }, []);

  const removeReview = async review => {
    if (!window.confirm(`¿Eliminar la reseña de ${review.authorName || review.username}? No se puede deshacer.`)) return;
    try {
      await apiDeleteReview(review._id);
      await loadReviews();
    } catch (requestError) {
      setReviewError(requestError.message);
    }
  };

  useEffect(() => {
    Promise.all([apiGetAppointments(), apiGetAllServices(), apiGetUsers()])
      .then(([appointments, services, users]) => setStats({
        appointments,
        services: services.length,
        serviceCatalog: services,
        users,
        clients: users.filter(item => item.role === 'CLIENT').length,
        stylists: users.filter(item => item.role === 'STYLIST').length,
      }))
      .catch(requestError => setError(requestError.message));
  }, []);

  const filteredAppointments = (stats?.appointments || []).filter(item =>
    (!filters.from || item.date >= filters.from) &&
    (!filters.to || item.date <= filters.to) &&
    (!filters.status || item.status === filters.status) &&
    (!filters.service || item.service === filters.service));
  const confirmed = filteredAppointments.filter(item => item.status === 'CONFIRMED');
  const completed = filteredAppointments.filter(item => item.status === 'COMPLETED');
  const priceFor = appointment => appointment.price ||
    stats?.serviceCatalog.find(service => service.name === appointment.service)?.price || '';
  const toAmount = price => {
    const numeric = price.replace(/[^\d]/g, '');
    return numeric ? Number(numeric) : 0;
  };
  const revenueOf = items => items.reduce((total, item) => total + toAmount(priceFor(item)), 0);
  const estimatedRevenue = revenueOf(confirmed);
  const completedRevenue = revenueOf(completed);
  const estimatesUsingCurrentPrice = confirmed.filter(item => !item.price).length;
  const completedUsingCurrentPrice = completed.filter(item => !item.price).length;
  const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const setFilter = name => event => setFilters(current => ({ ...current, [name]: event.target.value }));

  // Desglose por servicio de las citas filtradas, de mayor a menor demanda.
  const byService = Object.values(filteredAppointments.reduce((groups, item) => {
    const group = groups[item.service] ??= { service: item.service, total: 0, completed: [] };
    group.total += 1;
    if (item.status === 'COMPLETED') group.completed.push(item);
    return groups;
  }, {})).sort((a, b) => b.total - a.total || a.service.localeCompare(b.service));

  // Clientes que más faltan a sus citas en el período, para darles seguimiento.
  const noShows = filteredAppointments.filter(item => item.status === 'NO_SHOW');
  const frequentNoShows = Object.values(noShows.reduce((groups, item) => {
    const group = groups[item.username] ??= { username: item.username, count: 0, last: '' };
    group.count += 1;
    if (item.date > group.last) group.last = item.date;
    return groups;
  }, {})).sort((a, b) => b.count - a.count || a.username.localeCompare(b.username)).slice(0, 10);
  const userOf = username => stats?.users.find(item => item.username === username);
  const nameOf = username => userOf(username)?.fullName || username;

  const exportCsv = () => downloadCsv(`citas-${filters.from || 'inicio'}-a-${filters.to || 'hoy'}.csv`, [
    { label: 'Fecha', value: item => item.date },
    { label: 'Hora', value: item => item.time },
    { label: 'Cliente', value: item => nameOf(item.username) },
    { label: 'Usuario', value: item => item.username },
    { label: 'Servicio', value: item => item.service },
    { label: 'Estilista', value: item => (item.stylist ? nameOf(item.stylist) : 'Por asignar') },
    { label: 'Estado', value: item => statusLabel(item.status) },
    { label: 'Duración (min)', value: item => item.duration || 60 },
    { label: 'Precio', value: item => toAmount(priceFor(item)) || '' },
    { label: 'Notas', value: item => item.notes || '' },
  ], [...filteredAppointments].sort((a, b) => a.date.localeCompare(b.date)));
  const attendedOrMissed = completed.length + noShows.length;

  return (
    <Page>
      <AdminNav />
      <Title>Resumen del negocio</Title>
      <Description>Filtra las citas por período, estado o servicio. Los ingresos se calculan con el precio de cada cita: los de citas completadas corresponden a servicios ya atendidos y el valor confirmado es una proyección; ninguno es un registro de pagos.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      {!stats ? <p role="status">Cargando indicadores…</p> : (
        <>
          <Toolbar>
            <label>Desde <input type="date" value={filters.from} onChange={setFilter('from')} /></label>
            <label>Hasta <input type="date" value={filters.to} onChange={setFilter('to')} /></label>
            <label>Estado
              <select aria-label="Filtrar reportes por estado" value={filters.status} onChange={setFilter('status')}>
                <option value="">Todos los estados</option>{STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>Servicio
              <select aria-label="Filtrar reportes por servicio" value={filters.service} onChange={setFilter('service')}>
                <option value="">Todos los servicios</option>{stats.serviceCatalog.map(service => <option key={service._id} value={service.name}>{service.name}</option>)}
              </select>
            </label>
            <Button type="button" $secondary onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</Button>
            <Button type="button" onClick={exportCsv} disabled={!filteredAppointments.length}>
              <i className="fas fa-file-excel" aria-hidden="true"></i> Exportar a Excel (CSV)
            </Button>
          </Toolbar>

          <SectionTitle>Citas</SectionTitle>
          <Grid>
            <StatCard><h2>{filteredAppointments.length}</h2><p>Citas en el período</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.PENDING.color}><h2>{filteredAppointments.filter(item => item.status === 'PENDING').length}</h2><p>Citas pendientes</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.CONFIRMED.color}><h2>{confirmed.length}</h2><p>Citas confirmadas</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.COMPLETED.color}><h2>{completed.length}</h2><p>Citas completadas</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.CANCELLED.color}><h2>{filteredAppointments.filter(item => item.status === 'CANCELLED').length}</h2><p>Citas canceladas</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.NO_SHOW.color}><h2>{noShows.length}</h2><p>Inasistencias</p>
              {attendedOrMissed > 0 && <small>{Math.round((noShows.length / attendedOrMissed) * 100)}% de las citas que ya llegaron a su hora</small>}
            </StatCard>
          </Grid>

          <SectionTitle>Ingresos</SectionTitle>
          <Grid>
            <StatCard $accent={APPOINTMENT_STATUSES.COMPLETED.color}><h2>{currency.format(completedRevenue)}</h2><p>Ingresos de citas completadas</p>
              {completedUsingCurrentPrice > 0 && <small>{completedUsingCurrentPrice} usan el precio actual; no tienen precio histórico guardado.</small>}
            </StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.CONFIRMED.color}><h2>{currency.format(estimatedRevenue)}</h2><p>Valor estimado confirmado</p>
              {estimatesUsingCurrentPrice > 0 && <small>{estimatesUsingCurrentPrice} usan el precio actual; no tienen precio histórico guardado.</small>}
            </StatCard>
          </Grid>

          <SectionTitle>Por servicio</SectionTitle>
          <TableWrap><Table>
            <thead><tr><th>Servicio</th><th>Citas</th><th>Completadas</th><th>Ingresos completados</th></tr></thead>
            <tbody>
              {byService.length === 0 && <tr><EmptyCell colSpan={4}>No hay citas con estos filtros.</EmptyCell></tr>}
              {byService.map(group => (
                <tr key={group.service}>
                  <td>{group.service}</td><td>{group.total}</td><td>{group.completed.length}</td>
                  <td>{currency.format(revenueOf(group.completed))}</td>
                </tr>
              ))}
            </tbody>
          </Table></TableWrap>

          <SectionTitle>Clientes con inasistencias</SectionTitle>
          <TableWrap><Table>
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Inasistencias</th><th>Última</th></tr></thead>
            <tbody>
              {frequentNoShows.length === 0 && <tr><EmptyCell colSpan={4}>No hay inasistencias con estos filtros.</EmptyCell></tr>}
              {frequentNoShows.map(group => {
                const client = userOf(group.username);
                return (
                  <tr key={group.username}>
                    <td>{client?.fullName || group.username}<br /><small>@{group.username}</small></td>
                    <td>{client ? <>{client.email}{client.phoneNumber && <><br />{client.phoneNumber}</>}</> : '—'}</td>
                    <td>{group.count}</td><td>{group.last}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table></TableWrap>

          <SectionTitle>Calificaciones de los clientes</SectionTitle>
          {reviewError && <Notice $error role="alert">{reviewError}</Notice>}
          <TableWrap><Table>
            <thead><tr><th>Estilista</th><th>Promedio</th><th>Reseñas</th></tr></thead>
            <tbody>
              {ratings.stylists.length === 0 && <tr><EmptyCell colSpan={3}>Todavía no hay reseñas de estilistas.</EmptyCell></tr>}
              {[...ratings.stylists].sort((a, b) => b.average - a.average || b.count - a.count).map(item => (
                <tr key={item.name}>
                  <td>{nameOf(item.name)}</td>
                  <td><StarRating value={item.average} /> {item.average.toLocaleString('es-CO')}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </Table></TableWrap>

          <SectionTitle>Reseñas recientes</SectionTitle>
          <TableWrap><Table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio y estilista</th><th>Calificación</th><th>Comentario</th><th>Acción</th></tr></thead>
            <tbody>
              {reviews.length === 0 && <tr><EmptyCell colSpan={6}>Todavía no hay reseñas.</EmptyCell></tr>}
              {reviews.slice(0, 20).map(review => (
                <tr key={review._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{review.createdAt?.slice(0, 10)}</td>
                  <td>{nameOf(review.username)}</td>
                  <td>{review.service}<br /><small>{review.stylist ? nameOf(review.stylist) : 'Sin estilista'}</small></td>
                  <td><StarRating value={review.rating} /></td>
                  <td>{review.comment || '—'}</td>
                  <td><Button type="button" $secondary onClick={() => removeReview(review)}>Eliminar</Button></td>
                </tr>
              ))}
            </tbody>
          </Table></TableWrap>

          <SectionTitle>Catálogo y equipo</SectionTitle>
          <Grid>
            <StatCard><h2>{stats.services}</h2><p>Servicios activos</p></StatCard>
            <StatCard><h2>{stats.clients}</h2><p>Clientes</p></StatCard>
            <StatCard><h2>{stats.stylists}</h2><p>Estilistas</p></StatCard>
          </Grid>
        </>
      )}
    </Page>
  );
}

export default AdminReports;

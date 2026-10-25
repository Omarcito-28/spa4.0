import { useEffect, useState } from 'react';
import { apiGetAppointments, apiGetServices, apiGetUsers } from '../services/api';
import AdminNav from '../components/AdminNav';
import { Button, Description, EmptyCell, Grid, Notice, Page, SectionTitle, StatCard, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';
import { APPOINTMENT_STATUSES, STATUS_OPTIONS } from '../utils/appointmentStatus';

const EMPTY_FILTERS = { from: '', to: '', status: '', service: '' };

function AdminReports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    Promise.all([apiGetAppointments(), apiGetServices(), apiGetUsers()])
      .then(([appointments, services, users]) => setStats({
        appointments,
        services: services.length,
        serviceCatalog: services,
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
          </Toolbar>

          <SectionTitle>Citas</SectionTitle>
          <Grid>
            <StatCard><h2>{filteredAppointments.length}</h2><p>Citas en el período</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.PENDING.color}><h2>{filteredAppointments.filter(item => item.status === 'PENDING').length}</h2><p>Citas pendientes</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.CONFIRMED.color}><h2>{confirmed.length}</h2><p>Citas confirmadas</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.COMPLETED.color}><h2>{completed.length}</h2><p>Citas completadas</p></StatCard>
            <StatCard $accent={APPOINTMENT_STATUSES.CANCELLED.color}><h2>{filteredAppointments.filter(item => item.status === 'CANCELLED').length}</h2><p>Citas canceladas</p></StatCard>
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

import { useEffect, useState } from 'react';
import { apiGetAppointments, apiGetServices, apiGetUsers } from '../services/api';
import { Card, Description, Grid, Notice, Page, Title } from '../components/ManagementUI';

function AdminReports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', status: '', service: '' });

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
  const priceFor = appointment => appointment.price ||
    stats?.serviceCatalog.find(service => service.name === appointment.service)?.price || '';
  const toAmount = price => {
    const numeric = price.replace(/[^\d]/g, '');
    return numeric ? Number(numeric) : 0;
  };
  const estimatedRevenue = confirmed.reduce((total, item) => total + toAmount(priceFor(item)), 0);
  const estimatesUsingCurrentPrice = confirmed.filter(item => !item.price).length;
  const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <Page>
      <Title>Resumen del negocio</Title>
      <Description>Filtra las citas por período, estado o servicio. El valor es una estimación de servicios confirmados, no un registro de pagos.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      {!stats ? <p role="status">Cargando indicadores…</p> : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <label>Desde <input type="date" value={filters.from} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label>
            <label>Hasta <input type="date" value={filters.to} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label>
            <select aria-label="Filtrar reportes por estado" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
              <option value="">Todos los estados</option><option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmada</option><option value="CANCELLED">Cancelada</option>
            </select>
            <select aria-label="Filtrar reportes por servicio" value={filters.service} onChange={event => setFilters(current => ({ ...current, service: event.target.value }))}>
              <option value="">Todos los servicios</option>{stats.serviceCatalog.map(service => <option key={service._id} value={service.name}>{service.name}</option>)}
            </select>
            <button type="button" onClick={() => setFilters({ from: '', to: '', status: '', service: '' })}>Limpiar filtros</button>
          </div>
          <Grid>
            <Card><h2>{filteredAppointments.length}</h2><p>Citas en el período</p></Card>
            <Card><h2>{filteredAppointments.filter(item => item.status === 'PENDING').length}</h2><p>Citas pendientes</p></Card>
            <Card><h2>{confirmed.length}</h2><p>Citas confirmadas</p></Card>
            <Card><h2>{filteredAppointments.filter(item => item.status === 'CANCELLED').length}</h2><p>Citas canceladas</p></Card>
            <Card><h2>{currency.format(estimatedRevenue)}</h2><p>Valor estimado confirmado</p>
              {estimatesUsingCurrentPrice > 0 && <small>{estimatesUsingCurrentPrice} usan el precio actual; no tienen precio histórico guardado.</small>}
            </Card>
            <Card><h2>{stats.services}</h2><p>Servicios activos</p></Card>
            <Card><h2>{stats.clients}</h2><p>Clientes</p></Card>
            <Card><h2>{stats.stylists}</h2><p>Estilistas</p></Card>
          </Grid>
        </>
      )}
    </Page>
  );
}

export default AdminReports;

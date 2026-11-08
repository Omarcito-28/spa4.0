// Cálculo de ingresos compartido por Reportes y el Dashboard del administrador.
// Una cita guarda el precio con el que se reservó; si no lo tiene (citas antiguas)
// se usa el precio actual del catálogo.

export const toAmount = price => {
  const numeric = String(price ?? '').replace(/[^\d]/g, '');
  return numeric ? Number(numeric) : 0;
};

export const priceOf = (appointment, catalog = []) => appointment.price ||
  catalog.find(service => service.name === appointment.service)?.price || '';

export const revenueOf = (appointments, catalog = []) =>
  appointments.reduce((total, item) => total + toAmount(priceOf(item, catalog)), 0);

export const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// "$ 120 mil", "$ 1,2 M": para ejes y etiquetas cortas.
const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
export const compactCurrency = {
  format: amount => {
    if (amount >= 1e6) return `$ ${decimal.format(amount / 1e6)} M`;
    if (amount >= 1e3) return `$ ${decimal.format(amount / 1e3)} mil`;
    return `$ ${decimal.format(amount)}`;
  },
};

// Fechas 'YYYY-MM-DD' de los últimos `days` días terminando en `today` (incluido).
export const lastDays = (today, days) => {
  const end = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - index));
    return date.toISOString().slice(0, 10);
  });
};

// Ingresos de citas completadas por día dentro del rango.
export const revenueByDay = (appointments, catalog, dates) => {
  const days = new Map(dates.map(date => [date, { date, amount: 0, count: 0 }]));
  appointments.forEach(item => {
    const day = item.status === 'COMPLETED' && days.get(item.date);
    if (!day) return;
    day.amount += toAmount(priceOf(item, catalog));
    day.count += 1;
  });
  return [...days.values()];
};

// Servicios con más ingresos (citas completadas) dentro del rango, de mayor a menor.
export const revenueByService = (appointments, catalog, dates, limit = 5) => {
  const from = dates[0];
  const to = dates[dates.length - 1];
  const groups = {};
  appointments.forEach(item => {
    if (item.status !== 'COMPLETED' || item.date < from || item.date > to) return;
    const group = groups[item.service] ??= { service: item.service, amount: 0, count: 0 };
    group.amount += toAmount(priceOf(item, catalog));
    group.count += 1;
  });
  return Object.values(groups)
    .sort((a, b) => b.amount - a.amount || b.count - a.count || a.service.localeCompare(b.service))
    .slice(0, limit);
};

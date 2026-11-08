import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { compactCurrency, currency, lastDays, revenueByDay, revenueByService } from '../../utils/revenue';

const RANGES = [7, 14, 30];
const CHART_HEIGHT = 220;

const Section = styled.section`
  margin-bottom: 2.5rem;
  padding: 1.75rem 1.75rem 1.5rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 8px 24px rgba(60, 40, 10, 0.06);

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #eee8dc;

  h2 {
    margin: 0;
    color: ${theme.colors.text};
    font-size: 1.7rem;
  }

  p {
    margin: 0.15rem 0 0;
    color: ${theme.colors.textMuted};
    font-size: 0.98rem;
  }
`;

const Segmented = styled.div`
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid #e6d7b9;
  border-radius: 999px;
  background: #fdf8ef;

  button {
    padding: 0.35rem 0.9rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: ${theme.colors.primaryDark};
    font-size: 0.98rem;
    font-weight: 700;
    transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};
  }

  button[aria-pressed='true'] {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 2px 8px rgba(153, 101, 21, 0.28);
    color: white;
  }
`;

const Figures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.5rem;
`;

const Figure = styled.div`
  padding: 1rem 1.15rem;
  border: 1px solid #efe3cc;
  border-radius: 12px;
  background: #fffdf9;

  span {
    display: block;
    color: ${theme.colors.textMuted};
    font-size: 0.95rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 0.2rem 0 0.15rem;
    color: ${theme.colors.text};
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    font-variant-numeric: lining-nums;
    font-size: 2.1rem;
    line-height: 1.1;
  }

  small {
    color: ${theme.colors.textMuted};
    font-size: 0.9rem;
  }
`;

const Charts = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 1.5rem 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ChartTitle = styled.h3`
  margin: 0 0 0.85rem;
  color: ${theme.colors.text};
  font-size: 1.4rem;
`;

const Plot = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0 0.6rem;
`;

const YAxis = styled.div`
  position: relative;
  height: ${CHART_HEIGHT}px;
  min-width: 3.4rem;

  span {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    color: ${theme.colors.textMuted};
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;

const Area = styled.div`
  position: relative;
  height: ${CHART_HEIGHT}px;
  border-bottom: 1px solid #cdbf9f;
`;

const GridLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #eee5d3;
`;

const Columns = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  gap: ${props => (props.$dense ? '2px' : '6px')};
`;

const Column = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-radius: 6px;
  outline: none;
  cursor: default;
  background: ${props => (props.$active ? 'rgba(201, 148, 42, 0.08)' : 'transparent')};

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(201, 148, 42, 0.55);
  }
`;

const Bar = styled.div`
  width: 100%;
  max-width: 34px;
  min-height: ${props => (props.$empty ? '0' : '3px')};
  border-radius: 4px 4px 0 0;
  background: ${props => (props.$active ? theme.colors.primaryDark : theme.colors.accent)};
  transition: background ${theme.transitions.fast}, height ${theme.transitions.normal};
`;

const XAxis = styled.div`
  grid-column: 2;
  display: flex;
  gap: ${props => (props.$dense ? '2px' : '6px')};
  margin-top: 0.4rem;

  span {
    flex: 1;
    min-width: 0;
    color: ${theme.colors.textMuted};
    font-size: 0.8rem;
    text-align: center;
    white-space: nowrap;
  }

  /* Las etiquetas de los extremos se alinean hacia dentro para no salirse. */
  span:last-child {
    display: flex;
    justify-content: flex-end;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 2;
  transform: translateX(${props => props.$align});
  min-width: 150px;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: ${theme.colors.sidebarBg};
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;

  strong {
    display: block;
    color: white;
    font-size: 1.05rem;
  }
`;

const EmptyOverlay = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: 1rem;
`;

const ServiceList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li > div:first-child {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.3rem;
    font-size: 1rem;
  }

  li span {
    min-width: 0;
    overflow: hidden;
    color: ${theme.colors.text};
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  li strong {
    flex-shrink: 0;
    color: ${theme.colors.text};
    font-variant-numeric: tabular-nums;
  }

  li small {
    color: ${theme.colors.textMuted};
    font-size: 0.85rem;
  }
`;

const Track = styled.div`
  height: 10px;
  border-radius: 999px;
  background: #f3ecdc;

  div {
    height: 100%;
    border-radius: 999px;
    background: ${theme.colors.accent};
  }
`;

const Muted = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: 1rem;
`;

const DataTable = styled.details`
  margin-top: 0.85rem;
  font-size: 0.95rem;

  summary {
    width: fit-content;
    color: ${theme.colors.primaryDark};
    font-weight: 700;
    cursor: pointer;
  }

  table {
    width: 100%;
    margin-top: 0.5rem;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid #eee8dc;
    text-align: left;
  }

  td:last-child, th:last-child {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' });
// "26 oct": día y mes abreviado, sin "de" ni punto, para que quepa bajo cada barra.
const shortDate = date => {
  const value = new Date(`${date}T00:00:00Z`);
  return `${value.getUTCDate()} ${monthFormat.format(value).replace('.', '')}`;
};
const fullDate = date => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  .format(new Date(`${date}T00:00:00Z`));
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

// Tope del eje redondeado (1, 2, 2,5, 5 × 10^n) para que las marcas sean legibles.
const niceMax = value => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= value);
  return step * magnitude;
};

function RevenueChart({ days }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...days.map(day => day.amount)));
  const dense = days.length > 14;
  const labelEvery = days.length <= 7 ? 1 : days.length <= 14 ? 2 : 5;
  const showLabel = index => (days.length - 1 - index) % labelEvery === 0;
  const hasSales = days.some(day => day.amount > 0);

  return (
    <div>
      <ChartTitle>Ingresos por día</ChartTitle>
      <Plot>
        <YAxis aria-hidden="true">
          {[1, 0.5, 0].map(ratio => (
            <span key={ratio} style={{ top: `${(1 - ratio) * 100}%` }}>{compactCurrency.format(max * ratio)}</span>
          ))}
        </YAxis>
        <Area>
          {[1, 0.5].map(ratio => <GridLine key={ratio} style={{ top: `${(1 - ratio) * 100}%` }} aria-hidden="true" />)}
          <Columns $dense={dense} role="list" aria-label="Ingresos por día">
            {days.map((day, index) => {
              const label = `${fullDate(day.date)}: ${currency.format(day.amount)}, ${plural(day.count, 'cita completada', 'citas completadas')}`;
              // El tooltip se ancla hacia dentro en los extremos para no salirse del gráfico.
              const align = index < days.length * 0.2 ? '-15%' : index > days.length * 0.8 ? '-85%' : '-50%';
              return (
                <Column
                  key={day.date}
                  role="listitem"
                  tabIndex={0}
                  aria-label={label}
                  $active={active === index}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                >
                  <Bar $active={active === index} $empty={day.amount === 0} style={{ height: `${(day.amount / max) * 100}%` }} />
                  {active === index && (
                    <Tooltip $align={align} role="tooltip">
                      {fullDate(day.date)}
                      <strong>{currency.format(day.amount)}</strong>
                      {plural(day.count, 'cita completada', 'citas completadas')}
                    </Tooltip>
                  )}
                </Column>
              );
            })}
          </Columns>
          {!hasSales && <EmptyOverlay>Sin ventas completadas en este período.</EmptyOverlay>}
        </Area>
        <XAxis $dense={dense} aria-hidden="true">
          {days.map((day, index) => <span key={day.date}>{showLabel(index) ? shortDate(day.date) : ''}</span>)}
        </XAxis>
      </Plot>
      <DataTable>
        <summary>Ver datos en tabla</summary>
        <table>
          <thead><tr><th scope="col">Día</th><th scope="col">Citas completadas</th><th scope="col">Ingresos</th></tr></thead>
          <tbody>
            {days.map(day => (
              <tr key={day.date}><td>{shortDate(day.date)}</td><td>{day.count}</td><td>{currency.format(day.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}

function TopServices({ services }) {
  const max = Math.max(1, ...services.map(item => item.amount));
  return (
    <div>
      <ChartTitle>Servicios más vendidos</ChartTitle>
      {services.length === 0 ? <Muted>Aún no hay servicios completados en este período.</Muted> : (
        <ServiceList aria-label="Servicios con más ingresos">
          {services.map(item => (
            <li key={item.service}>
              <div>
                <span title={item.service}>{item.service}</span>
                <strong>{currency.format(item.amount)}</strong>
              </div>
              <Track aria-hidden="true"><div style={{ width: `${(item.amount / max) * 100}%` }} /></Track>
              <small>{plural(item.count, 'cita completada', 'citas completadas')}</small>
            </li>
          ))}
        </ServiceList>
      )}
    </div>
  );
}

function trendText(current, previous, days) {
  if (previous === 0) return current > 0 ? `Sin ventas en los ${days} días anteriores` : 'Sin cambios';
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return `Igual que los ${days} días anteriores`;
  return `${change > 0 ? '▲' : '▼'} ${Math.abs(change)} % vs. los ${days} días anteriores`;
}

// Ventas de los últimos días a partir de las citas completadas (mismo cálculo que Reportes).
function SalesCharts({ appointments, catalog, today }) {
  const [range, setRange] = useState(14);
  const dates = lastDays(today, range);
  const previousDates = lastDays(dates[0], range + 1).slice(0, range);
  const days = revenueByDay(appointments, catalog, dates);
  const previous = revenueByDay(appointments, catalog, previousDates);
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  const count = days.reduce((sum, day) => sum + day.count, 0);
  const previousTotal = previous.reduce((sum, day) => sum + day.amount, 0);

  return (
    <Section aria-labelledby="sales-title">
      <Header>
        <div>
          <h2 id="sales-title">Ventas</h2>
          <p>Ingresos de las citas completadas.</p>
        </div>
        <Segmented role="group" aria-label="Período">
          {RANGES.map(option => (
            <button key={option} type="button" aria-pressed={range === option} onClick={() => setRange(option)}>
              {option} días
            </button>
          ))}
        </Segmented>
      </Header>

      <Figures>
        <Figure>
          <span>Ingresos</span>
          <strong>{currency.format(total)}</strong>
          <small>{trendText(total, previousTotal, range)}</small>
        </Figure>
        <Figure>
          <span>Citas completadas</span>
          <strong>{count}</strong>
          <small>en los últimos {range} días</small>
        </Figure>
        <Figure>
          <span>Ticket promedio</span>
          <strong>{currency.format(count ? Math.round(total / count) : 0)}</strong>
          <small>por cita completada</small>
        </Figure>
      </Figures>

      <Charts>
        <RevenueChart days={days} />
        <TopServices services={revenueByService(appointments, catalog, dates)} />
      </Charts>
    </Section>
  );
}

export default SalesCharts;

import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { APPOINTMENT_STATUSES, statusLabel } from '../utils/appointmentStatus';
import { appointmentTimeToMinutes, todayInTimeZone } from '../utils/date';
import { Button } from './ManagementUI';

const PX_PER_MINUTE = 1.1;
const DEFAULT_START = 8 * 60;
const DEFAULT_END = 19 * 60;
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const addDays = (date, days) => {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};
const weekday = date => new Date(`${date}T12:00:00Z`).getUTCDay();
// Lunes de la semana de esa fecha.
const startOfWeek = date => addDays(date, -((weekday(date) + 6) % 7));
const formatDay = date => `${WEEKDAYS[weekday(date)]} ${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`;
const formatHour = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
};

const Nav = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1rem;

  strong {
    min-width: 12rem;
    font-size: 1.15rem;
  }

  ${Button} {
    margin: 0;
  }
`;

const Scroll = styled.div`
  overflow-x: auto;
  border: 1px solid #eee8dc;
  border-radius: ${theme.borderRadius.medium};
  background: #fff;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: 4rem repeat(${props => props.$columns}, minmax(150px, 1fr));
  min-width: ${props => 4 * 16 + props.$columns * 150}px;
`;

const Head = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #eee8dc;
  background: ${props => (props.$today ? '#fdf3df' : '#fffcf6')};
  font-weight: 700;
  text-align: center;
`;

const Column = styled.div`
  position: relative;
  height: ${props => props.$height}px;
  border-left: 1px solid #f1ebe0;
  background-image: repeating-linear-gradient(
    to bottom,
    #f4efe6 0,
    #f4efe6 1px,
    transparent 1px,
    transparent ${60 * PX_PER_MINUTE}px
  );
`;

const HourLabel = styled.span`
  position: absolute;
  right: 0.4rem;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};
  font-size: 0.8rem;
  white-space: nowrap;
`;

const Block = styled.div`
  position: absolute;
  left: 4px;
  right: 4px;
  overflow: hidden;
  padding: 0.25rem 0.4rem;
  border: none;
  border-left: 4px solid ${props => props.$color};
  border-radius: 6px;
  background: ${props => props.$background};
  color: ${theme.colors.text};
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.25;
  text-align: left;
  cursor: ${props => (props.onClick ? 'pointer' : 'default')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  strong, span {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

// Agenda visual. view="day": una columna por estilista para un día (vista del
// administrador). view="week": una columna por día de la semana (vista del estilista).
// Las citas canceladas no ocupan espacio y no se muestran.
function AppointmentCalendar({ appointments, view = 'day', stylists = [], nameOf = username => username, onSelect }) {
  const today = todayInTimeZone();
  const [anchor, setAnchor] = useState(today);
  const visible = appointments.filter(item => item.status !== 'CANCELLED');

  const days = view === 'week' ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchor), index)) : [anchor];
  const columns = view === 'week'
    ? days.map(date => ({ key: date, label: formatDay(date), today: date === today, matches: item => item.date === date }))
    : [
      ...stylists.map(stylist => ({ key: stylist.username, label: stylist.fullName, matches: item => item.date === anchor && item.stylist === stylist.username })),
      // Estilistas desactivados con citas ese día, para que ninguna cita quede oculta.
      ...[...new Set(visible.filter(item => item.date === anchor && item.stylist && !stylists.some(s => s.username === item.stylist)).map(item => item.stylist))]
        .map(username => ({ key: username, label: `@${username}`, matches: item => item.date === anchor && item.stylist === username })),
      { key: '', label: 'Por asignar', matches: item => item.date === anchor && !item.stylist },
    ];

  const shown = visible.filter(item => columns.some(column => column.matches(item)));
  const startOf = item => appointmentTimeToMinutes(item.time);
  const dayStart = Math.min(DEFAULT_START, ...shown.map(item => Math.floor(startOf(item) / 60) * 60));
  const dayEnd = Math.max(DEFAULT_END, ...shown.map(item => Math.ceil((startOf(item) + (item.duration || 60)) / 60) * 60));
  const height = (dayEnd - dayStart) * PX_PER_MINUTE;
  const hours = Array.from({ length: (dayEnd - dayStart) / 60 + 1 }, (_, index) => dayStart + index * 60);

  const step = view === 'week' ? 7 : 1;
  const title = view === 'week'
    ? `Semana del ${formatDay(days[0])} al ${formatDay(days[6])}`
    : `${formatDay(anchor)}${anchor === today ? ' (hoy)' : ''}`;

  return (
    <div>
      <Nav aria-label="Navegar el calendario">
        <Button type="button" $secondary onClick={() => setAnchor(current => addDays(current, -step))} aria-label={view === 'week' ? 'Semana anterior' : 'Día anterior'}>‹</Button>
        <Button type="button" $secondary onClick={() => setAnchor(today)}>Hoy</Button>
        <Button type="button" $secondary onClick={() => setAnchor(current => addDays(current, step))} aria-label={view === 'week' ? 'Semana siguiente' : 'Día siguiente'}>›</Button>
        <input type="date" value={anchor} onChange={event => event.target.value && setAnchor(event.target.value)} aria-label="Ir a la fecha" />
        <strong>{title}</strong>
        <small>{shown.length} {shown.length === 1 ? 'cita' : 'citas'}</small>
      </Nav>
      <Scroll>
        <Board $columns={columns.length}>
          <Head aria-hidden="true" />
          {columns.map(column => <Head key={column.key || 'sin-asignar'} $today={column.today}>{column.label}</Head>)}
          <Column $height={height} style={{ borderLeft: 'none', backgroundImage: 'none' }} aria-hidden="true">
            {hours.map(minutes => <HourLabel key={minutes} style={{ top: (minutes - dayStart) * PX_PER_MINUTE }}>{formatHour(minutes)}</HourLabel>)}
          </Column>
          {columns.map(column => (
            <Column key={column.key || 'sin-asignar'} $height={height} aria-label={column.label} role={onSelect ? 'group' : 'list'}>
              {visible.filter(column.matches).map(item => {
                const style = APPOINTMENT_STATUSES[item.status] ?? { color: '#999', background: '#eee' };
                const duration = item.duration || 60;
                return (
                  <Block
                    key={item._id}
                    as={onSelect ? 'button' : 'div'}
                    type={onSelect ? 'button' : undefined}
                    role={onSelect ? undefined : 'listitem'}
                    $color={style.color}
                    $background={style.background}
                    style={{ top: (startOf(item) - dayStart) * PX_PER_MINUTE, height: Math.max(duration * PX_PER_MINUTE - 2, 22) }}
                    onClick={onSelect ? () => onSelect(item) : undefined}
                    title={`${item.time} · ${item.service} · ${nameOf(item.username)} · ${statusLabel(item.status)}`}
                    aria-label={`${item.time}, ${item.service}, ${nameOf(item.username)}, ${statusLabel(item.status)}`}
                  >
                    <strong>{item.time} · {nameOf(item.username)}</strong>
                    <span>{item.service}</span>
                    {view === 'week' && item.stylist === '' && <span>Sin estilista</span>}
                  </Block>
                );
              })}
            </Column>
          ))}
        </Board>
      </Scroll>
    </div>
  );
}

export default AppointmentCalendar;

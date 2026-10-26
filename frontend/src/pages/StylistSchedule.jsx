import { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../styles/theme';
import { apiGetSchedule, apiUpdateSchedule } from '../services/api';
import { Button, Card, Description, Input, Notice, Page, Title } from '../components/ManagementUI';

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const defaultSchedule = daysOfWeek.map((_, day) => ({
  day,
  enabled: day >= 1 && day <= 6,
  start: '09:00',
  end: day === 6 ? '17:00' : '19:00',
}));
// Lunes primero, como se lee una semana de trabajo.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const toMinutes = clock => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
};

const workedMinutes = item => (item.enabled ? Math.max(0, toMinutes(item.end) - toMinutes(item.start)) : 0);

const formatDuration = minutes => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

// El backend rechaza un día activo cuyo fin no sea posterior al inicio; se avisa antes de enviar.
const hasInvalidRange = item => item.enabled && item.start >= item.end;

const sameSchedule = (a, b) => JSON.stringify(a.map(({ day, enabled, start, end }) => ({ day, enabled, start, end }))) ===
  JSON.stringify(b.map(({ day, enabled, start, end }) => ({ day, enabled, start, end })));

const Summary = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const SummaryStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    border: 1px solid #efe3cc;
    border-radius: 999px;
    background: linear-gradient(135deg, #fdf8ef, #f8efdf);
    color: ${theme.colors.textLight};
    font-size: 1rem;
    font-weight: 600;
  }

  strong {
    color: ${theme.colors.primaryDark};
    font-variant-numeric: lining-nums;
  }

  i {
    color: ${theme.colors.accent};
  }
`;

const DayList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
`;

const DayRow = styled.li`
  display: grid;
  grid-template-columns: 150px 150px 1fr 110px;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border: 1px solid ${props => props.$invalid ? '#e8b4ad' : '#ece2cf'};
  border-left: 4px solid ${props => props.$invalid ? '#b93224' : props.$enabled ? theme.colors.accent : '#ddd3c2'};
  border-radius: 12px;
  background: ${props => props.$enabled ? 'white' : '#faf7f2'};
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  @media (max-width: 760px) {
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
  }
`;

const DayName = styled.span`
  color: ${props => props.$enabled ? theme.colors.text : theme.colors.textMuted};
  font-size: 1.15rem;
  font-weight: 700;
`;

// Interruptor: es un checkbox real, solo cambia su apariencia.
const Switch = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: ${theme.colors.textMuted};
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;

  input {
    position: relative;
    flex: none;
    width: 46px;
    height: 26px;
    margin: 0;
    border-radius: 999px;
    background: #d9cfbf;
    appearance: none;
    cursor: pointer;
    transition: background ${theme.transitions.fast};

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      transition: transform ${theme.transitions.fast};
    }

    &:checked {
      background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    }

    &:checked::after {
      transform: translateX(20px);
    }

    &:focus-visible {
      outline: 3px solid rgba(201, 148, 42, 0.45);
      outline-offset: 2px;
    }
  }

  ${props => props.$checked && css`
    color: ${theme.colors.primaryDark};
  `}
`;

const Times = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  color: ${theme.colors.textMuted};
  font-size: 0.98rem;

  ${Input} {
    width: 9.5rem;
  }

  @media (max-width: 760px) {
    grid-column: 1 / -1;
  }
`;

const Rest = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${theme.colors.textMuted};
  font-style: italic;
`;

const RowError = styled.span`
  flex-basis: 100%;
  color: #8c2318;
  font-size: 0.92rem;
  font-weight: 600;
`;

const Hours = styled.span`
  justify-self: end;
  color: ${theme.colors.primaryDark};
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: lining-nums;

  @media (max-width: 760px) {
    grid-column: 2;
    grid-row: 1;
  }
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee8dc;

  ${Button} {
    margin: 0;
  }

  ${Notice} {
    flex-basis: 100%;
    margin: 0;
  }
`;

const Unsaved = styled.span`
  color: ${theme.colors.primaryDark};
  font-size: 0.98rem;
  font-weight: 600;
`;

function StylistSchedule() {
  const [schedule, setSchedule] = useState(defaultSchedule);
  // null mientras no exista un horario guardado: el predeterminado también se puede guardar.
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const current = await apiGetSchedule();
      if (current.length) {
        setSchedule(current);
        setSaved(current);
      }
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const change = (day, field, value) => {
    setNotice(null);
    setSchedule(current => current.map(item => item.day === day ? { ...item, [field]: value } : item));
  };

  // Copia el horario del lunes a los demás días que estén activos.
  const copyMonday = () => {
    const monday = schedule.find(item => item.day === 1);
    setNotice(null);
    setSchedule(current => current.map(item =>
      item.enabled && item.day !== 1 ? { ...item, start: monday.start, end: monday.end } : item));
  };

  const invalidDays = schedule.filter(hasInvalidRange);
  const workingDays = schedule.filter(item => item.enabled).length;
  const weeklyMinutes = schedule.reduce((total, item) => total + workedMinutes(item), 0);
  const dirty = saved === null || !sameSchedule(schedule, saved);
  const monday = schedule.find(item => item.day === 1);

  const save = async event => {
    event.preventDefault();
    if (invalidDays.length) return;
    setSaving(true);
    try {
      const updated = await apiUpdateSchedule(schedule);
      setSchedule(updated);
      setSaved(updated);
      setNotice({ error: false, text: 'Tu horario semanal quedó guardado y se usará para validar reservas.' });
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <Title>Mi horario</Title>
      <Description>Configura tus horas de disponibilidad. Las reservas asignadas fuera de este horario se rechazan.</Description>
      <Card>
        <form onSubmit={save} aria-busy={loading}>
          <Summary>
            <SummaryStats>
              <span><i className="fas fa-calendar-check" aria-hidden="true"></i><strong>{workingDays}</strong> {workingDays === 1 ? 'día' : 'días'} de trabajo</span>
              <span><i className="fas fa-hourglass-half" aria-hidden="true"></i><strong>{formatDuration(weeklyMinutes)}</strong> por semana</span>
            </SummaryStats>
            <Button type="button" $secondary onClick={copyMonday} disabled={loading || !monday?.enabled}>
              <i className="fas fa-copy" aria-hidden="true"></i> Usar el horario del lunes en todos los días
            </Button>
          </Summary>

          <DayList>
            {DISPLAY_ORDER.map(day => schedule.find(item => item.day === day)).filter(Boolean).map(item => {
              const name = daysOfWeek[item.day];
              const invalid = hasInvalidRange(item);
              return (
                <DayRow key={item.day} $enabled={item.enabled} $invalid={invalid}>
                  <DayName $enabled={item.enabled}>{name}</DayName>
                  <Switch $checked={item.enabled}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={item.enabled}
                      disabled={loading}
                      onChange={event => change(item.day, 'enabled', event.target.checked)}
                      aria-label={`Disponible ${name}`}
                    />
                    {item.enabled ? 'Disponible' : 'Descanso'}
                  </Switch>
                  <Times>
                    {item.enabled ? (
                      <>
                        <Input
                          type="time"
                          value={item.start}
                          disabled={loading}
                          aria-label={`${name}: desde`}
                          aria-invalid={invalid}
                          onChange={event => change(item.day, 'start', event.target.value)}
                        />
                        <span aria-hidden="true">a</span>
                        <Input
                          type="time"
                          value={item.end}
                          disabled={loading}
                          aria-label={`${name}: hasta`}
                          aria-invalid={invalid}
                          onChange={event => change(item.day, 'end', event.target.value)}
                        />
                        {invalid && <RowError role="alert">La hora final debe ser posterior a la inicial.</RowError>}
                      </>
                    ) : (
                      <Rest><i className="fas fa-moon" aria-hidden="true"></i>No atiendes este día</Rest>
                    )}
                  </Times>
                  <Hours>{item.enabled && !invalid ? formatDuration(workedMinutes(item)) : '—'}</Hours>
                </DayRow>
              );
            })}
          </DayList>

          <Footer>
            <Button type="submit" disabled={loading || saving || invalidDays.length > 0 || !dirty}>
              {saving ? 'Guardando…' : 'Guardar horario'}
            </Button>
            {!loading && dirty && !invalidDays.length && (
              <Unsaved>{saved === null ? 'Aún no has guardado tu horario.' : 'Tienes cambios sin guardar.'}</Unsaved>
            )}
            {loading && <span role="status">Cargando tu horario…</span>}
            {notice && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
          </Footer>
        </form>
      </Card>
    </Page>
  );
}

export default StylistSchedule;

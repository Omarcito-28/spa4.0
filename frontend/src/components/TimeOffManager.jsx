import { useCallback, useEffect, useState } from 'react';
import { apiCreateTimeOff, apiDeleteTimeOff, apiGetTimeOff } from '../services/api';
import { todayInTimeZone } from '../utils/date';
import { Button, EmptyCell, InlineForm, Notice, Table, TableWrap } from './ManagementUI';

const EMPTY_FORM = { stylist: '', start: '', end: '', reason: '' };

const formatRange = ({ start, end }) => (start === end ? start : `${start} a ${end}`);

// Días libres y cierres del spa. Con `stylists` (vista del administrador) permite
// elegir a quién bloquear o cerrar todo el spa; sin ella, el estilista bloquea su
// propia agenda y ve los cierres del spa solo como información.
function TimeOffManager({ stylists = null, currentUsername = '' }) {
  const isAdmin = Array.isArray(stylists);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState(null);
  const today = todayInTimeZone();

  const load = useCallback(async () => {
    try {
      setBlocks(await apiGetTimeOff());
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

  const change = event => {
    const { name, value } = event.target;
    setNotice(null);
    // Al elegir el inicio se propone el mismo día como fin, el caso más común.
    setForm(current => ({ ...current, [name]: value, ...(name === 'start' && (!current.end || current.end < value) ? { end: value } : {}) }));
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await apiCreateTimeOff(isAdmin ? form : { start: form.start, end: form.end, reason: form.reason });
      setForm(EMPTY_FORM);
      setNotice({ error: false, text: 'Las fechas quedaron bloqueadas: ya no se pueden reservar.' });
      await load();
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async block => {
    if (!window.confirm(`¿Quitar el bloqueo del ${formatRange(block)}? Esas fechas volverán a estar disponibles.`)) return;
    setBusyId(block._id);
    setNotice(null);
    try {
      await apiDeleteTimeOff(block._id);
      setNotice({ error: false, text: 'Se quitó el bloqueo.' });
      await load();
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setBusyId('');
    }
  };

  const whoLabel = block => {
    if (!block.stylist) return 'Todo el spa';
    if (!isAdmin) return 'Tú';
    return stylists.find(stylist => stylist.username === block.stylist)?.fullName || `@${block.stylist}`;
  };
  const canRemove = block => isAdmin || block.stylist === currentUsername;

  return (
    <>
      <InlineForm onSubmit={submit} aria-label="Bloquear fechas">
        {isAdmin && (
          <label>Aplica a
            <select name="stylist" value={form.stylist} onChange={change}>
              <option value="">Todo el spa (cierre)</option>
              {stylists.map(stylist => <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>)}
            </select>
          </label>
        )}
        <label>Desde<input type="date" name="start" min={today} value={form.start} onChange={change} required /></label>
        <label>Hasta<input type="date" name="end" min={form.start || today} value={form.end} onChange={change} required /></label>
        <label>Motivo (opcional)<input name="reason" value={form.reason} onChange={change} maxLength={120} placeholder={isAdmin ? 'Festivo, mantenimiento…' : 'Vacaciones, cita médica…'} /></label>
        <Button type="submit" disabled={saving || !form.start || !form.end}>{saving ? 'Guardando…' : 'Bloquear fechas'}</Button>
      </InlineForm>
      {notice && <Notice $error={notice.error} role={notice.error ? 'alert' : 'status'}>{notice.text}</Notice>}
      <TableWrap><Table>
        <thead><tr><th>Fechas</th><th>Aplica a</th><th>Motivo</th><th>Acción</th></tr></thead>
        <tbody>
          {loading && <tr><EmptyCell colSpan={4}>Cargando…</EmptyCell></tr>}
          {!loading && blocks.length === 0 && <tr><EmptyCell colSpan={4}>No hay fechas bloqueadas próximamente.</EmptyCell></tr>}
          {blocks.map(block => (
            <tr key={block._id}>
              <td style={{ whiteSpace: 'nowrap' }}>{formatRange(block)}</td>
              <td>{whoLabel(block)}</td>
              <td>{block.reason || '—'}</td>
              <td>
                {canRemove(block)
                  ? <Button type="button" $secondary disabled={busyId === block._id} onClick={() => remove(block)}>Quitar</Button>
                  : <small>Lo define la administración</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table></TableWrap>
    </>
  );
}

export default TimeOffManager;

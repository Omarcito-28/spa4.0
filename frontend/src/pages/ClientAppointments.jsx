import { Fragment, useEffect, useState } from 'react';
import {
  apiCreateReview,
  apiGetAppointmentPolicy,
  apiGetAppointments,
  apiGetMyReviewedAppointments,
  apiRescheduleAppointment,
  apiUpdateAppointmentStatus
} from '../services/api';
import { minutesUntilAppointment } from '../utils/date';
import RescheduleForm from '../components/RescheduleForm';
import { Button, Description, InlineForm, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';
import StatusBadge from '../components/StatusBadge';
import { isFinalStatus } from '../utils/appointmentStatus';
import RefreshStatus from '../components/RefreshStatus';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { downloadIcs } from '../utils/download';
import StarRating from '../components/StarRating';

function ReviewForm({ appointment, onSaved, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiCreateReview({ appointmentId: appointment._id, rating, comment });
      await onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InlineForm onSubmit={submit} aria-label={`Calificar ${appointment.service}`}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend>¿Cómo te fue con {appointment.service}?</legend>
        <StarRating value={rating} onChange={setRating} />
      </fieldset>
      <label>Comentario (opcional)
        <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={500} rows={2} placeholder="Cuéntanos qué te gustó o qué podemos mejorar" />
      </label>
      {error && <Notice $error role="alert">{error}</Notice>}
      <Button type="submit" disabled={busy || !rating}>{busy ? 'Enviando…' : 'Enviar reseña'}</Button>
      <Button type="button" $secondary onClick={onCancel}>Cerrar</Button>
    </InlineForm>
  );
}

function ClientAppointments() {
  const live = useAutoRefresh(apiGetAppointments, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data ?? [];
  const loading = live.loading;
  const [actionError, setActionError] = useState('');
  const error = actionError || live.error;
  const [reschedulingId, setReschedulingId] = useState('');
  // Horas mínimas para cancelar o reprogramar desde la página; el backend aplica la misma regla.
  const [noticeHours, setNoticeHours] = useState(0);

  useEffect(() => {
    let active = true;
    apiGetAppointmentPolicy()
      .then(policy => { if (active) setNoticeHours(policy.cancellationNoticeHours || 0); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const [reviewed, setReviewed] = useState([]);
  const [reviewingId, setReviewingId] = useState('');
  const loadReviewed = () => apiGetMyReviewedAppointments().then(setReviewed).catch(() => {});

  useEffect(() => {
    let active = true;
    apiGetMyReviewedAppointments().then(ids => { if (active) setReviewed(ids); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const tooLateToChange = appointment => noticeHours > 0 && minutesUntilAppointment(appointment) < noticeHours * 60;

  const cancel = async id => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await apiUpdateAppointmentStatus(id, 'CANCELLED');
      setActionError('');
      await live.refresh();
    } catch (requestError) {
      setActionError(requestError.message);
    }
  };

  return (
    <Page>
      <Title>Mis citas</Title>
      <Description>
        Consulta el estado de tus reservas y cancela las que ya no necesites.
        {noticeHours > 0 && ` Puedes cancelar o reprogramar hasta ${noticeHours} ${noticeHours === 1 ? 'hora' : 'horas'} antes de la cita; después, comunícate con el spa.`}
      </Description>
      <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      {error && <Notice $error role="alert">{error}</Notice>}
      {loading ? <p role="status">Cargando citas…</p> : appointments.length === 0
        ? <p>Aún no tienes citas registradas.</p>
        : (
          <TableWrap><Table>
            <thead><tr><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Estilista</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{appointments.map(appointment => (
              <Fragment key={appointment._id}>
              <tr key={appointment._id}>
                <td>{appointment.service}</td><td>{appointment.date}</td><td>{appointment.time}</td>
                <td>{appointment.stylist || 'Por asignar'}</td>
                <td><StatusBadge status={appointment.status} /></td>
                <td>
                  {!isFinalStatus(appointment.status) && (tooLateToChange(appointment)
                    ? <small>Faltan menos de {noticeHours} h: para cambios comunícate con el spa.</small>
                    : <>
                      <Button type="button" onClick={() => setReschedulingId(current => current === appointment._id ? '' : appointment._id)}>Reprogramar</Button>
                      <Button type="button" $danger onClick={() => cancel(appointment._id)}>Cancelar</Button>
                    </>)}
                  {!isFinalStatus(appointment.status) &&
                    <Button type="button" $secondary onClick={() => downloadIcs(appointment, { location: import.meta.env.VITE_CONTACT_ADDRESS?.trim() })}>
                      <i className="fas fa-calendar-plus" aria-hidden="true"></i> Agregar a mi calendario
                    </Button>}
                  {appointment.status === 'COMPLETED' && (reviewed.includes(appointment._id)
                    ? <small><i className="fas fa-check" aria-hidden="true"></i> Ya la calificaste. ¡Gracias!</small>
                    : <Button type="button" onClick={() => setReviewingId(current => current === appointment._id ? '' : appointment._id)}>
                      <i className="fas fa-star" aria-hidden="true"></i> Calificar
                    </Button>)}
                </td>
              </tr>
              {reviewingId === appointment._id && <tr><td colSpan="6">
                <ReviewForm appointment={appointment} onSaved={async () => { setReviewingId(''); await loadReviewed(); }} onCancel={() => setReviewingId('')} />
              </td></tr>}
              {reschedulingId === appointment._id && <tr key={`${appointment._id}-reschedule`}><td colSpan="6">
                <RescheduleForm appointment={appointment} onSubmit={data => apiRescheduleAppointment(appointment._id, data)} onSaved={async () => { setReschedulingId(''); await live.refresh(); }} onCancel={() => setReschedulingId('')} />
                <p>El cambio quedará pendiente de confirmación.</p>
              </td></tr>}
              </Fragment>
            ))}</tbody>
          </Table></TableWrap>
        )}
    </Page>
  );
}

export default ClientAppointments;

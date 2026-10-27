import { useEffect, useState } from 'react';
import { apiGetAppointmentPolicy, apiGetStylists, apiSendReminders } from '../services/api';
import AdminNav from '../components/AdminNav';
import TimeOffManager from '../components/TimeOffManager';
import { Button, Card, Description, Notice, Page, SectionTitle, Title } from '../components/ManagementUI';

function AdminAgenda() {
  const [stylists, setStylists] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [reminderNotice, setReminderNotice] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([apiGetStylists(), apiGetAppointmentPolicy()])
      .then(([stylistList, currentPolicy]) => {
        if (!active) return;
        setStylists(stylistList);
        setPolicy(currentPolicy);
      })
      .catch(requestError => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const sendReminders = async () => {
    setSending(true);
    setReminderNotice(null);
    try {
      const result = await apiSendReminders();
      setReminderNotice(result.skipped
        ? { error: true, text: `No se enviaron recordatorios: ${result.skipped}` }
        : { error: false, text: result.sent
          ? `Se enviaron ${result.sent} ${result.sent === 1 ? 'recordatorio' : 'recordatorios'} para las citas de mañana.`
          : 'No había recordatorios pendientes: las citas de mañana ya fueron avisadas.' });
    } catch (requestError) {
      setReminderNotice({ error: true, text: requestError.message });
    } finally {
      setSending(false);
    }
  };

  const hours = policy?.cancellationNoticeHours;

  return (
    <Page>
      <AdminNav />
      <Title>Agenda del spa</Title>
      <Description>Cierra el spa en festivos o días especiales, bloquea fechas de un estilista y revisa las reglas que se aplican a las reservas.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}

      <SectionTitle>Cierres y días libres</SectionTitle>
      <Description>Un cierre del spa bloquea a todos los estilistas y las citas sin asignar. No se puede bloquear una fecha con citas activas: reasígnalas o cancélalas primero en «Citas».</Description>
      <Card>
        {stylists ? <TimeOffManager stylists={stylists} /> : !error && <p role="status">Cargando…</p>}
      </Card>

      <SectionTitle>Recordatorios por correo</SectionTitle>
      <Card>
        <p>El sistema envía automáticamente un recordatorio el día anterior a cada cita pendiente o confirmada, una sola vez por cita. Revisa cada 30 minutos mientras el servidor está activo y solo funciona con el correo (SMTP) configurado.</p>
        <Button type="button" onClick={sendReminders} disabled={sending}>
          <i className="fas fa-paper-plane" aria-hidden="true"></i> {sending ? 'Enviando…' : 'Enviar recordatorios ahora'}
        </Button>
        {reminderNotice && <Notice $error={reminderNotice.error} role="status">{reminderNotice.text}</Notice>}
      </Card>

      <SectionTitle>Política de cancelación</SectionTitle>
      <Card>
        {policy === null ? <p role="status">Cargando…</p> : hours > 0 ? (
          <p>Los clientes pueden cancelar o reprogramar desde la página hasta <strong>{hours} {hours === 1 ? 'hora' : 'horas'}</strong> antes de su cita. Después deben comunicarse con el spa; el equipo sí puede hacer cambios en cualquier momento.</p>
        ) : (
          <p>No hay un plazo mínimo: los clientes pueden cancelar o reprogramar hasta la hora de la cita.</p>
        )}
        <small>El plazo se configura en el servidor con la variable <code>CANCELLATION_NOTICE_HOURS</code>.</small>
      </Card>
    </Page>
  );
}

export default AdminAgenda;

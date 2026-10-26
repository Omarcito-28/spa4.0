import { useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/auth';
import { apiGetServices, apiGetStylists, apiGetStylistAvailability } from '../services/api';
import { todayInTimeZone } from '../utils/date';

const panelEnter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const launcherPulse = keyframes`
  0%, 100% { box-shadow: 0 8px 24px rgba(91, 58, 15, 0.3), 0 0 0 0 rgba(201, 148, 42, 0.3); }
  50% { box-shadow: 0 8px 24px rgba(91, 58, 15, 0.3), 0 0 0 8px rgba(201, 148, 42, 0); }
`;

const Widget = styled.aside`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 1000;
  font-family: Arial, sans-serif;
`;

const WhatsAppButton = styled.a`
  position: fixed;
  left: 1.5rem;
  bottom: 1.5rem;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: linear-gradient(135deg, #25d366, #128c4a);
  color: #fff;
  box-shadow: 0 6px 20px rgba(18, 140, 74, 0.35);
  font-family: Arial, sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 9px 25px rgba(18, 140, 74, 0.45);
  }

  &:focus-visible {
    outline: 3px solid ${theme.colors.primaryDark};
    outline-offset: 3px;
  }

  @media (max-width: 480px) {
    left: 1rem;
    bottom: 1rem;
    padding: 0.75rem;

    span {
      display: none;
    }
  }
`;

const Launcher = styled.button`
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(145deg, #bd8d3d, #78500f 80%);
  box-shadow: 0 8px 24px rgba(91, 58, 15, 0.3);
  font-size: 1.8rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: ${props => props.$isOpen ? 'none' : css`${launcherPulse} 3s ease-in-out infinite`};

  &:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 12px 28px rgba(91, 58, 15, 0.38);
  }

  &:focus-visible {
    outline: 3px solid ${theme.colors.accent};
    outline-offset: 3px;
  }
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: min(24rem, calc(100vw - 2rem));
  height: min(37rem, calc(100dvh - 7rem));
  margin-bottom: 1rem;
  overflow: hidden;
  border: 1px solid rgba(153, 101, 21, 0.2);
  border-radius: 1.4rem;
  background: #fffaf1;
  box-shadow: 0 24px 70px rgba(54, 37, 15, 0.24), 0 4px 14px rgba(54, 37, 15, 0.08);
  animation: ${panelEnter} 0.24s ease-out both;

  @media (max-width: 480px) {
    width: calc(100vw - 2rem);
    height: min(36rem, calc(100dvh - 6.5rem));
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  color: #fffaf1;
  background:
    radial-gradient(circle at 0% 0%, rgba(227, 190, 119, 0.23), transparent 45%),
    linear-gradient(135deg, #302313, #604412 65%, #785719);
  box-shadow: 0 4px 14px rgba(48, 35, 19, 0.18);
`;

const BrandMark = styled.div`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  border: 1px solid rgba(255, 235, 190, 0.7);
  border-radius: 50%;
  background: rgba(255, 248, 230, 0.12);
  color: #f4d99f;
  font-family: ${theme.fonts.primary};
  font-size-adjust: none;
  font-size: 1.25rem;
  font-style: italic;
`;

const HeaderTitle = styled.div`
  font-family: ${theme.fonts.primary};
  font-size-adjust: none;
  font-size: 1.18rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const HeaderSubtitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.2rem;
  color: rgba(255, 250, 241, 0.78);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
`;

const OnlineDot = styled.span`
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #a8d8a5;
  box-shadow: 0 0 0 3px rgba(168, 216, 165, 0.13);
`;

const CloseButton = styled.button`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 2rem;
  height: 2rem;
  margin-left: auto;
  border: 0;
  border-radius: 50%;
  color: rgba(255, 250, 241, 0.85);
  background: rgba(255, 255, 255, 0.1);
  font-size: 1.2rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
  }

  &:focus-visible {
    outline: 2px solid #f4d99f;
    outline-offset: 2px;
  }
`;

const Transcript = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 0.9rem;
  overflow-y: auto;
  padding: 1.1rem 1rem;
  background:
    radial-gradient(ellipse at top right, rgba(222, 196, 148, 0.18), transparent 48%),
    #fffaf1;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 99px;
    background: rgba(153, 101, 21, 0.25);
  }
`;

const Message = styled.div`
  align-self: ${props => props.$fromUser ? 'flex-end' : 'flex-start'};
  max-width: 92%;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${props => props.$fromUser ? 'rgba(191, 151, 85, 0.2)' : 'rgba(107, 84, 47, 0.08)'};
  border-radius: ${props => props.$fromUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem'};
  background: ${props => props.$fromUser
    ? 'linear-gradient(135deg, #f5ead5, #efe0c3)'
    : 'rgba(255, 255, 255, 0.94)'};
  color: #403522;
  font-size: 0.88rem;
  line-height: 1.5;
  white-space: pre-line;
  box-shadow: 0 3px 10px rgba(67, 47, 18, 0.055);

  &[role='status'] {
    color: #746448;
    font-style: italic;
  }
`;

const ServiceList = styled.div`
  display: grid;
  gap: 0.55rem;
  margin-top: 0.65rem;
`;

const ServiceItem = styled.div`
  padding: 0.6rem 0.65rem;
  border: 1px solid #efe5d4;
  border-radius: 0.7rem;
  background: #fffdf9;
`;

const ServiceHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.65rem;
  color: #4b3718;
  font-size: 0.84rem;
  font-weight: 700;

  span:last-child {
    flex: 0 0 auto;
    color: ${theme.colors.primary};
  }
`;

const ServiceDescription = styled.div`
  margin-top: 0.15rem;
  color: #786d5c;
  font-size: 0.76rem;
  line-height: 1.4;
`;

const Actions = styled.div`
  display: grid;
  flex: 0 1 auto;
  max-height: 30%;
  overflow-y: auto;
  gap: 0.55rem;
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid #eee4d5;
  background: rgba(255, 253, 249, 0.96);
`;

const Composer = styled.form`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border-top: 1px solid #eee4d5;
  background: #fffdf9;

  input {
    flex: 1;
    min-width: 0;
    height: 2.5rem;
    padding: 0 0.75rem;
    border: 1px solid #d8cbb4;
    border-radius: 0.65rem;
    background: #fff;
    color: #403522;
    font: inherit;
    font-size: 0.84rem;

    &:focus {
      border-color: ${theme.colors.primary};
      outline: 2px solid rgba(153, 101, 21, 0.16);
    }
  }

  button {
    flex: 0 0 auto;
    height: 2.5rem;
    padding: 0 0.75rem;
    border: 0;
    border-radius: 0.65rem;
    background: ${theme.colors.primary};
    color: white;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:not(:disabled):hover {
      background: ${theme.colors.primaryDark};
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(153, 101, 21, 0.25);
  border-radius: 0.8rem;
  background: #fff;
  color: ${theme.colors.primaryDark};
  font-size: 0.83rem;
  font-weight: 600;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${theme.colors.accent};
    background: #fffaf0;
  }

  &::after {
    content: '›';
    color: ${theme.colors.accent};
    font-size: 1.25rem;
    line-height: 1;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.accent};
    outline-offset: 2px;
  }
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #a97a2b, #78500f);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(120, 80, 15, 0.18);

  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #bd8d3d, #8b6119);
  }
`;

const ExternalActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #a97a2b, #78500f);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;

  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #bd8d3d, #8b6119);
  }
`;

const Planner = styled.form`
  display: grid;
  gap: 0.55rem;
  flex: 0 1 auto;
  max-height: 45%;
  min-height: 0;
  overflow-y: auto;
  padding: 0.75rem 0.85rem;
  border-top: 1px solid #eee4d5;
  background: #fffaf1;
  font-size: 0.8rem;

  label {
    display: grid;
    gap: 0.2rem;
    color: #604412;
    font-weight: 600;
  }

  select, input {
    width: 100%;
    min-width: 0;
    height: 2.15rem;
    padding: 0 0.55rem;
    border: 1px solid #d8cbb4;
    border-radius: 0.55rem;
    background: #fff;
    color: #403522;
    font: inherit;
  }

  button {
    min-height: 2.2rem;
    border: 0;
    border-radius: 0.6rem;
    background: ${theme.colors.primary};
    color: #fff;
    font: inherit;
    font-weight: 700;
  }
`;

const PlannerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: #604412;
  font-weight: 700;
`;

const PlannerCloseButton = styled.button`
  flex: 0 0 auto;
  width: 2rem;
  min-height: 2rem !important;
  padding: 0 !important;
  border: 1px solid #d8cbb4 !important;
  border-radius: 50% !important;
  background: #fff !important;
  color: #604412 !important;
  font-size: 1.1rem !important;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: #f5ead5 !important;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.accent};
    outline-offset: 2px;
  }
`;

const initialMessages = [{
  id: 0,
  text: '¡Hola! Soy la asistente de Essence De Toi. ¿En qué puedo ayudarte?',
}];

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

const timeInMinutes = time => {
  const [, hour, minute, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
};

const formatTime = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

const timeSlotsFor = (schedule, duration, appointments) => {
  if (!schedule) return [];
  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const slots = [];
  for (let minute = start; minute + duration <= end; minute += 15) {
    const time = formatTime(minute);
    const overlaps = appointments.some(appointment => {
      const bookedStart = timeInMinutes(appointment.time);
      const bookedDuration = appointment.duration || 60;
      return minute < bookedStart + bookedDuration && bookedStart < minute + duration;
    });
    if (!overlaps) slots.push(time);
  }
  return slots;
};

const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const describeBusinessHours = stylists => {
  if (!stylists.length) return 'Todavía no hay horarios publicados para los estilistas.';
  return stylists.map(stylist => {
    const schedule = stylist.weeklySchedule?.length
      ? stylist.weeklySchedule
      : dayNames.map((_, day) => ({
          day,
          enabled: day !== 0,
          start: '09:00',
          end: day === 6 ? '17:00' : '19:00'
        }));
    const days = schedule
      .filter(day => day.enabled)
      .map(day => `${dayNames[day.day]} ${day.start}–${day.end}`)
      .join(', ');
    return `${stylist.fullName}: ${days || 'sin horarios publicados'}`;
  }).join('\n');
};

function ChatAssistant() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState('');
  const [plannerServices, setPlannerServices] = useState([]);
  const [plannerStylists, setPlannerStylists] = useState([]);
  const [plannerForm, setPlannerForm] = useState({ service: '', stylist: '', date: '' });
  const nextMessageId = useRef(1);

  const addMessage = message => {
    setMessages(current => [...current, { id: nextMessageId.current++, ...message }]);
  };

  const openPlanner = async () => {
    setPlannerOpen(true);
    setPlannerError('');
    if (plannerServices.length && plannerStylists.length) return;
    setPlannerLoading(true);
    try {
      const [services, stylists] = await Promise.all([apiGetServices(), apiGetStylists()]);
      setPlannerServices(services);
      setPlannerStylists(stylists);
      setPlannerForm(current => ({
        ...current,
        service: current.service || services[0]?.name || ''
      }));
    } catch (error) {
      setPlannerError(error.message || 'No se pudieron cargar servicios y estilistas.');
    } finally {
      setPlannerLoading(false);
    }
  };

  const bookingLink = selection => {
    const params = new URLSearchParams(selection);
    const destination = `/appointments/new?${params.toString()}`;
    return isAuthenticated
      ? { link: destination, linkText: 'Continuar con la reserva' }
      : {
          link: `/login?returnTo=${encodeURIComponent(destination)}`,
          linkText: 'Inicia sesión para reservar'
        };
  };

  const handoff = (text, fallbackText) => {
    if (whatsappNumber) {
      return {
        text,
        externalLink: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fallbackText)}`,
        externalLinkText: 'Hablar con una persona por WhatsApp'
      };
    }
    const email = import.meta.env.VITE_CONTACT_EMAIL?.trim();
    if (email) {
      return {
        text,
        externalLink: `mailto:${email}?subject=${encodeURIComponent('Consulta - Essence De Toi')}&body=${encodeURIComponent(fallbackText)}`,
        externalLinkText: 'Escribir al spa'
      };
    }
    return {
      text: `${text} El negocio aún no configuró WhatsApp ni correo para derivarte; revisa la página de contacto.`,
      link: '/contact',
      linkText: 'Ver contacto'
    };
  };

  const handleAction = async action => {
    if (isLoading) return;

    if (action === 'services') {
      addMessage({ text: 'Quiero conocer los servicios y precios.', fromUser: true });
      setIsLoading(true);
      try {
        const services = await apiGetServices();
        addMessage({
          text: services.length
            ? 'Estos son los servicios disponibles:'
            : 'Aún no hay servicios publicados en el catálogo.',
          services,
        });
      } catch {
        addMessage({ text: 'No pude cargar el catálogo. Inténtalo de nuevo en un momento.' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (action === 'booking') {
      addMessage({ text: 'Quiero reservar una cita.', fromUser: true });
      addMessage({
        text: 'Te ayudo a consultar el horario. Esto no reserva la cita; la solicitud se envía al formulario y queda pendiente de confirmación.',
      });
      await openPlanner();
      return;
    }
    if (action === 'availability') {
      addMessage({ text: 'Quiero consultar horarios disponibles.', fromUser: true });
      await openPlanner();
    }
  };

  const submitAvailability = async event => {
    event.preventDefault();
    if (!plannerForm.date || !plannerForm.service || plannerLoading) return;
    setPlannerLoading(true);
    setPlannerError('');
    try {
      const availability = await apiGetStylistAvailability(plannerForm.date, plannerForm.stylist);
      const service = plannerServices.find(item => item.name === plannerForm.service);
      const slots = timeSlotsFor(availability.schedule, service?.duration || 60, availability.appointments);
      addMessage({
        text: availability.schedule
          ? slots.length
            ? `Horarios disponibles para ${service?.name || 'el servicio'} el ${plannerForm.date}. Al continuar se abrirá el formulario; la cita solo queda solicitada cuando la envíes y pendiente hasta que el equipo la confirme.`
            : `No hay horarios libres para ${service?.name || 'el servicio'} el ${plannerForm.date}.`
          : plannerForm.stylist
            ? `La estilista seleccionada no trabaja el ${plannerForm.date}.`
            : `El spa no tiene atención configurada para el ${plannerForm.date}.`,
        slots: slots.map(time => ({
          time,
          ...bookingLink({
            service: plannerForm.service,
            stylist: plannerForm.stylist,
            date: plannerForm.date,
            time
          })
        }))
      });
      setPlannerOpen(false);
    } catch (error) {
      setPlannerError(error.message || 'No se pudo consultar la disponibilidad.');
    } finally {
      setPlannerLoading(false);
    }
  };

  const submitQuestion = async event => {
    event.preventDefault();
    const text = question.trim();
    if (!text || isLoading) return;
    setQuestion('');
    addMessage({ text, fromUser: true });
    const query = text.toLocaleLowerCase('es');

    if (/servicio|precio|costo|cat[aá]logo|duraci[oó]n|cu[aá]nto (?:tarda|dura)/.test(query)) {
      setIsLoading(true);
      try {
        const services = await apiGetServices();
        addMessage({
          text: services.length ? 'Estos son los servicios disponibles:' : 'Aún no hay servicios publicados en el catálogo.',
          services,
        });
      } catch {
        addMessage({ text: 'No pude cargar el catálogo en este momento. Inténtalo de nuevo.' });
      } finally {
        setIsLoading(false);
      }
    } else if (/reserv|cita|agend/.test(query)) {
      addMessage({
        text: 'Consulta horarios reales por servicio, fecha y estilista. La cita no queda reservada hasta enviar la solicitud, y requiere confirmación del equipo.',
      });
      await openPlanner();
    } else if (/horario|abren|abierto|cierran/.test(query) && !/disponib|hora libre/.test(query)) {
      setIsLoading(true);
      try {
        const stylists = await apiGetStylists();
        addMessage({ text: describeBusinessHours(stylists) });
      } catch {
        addMessage({ text: 'No pude consultar los horarios. Inténtalo de nuevo o escríbenos por un canal de atención.' });
      } finally {
        setIsLoading(false);
      }
    } else if (/disponib|hora libre/.test(query)) {
      addMessage({ text: 'Puedo revisar horarios reales de una fecha y estilista. Selecciona el servicio y el día.' });
      await openPlanner();
    } else if (/contact|tel[eé]fono|correo|direcci[oó]n|ubicaci[oó]n/.test(query)) {
      const contacts = [
        import.meta.env.VITE_CONTACT_PHONE && `Teléfono: ${import.meta.env.VITE_CONTACT_PHONE}`,
        import.meta.env.VITE_CONTACT_EMAIL && `Correo: ${import.meta.env.VITE_CONTACT_EMAIL}`,
        import.meta.env.VITE_CONTACT_ADDRESS && `Dirección: ${import.meta.env.VITE_CONTACT_ADDRESS}`,
      ].filter(Boolean);
      const contactText = contacts.length
        ? contacts.join(' · ')
        : 'Los datos de contacto aún no están configurados.';
      addMessage(handoff(
        contactText,
        `Hola, quisiera consultar: ${text}`
      ));
    } else if (/pago|pagar|efectivo|tarjeta|transferencia/.test(query)) {
      const paymentMethods = import.meta.env.VITE_PAYMENT_METHODS?.trim();
      addMessage(paymentMethods
        ? { text: `Medios de pago informados por el spa: ${paymentMethods}` }
        : handoff('No tengo medios de pago configurados y prefiero no darte información incorrecta.', `Hola, quisiera consultar los medios de pago. ${text}`));
    } else if (/cancel|reprogram|pol[ií]tica|devoluci[oó]n/.test(query)) {
      const policy = import.meta.env.VITE_CANCELLATION_POLICY?.trim();
      addMessage(policy
        ? { text: `Política informada por el spa: ${policy}` }
        : handoff('No tengo una política de cancelación o reprogramación configurada, así que no quiero inventar una respuesta.', `Hola, quisiera consultar la política de cancelación o reprogramación. ${text}`));
    } else {
      addMessage(handoff(
        'No entendí bien la consulta. Puedo ayudarte con servicios y precios, disponibilidad, reservas, horarios, pagos, cancelaciones o contacto.',
        `Hola, necesito ayuda con esta consulta: ${text}`
      ));
    }
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quisiera información sobre los servicios y citas de Essence De Toi.')}`;

  return (
    <>
      {whatsappNumber && (
        <WhatsAppButton
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Escríbenos por WhatsApp"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
            <path d="M12.04 2a9.87 9.87 0 0 0-8.46 14.96L2.2 22l5.2-1.36A9.95 9.95 0 1 0 12.04 2Zm0 18.06a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.08.8.82-3-.2-.31A8.12 8.12 0 1 1 12.04 20.06Zm4.46-6.08c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.58.25 1.04.4 1.4.51.58.18 1.1.15 1.51.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
          </svg>
          <span>Escríbenos</span>
        </WhatsAppButton>
      )}
      <Widget>
        {isOpen && (
          <Panel aria-label="Chat de Essence De Toi">
            <Header>
              <BrandMark aria-hidden="true">E</BrandMark>
              <div>
                <HeaderTitle>Essence De Toi</HeaderTitle>
                <HeaderSubtitle>
                  <OnlineDot />
                  Asistente de servicios y reservas
                </HeaderSubtitle>
              </div>
              <CloseButton type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
                ×
              </CloseButton>
            </Header>
            <Transcript aria-live="polite" aria-relevant="additions text">
              {messages.map(message => (
                <Message key={message.id} $fromUser={message.fromUser}>
                  {message.text}
                  {message.services?.length > 0 && (
                    <ServiceList>
                      {message.services.map(service => (
                        <ServiceItem key={service._id}>
                          <ServiceHeading>
                            <span>{service.name}</span>
                            <span>{service.price} · {service.duration || 60} min</span>
                          </ServiceHeading>
                          {service.description && (
                            <ServiceDescription>{service.description}</ServiceDescription>
                          )}
                        </ServiceItem>
                      ))}
                    </ServiceList>
                  )}
                  {message.link && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <ActionLink to={message.link}>{message.linkText}</ActionLink>
                    </div>
                  )}
                  {message.externalLink && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <ExternalActionLink href={message.externalLink} target="_blank" rel="noreferrer">
                        {message.externalLinkText}
                      </ExternalActionLink>
                    </div>
                  )}
                  {message.slots?.length > 0 && (
                    <ServiceList>
                      {message.slots.map(slot => (
                        <ServiceItem key={slot.time}>
                          <ServiceHeading>
                            <span>{slot.time}</span>
                            <ActionLink to={slot.link}>{slot.linkText}</ActionLink>
                          </ServiceHeading>
                        </ServiceItem>
                      ))}
                    </ServiceList>
                  )}
                </Message>
              ))}
              {isLoading && <Message role="status">Consultando el catálogo…</Message>}
            </Transcript>
            {plannerOpen && (
              <Planner onSubmit={submitAvailability} aria-label="Consultar horarios para una reserva">
                <PlannerHeader>
                  <span>Consultar disponibilidad</span>
                  <PlannerCloseButton
                    type="button"
                    aria-label="Cerrar consulta de disponibilidad"
                    onClick={() => setPlannerOpen(false)}
                  >
                    ×
                  </PlannerCloseButton>
                </PlannerHeader>
                {plannerLoading && !plannerServices.length ? (
                  <span role="status">Cargando servicios y estilistas…</span>
                ) : (
                  <>
                    <label>
                      Servicio
                      <select value={plannerForm.service} onChange={event => setPlannerForm(current => ({ ...current, service: event.target.value }))} required>
                        <option value="">Selecciona un servicio</option>
                        {plannerServices.map(service => <option key={service._id} value={service.name}>{service.name} · {service.price}</option>)}
                      </select>
                    </label>
                    <label>
                      Estilista
                      <select value={plannerForm.stylist} onChange={event => setPlannerForm(current => ({ ...current, stylist: event.target.value }))}>
                        <option value="">Por asignar</option>
                        {plannerStylists.map(stylist => <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>)}
                      </select>
                    </label>
                    <label>
                      Fecha
                      <input type="date" min={todayInTimeZone()} value={plannerForm.date} onChange={event => setPlannerForm(current => ({ ...current, date: event.target.value }))} required />
                    </label>
                    {plannerError && <span role="alert">{plannerError}</span>}
                    <button type="submit" disabled={plannerLoading || !plannerForm.service || !plannerForm.date}>
                      {plannerLoading ? 'Consultando…' : 'Ver horarios disponibles'}
                    </button>
                  </>
                )}
              </Planner>
            )}
            <Composer onSubmit={submitQuestion}>
              <input
                aria-label="Escribe una pregunta"
                placeholder="Escribe tu pregunta…"
                value={question}
                onChange={event => setQuestion(event.target.value)}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !question.trim()}>Enviar</button>
            </Composer>
            <Actions aria-label="Opciones del chat">
              <ActionButton type="button" onClick={() => handleAction('services')} disabled={isLoading}>
                Servicios y precios
              </ActionButton>
              <ActionButton type="button" onClick={() => handleAction('availability')} disabled={isLoading}>
                Consultar disponibilidad
              </ActionButton>
              <ActionButton type="button" onClick={() => handleAction('booking')} disabled={isLoading}>
                Reservar cita
              </ActionButton>
            </Actions>
          </Panel>
        )}
        <Launcher
          type="button"
          onClick={() => setIsOpen(open => !open)}
          aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
          aria-expanded={isOpen}
          $isOpen={isOpen}
        >
          {isOpen ? '×' : '✦'}
        </Launcher>
      </Widget>
    </>
  );
}

export default ChatAssistant;

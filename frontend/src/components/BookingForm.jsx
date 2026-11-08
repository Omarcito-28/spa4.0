import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { theme, fadeInUp } from '../styles/theme';
import { control } from './ManagementUI';
import { useAuth } from '../contexts/auth';
import { todayInTimeZone } from '../utils/date';
import {
  apiCreateAppointment,
  apiGetServices,
  apiGetStylists,
  apiGetStylistAvailability,
  resolveImageUrl
} from '../services/api';
import { downloadIcs } from '../utils/download';

/* ─── Layout ─────────────────────────────────────────────── */
// Diseño sobrio: tarjeta blanca y el dorado de la marca solo como acento.
const PageWrapper = styled.div`
  display: flex;
  padding: 0 0 3.5rem;

  @media (max-width: 992px) {
    padding-top: 1rem;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 780px;
  padding: 2.5rem 2.75rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: ${theme.borderRadius.large};
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 12px 32px rgba(60, 40, 10, 0.07);
  animation: ${fadeInUp} 0.45s ease-out;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    border-radius: ${theme.borderRadius.medium};
  }
`;

const Header = styled.header`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee8dc;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.6rem;
  color: ${theme.colors.primary};
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
`;

const Title = styled.h2`
  margin-bottom: 0.35rem;
  color: ${theme.colors.text};
  font-size: 2.6rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: 1.1rem;
`;

/* ─── Form grid ──────────────────────────────────────────── */
const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.4rem 1.25rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};

  small {
    color: ${theme.colors.textMuted};
    font-size: 0.92rem;
  }
`;

const Label = styled.label`
  color: ${theme.colors.text};
  font-size: 1.02rem;
  font-weight: 700;

  span {
    color: ${theme.colors.textMuted};
    font-weight: 400;
  }
`;

const Input = styled.input`
  ${control}
  ${props => props.$error && `border-color: ${theme.colors.danger};`}
`;

const Select = styled.select`
  ${control}
  ${props => props.$error && `border-color: ${theme.colors.danger};`}
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  ${control}
  min-height: 100px;
  resize: vertical;
`;

const ErrorMessage = styled.span`
  color: #b93224;
  font-size: 0.92rem;
`;

/* ─── Vista previa del servicio elegido ─────────────────── */
const ServicePreview = styled.div`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 1.1rem;
  margin-top: 0.35rem;
  padding: 0.85rem;
  border: 1px solid #efe3cc;
  border-radius: 14px;
  background: #fffdf9;
  animation: ${fadeInUp} 0.3s ease-out;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewImage = styled.div`
  min-height: 120px;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(135deg, #f6eedd, #efe3cc);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.accent};
  font-size: 1.8rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 520px) {
    height: 170px;
  }
`;

const PreviewBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  min-width: 0;

  h3 {
    margin: 0;
    color: ${theme.colors.text};
    font-size: 1.6rem;
  }

  p {
    margin: 0;
    color: ${theme.colors.textMuted};
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const Facts = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border: 1px solid #ebdfc6;
    border-radius: 999px;
    background: white;
    color: ${theme.colors.text};
    font-size: 0.98rem;
    font-weight: 700;
  }

  i {
    color: ${theme.colors.primary};
    font-size: 0.9rem;
  }
`;

/* ─── Submit button ──────────────────────────────────────── */
const SubmitButton = styled.button`
  grid-column: 1 / -1;
  margin-top: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  box-shadow: 0 4px 14px rgba(153, 101, 21, 0.25);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  transition: transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}, filter ${theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(153, 101, 21, 0.32);
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

/* ─── Success screen ─────────────────────────────────────── */
const SuccessWrapper = styled.div`
  text-align: center;
  animation: ${fadeInUp} 0.5s ease;
`;

const SuccessIcon = styled.div`
  width: 76px;
  height: 76px;
  margin: 0 auto 1.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  box-shadow: 0 6px 18px rgba(153, 101, 21, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
`;

const SuccessTitle = styled.h3`
  margin-bottom: 1rem;
  color: ${theme.colors.text};
  font-size: 2.6rem;
`;

const SuccessDetail = styled.p`
  margin-bottom: 0.75rem;
  color: ${theme.colors.textMuted};
  font-size: 1.12rem;
  line-height: 1.7;

  strong {
    color: ${theme.colors.text};
  }
`;

const BackButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.7rem 1.6rem;
  border: 1px solid #e6d7b9;
  border-radius: 999px;
  background: #fdf8ef;
  color: ${theme.colors.primaryDark};
  font-size: 1rem;
  font-weight: 700;
  transition: all ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.accent};
    background: white;
  }
`;

/* ─── Data ───────────────────────────────────────────────── */
const timeInMinutes = time => {
  const [, hour, minute, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
};

const formatTime = minutes => {
  const hour24 = Math.floor(minutes / 60);
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
};

const getTimeSlots = (schedule, duration) => {
  if (!schedule) return [];
  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const slots = [];
  for (let time = start; time + duration <= end; time += 15) {
    slots.push(formatTime(time));
  }
  return slots;
};

const appointmentsOverlap = (time, duration, appointment) => {
  const start = timeInMinutes(time);
  const bookedStart = timeInMinutes(appointment.time);
  const bookedDuration = appointment.duration || 60;
  return start < bookedStart + bookedDuration && bookedStart < start + duration;
};

/* ─── Component ──────────────────────────────────────────── */
function BookingForm() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const today = todayInTimeZone();

  const [formData, setFormData] = useState(() => ({
    service: searchParams.get('service') || '',
    stylist: searchParams.get('stylist') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    notes: ''
  }));
  const [errors, setErrors]     = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const availabilityKey = `${formData.date}:${formData.stylist}`;
  const currentAvailability = availabilityResult?.key === availabilityKey ? availabilityResult : null;
  const busyAppointments = currentAvailability?.appointments || [];
  const availableSchedule = currentAvailability?.schedule || null;
  const availabilityError = currentAvailability?.error || '';
  const isLoadingAvailability = Boolean(
    formData.date && (!currentAvailability || currentAvailability.loading)
  );
  const selectedService = services.find(service => service.name === formData.service);
  const selectedDuration = selectedService?.duration || 60;
  const availableSlots = getTimeSlots(availableSchedule, selectedDuration);
  const bookedSlots = availableSlots.filter(time => busyAppointments.some(appointment =>
    appointmentsOverlap(time, selectedDuration, appointment)));

  useEffect(() => {
    apiGetServices()
      .then(setServices)
      .catch(() => setServicesError('No se pudieron cargar los servicios. Verifica que el servidor esté activo.'))
      .finally(() => setIsLoadingServices(false));
    apiGetStylists().then(setStylists).catch(() => setStylists([]));
  }, []);

  useEffect(() => {
    if (!formData.date) return undefined;

    let isCurrent = true;
    apiGetStylistAvailability(formData.date, formData.stylist)
      .then(availability => {
        if (isCurrent) {
          setAvailabilityResult({ key: availabilityKey, ...availability });
        }
      })
      .catch(error => {
        if (isCurrent) {
          setAvailabilityResult({
            key: availabilityKey,
            appointments: [],
            schedule: null,
            error: error.message || 'No se pudo consultar la disponibilidad del estilista.'
          });
        }
      })

    return () => { isCurrent = false; };
  }, [availabilityKey, formData.date, formData.stylist]);

  const validate = () => {
    const e = {};
    if (!formData.service) e.service = 'Selecciona un servicio';
    if (!formData.date)    e.date    = 'La fecha es requerida';
    else if (formData.date < today) e.date = 'La fecha no puede ser en el pasado';
    if (!formData.time)    e.time    = 'Selecciona una hora';
    else if (availabilityError) e.time = 'No se pudo validar la disponibilidad. Inténtalo de nuevo.';
    else if (!isLoadingAvailability &&
      (!availableSlots.includes(formData.time) || bookedSlots.includes(formData.time))) {
      e.time = 'Ese horario ya no está disponible. Selecciona otro.';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(['service', 'date', 'stylist'].includes(name) ? { time: '' } : {})
    }));
    setSubmitError('');
    if (errors[name]) setErrors(prev => { const { [name]: _, ...rest } = prev; return rest; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      setCreatedAppointment(await apiCreateAppointment(formData));
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error.message || 'No se pudo agendar la cita. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <FormCard>
        {isSuccess ? (
          <SuccessWrapper>
            <SuccessIcon><i className="fas fa-check" aria-hidden="true"></i></SuccessIcon>
            <SuccessTitle>¡Cita agendada!</SuccessTitle>
            <SuccessDetail>
              Gracias, <strong>{user?.fullName || 'Cliente'}</strong>. Recibimos tu solicitud para&nbsp;
              <strong>{formData.service}</strong> el día <strong>{formData.date}</strong> a las <strong>{formData.time}</strong>.
            </SuccessDetail>
            <SuccessDetail>
              La cita quedó pendiente de confirmación. Puedes consultar su estado en «Mis citas».
            </SuccessDetail>
            {createdAppointment?._id && (
              <BackButton type="button" onClick={() => downloadIcs(createdAppointment, {
                stylistName: stylists.find(stylist => stylist.username === createdAppointment.stylist)?.fullName,
                location: import.meta.env.VITE_CONTACT_ADDRESS?.trim(),
              })}>
                <i className="fas fa-calendar-plus" aria-hidden="true"></i> Agregar a mi calendario
              </BackButton>
            )}{' '}
            <BackButton onClick={() => window.history.back()}>Volver</BackButton>
          </SuccessWrapper>
        ) : (
          <>
            <Header>
              <Eyebrow><i className="fas fa-spa" aria-hidden="true"></i>Reservas</Eyebrow>
              <Title>Agendar una cita</Title>
              <Subtitle>Elige el servicio, el día y la hora que mejor te queden.</Subtitle>
            </Header>

            <Form onSubmit={handleSubmit} noValidate>
              {/* Servicio */}
              <FormGroup $fullWidth>
                <Label htmlFor="service">Servicio</Label>
                <Select
                  id="service" name="service"
                  value={formData.service} onChange={handleChange}
                  $error={errors.service}
                  disabled={isLoadingServices || Boolean(servicesError) || services.length === 0}
                >
                  <option value="">{isLoadingServices ? 'Cargando servicios...' : 'Selecciona un servicio...'}</option>
                  {services.map(service => (
                    <option key={service._id} value={service.name}>{service.name}</option>
                  ))}
                </Select>
                {errors.service && <ErrorMessage>{errors.service}</ErrorMessage>}
                {servicesError && <ErrorMessage>{servicesError}</ErrorMessage>}
                {!isLoadingServices && !servicesError && services.length === 0 && (
                  <ErrorMessage>No hay servicios disponibles para reservar.</ErrorMessage>
                )}
                {selectedService && (
                  <ServicePreview role="region" aria-label={`Detalles de ${selectedService.name}`}>
                    <PreviewImage>
                      {selectedService.image
                        ? <img src={resolveImageUrl(selectedService.image)} alt={selectedService.name} onError={event => { event.currentTarget.hidden = true; }} />
                        : <i className="fas fa-spa" aria-hidden="true"></i>}
                    </PreviewImage>
                    <PreviewBody>
                      <h3>{selectedService.name}</h3>
                      {selectedService.description && <p>{selectedService.description}</p>}
                      <Facts>
                        <li><i className="far fa-clock" aria-hidden="true"></i>{selectedService.duration || 60} min</li>
                        {selectedService.price && <li><i className="fas fa-tag" aria-hidden="true"></i>{selectedService.price}</li>}
                      </Facts>
                    </PreviewBody>
                  </ServicePreview>
                )}
              </FormGroup>

              {stylists.length > 0 && (
                <FormGroup $fullWidth>
                  <Label htmlFor="stylist">Estilista <span>(opcional)</span></Label>
                  <Select id="stylist" name="stylist" value={formData.stylist} onChange={handleChange}>
                    <option value="">Por asignar</option>
                    {stylists.map(stylist => (
                      <option key={stylist._id} value={stylist.username}>{stylist.fullName}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}

              {/* Fecha */}
              <FormGroup>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  type="date" id="date" name="date"
                  min={today} value={formData.date} onChange={handleChange}
                  $error={errors.date}
                />
                {errors.date && <ErrorMessage>{errors.date}</ErrorMessage>}
              </FormGroup>

              {/* Hora */}
              <FormGroup>
                <Label htmlFor="time">Hora</Label>
                <Select
                    id="time" name="time"
                    value={formData.time} onChange={handleChange}
                    $error={errors.time}
                    disabled={!formData.date || !formData.service || isLoadingAvailability || Boolean(availabilityError)}
                  >
                    <option value="">Selecciona una hora...</option>
                    {availableSlots.map(t => {
                      const isBooked = busyAppointments.some(appointment =>
                        appointmentsOverlap(t, selectedDuration, appointment));
                    return (
                      <option key={t} value={t} disabled={isBooked}>
                        {t}{isBooked ? ' — Reservada' : ''}
                      </option>
                    );
                  })}
                </Select>
                {errors.time && <ErrorMessage>{errors.time}</ErrorMessage>}
                {isLoadingAvailability && <small>Consultando horarios disponibles…</small>}
                {!formData.date && <small>Selecciona una fecha para consultar los horarios.</small>}
                {availabilityError && <ErrorMessage role="alert">{availabilityError}</ErrorMessage>}
                {currentAvailability && !availabilityError && !availableSchedule && (
                  <ErrorMessage>
                    {currentAvailability.closedReason ||
                      (formData.stylist ? 'El estilista no trabaja ese día.' : 'El spa no atiende ese día.')}
                  </ErrorMessage>
                )}
                {currentAvailability && !availabilityError && availableSchedule &&
                  getTimeSlots(availableSchedule, services.find(service => service.name === formData.service)?.duration || 60).length === 0 && (
                    <ErrorMessage>No hay horarios disponibles para la duración de este servicio.</ErrorMessage>
                  )}
              </FormGroup>

              {/* Notas */}
              <FormGroup $fullWidth>
                <Label htmlFor="notes">Notas adicionales <span>(opcional)</span></Label>
                <Textarea
                  id="notes" name="notes"
                  placeholder="Escribe aquí cualquier preferencia especial..."
                  value={formData.notes} onChange={handleChange}
                />
              </FormGroup>

              {submitError && <ErrorMessage role="alert">{submitError}</ErrorMessage>}

              <SubmitButton
                type="submit"
                disabled={isSubmitting || isLoadingServices || services.length === 0 ||
                  isLoadingAvailability || Boolean(availabilityError)}
              >
                {isSubmitting ? 'Agendando…' : 'Confirmar cita'}
              </SubmitButton>
            </Form>
          </>
        )}
      </FormCard>
    </PageWrapper>
  );
}

export default BookingForm;

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme, fadeInUp } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

/* ─── Animations ─────────────────────────────────────────── */
const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(153,101,21,0.25), 0 0 20px rgba(153,101,21,0.1); }
  50%       { box-shadow: 0 0 20px rgba(201,148,42,0.5), 0 0 40px rgba(153,101,21,0.25); }
`;

const checkmark = keyframes`
  0%   { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
`;

/* ─── Page wrapper ───────────────────────────────────────── */
const PageWrapper = styled.div`
  min-height: 80vh;
  background: linear-gradient(160deg, #e8d5a3 0%, #d4b97a 40%, #e0c990 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
`;

/* ─── Glass card ─────────────────────────────────────────── */
const FormCard = styled.div`
  width: 100%;
  max-width: 760px;
  background: rgba(255, 248, 230, 0.92);
  backdrop-filter: blur(24px);
  border-radius: ${theme.borderRadius.large};
  border: 1px solid rgba(153, 101, 21, 0.4);
  box-shadow:
    0 0 0 1px rgba(201, 148, 42, 0.18),
    0 32px 80px rgba(120, 75, 10, 0.25),
    inset 0 1px 0 rgba(201, 148, 42, 0.25);
  padding: 3rem 3.5rem;
  animation: ${fadeInUp} 0.65s ease-out, ${glowPulse} 5s ease-in-out infinite;

  @media (max-width: 600px) {
    padding: 2rem 1.5rem;
  }
`;

/* ─── Header ─────────────────────────────────────────────── */
const Badge = styled.span`
  display: block;
  text-align: center;
  font-family: ${theme.fonts.secondary};
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  background: linear-gradient(90deg,
    ${theme.colors.primary} 0%,
    ${theme.colors.navbarLinkHover} 40%,
    #fff 60%,
    ${theme.colors.navbarLinkHover} 80%,
    ${theme.colors.primary} 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 4s linear infinite;
  margin-bottom: 0.6rem;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 2.8rem;
  font-weight: 600;
  color: ${theme.colors.primaryDark};
  margin-bottom: 0.4rem;
  letter-spacing: 0.5px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: rgba(100, 70, 20, 0.65);
  font-size: 1.15rem;
  margin-bottom: 2.5rem;
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,148,42,0.5), transparent);
  margin-bottom: 2.5rem;
`;

/* ─── Form grid ──────────────────────────────────────────── */
const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  grid-column: ${props => props.$fullWidth ? '1 / span 2' : 'auto'};

  @media (max-width: 600px) {
    grid-column: auto;
  }
`;

const Label = styled.label`
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${theme.colors.primary};
`;

/* Shared input styles */
const inputBase = `
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(153, 101, 21, 0.4);
  background: rgba(255, 242, 200, 0.55);
  color: #3a2808;
  font-size: 1.1rem;
  font-family: inherit;
  transition: all 0.25s ease;
  outline: none;

  &::placeholder {
    color: rgba(100, 70, 20, 0.45);
  }

  &:focus {
    border-color: ${theme.colors.accent};
    background: rgba(255, 242, 200, 0.8);
    box-shadow: 0 0 0 3px rgba(153, 101, 21, 0.2), 0 0 18px rgba(201, 148, 42, 0.15);
  }
`;

const Input = styled.input`
  ${inputBase}
  border-color: ${props => props.$error ? theme.colors.danger : 'rgba(153,101,21,0.25)'};

  &::-webkit-calendar-picker-indicator {
    filter: invert(0.7) sepia(1) saturate(3) hue-rotate(10deg);
    cursor: pointer;
  }
`;

const Select = styled.select`
  ${inputBase}
  border-color: ${props => props.$error ? theme.colors.danger : 'rgba(153,101,21,0.25)'};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23c9942a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.1rem;
  cursor: pointer;

  option {
    background: #f5e9c0;
    color: #3a2808;
  }
`;

const Textarea = styled.textarea`
  ${inputBase}
  min-height: 100px;
  resize: vertical;
`;

const ErrorMessage = styled.span`
  color: ${theme.colors.danger};
  font-size: 0.8rem;
  padding-left: 0.25rem;
`;

/* ─── Submit button ──────────────────────────────────────── */
const SubmitButton = styled.button`
  grid-column: 1 / span 2;
  margin-top: 0.5rem;
  padding: 1.1rem;
  background: linear-gradient(135deg, ${theme.colors.primaryDark} 0%, ${theme.colors.accent} 50%, ${theme.colors.navbarLinkHover} 100%);
  background-size: 200% auto;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(153,101,21,0.35);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }

  &:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(201,148,42,0.5);

    &::before { transform: translateX(100%); }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    grid-column: auto;
  }
`;

/* ─── Success screen ─────────────────────────────────────── */
const SuccessWrapper = styled.div`
  text-align: center;
  animation: ${fadeInUp} 0.5s ease;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primaryDark}, ${theme.colors.accent});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 30px rgba(201,148,42,0.4);
  font-size: 2.2rem;
`;

const SuccessTitle = styled.h3`
  font-size: 2.8rem;
  color: ${theme.colors.navbarLinkHover};
  margin-bottom: 1.25rem;
`;

const SuccessDetail = styled.p`
  color: rgba(80, 50, 10, 0.75);
  font-size: 1.15rem;
  line-height: 1.8;
  margin-bottom: 0.75rem;

  strong {
    color: ${theme.colors.primaryDark};
  }
`;

const BackButton = styled.button`
  margin-top: 1.75rem;
  background: transparent;
  border: 1px solid rgba(153,101,21,0.5);
  color: ${theme.colors.primary};
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${theme.colors.primary};
    color: #fff;
    box-shadow: 0 4px 20px rgba(153,101,21,0.35);
  }
`;

/* ─── Data ───────────────────────────────────────────────── */
const SERVICES = [
  'Manicura Clásica',
  'Tintura',
  'Tratamiento Capilar',
  'Corte de Cabello',
  'Peinado de Evento',
  'Masaje Relajante',
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM',
];

/* ─── Component ──────────────────────────────────────────── */
function BookingForm() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ service: '', date: '', time: '', notes: '' });
  const [errors, setErrors]     = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);

  const validate = () => {
    const e = {};
    if (!formData.service) e.service = 'Selecciona un servicio';
    if (!formData.date)    e.date    = 'La fecha es requerida';
    else if (formData.date < today) e.date = 'La fecha no puede ser en el pasado';
    if (!formData.time)    e.time    = 'Selecciona una hora';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const { [name]: _, ...rest } = prev; return rest; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <PageWrapper>
      <FormCard>
        {isSuccess ? (
          <SuccessWrapper>
            <SuccessIcon>✨</SuccessIcon>
            <SuccessTitle>¡Cita Agendada!</SuccessTitle>
            <SuccessDetail>
              Gracias, <strong>{user?.fullName || 'Cliente'}</strong>. Hemos recibido tu solicitud para&nbsp;
              <strong>{formData.service}</strong> el día <strong>{formData.date}</strong> a las <strong>{formData.time}</strong>.
            </SuccessDetail>
            <SuccessDetail>
              Te enviaremos una confirmación a <strong>{user?.email}</strong>.
            </SuccessDetail>
            <BackButton onClick={() => window.history.back()}>Volver</BackButton>
          </SuccessWrapper>
        ) : (
          <>
            <Badge>Essence De Toi · Reservas</Badge>
            <Title>Agendar una Cita</Title>
            <Subtitle>Reserva tu momento de bienestar en pocos pasos</Subtitle>
            <Divider />

            <Form onSubmit={handleSubmit} noValidate>
              {/* Servicio */}
              <FormGroup $fullWidth>
                <Label htmlFor="service">Servicio</Label>
                <Select
                  id="service" name="service"
                  value={formData.service} onChange={handleChange}
                  $error={errors.service}
                >
                  <option value="">Selecciona un servicio...</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                {errors.service && <ErrorMessage>{errors.service}</ErrorMessage>}
              </FormGroup>

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
                >
                  <option value="">Selecciona una hora...</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                {errors.time && <ErrorMessage>{errors.time}</ErrorMessage>}
              </FormGroup>

              {/* Notas */}
              <FormGroup $fullWidth>
                <Label htmlFor="notes">Notas adicionales <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></Label>
                <Textarea
                  id="notes" name="notes"
                  placeholder="Escribe aquí cualquier preferencia especial..."
                  value={formData.notes} onChange={handleChange}
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Agendando…' : 'Confirmar Cita'}
              </SubmitButton>
            </Form>
          </>
        )}
      </FormCard>
    </PageWrapper>
  );
}

export default BookingForm;

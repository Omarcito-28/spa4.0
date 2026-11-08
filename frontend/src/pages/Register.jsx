import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme, fadeInUp } from '../styles/theme';
import { useAuth } from '../contexts/auth';
import { control } from '../components/ManagementUI';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { pathAfterLogin } from '../utils/sessionRedirect';

/* ─── Layout ─────────────────────────────────────────────── */
// Tarjeta blanca y sobria, como el formulario de reservas: el dorado solo como acento.
const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 3.5rem 1.5rem 4rem;
  background: linear-gradient(135deg, #faf7f2 0%, #fff9f0 100%);

  @media (max-width: 600px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  height: fit-content;
  padding: 2.5rem 2.5rem 2.25rem;
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
  margin-bottom: 1.75rem;
  text-align: center;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  box-shadow: 0 4px 14px rgba(153, 101, 21, 0.28);
  color: white;
  font-size: 1.5rem;
`;

const Title = styled.h1`
  margin-bottom: 0.35rem;
  color: ${theme.colors.text};
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: 1.1rem;
`;

const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  padding: 0.85rem 1rem;
  border-left: 4px solid #b93224;
  border-radius: 10px;
  background: #fbe3e0;
  color: #8c2318;
  font-size: 1.02rem;

  i {
    margin-top: 0.2rem;
  }
`;

// "o regístrate con tu correo" entre el botón de Google y el formulario.
const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin: 0.25rem 0 1.5rem;
  color: ${theme.colors.textMuted};
  font-size: 0.98rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee8dc;
  }
`;

/* ─── Form ───────────────────────────────────────────────── */
// minmax(0, 1fr): sin el 0, cada input conserva su ancho mínimo y la columna
// derecha se sale de la tarjeta.
const Form = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.15rem 1rem;

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  grid-column: ${props => (props.$full ? '1 / -1' : 'auto')};
`;

const Label = styled.label`
  color: ${theme.colors.text};
  font-size: 1rem;
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

// Campo de contraseña con el botón para mostrarla dentro del borde.
const PasswordBox = styled.div`
  position: relative;

  ${Input} {
    padding-right: 2.9rem;
  }

  button {
    position: absolute;
    top: 50%;
    right: 0.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: none;
    color: ${theme.colors.textMuted};
    transform: translateY(-50%);

    &:hover {
      background: #f6efe2;
      color: ${theme.colors.primaryDark};
    }
  }
`;

const Hint = styled.small`
  color: ${theme.colors.textMuted};
  font-size: 0.9rem;
`;

const ErrorText = styled.span`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #b93224;
  font-size: 0.92rem;
`;

const SubmitButton = styled.button`
  grid-column: 1 / -1;
  margin-top: 0.4rem;
  padding: 0.95rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  box-shadow: 0 4px 14px rgba(153, 101, 21, 0.25);
  color: white;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}, filter ${theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(153, 101, 21, 0.32);
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Footer = styled.p`
  margin: 1.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid #eee8dc;
  color: ${theme.colors.textMuted};
  font-size: 1.05rem;
  text-align: center;

  a {
    color: ${theme.colors.primary};
    font-weight: 700;
  }
`;

function FieldError({ id, children }) {
  if (!children) return null;
  return <ErrorText id={id}><i className="fas fa-exclamation-circle" aria-hidden="true"></i>{children}</ErrorText>;
}

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  // Con Google no hace falta llenar el formulario: la cuenta se crea con el nombre
  // y el correo de Google, y si el correo ya tenía cuenta se vincula a ella.
  const handleGoogle = async credential => {
    setErrors({});
    setLoading(true);
    const result = await loginWithGoogle(credential);
    setLoading(false);
    if (!result.success) {
      setErrors({ general: result.error });
      return;
    }
    const to = pathAfterLogin(result.user, { isNewUser: result.isNewUser });
    navigate(to, result.isNewUser && to === '/profile' ? { state: { welcome: 'google' } } : undefined);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debe confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        role: 'CLIENT',
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: result.error || 'Error al registrar usuario.' });
      }
    } catch {
      setErrors({ general: 'Error al registrar usuario. Por favor, intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Props comunes de cada campo: valor, error y su mensaje asociado.
  const field = name => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    $error: Boolean(errors[name]),
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <PageWrapper>
      <Card>
        <Header>
          <Icon><i className="fas fa-user-plus" aria-hidden="true"></i></Icon>
          <Title>Crea tu cuenta</Title>
          <Subtitle>Reserva y gestiona tus citas en Essence De Toi.</Subtitle>
        </Header>

        {errors.general && <Alert role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true"></i>{errors.general}</Alert>}

        <GoogleSignInButton
          onCredential={handleGoogle}
          text="signup_with"
          disabled={loading}
          after={<Divider>o regístrate con tu correo</Divider>}
        />

        <Form onSubmit={handleSubmit}>
          <FormGroup $full>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input {...field('fullName')} type="text" placeholder="Ej.: Ana Pérez" autoComplete="name" required />
            <FieldError id="fullName-error">{errors.fullName}</FieldError>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="username">Usuario</Label>
            <Input {...field('username')} type="text" placeholder="Ej.: ana.perez" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
            <FieldError id="username-error">{errors.username}</FieldError>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="phoneNumber">Teléfono <span>(opcional)</span></Label>
            <Input {...field('phoneNumber')} type="tel" placeholder="+57 300 000 0000" autoComplete="tel" />
          </FormGroup>

          <FormGroup $full>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input {...field('email')} type="email" placeholder="correo@ejemplo.com" autoComplete="email" required />
            <FieldError id="email-error">{errors.email}</FieldError>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <PasswordBox>
              <Input {...field('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required />
              <button
                type="button"
                onClick={() => setShowPassword(current => !current)}
                aria-label={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                aria-pressed={showPassword}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
              </button>
            </PasswordBox>
            {errors.password ? <FieldError id="password-error">{errors.password}</FieldError> : <Hint>Mínimo 8 caracteres.</Hint>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input {...field('confirmPassword')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required />
            <FieldError id="confirmPassword-error">{errors.confirmPassword}</FieldError>
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" aria-hidden="true" style={{ marginRight: 8 }}></i>Procesando...</>
              : 'Crear cuenta'}
          </SubmitButton>
        </Form>

        <Footer>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </Footer>
      </Card>
    </PageWrapper>
  );
}

export default Register;

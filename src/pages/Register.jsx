import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: linear-gradient(135deg, #FAF7F2 0%, #FFF9F0 100%);
`;

const RegisterContainer = styled.div`
  width: 100%;
  max-width: 550px;
  padding: 3.5rem;
  background: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  border: 1px solid rgba(0, 0, 0, 0.04);
  animation: ${slideUp} 0.5s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent}, ${theme.colors.primary});
  }
`;

const LogoArea = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 15px rgba(153, 101, 21, 0.3);

  i {
    color: white;
    font-size: 2rem;
  }
`;

const Title = styled.h2`
  text-align: center;
  color: ${theme.colors.text};
  font-size: 2.8rem;
  margin-bottom: 0.25rem;
  font-family: ${theme.fonts.primary};
`;

const TitleSub = styled.p`
  text-align: center;
  color: ${theme.colors.textMuted};
  font-size: 1.25rem;
`;

const Alert = styled.div`
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  border-radius: ${theme.borderRadius.small};
  font-size: 1.15rem;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #c0392b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${theme.colors.textLight};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 0.85rem 1.1rem;
  border: 1.5px solid ${props => props.$error ? 'rgba(231, 76, 60, 0.5)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: ${theme.borderRadius.small};
  background: #FAFAFA;
  color: ${theme.colors.text};
  font-family: ${theme.fonts.secondary};
  font-size: 1.2rem;
  transition: all ${theme.transitions.normal};

  &:focus {
    outline: none;
    border-color: ${props => props.$error ? '#e74c3c' : theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.$error ? 'rgba(231, 76, 60, 0.1)' : 'rgba(153, 101, 21, 0.1)'};
    background: white;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const ErrorText = styled.span`
  color: #e74c3c;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  padding: 1rem;
  border: none;
  border-radius: ${theme.borderRadius.small};
  font-weight: 600;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  margin-top: 0.5rem;
  box-shadow: 0 4px 15px rgba(153, 101, 21, 0.25);
  letter-spacing: 0.3px;

  &:hover {
    box-shadow: 0 6px 25px rgba(153, 101, 21, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.25rem 0;
  gap: 1rem;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
  }

  span {
    font-size: 1.1rem;
    color: ${theme.colors.textMuted};
  }
`;

const LoginLink = styled.p`
  text-align: center;
  margin-top: 0.25rem;
  font-size: 1.25rem;
  color: ${theme.colors.textMuted};
`;

const StyledLink = styled(Link)`
  color: ${theme.colors.primary};
  text-decoration: none;
  font-weight: 600;

  &:hover {
    color: ${theme.colors.accent};
    text-decoration: underline;
  }
`;

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
  const navigate = useNavigate();
  const { register } = useAuth();

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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
        role: 'CLIENT',
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: result.error || 'Error al registrar usuario.' });
      }
    } catch (err) {
      setErrors({ general: 'Error al registrar usuario. Por favor, intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <RegisterContainer>
        <LogoArea>
          <LogoIcon><i className="fas fa-user-plus"></i></LogoIcon>
          <Title>Crear una Cuenta</Title>
          <TitleSub>Únete a Essence De Toi</TitleSub>
        </LogoArea>
        
        {errors.general && <Alert><i className="fas fa-exclamation-circle"></i>{errors.general}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Tu usuario"
                value={formData.username}
                onChange={handleChange}
                $error={!!errors.username}
                required
              />
              {errors.username && <ErrorText><i className="fas fa-exclamation-circle"></i>{errors.username}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Tu nombre"
                value={formData.fullName}
                onChange={handleChange}
                $error={!!errors.fullName}
                required
              />
              {errors.fullName && <ErrorText><i className="fas fa-exclamation-circle"></i>{errors.fullName}</ErrorText>}
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              $error={!!errors.email}
              required
            />
            {errors.email && <ErrorText><i className="fas fa-exclamation-circle"></i>{errors.email}</ErrorText>}
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                $error={!!errors.password}
                required
              />
              {errors.password && <ErrorText><i className="fas fa-exclamation-circle"></i>{errors.password}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirmar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                $error={!!errors.confirmPassword}
                required
              />
              {errors.confirmPassword && <ErrorText><i className="fas fa-exclamation-circle"></i>{errors.confirmPassword}</ErrorText>}
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="phoneNumber">Teléfono (Opcional)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              placeholder="+57 300 000 0000"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Procesando...</>
            ) : (
              'Crear Cuenta'
            )}
          </SubmitButton>
        </Form>

        <Divider><span>o</span></Divider>
        
        <LoginLink>
          ¿Ya tienes cuenta? <StyledLink to="/login">Inicia sesión aquí</StyledLink>
        </LoginLink>
      </RegisterContainer>
    </PageWrapper>
  );
}

export default Register;

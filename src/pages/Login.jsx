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

const LoginContainer = styled.div`
  width: 100%;
  max-width: 480px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => props.$type === 'error' && `
    background: rgba(231, 76, 60, 0.08);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: #c0392b;
  `}
  ${props => props.$type === 'success' && `
    background: rgba(39, 174, 96, 0.08);
    border: 1px solid rgba(39, 174, 96, 0.2);
    color: #27ae60;
  `}
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.small};
  background: #FAFAFA;
  color: ${theme.colors.text};
  font-family: ${theme.fonts.secondary};
  font-size: 1.2rem;
  transition: all ${theme.transitions.normal};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(153, 101, 21, 0.1);
    background: white;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
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

const RegisterLink = styled.p`
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

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        setSuccess('Has iniciado sesión correctamente');
        setTimeout(() => {
          // Redirigir según el rol
          if (result.user.role === 'ADMIN') {
            navigate('/admin/dashboard');
          } else if (result.user.role === 'STYLIST') {
            navigate('/stylist/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setError(result.error || 'Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <LoginContainer>
        <LogoArea>
          <LogoIcon><i className="fas fa-spa"></i></LogoIcon>
          <Title>Bienvenido de vuelta</Title>
          <TitleSub>Inicia sesión en tu cuenta</TitleSub>
        </LogoArea>
        
        {error && <Alert $type="error"><i className="fas fa-exclamation-circle"></i>{error}</Alert>}
        {success && <Alert $type="success"><i className="fas fa-check-circle"></i>{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Usuario o Email</Label>
            <Input
              id="username"
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Procesando...</>
            ) : (
              'Iniciar Sesión'
            )}
          </SubmitButton>
        </Form>

        <Divider><span>o</span></Divider>
        
        <RegisterLink>
          ¿No tienes cuenta? <StyledLink to="/register">Regístrate aquí</StyledLink>
        </RegisterLink>
      </LoginContainer>
    </PageWrapper>
  );
}

export default Login;

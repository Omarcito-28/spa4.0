import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  animation: ${slideUp} 0.5s ease-out;
`;

const Title = styled.h1`
  color: ${theme.colors.text};
  margin-bottom: 0.25rem;
  font-size: 2.8rem;
`;

const Subtitle = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 1.15rem;
  margin-bottom: 2rem;
`;

const WelcomeCard = styled.div`
  background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
  padding: 2rem 2.5rem;
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  margin-bottom: 2.5rem;
  color: white;
  position: relative;
  overflow: hidden;
  border-left: 4px solid ${theme.colors.accent};

  &::after {
    content: '✂';
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 3.5rem;
    opacity: 0.1;
  }

  h2 {
    color: ${theme.colors.navbarLinkHover};
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
  }

  p {
    opacity: 0.7;
    font-size: 1.15rem;
    margin-bottom: 0.25rem;
  }

  strong {
    color: ${theme.colors.navbarLinkHover};
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
`;

const Card = styled(Link)`
  background: ${theme.colors.cardBg};
  padding: 2rem;
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  transition: all ${theme.transitions.normal};
  border: 1px solid rgba(0, 0, 0, 0.04);
  text-decoration: none;
  display: block;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent});
    transform: scaleX(0);
    transition: transform ${theme.transitions.normal};
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${theme.shadows.cardHover};
    text-decoration: none;

    &::before {
      transform: scaleX(1);
    }
  }
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(153, 101, 21, 0.1), rgba(201, 148, 42, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: ${theme.colors.primary};
  font-size: 1.1rem;
  transition: all ${theme.transitions.normal};

  ${Card}:hover & {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    color: white;
    box-shadow: 0 4px 12px rgba(153, 101, 21, 0.3);
  }
`;

const CardTitle = styled.h3`
  color: ${theme.colors.text};
  margin-bottom: 0.5rem;
  font-size: 1.35rem;
  font-family: ${theme.fonts.secondary};
  font-weight: 600;
`;

const CardText = styled.p`
  color: ${theme.colors.textMuted};
  line-height: 1.6;
  font-size: 1.1rem;
`;

function StylistDashboard({ user }) {
  return (
    <DashboardContainer>
      <Title>Dashboard de Estilista</Title>
      <Subtitle>Gestiona tus citas y horarios de atención</Subtitle>
      
      <WelcomeCard>
        <h2>Hola, {user?.fullName || user?.username} ✨</h2>
        <p>Conectado como <strong>ESTILISTA</strong></p>
        <p>Gestiona tus citas y horarios de atención desde aquí.</p>
      </WelcomeCard>

      <CardGrid>
        <Card to="/stylist/appointments">
          <CardIcon><i className="fas fa-calendar-check"></i></CardIcon>
          <CardTitle>Mis Citas</CardTitle>
          <CardText>Ver y gestionar tus citas programadas</CardText>
        </Card>
        
        <Card to="/stylist/schedule">
          <CardIcon><i className="fas fa-clock"></i></CardIcon>
          <CardTitle>Mi Horario</CardTitle>
          <CardText>Configura tu disponibilidad y horarios de trabajo</CardText>
        </Card>
        
        <Card to="/stylist/appointments">
          <CardIcon><i className="fas fa-history"></i></CardIcon>
          <CardTitle>Historial de Citas</CardTitle>
          <CardText>Revisa tus citas anteriores</CardText>
        </Card>
        
        <Card to="/profile">
          <CardIcon><i className="fas fa-id-badge"></i></CardIcon>
          <CardTitle>Mi Perfil</CardTitle>
          <CardText>Actualiza tu información profesional</CardText>
        </Card>
      </CardGrid>
    </DashboardContainer>
  );
}

export default StylistDashboard;

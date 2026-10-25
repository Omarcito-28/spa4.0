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
  border-left: 4px solid ${theme.colors.primary};

  &::after {
    content: '⚙';
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

function AdminDashboard({ user }) {
  return (
    <DashboardContainer>
      <Title>Panel de Administración</Title>
      <Subtitle>Gestiona usuarios, servicios y citas del sistema</Subtitle>
      
      <WelcomeCard>
        <h2>Bienvenido, {user?.fullName || user?.username}</h2>
        <p>Conectado como <strong>ADMINISTRADOR</strong></p>
        <p>Gestiona todos los aspectos del sistema desde aquí.</p>
      </WelcomeCard>

      <CardGrid>
        <Card to="/admin/users">
          <CardIcon><i className="fas fa-users-cog"></i></CardIcon>
          <CardTitle>Gestionar Usuarios</CardTitle>
          <CardText>Administra clientes, estilistas y administradores</CardText>
        </Card>
        
        <Card to="/admin/services">
          <CardIcon><i className="fas fa-concierge-bell"></i></CardIcon>
          <CardTitle>Gestionar Servicios</CardTitle>
          <CardText>Agrega, edita o elimina servicios disponibles</CardText>
        </Card>
        
        <Card to="/appointments/all">
          <CardIcon><i className="fas fa-calendar-alt"></i></CardIcon>
          <CardTitle>Todas las Citas</CardTitle>
          <CardText>Visualiza y gestiona todas las citas programadas</CardText>
        </Card>
        
        <Card to="/admin/reports">
          <CardIcon><i className="fas fa-chart-line"></i></CardIcon>
          <CardTitle>Reportes</CardTitle>
          <CardText>Genera reportes de estadísticas y métricas</CardText>
        </Card>
      </CardGrid>
    </DashboardContainer>
  );
}

export default AdminDashboard;

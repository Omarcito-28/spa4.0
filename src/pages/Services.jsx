import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme, fadeInUp } from '../styles/theme';
import { apiGetServices } from '../services/api';

const ServicesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Badge = styled.span`
  display: inline-block;
  color: ${theme.colors.primary};
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  font-family: ${theme.fonts.secondary};
`;

const Title = styled.h1`
  color: ${theme.colors.text};
  margin-bottom: 0.75rem;
  font-size: 3.25rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 1.4rem;
  max-width: 500px;
  margin: 0 auto;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ServiceCard = styled.div`
  background: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  overflow: hidden;
  transition: all ${theme.transitions.normal};
  border: 1px solid rgba(0, 0, 0, 0.04);
  animation: ${fadeInUp} 0.6s ease-out both;
  animation-delay: ${props => props.$delay || '0s'};

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${theme.shadows.cardHover};

    img, .img-placeholder {
      transform: scale(1.08);
    }
  }
`;

const ImageWrapper = styled.div`
  height: 220px;
  overflow: hidden;
  position: relative;
`;

const ServiceImage = styled.div`
  height: 100%;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-image: ${props => props.$image ? `url(${props.$image})` : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`};
  transition: transform 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3.5rem;
`;

const PriceTag = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(8px);
  color: ${theme.colors.navbarLinkHover};
  padding: 0.35rem 1rem;
  border-radius: ${theme.borderRadius.pill};
  font-weight: 700;
  font-size: 1.2rem;
  border: 1px solid rgba(153, 101, 21, 0.2);
`;

const ServiceContent = styled.div`
  padding: 1.5rem 1.75rem 1.75rem;
`;

const ServiceName = styled.h3`
  color: ${theme.colors.text};
  margin-bottom: 0.5rem;
  font-size: 1.6rem;
  font-family: ${theme.fonts.secondary};
  font-weight: 600;
`;

const ServiceDescription = styled.p`
  color: ${theme.colors.textMuted};
  line-height: 1.6;
  font-size: 1.25rem;
`;

const NoServices = styled.div`
  text-align: center;
  padding: 3rem;
  background: ${theme.colors.contentBgLight};
  border-radius: ${theme.borderRadius.medium};
  color: ${theme.colors.textMuted};
`;


// Spinner de carga
const LoadingWrapper = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  color: ${theme.colors.textMuted};
  font-size: 1.3rem;

  i {
    font-size: 2.5rem;
    color: ${theme.colors.primary};
    margin-bottom: 1rem;
    display: block;
  }
`;

const ErrorWrapper = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(231, 76, 60, 0.06);
  border-radius: ${theme.borderRadius.medium};
  color: #c0392b;
  font-size: 1.2rem;
  border: 1px solid rgba(231, 76, 60, 0.2);

  i { margin-right: 0.5rem; }
`;

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetServices()
      .then((data) => setServices(data))
      .catch(() => setError('No se pudieron cargar los servicios. Verifica que el servidor esté activo.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ServicesContainer>
      <Header>
        <Badge>Catálogo</Badge>
        <Title>Nuestros Servicios</Title>
        <Subtitle>Descubre todos los tratamientos que tenemos para ti</Subtitle>
      </Header>

      {loading && (
        <LoadingWrapper>
          <i className="fas fa-spinner fa-spin" />
          Cargando servicios...
        </LoadingWrapper>
      )}

      {error && (
        <ErrorWrapper>
          <i className="fas fa-exclamation-circle" />
          {error}
        </ErrorWrapper>
      )}

      {!loading && !error && services.length === 0 && (
        <NoServices>
          Actualmente no hay servicios para mostrar. ¡Vuelve pronto!
        </NoServices>
      )}

      {!loading && !error && services.length > 0 && (
        <ServicesGrid>
          {services.map((service, index) => (
            <ServiceCard key={service._id} $delay={`${index * 0.1}s`}>
              <ImageWrapper>
                <ServiceImage $image={service.image}>
                  {!service.image && '💆'}
                </ServiceImage>
                <PriceTag>{service.price}</PriceTag>
              </ImageWrapper>
              <ServiceContent>
                <ServiceName>{service.name}</ServiceName>
                <ServiceDescription>{service.description}</ServiceDescription>
              </ServiceContent>
            </ServiceCard>
          ))}
        </ServicesGrid>
      )}
    </ServicesContainer>
  );
}

export default Services;


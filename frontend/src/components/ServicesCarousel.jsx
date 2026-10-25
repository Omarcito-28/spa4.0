import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;      
  height: 400px;
  overflow: hidden;
`;

const CarouselSlide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => props.$active ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
`;

const ContentWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  text-align: center;
  z-index: 3;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }

  h5 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: rgba(245, 245, 245, 0.753);
    font-weight: bold;
    position: relative;
    z-index: 1;
  }

  p {
    font-size: 1.3rem;
    line-height: 1.8;
    color: white;
    font-weight: 500;
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  a {
    font-size: 1.1rem;
    padding: 1rem 2rem;
    margin-top: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: ${theme.colors.primary};
    color: white;
    border-radius: 5px;
    transition: all 0.3s ease;
    text-decoration: none;
    position: relative;
    z-index: 1;

    &:hover {
      background: ${theme.colors.accent};
      filter: brightness(1.1);
      transform: translateY(-2px);
    }
  }
`;

const CarouselButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  background: ${theme.colors.navbarBg};
  border-radius: 100px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
  }

  ${props => props.$direction === 'prev' ? 'left: 20px;' : 'right: 20px;'}
`;

const CarouselIcon = styled.span`
  width: 40px;
  height: 40px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const Indicators = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 4;
`;

const Indicator = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: white;
  }
`;

const services = [
  {
    id: 1,
    name: 'Manicura Clásica',
    description: 'Cuidado completo de uñas con esmalte de alta calidad',
    image: '/images/services/manicura_clasica.jpg'
  },
  {
    id: 2,
    name: 'Tintura',
    description: 'Coloración profesional con productos premium',
    image: '/images/services/tintura.webp'
  },
  {
    id: 3,
    name: 'Ver Todos',
    description: '',
    image: '/images/services/tratamiento_capilar.webp',
    isButton: true
  }
];

function ServicesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <CarouselContainer>
      {services.map((service, index) => (
        <CarouselSlide key={service.id} $active={index === currentSlide}>
          <ContentWrapper style={{ backgroundImage: `url(${service.image})` }}>
            {service.isButton ? (
              <Link to="/services">Ver Todos los Servicios</Link>
            ) : (
              <>
                <h5>{service.name}</h5>
                <p>{service.description}</p>
              </>
            )}
          </ContentWrapper>
        </CarouselSlide>
      ))}

      <CarouselButton $direction="prev" onClick={prevSlide} aria-label="Anterior">
        <CarouselIcon>‹</CarouselIcon>
      </CarouselButton>

      <CarouselButton $direction="next" onClick={nextSlide} aria-label="Siguiente">
        <CarouselIcon>›</CarouselIcon>
      </CarouselButton>

      <Indicators>
        {services.map((_, index) => (
          <Indicator
            key={index}
            $active={index === currentSlide}
            onClick={() => goToSlide(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </Indicators>
    </CarouselContainer>
  );
}

export default ServicesCarousel;

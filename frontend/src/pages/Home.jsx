import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

const heroImages = [
  '/images/services/corte_dama.jpg',
  '/images/services/tintura.webp',
  '/images/services/tratamiento_capilar.webp',
];

/* ─── ANIMATIONS ─── */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ─── HERO SECTION ─── */
const HeroSection = styled.div`
  width: 100%;
  min-height: 600px;
  padding: 7rem 1.5rem;
  position: relative;
  overflow: hidden;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    min-height: 480px;
    padding: 5rem 1rem;
  }
`;

const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${props => props.$src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${props => props.$active ? 1 : 0};
  transition: opacity 1.5s ease-in-out;
  z-index: 0;
  transform: ${props => props.$active ? 'scale(1.02)' : 'scale(1)'};
  transition: opacity 1.5s ease-in-out, transform 8s ease-out;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      160deg,
      rgba(10, 10, 10, 0.7) 0%,
      rgba(10, 10, 10, 0.4) 40%,
      rgba(10, 10, 10, 0.6) 100%
    );
  }
`;

const HeroContent = styled.div`
  max-width: 750px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 2;
  animation: ${slideUp} 1s ease-out;
`;

const HeroBadge = styled.span`
  display: inline-block;
  background: rgba(153, 101, 21, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(153, 101, 21, 0.3);
  color: ${theme.colors.navbarLinkHover};
  padding: 0.4rem 1.25rem;
  border-radius: ${theme.borderRadius.pill};
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  font-family: ${theme.fonts.secondary};
`;

const HeroTitle = styled.h1`
  font-size: 5.5rem;
  margin-bottom: 1.25rem;
  color: white;
  letter-spacing: -0.5px;
  font-weight: 700;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
  line-height: 1.15;

  span {
    color: ${theme.colors.navbarLinkHover};
    font-style: italic;
  }

  @media (max-width: 768px) {
    font-size: 3.25rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.65rem;
  max-width: 550px;
  margin: 0 auto 2.5rem;
  line-height: 1.8;
  opacity: 0.9;
  font-weight: 300;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
`;

const HeroIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 2.5rem;
`;

const HeroIndicator = styled.button`
  width: ${props => props.$active ? '28px' : '10px'};
  height: 10px;
  border-radius: 5px;
  border: none;
  background: ${props => props.$active ? theme.colors.navbarLinkHover : 'rgba(255,255,255,0.35)'};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.7);
  }
`;

/* ─── BUTTONS ─── */
const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  padding: 1rem 2.5rem;
  border-radius: ${theme.borderRadius.pill};
  font-weight: 600;
  text-decoration: none;
  transition: all ${theme.transitions.normal};
  border: none;
  cursor: pointer;
  font-size: 1.35rem;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 15px rgba(153, 101, 21, 0.35);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(153, 101, 21, 0.5);
    text-decoration: none;
    color: white;

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled(Link)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: ${theme.borderRadius.pill};
  font-weight: 600;
  text-decoration: none;
  transition: all ${theme.transitions.normal};
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  font-size: 1.35rem;
  letter-spacing: 0.3px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-3px);
    text-decoration: none;
    color: white;
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
  }
`;

/* ─── SECTIONS ─── */
const Section = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionBadge = styled.span`
  display: inline-block;
  color: ${theme.colors.primary};
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  font-family: ${theme.fonts.secondary};
`;

const SectionTitle = styled.h2`
  font-size: 3.2rem;
  color: ${theme.colors.text};
  margin-bottom: 0.75rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 2.4rem;
  }
`;

const SectionSubtitle = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 1.5rem;
  max-width: 550px;
  margin: 0 auto;
  line-height: 1.7;
`;

/* ─── FEATURE CARDS ─── */
const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.medium};
  padding: 2.5rem 2rem;
  text-align: center;
  transition: all ${theme.transitions.normal};
  border: 2px solid rgba(153, 101, 21, 0.4);
  box-shadow: ${theme.shadows.small};
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
    transform: translateY(-8px);
    box-shadow: ${theme.shadows.cardHover};
    border-color: rgba(153, 101, 21, 0.7);

    &::before {
      transform: scaleX(1);
    }
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(153, 101, 21, 0.1), rgba(201, 148, 42, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  font-size: 1.4rem;
  color: ${theme.colors.primary};
  transition: all ${theme.transitions.normal};

  ${FeatureCard}:hover & {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(153, 101, 21, 0.3);
  }
`;

const FeatureTitle = styled.h3`
  color: ${theme.colors.text};
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
  font-family: ${theme.fonts.secondary};
  font-weight: 600;
`;

const FeatureText = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 1.35rem;
  line-height: 1.7;
`;

/* ─── CTA CARDS ─── */
const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  padding: 2.5rem;
  border-radius: ${theme.borderRadius.medium};
  transition: all ${theme.transitions.normal};
  position: relative;
  overflow: hidden;
`;

const DarkCard = styled(Card)`
  background: linear-gradient(145deg, #111111, #0a0a0a);
  color: white;
  box-shadow: ${theme.shadows.large};
  border: 2px solid rgba(153, 101, 21, 0.45);

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${theme.shadows.xl};
    border-color: rgba(153, 101, 21, 0.75);
  }
`;

const LightCard = styled(Card)`
  background: ${theme.colors.cardBg};
  border: 2px solid rgba(153, 101, 21, 0.35);
  box-shadow: ${theme.shadows.medium};

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${theme.shadows.cardHover};
    border-color: rgba(153, 101, 21, 0.65);
  }
`;

const CardTitle = styled.h3`
  color: ${props => props.$isDark ? theme.colors.navbarLinkHover : theme.colors.primary};
  margin-bottom: 1rem;
  font-size: 2rem;
`;

const CardText = styled.p`
  line-height: 1.7;
  margin-bottom: 1.75rem;
  color: ${props => props.$isDark ? 'rgba(255,255,255,0.7)' : theme.colors.textLight};
  font-size: 1.35rem;
`;

const OutlineButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border: 2px solid ${props => props.$isDark ? 'rgba(255,255,255,0.3)' : theme.colors.primary};
  color: ${props => props.$isDark ? 'white' : theme.colors.primary};
  border-radius: ${theme.borderRadius.pill};
  text-decoration: none;
  transition: all ${theme.transitions.normal};
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.3px;

  &:hover {
    background: ${props => props.$isDark
    ? 'linear-gradient(135deg, ' + theme.colors.primary + ', ' + theme.colors.accent + ')'
    : 'linear-gradient(135deg, ' + theme.colors.primary + ', ' + theme.colors.accent + ')'};
    color: white;
    border-color: transparent;
    text-decoration: none;
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(153, 101, 21, 0.3);
  }
`;

/* ─── CONTACT SECTION ─── */
const ContactWrapper = styled.div`
  background: linear-gradient(145deg, #111111, #0a0a0a);
  border-radius: ${theme.borderRadius.medium};
  padding: 3.5rem;
  max-width: 900px;
  margin: 0 auto 4rem;
  box-shadow: ${theme.shadows.xl};
  border: 2px solid rgba(153, 101, 21, 0.35);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, ${theme.colors.primary}, ${theme.colors.navbarLinkHover}, ${theme.colors.primary}, transparent);
  }
`;

const ContactTitle = styled.h2`
  text-align: center;
  color: ${theme.colors.navbarLinkHover};
  margin-bottom: 0.5rem;
  font-size: 3.2rem;
`;

const ContactSubtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2.5rem;
  font-size: 1.2rem;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ContactCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: ${theme.borderRadius.small};
  border: 2px solid rgba(153, 101, 21, 0.4);
  transition: all ${theme.transitions.normal};

  &:hover {
    background: rgba(153, 101, 21, 0.08);
    border-color: rgba(153, 101, 21, 0.7);
    transform: translateY(-2px);
  }
`;

const ContactIconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(153, 101, 21, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary};
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const ContactCardText = styled.div`
  span {
    display: block;
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  a, p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.15rem;
    margin: 0;
    text-decoration: none;
    transition: color ${theme.transitions.fast};
  }

  a:hover {
    color: ${theme.colors.navbarLinkHover};
  }
`;

/* ─── COMPONENT ─── */
function Home({ isAuthenticated }) {
  const [currentBg, setCurrentBg] = useState(0);
  const phone = import.meta.env.VITE_CONTACT_PHONE?.trim();
  const email = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const address = import.meta.env.VITE_CONTACT_ADDRESS?.trim();

  useEffect(() => {
    // First transition happens quickly, then regular interval
    const initialTimeout = setTimeout(() => {
      setCurrentBg(prev => (prev + 1) % heroImages.length);
    }, 2000);

    const timer = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % heroImages.length);
    }, 6000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <HeroSection>
        {heroImages.map((img, index) => (
          <HeroBg key={index} $src={img} $active={index === currentBg} />
        ))}
        <HeroContent>

          <HeroTitle>
            Bienvenido a<br /><span>Essence De Toi</span>
          </HeroTitle>
          <HeroSubtitle>
            Tu oasis de belleza y bienestar. Descubre nuestros servicios exclusivos y agenda tu cita hoy mismo.
          </HeroSubtitle>
          {!isAuthenticated ? (
            <ButtonGroup>
              <PrimaryButton to="/appointments/new">
                Agendar Cita Ahora <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
              </PrimaryButton>
              <SecondaryButton to="/login">Iniciar Sesión</SecondaryButton>
            </ButtonGroup>
          ) : (
            <ButtonGroup>
              <PrimaryButton to={isAuthenticated ? '/dashboard' : '/login'}>
                Ir al Dashboard <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
              </PrimaryButton>
            </ButtonGroup>
          )}
          <HeroIndicators>
            {heroImages.map((_, index) => (
              <HeroIndicator
                key={index}
                $active={index === currentBg}
                onClick={() => setCurrentBg(index)}
                aria-label={`Imagen ${index + 1}`}
              />
            ))}
          </HeroIndicators>
        </HeroContent>
      </HeroSection>

      {/* ── FEATURES ── */}
      <Section>
        <SectionHeader>
          <SectionBadge>¿Por qué elegirnos?</SectionBadge>
          <SectionTitle>Una Experiencia Premium</SectionTitle>
          <SectionSubtitle>
            Nos dedicamos a resaltar tu belleza natural con los mejores productos y profesionales del sector.
          </SectionSubtitle>
        </SectionHeader>

        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon><i className="fas fa-gem"></i></FeatureIcon>
            <FeatureTitle>Productos Premium</FeatureTitle>
            <FeatureText>
              Utilizamos marcas de alta gama que cuidan y protegen tu cabello y piel.
            </FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><i className="fas fa-award"></i></FeatureIcon>
            <FeatureTitle>Profesionales Expertos</FeatureTitle>
            <FeatureText>
              Nuestro equipo cuenta con años de experiencia y capacitación continua.
            </FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><i className="fas fa-heart"></i></FeatureIcon>
            <FeatureTitle>Atención Personalizada</FeatureTitle>
            <FeatureText>
              Cada servicio se adapta a tus necesidades y estilo personal único.
            </FeatureText>
          </FeatureCard>
        </FeaturesGrid>
      </Section>

      {/* ── CTA CARDS ── */}
      <Section style={{ paddingTop: 0 }}>
        <CardContainer>
          <DarkCard>
            <CardTitle $isDark>Nuestros Servicios</CardTitle>
            <CardText $isDark>
              Explora nuestra gama de tratamientos de belleza, desde cortes de cabello y coloración hasta tratamientos faciales y masajes relajantes.
            </CardText>
            <OutlineButton $isDark to="/services">
              Ver Servicios <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
            </OutlineButton>
          </DarkCard>
          <LightCard>
            <CardTitle>Agenda tu Cita</CardTitle>
            <CardText>
              ¿Lista para tu transformación? Agendar tu cita es fácil y rápido. Selecciona tu servicio, estilista y horario favorito.
            </CardText>
            <OutlineButton $isDark={false} to={isAuthenticated ? '/appointments/new' : '/login'}>
              Agendar Ahora <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
            </OutlineButton>
          </LightCard>
        </CardContainer>
      </Section>

      {/* ── CONTACT ── */}
      <Section style={{ paddingTop: 0 }}>
        <ContactWrapper id="contact-section">
          <ContactTitle>Contáctanos</ContactTitle>
          <ContactSubtitle>
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
          </ContactSubtitle>
          <ContactGrid>
            {phone && <ContactCard>
              <ContactIconCircle><i className="fas fa-phone"></i></ContactIconCircle>
              <ContactCardText>
                <span>Teléfono</span>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
              </ContactCardText>
            </ContactCard>}
            {email && <ContactCard>
              <ContactIconCircle><i className="fas fa-envelope"></i></ContactIconCircle>
              <ContactCardText>
                <span>Email</span>
                <a href={`mailto:${email}`}>{email}</a>
              </ContactCardText>
            </ContactCard>}
            {address && <ContactCard>
              <ContactIconCircle><i className="fas fa-map-marker-alt"></i></ContactIconCircle>
              <ContactCardText>
                <span>Dirección</span>
                <p>{address}</p>
              </ContactCardText>
            </ContactCard>}
            <ContactCard>
              <ContactIconCircle><i className="fas fa-clock"></i></ContactIconCircle>
              <ContactCardText>
                <span>Horario</span>
                <p>Lun - Sáb: 9:00 AM - 7:00 PM</p>
              </ContactCardText>
            </ContactCard>
          </ContactGrid>
        </ContactWrapper>
      </Section>
    </>
  );
}

export default Home;

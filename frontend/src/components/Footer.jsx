import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const glowPulse = keyframes`
  0%, 100% { text-shadow: 0 0 4px rgba(201, 148, 42, 0.3), 0 0 8px rgba(153, 101, 21, 0.15); }
  50% { text-shadow: 0 0 12px rgba(201, 148, 42, 0.6), 0 0 24px rgba(153, 101, 21, 0.3), 0 0 36px rgba(201, 148, 42, 0.1); }
`;

const iconGlow = keyframes`
  0%, 100% { box-shadow: 0 0 4px rgba(153, 101, 21, 0.2); }
  50% { box-shadow: 0 0 14px rgba(153, 101, 21, 0.5), 0 0 28px rgba(201, 148, 42, 0.15); }
`;

const borderShine = keyframes`
  0% { border-color: rgba(153, 101, 21, 0.15); }
  50% { border-color: rgba(201, 148, 42, 0.45); }
  100% { border-color: rgba(153, 101, 21, 0.15); }
`;

const heartPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
`;

const FooterContainer = styled.footer`
  background: linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%);
  color: rgba(255, 255, 255, 0.6);
  padding: 3.5rem 0 0;
  margin-top: auto;
  border-top: 1px solid rgba(153, 101, 21, 0.15);
  animation: ${borderShine} 4s ease-in-out infinite;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  padding-bottom: 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
`;

const FooterBrand = styled.div`
  h3 {
    font-family: ${theme.fonts.primary};
    font-size: 2.1rem;
    margin-bottom: 1rem;
    letter-spacing: 0.5px;
    background: linear-gradient(
      90deg,
      ${theme.colors.primary} 0%,
      ${theme.colors.navbarLinkHover} 25%,
      #fff 50%,
      ${theme.colors.navbarLinkHover} 75%,
      ${theme.colors.primary} 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${shimmer} 4s linear infinite, ${glowPulse} 3s ease-in-out infinite;
  }

  p {
    font-size: 1.15rem;
    line-height: 1.7;
    max-width: 320px;
    color: rgba(255, 255, 255, 0.5);

    @media (max-width: 768px) {
      max-width: 100%;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialIcon = styled.a`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(153, 101, 21, 0.12);
  border: 1px solid rgba(153, 101, 21, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.accent};
  font-size: 0.85rem;
  transition: all ${theme.transitions.normal};
  animation: ${iconGlow} 3s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.4s);

  &:hover {
    background: ${theme.colors.primary};
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(153, 101, 21, 0.4);
  }
`;

const FooterColumn = styled.div`
  h4 {
    font-family: ${theme.fonts.secondary};
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 1.25rem;
    background: linear-gradient(
      90deg,
      ${theme.colors.primary} 0%,
      ${theme.colors.navbarLinkHover} 30%,
      #fff 50%,
      ${theme.colors.navbarLinkHover} 70%,
      ${theme.colors.primary} 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${shimmer} 5s linear infinite;
  }
`;

const FooterLink = styled(Link)`
  display: block;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 1.15rem;
  padding: 0.3rem 0;
  transition: all ${theme.transitions.normal};
  position: relative;

  &:hover {
    color: ${theme.colors.navbarLinkHover};
    padding-left: 6px;
    text-decoration: none;
    text-shadow: 0 0 8px rgba(201, 148, 42, 0.4);
  }
`;

const BottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);

  span {
    transition: color 0.3s ease;
  }

  &:hover span {
    color: rgba(255, 255, 255, 0.8);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;

const HeartPulse = styled.span`
  color: ${theme.colors.accent};
  display: inline-block;
  animation: ${heartPulse} 1.5s ease-in-out infinite;
  text-shadow: 0 0 6px rgba(153, 101, 21, 0.5);
`;

function Footer() {
  const year = new Date().getFullYear();
  const socialLinks = [
    { url: import.meta.env.VITE_FACEBOOK_URL, label: 'Facebook', icon: 'fab fa-facebook-f' },
    { url: import.meta.env.VITE_INSTAGRAM_URL, label: 'Instagram', icon: 'fab fa-instagram' },
    { url: import.meta.env.VITE_WHATSAPP_URL, label: 'WhatsApp', icon: 'fab fa-whatsapp' },
    { url: import.meta.env.VITE_TIKTOK_URL, label: 'TikTok', icon: 'fab fa-tiktok' },
  ].filter(item => item.url);

  return (
    <FooterContainer>
      <Container>
        <FooterGrid>
          <FooterBrand>
            <h3>✦ Essence De Toi</h3>
            <p>Tu oasis de belleza y bienestar. Transformamos tu imagen con dedicación, productos premium y pasión por lo que hacemos.</p>
            {socialLinks.length > 0 && <SocialLinks>
              {socialLinks.map(({ url, label, icon }, index) => (
                <SocialIcon key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} style={{ '--i': index }}><i className={icon}></i></SocialIcon>
              ))}
            </SocialLinks>}
          </FooterBrand>

          <FooterColumn>
            <h4>Enlaces</h4>
            <FooterLink to="/">Inicio</FooterLink>
            <FooterLink to="/services">Servicios</FooterLink>
            <FooterLink to="/contact">Contáctanos</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <h4>Horario</h4>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)' }}>
              Lunes - Viernes<br />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>9:00 AM - 7:00 PM</span><br /><br />
              Sábado<br />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>9:00 AM - 5:00 PM</span>
            </p>
          </FooterColumn>
        </FooterGrid>

        <BottomBar>
          <span>© {year} Essence De Toi. Todos los derechos reservados.</span>
          <span>Hecho con <HeartPulse>♥</HeartPulse> en Neiva, Colombia</span>
        </BottomBar>
      </Container>
    </FooterContainer>
  );
}

export default Footer;

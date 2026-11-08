import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { todayInTimeZone } from '../../utils/date';

const Banner = styled.header`
  position: relative;
  margin-bottom: 1.75rem;
  padding: 1.75rem 2rem;
  overflow: hidden;
  border-radius: ${theme.borderRadius.medium};
  background: linear-gradient(135deg, ${theme.colors.sidebarBg} 0%, ${theme.colors.sidebarBgEnd} 100%);
  box-shadow: 0 12px 32px rgba(26, 20, 11, 0.18);
  color: rgba(255, 255, 255, 0.82);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: linear-gradient(180deg, ${theme.colors.navbarLinkHover}, ${theme.colors.primary});
  }

  h1 {
    margin-bottom: 0.4rem;
    color: ${theme.colors.navbarLinkHover};
    font-size: 2.4rem;
  }

  p {
    margin: 0;
    font-size: 1.1rem;
  }

  strong {
    color: ${theme.colors.navbarLinkHover};
    letter-spacing: 0.5px;
  }

  @media (max-width: 600px) {
    padding: 1.4rem 1.25rem;

    h1 {
      font-size: 2rem;
    }
  }
`;

const Watermark = styled.i`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.accent};
  font-size: 4rem;
  opacity: 0.12;
  pointer-events: none;

  @media (max-width: 600px) {
    display: none;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(201, 148, 42, 0.4);
  border-radius: 999px;
  background: rgba(201, 148, 42, 0.12);
  color: ${theme.colors.accent};
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
`;

const longDate = date => new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

// Saludo de los paneles de trabajo: "Hola, Nombre ✨ · Conectado como ROL · Hoy es …".
function WelcomeBanner({ name, roleLabel, icon }) {
  return (
    <Banner>
      <RoleBadge><i className={`fas ${icon}`} aria-hidden="true"></i>{roleLabel}</RoleBadge>
      <h1>Hola, {name} ✨</h1>
      <p>Conectado como <strong>{roleLabel.toUpperCase()}</strong> · Hoy es {longDate(todayInTimeZone())}.</p>
      <Watermark className={`fas ${icon}`} aria-hidden="true" />
    </Banner>
  );
}

export default WelcomeBanner;

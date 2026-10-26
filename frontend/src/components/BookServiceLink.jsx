import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { bookingPath } from '../utils/booking';

const StyledLink = styled(Link)`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border: 2px solid ${theme.colors.primary};
  border-radius: ${theme.borderRadius.pill};
  color: ${theme.colors.primary};
  font-size: 1.05rem;
  font-weight: 700;
  white-space: nowrap;
  transition: all ${theme.transitions.normal};

  i {
    font-size: 0.8em;
    transition: transform ${theme.transitions.fast};
  }

  &:hover {
    border-color: transparent;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 4px 15px rgba(153, 101, 21, 0.3);
    color: white;
  }

  &:hover i {
    transform: translateX(3px);
  }

  ${props => props.$solid && css`
    border-color: transparent;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 3px 10px rgba(153, 101, 21, 0.25);
    color: white;

    &:hover {
      box-shadow: 0 6px 18px rgba(153, 101, 21, 0.4);
      transform: translateY(-2px);
    }
  `}
`;

// Botón "Reservar" que abre el formulario de citas con el servicio ya elegido.
function BookServiceLink({ serviceName, isAuthenticated = false, solid = false, children = 'Reservar' }) {
  return (
    <StyledLink
      to={bookingPath(serviceName, isAuthenticated)}
      $solid={solid}
      aria-label={`Reservar ${serviceName}`}
    >
      {children} <i className="fas fa-arrow-right" aria-hidden="true"></i>
    </StyledLink>
  );
}

export default BookServiceLink;

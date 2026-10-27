import styled from 'styled-components';
import { theme } from '../styles/theme';

const STARS = [1, 2, 3, 4, 5];

const Picker = styled.div`
  display: inline-flex;
  gap: 0.15rem;

  label {
    cursor: pointer;
    color: #d9cdb6;
    font-size: 1.7rem;
    line-height: 1;
    transition: color ${theme.transitions.fast}, transform ${theme.transitions.fast};
  }

  label[data-on='true'] {
    color: ${theme.colors.accent};
  }

  label:hover {
    transform: scale(1.12);
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  input:focus-visible + span {
    outline: 3px solid rgba(201, 148, 42, 0.4);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const Display = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: ${theme.colors.accent};
  font-size: ${props => props.$size || '1rem'};
  white-space: nowrap;

  small {
    color: ${theme.colors.textMuted};
    font-size: 0.9em;
  }
`;

// Con onChange es un selector de 1 a 5 estrellas (radios accesibles por teclado);
// sin onChange solo muestra la calificación, con media estrella si hace falta.
function StarRating({ value = 0, onChange, count, size }) {
  if (!onChange) {
    const rounded = Math.round(value * 2) / 2;
    return (
      <Display $size={size} aria-label={`${value.toLocaleString('es-CO')} de 5 estrellas${count ? `, ${count} ${count === 1 ? 'reseña' : 'reseñas'}` : ''}`}>
        <span aria-hidden="true">
          {STARS.map(star => (
            <i key={star} className={`fas ${rounded >= star ? 'fa-star' : rounded >= star - 0.5 ? 'fa-star-half-alt' : 'fa-star'}`}
              style={rounded < star - 0.5 ? { color: '#d9cdb6' } : undefined}></i>
          ))}
        </span>
        {count !== undefined && <small aria-hidden="true">{value.toLocaleString('es-CO')} ({count})</small>}
      </Display>
    );
  }
  return (
    <Picker role="radiogroup" aria-label="Calificación">
      {STARS.map(star => (
        <label key={star} data-on={star <= value}>
          <input type="radio" name="rating" value={star} checked={value === star} onChange={() => onChange(star)}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`} />
          <span aria-hidden="true"><i className="fas fa-star"></i></span>
        </label>
      ))}
    </Picker>
  );
}

export default StarRating;

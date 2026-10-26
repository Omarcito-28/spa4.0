import styled, { css } from 'styled-components';
import { theme, fadeInUp } from '../styles/theme';

const border = '#e4dccd';

// Los controles de formulario no heredan el tamaño de letra del body; se fija aquí.
const control = css`
  min-width: 0;
  padding: 0.6rem 0.85rem;
  border: 1px solid ${border};
  border-radius: 10px;
  background: #fff;
  color: ${theme.colors.text};
  font: inherit;
  font-size: 1.1rem;
  line-height: 1.3;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(201, 148, 42, 0.2);
  }

  &:disabled {
    background: #f6f3ee;
    cursor: wait;
  }
`;

const surface = css`
  border: 1px solid ${border};
  border-radius: ${theme.borderRadius.medium};
  background: ${theme.colors.cardBg};
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 8px 24px rgba(60, 40, 10, 0.06);
`;

export const Page = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  animation: ${fadeInUp} 0.45s ease-out;
`;

// Título de página con un filete dorado debajo.
export const Title = styled.h1`
  position: relative;
  margin-bottom: 0.9rem;
  padding-bottom: 0.6rem;
  color: ${theme.colors.text};
  font-size: 2.8rem;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 64px;
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent}, transparent);
  }

  @media (max-width: 600px) {
    font-size: 2.2rem;
  }
`;

export const Description = styled.p`
  max-width: 820px;
  margin-bottom: 2rem;
  color: ${theme.colors.textMuted};
  font-size: 1.15rem;
  line-height: 1.6;
`;

export const Card = styled.div`
  ${surface}
  position: relative;
  margin-bottom: 1.5rem;
  padding: 1.75rem;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent}, ${theme.colors.secondary});
  }

  > h2 {
    margin-bottom: 1rem;
    color: ${theme.colors.text};
    font-size: 1.8rem;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
  color: ${theme.colors.text};
  font-size: 1.1rem;
  font-weight: 600;

  input, select, textarea {
    ${control}
    font-weight: 400;
  }
`;

// Campo suelto (fuera de un <Field>) con el mismo estilo que el resto del panel.
export const Input = styled.input`
  ${control}

  &[aria-invalid='true'] {
    border-color: #b93224;
    box-shadow: 0 0 0 3px rgba(185, 50, 36, 0.15);
  }
`;

export const Button = styled.button`
  margin: 0.25rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: ${props => props.$danger
    ? '#b93224'
    : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`};
  color: white;
  box-shadow: ${props => props.$danger ? 'none' : '0 3px 10px rgba(153, 101, 21, 0.22)'};
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background ${theme.transitions.fast}, transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${props => props.$danger
      ? '#962719'
      : `linear-gradient(135deg, ${theme.colors.primaryDark}, ${theme.colors.primary})`};
    box-shadow: 0 6px 16px rgba(153, 101, 21, 0.28);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid rgba(201, 148, 42, 0.4);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  ${props => props.$secondary && css`
    border-color: ${border};
    background: white;
    box-shadow: none;
    color: ${theme.colors.text};

    &:hover:not(:disabled) {
      border-color: ${theme.colors.accent};
      background: #faf6ee;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
  `}
`;

// Barra de búsqueda y filtros encima de las tablas.
export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  padding: 1.1rem 1.25rem;
  ${surface}
  background: linear-gradient(180deg, #fff, #fffcf6);

  > input, > select {
    ${control}
  }

  > input:not([type='date']) {
    flex: 1 1 260px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    color: ${theme.colors.textLight};
    font-size: 0.95rem;
    font-weight: 700;

    input, select {
      ${control}
    }
  }

  ${Button} {
    margin: 0;
  }
`;

export const ResultCount = styled.p`
  margin: 0 0 0.75rem;
  color: ${theme.colors.textMuted};
  font-size: 1.05rem;
  font-weight: 600;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  ${surface}
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 1.12rem;

  th, td {
    padding: 0.9rem 1.1rem;
    border-bottom: 1px solid #eee8dc;
    vertical-align: middle;
  }

  th {
    background: linear-gradient(180deg, #fbf5ea, #f6eddd);
    border-bottom: 2px solid #e8d8b8;
    color: ${theme.colors.primaryDark};
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  tbody tr {
    transition: background ${theme.transitions.fast};
  }

  tbody tr:nth-child(even) {
    background: #fffcf7;
  }

  tbody tr:hover {
    background: #fbf3e4;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  select {
    ${control}
    max-width: 200px;
    padding: 0.4rem 0.6rem;
    font-size: 1rem;
  }

  td ${Button} {
    padding: 0.45rem 0.95rem;
    font-size: 0.98rem;
  }
`;

// Fila de "sin resultados" que ocupa toda la tabla.
export const EmptyCell = styled.td`
  padding: 2.5rem 1rem !important;
  color: ${theme.colors.textMuted};
  text-align: center;
  font-style: italic;
`;

export const Notice = styled.p`
  margin: 0.75rem 0;
  padding: 0.7rem 1rem;
  border-left: 4px solid ${props => props.$error ? '#b93224' : '#28623a'};
  border-radius: 8px;
  background: ${props => props.$error ? '#fbe3e0' : '#dff3e4'};
  color: ${props => props.$error ? '#8c2318' : '#1f5f33'};
  font-size: 1.08rem;
`;

export const Form = styled.form`
  max-width: 760px;
`;

// Tarjeta de indicador: la cifra va en <h2> y la etiqueta en <p>.
export const StatCard = styled.div`
  position: relative;
  padding: 1.4rem 1.5rem;
  overflow: hidden;
  ${surface}
  transition: transform ${theme.transitions.normal}, box-shadow ${theme.transitions.normal};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${theme.shadows.cardHover};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 5px;
    background: ${props => props.$accent || theme.colors.accent};
  }

  h2 {
    margin: 0 0 0.2rem;
    color: ${theme.colors.text};
    font-size: 2.3rem;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: ${theme.colors.textMuted};
    font-size: 1.1rem;
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 0.4rem;
    color: ${theme.colors.textMuted};
    font-size: 0.95rem;
  }
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 2.25rem 0 1rem;
  color: ${theme.colors.text};
  font-size: 1.8rem;

  &::before {
    content: '✦';
    color: ${theme.colors.accent};
    font-size: 1rem;
  }
`;

import styled, { css } from 'styled-components';
import { theme } from '../styles/theme';

const border = theme.colors.border;
const arrow = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'><path d='M1 1.5l6 6 6-6' fill='none' stroke='%23996515' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

// Los controles de formulario no heredan el tamaño de letra del body; se fija aquí.
const control = css`
  min-width: 0;
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid ${border};
  border-radius: 12px;
  background: #fffaf0;
  box-shadow: inset 0 1px 2px rgba(122, 80, 15, 0.06);
  color: ${theme.colors.text};
  font: inherit;
  font-size: 1.1rem;
  line-height: 1.3;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}, background ${theme.transitions.fast};

  &::placeholder {
    color: ${theme.colors.placeholder};
    opacity: 1;
  }

  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    background: #fff;
    box-shadow: 0 0 0 4px rgba(201, 148, 42, 0.2);
  }

  &:disabled {
    background: #f6f3ee;
    cursor: wait;
  }

  &:is(select) {
    appearance: none;
    padding-right: 2.4rem;
    background-image: ${arrow};
    background-repeat: no-repeat;
    background-position: right 0.95rem center;
  }

  &:is(textarea) {
    min-height: 110px;
    resize: vertical;
  }

  &[type='date'], &[type='time'] {
    accent-color: ${theme.colors.primary};
    min-height: 2.9rem;
  }

  &::-webkit-calendar-picker-indicator {
    padding: 0.25rem;
    border-radius: 8px;
    cursor: pointer;
    opacity: 0.75;
    /* tiñe el ícono nativo al dorado de la marca */
    filter: invert(36%) sepia(70%) saturate(900%) hue-rotate(10deg) brightness(90%);
    transition: opacity ${theme.transitions.fast}, background ${theme.transitions.fast};
  }

  &::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
    background: rgba(201, 148, 42, 0.18);
  }

  &[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    padding: 0;
    accent-color: ${theme.colors.primary};
    box-shadow: none;
    cursor: pointer;
  }
`;

export const Page = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
`;

export const Title = styled.h1`
  margin-bottom: 0.4rem;
  color: ${theme.colors.text};
  font-size: 2.6rem;

  @media (max-width: 600px) {
    font-size: 2.1rem;
  }
`;

export const Description = styled.p`
  max-width: 820px;
  margin-bottom: 1.75rem;
  color: ${theme.colors.textMuted};
  font-size: 1.2rem;
  opacity: 0.8;
`;

export const Card = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.75rem;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: ${theme.borderRadius.medium};
  background: ${theme.colors.cardBg};
  box-shadow: ${theme.shadows.small};

  > h2 {
    margin-bottom: 1rem;
    color: ${theme.colors.text};
    font-size: 1.7rem;
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
  margin-bottom: 1.1rem;
  color: ${theme.colors.primaryDark};
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  input, select, textarea {
    ${control}
    font-weight: 400;
    letter-spacing: normal;
    text-transform: none;
  }
`;

export const Button = styled.button`
  margin: 0.25rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: ${props => props.$danger ? '#fff' : theme.colors.primary};
  color: ${props => props.$danger ? '#b93224' : 'white'};
  border-color: ${props => props.$danger ? '#e3b3ad' : 'transparent'};
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background ${theme.transitions.fast}, transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${props => props.$danger ? '#fbe3e0' : theme.colors.primaryDark};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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
    color: ${theme.colors.text};

    &:hover:not(:disabled) {
      background: #faf6ee;
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
  border: 1px solid #eee8dc;
  border-radius: ${theme.borderRadius.medium};
  background: linear-gradient(135deg, #fffdf8, #faf3e3);
  box-shadow: ${theme.shadows.small};

  > input, > select {
    ${control}
  }

  > input:not([type='date']) {
    flex: 1 1 260px;
    width: auto;
  }

  > select {
    width: auto;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: ${theme.colors.primaryDark};
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    input, select {
      ${control}
      width: auto;
      letter-spacing: normal;
      text-transform: none;
      font-weight: 400;
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
  opacity: 0.8;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: ${theme.shadows.small};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 1.12rem;

  th, td {
    height: 64px;
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid #eee8dc;
    vertical-align: middle;
  }

  tbody tr:nth-child(even) {
    background: #fffdf9;
  }

  td:last-child:has(button) {
    white-space: nowrap;
  }

  th {
    background: #faf6ee;
    color: ${theme.colors.primaryDark};
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  tbody tr {
    transition: background ${theme.transitions.fast};
  }

  tbody tr:hover {
    background: #fdfaf4;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  input:not([type='checkbox']) {
    ${control}
    width: auto;
    padding: 0.4rem 0.6rem;
    font-size: 1rem;
  }

  input[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: ${theme.colors.primary};
    cursor: pointer;
  }

  select {
    ${control}
    width: auto;
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
  opacity: 0.75;
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

// Formulario en una sola fila (por ejemplo "Reprogramar" dentro de una tabla).
export const InlineForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.9rem 1rem;
  margin: 0.25rem 0;
  padding: 1.1rem 1.25rem;
  border: 1px solid #eee8dc;
  border-radius: ${theme.borderRadius.medium};
  background: linear-gradient(135deg, #fffdf8, #faf3e3);

  label {
    display: flex;
    flex: 1 1 190px;
    flex-direction: column;
    gap: 0.35rem;
    color: ${theme.colors.primaryDark};
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    input, select {
      ${control}
      letter-spacing: normal;
      text-transform: none;
      font-weight: 400;
    }
  }

  ${Button} {
    margin: 0;
  }

  > p, > [role='alert'] {
    flex-basis: 100%;
    margin: 0;
  }
`;

export const Form = styled.form`
  max-width: 760px;
`;

// Tarjeta de indicador: la cifra va en <h2> y la etiqueta en <p>.
export const StatCard = styled.div`
  position: relative;
  padding: 1.4rem 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: ${theme.shadows.small};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: ${props => props.$accent || theme.colors.accent};
  }

  h2 {
    margin: 0 0 0.3rem;
    color: ${theme.colors.primaryDark};
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: lining-nums;
  }

  p {
    margin: 0;
    color: ${theme.colors.textMuted};
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  small {
    display: block;
    margin-top: 0.4rem;
    color: ${theme.colors.textMuted};
    font-size: 0.95rem;
    opacity: 0.75;
  }
`;

export const SectionTitle = styled.h2`
  margin: 2rem 0 1rem;
  color: ${theme.colors.text};
  font-size: 1.6rem;
`;

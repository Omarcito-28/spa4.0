import styled from 'styled-components';
import { theme } from '../styles/theme';

export const Page = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;

export const Title = styled.h1`
  margin-bottom: 0.5rem;
  color: ${theme.colors.text};
`;

export const Description = styled.p`
  margin-bottom: 1.5rem;
  color: ${theme.colors.textMuted};
`;

export const Card = styled.div`
  margin-bottom: 1.25rem;
  padding: 1.5rem;
  border-radius: ${theme.borderRadius.medium};
  background: ${theme.colors.cardBg};
  box-shadow: ${theme.shadows.small};
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
  font-weight: 600;

  input, select, textarea {
    min-width: 0;
    padding: 0.7rem 0.8rem;
    border: 1px solid #d9d3c8;
    border-radius: 8px;
    background: #fff;
    color: ${theme.colors.text};
    font: inherit;
  }
`;

export const Button = styled.button`
  margin: 0.25rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 999px;
  background: ${props => props.$danger ? '#b93224' : theme.colors.primary};
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: ${theme.shadows.small};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th, td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid #eee8dc;
    vertical-align: top;
  }

  th {
    background: #faf6ee;
    color: ${theme.colors.primaryDark};
  }

  select {
    max-width: 190px;
    padding: 0.45rem;
    border: 1px solid #d9d3c8;
    border-radius: 6px;
    background: white;
  }
`;

export const Notice = styled.p`
  margin: 0.75rem 0;
  color: ${props => props.$error ? '#b93224' : '#28623a'};
`;

export const Form = styled.form`
  max-width: 680px;
`;

import styled from 'styled-components';
import { Button } from './ManagementUI';

const Bar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.25rem 1rem 0;
  font-size: 1.1rem;
`;

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <Bar aria-label="Paginación">
      <Button type="button" $secondary disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Anterior</Button>
      <span>Página {page} de {pageCount}</span>
      <Button type="button" $secondary disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Siguiente ›</Button>
    </Bar>
  );
}

export default Pagination;

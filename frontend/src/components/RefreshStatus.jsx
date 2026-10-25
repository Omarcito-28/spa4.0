import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { formatElapsed } from '../utils/date';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: ${theme.colors.textMuted};
  font-size: 1rem;
`;

const RefreshButton = styled.button`
  padding: 0.35rem 0.9rem;
  border: 1px solid #d9d3c8;
  border-radius: 999px;
  background: white;
  color: ${theme.colors.text};
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

// Solo este componente se vuelve a pintar cada segundo, no la página entera.
function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

function RefreshStatus({ lastUpdated, refreshing, onRefresh }) {
  const now = useNow();
  return (
    <Bar>
      <small>{lastUpdated ? `Actualizado hace ${formatElapsed(now - lastUpdated)}` : 'Cargando…'}</small>
      <RefreshButton type="button" onClick={() => onRefresh()} disabled={refreshing} aria-label="Actualizar ahora">
        {refreshing ? 'Actualizando…' : '↻ Actualizar'}
      </RefreshButton>
    </Bar>
  );
}

export default RefreshStatus;

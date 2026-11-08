import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.75rem;
`;

const Kpi = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: 14px;
  background: #fffdf9;
  transition: box-shadow ${theme.transitions.fast}, transform ${theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.cardHover};
  }

  div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    color: ${theme.colors.text};
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    font-variant-numeric: lining-nums;
    font-size: 2.4rem;
    line-height: 1;
  }

  span {
    margin-top: 0.3rem;
    color: ${theme.colors.textMuted};
    font-size: 1rem;
    font-weight: 700;
  }
`;

const KpiIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.$highlight
    ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`
    : 'rgba(201, 148, 42, 0.12)'};
  color: ${props => props.$highlight ? 'white' : theme.colors.primary};
  font-size: 1.15rem;
`;

// Tarjetas de indicadores de los paneles. El valor va justo antes de la etiqueta
// (los tests y lectores de pantalla leen "8 Por confirmar").
function KpiGrid({ kpis }) {
  return (
    <Grid>
      {kpis.map(kpi => (
        <Kpi key={kpi.label}>
          <KpiIcon $highlight={kpi.highlight} aria-hidden="true"><i className={`fas ${kpi.icon}`}></i></KpiIcon>
          <div>
            <strong>{kpi.value}</strong>
            <span>{kpi.label}</span>
          </div>
        </Kpi>
      ))}
    </Grid>
  );
}

export default KpiGrid;

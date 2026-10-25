import styled from 'styled-components';
import { theme } from '../styles/theme';
import { APPOINTMENT_STATUSES, statusLabel } from '../utils/appointmentStatus';

const Badge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: ${props => props.$background};
  color: ${props => props.$color};
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
`;

function StatusBadge({ status }) {
  const style = APPOINTMENT_STATUSES[status] ?? { color: theme.colors.text, background: '#eee' };
  return <Badge $color={style.color} $background={style.background}>{statusLabel(status)}</Badge>;
}

export default StatusBadge;

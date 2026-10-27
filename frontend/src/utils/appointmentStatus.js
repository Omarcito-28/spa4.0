// Etiquetas y colores de los estados de una cita, compartidos por todas las páginas.
export const APPOINTMENT_STATUSES = {
  PENDING: { label: 'Pendiente', color: '#7a5200', background: '#fff3d1' },
  CONFIRMED: { label: 'Confirmada', color: '#1f5f33', background: '#dff3e4' },
  COMPLETED: { label: 'Completada', color: '#1d4f91', background: '#e1ecfb' },
  CANCELLED: { label: 'Cancelada', color: '#9c2a1e', background: '#fbe3e0' },
  NO_SHOW: { label: 'No asistió', color: '#5c564c', background: '#eeeae3' },
};

export const STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUSES).map(([value, { label }]) => ({ value, label }));

export const statusLabel = status => APPOINTMENT_STATUSES[status]?.label ?? status;

// Las citas canceladas, completadas o con inasistencia ya no admiten cambios.
export const isFinalStatus = status => ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status);

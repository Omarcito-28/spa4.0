// Capa central de comunicación con el backend
// Todas las llamadas a la API pasan por aquí

import { notifyAppointmentsChanged } from '../utils/appointmentEvents';

// En producción VITE_API_URL apunta al backend (por ejemplo https://mi-api.onrender.com).
// Acepta la URL con o sin "/api" al final. Sin definir, se usa '/api' y el proxy de Vite.
export const resolveApiBase = apiUrl => {
  const base = (apiUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '/api';
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);

// Obtener token guardado en localStorage
const getToken = () => localStorage.getItem('token');

// Helper para construir los headers con autenticación
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// Código con el que el backend indica que el token guardado ya no sirve
// (vencido, revocado o de una cuenta desactivada o eliminada).
export const SESSION_INVALID = 'SESSION_INVALID';

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const sessionExpiredListeners = new Set();

// El contexto de autenticación se suscribe para cerrar la sesión en cuanto la API la rechace.
export const onSessionExpired = listener => {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
};

const readResponse = async (res, fallbackMessage) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || fallbackMessage;
    if (data.code === SESSION_INVALID && getToken()) {
      sessionExpiredListeners.forEach(listener => listener(message));
    }
    throw new ApiError(message, { status: res.status, code: data.code });
  }
  return data;
};

// Helper genérico para hacer fetch con manejo de errores
const apiFetch = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  return readResponse(res, 'Error en la petición');
};

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const apiLogin = (username, password) =>
  apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const apiRegister = (userData) =>
  apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const apiGetProfile = () => apiFetch('/auth/me');

export const apiUpdateProfile = (data) =>
  apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiRequestPasswordReset = email =>
  apiFetch('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiResetPassword = (token, password) =>
  apiFetch('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

// ─── SERVICES ────────────────────────────────────────────────────────────────

export const apiGetServices = () => apiFetch('/services');

export const apiCreateService = (data) =>
  apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiUpdateService = (id, data) =>
  apiFetch(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDeleteService = (id) =>
  apiFetch(`/services/${id}`, { method: 'DELETE' });

// ─── SERVICE IMAGES ──────────────────────────────────────────────────────────

// Las imágenes subidas se guardan como "/api/service-images/<id>". En producción el
// frontend y la API viven en dominios distintos, así que esa ruta se apunta a API_BASE.
// Las rutas de /public (por ejemplo "/images/services/x.jpg") y las URL completas no cambian.
export const resolveImageUrl = (src, apiBase = API_BASE) => {
  if (!src) return '';
  return src.startsWith('/api/') ? `${apiBase}${src.slice('/api'.length)}` : src;
};

export const apiGetServiceImages = () => apiFetch('/service-images');

// El archivo viaja como binario, no como JSON.
export const apiUploadServiceImage = async (file) => {
  const res = await fetch(`${API_BASE}/service-images`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name || ''),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: file,
  });
  return readResponse(res, 'No se pudo subir la imagen.');
};

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────

// Tras un cambio exitoso avisa a las demás pestañas para que refresquen sus paneles.
const changeAppointments = async (url, options) => {
  const data = await apiFetch(url, options);
  notifyAppointmentsChanged();
  return data;
};

export const apiGetAppointments = () => apiFetch('/appointments');

export const apiGetStylistAvailability = (date, stylist) =>
  apiFetch(`/appointments/availability?date=${encodeURIComponent(date)}&stylist=${encodeURIComponent(stylist)}`);

export const apiCreateAppointment = (data) =>
  changeAppointments('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiUpdateAppointment = (id, data) =>
  changeAppointments(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiUpdateAppointmentStatus = (id, status) =>
  changeAppointments(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const apiRescheduleAppointment = (id, data) =>
  changeAppointments(`/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDeleteAppointment = (id) =>
  changeAppointments(`/appointments/${id}`, { method: 'DELETE' });

// ─── USERS ───────────────────────────────────────────────────────────────────

export const apiGetUsers = () => apiFetch('/users');
export const apiCreateUser = data =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateUser = (id, data) =>
  apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteUser = id =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });
export const apiGetStylists = () => apiFetch('/users/stylists');
export const apiGetSchedule = () => apiFetch('/users/me/schedule');
export const apiUpdateSchedule = weeklySchedule =>
  apiFetch('/users/me/schedule', {
    method: 'PUT',
    body: JSON.stringify({ weeklySchedule }),
  });

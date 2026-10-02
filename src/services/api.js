// Capa central de comunicación con el backend
// Todas las llamadas a la API pasan por aquí

const API_BASE = '/api';

// Obtener token guardado en localStorage
const getToken = () => localStorage.getItem('token');

// Helper para construir los headers con autenticación
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// Helper genérico para hacer fetch con manejo de errores
const apiFetch = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición');
  }
  return data;
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

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────

export const apiGetAppointments = () => apiFetch('/appointments');

export const apiCreateAppointment = (data) =>
  apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiUpdateAppointment = (id, data) =>
  apiFetch(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDeleteAppointment = (id) =>
  apiFetch(`/appointments/${id}`, { method: 'DELETE' });

// ─── USERS ───────────────────────────────────────────────────────────────────

export const apiGetUsers = () => apiFetch('/users');

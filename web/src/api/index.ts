import { apiClient } from './client';

// Auth
export const authApi = {
  login: (slug: string, email: string, password: string) =>
    apiClient.post('/auth/login', { slug, email, password }).then((r) => r.data),
  register: (data: { nome: string; slug: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data).then((r) => r.data),
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
};

// Appointments
export const appointmentsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get('/appointments', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get(`/appointments/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/appointments', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/appointments/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/appointments/${id}`).then((r) => r.data),
};

// Availability
export const availabilityApi = {
  getSlots: (params: { staffId: string; date: string; serviceId: string }) =>
    apiClient.get('/availability', { params }).then((r) => r.data),
};

// Clients
export const clientsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get('/clients', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get(`/clients/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/clients', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/clients/${id}`, data).then((r) => r.data),
  stats: (id: string) =>
    apiClient.get(`/clients/${id}/stats`).then((r) => r.data),
};

// Staff
export const staffApi = {
  list: () => apiClient.get('/staff').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/staff', data).then((r) => r.data),
  getSchedule: (id: string) =>
    apiClient.get(`/staff/${id}/schedule`).then((r) => r.data),
  updateSchedule: (id: string, data: unknown[]) =>
    apiClient.put(`/staff/${id}/schedule`, data).then((r) => r.data),
};

// Services
export const servicesApi = {
  list: () => apiClient.get('/services').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/services', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/services/${id}`, data).then((r) => r.data),
};

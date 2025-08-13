import api from './axiosInstance';

export const fetchCeremonies = () => api.get('/reunion/');
export const fetchCeremonyById = (id) => api.get(`/reunion/${id}/details`);
export const createCeremony = (data) => api.post('/reunion/planifier', data);
export const updateCeremony = (id, data) => api.put(`/reunion/${id}`, data);
export const cancelCeremony = (id) => api.put(`/reunion/${id}`, { statut: 'ANNULEE' });
export const markAsDone = (id) => api.put(`/reunion/${id}`, { statut: 'REALISEE' });
export const generateCertificate = (id, userId) => api.post(`/reunion/${id}/generate-cert`, { user_id: userId });
export const downloadReport = (id) => api.get(`/reunion/${id}/rapport`, { responseType: 'blob' });
export const markPresence = (id) => api.patch(`/reunion/${id}/presence`);

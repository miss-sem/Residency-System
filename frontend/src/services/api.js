import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/login') ||
                           err.config?.url?.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const adminAPI = {
  getDashboard:    ()       => api.get('/admin/dashboard'),
  getResidents:    (search, department) => api.get('/admin/residents', { params: { search, department } }),
  createResident:  (data)   => api.post('/admin/residents', data),
  updateResident:  (id, data) => api.put(`/admin/residents/${id}`, data),
  deleteResident:  (id)     => api.delete(`/admin/residents/${id}`),
};

export const reportAPI = {
  // Resident
  getMyDashboard: ()         => api.get('/reports/my/dashboard'),
  getMyReports:   (params)   => api.get('/reports/my', { params }),
  getMyReport:    (id)       => api.get(`/reports/my/${id}`),
  createReport:   (data)     => api.post('/reports', data),
  updateReport:   (id, data) => api.put(`/reports/${id}`, data),
  submitReport:   (id)       => api.put(`/reports/${id}/submit`),
  deleteReport:   (id)       => api.delete(`/reports/${id}`),
  // Admin
  getAllReports: (params)    => api.get('/reports', { params }),
  getReport:    (id)        => api.get(`/reports/${id}`),
  reviewReport: (id, data)  => api.put(`/reports/${id}/review`, data),
};

export default api;

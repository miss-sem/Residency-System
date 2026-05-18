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

export const messageAPI = {
  getConversations:   ()           => api.get('/messages/conversations'),
  getMessages:        (userId)     => api.get(`/messages/${userId}`),
  getReportComments:  (reportId)   => api.get(`/messages/report/${reportId}`),
  sendMessage:        (data)       => api.post('/messages', data),
  getUnreadCount:     ()           => api.get('/messages/unread/count'),
  getAdminContact:    ()           => api.get('/messages/admin-contact'),
  getContacts:        ()           => api.get('/messages/contacts'),
};

export const notifAPI = {
  getAll:      ()   => api.get('/notifications'),
  markAllRead: ()   => api.patch('/notifications/read-all'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const authExtAPI = {
  forgotPassword:  (email)           => api.post('/auth/forgot-password',  { email }),
  resetPassword:   (token, password) => api.post('/auth/reset-password',   { token, password }),
  changePassword:  (data)            => api.post('/auth/change-password',   data),
  createReviewer:  (data)            => api.post('/auth/create-reviewer',   data),
  inviteReviewer:  (data)            => api.post('/auth/invite-reviewer',   data),
  reviewerAccess:  (token)           => api.post('/auth/reviewer-access',   { token }),
  acceptInvite:    (data)            => api.post('/auth/accept-invite',     data),
};

export default api;

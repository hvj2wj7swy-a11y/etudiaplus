/**
 * Service API - Configuration et requêtes HTTP
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTIFICATION ====================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyToken: () => api.get('/auth/verify')
};

// ==================== UTILISATEURS ====================

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getTopContributors: (limit = 10) => api.get(`/users/top-contributors?limit=${limit}`),
  getPublicProfile: (userId) => api.get(`/users/${userId}/public`),
  updateUserRole: (userId, role) =>
  api.patch(`/users/${userId}/role`, { role })
};

// ==================== DOCUMENTS ====================

export const documentAPI = {
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllDocuments: (filters = {}, limit = 20, offset = 0) => 
    api.get('/documents', { params: { ...filters, limit, offset } }),
  getDocument: (id) => api.get(`/documents/${id}`),
  rateDocument: (id, data) => api.post(`/documents/${id}/rate`, data),
  reportDocument: (id, data) => api.post(`/documents/${id}/report`, data),
  getUserDocuments: (userId, limit = 20, offset = 0) => 
    api.get(`/documents/user/${userId}`, { params: { limit, offset } })
};

// ==================== FORUM ====================

export const forumAPI = {
  createQuestion: (data) => api.post('/forum/questions', data),
  getQuestions: (filters = {}, limit = 20, offset = 0) => 
    api.get('/forum/questions', { params: { ...filters, limit, offset } }),
  getQuestion: (id) => api.get(`/forum/questions/${id}`),
  createAnswer: (questionId, data) => api.post(`/forum/questions/${questionId}/answers`, data),
  getAnswers: (questionId, limit = 50, offset = 0) => 
    api.get(`/forum/questions/${questionId}/answers`, { params: { limit, offset } }),
  voteAnswer: (answerId, data) => api.post(`/forum/answers/${answerId}/vote`, data),
  markAsSolution: (answerId) => api.post(`/forum/answers/${answerId}/mark-solution`)
};

// ==================== TABLEAU DE BORD ====================

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getUserStatistics: (userId) => api.get(`/dashboard/statistics/${userId}`)
};

export default api;

import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  getProfile: (userId: string) => api.get(`/api/auth/profile/${userId}`),
};

// Quiz APIs
export const quizAPI = {
  getActivities: () => api.get('/api/quiz/activities'),
  submitResult: (data: any) => api.post('/api/quiz/submit', data),
  getResults: (userId: string) => api.get(`/api/quiz/results/${userId}`),
};

// Results APIs
export const resultsAPI = {
  getCognitiveProfile: (userId: string) => api.get(`/api/results/profile/${userId}`),
  updateCognitiveProfile: (data: any) => api.post('/api/results/profile/update', data),
  getProgress: (userId: string) => api.get(`/api/results/progress/${userId}`),
};

// Cognitive Analysis APIs
export const cognitiveAPI = {
  submitResults: (data: any) => api.post('/api/cognitive/submit-results', data),
  getProfile: (userId: string) => api.get(`/api/cognitive/profile/${userId}`),
};

// Dashboard APIs
export const dashboardAPI = {
  submitTest: (data: any) => api.post('/api/dashboard/submit', data),
  getData: (studentId: string) => api.get(`/api/dashboard/${studentId}`),
  getActivity: (studentId: string, limit?: number) => {
    const url = limit ? `/api/dashboard/activity/${studentId}?limit=${limit}` : `/api/dashboard/activity/${studentId}`;
    return api.get(url);
  },
};

export default api;

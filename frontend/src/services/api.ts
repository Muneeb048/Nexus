import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'business_nexus_token';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('business_nexus_user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──

export const authAPI = {
  login: (credentials: { email: string, password: string, role?: string }) =>
    api.post('/auth/login', credentials),

  verify2FA: (userId: string, code: string) =>
    api.post('/auth/verify-2fa', { userId, code }),

  register: (name: string, email: string, password: string, role: string) =>
    api.post('/auth/register', { name, email, password, role }),

  getMe: () =>
    api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  logout: () =>
    api.post('/auth/logout')
};

// ── Users API ──

export const usersAPI = {
  getUsers: (role?: string) =>
    api.get('/users', { params: role ? { role } : {} }),

  getUser: (id: string) =>
    api.get(`/users/${id}`),

  updateUser: (id: string, updates: Record<string, unknown>) =>
    api.put(`/users/${id}`, updates)
};

// ── Collaborations API ──

export const collaborationsAPI = {
  getRequests: () =>
    api.get('/collaborations'),

  createRequest: (entrepreneurId: string, message: string) =>
    api.post('/collaborations', { entrepreneurId, message }),

  updateStatus: (id: string, status: string) =>
    api.put(`/collaborations/${id}`, { status })
};

// ── Messages API ──

export const messagesAPI = {
  getMessages: (userId: string) =>
    api.get(`/messages/${userId}`),

  sendMessage: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content }),

  getConversations: () =>
    api.get('/messages/conversations')
};

// ── Meetings API ──

export const meetingsAPI = {
  getMeetings: () => 
    api.get('/meetings'),
    
  createMeeting: (data: { title: string, description?: string, startTime: string, endTime: string, attendeeId: string }) => 
    api.post('/meetings', data),
    
  updateStatus: (id: string, status: string) => 
    api.put(`/meetings/${id}/status`, { status })
};

// ── Documents API ──

export const documentsAPI = {
  getDocuments: () =>
    api.get('/documents'),

  uploadDocument: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  signDocument: (id: string, signatureImage: string) =>
    api.post(`/documents/${id}/sign`, { signatureImage }),

  deleteDocument: (id: string) =>
    api.delete(`/documents/${id}`)
};

// ── Payments API ──

export const paymentsAPI = {
  getTransactions: () =>
    api.get('/payments/transactions'),

  createDeposit: (amount: number) =>
    api.post('/payments/deposit', { amount }),

  confirmDeposit: (transactionId: string, paymentIntentId: string) =>
    api.post('/payments/deposit/confirm', { transactionId, paymentIntentId }),

  transferFunds: (recipientId: string, amount: number, description?: string) =>
    api.post('/payments/transfer', { recipientId, amount, description }),

  withdrawFunds: (amount: number) =>
    api.post('/payments/withdraw', { amount })
};

export { TOKEN_KEY };
export default api;

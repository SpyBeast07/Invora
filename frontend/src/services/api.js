import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('invora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified API Service functions
export const apiService = {
  // Authentication
  login: async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  signup: async (email, fullName, password, role = 'admin') => {
    const response = await api.post('/auth/signup', {
      email,
      full_name: fullName,
      password,
      role,
    });
    return response.data;
  },

  // Dashboard Metrics
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Products
  getProducts: async ({ page = 1, size = 10, search = '', category = '' }) => {
    const response = await api.get('/products', {
      params: { page, size, search, category },
    });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (payload) => {
    const response = await api.post('/products', payload);
    return response.data;
  },
  updateProduct: async (id, payload) => {
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
  },

  // Customers
  getCustomers: async ({ page = 1, size = 10, search = '' }) => {
    const response = await api.get('/customers', {
      params: { page, size, search },
    });
    return response.data;
  },
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  createCustomer: async (payload) => {
    const response = await api.post('/customers', payload);
    return response.data;
  },
  updateCustomer: async (id, payload) => {
    const response = await api.put(`/customers/${id}`, payload);
    return response.data;
  },
  deleteCustomer: async (id) => {
    await api.delete(`/customers/${id}`);
  },

  // Orders
  getOrders: async ({ page = 1, size = 10, search = '', status = '' }) => {
    const response = await api.get('/orders', {
      params: { page, size, search, status },
    });
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  createOrder: async (payload) => {
    const response = await api.post('/orders', payload);
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
  deleteOrder: async (id) => {
    await api.delete(`/orders/${id}`);
  },
};

export default api;

import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Unified API service — no authentication required
export const apiService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Products
  getProducts: async () => {
    const response = await api.get('/products');
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
  getCustomers: async () => {
    const response = await api.get('/customers');
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
  deleteCustomer: async (id) => {
    await api.delete(`/customers/${id}`);
  },

  // Orders
  getOrders: async () => {
    const response = await api.get('/orders');
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
  deleteOrder: async (id) => {
    await api.delete(`/orders/${id}`);
  },
};

export default api;

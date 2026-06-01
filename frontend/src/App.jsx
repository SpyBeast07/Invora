import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import { apiService } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const [authSeeded, setAuthSeeded] = useState(false);

  // Auto-authentication seeding: ensures requests are authorized automatically!
  useEffect(() => {
    const seedAuth = async () => {
      try {
        const token = localStorage.getItem('invora_token');
        if (!token) {
          // 1. Proactively sign up a default operational operator account
          try {
            await apiService.signup(
              'operator@invora.com',
              'Invora Operator',
              'securepassword123',
              'admin'
            );
          } catch (e) {
            // If already registered, ignore and proceed to login
          }

          // 2. Perform background login
          const data = await apiService.login('operator@invora.com', 'securepassword123');
          localStorage.setItem('invora_token', data.access_token);
        }
        setAuthSeeded(true);
      } catch (err) {
        console.error('Failed to establish operational auth token:', err);
        setAuthSeeded(true);
      }
    };

    seedAuth();
  }, []);

  if (!authSeeded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070b13] text-center space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin">
          <RefreshCw className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-slate-400 animate-pulse tracking-wide select-none">
          Establishing Invora Secure Tunnel...
        </span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch Customers list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customersList', search],
    queryFn: () => apiService.getCustomers({ search, size: 50 }),
  });

  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: apiService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customersList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to create customer.');
    }
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiService.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['customersList']);
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to update customer.');
    }
  });

  // Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: apiService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customersList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to delete customer.');
    }
  });

  const openCreateModal = () => {
    setSelectedCustomer(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFullName(customer.full_name);
    setEmail(customer.email);
    setPhone(customer.phone_number || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Strict Client-side format checks (Pydantic validates as well!)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$|^\+?\d{7,15}$/;
      if (!phoneRegex.test(phone)) {
        alert('Invalid phone number format. Supported formats: +1234567890, 123-456-7890, or +1 (123) 456-7890');
        return;
      }
    }

    const payload = {
      full_name: fullName,
      email,
      phone_number: phone.trim() || null,
    };

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-400" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-sm text-slate-400">
            Manage buyer profiles, review histories, and create customer records.
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all select-none cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Customer Name or Email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Customer Lists Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-900/20 border border-slate-800/40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load customers catalog. Ensure database service is online.
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400 font-medium">
          No customers matched your search. Register a customer to start checkouts!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((cust) => (
            <div 
              key={cust.id} 
              className="p-5 rounded-2xl border border-slate-800/40 bg-slate-900/30 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-colors group"
            >
              {/* Header profile */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-200 leading-tight">
                      {cust.full_name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500 font-mono">
                      ID: {cust.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="truncate select-all">{cust.email}</span>
                  </div>
                  {cust.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="select-all">{cust.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end border-t border-slate-800/40 pt-2 text-xs font-semibold select-none">
                <button 
                  onClick={() => openEditModal(cust)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Delete customer ${cust.full_name}?`)) {
                      deleteMutation.mutate(cust.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal for Create & Update */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{selectedCustomer ? 'Edit Customer Info' : 'Register Customer'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Alice Smith"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., alice@gmail.com"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 (123) 456-7890"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end text-sm select-none">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-800 text-slate-300 hover:text-slate-200 hover:bg-slate-850/60 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  UserCheck,
  List,
  LayoutGrid
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Customers() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Tab View mode switcher ('table' | 'grid')
  const [viewMode, setViewMode] = useState('table');

  // Confirmation Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Form validation errors state
  const [formErrors, setFormErrors] = useState({});

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
      toast.success('Customer profile registered successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to register customer.');
    }
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiService.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['customersList']);
      toast.success('Customer profile updated successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update customer.');
    }
  });

  // Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: apiService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customersList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Customer profile deleted successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete customer.');
    }
  });

  const openCreateModal = () => {
    setSelectedCustomer(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFullName(customer.full_name);
    setEmail(customer.email);
    setPhone(customer.phone_number || '');
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Strict Client-side format checks (Pydantic validates as well!)
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else if (!selectedCustomer && data?.items?.some(cust => cust.email.toLowerCase() === email.trim().toLowerCase())) {
      errors.email = 'Email must be unique. Profile with this email already exists.';
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$|^\+?\d{7,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.phone = 'Supported formats: +1234567890, 123-456-7890, or +1 (123) 456-7890';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please resolve the highlighted validation errors.');
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone_number: phone.trim() || null,
    };

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
    setConfirmOpen(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="space-y-6 relative">
      {/* Premium ConfirmDialog Box for deletes */}
      <ConfirmDialog 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to permanently delete customer profile "${customerToDelete?.full_name}"? This will purge historical sales parameters and cannot be undone.`}
        confirmText="Delete Profile"
        cancelText="Abort"
        isDanger={true}
        isLoading={deleteMutation.isLoading}
      />

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
        
        <Button
          variant="emerald"
          onClick={openCreateModal}
          icon={Plus}
        >
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md items-center justify-between">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Customer Name or Email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Tab View mode switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl flex-shrink-0 self-end sm:self-auto select-none">
          <button 
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${viewMode === 'table' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <List className="w-4 h-4" />
            <span>Table View</span>
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* Main customer display area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-900/20 border border-slate-800/40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-900/20 border border-slate-800/40 rounded-xl" />
            ))}
          </div>
        )
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load customers catalog. Ensure database service is online.
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400 font-medium">
          No customers matched your search. Register a customer to start checkouts!
        </div>
      ) : viewMode === 'table' ? (
        /* Tabular Table View Option */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="p-4">Customer ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {data.items.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="p-4 font-mono font-bold text-slate-500 select-all text-xs">CUST-{cust.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700/50 group-hover:bg-emerald-500/10 transition-colors">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-200">{cust.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                      <Mail className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="select-all">{cust.email}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    {cust.phone_number ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="select-all">{cust.phone_number}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">
                      Active
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(cust)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Dynamic Card Grid View Option */
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
                      ID: CUST-{cust.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="truncate select-all font-mono text-xs">{cust.email}</span>
                  </div>
                  {cust.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="select-all font-mono text-xs">{cust.phone_number}</span>
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
                  onClick={() => handleDeleteClick(cust)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal for Register & Update */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 select-none">
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
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                    ${formErrors.fullName 
                      ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                      : 'border-slate-800 focus:border-emerald-500/60'
                    }
                  `}
                />
                {formErrors.fullName && (
                  <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.fullName}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., alice@gmail.com"
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                    ${formErrors.email 
                      ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                      : 'border-slate-800 focus:border-emerald-500/60'
                    }
                  `}
                />
                {formErrors.email && (
                  <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.email}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 (123) 456-7890"
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                    ${formErrors.phone 
                      ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                      : 'border-slate-800 focus:border-emerald-500/60'
                    }
                  `}
                />
                {formErrors.phone && (
                  <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.phone}</span>
                )}
              </div>

              <div className="flex gap-3 pt-4 justify-end text-sm select-none">
                <Button 
                  variant="secondary"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="emerald"
                  isLoading={createMutation.isLoading || updateMutation.isLoading}
                >
                  {selectedCustomer ? 'Save Changes' : 'Register Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

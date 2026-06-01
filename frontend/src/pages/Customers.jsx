import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, X, Mail, Phone } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Customers() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: apiService.getCustomers,
  });

  const createMutation = useMutation({
    mutationFn: apiService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Customer created successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create customer.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Customer deleted.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete customer.');
    },
  });

  const openCreateModal = () => {
    setFullName(''); setEmail(''); setPhone('');
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!email.trim()) errors.email = 'Email is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      phone_number: phone.trim() || null,
    });
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) deleteMutation.mutate(customerToDelete.id);
    setConfirmOpen(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="space-y-6 relative">
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={`Delete "${customerToDelete?.full_name}"? This will also remove their orders.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-400" />
            <span>Customers</span>
          </h1>
          <p className="text-sm text-slate-400">Manage your customer directory.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Add Customer
        </Button>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-900/20 border border-slate-800/40 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load customers. Ensure the backend is running.
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400">
          No customers yet. Click "Add Customer" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Since</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-200">{c.full_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{c.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {c.phone_number ? (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{c.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDeleteClick(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-emerald-400" />
              Add New Customer
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                <input
                  type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.fullName ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                />
                {formErrors.fullName && <span className="text-[10px] text-rose-400">{formErrors.fullName}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address *</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., jane@example.com"
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.email ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                />
                {formErrors.email && <span className="text-[10px] text-rose-400">{formErrors.email}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Phone Number <span className="text-slate-600">(optional)</span></label>
                <input
                  type="text" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 555 123 4567"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                  Create Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

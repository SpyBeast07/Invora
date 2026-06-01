import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Customers() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

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
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Customers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your customer directory.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Failed to load customers. Ensure the backend is running.</p>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No customers yet. Click "Add Customer" to create one.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Since</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{c.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {c.phone_number || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(c)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add Customer"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Jane Doe"
            error={formErrors.fullName}
          />

          <Input
            label="Email Address"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., jane@example.com"
            error={formErrors.email}
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., +1 555 123 4567"
            hint="Optional"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Orders() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formErrors, setFormErrors] = useState({});

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: apiService.getOrders,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: apiService.getCustomers,
  });

  const createMutation = useMutation({
    mutationFn: apiService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Order created successfully!');
      closeCreateModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create order.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Order deleted and stock restored.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete order.');
    },
  });

  const openCreateModal = () => {
    setCustomerId('');
    setItems([{ product_id: '', quantity: 1 }]);
    setFormErrors({});
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setFormErrors({});
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!customerId) errors.customer = 'Customer is required.';

    const validItems = items.filter((item) => item.product_id && item.quantity >= 1);
    if (validItems.length === 0) errors.items = 'At least one item with a product is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createMutation.mutate({
      customer_id: parseInt(customerId),
      items: validItems.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
      })),
    });
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) deleteMutation.mutate(orderToDelete.id);
    setConfirmOpen(false);
    setOrderToDelete(null);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        message={`Delete order #${orderToDelete?.id}? Stock will be restored automatically.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage customer orders.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Create Order
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Failed to load orders. Ensure the backend is running.</p>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No orders yet. Click "Create Order" to place one.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Order #{order.id}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {order.customer?.full_name || `Customer #${order.customer_id}`}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Items</p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">{order.items?.length ?? 0}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={expandedOrder === order.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {order.customer?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-slate-600 dark:text-slate-400">{order.customer?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Items
                    </p>
                    <div className="space-y-1.5">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700 dark:text-slate-300">
                            Product #{item.product_id}
                          </span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              Qty: <span className="font-medium text-slate-700 dark:text-slate-300">{item.quantity}</span>
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              Unit: <span className="font-medium text-slate-700 dark:text-slate-300">${parseFloat(item.unit_price).toFixed(2)}</span>
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                              ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={closeCreateModal}
        title="Create Order"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Customer <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={`block w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${formErrors.customer ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20'}`}
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
            {formErrors.customer && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.customer}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Order Items <span className="text-red-500 ml-0.5">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
            {formErrors.items && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.items}</p>}

            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) — ${parseFloat(p.price).toFixed(2)} — {p.quantity_in_stock} in stock
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  className="w-20 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                  placeholder="Qty"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeCreateModal} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Place Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

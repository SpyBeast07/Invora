import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Trash2, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Orders() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Form state
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
    <div className="space-y-6 relative">
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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-indigo-400" />
            <span>Orders</span>
          </h1>
          <p className="text-sm text-slate-400">Create and manage customer orders.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Create Order
        </Button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-900/20 border border-slate-800/40 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load orders. Ensure the backend is running.
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400">
          No orders yet. Click "Create Order" to place one.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-md overflow-hidden"
            >
              {/* Order Row */}
              <div className="flex items-center justify-between p-4 hover:bg-slate-800/10 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Order #{order.id}</span>
                    <span className="font-semibold text-slate-200 truncate">
                      {order.customer?.full_name || `Customer #${order.customer_id}`}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col ml-4">
                    <span className="text-xs text-slate-500">Total</span>
                    <span className="font-extrabold text-cyan-400">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="hidden md:flex flex-col ml-4">
                    <span className="text-xs text-slate-500">Items</span>
                    <span className="text-sm text-slate-300">{order.items?.length ?? 0}</span>
                  </div>
                  <div className="hidden lg:flex flex-col ml-4">
                    <span className="text-xs text-slate-500">Date</span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-lg transition-colors cursor-pointer"
                    title="View details"
                  >
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-slate-800/40 px-4 pb-4 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-slate-500 block">Customer</span>
                      <span className="text-slate-200 font-semibold">
                        {order.customer?.full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email</span>
                      <span className="text-slate-300">{order.customer?.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Amount</span>
                      <span className="text-cyan-400 font-extrabold">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Created</span>
                      <span className="text-slate-300">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Order Items
                    </p>
                    <div className="space-y-1.5">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="text-slate-300">
                            Product #{item.product_id}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400">Qty: <span className="text-slate-200 font-semibold">{item.quantity}</span></span>
                            <span className="text-slate-400">Unit: <span className="text-cyan-400 font-semibold">${parseFloat(item.unit_price).toFixed(2)}</span></span>
                            <span className="text-slate-500 font-semibold">
                              = ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeCreateModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              Create New Order
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.customer ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
                {formErrors.customer && <span className="text-[10px] text-rose-400">{formErrors.customer}</span>}
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Order Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
                {formErrors.items && <span className="text-[10px] text-rose-400 block">{formErrors.items}</span>}

                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) — ${parseFloat(p.price).toFixed(2)} — {p.quantity_in_stock} in stock
                        </option>
                      ))}
                    </select>
                    <input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      className="w-20 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                      placeholder="Qty"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <Button variant="secondary" onClick={closeCreateModal}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                  Place Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

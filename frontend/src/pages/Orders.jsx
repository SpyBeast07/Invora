import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2, 
  X,
  PlusCircle,
  MinusCircle,
  Trash,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  UserCheck,
  Tag
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Orders() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Dynamic Confirmation Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm, isDanger, isLoading }

  // Checkout Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]); // [{ product_id, sku, name, price, quantity, max_stock }]

  // 1. Fetch Orders List
  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['ordersList', search],
    queryFn: () => apiService.getOrders({ search, size: 50 }),
  });

  // 2. Fetch Customers for checkout selection
  const { data: customersData } = useQuery({
    queryKey: ['customersSelect'],
    queryFn: () => apiService.getCustomers({ size: 100 }),
    enabled: modalOpen,
  });

  // 3. Fetch Products for catalog selection
  const { data: productsData } = useQuery({
    queryKey: ['productsSelect'],
    queryFn: () => apiService.getProducts({ size: 100 }),
    enabled: modalOpen,
  });

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: apiService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['ordersList']);
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Order checked out and processed successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to place order.');
    }
  });

  // Cancel Order Mutation (PUT status = 'cancelled')
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['ordersList']);
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Order transaction cancelled. Inventory refunded!');
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel order.');
      setConfirmOpen(false);
    }
  });

  // Delete Order Mutation (DELETE)
  const deleteOrderMutation = useMutation({
    mutationFn: apiService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['ordersList']);
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Order history record deleted successfully.');
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete order.');
      setConfirmOpen(false);
    }
  });

  const openCheckoutModal = () => {
    setSelectedCustomerId('');
    setCart([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleAddToCart = (product) => {
    if (product.quantity_in_stock === 0) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity_in_stock) {
        toast.error(`Inventory Limit Reached! Only ${product.quantity_in_stock} items available in stock.`);
        return;
      }
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        max_stock: product.quantity_in_stock
      }]);
      toast.success(`Added "${product.name}" to cart.`);
    }
  };

  const handleCartQtyAdjust = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        if (nextQty > item.max_stock) {
          toast.error(`Inventory Limit: Only ${item.max_stock} units available.`);
          return item;
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer profile.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your shopping cart is empty.');
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity
      }))
    };

    createOrderMutation.mutate(payload);
  };

  const handleCancelClick = (order) => {
    setConfirmAction({
      title: 'Cancel Transaction',
      message: `Are you sure you want to cancel sales order "${order.order_number}"? This will return stock levels back to the inventory catalog.`,
      onConfirm: () => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' }),
      isDanger: true,
      isLoading: updateStatusMutation.isLoading
    });
    setConfirmOpen(true);
  };

  const handleDeleteClick = (order) => {
    setConfirmAction({
      title: 'Delete Order Record',
      message: `Are you sure you want to permanently delete order "${order.order_number}"? This will purge historical sales data and cannot be undone.`,
      onConfirm: () => deleteOrderMutation.mutate(order.id),
      isDanger: true,
      isLoading: deleteOrderMutation.isLoading
    });
    setConfirmOpen(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6 relative">
      {/* Reusable ConfirmDialog Box */}
      <ConfirmDialog 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction?.onConfirm}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText="Confirm"
        cancelText="Abort"
        isDanger={confirmAction?.isDanger}
        isLoading={confirmAction?.isLoading}
      />

      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-indigo-400" />
            <span>Sales Orders</span>
          </h1>
          <p className="text-sm text-slate-400">
            Process new transaction checkouts, view status history, and manage order allocations.
          </p>
        </div>
        
        <Button
          variant="indigo"
          onClick={openCheckoutModal}
          icon={Plus}
        >
          <span>New Checkout</span>
        </Button>
      </div>

      {/* Search Input Box */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Order Number or Customer Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      </div>

      {/* Orders List Table Grid */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/20 border border-slate-800/40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load sales orders. Ensure database service is online.
        </div>
      ) : ordersData?.items?.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400 font-medium">
          No orders matched your search. Initiate a checkout to record transaction details!
        </div>
      ) : (
        <div className="space-y-4">
          {ordersData.items.map((order) => {
            const isCancelled = order.status.toLowerCase() === 'cancelled';
            return (
              <div 
                key={order.id} 
                className={`
                  p-5 rounded-2xl border bg-slate-900/30 backdrop-blur-sm flex flex-col gap-4 hover:border-slate-700/60 transition-colors
                  ${isCancelled ? 'border-rose-500/10 opacity-70' : 'border-slate-800/40'}
                `}
              >
                {/* Header row details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-cyan-400 select-all font-mono">
                      {order.order_number}
                    </span>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 select-none">
                    <div className={`
                      flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                      ${order.status.toLowerCase() === 'cancelled' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }
                    `}>
                      {order.status.toLowerCase() === 'cancelled' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      <span>{order.status}</span>
                    </div>

                    <span className="text-sm font-extrabold text-cyan-400">${parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Buyer / Items layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Buyer Details</span>
                    <div className="text-slate-200">
                      {order.customer ? order.customer.full_name : 'Unknown Customer'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {order.customer ? order.customer.email : ''}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Purchased Items ({order.items.length})</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="px-2.5 py-1 bg-slate-950/60 border border-slate-800/60 rounded-lg text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                          <span>Prod ID: {item.product_id}</span>
                          <span className="text-slate-600">x</span>
                          <span className="text-cyan-400 font-bold">{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="px-2.5 py-1 bg-slate-950/20 border border-slate-800/30 rounded-lg text-[10px] text-slate-500 font-semibold self-center">
                          +{order.items.length - 3} more items
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit log actions */}
                <div className="flex justify-end gap-2.5 text-xs font-semibold select-none border-t border-slate-800/40 pt-3">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => openDetailsModal(order)}
                    icon={Eye}
                  >
                    View Details
                  </Button>

                  {!isCancelled && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelClick(order)}
                    >
                      Cancel Order
                    </Button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteClick(order)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Builder Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg z-10 cursor-pointer animate-pulse"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 select-none">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <span>Checkout Order Builder</span>
            </h3>

            {/* Split layout: Catalog on Left, Checkout cart on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 overflow-hidden flex-1 min-h-0">
              
              {/* Product catalog loader list */}
              <div className="lg:col-span-3 flex flex-col space-y-3 overflow-hidden min-h-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                  Catalog Inventory (Real-Time Availability)
                </span>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                  {productsData?.items?.map((p) => {
                    const isOutOfStock = p.quantity_in_stock === 0;
                    const isLowStock = p.quantity_in_stock > 0 && p.quantity_in_stock <= 5;
                    return (
                      <div key={p.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold gap-3 hover:border-slate-700/50 transition-colors">
                        <div>
                          <div className="text-slate-200 font-bold leading-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            SKU: {p.sku} | Price: <span className="text-cyan-400 font-bold">${parseFloat(p.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3.5 select-none">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                            ${isOutOfStock 
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                              : isLowStock 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                : 'bg-slate-800 text-slate-400 border-transparent'
                            }
                          `}>
                            {isOutOfStock ? 'Sold Out' : `In Stock: ${p.quantity_in_stock}`}
                          </span>
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddToCart(p)}
                            disabled={isOutOfStock}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout processing drawer */}
              <div className="lg:col-span-2 flex flex-col space-y-4 bg-slate-950/60 p-4 border border-slate-800 rounded-2xl overflow-hidden justify-between min-h-0">
                <div className="space-y-4 overflow-hidden flex flex-col flex-1 min-h-0">
                  
                  {/* Select Customer */}
                  <div className="space-y-1.5 flex-none">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block select-none">1. Select Buyer *</label>
                    <select
                      required
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                    >
                      <option value="">-- Choose Profile --</option>
                      {customersData?.items?.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Shopping Cart lines list */}
                  <div className="flex-1 flex flex-col space-y-1.5 overflow-hidden min-h-0">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block select-none">2. Order Lines ({cart.length})</label>
                    {cart.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 font-medium">
                        Cart is empty. Add products.
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {cart.map((item) => (
                          <div key={item.product_id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-3">
                            <div className="space-y-0.5 max-w-[50%]">
                              <div className="text-slate-200 font-bold leading-tight truncate">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">${item.price.toFixed(2)}</div>
                            </div>
                            
                            {/* Quantity control */}
                            <div className="flex items-center gap-3 flex-shrink-0 select-none">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => handleCartQtyAdjust(item.product_id, -1)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                                  <MinusCircle className="w-4.5 h-4.5" />
                                </button>
                                <span className="font-bold text-slate-200 w-5 text-center">{item.quantity}</span>
                                <button type="button" onClick={() => handleCartQtyAdjust(item.product_id, 1)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                                  <PlusCircle className="w-4.5 h-4.5" />
                                </button>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleRemoveFromCart(item.product_id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total amount & Action submit buttons */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3 flex-none select-none">
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-400">Total Price:</span>
                    <span className="text-lg text-cyan-400">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2.5 text-xs font-semibold">
                    <Button 
                      variant="secondary"
                      onClick={closeModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="indigo"
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || !selectedCustomerId}
                      isLoading={createOrderMutation.isLoading}
                      className="flex-1"
                    >
                      {createOrderMutation.isLoading ? 'Checking Out...' : 'Place Order'}
                    </Button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* View Detailed Order Modal */}
      {detailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 select-none">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>Detailed Sales Receipt</span>
            </h3>

            <div className="space-y-4">
              {/* Receipts parameters grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 border border-slate-800/60 rounded-2xl text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Order Identifier</span>
                  <span className="text-slate-200 font-mono text-sm font-bold text-cyan-400">{selectedOrder.order_number}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Date Registered</span>
                  <span className="text-slate-350">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Transactional Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase border font-bold
                    ${selectedOrder.status.toLowerCase() === 'cancelled'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }
                  `}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Aggregate Bill</span>
                  <span className="text-slate-200 text-sm font-extrabold text-emerald-400">${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Profile Card */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buyer Information Profile</span>
                </h4>
                {selectedOrder.customer ? (
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold leading-normal pl-5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Client Name</span>
                      <span className="text-slate-200">{selectedOrder.customer.full_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Client Email</span>
                      <span className="text-slate-200 truncate block font-mono">{selectedOrder.customer.email}</span>
                    </div>
                    {selectedOrder.customer.phone_number && (
                      <div className="col-span-2 mt-1">
                        <span className="text-slate-500 block text-[10px]">Contact Phone</span>
                        <span className="text-slate-200 font-mono">{selectedOrder.customer.phone_number}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic pl-5">No associated customer profile found.</div>
                )}
              </div>

              {/* Items checkout receipts list table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Purchased Product Allocation</span>
                </h4>
                <div className="overflow-hidden border border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                        <th className="p-3">Product ID</th>
                        <th className="p-3 text-center">Quantity</th>
                        <th className="p-3 text-right">Price Snapshot</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/10">
                          <td className="p-3 font-mono text-[10px] text-slate-400">Prod ID: {item.product_id}</td>
                          <td className="p-3 text-center font-bold text-cyan-400">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">${parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-slate-200">${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer dismiss actions */}
              <div className="flex justify-end pt-3">
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={closeDetailsModal}
                >
                  Close Receipt
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

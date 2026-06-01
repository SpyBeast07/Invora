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
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
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
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to place order.');
    }
  });

  // Cancel Order Mutation (PUT status = 'cancelled')
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['ordersList']);
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to cancel order.');
    }
  });

  // Delete Order Mutation (DELETE)
  const deleteOrderMutation = useMutation({
    mutationFn: apiService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['ordersList']);
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to delete order.');
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

  const handleAddToCart = (product) => {
    if (product.quantity_in_stock === 0) {
      alert('Product is out of stock.');
      return;
    }
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity_in_stock) {
        alert(`Cannot add more. Only ${product.quantity_in_stock} items available in stock.`);
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
    }
  };

  const handleCartQtyAdjust = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        if (nextQty > item.max_stock) {
          alert(`Cannot adjust. Only ${item.max_stock} items available in stock.`);
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
      alert('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty.');
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
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
        
        <button
          onClick={openCheckoutModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all select-none cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Checkout</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
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
            const isCancelled = order.status.lower() === 'cancelled';
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
                      ${order.status.lower() === 'cancelled' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }
                    `}>
                      {order.status.lower() === 'cancelled' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
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
                      {order.items.map((item, idx) => (
                        <div key={idx} className="px-2.5 py-1 bg-slate-950/60 border border-slate-800/60 rounded-lg text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                          <span>Product ID: {item.product_id}</span>
                          <span className="text-slate-600">x</span>
                          <span className="text-cyan-400 font-bold">{item.quantity}</span>
                          <span className="text-slate-600">@</span>
                          <span>${parseFloat(item.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit log actions */}
                <div className="flex justify-end gap-2 text-xs font-semibold select-none border-t border-slate-800/40 pt-3">
                  {!isCancelled && (
                    <button
                      onClick={() => {
                        if (confirm('Cancel this sales order and return stock levels?')) {
                          updateStatusMutation.mutate({ id: order.id, status: 'cancelled' });
                        }
                      }}
                      className="px-3 py-1.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel Transaction
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (confirm('Permanently delete this order record? This will purge history.')) {
                        deleteOrderMutation.mutate(order.id);
                      }
                    }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <span>Checkout Order Builder</span>
            </h3>

            {/* Split layout: Catalog on Left, Checkout cart on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 overflow-hidden flex-1">
              
              {/* Product catalog loader list */}
              <div className="lg:col-span-3 flex flex-col space-y-3 overflow-hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Inventory</span>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                  {productsData?.items?.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold gap-3">
                      <div>
                        <div className="text-slate-200 font-bold leading-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {p.sku} | Price: <span className="text-cyan-400 font-bold">${parseFloat(p.price).toFixed(2)}</span></div>
                      </div>
                      <div className="flex items-center gap-3 select-none">
                        <span className={`text-[10px] ${p.quantity_in_stock <= 5 ? 'text-amber-500' : 'text-slate-500'}`}>
                          Stock: {p.quantity_in_stock}
                        </span>
                        <button 
                          onClick={() => handleAddToCart(p)}
                          className="px-2.5 py-1.5 bg-slate-850 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout processing drawer */}
              <div className="lg:col-span-2 flex flex-col space-y-4 bg-slate-950/60 p-4 border border-slate-800 rounded-2xl overflow-hidden justify-between">
                <div className="space-y-4 overflow-hidden flex flex-col flex-1">
                  
                  {/* Select Customer */}
                  <div className="space-y-1.5 flex-none">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Select Customer *</label>
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
                  <div className="flex-1 flex flex-col space-y-1.5 overflow-hidden">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Checkout lines ({cart.length})</label>
                    {cart.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 font-medium">
                        Cart is empty. Add products.
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {cart.map((item) => (
                          <div key={item.product_id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5 max-w-[50%]">
                              <div className="text-slate-200 font-bold leading-tight truncate">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">${item.price.toFixed(2)}</div>
                            </div>
                            
                            {/* Quantity control */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => handleCartQtyAdjust(item.product_id, -1)} className="text-slate-400 hover:text-slate-200">
                                  <MinusCircle className="w-4.5 h-4.5" />
                                </button>
                                <span className="font-bold text-slate-200 w-4 text-center">{item.quantity}</span>
                                <button type="button" onClick={() => handleCartQtyAdjust(item.product_id, 1)} className="text-slate-400 hover:text-slate-200">
                                  <PlusCircle className="w-4.5 h-4.5" />
                                </button>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleRemoveFromCart(item.product_id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
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
                <div className="pt-3 border-t border-slate-800/80 space-y-3 flex-none">
                  <div className="flex items-center justify-between select-none font-bold text-sm">
                    <span className="text-slate-400">Total Price:</span>
                    <span className="text-lg text-cyan-400">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 text-xs font-semibold select-none">
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="flex-1 py-2.5 border border-slate-800 text-slate-300 hover:text-slate-200 hover:bg-slate-850/60 rounded-xl"
                    >
                      Abort
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || !selectedCustomerId || createOrderMutation.isLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-40"
                    >
                      Place Checkout
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

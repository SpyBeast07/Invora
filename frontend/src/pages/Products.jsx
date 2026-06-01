import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Tag
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form States
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('10.00');
  const [qty, setQty] = useState(0);

  // Fetch Products catalog
  const { data, isLoading, isError } = useQuery({
    queryKey: ['productsList', search],
    queryFn: () => apiService.getProducts({ search, size: 50 }),
  });

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: apiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to create product.');
    }
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to update product.');
    }
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to delete product.');
    }
  });

  // Adjust stock levels dynamically
  const adjustStockMutation = useMutation({
    mutationFn: ({ id, qty }) => apiService.updateProduct(id, { quantity_in_stock: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
    }
  });

  const openCreateModal = () => {
    setSelectedProduct(null);
    setSku('');
    setName('');
    setDescription('');
    setCategory('');
    setPrice('10.00');
    setQty(0);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setSku(product.sku);
    setName(product.name);
    setDescription(product.description || '');
    setCategory(product.category || '');
    setPrice(product.price.toString());
    setQty(product.quantity_in_stock);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(price) <= 0) {
      alert('Price must be greater than zero.');
      return;
    }
    if (parseInt(qty) < 0) {
      alert('Quantity cannot be negative.');
      return;
    }

    const payload = {
      sku,
      name,
      description: description || null,
      category: category || null,
      price: parseFloat(price),
      quantity_in_stock: parseInt(qty),
      is_active: true
    };

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleQuickAdjust = (product, delta) => {
    const nextQty = product.quantity_in_stock + delta;
    if (nextQty < 0) return; // Prevent stock below zero!
    adjustStockMutation.mutate({ id: product.id, qty: nextQty });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="w-8 h-8 text-cyan-400" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-sm text-slate-400">
            View product SKUs, adjust current inventory stock, and update parameters.
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all select-none cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Product List Table Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/20 border border-slate-800/40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load product catalog. Ensure database service is online.
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400 font-medium">
          No products matched your search. Register a new product to begin!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((prod) => {
            const isLowStock = prod.quantity_in_stock <= 5;
            return (
              <div 
                key={prod.id} 
                className={`
                  p-5 rounded-2xl border bg-slate-900/30 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-colors
                  ${isLowStock ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.02)]' : 'border-slate-800/40'}
                `}
              >
                {/* Header context */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 select-all">
                      {prod.sku}
                    </span>
                    {prod.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 select-none">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{prod.category}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-200 leading-tight">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {prod.description || 'No description provided.'}
                  </p>
                </div>

                {/* Operations & Stock counter */}
                <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium leading-none">Price</span>
                    <span className="text-lg font-extrabold text-cyan-400">${parseFloat(prod.price).toFixed(2)}</span>
                  </div>

                  {/* Dynamic stock adjust buttons */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-500 font-medium leading-none">Stock Levels</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleQuickAdjust(prod, -1)}
                        disabled={prod.quantity_in_stock === 0}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-sm font-bold w-6 text-center ${isLowStock ? 'text-amber-500' : 'text-slate-200'}`}>
                        {prod.quantity_in_stock}
                      </span>
                      <button 
                        onClick={() => handleQuickAdjust(prod, 1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/40 justify-between text-xs font-semibold select-none">
                  {isLowStock && (
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Low Stock Alert</span>
                    </div>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button 
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete product ${prod.name}?`)) {
                          deleteMutation.mutate(prod.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal for Create & Update */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>{selectedProduct ? 'Edit Catalog Product' : 'Add New Product'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-400">SKU Code *</label>
                  <input 
                    type="text" 
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={!!selectedProduct} // Prevent editing SKU after creation for uniqueness stability
                    placeholder="e.g., PROD-100"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Electronics"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mechanical Gaming Keyboard"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Detailed Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="Details about components, options..."
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Unit Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Initial Stock Count *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
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
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

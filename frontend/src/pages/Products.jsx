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
  Tag,
  List,
  LayoutGrid
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Products() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Tab View mode switcher ('table' | 'grid')
  const [viewMode, setViewMode] = useState('table');

  // Confirmation Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form States
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('10.00');
  const [qty, setQty] = useState(0);

  // Form validation errors state
  const [formErrors, setFormErrors] = useState({});

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
      toast.success('Product created successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create product.');
    }
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Product updated successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update product.');
    }
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Product deleted successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete product.');
    }
  });

  // Adjust stock levels dynamically
  const adjustStockMutation = useMutation({
    mutationFn: ({ id, qty }) => apiService.updateProduct(id, { quantity_in_stock: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries(['productsList']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Inventory stock adjusted successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to adjust stock levels.');
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
    setFormErrors({});
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
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Strict Client-Side Form Validations
    const errors = {};
    if (!sku.trim()) {
      errors.sku = 'SKU Code is required.';
    } else if (!selectedProduct && data?.items?.some(item => item.sku.toLowerCase() === sku.trim().toLowerCase())) {
      errors.sku = 'SKU Code must be unique. Duplicate SKU detected.';
    }

    if (!name.trim()) {
      errors.name = 'Product name is required.';
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than zero.';
    }

    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 0) {
      errors.qty = 'Initial stock level cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please resolve the highlighted form validation errors.');
      return;
    }

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      price: priceNum,
      quantity_in_stock: qtyInt,
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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
    setConfirmOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6 relative">
      {/* Premium ConfirmDialog Box for deletes */}
      <ConfirmDialog 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to permanently delete product "${productToDelete?.name}"? This will remove all catalog details and cannot be undone.`}
        confirmText="Delete SKU"
        cancelText="Abort"
        isDanger={true}
        isLoading={deleteMutation.isLoading}
      />

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
        
        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={Plus}
        >
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 backdrop-blur-md items-center justify-between">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* Tab View mode switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl flex-shrink-0 self-end sm:self-auto select-none">
          <button 
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${viewMode === 'table' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <List className="w-4 h-4" />
            <span>Table View</span>
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${viewMode === 'grid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* Main product display area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-slate-900/20 border border-slate-800/40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-900/20 border border-slate-800/40 rounded-xl" />
            ))}
          </div>
        )
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load product catalog. Ensure database service is online.
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400 font-medium">
          No products matched your search. Register a new product to begin!
        </div>
      ) : viewMode === 'table' ? (
        /* Tabular Table View Option */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="p-4">SKU</th>
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Stock Level</th>
                <th className="p-4 text-center">Status Alerts</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {data.items.map((prod) => {
                const isLowStock = prod.quantity_in_stock <= 5;
                return (
                  <tr key={prod.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-400 select-all">{prod.sku}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200 leading-tight">{prod.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{prod.description || 'No description provided.'}</div>
                    </td>
                    <td className="p-4">
                      {prod.category ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/5 text-cyan-400 border border-cyan-500/10">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{prod.category}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-extrabold text-cyan-400">${parseFloat(prod.price).toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleQuickAdjust(prod, -1)}
                          disabled={prod.quantity_in_stock === 0}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800/60 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-sm font-bold w-7 text-center ${isLowStock ? 'text-amber-500 animate-pulse' : 'text-slate-200'}`}>
                          {prod.quantity_in_stock}
                        </span>
                        <button 
                          onClick={() => handleQuickAdjust(prod, 1)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 select-none">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(prod)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Dynamic Card Grid View Option */
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
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-sm font-bold w-6 text-center ${isLowStock ? 'text-amber-500 animate-pulse' : 'text-slate-200'}`}>
                        {prod.quantity_in_stock}
                      </span>
                      <button 
                        onClick={() => handleQuickAdjust(prod, 1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
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
                      onClick={() => handleDeleteClick(prod)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 select-none">
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
                    className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                      ${formErrors.sku 
                        ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'border-slate-800 focus:border-cyan-500/60'
                      }
                    `}
                  />
                  {formErrors.sku && (
                    <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.sku}</span>
                  )}
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
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                    ${formErrors.name 
                      ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                      : 'border-slate-800 focus:border-cyan-500/60'
                    }
                  `}
                />
                {formErrors.name && (
                  <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.name}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Detailed Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2.5"
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
                    className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                      ${formErrors.price 
                        ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'border-slate-800 focus:border-cyan-500/60'
                      }
                    `}
                  />
                  {formErrors.price && (
                    <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.price}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Initial Stock Count *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    disabled={!!selectedProduct} // Managed via quick adjust or adjust stock actions
                    className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors
                      ${formErrors.qty 
                        ? 'border-rose-500/60 focus:border-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'border-slate-800 focus:border-cyan-500/60'
                      }
                    `}
                  />
                  {formErrors.qty && (
                    <span className="text-[10px] text-rose-400 font-medium tracking-wide block">{formErrors.qty}</span>
                  )}
                </div>
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
                  variant="primary"
                  isLoading={createMutation.isLoading || updateMutation.isLoading}
                >
                  {selectedProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

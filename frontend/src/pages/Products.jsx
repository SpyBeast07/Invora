import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  X,
  AlertTriangle,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Products() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form state
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('10.00');
  const [qty, setQty] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const createMutation = useMutation({
    mutationFn: apiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Product created successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create product.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Product updated successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update product.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardMetrics']);
      toast.success('Product deleted.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete product.');
    },
  });

  const openCreateModal = () => {
    setSelectedProduct(null);
    setSku(''); setName(''); setPrice('10.00'); setQty(0);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setSku(product.sku);
    setName(product.name);
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
    const errors = {};
    if (!sku.trim()) errors.sku = 'SKU is required.';
    if (!name.trim()) errors.name = 'Name is required.';
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) errors.price = 'Price must be greater than 0.';
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 0) errors.qty = 'Stock cannot be negative.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = { sku: sku.trim(), name: name.trim(), price: priceNum, quantity_in_stock: qtyInt };

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) deleteMutation.mutate(productToDelete.id);
    setConfirmOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6 relative">
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Delete "${productToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="w-8 h-8 text-cyan-400" />
            <span>Products</span>
          </h1>
          <p className="text-sm text-slate-400">Manage your product catalog and inventory.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-900/20 border border-slate-800/40 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8 border border-rose-500/15 bg-rose-500/5 text-rose-400 rounded-2xl">
          Failed to load products. Ensure the backend is running.
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-12 border border-slate-800/40 bg-slate-900/10 rounded-2xl text-slate-400">
          No products yet. Click "Add Product" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">SKU</th>
                <th className="p-4">Name</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {products.map((prod) => {
                const isLowStock = prod.quantity_in_stock <= 5;
                return (
                  <tr key={prod.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-400">{prod.sku}</td>
                    <td className="p-4 font-semibold text-slate-200">{prod.name}</td>
                    <td className="p-4 text-right font-extrabold text-cyan-400">
                      ${parseFloat(prod.price).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${isLowStock ? 'text-amber-500 animate-pulse' : 'text-slate-200'}`}>
                        {prod.quantity_in_stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
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
              <Package className="w-5 h-5 text-cyan-400" />
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">SKU *</label>
                  <input
                    type="text" required value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={!!selectedProduct}
                    placeholder="e.g., PROD-001"
                    className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.sku ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                  />
                  {formErrors.sku && <span className="text-[10px] text-rose-400">{formErrors.sku}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Unit Price ($) *</label>
                  <input
                    type="number" step="0.01" min="0.01" required
                    value={price} onChange={(e) => setPrice(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.price ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                  />
                  {formErrors.price && <span className="text-[10px] text-rose-400">{formErrors.price}</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Product Name *</label>
                <input
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mechanical Keyboard"
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.name ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                />
                {formErrors.name && <span className="text-[10px] text-rose-400">{formErrors.name}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Stock Quantity *</label>
                <input
                  type="number" min="0" required
                  value={qty} onChange={(e) => setQty(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950/60 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${formErrors.qty ? 'border-rose-500/60' : 'border-slate-800 focus:border-cyan-500/60'}`}
                />
                {formErrors.qty && <span className="text-[10px] text-rose-400">{formErrors.qty}</span>}
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button
                  type="submit" variant="primary"
                  isLoading={createMutation.isPending || updateMutation.isPending}
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

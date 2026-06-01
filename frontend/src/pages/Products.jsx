import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../components/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Products() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Products
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your product catalog and inventory.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={Plus}>
          Add Product
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Failed to load products. Ensure the backend is running.</p>
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No products yet. Click "Add Product" to create one.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Stock</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {products.map((prod) => {
                  const isLowStock = prod.quantity_in_stock <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-400">{prod.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{prod.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100 tabular-nums">
                        ${parseFloat(prod.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">
                        <span className={isLowStock ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-900 dark:text-slate-100'}>
                          {prod.quantity_in_stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isLowStock ? (
                          <Badge variant="amber">Low Stock</Badge>
                        ) : (
                          <Badge variant="green">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(prod)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950 transition-colors cursor-pointer"
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
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g., PROD-001"
              error={formErrors.sku}
              disabled={!!selectedProduct}
            />
            <Input
              label="Unit Price ($)"
              required
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={formErrors.price}
            />
          </div>

          <Input
            label="Product Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Mechanical Keyboard"
            error={formErrors.name}
          />

          <Input
            label="Stock Quantity"
            required
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            error={formErrors.qty}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

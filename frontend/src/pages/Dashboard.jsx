import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';
import MetricCard from '../components/MetricCard';
import Card from '../components/Card';
import Button from '../components/Button';
import { useToast } from '../components/ToastContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const toast = useToast();

  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: apiService.getDashboard,
    refetchInterval: 30000,
  });

  const handleManualRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard statistics refreshed.');
    } catch {
      toast.error('Failed to refresh dashboard. Is the backend running?');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="w-48 h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="w-64 h-4 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-lg mx-auto">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Unable to load dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          The backend service may be offline. Please ensure the server is running and try again.
        </p>
        <Button
          variant="primary"
          onClick={handleManualRefresh}
          isLoading={isFetching}
          icon={RefreshCw}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const hasLowStock = metrics?.low_stock_products > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of your inventory
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleManualRefresh}
          isLoading={isFetching}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={metrics?.total_products ?? 0}
          icon={Package}
          accent="blue"
        />
        <MetricCard
          title="Total Customers"
          value={metrics?.total_customers ?? 0}
          icon={Users}
          accent="green"
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.total_orders ?? 0}
          icon={ShoppingCart}
          accent="indigo"
        />
        <MetricCard
          title="Low Stock Products"
          value={metrics?.low_stock_products ?? 0}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <AlertTriangle className={`w-4 h-4 ${hasLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Low Stock
            </h3>
          </div>
          {hasLowStock ? (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {metrics.low_stock_products} product(s) have stock below the threshold of 5 units.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-3"
              >
                View products
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>All products have sufficient stock.</span>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <ShoppingCart className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick Order
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Create a new customer order and update inventory in one step.
          </p>
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white dark:text-slate-100 text-sm font-medium rounded-lg transition-colors"
          >
            <span>Create Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  ServerCrash,
  RefreshCw,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { apiService } from '../services/api';
import MetricCard from '../components/MetricCard';
import Button from '../components/Button';
import { useToast } from '../components/ToastContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const toast = useToast();

  // Query dashboard metrics from active single-query FastAPI service!
  const { 
    data: metrics, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: apiService.getDashboard,
    refetchInterval: 30000, // Refresh automatically every 30 seconds
  });

  const handleManualRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard statistics refreshed actively in real-time!');
    } catch (err) {
      toast.error('Failed to pull live stats. Is the backend service offline?');
    }
  };

  // Gorgeous Loading Skeleton States
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col gap-2">
          <div className="w-56 h-9 rounded-lg bg-slate-800" />
          <div className="w-80 h-4 rounded-lg bg-slate-800/60" />
        </div>
        
        {/* Metric Cards skeletons */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-800/30 bg-slate-900/10" />
          ))}
        </div>

        {/* Dynamic Panels skeletons */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 rounded-2xl border border-slate-800/30 bg-slate-900/10" />
          <div className="h-48 rounded-2xl border border-slate-800/30 bg-slate-900/10" />
        </div>
      </div>
    );
  }

  // Interactive Error State (If DB/backend is offline!)
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 border border-rose-500/15 bg-rose-500/5 text-slate-100 rounded-3xl backdrop-blur-md max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ServerCrash className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Cannot Connect to Invora Services</h2>
          <p className="text-sm text-slate-400 max-w-md">
            The frontend is online, but it couldn't establish a socket connection with the FastAPI backend or uninitialized database. 
          </p>
        </div>
        
        {/* Step-by-step resolution advice */}
        <div className="w-full text-left bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 space-y-3.5 text-xs font-mono text-slate-350 select-text">
          <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2 select-none">
            <Database className="w-4 h-4" />
            <span>Connection Troubleshooting Guide:</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <span className="text-slate-500">1. Spin up the Postgres database inside Docker:</span>
              <pre className="bg-slate-900/80 px-2.5 py-1.5 rounded mt-1 border border-slate-800/50 text-[11px] text-cyan-500 select-all">docker compose up -d</pre>
            </div>
            <div>
              <span className="text-slate-500">2. Verify requirements & start the backend reload:</span>
              <pre className="bg-slate-900/80 px-2.5 py-1.5 rounded mt-1 border border-slate-800/50 text-[11px] text-cyan-500 select-all">uvicorn app.main:app --reload</pre>
            </div>
          </div>
        </div>

        <Button 
          variant="primary"
          onClick={handleManualRefresh}
          isLoading={isFetching}
          icon={RefreshCw}
        >
          {isFetching ? 'Re-trying...' : 'Try Again'}
        </Button>
      </div>
    );
  }

  const hasLowStock = metrics?.low_stock_products > 0;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2 select-none">
            <span>Welcome Back</span>
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-400">
            Real-time aggregate status and operational stock monitors.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleManualRefresh}
          isLoading={isFetching}
          icon={RefreshCw}
        >
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Aggregate Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Products" 
          value={metrics?.total_products ?? 0} 
          icon={Package} 
          colorClass="text-cyan-400"
          borderClass="border-cyan-500/10"
        />
        <MetricCard 
          title="Total Customers" 
          value={metrics?.total_customers ?? 0} 
          icon={Users} 
          colorClass="text-emerald-400"
          borderClass="border-emerald-500/10"
        />
        <MetricCard 
          title="Total Sales Orders" 
          value={metrics?.total_orders ?? 0} 
          icon={ShoppingCart} 
          colorClass="text-indigo-400"
          borderClass="border-indigo-500/10"
        />
        <MetricCard 
          title="Low Stock Products" 
          value={metrics?.low_stock_products ?? 0} 
          icon={AlertTriangle} 
          colorClass={hasLowStock ? "text-amber-500 animate-pulse" : "text-slate-400"}
          borderClass={hasLowStock ? "border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.03)]" : "border-slate-800/40"}
        />
      </div>

      {/* Main dashboard panels */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Low Stock Action Board Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-sm space-y-4 hover:border-slate-700/40 transition-colors">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/50 pb-2 select-none">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Low Stock Action Board</span>
          </h3>
          {hasLowStock ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-450 leading-relaxed">
                You currently have <span className="text-amber-500 font-extrabold">{metrics.low_stock_products}</span> product(s) whose stock counts have dropped below the safe threshold of <span className="text-slate-200 font-bold">5 units</span>. Adjust stock counts inside the Products panel to restore safe inventory levels.
              </p>
              <Link 
                to="/products"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:gap-3 transition-all animate-pulse"
              >
                <span>Navigate to Products Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-4.5 border border-emerald-500/10 bg-emerald-500/5 rounded-2xl text-xs font-semibold text-emerald-400 flex items-center gap-2.5 select-none">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>All catalog products maintain high, healthy inventory stock levels! No alerts triggered.</span>
            </div>
          )}
        </div>

        {/* Quick action shortcuts panel */}
        <div className="p-6 rounded-2xl border border-slate-800/40 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-slate-700/40 transition-colors">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/50 pb-2 select-none">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Quick Checkout Console</span>
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Process customer checkouts instantly. Select registered clients and deduct product stock levels transactionally.
            </p>
          </div>
          <Link 
            to="/orders"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-sm font-semibold text-slate-200 hover:text-slate-100 rounded-xl hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer select-none"
          >
            <span>Create New Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

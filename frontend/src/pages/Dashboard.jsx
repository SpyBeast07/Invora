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
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import MetricCard from '../components/MetricCard';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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

  // Gorgeous Loading Skeleton States
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="w-48 h-8 rounded-lg bg-slate-800" />
          <div className="w-64 h-4 rounded-lg bg-slate-800/60" />
        </div>
        
        {/* Metric Cards skeletons */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-800/40 bg-slate-900/20" />
          ))}
        </div>

        {/* Audit list skeletons */}
        <div className="h-64 rounded-2xl border border-slate-800/40 bg-slate-900/20" />
      </div>
    );
  }

  // Interactive Error State (If DB/backend is offline!)
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 border border-rose-500/10 bg-rose-500/5 rounded-3xl backdrop-blur-md max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ServerCrash className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Cannot Connect to Invora Services</h2>
          <p className="text-sm text-slate-400 max-w-md">
            The frontend is online, but it couldn't establish a socket connection with the FastAPI backend. 
          </p>
        </div>
        
        {/* Step-by-step resolution advice */}
        <div className="w-full text-left bg-slate-950/60 border border-slate-800/60 rounded-xl p-5 space-y-3.5 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
            <Database className="w-4 h-4" />
            <span>Connection Troubleshooting Guide:</span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-500">1. Spin up the Postgres database inside Docker:</span>
              <pre className="bg-slate-900/80 px-2.5 py-1.5 rounded mt-1 border border-slate-800/50 text-[11px] text-cyan-500 select-all">docker compose up -d</pre>
            </div>
            <div>
              <span className="text-slate-500">2. Activate the virtual environment & start the server:</span>
              <pre className="bg-slate-900/80 px-2.5 py-1.5 rounded mt-1 border border-slate-800/50 text-[11px] text-cyan-500 select-all">source venv/bin/activate && uvicorn app.main:app --reload</pre>
            </div>
          </div>
        </div>

        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-sm font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all duration-300 select-none cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Re-trying...' : 'Try Again'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>Welcome Back</span>
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-400">
            Real-time aggregate status and operational stock monitors.
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 self-start px-4 py-2 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-200 rounded-xl hover:bg-slate-800/40 select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Aggregate Metric Cards grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Products" 
          value={metrics.total_products} 
          icon={Package} 
          colorClass="text-cyan-400"
          borderClass="border-cyan-500/10"
        />
        <MetricCard 
          title="Total Customers" 
          value={metrics.total_customers} 
          icon={Users} 
          colorClass="text-emerald-400"
          borderClass="border-emerald-500/10"
        />
        <MetricCard 
          title="Total Sales Orders" 
          value={metrics.total_orders} 
          icon={ShoppingCart} 
          colorClass="text-indigo-400"
          borderClass="border-indigo-500/10"
        />
        {/* Warning card for low stock alerts */}
        <MetricCard 
          title="Low Stock Warning Items" 
          value={metrics.low_stock_products} 
          icon={AlertTriangle} 
          colorClass={metrics.low_stock_products > 0 ? "text-amber-500" : "text-slate-400"}
          borderClass={metrics.low_stock_products > 0 ? "border-amber-500/20" : "border-slate-800/40"}
        />
      </div>

      {/* Actions and Status Blocks */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/40 bg-slate-900/20 space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Low Stock Action Board</span>
          </h3>
          {metrics.low_stock_products > 0 ? (
            <div className="space-y-3.5">
              <p className="text-sm text-slate-400">
                You currently have <span className="text-amber-500 font-bold">{metrics.low_stock_products}</span> product(s) whose stock counts have dropped below the safe threshold of **5 items**. Please adjust stock counts inside the Products panel.
              </p>
              <Link 
                to="/products"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <span>Navigate to Products Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-4 border border-emerald-500/10 bg-emerald-500/5 rounded-xl text-sm text-emerald-400">
              ✓ All catalog products maintain high, healthy inventory stock levels! No alerts triggered.
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/40 bg-slate-900/20 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
              <span>Checkout Drawer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Process customer checkouts instantly. Select registered clients and deduct stock values transactionally.
            </p>
          </div>
          <Link 
            to="/orders"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700/80 text-sm font-semibold text-slate-200 hover:text-slate-100 rounded-xl transition-all duration-300 shadow-md cursor-pointer"
          >
            <span>Create New Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

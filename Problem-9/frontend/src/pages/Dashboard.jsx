import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  Receipt,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Camera
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { EmptyState } from '../components/EmptyState';
import { TransactionModal } from '../components/TransactionModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { AiInvoiceScannerModal } from '../components/AiInvoiceScannerModal';
import { Receipt as ReceiptIcon } from 'lucide-react';

const TIME_FILTERS = [
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all_time', label: 'All Time' },
];

export const Dashboard = () => {
  const [period, setPeriod] = useState('this_month');
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);
  const [aiScannerOpen, setAiScannerOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, catRes, monRes, trendRes, insRes, txRes, accRes] = await Promise.all([
        api.dashboard.getSummary(period),
        api.dashboard.getCategoryExpenses(period),
        api.dashboard.getMonthlySummary(6),
        api.dashboard.getTrend(period),
        api.dashboard.getInsights(),
        api.transactions.list({ limit: 8, sort_by: 'id', sort_order: 'desc' }),
        api.accounts.list()
      ]);

      setSummary(sumRes);
      setCategories(catRes || []);
      setMonthlyData(monRes || []);
      setTrendData(trendRes || []);
      setInsights(insRes || null);
      setRecentTransactions(txRes?.items || []);
      setAccounts(accRes || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();

    // Listen to global quick add updates
    const handleGlobalUpdate = () => fetchDashboardData();
    window.addEventListener('transaction-updated', handleGlobalUpdate);
    return () => window.removeEventListener('transaction-updated', handleGlobalUpdate);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8">
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-account tracking across Demat, Insurance, Credit Cards, and Daily expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.key}
                onClick={() => setPeriod(tf.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  period === tf.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* AI Scan Invoice Button */}
          <button
            onClick={() => setAiScannerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 active:scale-95 transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
            AI Scan Invoice
          </button>
        </div>
      </div>

      {/* Smart Financial Insights Banner */}
      {insights && insights.smart_tip && (
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 dark:border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                AI Financial Insight & Health Tip
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {insights.smart_tip}
              </p>
            </div>
          </div>
          <Link
            to="/insights"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            View all insights <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Net Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Balance
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(summary?.total_balance || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bank, Demat & Cash assets
            </div>
          </div>
        </div>

        {/* Total Income in Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary?.total_income || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Salary, dividends, freelance
            </div>
          </div>
        </div>

        {/* Total Expenses in Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(summary?.total_expenses || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summary?.period_label || 'Selected Period'}
            </div>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(summary?.this_month_expenses || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Current calendar outflow
            </div>
          </div>
        </div>

        {/* Transactions Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transactions
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {summary?.transaction_count || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recorded in period
            </div>
          </div>
        </div>
      </div>

      {/* Account Snapshot Pills */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Connected Accounts & Holdings
          </span>
          <Link to="/accounts" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Manage Accounts →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {accounts.slice(0, 6).map((acc) => {
            const isCard = acc.type === 'Credit Card';
            return (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {acc.name}
                </div>
                <div className={`text-sm font-bold mt-1 ${isCard ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(acc.current_balance)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {acc.type}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut Expense by Category */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Expenses by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spending distribution for {summary?.period_label || 'this period'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {categories.length} Categories
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="py-12 flex-1 flex items-center justify-center">
              <EmptyState
                title="No expenses recorded"
                description="Add expenses in this time period to view the breakdown."
                actionText="Add Expense"
                onAction={() => setModalOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="total_amount"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Spent']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend with Percentages */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.slice(0, 6).map((c) => (
                  <div key={c.category_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {c.category_name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.total_amount)}
                      </span>
                      <span className="text-slate-400 ml-1.5 font-medium">
                        ({c.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Monthly Income vs Expenses (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Income vs Expenses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cashflow comparison over the last 6 months
              </p>
            </div>
          </div>

          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name === 'income' ? 'Income' : 'Expense']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Visualizations: Spending Trend & Category Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Line Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Spending Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cumulative outflow progression during {summary?.period_label}
              </p>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => {
                    const parts = d.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(val),
                    name === 'cumulative' ? 'Cumulative Spent' : 'Daily Outflow'
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="cumulative"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="amount"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Outflow Categories Progress Bars */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Top Outflows
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Heaviest spending buckets
          </p>

          <div className="space-y-4">
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.category_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {cat.category_name}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.total_amount)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, cat.percentage)}%`,
                      backgroundColor: cat.color || '#6366F1'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest financial activity across your accounts
            </p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all transactions <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Record your first transaction to start tracking your expenses."
            actionText="Add Transaction"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3 pl-2">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center pr-2">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'Income';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setReceiptTx(tx)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      title="Click to view digital receipt"
                    >
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {tx.title}
                          </span>
                          {tx.receipt_image_url && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium border border-indigo-200/60 dark:border-indigo-800/60 shrink-0" title="Receipt photo attached">
                              <Camera className="w-3 h-3" />
                              Receipt
                            </span>
                          )}
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <CategoryIcon iconName={tx.category?.icon} className="w-3.5 h-3.5" color={tx.category?.color} />
                          {tx.category?.name || 'Other'}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.account?.name || 'Default'}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3.5 text-right font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        {tx.currency && tx.currency !== 'INR' && tx.original_amount && (
                          <div className="text-[11px] font-medium text-slate-400">
                            {formatCurrency(tx.original_amount, tx.currency)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-center pr-2 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptTx(tx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                          title="View Digital Receipt"
                        >
                          <ReceiptIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {/* Digital Transaction Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
        transaction={receiptTx}
      />

      {/* AI Smart Invoice Scanner Modal */}
      <AiInvoiceScannerModal
        isOpen={aiScannerOpen}
        onClose={() => setAiScannerOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
          window.dispatchEvent(new CustomEvent('transaction-updated'));
        }}
      />
    </div>
  );
};

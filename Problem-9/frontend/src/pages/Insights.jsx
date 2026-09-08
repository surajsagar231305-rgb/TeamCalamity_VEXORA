import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Lightbulb,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Insights = () => {
  const { addToast } = useToast();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.getInsights();
      setInsights(res);
    } catch (err) {
      addToast("Failed to calculate financial insights", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const handleUpdate = () => fetchInsights();
    window.addEventListener('transaction-updated', handleUpdate);
    return () => window.removeEventListener('transaction-updated', handleUpdate);
  }, [fetchInsights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-indigo-500" />
          Financial Insights & Intelligence
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time algorithmic analytics computed directly from your database records.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-slate-400">
          Calculating data patterns and insights...
        </div>
      ) : !insights ? (
        <EmptyState
          title="No data available for insights"
          description="Record a few transactions to unlock automatic intelligence."
        />
      ) : (
        <div className="space-y-6">
          {/* Smart AI Tip Hero Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/15 text-white backdrop-blur-xs shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Algorithmic Advisory Tip
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-1 leading-snug">
                  {insights.smart_tip}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-indigo-100">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Savings Rate: {insights.savings_rate_percent}%
                  </span>
                  {insights.mom_spending_change_percent !== null && (
                    <span className="flex items-center gap-1.5">
                      {insights.mom_spending_change_percent > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-rose-300" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-emerald-300" />
                      )}
                      MoM Outflow Change: {insights.mom_spending_change_percent > 0 ? '+' : ''}
                      {insights.mom_spending_change_percent}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Highest Spending Category */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Highest Outflow Category
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {insights.highest_spending_category?.name || 'None'}
                </div>
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(insights.highest_spending_category?.amount || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Largest spending category this month
                </div>
              </div>
            </div>

            {/* 2. Lowest Spending Category */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Lowest Outflow Category
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {insights.lowest_spending_category?.name || 'None'}
                </div>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(insights.lowest_spending_category?.amount || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Smallest active expense category
                </div>
              </div>
            </div>

            {/* 3. Average Daily Spending */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Daily Spending Velocity
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(insights.average_daily_spending)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Average expense outflow per day this month
                </div>
              </div>
            </div>

            {/* 4. Largest Single Transaction */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Largest Single Expense
                </span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {insights.largest_transaction?.title || 'No expenses recorded'}
                </div>
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(insights.largest_transaction?.amount || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Category: {insights.largest_transaction?.category || 'None'} ({insights.largest_transaction?.date})
                </div>
              </div>
            </div>

            {/* 5. Most Used Payment Method */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Preferred Payment Mode
                </span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {insights.most_frequent_payment_method?.method || 'UPI'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Used across {insights.most_frequent_payment_method?.count || 0} transactions
                </div>
              </div>
            </div>

            {/* 6. Budget Utilization */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Budget Utilization
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {insights.budget_utilization_percent !== null ? `${insights.budget_utilization_percent}%` : 'Not Set'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Current month target fulfillment
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { TransactionModal } from '../components/TransactionModal';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const CreditCards = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, txRes] = await Promise.all([
        api.creditCards.getSummary(),
        api.creditCards.getTransactions()
      ]);
      setSummary(sumRes);
      setTransactions(txRes || []);
    } catch (err) {
      addToast("Failed to load credit card data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('transaction-updated', handleUpdate);
    return () => window.removeEventListener('transaction-updated', handleUpdate);
  }, [fetchData]);

  const handleToggleStatus = async (txId) => {
    try {
      const res = await api.creditCards.toggleStatus(txId);
      addToast(res.message || "Status updated!");
      fetchData();
      window.dispatchEvent(new CustomEvent('transaction-updated'));
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Credit Card Financial Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor statement cycles, outstanding dues, credit utilization, and settlement statuses.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Record Card Charge
        </button>
      </div>

      {/* Credit Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Outstanding Due
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(summary?.total_outstanding || 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Current balance across cards
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Credit Limit
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary?.total_credit_limit || 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total approved card limit
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Credit Utilization
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summary?.overall_utilization_percent || 0}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (summary?.overall_utilization_percent || 0) > 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary?.overall_utilization_percent || 0)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settlement Status
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {summary?.unpaid_count || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">Unpaid dues</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
              {summary?.paid_count || 0} Paid
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statement cycle status
          </div>
        </div>
      </div>

      {/* Credit Card Transactions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Card Expenses & Bill Dues
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click "Mark Paid" once you settle your credit card statement.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {transactions.length} Card Records
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            Loading credit card records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No credit card transactions"
              description="Record a card purchase with an optional due date to track your statement cycle."
              actionText="Add Card Transaction"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 pl-6">Transaction</th>
                  <th className="py-3.5">Card / Account</th>
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5">Date</th>
                  <th className="py-3.5">Due Date</th>
                  <th className="py-3.5 text-right">Amount</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="py-3.5 text-center pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPaid = tx.status === 'Paid';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.title}
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {tx.account?.name || 'Credit Card'}
                        </div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <CategoryIcon iconName={tx.category?.icon} className="w-3.5 h-3.5" color={tx.category?.color} />
                          {tx.category?.name || 'Shopping'}
                        </span>
                      </td>

                      <td className="py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-4 text-xs whitespace-nowrap">
                        {tx.due_date ? (
                          <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(tx.due_date)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 text-right whitespace-nowrap font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(tx.amount)}
                      </td>

                      <td className="py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isPaid ? 'Settled' : 'Due / Unpaid'}
                        </span>
                      </td>

                      <td className="py-4 text-center pr-6 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(tx.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <RotateCcw className="w-3 h-3" /> Mark Unpaid
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" /> Mark Paid
                            </>
                          )}
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
        onSuccess={fetchData}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Shield,
  Activity,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { TransactionModal } from '../components/TransactionModal';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const InsuranceMedical = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, txRes] = await Promise.all([
        api.insurance.getSummary(),
        api.insurance.getTransactions()
      ]);
      setSummary(sumRes);
      setTransactions(txRes || []);
    } catch (err) {
      addToast("Failed to load insurance and medical data", "error");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Insurance & Healthcare Expenses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track policy renewals, life/health premiums, doctor fees, hospital diagnostics, and pharmacy bills.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Record Policy / Medical Bill
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Insurance Premiums
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary?.total_insurance_premium || 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Health & Life policy protection
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Medical & Pharmacy
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary?.total_medical_expenses || 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consultations, pharmacy, diagnostics
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Healthcare Spend
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary?.total_healthcare_spend || 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Combined health and insurance outflow
          </div>
        </div>
      </div>

      {/* Active Policies Cards */}
      {summary?.active_policies && summary.active_policies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Active Insurance Policies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.active_policies.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.policy_name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {p.category}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Last Premium Paid</span>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {formatCurrency(p.last_paid_amount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Outflow</span>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {formatCurrency(p.total_contributed)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Paid on {p.last_payment_date}</span>
                  {p.next_due_date && (
                    <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Next Due: {p.next_due_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance & Medical Transactions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Healthcare & Insurance History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of medical expenses and premium instalments.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {transactions.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            Loading healthcare records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No healthcare or insurance records"
              description="Record a doctor visit, medical test, or policy premium."
              actionText="Add Healthcare Expense"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 pl-6">Description</th>
                  <th className="py-3.5">Policy / Reference</th>
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5">Account</th>
                  <th className="py-3.5">Date</th>
                  <th className="py-3.5 text-right pr-6">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map((tx) => (
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

                    <td className="py-4 whitespace-nowrap text-xs">
                      {tx.policy_name ? (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {tx.policy_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Direct Expense</span>
                      )}
                    </td>

                    <td className="py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <CategoryIcon iconName={tx.category?.icon} className="w-3.5 h-3.5" color={tx.category?.color} />
                        {tx.category?.name || 'Medical'}
                      </span>
                    </td>

                    <td className="py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {tx.account?.name || 'Default'}
                    </td>

                    <td className="py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>

                    <td className="py-4 pr-6 text-right whitespace-nowrap font-bold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
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

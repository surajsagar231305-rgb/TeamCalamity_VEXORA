import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { BudgetModal } from '../components/BudgetModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Budgets = () => {
  const { addToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.budgets.list(selectedMonth, selectedYear);
      setBudgets(res || []);
    } catch (err) {
      addToast("Failed to load budgets", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await api.budgets.delete(budgetToDelete.id);
      addToast("Budget target deleted");
      fetchBudgets();
    } catch (err) {
      addToast(err.message || "Failed to delete budget", "error");
    }
  };

  // Separate overall monthly budget from category budgets
  const overallBudget = budgets.find(b => b.category_id === null);
  const categoryBudgets = budgets.filter(b => b.category_id !== null);

  const totalSpentAcrossCategories = categoryBudgets.reduce((acc, b) => acc + b.spent, 0);
  const totalBudgetCap = overallBudget ? overallBudget.amount_limit : categoryBudgets.reduce((acc, b) => acc + b.amount_limit, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Plan monthly limits, track real spending against targets, and prevent overspending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Year Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-transparent border-none text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-transparent border-none text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedBudget(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Overall Monthly Budget Hero Card */}
      {overallBudget && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  Overall Monthly Target
                </span>
                {overallBudget.is_over_budget ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 border border-rose-400/30 text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget Exceeded!
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On Track
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {formatCurrency(overallBudget.spent)} spent of {formatCurrency(overallBudget.amount_limit)}
              </h2>
              <p className="text-xs text-indigo-200/80">
                Remaining: {formatCurrency(overallBudget.remaining)} ({100 - Math.min(100, overallBudget.percentage_used)}% left)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-extrabold text-indigo-300">
                  {overallBudget.percentage_used}%
                </div>
                <div className="text-xs text-indigo-200/70">Utilized</div>
              </div>
              <button
                onClick={() => {
                  setSelectedBudget(overallBudget);
                  setModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                title="Edit Budget"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallBudget.is_over_budget
                  ? 'bg-rose-500'
                  : overallBudget.percentage_used > 80
                  ? 'bg-amber-400'
                  : 'bg-indigo-400'
              }`}
              style={{ width: `${Math.min(100, overallBudget.percentage_used)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Specific Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Category Spending Limits
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {categoryBudgets.length} Targets Defined
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            Loading budgets...
          </div>
        ) : categoryBudgets.length === 0 ? (
          <EmptyState
            title="No category budgets configured"
            description="Set spending caps on Food, Shopping, Utilities, or Entertainment to stay within financial limits."
            actionText="Add Category Budget"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => {
              const isOver = b.is_over_budget;
              const isWarning = b.warning_level === 'warning';

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: b.category_color || '#6366F1' }}
                        >
                          <CategoryIcon iconName={b.category_icon} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                            {b.category_name}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Limit: {formatCurrency(b.amount_limit)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedBudget(b);
                            setModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setBudgetToDelete(b);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Spent & Remaining metrics */}
                    <div className="mt-4 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Spent</span>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatCurrency(b.spent)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400">Remaining</span>
                        <div className={`text-sm font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatCurrency(b.remaining)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Tag */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {b.percentage_used}% used
                    </span>

                    {isOver ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Exceeded by {formatCurrency(b.spent - b.amount_limit)}
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" /> Approaching Limit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Within Budget
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        budget={selectedBudget}
        onSuccess={fetchBudgets}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBudgetToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Budget Target"
        message={`Are you sure you want to remove the budget target for "${budgetToDelete?.category_name}"?`}
      />
    </div>
  );
};

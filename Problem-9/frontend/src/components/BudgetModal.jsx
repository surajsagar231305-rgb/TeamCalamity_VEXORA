import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export const BudgetModal = ({ isOpen, onClose, budget = null, onSuccess }) => {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const now = new Date();
  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    category_id: '',
    amount_limit: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (budget) {
        setForm({
          month: budget.month || now.getMonth() + 1,
          year: budget.year || now.getFullYear(),
          category_id: budget.category_id ? String(budget.category_id) : '',
          amount_limit: budget.amount_limit ? String(budget.amount_limit) : ''
        });
      } else {
        setForm({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          category_id: '',
          amount_limit: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, budget]);

  const loadCategories = async () => {
    try {
      const cats = await api.categories.list('Expense');
      setCategories(cats);
    } catch (err) {
      addToast("Failed to load categories for budget", "error");
    }
  };

  const validate = () => {
    const errs = {};
    const limit = parseFloat(form.amount_limit);
    if (isNaN(limit) || limit <= 0) {
      errs.amount_limit = "Budget limit must be a positive number greater than 0";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (budget) {
        await api.budgets.update(budget.id, {
          amount_limit: parseFloat(form.amount_limit)
        });
        addToast("Budget limit updated successfully!");
      } else {
        await api.budgets.create({
          month: parseInt(form.month, 10),
          year: parseInt(form.year, 10),
          category_id: form.category_id ? parseInt(form.category_id, 10) : null,
          amount_limit: parseFloat(form.amount_limit)
        });
        addToast("New budget target created successfully!");
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to save budget", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budget ? "Edit Budget Target" : "Set Monthly / Category Budget"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Budget Scope *
          </label>
          <select
            disabled={Boolean(budget)}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
          >
            <option value="">Overall Monthly Budget (All Expenses)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Category Specific)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              disabled={Boolean(budget)}
              value={form.month}
              onChange={(e) => setForm({ ...form, month: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              disabled={Boolean(budget)}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Budget Spending Limit (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">₹</span>
            <input
              type="number"
              step="500"
              value={form.amount_limit}
              onChange={(e) => setForm({ ...form, amount_limit: e.target.value })}
              placeholder="e.g. 50000"
              className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.amount_limit ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          </div>
          {errors.amount_limit && <p className="text-xs text-rose-500 mt-1">{errors.amount_limit}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Saving...' : budget ? 'Update Limit' : 'Set Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

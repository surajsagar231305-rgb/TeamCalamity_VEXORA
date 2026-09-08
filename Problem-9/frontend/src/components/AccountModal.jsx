import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

const ACCOUNT_TYPES = [
  'Savings',
  'Current',
  'Cash Wallet',
  'Credit Card',
  'Debit Card',
  'Demat Account',
  'Investment Account',
  'Other'
];

export const AccountModal = ({ isOpen, onClose, account = null, onSuccess }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    type: 'Savings',
    opening_balance: '',
    account_number_last4: '',
    credit_limit: '',
    due_date_day: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setForm({
          name: account.name || '',
          type: account.type || 'Savings',
          opening_balance: account.opening_balance !== undefined ? String(account.opening_balance) : '0',
          account_number_last4: account.account_number_last4 || '',
          credit_limit: account.credit_limit ? String(account.credit_limit) : '',
          due_date_day: account.due_date_day ? String(account.due_date_day) : '',
          notes: account.notes || ''
        });
      } else {
        setForm({
          name: '',
          type: 'Savings',
          opening_balance: '0',
          account_number_last4: '',
          credit_limit: '',
          due_date_day: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, account]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Account name is required";
    if (form.opening_balance === '' || isNaN(parseFloat(form.opening_balance))) {
      errs.opening_balance = "Valid opening balance is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        opening_balance: parseFloat(form.opening_balance) || 0.0,
        account_number_last4: form.account_number_last4.trim() || null,
        credit_limit: form.type === 'Credit Card' && form.credit_limit ? parseFloat(form.credit_limit) : 0.0,
        due_date_day: form.type === 'Credit Card' && form.due_date_day ? parseInt(form.due_date_day, 10) : null,
        notes: form.notes.trim() || null
      };

      if (account) {
        await api.accounts.update(account.id, payload);
        addToast("Account updated successfully!");
      } else {
        await api.accounts.create(payload);
        addToast("New account added successfully!");
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to save account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Edit Account" : "Add New Account / Card"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Account Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. HDFC Salary, Zerodha Demat, ICICI Card"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.name ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Account Type *
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Opening Balance (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              placeholder="0.00"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.opening_balance ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.opening_balance && <p className="text-xs text-rose-500 mt-1">{errors.opening_balance}</p>}
          </div>
        </div>

        {form.type === 'Credit Card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
            <div>
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                step="1000"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                placeholder="e.g. 150000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
                Due Date (Day of Month)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.due_date_day}
                onChange={(e) => setForm({ ...form, due_date_day: e.target.value })}
                placeholder="e.g. 18"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Last 4 Digits / Acc Ref (Optional)
          </label>
          <input
            type="text"
            maxLength={10}
            value={form.account_number_last4}
            onChange={(e) => setForm({ ...form, account_number_last4: e.target.value })}
            placeholder="e.g. 4892"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Purpose, interest rates, or card benefits"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
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
            {submitting ? 'Saving...' : account ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

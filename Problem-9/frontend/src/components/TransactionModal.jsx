import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { toInputDateValue, CURRENCY_SYMBOLS, CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import { Upload, X, Loader2, Image as ImageIcon, Globe } from 'lucide-react';

const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
  'Cash',
  'Other'
];

export const TransactionModal = ({ isOpen, onClose, transaction = null, onSuccess }) => {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    amount: '',
    original_amount: '',
    currency: 'INR',
    exchange_rate: 1.0,
    type: 'Expense',
    category_id: '',
    account_id: '',
    date: toInputDateValue(),
    payment_method: 'UPI',
    notes: '',
    is_credit_due: false,
    due_date: '',
    status: 'Completed',
    policy_name: '',
    receipt_image_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
      if (transaction) {
        setForm({
          title: transaction.title || '',
          amount: transaction.amount ? String(transaction.amount) : '',
          original_amount: transaction.original_amount ? String(transaction.original_amount) : (transaction.amount ? String(transaction.amount) : ''),
          currency: transaction.currency || 'INR',
          exchange_rate: transaction.exchange_rate || 1.0,
          type: transaction.type || 'Expense',
          category_id: transaction.category_id ? String(transaction.category_id) : '',
          account_id: transaction.account_id ? String(transaction.account_id) : '',
          date: transaction.date ? toInputDateValue(transaction.date) : toInputDateValue(),
          payment_method: transaction.payment_method || 'UPI',
          notes: transaction.notes || '',
          is_credit_due: Boolean(transaction.is_credit_due),
          due_date: transaction.due_date ? toInputDateValue(transaction.due_date) : '',
          status: transaction.status || 'Completed',
          policy_name: transaction.policy_name || '',
          receipt_image_url: transaction.receipt_image_url || ''
        });
      } else {
        setForm({
          title: '',
          amount: '',
          original_amount: '',
          currency: 'INR',
          exchange_rate: 1.0,
          type: 'Expense',
          category_id: '',
          account_id: '',
          date: toInputDateValue(),
          payment_method: 'UPI',
          notes: '',
          is_credit_due: false,
          due_date: '',
          status: 'Completed',
          policy_name: '',
          receipt_image_url: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast("Image size must be under 8MB", "error");
      return;
    }

    setUploadingImage(true);
    try {
      // 1. Read as local Data URL for immediate preview and fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({ ...prev, receipt_image_url: event.target.result }));
      };
      reader.readAsDataURL(file);

      // 2. Upload and run AI Auto-Fill on form
      try {
        const scanRes = await api.transactions.scanInvoice(file);
        if (scanRes) {
          const detectedCurr = scanRes.currency || 'INR';
          const detectedRate = scanRes.exchange_rate || (CURRENCY_RATES[detectedCurr] || 1.0);
          const origAmt = scanRes.original_amount !== undefined && scanRes.original_amount !== null ? scanRes.original_amount : scanRes.amount;
          const inrAmt = scanRes.amount !== undefined && scanRes.amount !== null ? scanRes.amount : (origAmt * detectedRate);

          setForm(prev => ({
            ...prev,
            title: prev.title || scanRes.title || '',
            amount: inrAmt ? String(inrAmt) : prev.amount,
            original_amount: String(origAmt || ''),
            currency: detectedCurr,
            exchange_rate: detectedRate,
            category_id: prev.category_id || (scanRes.category_id ? String(scanRes.category_id) : prev.category_id),
            account_id: prev.account_id || (scanRes.account_id ? String(scanRes.account_id) : prev.account_id),
            payment_method: prev.payment_method || scanRes.payment_method || 'UPI',
            notes: prev.notes || scanRes.notes || '',
            policy_name: prev.policy_name || scanRes.policy_name || '',
            receipt_image_url: scanRes.receipt_image_url || prev.receipt_image_url
          }));
          addToast("✨ AI auto-filled details, currency & category from receipt!");
        }
      } catch (_) {
        // Fallback: simple upload
        try {
          const uploadRes = await api.transactions.uploadReceipt(file);
          if (uploadRes?.url) {
            setForm(prev => ({ ...prev, receipt_image_url: uploadRes.url }));
          }
          addToast("Receipt photo attached successfully!");
        } catch (e) {
          // Local base64 data preserved
        }
      }
    } catch (err) {
      addToast("Failed to process image file", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCurrencyChange = (newCurr) => {
    const rate = CURRENCY_RATES[newCurr] || 1.0;
    const orig = parseFloat(form.original_amount) || parseFloat(form.amount) || 0;
    const inr = newCurr === 'INR' ? orig : +(orig * rate).toFixed(2);
    setForm(prev => ({
      ...prev,
      currency: newCurr,
      exchange_rate: rate,
      original_amount: String(orig),
      amount: String(inr)
    }));
  };

  const handleOriginalAmountChange = (val) => {
    const orig = parseFloat(val) || 0;
    const rate = form.exchange_rate || (CURRENCY_RATES[form.currency] || 1.0);
    const inr = form.currency === 'INR' ? orig : +(orig * rate).toFixed(2);
    setForm(prev => ({
      ...prev,
      original_amount: val,
      amount: String(inr)
    }));
  };

  const handleInrAmountChange = (val) => {
    const inr = parseFloat(val) || 0;
    const rate = form.exchange_rate || (CURRENCY_RATES[form.currency] || 1.0);
    const orig = form.currency === 'INR' ? inr : +(inr / rate).toFixed(2);
    setForm(prev => ({
      ...prev,
      amount: val,
      original_amount: String(orig)
    }));
  };

  const loadDropdowns = async () => {
    setLoading(true);
    try {
      const [cats, accs] = await Promise.all([
        api.categories.list(),
        api.accounts.list()
      ]);
      setCategories(cats || []);
      setAccounts(accs || []);

      // Set defaults if empty
      if (!transaction) {
        if (accs?.length > 0) {
          setForm(prev => ({ ...prev, account_id: String(accs[0].id) }));
        }
        if (cats?.length > 0) {
          setForm(prev => ({ ...prev, category_id: String(cats.find((category) => category.type === prev.type)?.id || '') }));
        }
      }
    } catch (err) {
      addToast("Failed to load categories or accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === form.type);

  // If type changes and current category doesn't match, auto-select first matching category
  const handleTypeToggle = (newType) => {
    const matching = categories.filter(c => c.type === newType);
    setForm(prev => ({
      ...prev,
      type: newType,
      category_id: matching.length > 0 ? String(matching[0].id) : ''
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) {
      errs.title = "Title is required";
    }
    const numAmount = parseFloat(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Amount must be a valid number greater than 0";
    }
    if (!form.category_id) {
      errs.category_id = "Please select a category";
    }
    if (!form.account_id) {
      errs.account_id = "Please select an account";
    }
    if (!form.date) {
      errs.date = "Please select a date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const now = new Date();
      let txDate = new Date(form.date);
      if (isNaN(txDate.getTime())) txDate = now;
      txDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const numAmount = parseFloat(form.amount);
      const origAmount = form.currency !== 'INR' ? (parseFloat(form.original_amount) || numAmount) : numAmount;
      const rate = parseFloat(form.exchange_rate) || 1.0;

      const payload = {
        title: form.title.trim(),
        amount: numAmount,
        original_amount: origAmount,
        currency: form.currency || 'INR',
        exchange_rate: rate,
        type: form.type,
        category_id: parseInt(form.category_id, 10),
        account_id: parseInt(form.account_id, 10),
        date: txDate.toISOString(),
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
        is_credit_due: Boolean(form.is_credit_due),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: form.status,
        policy_name: form.policy_name.trim() || null,
        receipt_image_url: form.receipt_image_url || null
      };

      if (transaction) {
        await api.transactions.update(transaction.id, payload);
        addToast("Transaction updated successfully!");
      } else {
        await api.transactions.create(payload);
        addToast("Transaction recorded successfully!");
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to save transaction", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? "Edit Transaction" : "Record New Transaction"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income / Expense Toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => handleTypeToggle('Expense')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              form.type === 'Expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle('Income')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              form.type === 'Income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Income
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Title / Description *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Swiggy Gourmet, Monthly Salary"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.title ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
        </div>

        {/* Currency and Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(CURRENCY_RATES).map((curr) => (
                <option key={curr} value={curr}>
                  {curr} ({CURRENCY_SYMBOLS[curr] || ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              {form.currency !== 'INR' ? `Bill (${CURRENCY_SYMBOLS[form.currency] || form.currency}) *` : 'Amount (₹) *'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.currency !== 'INR' ? form.original_amount : form.amount}
              onChange={(e) => {
                if (form.currency !== 'INR') {
                  handleOriginalAmountChange(e.target.value);
                } else {
                  handleInrAmountChange(e.target.value);
                }
              }}
              placeholder="0.00"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.amount ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Base Amount (₹ INR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => handleInrAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {form.currency !== 'INR' && (
          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <span>Exchange rate: 1 {form.currency} = ₹{form.exchange_rate} INR</span>
            <span className="font-mono font-bold">{CURRENCY_SYMBOLS[form.currency] || ''}{form.original_amount} {form.currency} ≈ ₹{form.amount}</span>
          </div>
        )}

        {/* Category & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.category_id ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <option value="">Select Category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-rose-500 mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Account / Card *
            </label>
            <select
              value={form.account_id}
              onChange={(e) => {
                const accId = e.target.value;
                const acc = accounts.find(a => String(a.id) === accId);
                const isCard = acc && acc.type === 'Credit Card';
                setForm({ 
                  ...form, 
                  account_id: accId,
                  payment_method: isCard ? 'Credit Card' : form.payment_method,
                  is_credit_due: isCard ? true : form.is_credit_due
                });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.account_id ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <option value="">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
            {errors.account_id && <p className="text-xs text-rose-500 mt-1">{errors.account_id}</p>}
          </div>
        </div>

        {/* Date and Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.date ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Insurance / Medical & Credit Card Optional Details */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Specialized Tracking (Credit Due / Policy)
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <input
                type="checkbox"
                checked={form.is_credit_due}
                onChange={(e) => setForm({ ...form, is_credit_due: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Mark as Credit Card / Due Amount
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Policy Name / Card Reference (Optional)
              </label>
              <input
                type="text"
                value={form.policy_name}
                onChange={(e) => setForm({ ...form, policy_name: e.target.value })}
                placeholder="e.g. Star Health #SH-1029 or Regalia Due"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Due Date / Renewal Date (Optional)
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Attach Receipt / Bill Photo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Attach Receipt / Bill Photo (Optional)
            </label>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
              ✨ Auto-Fills with AI
            </span>
          </div>

          {form.receipt_image_url ? (
            <div className="relative p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <img
                src={form.receipt_image_url}
                alt="Receipt Preview"
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Receipt Photo Attached
                </div>
                <p className="text-[11px] text-slate-400">
                  Ready to save with transaction details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, receipt_image_url: '' }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition-colors group">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading receipt photo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Click or drag to upload receipt/bill photo
                  </>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                JPG, PNG, WebP up to 8MB
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Notes / Tags (Optional)
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add any extra notes or memo for this transaction..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Modal Actions */}
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
            {submitting ? 'Saving...' : transaction ? 'Update Transaction' : 'Record Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

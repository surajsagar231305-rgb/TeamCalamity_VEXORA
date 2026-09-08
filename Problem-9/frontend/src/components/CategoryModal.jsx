import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CategoryIcon, AVAILABLE_ICONS } from '../utils/iconMap';

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

export const CategoryModal = ({ isOpen, onClose, category = null, onSuccess }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    type: 'Expense',
    icon: 'tag',
    color: '#6366F1',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setForm({
          name: category.name || '',
          type: category.type || 'Expense',
          icon: category.icon || 'tag',
          color: category.color || '#6366F1',
          description: category.description || ''
        });
      } else {
        setForm({
          name: '',
          type: 'Expense',
          icon: 'tag',
          color: '#6366F1',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Category name is required";
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
        icon: form.icon,
        color: form.color,
        description: form.description.trim() || null
      };

      if (category) {
        await api.categories.update(category.id, payload);
        addToast("Category updated successfully!");
      } else {
        await api.categories.create(payload);
        addToast("Custom category created successfully!");
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to save category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Create New Category"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'Expense' })}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              form.type === 'Expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Expense Category
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'Income' })}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              form.type === 'Income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Income Category
          </button>
        </div>

        {/* Category Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Category Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Subscriptions, Crypto, Gym"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.name ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setForm({ ...form, icon: iconName })}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                  form.icon === iconName
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={iconName}
              >
                <CategoryIcon iconName={iconName} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Theme Color
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  form.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
              title="Custom hex color"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What kind of transactions belong in this category?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Actions */}
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
            {submitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

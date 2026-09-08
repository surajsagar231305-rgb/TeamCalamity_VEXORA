import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { CategoryModal } from '../components/CategoryModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Categories = () => {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.categories.list(typeFilter !== 'All' ? typeFilter : undefined);
      setCategories(res || []);
    } catch (err) {
      addToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.categories.delete(categoryToDelete.id);
      addToast("Category removed successfully");
      fetchCategories();
    } catch (err) {
      addToast(err.message || "Failed to delete category", "error");
    }
  };

  const filteredCategories = typeFilter === 'All'
    ? categories
    : categories.filter(c => c.type === typeFilter);

  const expenseCount = categories.filter(c => c.type === 'Expense').length;
  const incomeCount = categories.filter(c => c.type === 'Income').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize transactions with default and custom categories, colors, and icons.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Custom Category
        </button>
      </div>

      {/* Type Toggle Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === 'All'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All Categories ({categories.length})
        </button>
        <button
          onClick={() => setTypeFilter('Expense')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === 'Expense'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Expense ({expenseCount})
        </button>
        <button
          onClick={() => setTypeFilter('Income')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === 'Income'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Income ({incomeCount})
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create your first custom category to organize your spending."
          actionText="Create Category"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const isExpense = cat.type === 'Expense';
            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#6366F1' }}
                      >
                        <CategoryIcon iconName={cat.icon} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                          {cat.name}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isExpense ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {cat.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          setModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setCategoryToDelete(cat);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.total_amount || 0)}
                  </span>
                  <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-slate-400" />
                    {cat.transaction_count || 0} Txns
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? The system will safely verify if existing transactions are linked before deletion.`}
      />
    </div>
  );
};

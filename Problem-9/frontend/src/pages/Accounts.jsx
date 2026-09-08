import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Plus,
  CreditCard,
  Wallet,
  TrendingUp,
  PieChart,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building2,
  Receipt
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AccountModal } from '../components/AccountModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const getAccountIcon = (type) => {
  switch (type) {
    case 'Savings':
    case 'Current':
      return Landmark;
    case 'Credit Card':
      return CreditCard;
    case 'Demat Account':
      return TrendingUp;
    case 'Investment Account':
      return PieChart;
    case 'Cash Wallet':
      return Wallet;
    default:
      return Building2;
  }
};

export const Accounts = () => {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.accounts.list();
      setAccounts(res || []);
    } catch (err) {
      addToast("Failed to load accounts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    const handleGlobalUpdate = () => fetchAccounts();
    window.addEventListener('transaction-updated', handleGlobalUpdate);
    return () => window.removeEventListener('transaction-updated', handleGlobalUpdate);
  }, [fetchAccounts]);

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.accounts.delete(accountToDelete.id);
      addToast("Account deleted successfully");
      fetchAccounts();
      window.dispatchEvent(new CustomEvent('transaction-updated'));
    } catch (err) {
      addToast(err.message || "Failed to delete account", "error");
    }
  };

  const totalAssets = accounts
    .filter(a => a.type !== 'Credit Card')
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalCardOutstanding = accounts
    .filter(a => a.type === 'Credit Card')
    .reduce((sum, a) => sum + a.current_balance, 0);

  const netWorth = totalAssets - totalCardOutstanding;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accounts & Portfolios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your Savings, Current, Demat holdings, Credit Cards, and Cash wallets.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedAccount(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Account / Card
        </button>
      </div>

      {/* Aggregate Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Liquid & Investment Assets
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalAssets)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Banks, Demat and Wallets
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Credit Card Dues
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalCardOutstanding)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Outstanding balance across active cards
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Net Financial Worth
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(netWorth)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assets minus liabilities
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading accounts...
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No accounts linked"
          description="Create your first bank account, Demat portfolio, or credit card to begin recording transactions."
          actionText="Add Account"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            const isCard = acc.type === 'Credit Card';
            const isDemat = acc.type === 'Demat Account' || acc.type === 'Investment Account';

            return (
              <div
                key={acc.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Top Badge & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isCard
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : isDemat
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {acc.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {acc.type}
                          </span>
                          {acc.account_number_last4 && (
                            <span className="text-xs font-mono text-slate-400">
                              •••• {acc.account_number_last4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedAccount(acc);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Account"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setAccountToDelete(acc);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {isCard ? 'Outstanding Due' : 'Current Balance'}
                    </span>
                    <div className={`text-2xl font-bold tracking-tight mt-0.5 ${
                      isCard ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatCurrency(acc.current_balance)}
                    </div>
                  </div>

                  {/* Card limit or opening balance info */}
                  {isCard && acc.credit_limit > 0 && (
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Limit: {formatCurrency(acc.credit_limit)}</span>
                        <span>Due Day: {acc.due_date_day || 15}th</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, (acc.current_balance / acc.credit_limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {acc.notes && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                      "{acc.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Opening: {formatCurrency(acc.opening_balance)}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" /> {acc.transaction_count || 0} Transactions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Are you sure you want to delete "${accountToDelete?.name}"? Any transactions directly assigned to this account will also be removed.`}
      />
    </div>
  );
};

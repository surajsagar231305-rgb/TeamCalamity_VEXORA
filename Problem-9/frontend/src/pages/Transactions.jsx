import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    Filter,
    Download,
    Plus,
    ArrowUpDown,
    X,
    Edit2,
    Trash2,
    Calendar,
    CreditCard,
    Tag,
    Landmark,
    ChevronLeft,
    ChevronRight,
    Eye,
    Receipt,
    Camera,
    Sparkles,
    Upload,
} from "lucide-react";
import { api } from "../api/client";
import {
    formatCurrency,
    formatDate,
    formatDateTime,
} from "../utils/formatters";
import { CategoryIcon } from "../utils/iconMap";
import { TransactionModal } from "../components/TransactionModal";
import { AiInvoiceScannerModal } from "../components/AiInvoiceScannerModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { ReceiptModal } from "../components/ReceiptModal";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const SORT_OPTIONS = [
    { label: "Newest Added First", by: "id", order: "desc" },
    { label: "Date: Most Recent", by: "date", order: "desc" },
    { label: "Date: Oldest First", by: "date", order: "asc" },
    { label: "Amount: High to Low", by: "amount", order: "desc" },
    { label: "Amount: Low to High", by: "amount", order: "asc" },
    { label: "Name: A to Z", by: "title", order: "asc" },
    { label: "Name: Z to A", by: "title", order: "desc" },
];

const PAYMENT_METHODS = [
    "All",
    "UPI",
    "Credit Card",
    "Debit Card",
    "Net Banking",
    "Bank Transfer",
    "Cash",
    "Other",
];

export const Transactions = () => {
    const { addToast } = useToast();

    const [transactions, setTransactions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [accountFilter, setAccountFilter] = useState("");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortIndex, setSortIndex] = useState(0);

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [txToDelete, setTxToDelete] = useState(null);
    const [receiptTx, setReceiptTx] = useState(null);
    const [aiScannerOpen, setAiScannerOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [scanningStatement, setScanningStatement] = useState(false);

    const fetchDropdowns = async () => {
        try {
            const [cats, accs] = await Promise.all([
                api.categories.list(),
                api.accounts.list(),
            ]);
            setCategories(cats);
            setAccounts(accs);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const currentSort = SORT_OPTIONS[sortIndex];
            const params = {
                limit: pageSize,
                offset: (page - 1) * pageSize,
                sort_by: currentSort.by,
                sort_order: currentSort.order,
            };

            if (search.trim()) params.search = search.trim();
            if (typeFilter) params.type = typeFilter;
            if (categoryFilter) params.category_id = categoryFilter;
            if (accountFilter) params.account_id = accountFilter;
            if (paymentMethodFilter && paymentMethodFilter !== "All")
                params.payment_method = paymentMethodFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.transactions.list(params);
            setTransactions(res.items || []);
            setTotalCount(res.total || 0);
        } catch (err) {
            addToast("Failed to fetch transactions", "error");
        } finally {
            setLoading(false);
        }
    }, [
        search,
        typeFilter,
        categoryFilter,
        accountFilter,
        paymentMethodFilter,
        startDate,
        endDate,
        sortIndex,
        page,
    ]);

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleClearFilters = () => {
        setSearch("");
        setTypeFilter("");
        setCategoryFilter("");
        setAccountFilter("");
        setPaymentMethodFilter("All");
        setStartDate("");
        setEndDate("");
        setSortIndex(0);
        setPage(1);
    };

    const activeFilterCount = [
        Boolean(search.trim()),
        Boolean(typeFilter),
        Boolean(categoryFilter),
        Boolean(accountFilter),
        paymentMethodFilter !== "All",
        Boolean(startDate),
        Boolean(endDate),
    ].filter(Boolean).length;

    const handleDelete = async () => {
        if (!txToDelete) return;
        try {
            await api.transactions.delete(txToDelete.id);
            addToast("Transaction deleted successfully");
            fetchTransactions();
            window.dispatchEvent(new CustomEvent("transaction-updated"));
        } catch (err) {
            addToast(err.message || "Failed to delete transaction", "error");
        }
    };

    const handleExportCSV = () => {
        const currentSort = SORT_OPTIONS[sortIndex];
        const params = {
            sort_by: currentSort.by,
            sort_order: currentSort.order,
        };
        if (search.trim()) params.search = search.trim();
        if (typeFilter) params.type = typeFilter;
        if (categoryFilter) params.category_id = categoryFilter;
        if (accountFilter) params.account_id = accountFilter;
        if (paymentMethodFilter && paymentMethodFilter !== "All")
            params.payment_method = paymentMethodFilter;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const exportUrl = api.transactions.getExportUrl(params);
        window.open(exportUrl, "_blank");
        addToast("Exporting transactions to CSV...", "info");
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setImporting(true);
        try {
            const result = await api.transactions.importCsv(file);
            setSortIndex(0);
            setPage(1);
            await fetchTransactions();
            window.dispatchEvent(new CustomEvent("transaction-updated"));
            addToast(
                `Imported ${result.imported} transactions. Skipped ${result.skipped_duplicates} duplicates${result.failed ? `, ${result.failed} failed` : ""}.`,
            );
        } catch (error) {
            addToast(error.message || "CSV import failed", "error");
        } finally {
            setImporting(false);
        }
    };

    const handleStatementScan = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setScanningStatement(true);
        try {
            const result = await api.transactions.scanStatement(file);
            if (!result.rows?.length) throw new Error("No dated transaction rows were detected in this screenshot");
            let added = 0;
            for (const row of result.rows) {
                await api.transactions.create({ ...row, notes: "Imported from statement screenshot" });
                added += 1;
            }
            setSortIndex(0);
            setPage(1);
            await fetchTransactions();
            window.dispatchEvent(new CustomEvent("transaction-updated"));
            addToast(`Detected and added ${added} transactions from the screenshot.`);
        } catch (error) {
            addToast(error.message || "Statement scan failed", "error");
        } finally {
            setScanningStatement(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Transactions
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Search, filter, categorize, and export your entire
                        financial history.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setAiScannerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition-all group">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
                        AI Scan Invoice
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-xs transition-all">
                        <Download className="w-4 h-4 text-slate-500" />
                        Export CSV
                    </button>

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold shadow-xs transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {importing ? "Importing..." : "Import CSV"}
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleImportCSV}
                            disabled={importing}
                            className="hidden"
                        />
                    </label>

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-semibold shadow-xs transition-all cursor-pointer">
                        <Camera className="w-4 h-4" />
                        {scanningStatement ? "Scanning..." : "Scan Statement"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleStatementScan} disabled={scanningStatement} className="hidden" />
                    </label>

                    <button
                        onClick={() => {
                            setSelectedTx(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Advanced Filter Toolbar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Search input */}
                    <div className="md:col-span-4 relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search title, category, account, notes..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="md:col-span-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">
                                All Types (Income & Expense)
                            </option>
                            <option value="Expense">Expense Only</option>
                            <option value="Income">Income Only</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Account Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={accountFilter}
                            onChange={(e) => {
                                setAccountFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Accounts</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Secondary Row: Payment Method, Dates, Sorting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Payment Method */}
                    <div className="md:col-span-3">
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => {
                                setPaymentMethodFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="All">Payment: All Methods</option>
                            {PAYMENT_METHODS.filter((m) => m !== "All").map(
                                (m) => (
                                    <option key={m} value={m}>
                                        Method: {m}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="md:col-span-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="From Date"
                        />
                    </div>

                    {/* Date To */}
                    <div className="md:col-span-2">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="To Date"
                        />
                    </div>

                    {/* Sorting */}
                    <div className="md:col-span-3">
                        <select
                            value={sortIndex}
                            onChange={(e) => {
                                setSortIndex(parseInt(e.target.value, 10));
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {SORT_OPTIONS.map((s, idx) => (
                                <option key={idx} value={idx}>
                                    Sort: {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="md:col-span-2 flex items-center justify-end">
                        <button
                            onClick={handleClearFilters}
                            disabled={activeFilterCount === 0}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                            <X className="w-3.5 h-3.5" />
                            Clear Filters{" "}
                            {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center text-sm text-slate-400">
                        Loading transactions...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-16">
                        <EmptyState
                            title={
                                activeFilterCount > 0
                                    ? "No matching transactions found"
                                    : "No transactions recorded yet"
                            }
                            description={
                                activeFilterCount > 0
                                    ? "Try adjusting your search query, type, or date range filters."
                                    : "Start by adding your first transaction."
                            }
                            actionText={
                                activeFilterCount > 0
                                    ? "Reset Filters"
                                    : "Add Transaction"
                            }
                            onAction={
                                activeFilterCount > 0
                                    ? handleClearFilters
                                    : () => setModalOpen(true)
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 pl-6">ID & Date</th>
                                    <th className="py-3.5">
                                        Title & Description
                                    </th>
                                    <th className="py-3.5">Category</th>
                                    <th className="py-3.5">Account / Card</th>
                                    <th className="py-3.5">Method</th>
                                    <th className="py-3.5 text-right">
                                        Amount
                                    </th>
                                    <th className="py-3.5 text-center pr-6">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {transactions.map((tx) => {
                                    const isIncome = tx.type === "Income";
                                    return (
                                        <tr
                                            key={tx.id}
                                            onClick={() => setReceiptTx(tx)}
                                            className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                            title="Click to view digital receipt">
                                            {/* ID & Date */}
                                            <td className="py-4 pl-6 whitespace-nowrap">
                                                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {formatDate(tx.date)}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-400">
                                                    #{tx.id}
                                                </div>
                                            </td>

                                            {/* Title & Notes */}
                                            <td className="py-4 max-w-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {tx.title}
                                                    </span>
                                                    {tx.receipt_image_url && (
                                                        <span
                                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium border border-indigo-200/60 dark:border-indigo-800/60 shrink-0"
                                                            title="Receipt photo attached">
                                                            <Camera className="w-3 h-3" />
                                                            Receipt
                                                        </span>
                                                    )}
                                                </div>
                                                {tx.policy_name ? (
                                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                                                        Policy: {tx.policy_name}
                                                    </div>
                                                ) : tx.notes ? (
                                                    <div className="text-xs text-slate-400 truncate">
                                                        {tx.notes}
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Category */}
                                            <td className="py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    <CategoryIcon
                                                        iconName={
                                                            tx.category?.icon
                                                        }
                                                        className="w-3.5 h-3.5"
                                                        color={
                                                            tx.category?.color
                                                        }
                                                    />
                                                    {tx.category?.name ||
                                                        "Uncategorized"}
                                                </span>
                                            </td>

                                            {/* Account */}
                                            <td className="py-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    {tx.account?.name ||
                                                        "Account"}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {tx.account?.type}
                                                </div>
                                            </td>

                                            {/* Payment Method & Status */}
                                            <td className="py-4 whitespace-nowrap">
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                                    {tx.payment_method}
                                                </span>
                                                {tx.is_credit_due && (
                                                    <div className="mt-1">
                                                        <span
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                tx.status ===
                                                                "Paid"
                                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                                                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                                            }`}>
                                                            {tx.status || "Due"}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className="py-4 text-right whitespace-nowrap font-bold text-sm">
                                                <span
                                                    className={
                                                        isIncome
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-slate-900 dark:text-white"
                                                    }>
                                                    {isIncome ? "+" : "-"}
                                                    {formatCurrency(tx.amount)}
                                                </span>
                                                {tx.currency &&
                                                    tx.currency !== "INR" &&
                                                    tx.original_amount && (
                                                        <div className="text-[11px] font-medium text-slate-400">
                                                            {formatCurrency(
                                                                tx.original_amount,
                                                                tx.currency,
                                                            )}
                                                        </div>
                                                    )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-4 pr-6 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* View receipt */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReceiptTx(tx);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                                                        title="View Digital Receipt">
                                                        <Receipt className="w-4 h-4" />
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTx(tx);
                                                            setModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTxToDelete(tx);
                                                            setDeleteConfirmOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                                        title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Table Footer with Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                        Showing{" "}
                        {transactions.length > 0
                            ? (page - 1) * pageSize + 1
                            : 0}{" "}
                        to {Math.min(page * pageSize, totalCount)} of{" "}
                        {totalCount} transactions
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page >= totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Digital Transaction Receipt Modal */}
            <ReceiptModal
                isOpen={Boolean(receiptTx)}
                onClose={() => setReceiptTx(null)}
                transaction={receiptTx}
            />

            {/* Add / Edit Transaction Modal */}
            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                transaction={selectedTx}
                onSuccess={() => {
                    setSortIndex(0);
                    setPage(1);
                    window.dispatchEvent(
                        new CustomEvent("transaction-updated"),
                    );
                }}
            />

            {/* AI Smart Invoice Scanner Modal */}
            <AiInvoiceScannerModal
                isOpen={aiScannerOpen}
                onClose={() => setAiScannerOpen(false)}
                onSuccess={() => {
                    setSortIndex(0); // Reset sort to Newest First
                    setPage(1); // Jump to top page
                    fetchTransactions();
                    window.dispatchEvent(
                        new CustomEvent("transaction-updated"),
                    );
                }}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setTxToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Transaction"
                message={`Are you sure you want to delete "${txToDelete?.title}" (${formatCurrency(txToDelete?.amount || 0)})? The associated account balance will be rolled back.`}
            />
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  RefreshCw,
  Camera,
  Calendar,
  CreditCard,
  Tag,
  Landmark,
  Eye,
  Globe
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, CURRENCY_SYMBOLS, CURRENCY_RATES } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { useToast } from '../context/ToastContext';

export const AiInvoiceScannerModal = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToast();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Editable form state initialized after extraction
  const [form, setForm] = useState({
    title: '',
    amount: '',
    original_amount: '',
    currency: 'INR',
    exchange_rate: 1.0,
    type: 'Expense',
    category_id: '',
    account_id: '',
    payment_method: 'UPI',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    policy_name: '',
    receipt_image_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setFile(null);
    setPreviewUrl('');
    setScanning(false);
    setScanStep(0);
    setExtractedData(null);
    setForm({
      title: '',
      amount: '',
      original_amount: '',
      currency: 'INR',
      exchange_rate: 1.0,
      type: 'Expense',
      category_id: '',
      account_id: '',
      payment_method: 'UPI',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      policy_name: '',
      receipt_image_url: ''
    });
  };

  const loadDropdowns = async () => {
    try {
      const [cats, accs] = await Promise.all([
        api.categories.list('Expense'),
        api.accounts.list()
      ]);
      setCategories(cats || []);
      setAccounts(accs || []);
    } catch (err) {
      console.error("Failed to load categories/accounts:", err);
    }
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      addToast("File size should be under 10MB", "error");
      return;
    }

    setFile(selectedFile);
    const localUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(localUrl);

    // Run AI scanning process
    performScan(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileChange(droppedFile);
  };

  const performScan = async (fileToScan) => {
    setScanning(true);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 700);
    const stepTimer2 = setTimeout(() => setScanStep(3), 1400);

    try {
      const res = await api.transactions.scanInvoice(fileToScan);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setScanStep(4);

      setExtractedData(res);

      // Pre-fill editable form with smart AI predictions
      const parsedDate = res.date ? res.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const detectedCurr = res.currency || 'INR';
      const detectedRate = res.exchange_rate || (CURRENCY_RATES[detectedCurr] || 1.0);
      const origAmt = res.original_amount !== undefined && res.original_amount !== null ? res.original_amount : res.amount;
      const inrAmt = res.amount !== undefined && res.amount !== null ? res.amount : (origAmt * detectedRate);

      setForm({
        title: res.title || 'Scanned Expense',
        amount: String(inrAmt ? Number(inrAmt).toFixed(2) : ''),
        original_amount: String(origAmt ? Number(origAmt).toFixed(2) : ''),
        currency: detectedCurr,
        exchange_rate: detectedRate,
        type: 'Expense',
        category_id: String(res.category_id || (categories[0]?.id || '')),
        account_id: String(res.account_id || (accounts[0]?.id || '')),
        payment_method: res.payment_method || 'UPI',
        date: parsedDate,
        notes: res.notes || '',
        policy_name: res.policy_name || '',
        receipt_image_url: res.receipt_image_url || ''
      });

      addToast(`AI scan complete: ${detectedCurr} receipt analyzed, category: ${res.category_name}`);
    } catch (err) {
      addToast(err.message || "Failed to analyze invoice with AI", "error");
    } finally {
      setScanning(false);
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

  // Quick Demo Receipt Loader for Hackathon Presentation
  const handleQuickDemo = async (type) => {
    let filename = 'sample_apple_receipt.png';
    if (type === 'apple') filename = 'sample_apple_receipt.png';
    else if (type === 'star') filename = 'sample_star_health_receipt.png';
    else if (type === 'usd_debit') filename = 'sample_usd_debit_receipt.png';
    else if (type === 'eur_debit') filename = 'sample_eur_debit_receipt.png';

    try {
      setScanning(true);
      setScanStep(1);
      const res = await fetch(`/uploads/${filename}`);
      const blob = await res.blob();
      const demoFile = new File([blob], filename, { type: 'image/png' });
      handleFileChange(demoFile);
    } catch (e) {
      addToast("Failed to load demo receipt", "error");
      setScanning(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast("Please provide a title/merchant", "error");
      return;
    }
    const numAmount = parseFloat(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addToast("Please provide a valid amount", "error");
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      let txDate = new Date(form.date);
      if (isNaN(txDate.getTime())) txDate = now;
      txDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const origAmount = form.currency !== 'INR' ? (parseFloat(form.original_amount) || numAmount) : numAmount;
      const rate = parseFloat(form.exchange_rate) || 1.0;

      const payload = {
        title: form.title.trim(),
        amount: numAmount,
        original_amount: origAmount,
        currency: form.currency || 'INR',
        exchange_rate: rate,
        type: 'Expense',
        category_id: parseInt(form.category_id, 10),
        account_id: parseInt(form.account_id, 10),
        date: txDate.toISOString(),
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
        is_credit_due: form.payment_method === 'Credit Card',
        status: form.payment_method === 'Credit Card' ? 'Unpaid' : 'Completed',
        policy_name: form.policy_name.trim() || null,
        receipt_image_url: form.receipt_image_url || null
      };

      await api.transactions.create(payload);
      addToast("✨ AI Transaction recorded! Added to top of history.");
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to save transaction", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-200/50 dark:border-indigo-900/50 overflow-hidden transform transition-all z-10 my-8">
        {/* Glowing Top Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  AI Smart Invoice Scanner
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Offline & Multi-Currency
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Drop any bill or receipt. AI detects amount, currency, Debit vs Credit card, and sets category!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Step 1: Upload or Quick Sample */}
          {!extractedData && !scanning && (
            <div className="space-y-4">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/30 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800/70 hover:border-indigo-500 cursor-pointer transition-all duration-200 group"
              >
                <div className="p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-3 shadow-xs">
                  <Upload className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1 text-center">
                  Drag & drop invoice or receipt photo here
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm">
                  Supports JPG, PNG, or WebP. Handles INR and foreign currencies (USD, EUR, GBP, AED, etc.) with smart Debit Card vs Credit Card detection.
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-colors">
                  Browse Device Photo
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              {/* Quick 1-Click Demo Buttons for Hackathon Judges */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Test instantly with pre-loaded demo bills:</span>
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">Foreign Currencies & Debit Cards</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('apple')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/60 transition-colors flex flex-col text-left"
                  >
                    <span className="font-bold truncate">🍎 Apple Store</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">₹22,900 INR</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('star')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/60 transition-colors flex flex-col text-left"
                  >
                    <span className="font-bold truncate">🛡️ Star Health</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">₹16,500 INR</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">UPI / NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('usd_debit')}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 hover:border-blue-400 text-xs font-medium text-slate-700 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex flex-col text-left"
                  >
                    <span className="font-bold truncate">💳 Cloud Host (USD)</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold">$49.00 USD</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('eur_debit')}
                    className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 hover:border-purple-400 text-xs font-medium text-slate-700 dark:text-slate-300 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex flex-col text-left"
                  >
                    <span className="font-bold truncate">💶 Office Supplies</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-bold">€85.00 EUR</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ Debit Card</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Animated Scanning Laser State */}
          {scanning && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-48 h-56 rounded-2xl overflow-hidden border-2 border-indigo-400 dark:border-indigo-500 bg-slate-100 dark:bg-slate-800 shadow-xl">
                {previewUrl ? (
                  <img src={previewUrl} alt="Scanning preview" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-400">
                    <FileText className="w-16 h-16" />
                  </div>
                )}
                {/* Laser Scanning Animation Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce top-1/2" />
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Scanning & Analyzing Invoice...</span>
                </div>
                <p className="text-xs text-slate-400">
                  {scanStep === 1 && "Reading optical text & numbers offline with Windows OCR..."}
                  {scanStep === 2 && "Detecting merchant, amount, taxes and items..."}
                  {scanStep >= 3 && "Classifying financial category & linking account..."}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Extracted Results & Auto-Filled Form */}
          {extractedData && !scanning && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* AI Confidence Notification Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Invoice Scanned & Categorized Successfully!
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                      Auto-detected Category: <span className="font-bold underline">{extractedData.category_name}</span> • AI Confidence: {Math.round(extractedData.confidence * 100)}%
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetState}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Another
                </button>
              </div>

              {/* Multi-currency Live Conversion Banner if Foreign Currency */}
              {form.currency !== 'INR' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Multi-Currency Converted:
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200/60 dark:border-indigo-800">
                      {CURRENCY_SYMBOLS[form.currency] || ''}{form.original_amount} {form.currency} ≈ ₹{form.amount} INR
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Exchange Rate: 1 {form.currency} = ₹{form.exchange_rate} INR
                  </span>
                </div>
              )}

              {/* Grid: Preview Photo + Extracted Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo Thumbnail */}
                <div className="md:col-span-1 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Attached Receipt
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-center">
                    <img
                      src={form.receipt_image_url || previewUrl}
                      alt="Scanned Bill"
                      className="w-full max-h-56 object-contain rounded-xl shadow-xs"
                    />
                    <div className="text-[11px] text-slate-400 font-medium mt-2 truncate">
                      {extractedData.policy_name ? `Ref: ${extractedData.policy_name}` : "Original Photo Attached"}
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="md:col-span-2 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Merchant / Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Currency and Amount Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Currency Selector */}
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

                    {/* Original Bill Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Bill Amount ({CURRENCY_SYMBOLS[form.currency] || form.currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.currency !== 'INR' ? form.original_amount : form.amount}
                        onChange={(e) => {
                          if (form.currency !== 'INR') {
                            handleOriginalAmountChange(e.target.value);
                          } else {
                            handleInrAmountChange(e.target.value);
                          }
                        }}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Converted INR Base Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Base Amount (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => handleInrAmountChange(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Category & Account */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Auto-Assigned Category
                      </label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Account / Card
                      </label>
                      <select
                        value={form.account_id}
                        onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Payment Method & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Payment Method
                      </label>
                      <select
                        value={form.payment_method}
                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {['Debit Card', 'Credit Card', 'UPI', 'Net Banking', 'Bank Transfer', 'Cash', 'Other'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {form.payment_method === 'Debit Card' && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                          ✓ Deducted from Bank Savings Account (Not Credit)
                        </p>
                      )}
                      {form.payment_method === 'Credit Card' && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          ⚠️ Tracked in Credit Card outstanding balance
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Notes / Line items */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Notes / Items Extracted
                    </label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Extracted items and notes"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save to History (Newest on Top)
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

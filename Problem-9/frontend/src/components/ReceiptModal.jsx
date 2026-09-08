import React, { useRef } from 'react';
import {
  Receipt,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  ShieldCheck,
  X,
  Share2,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatTransactionDisplay } from '../utils/formatters';
import { CategoryIcon } from '../utils/iconMap';
import { useToast } from '../context/ToastContext';

export const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  const receiptRef = useRef(null);
  const { addToast } = useToast();

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'Income';
  const receiptNumber = `REC-${String(transaction.id).padStart(6, '0')}`;
  const refCode = `TXN-${String(transaction.id).padStart(4, '0')}-${new Date(transaction.date).getTime().toString().slice(-6)}`;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=650,height=800');
    const displayAmt = transaction.currency && transaction.currency !== 'INR' && transaction.original_amount
      ? `${formatCurrency(transaction.original_amount, transaction.currency)} <div style="font-size: 14px; font-weight: normal; color: #64748b; margin-top: 4px;">≈ ${formatCurrency(transaction.amount, 'INR')}</div>`
      : formatCurrency(transaction.amount);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${receiptNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 30px;
              color: #1e293b;
              max-width: 500px;
              margin: 0 auto;
            }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
            .logo { font-size: 22px; font-weight: 800; color: #4f46e5; }
            .receipt-no { font-size: 12px; color: #64748b; margin-top: 4px; font-family: monospace; }
            .amount-box { text-align: center; margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 12px; }
            .amount { font-size: 30px; font-weight: 800; color: #0f172a; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .badge-expense { background: #fee2e2; color: #991b1b; }
            .badge-income { background: #dcfce7; color: #166534; }
            .details { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            .details td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .details td.label { color: #64748b; font-weight: 500; width: 40%; }
            .details td.val { text-align: right; font-weight: 600; color: #0f172a; }
            .receipt-img-box { margin-top: 20px; text-align: center; page-break-inside: avoid; }
            .receipt-img-box img { max-width: 100%; max-height: 280px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: contain; }
            .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px dashed #cbd5e1; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ExpenseFlow</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Vexora-26 Financial Management</div>
            <div class="receipt-no">${receiptNumber}</div>
          </div>
          <div class="amount-box">
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${transaction.type}</span>
            <div class="amount">${displayAmt}</div>
            <div style="font-size: 13px; font-weight: 600; color: #475569; margin-top: 4px;">${transaction.title}</div>
          </div>
          <table class="details">
            <tr><td class="label">Date & Time</td><td class="val">${formatDateTime(transaction.date)}</td></tr>
            <tr><td class="label">Category</td><td class="val">${transaction.category?.name || 'Uncategorized'}</td></tr>
            <tr><td class="label">Payment Method</td><td class="val">${transaction.payment_method || 'UPI'}</td></tr>
            <tr><td class="label">Account</td><td class="val">${transaction.account?.name || 'Default Account'}</td></tr>
            <tr><td class="label">Status</td><td class="val">${transaction.status || 'Completed'}</td></tr>
            ${transaction.currency && transaction.currency !== 'INR' ? `<tr><td class="label">Original Bill</td><td class="val">${formatCurrency(transaction.original_amount, transaction.currency)} (1 ${transaction.currency} = ₹${transaction.exchange_rate || 1.0})</td></tr>` : ''}
            ${transaction.policy_name ? `<tr><td class="label">Policy / Ref</td><td class="val">${transaction.policy_name}</td></tr>` : ''}
            ${transaction.due_date ? `<tr><td class="label">Due Date</td><td class="val">${new Date(transaction.due_date).toLocaleDateString()}</td></tr>` : ''}
            ${transaction.notes ? `<tr><td class="label">Notes</td><td class="val">${transaction.notes}</td></tr>` : ''}
          </table>
          ${transaction.receipt_image_url ? `
            <div class="receipt-img-box">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Attached Original Receipt Photo</div>
              <img src="${transaction.receipt_image_url}" alt="Receipt Photo" />
            </div>
          ` : ''}
          <div class="footer">
            <div>Ref: ${refCode}</div>
            <div style="margin-top: 4px;">Verified Electronic Financial Audit Receipt • Vexora-26</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCopy = () => {
    const amtStr = formatTransactionDisplay(transaction);
    const summaryText = `[ExpenseFlow Receipt]\nReceipt No: ${receiptNumber}\nTitle: ${transaction.title}\nAmount: ${amtStr}\nType: ${transaction.type}\nCategory: ${transaction.category?.name || 'N/A'}\nAccount: ${transaction.account?.name || 'N/A'}\nDate: ${formatDateTime(transaction.date)}\nStatus: ${transaction.status || 'Completed'}`;
    navigator.clipboard.writeText(summaryText);
    addToast("Receipt details copied to clipboard!");
  };

  const handleDownloadImage = async () => {
    if (!transaction.receipt_image_url) return;
    try {
      const sanitizedTitle = (transaction.title || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Receipt_${transaction.id || 'bill'}_${sanitizedTitle}.jpg`;

      // If data URL or blob URL
      if (transaction.receipt_image_url.startsWith('data:') || transaction.receipt_image_url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = transaction.receipt_image_url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast("Receipt photo downloaded successfully!");
        return;
      }

      // If server URL or remote URL
      const response = await fetch(transaction.receipt_image_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      addToast("Receipt photo downloaded successfully!");
    } catch (err) {
      // Fallback
      const a = document.createElement('a');
      a.href = transaction.receipt_image_url;
      a.download = `Receipt_${transaction.id || 'file'}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast("Receipt photo opened for download");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all z-10 my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Receipt className="w-4 h-4 text-indigo-500" />
            <span>Digital Payment Receipt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy Summary"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header Branding */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 mb-1">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              ExpenseFlow Receipt
            </h2>
            <div className="font-mono text-xs text-slate-400 font-semibold tracking-wider">
              {receiptNumber}
            </div>
          </div>

          {/* Amount Badge Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1.5">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isIncome
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
            }`}>
              {transaction.type}
            </span>
            <div className={`text-3xl font-extrabold tracking-tight ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
            }`}>
              {transaction.currency && transaction.currency !== 'INR' && transaction.original_amount ? (
                <div>
                  <span>{formatCurrency(transaction.original_amount, transaction.currency)}</span>
                  <span className="text-xs font-semibold text-slate-400 block mt-1">
                    ≈ {formatCurrency(transaction.amount, 'INR')} (Rate: ₹{transaction.exchange_rate || 1.0})
                  </span>
                </div>
              ) : (
                formatCurrency(transaction.amount)
              )}
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {transaction.title}
            </div>
          </div>

          {/* Detailed Itemized Rows */}
          <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between pt-2">
              <span className="text-slate-400 font-medium">Transaction Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {formatDateTime(transaction.date)}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-400 font-medium">Category</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <CategoryIcon iconName={transaction.category?.icon} className="w-3.5 h-3.5" color={transaction.category?.color} />
                {transaction.category?.name || 'Uncategorized'}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-400 font-medium">Account / Wallet</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {transaction.account?.name || 'Default Account'}
                {transaction.account?.type && (
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {transaction.account.type}
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-400 font-medium">Payment Mode</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {transaction.payment_method || 'UPI'}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-400 font-medium">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {transaction.status || 'Completed'}
              </span>
            </div>

            {transaction.policy_name && (
              <div className="flex justify-between pt-2">
                <span className="text-slate-400 font-medium">Policy / Card Ref</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-right max-w-[60%] truncate">
                  {transaction.policy_name}
                </span>
              </div>
            )}

            {transaction.due_date && (
              <div className="flex justify-between pt-2">
                <span className="text-slate-400 font-medium">Statement Due Date</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {new Date(transaction.due_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {transaction.notes && (
              <div className="pt-2">
                <span className="text-slate-400 font-medium block mb-1">Notes / Memo</span>
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {transaction.notes}
                </p>
              </div>
            )}
          </div>

          {/* Attached Real Receipt Photo Card */}
          {transaction.receipt_image_url ? (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Original Receipt Photo</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  title="Download image file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Image
                </button>
              </div>

              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 p-2">
                <img
                  src={transaction.receipt_image_url}
                  alt="Original Uploaded Receipt"
                  className="w-full max-h-64 object-contain rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-[1.01]"
                />

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-lg transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Photo
                  </button>
                  <a
                    href={transaction.receipt_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-lg transition-transform active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Full View
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                No physical receipt photo was attached to this transaction.
              </span>
            </div>
          )}

          {/* Barcode / Stamp Aesthetic Footer */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">
              {refCode}
            </div>
            {/* Stylized Barcode */}
            <div className="flex justify-center items-center gap-0.5 h-7 opacity-75 dark:opacity-60">
              {[4, 2, 6, 1, 3, 5, 2, 7, 3, 2, 5, 1, 6, 4, 2, 8, 3, 1, 5, 2, 4, 3, 7, 2, 1, 4, 3].map((h, i) => (
                <div
                  key={i}
                  className="bg-slate-800 dark:bg-slate-300 w-[2px] rounded-xs"
                  style={{ height: `${h * 3.5}px` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Verified Electronic Financial Receipt • Vexora-26
            </p>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
          {transaction.receipt_image_url && (
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Photo
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

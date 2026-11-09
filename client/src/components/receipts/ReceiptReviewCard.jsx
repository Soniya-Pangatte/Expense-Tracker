import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  Store,
  Tag,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  ZoomIn,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';
import { PAYMENT_METHODS } from '../../data/transactionOptions';

export default function ReceiptReviewCard({
  receipt,
  categories = [],
  onConfirm,
  onCancel,
  loading = false,
}) {
  const { currency, getCurrencySymbol, formatCurrency } = useCurrency();

  // Form states initialized with extracted OCR fields
  const [merchant, setMerchant] = useState(receipt.merchant_name || receipt.extracted_data?.merchant || '');
  const [amount, setAmount] = useState(String(receipt.total_amount ?? receipt.extracted_data?.totalAmount ?? ''));
  const [date, setDate] = useState(receipt.receipt_date || receipt.extracted_data?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(receipt.receipt_time || receipt.extracted_data?.time || '');
  const [categoryName, setCategoryName] = useState(receipt.suggested_category || receipt.extracted_data?.suggestedCategory || 'Groceries & Food');
  const [paymentMethod, setPaymentMethod] = useState(receipt.payment_method || receipt.extracted_data?.paymentMethod || 'Credit Card');
  const [subtotal, setSubtotal] = useState(String(receipt.subtotal ?? receipt.extracted_data?.subtotal ?? ''));
  const [taxAmount, setTaxAmount] = useState(String(receipt.tax_amount ?? receipt.extracted_data?.taxAmount ?? ''));
  const [discount, setDiscount] = useState(String(receipt.discount_amount ?? receipt.extracted_data?.discount ?? ''));
  const [notes, setNotes] = useState(receipt.raw_text ? `Extracted via Receipt Scan OCR` : '');
  const [items, setItems] = useState(receipt.items || receipt.extracted_data?.items || []);
  const [showRawText, setShowRawText] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [error, setError] = useState('');

  const isAiSuggested = Boolean(receipt.suggested_category || receipt.extracted_data?.suggestedCategory);

  const handleAddItem = () => {
    setItems([...items, { name: 'Item', quantity: 1, price: 0 }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid total amount greater than zero.');
      return;
    }

    if (!merchant.trim()) {
      setError('Please specify a merchant or vendor name.');
      return;
    }

    const matchedCategory = categories.find(
      (c) => c.name?.toLowerCase() === categoryName.toLowerCase()
    );

    const payload = {
      merchant: merchant.trim(),
      amount: parsedAmount,
      currency: receipt.currency || currency,
      categoryName,
      categoryId: matchedCategory?.id || null,
      date,
      paymentMethod,
      notes: notes.trim(),
      subtotal: subtotal ? parseFloat(subtotal) : null,
      taxAmount: taxAmount ? parseFloat(taxAmount) : null,
      discount: discount ? parseFloat(discount) : null,
      items,
    };

    try {
      await onConfirm(payload);
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Failed to save transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-[#B9D9E1]/20 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#447F98]/20 text-[#447F98] dark:text-[#83BDCF]">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
              Review Extracted Receipt Details
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Verify and adjust the fields below before recording this expense in your ledger.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#B9D9E1]/30 dark:bg-[#365765]/60 text-[#447F98] dark:text-[#83BDCF] shrink-0">
          Source: Receipt Scan
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Receipt Image Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="!p-3 overflow-hidden bg-gray-50 dark:bg-[#1B3541]/40 border-[#C4DCE3] dark:border-[#365765]">
            <div className="flex items-center justify-between pb-2 border-b border-[#C4DCE3]/60 dark:border-[#365765]/60 text-xs font-semibold text-[#526C78] dark:text-[#83BDCF]">
              <span>Receipt Preview</span>
              <span className="text-[11px] truncate max-w-[150px]">{receipt.file_name || 'Receipt File'}</span>
            </div>

            <div className="mt-3 relative rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center min-h-[320px] max-h-[500px]">
              {receipt.image_url ? (
                receipt.mime_type === 'application/pdf' ? (
                  <div className="text-center p-8 space-y-2">
                    <FileText size={48} className="mx-auto text-[#447F98]" />
                    <p className="text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                      PDF Receipt Document
                    </p>
                    <a
                      href={receipt.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#447F98] underline"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                ) : (
                  <img
                    src={receipt.image_url}
                    alt="Receipt Scanned Preview"
                    className="w-full h-auto max-h-[480px] object-contain rounded-lg shadow-sm"
                  />
                )
              ) : (
                <div className="text-center p-8 text-xs text-[#526C78]">No preview available</div>
              )}
            </div>

            {/* OCR Raw Text Accordion */}
            {receipt.raw_text && (
              <div className="mt-3 pt-2 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]"
                >
                  <span>Raw OCR Text Stream</span>
                  {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showRawText && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-black/5 dark:bg-black/30 text-[10px] text-[#243D49] dark:text-[#D6EBF3] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                    {receipt.raw_text}
                  </pre>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Editable Review Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="!p-5 sm:!p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Merchant & Total Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                    Merchant / Store Name *
                  </label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Walmart, Shell, Starbucks"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                    Total Amount ({receipt.currency || currency}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#526C78] dark:text-[#83BDCF]">
                      {getCurrencySymbol()}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 142.50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                    Receipt Date *
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                    Receipt Time (Optional)
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                      Category *
                    </label>
                    {isAiSuggested && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        <Sparkles size={9} /> AI Suggested
                      </span>
                    )}
                  </div>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                  >
                    {categories
                      .filter((c) => !c.isIncome && !c.is_income)
                      .map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtotal, Tax, Discount */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#526C78] dark:text-[#83BDCF] mb-1">
                    Subtotal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#526C78] dark:text-[#83BDCF] mb-1">
                    Tax Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#526C78] dark:text-[#83BDCF] mb-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs"
                  />
                </div>
              </div>

              {/* Line Items Accordion */}
              <div className="pt-2 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setShowItems(!showItems)}
                    className="text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] flex items-center gap-1.5"
                  >
                    <span>Itemized Line Items ({items.length})</span>
                    {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-[#447F98] dark:text-[#83BDCF] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                {showItems && (
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-[#526C78] dark:text-[#83BDCF] italic py-2">
                        No line items parsed. You can add items manually if desired.
                      </p>
                    ) : (
                      items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={it.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3]"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className="w-16 px-2 py-1.5 rounded-lg border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-center"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={it.price}
                            onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1.5 rounded-lg border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-right font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                  Notes & Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly grocery staples and snacks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#C4DCE3] dark:border-[#365765]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Discard & Retake
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  loading={loading}
                  className="w-full sm:w-auto"
                >
                  Confirm & Save Expense
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

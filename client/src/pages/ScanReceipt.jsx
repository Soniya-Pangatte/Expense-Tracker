import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Camera,
  History,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  uploadAndScanReceipt,
  fetchReceiptHistory,
  confirmReceiptExpense,
  deleteReceiptRecord,
} from '../services/receiptService';
import ReceiptReviewCard from '../components/receipts/ReceiptReviewCard';
import ReceiptHistorySection from '../components/receipts/ReceiptHistorySection';
import DuplicateReceiptModal from '../components/receipts/DuplicateReceiptModal';
import DeleteBudgetLimitModal from '../components/dashboard/DeleteBudgetLimitModal';

export default function ScanReceipt() {
  const { session, isDemoUser } = useAuth();
  const { categories, addTransaction } = useTransactions();
  const { currency } = useCurrency();

  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'review' | 'history'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanError, setScanError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active review receipt
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Receipts history list
  const [receiptsList, setReceiptsList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Duplicate receipt modal state
  const [duplicateData, setDuplicateData] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Load receipts history on mount
  useEffect(() => {
    loadReceipts();
  }, [session, isDemoUser]);

  const loadReceipts = async () => {
    setHistoryLoading(true);
    try {
      const list = await fetchReceiptHistory({ session, isDemoUser });
      setReceiptsList(list || []);
    } catch (err) {
      console.warn('Error fetching receipts list:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle file drop / select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    setScanError('');
    setSuccessMessage('');

    // 1. Validate File Size (<= 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setScanError(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller image or compressed PDF.`);
      return;
    }

    // 2. Validate MIME Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setScanError(`Unsupported file format (${file.type || 'unknown'}). Please upload a JPG, PNG, WEBP, or PDF receipt.`);
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  };

  // Trigger scanning
  const startScan = async (forceProcess = false) => {
    const fileToScan = pendingFile || selectedFile;
    if (!fileToScan) return;

    setIsScanning(true);
    setScanError('');
    setScanStage('Uploading receipt & computing file hash...');

    try {
      setTimeout(() => setScanStage('Analyzing with Gemini AI OCR Engine...'), 800);
      setTimeout(() => setScanStage('Extracting line items, tax, and merchant...'), 1800);

      const availableCategoryNames = categories
        .filter((c) => !c.isIncome && !c.is_income)
        .map((c) => c.name);

      const result = await uploadAndScanReceipt({
        file: fileToScan,
        currency,
        availableCategories: availableCategoryNames,
        session,
        isDemoUser,
        forceProcess,
      });

      if (result.isDuplicate) {
        setIsScanning(false);
        setPendingFile(fileToScan);
        setDuplicateData(result);
        return;
      }

      if (result.success && result.receipt) {
        setActiveReceipt(result.receipt);
        setActiveTab('review');
        loadReceipts();
      } else {
        throw new Error('Failed to extract receipt information.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message || 'An error occurred during OCR scanning.');
    } finally {
      setIsScanning(false);
      setScanStage('');
    }
  };

  // User confirms the reviewed receipt -> saves transaction into ledger
  const handleConfirmReceipt = async (confirmedData) => {
    if (!activeReceipt) return;
    setConfirmLoading(true);
    try {
      const result = await confirmReceiptExpense({
        receiptId: activeReceipt.id,
        confirmedData,
        session,
        isDemoUser,
      });

      // Call Phase 1 TransactionContext addTransaction to update state immediately
      if (result.transaction) {
        await addTransaction({
          description: `${confirmedData.merchant} (Receipt)`,
          merchant: confirmedData.merchant,
          amount: confirmedData.amount,
          currency: confirmedData.currency || currency,
          type: 'expense',
          categoryId: confirmedData.categoryId,
          categoryName: confirmedData.categoryName,
          date: confirmedData.date,
          paymentMethod: confirmedData.paymentMethod,
          source: 'receipt',
          receipt_id: activeReceipt.id,
          notes: confirmedData.notes || `Scanned receipt expense from ${confirmedData.merchant}`,
        });
      }

      setSuccessMessage(`Expense of ${confirmedData.amount} ${confirmedData.currency || currency} at ${confirmedData.merchant} successfully recorded in your ledger!`);
      setActiveReceipt(null);
      setSelectedFile(null);
      setFilePreview(null);
      setActiveTab('history');
      loadReceipts();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      throw err;
    } finally {
      setConfirmLoading(false);
    }
  };

  // Discard / Retake
  const handleCancelReview = () => {
    setActiveReceipt(null);
    setSelectedFile(null);
    setFilePreview(null);
    setActiveTab('scan');
  };

  // Select receipt from history to view / review
  const handleSelectReceiptFromHistory = (receipt) => {
    setActiveReceipt(receipt);
    setActiveTab('review');
  };

  // Delete receipt confirmation
  const handleDeleteReceipt = async (id) => {
    try {
      await deleteReceiptRecord({ receiptId: id, session, isDemoUser });
      setReceiptsList((prev) => prev.filter((r) => r.id !== id));
      if (activeReceipt?.id === id) {
        setActiveReceipt(null);
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Delete receipt failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#447F98]/15 text-[#447F98] dark:text-[#83BDCF] text-xs font-semibold mb-2">
            <Sparkles size={12} />
            <span>AI Multimodal OCR Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Smart Receipt Scanning & OCR
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Scan physical or digital receipts to extract merchants, dates, amounts, taxes, and automatic category predictions.
          </p>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-[#447F98] text-white'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
            }`}
          >
            <ScanLine size={13} />
            <span>Scan New</span>
          </button>

          {activeReceipt && (
            <button
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'review'
                  ? 'bg-[#447F98] text-white'
                  : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
              }`}
            >
              <FileText size={13} />
              <span>Review Details</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#447F98] text-white'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
            }`}
          >
            <History size={13} />
            <span>Archive ({receiptsList.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SCAN & UPLOAD ZONE */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <Card className="border-dashed border-2 border-[#C4DCE3] dark:border-[#365765] text-center py-10 px-6 bg-white dark:bg-[#203D49]">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#B9D9E1]/30 dark:bg-[#365765]/60 text-[#447F98] dark:text-[#83BDCF] mx-auto flex items-center justify-center shadow-sm">
                <UploadCloud size={32} />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  {selectedFile ? 'Receipt Selected Ready to Scan' : 'Upload or Capture Receipt'}
                </h3>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
                  Supports JPG, JPEG, PNG, WEBP and PDF documents up to 10 MB.
                </p>
              </div>

              {/* Selected File Card Preview */}
              {selectedFile && (
                <div className="p-3.5 rounded-xl bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 truncate">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg shadow-sm shrink-0" />
                    ) : (
                      <FileText size={28} className="text-[#447F98] shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Scanning Progress */}
              {isScanning && (
                <div className="space-y-2.5 p-4 rounded-xl bg-[#B9D9E1]/20 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-[#243D49] dark:text-[#D6EBF3]">
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin text-[#447F98]" />
                      <span>{scanStage}</span>
                    </span>
                    <span className="text-[#447F98]">AI Processing</span>
                  </div>
                  <div className="w-full bg-[#B9D9E1]/60 dark:bg-[#365765] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#447F98] rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* Scan Error Message */}
              {scanError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 text-left">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {!selectedFile ? (
                  <>
                    <Button
                      variant="primary"
                      icon={UploadCloud}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                    <Button
                      variant="outline"
                      icon={Camera}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      Take Photo
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    icon={ScanLine}
                    onClick={() => startScan(false)}
                    disabled={isScanning}
                  >
                    {isScanning ? 'Extracting Information...' : 'Run Smart OCR'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Guarantee / Privacy Notice */}
          <div className="p-4 rounded-2xl bg-[#B9D9E1]/15 dark:bg-[#1B3541]/40 border border-[#C4DCE3]/50 dark:border-[#365765]/50 text-xs text-[#526C78] dark:text-[#83BDCF] flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 mt-0.5 text-[#447F98] dark:text-[#83BDCF]" />
            <div>
              <span className="font-bold text-[#243D49] dark:text-[#D6EBF3]">Explicit Review Guarantee:</span> Extracted receipt data is strictly staged for your review. No transaction is created or saved into your account balance until you verify and click "Confirm & Save Expense".
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW & CONFIRM SCREEN */}
      {activeTab === 'review' && activeReceipt && (
        <ReceiptReviewCard
          receipt={activeReceipt}
          categories={categories}
          onConfirm={handleConfirmReceipt}
          onCancel={handleCancelReview}
          loading={confirmLoading}
        />
      )}

      {/* TAB 3: RECEIPT HISTORY ARCHIVE */}
      {activeTab === 'history' && (
        <ReceiptHistorySection
          receipts={receiptsList}
          onSelectReceipt={handleSelectReceiptFromHistory}
          onDeleteReceipt={(id) => setDeletingId(id)}
          loading={historyLoading}
        />
      )}

      {/* Duplicate Receipt Modal */}
      <DuplicateReceiptModal
        isOpen={Boolean(duplicateData)}
        onClose={() => setDuplicateData(null)}
        existingReceipt={duplicateData?.existingReceipt}
        onForceProcess={() => startScan(true)}
        onViewExisting={(existing) => {
          setActiveReceipt(existing);
          setActiveTab('review');
        }}
      />

      {/* Delete Receipt Confirmation Modal */}
      <DeleteBudgetLimitModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Scanned Receipt"
        message="Are you sure you want to remove this receipt from your archive? If this receipt was already converted into a transaction, your ledger record will remain intact."
        itemName="Scanned Receipt Document"
        onConfirm={async () => {
          if (deletingId) {
            await handleDeleteReceipt(deletingId);
          }
        }}
      />
    </div>
  );
}

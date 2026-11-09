import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  RefreshCw,
  Sliders,
  Check,
  X,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTransactions } from '../context/TransactionContext';
import { PAYMENT_METHODS } from '../data/transactionOptions';
import {
  parseCSVStatement,
  autoDetectColumnMapping,
  mapCSVRowsToCandidates,
  parseOFXStatement,
  detectDuplicates,
  getSampleBankStatements,
} from '../services/statementParser';
import {
  fetchBankImportHistory,
  commitBankImportBatch,
  deleteBankImportRecord,
} from '../services/bankImportService';

const POPULAR_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Chase Bank',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Barclays',
  'Other / Generic Bank',
];

export default function BankImports() {
  const navigate = useNavigate();
  const { user, isDemoUser, session } = useAuth();
  const { currency, formatAmount } = useCurrency();
  const { transactions: existingTransactions, categories, addTransactionsBulk } = useTransactions();

  // Active top-level tab: 'wizard' or 'history'
  const [activeTab, setActiveTab] = useState('wizard');

  // Wizard step: 'upload' | 'mapping' | 'preview' | 'complete'
  const [step, setStep] = useState('upload');

  // Step 1: File selection & upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFileContent, setRawFileContent] = useState('');
  const [fileType, setFileType] = useState(''); // 'csv' | 'ofx'
  const [bankName, setBankName] = useState('HDFC Bank');
  const [customBankName, setCustomBankName] = useState('');
  const [statementCurrency, setStatementCurrency] = useState(currency || 'INR');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Step 2: CSV parsed raw data & column mapping
  const [parsedCSV, setParsedCSV] = useState(null); // { headers, rows, delimiter }
  const [columnMapping, setColumnMapping] = useState({
    dateCol: '',
    descCol: '',
    amountCol: '',
    debitCol: '',
    creditCol: '',
    balanceCol: '',
    refCol: '',
    isSingleAmount: false,
  });

  // Step 3: Candidate transactions preview table
  const [candidateTransactions, setCandidateTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income' | 'duplicate'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 4: Import completion result summary
  const [importResult, setImportResult] = useState(null);

  // Import History tab state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);

  // Load history on initial mount or tab change
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await fetchBankImportHistory({ session, isDemoUser });
      setHistoryList(list);
    } catch (e) {
      console.warn('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Helper for available category names
  const availableCategoryNames = useMemo(() => {
    return categories.map((c) => c.name);
  }, [categories]);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Process & Validate Selected File
  const processSelectedFile = (file) => {
    setUploadError('');
    if (!file) return;

    // Check size limit: 10 MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File exceeds the 10 MB limit. Please select a smaller bank statement.');
      return;
    }

    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    const isOFX = name.endsWith('.ofx') || name.endsWith('.qfx') || file.type.includes('ofx');

    if (!isCSV && !isOFX) {
      setUploadError('Unsupported file format. Please upload a standard bank statement in CSV (.csv) or OFX (.ofx) format.');
      return;
    }

    const detectedType = isOFX ? 'ofx' : 'csv';
    setSelectedFile(file);
    setFileType(detectedType);

    // Read content
    const reader = new FileReader();
    reader.onload = (event) => {
      setRawFileContent(event.target.result);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file. Please verify file permissions.');
    };
    reader.readAsText(file);
  };

  // Quick Loader for Sample Statements
  const handleLoadSample = (sampleType) => {
    const { sampleCSV, sampleOFX } = getSampleBankStatements();
    setUploadError('');

    if (sampleType === 'csv') {
      const mockFile = new File([sampleCSV], 'sample_hdfc_statement_nov2026.csv', { type: 'text/csv' });
      setSelectedFile(mockFile);
      setFileType('csv');
      setRawFileContent(sampleCSV);
      setBankName('HDFC Bank');
      setStatementCurrency('INR');
    } else {
      const mockFile = new File([sampleOFX], 'sample_chase_checking_nov2026.ofx', { type: 'application/x-ofx' });
      setSelectedFile(mockFile);
      setFileType('ofx');
      setRawFileContent(sampleOFX);
      setBankName('Chase Bank');
      setStatementCurrency('INR');
    }
  };

  // Step 1 -> Step 2 or 3: Proceed from Upload
  const handleProceedFromUpload = () => {
    if (!selectedFile || !rawFileContent) {
      setUploadError('Please select or drag-and-drop a bank statement file to proceed.');
      return;
    }

    const effectiveBankName = bankName === 'Other / Generic Bank' && customBankName.trim() ? customBankName.trim() : bankName;

    try {
      if (fileType === 'ofx') {
        // Parse OFX directly
        const ofxResult = parseOFXStatement(rawFileContent);
        if (ofxResult.detectedCurrency) {
          setStatementCurrency(ofxResult.detectedCurrency);
        }

        // Tag and deduplicate
        const tagged = ofxResult.transactions.map((tx) => {
          return {
            ...tx,
            merchant: tx.description,
            categoryName: tx.type === 'income' ? 'Income' : 'General',
            paymentMethod: 'Bank Transfer',
            currency: ofxResult.detectedCurrency || statementCurrency,
          };
        });

        const withDups = detectDuplicates(tagged, existingTransactions);
        setCandidateTransactions(withDups);
        setStep('preview');
      } else {
        // Parse CSV structure
        const csvRes = parseCSVStatement(rawFileContent);
        setParsedCSV(csvRes);

        // Auto-detect column mapping
        const detected = autoDetectColumnMapping(csvRes.headers);
        setColumnMapping(detected);

        setStep('mapping');
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to parse bank statement file.');
    }
  };

  // Step 2 -> Step 3: Proceed from Column Mapping
  const handleProceedFromMapping = () => {
    if (!parsedCSV) return;

    // Validate required mappings
    if (!columnMapping.dateCol) {
      alert('Please select the Date column.');
      return;
    }
    if (!columnMapping.descCol) {
      alert('Please select the Description column.');
      return;
    }
    if (columnMapping.isSingleAmount) {
      if (!columnMapping.amountCol) {
        alert('Please select the Amount column.');
        return;
      }
    } else {
      if (!columnMapping.debitCol && !columnMapping.creditCol) {
        alert('Please select at least one of Debit or Credit columns.');
        return;
      }
    }

    try {
      const candidates = mapCSVRowsToCandidates(
        parsedCSV.headers,
        parsedCSV.rows,
        columnMapping,
        statementCurrency,
        availableCategoryNames
      );

      if (candidates.length === 0) {
        alert('No valid transactions could be mapped from the CSV with current column selections.');
        return;
      }

      // Check duplicates against existing ledger
      const checkedCandidates = detectDuplicates(candidates, existingTransactions);
      setCandidateTransactions(checkedCandidates);
      setStep('preview');
    } catch (err) {
      alert(`Error mapping rows: ${err.message}`);
    }
  };

  // Candidate Table Row Modifications
  const toggleRowSelection = (id) => {
    setCandidateTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleSelectAll = (selectVal) => {
    setCandidateTransactions((prev) =>
      prev.map((t) => ({ ...t, selected: selectVal }))
    );
  };

  const handleDeselectDuplicates = () => {
    setCandidateTransactions((prev) =>
      prev.map((t) => (t.isDuplicate ? { ...t, selected: false } : t))
    );
  };

  const updateCandidateField = (id, field, value) => {
    setCandidateTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, [field]: value };
          if (field === 'type') {
            // Re-adjust category if switched to income
            if (value === 'income' && t.categoryName === 'General') {
              updated.categoryName = 'Income';
            }
          }
          return updated;
        }
        return t;
      })
    );
  };

  const deleteCandidateRow = (id) => {
    setCandidateTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Preview Metrics calculations
  const previewMetrics = useMemo(() => {
    const total = candidateTransactions.length;
    const selected = candidateTransactions.filter((t) => t.selected);
    const duplicates = candidateTransactions.filter((t) => t.isDuplicate).length;

    let totalDebit = 0;
    let totalCredit = 0;

    selected.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalCredit += amt;
      } else {
        totalDebit += amt;
      }
    });

    return {
      total,
      selectedCount: selected.length,
      duplicatesCount: duplicates,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
    };
  }, [candidateTransactions]);

  // Filtered Candidate List for Search & Filter
  const filteredCandidates = useMemo(() => {
    return candidateTransactions.filter((t) => {
      // Type Filter
      if (filterType === 'expense' && t.type !== 'expense') return false;
      if (filterType === 'income' && t.type !== 'income') return false;
      if (filterType === 'duplicate' && !t.isDuplicate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const d = (t.description || '').toLowerCase();
        const r = (t.reference || '').toLowerCase();
        const c = (t.categoryName || '').toLowerCase();
        const m = (t.paymentMethod || '').toLowerCase();
        const a = String(t.amount);
        return d.includes(q) || r.includes(q) || c.includes(q) || m.includes(q) || a.includes(q);
      }

      return true;
    });
  }, [candidateTransactions, filterType, searchQuery]);

  // Step 3 -> Step 4: Commit Import
  const handleCommitImport = async () => {
    const selectedRows = candidateTransactions.filter((t) => t.selected);
    if (selectedRows.length === 0) {
      alert('Please select at least one transaction to import.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const effectiveBankName = bankName === 'Other / Generic Bank' && customBankName.trim() ? customBankName.trim() : bankName;

    const batchData = {
      bank_name: effectiveBankName,
      file_name: selectedFile?.name || 'statement.csv',
      file_size: selectedFile?.size || 0,
      total_transactions: candidateTransactions.length,
      imported_transactions: selectedRows.length,
      duplicates_skipped: candidateTransactions.length - selectedRows.length,
      currency: statementCurrency,
      total_debit: previewMetrics.totalDebit,
      total_credit: previewMetrics.totalCredit,
    };

    try {
      const res = await commitBankImportBatch({
        importBatch: batchData,
        transactions: selectedRows,
        session,
        isDemoUser,
      });

      if (res && res.success) {
        // Live update the TransactionContext state so Dashboard, Budgets, and Analytics synchronize instantly!
        if (Array.isArray(res.createdTransactions) && res.createdTransactions.length > 0) {
          addTransactionsBulk(res.createdTransactions);
        } else {
          // Fallback to selected rows if server didn't return created rows
          addTransactionsBulk(selectedRows);
        }

        setImportResult({
          ...batchData,
          id: res.importRecord?.id || `bi-${Date.now()}`,
          createdCount: selectedRows.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setStep('complete');
      } else {
        throw new Error(res.error || 'Failed to complete bank import.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Error occurred while saving imported transactions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Wizard
  const handleResetWizard = () => {
    setSelectedFile(null);
    setRawFileContent('');
    setFileType('');
    setParsedCSV(null);
    setCandidateTransactions([]);
    setImportResult(null);
    setStep('upload');
  };

  // Delete Batch Record Handler
  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    setDeletingBatchId(batchToDelete.id);
    try {
      await deleteBankImportRecord({ importId: batchToDelete.id, session, isDemoUser });
      setHistoryList((prev) => prev.filter((b) => b.id !== batchToDelete.id));
      setBatchToDelete(null);
    } catch (err) {
      alert(`Could not delete batch record: ${err.message}`);
    } finally {
      setDeletingBatchId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <Landmark size={12} />
            <span>Smart Reconciliation (Phase 4)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Bank Statement Import
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Import CSV or OFX statements with intelligent column mapping, category auto-tagging, and ledger duplicate detection.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-white/70 dark:bg-[#1B3440]/70 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'wizard'
                ? 'bg-[#447F98] text-white shadow-xs'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
            }`}
          >
            <Upload size={14} />
            <span>Import Statement</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#447F98] text-white shadow-xs'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
            }`}
          >
            <Clock size={14} />
            <span>Import History</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STATEMENT IMPORT WIZARD                                            */}
      {/* ========================================================================= */}
      {activeTab === 'wizard' && (
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="bg-white/80 dark:bg-[#1B3440]/80 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
              <div className={`flex flex-col items-center gap-1.5 ${step === 'upload' ? 'text-[#447F98] dark:text-[#629BB5] font-bold' : 'text-[#526C78] dark:text-[#83BDCF]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'upload'
                    ? 'bg-[#447F98] text-white font-bold'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {step === 'upload' ? '1' : <Check size={14} />}
                </div>
                <span>1. Upload Statement</span>
              </div>

              <div className={`flex flex-col items-center gap-1.5 ${step === 'mapping' ? 'text-[#447F98] dark:text-[#629BB5] font-bold' : 'text-[#526C78] dark:text-[#83BDCF]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'mapping'
                    ? 'bg-[#447F98] text-white font-bold'
                    : (step === 'preview' || step === 'complete')
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-[#152B35] text-gray-400'
                }`}>
                  {step === 'preview' || step === 'complete' ? <Check size={14} /> : '2'}
                </div>
                <span>2. Column Mapping</span>
              </div>

              <div className={`flex flex-col items-center gap-1.5 ${step === 'preview' ? 'text-[#447F98] dark:text-[#629BB5] font-bold' : 'text-[#526C78] dark:text-[#83BDCF]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'preview'
                    ? 'bg-[#447F98] text-white font-bold'
                    : step === 'complete'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-[#152B35] text-gray-400'
                }`}>
                  {step === 'complete' ? <Check size={14} /> : '3'}
                </div>
                <span>3. Preview & Edit</span>
              </div>

              <div className={`flex flex-col items-center gap-1.5 ${step === 'complete' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#526C78] dark:text-[#83BDCF]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'complete'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'bg-gray-100 dark:bg-[#152B35] text-gray-400'
                }`}>
                  4
                </div>
                <span>4. Complete</span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: UPLOAD & CONFIGURATION                                */}
          {/* ------------------------------------------------------------- */}
          {step === 'upload' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Bank Institution Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1.5">
                      Bank / Financial Institution
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-sm text-[#243D49] dark:text-[#D6EBF3] focus:outline-hidden focus:ring-2 focus:ring-[#447F98]"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    {bankName === 'Other / Generic Bank' && (
                      <input
                        type="text"
                        placeholder="Enter bank or credit union name"
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        className="mt-2 w-full px-3.5 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-sm text-[#243D49] dark:text-[#D6EBF3] focus:outline-hidden focus:ring-2 focus:ring-[#447F98]"
                      />
                    )}
                  </div>

                  {/* Statement Currency */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1.5">
                      Statement Currency
                    </label>
                    <select
                      value={statementCurrency}
                      onChange={(e) => setStatementCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-sm text-[#243D49] dark:text-[#D6EBF3] focus:outline-hidden focus:ring-2 focus:ring-[#447F98]"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CAD">CAD ($) - Canadian Dollar</option>
                      <option value="AUD">AUD ($) - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                {/* Drag and drop upload zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#447F98] bg-[#447F98]/5 scale-[0.99]'
                      : 'border-[#C4DCE3] dark:border-[#2C4E5E] hover:border-[#447F98] dark:hover:border-[#629BB5] bg-white/40 dark:bg-[#1B3440]/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.ofx,.qfx,text/csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-[#447F98]/10 text-[#447F98] dark:text-[#629BB5] flex items-center justify-center mx-auto mb-3">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                    Upload Bank Statement File
                  </h3>
                  <p className="text-xs text-[#526C78] dark:text-[#83BDCF] max-w-md mx-auto mb-3">
                    Drag and drop your file here, or click to browse. Supports CSV (any column format) and OFX / QFX files up to 10 MB.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#152B35] text-[11px] font-medium text-[#526C78] dark:text-[#83BDCF]">
                    <span>Accepted:</span>
                    <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">.CSV, .OFX, .QFX</span>
                    <span>• Max:</span>
                    <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">10 MB</span>
                  </div>
                </div>

                {/* Upload Error display */}
                {uploadError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Selected File Details & Actions */}
                {selectedFile && (
                  <div className="mt-4 p-4 rounded-xl bg-[#447F98]/10 border border-[#447F98]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#447F98] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {fileType}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] flex items-center gap-2">
                          <span>{selectedFile.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                            Ready
                          </span>
                        </div>
                        <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {fileType.toUpperCase()} Format
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold text-[#447F98] dark:text-[#629BB5] hover:underline"
                      >
                        Change File
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setRawFileContent('');
                          setFileType('');
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Next Step Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="primary"
                    disabled={!selectedFile || !rawFileContent}
                    onClick={handleProceedFromUpload}
                    className="flex items-center gap-2"
                  >
                    <span>{fileType === 'ofx' ? 'Proceed to Preview' : 'Configure Column Mapping'}</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>

              {/* Sample Statement Quick Test Loaders */}
              <Card className="p-6 border-dashed border-[#447F98]/30 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">
                      Test Instantly with Sample Bank Statements
                    </h4>
                    <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5 mb-3">
                      Don't have a statement at hand? Load our pre-packaged realistic statements with real-world debits, credits, and duplicate entries to test reconciliation:
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadSample('csv')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <FileText size={14} className="text-emerald-500" />
                        <span>Load Sample HDFC Statement (CSV)</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadSample('ofx')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Landmark size={14} className="text-blue-500" />
                        <span>Load Sample Chase Statement (OFX)</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: CSV COLUMN MAPPING                                    */}
          {/* ------------------------------------------------------------- */}
          {step === 'mapping' && parsedCSV && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                      Map CSV Columns to SpendWise Fields
                    </h3>
                    <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                      Detected {parsedCSV.headers.length} headers and {parsedCSV.rows.length} rows in <span className="font-semibold">{selectedFile?.name}</span>.
                    </p>
                  </div>
                  <Badge variant="info">
                    Delimiter: {parsedCSV.delimiter === '\t' ? 'Tab' : parsedCSV.delimiter === ';' ? 'Semicolon' : 'Comma'}
                  </Badge>
                </div>

                {/* Amount Structure Mode Switch */}
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#152B35]/70 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40">
                  <label className="block text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] mb-2">
                    How does your bank format transaction amounts?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setColumnMapping((prev) => ({ ...prev, isSingleAmount: false }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !columnMapping.isSingleAmount
                          ? 'border-[#447F98] bg-[#447F98]/10 text-[#243D49] dark:text-[#D6EBF3] font-bold shadow-xs'
                          : 'border-[#C4DCE3]/60 dark:border-[#2C4E5E]/40 text-[#526C78] dark:text-[#83BDCF] hover:bg-white dark:hover:bg-[#1B3440]'
                      }`}
                    >
                      <div className="text-xs font-bold">Separate Debit & Credit Columns</div>
                      <div className="text-[11px] opacity-75 font-normal">Common in Indian banks (HDFC, SBI, ICICI)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setColumnMapping((prev) => ({ ...prev, isSingleAmount: true }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        columnMapping.isSingleAmount
                          ? 'border-[#447F98] bg-[#447F98]/10 text-[#243D49] dark:text-[#D6EBF3] font-bold shadow-xs'
                          : 'border-[#C4DCE3]/60 dark:border-[#2C4E5E]/40 text-[#526C78] dark:text-[#83BDCF] hover:bg-white dark:hover:bg-[#1B3440]'
                      }`}
                    >
                      <div className="text-xs font-bold">Single Amount Column</div>
                      <div className="text-[11px] opacity-75 font-normal">Negative for debits/spent, positive for credits</div>
                    </button>
                  </div>
                </div>

                {/* Column Selectors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {/* Date Column */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                      Date Column <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={columnMapping.dateCol}
                      onChange={(e) => setColumnMapping((prev) => ({ ...prev, dateCol: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                    >
                      <option value="">-- Select Date Column --</option>
                      {parsedCSV.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description Column */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                      Description / Narration <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={columnMapping.descCol}
                      onChange={(e) => setColumnMapping((prev) => ({ ...prev, descCol: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                    >
                      <option value="">-- Select Description Column --</option>
                      {parsedCSV.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Configuration */}
                  {columnMapping.isSingleAmount ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                        Amount Column <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={columnMapping.amountCol}
                        onChange={(e) => setColumnMapping((prev) => ({ ...prev, amountCol: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                      >
                        <option value="">-- Select Amount Column --</option>
                        {parsedCSV.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                          Debit (Withdrawal) Column
                        </label>
                        <select
                          value={columnMapping.debitCol}
                          onChange={(e) => setColumnMapping((prev) => ({ ...prev, debitCol: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                        >
                          <option value="">-- (Optional / None) --</option>
                          {parsedCSV.headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                          Credit (Deposit) Column
                        </label>
                        <select
                          value={columnMapping.creditCol}
                          onChange={(e) => setColumnMapping((prev) => ({ ...prev, creditCol: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                        >
                          <option value="">-- (Optional / None) --</option>
                          {parsedCSV.headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Reference Column */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                      Reference / Cheque No. (Optional)
                    </label>
                    <select
                      value={columnMapping.refCol}
                      onChange={(e) => setColumnMapping((prev) => ({ ...prev, refCol: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                    >
                      <option value="">-- None --</option>
                      {parsedCSV.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Balance Column */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                      Balance Column (Optional)
                    </label>
                    <select
                      value={columnMapping.balanceCol}
                      onChange={(e) => setColumnMapping((prev) => ({ ...prev, balanceCol: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                    >
                      <option value="">-- None --</option>
                      {parsedCSV.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live First 3 Rows Preview */}
                <div className="border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/40 rounded-xl overflow-hidden mb-6">
                  <div className="bg-gray-100 dark:bg-[#152B35] px-4 py-2 text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] flex items-center justify-between">
                    <span>File Sample Preview (First 3 Rows)</span>
                    <span className="text-[11px] font-normal text-[#526C78] dark:text-[#83BDCF]">
                      Verify headers match the contents
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-[#172E38] text-[#526C78] dark:text-[#83BDCF] border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40">
                        <tr>
                          {parsedCSV.headers.slice(0, 6).map((h) => (
                            <th key={h} className="p-2.5 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C4DCE3]/30 dark:divide-[#2C4E5E]/30 text-[#243D49] dark:text-[#D6EBF3]">
                        {parsedCSV.rows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.slice(0, 6).map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                                {cell || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Back / Next actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep('upload')}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Upload</span>
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleProceedFromMapping}
                    className="flex items-center gap-1.5"
                  >
                    <span>Proceed to Transaction Preview</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: TRANSACTION PREVIEW & SELECTION                       */}
          {/* ------------------------------------------------------------- */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Card className="p-3 text-center">
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">Total Parsed</div>
                  <div className="text-lg font-bold text-[#243D49] dark:text-[#D6EBF3] mt-0.5">
                    {previewMetrics.total}
                  </div>
                </Card>

                <Card className="p-3 text-center border-[#447F98]/40">
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">Selected</div>
                  <div className="text-lg font-bold text-[#447F98] dark:text-[#629BB5] mt-0.5">
                    {previewMetrics.selectedCount} / {previewMetrics.total}
                  </div>
                </Card>

                <Card className="p-3 text-center">
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">Debits (Expenses)</div>
                  <div className="text-lg font-bold text-rose-500 mt-0.5">
                    {formatAmount(previewMetrics.totalDebit, statementCurrency)}
                  </div>
                </Card>

                <Card className="p-3 text-center">
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">Credits (Income)</div>
                  <div className="text-lg font-bold text-emerald-500 mt-0.5">
                    {formatAmount(previewMetrics.totalCredit, statementCurrency)}
                  </div>
                </Card>

                <Card className="p-3 text-center col-span-2 sm:col-span-1">
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">Duplicates Flagged</div>
                  <div className={`text-lg font-bold mt-0.5 ${previewMetrics.duplicatesCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {previewMetrics.duplicatesCount}
                  </div>
                </Card>
              </div>

              {/* Table Controls (Search, Filter, Selection actions) */}
              <Card className="p-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" />
                    <input
                      type="text"
                      placeholder="Search by description, reference, category, or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3] focus:outline-hidden focus:ring-2 focus:ring-[#447F98]"
                    />
                  </div>

                  {/* Filter Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                    >
                      <option value="all">All Rows ({candidateTransactions.length})</option>
                      <option value="expense">Expenses Only</option>
                      <option value="income">Income Only</option>
                      <option value="duplicate">Duplicates Only ({previewMetrics.duplicatesCount})</option>
                    </select>

                    <button
                      onClick={() => handleSelectAll(true)}
                      className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/50 text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleSelectAll(false)}
                      className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/50 text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]"
                    >
                      Deselect All
                    </button>

                    {previewMetrics.duplicatesCount > 0 && (
                      <button
                        onClick={handleDeselectDuplicates}
                        className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                      >
                        Exclude Duplicates
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Transactions Editable Preview Table */}
              <div className="bg-white/80 dark:bg-[#1B3440]/80 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 dark:bg-[#172E38]/80 text-[#526C78] dark:text-[#83BDCF] border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={previewMetrics.selectedCount === candidateTransactions.length && candidateTransactions.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded text-[#447F98]"
                          />
                        </th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Description / Merchant</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Payment Method</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                        <th className="p-3 font-semibold">Reference</th>
                        <th className="p-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C4DCE3]/30 dark:divide-[#2C4E5E]/30">
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
                            No transactions match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              row.selected
                                ? 'bg-white dark:bg-[#1B3440]'
                                : 'bg-gray-50/50 dark:bg-[#152B35]/50 opacity-60'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => toggleRowSelection(row.id)}
                                className="rounded text-[#447F98]"
                              />
                            </td>

                            {/* Status / Duplicate warning */}
                            <td className="p-3 whitespace-nowrap">
                              {row.isDuplicate ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]"
                                  title={row.duplicateReason}
                                >
                                  <AlertTriangle size={11} />
                                  <span>Duplicate</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                  <Check size={11} />
                                  <span>Ready</span>
                                </span>
                              )}
                            </td>

                            {/* Date (editable) */}
                            <td className="p-3 whitespace-nowrap">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) => updateCandidateField(row.id, 'date', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-xs text-[#243D49] dark:text-[#D6EBF3]"
                              />
                            </td>

                            {/* Description (editable) */}
                            <td className="p-3 min-w-[200px]">
                              <input
                                type="text"
                                value={row.description}
                                onChange={(e) => updateCandidateField(row.id, 'description', e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-xs text-[#243D49] dark:text-[#D6EBF3]"
                              />
                            </td>

                            {/* Type toggle */}
                            <td className="p-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => updateCandidateField(row.id, 'type', row.type === 'expense' ? 'income' : 'expense')}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                                  row.type === 'income'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {row.type}
                              </button>
                            </td>

                            {/* Category Selector */}
                            <td className="p-3 whitespace-nowrap">
                              <select
                                value={row.categoryName}
                                onChange={(e) => updateCandidateField(row.id, 'categoryName', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-xs text-[#243D49] dark:text-[#D6EBF3]"
                              >
                                {row.type === 'income' ? (
                                  <option value="Income">Income</option>
                                ) : (
                                  categories.map((c) => (
                                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                  ))
                                )}
                              </select>
                            </td>

                            {/* Payment Method Selector */}
                            <td className="p-3 whitespace-nowrap">
                              <select
                                value={row.paymentMethod}
                                onChange={(e) => updateCandidateField(row.id, 'paymentMethod', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-xs text-[#243D49] dark:text-[#D6EBF3]"
                              >
                                {PAYMENT_METHODS.map((pm) => (
                                  <option key={pm} value={pm}>{pm}</option>
                                ))}
                              </select>
                            </td>

                            {/* Amount (editable) */}
                            <td className="p-3 whitespace-nowrap text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={row.amount}
                                onChange={(e) => updateCandidateField(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                className={`w-24 px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-xs font-mono font-bold text-right ${
                                  row.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              />
                            </td>

                            {/* Reference Number */}
                            <td className="p-3 whitespace-nowrap">
                              <input
                                type="text"
                                placeholder="Ref #"
                                value={row.reference || ''}
                                onChange={(e) => updateCandidateField(row.id, 'reference', e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 bg-transparent text-[11px] font-mono text-[#526C78] dark:text-[#83BDCF]"
                              />
                            </td>

                            {/* Delete Row button */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteCandidateRow(row.id)}
                                className="text-gray-400 hover:text-rose-500 transition-colors"
                                title="Remove row from import"
                              >
                                <X size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Error alert */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Bottom Confirmation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/90 dark:bg-[#1B3440]/90 border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/50 shadow-xs">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(fileType === 'ofx' ? 'upload' : 'mapping')}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </Button>
                  <div className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                    {previewMetrics.selectedCount} transactions ready to commit with source <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">'Bank Statement Import'</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  disabled={previewMetrics.selectedCount === 0 || isSubmitting}
                  onClick={handleCommitImport}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Importing Transactions...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Import ({previewMetrics.selectedCount})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: IMPORT COMPLETED SUMMARY                              */}
          {/* ------------------------------------------------------------- */}
          {step === 'complete' && importResult && (
            <Card className="p-8 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <FileCheck2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  Statement Successfully Imported!
                </h3>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
                  Your bank transactions have been reconciled and posted to your SpendWise financial ledger.
                </p>
              </div>

              {/* Metrics Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#152B35]/70 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 text-left">
                <div>
                  <div className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">Imported Rows</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {importResult.createdCount}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">Duplicates Excluded</div>
                  <div className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                    {importResult.duplicates_skipped}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">Total Debits</div>
                  <div className="text-base font-bold text-rose-500">
                    {formatAmount(importResult.total_debit, importResult.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">Total Credits</div>
                  <div className="text-base font-bold text-emerald-500">
                    {formatAmount(importResult.total_credit, importResult.currency)}
                  </div>
                </div>
              </div>

              {/* Batch Meta info */}
              <div className="text-left p-3.5 rounded-xl bg-[#447F98]/5 border border-[#447F98]/20 text-xs text-[#526C78] dark:text-[#83BDCF] space-y-1">
                <div className="flex justify-between">
                  <span>Financial Institution:</span>
                  <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">{importResult.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>File Name:</span>
                  <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">{importResult.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Batch ID:</span>
                  <span className="font-mono text-[11px] text-[#243D49] dark:text-[#D6EBF3]">{importResult.id}</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/transactions')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>View in Transactions Ledger</span>
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto"
                >
                  <span>Go to Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleResetWizard}
                  className="w-full sm:w-auto text-xs"
                >
                  <span>Import Another File</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IMPORT HISTORY                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  Past Statement Import Batches
                </h3>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                  Audit log of statement files processed. Deleting an import history entry will keep all transactions in your ledger safe and preserved.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                disabled={loadingHistory}
                className="flex items-center gap-1.5 text-xs"
              >
                <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </Button>
            </div>

            {loadingHistory ? (
              <div className="p-12 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
                Loading import history...
              </div>
            ) : historyList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#152B35] text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] mb-1">
                  No Past Bank Imports Found
                </h4>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF] max-w-sm mx-auto mb-4">
                  You haven't imported any bank statements yet. Switch to the Import Statement tab to get started.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('wizard')}>
                  Start First Import
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#C4DCE3]/40 dark:divide-[#2C4E5E]/40 border border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40 rounded-xl overflow-hidden">
                {historyList.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 bg-white/60 dark:bg-[#1B3440]/60 hover:bg-white dark:hover:bg-[#1B3440] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#447F98]/10 text-[#447F98] dark:text-[#629BB5] flex items-center justify-center shrink-0">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">
                            {batch.bank_name || 'Bank Statement'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {batch.status || 'Completed'}
                          </span>
                        </div>
                        <div className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 font-mono">
                            <FileText size={12} />
                            {batch.file_name}
                          </span>
                          <span>•</span>
                          <span>
                            {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                          <span>•</span>
                          <span>{batch.imported_transactions || batch.total_transactions || 0} imported</span>
                          {batch.duplicates_skipped > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-500">{batch.duplicates_skipped} duplicates skipped</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-500">
                          -{formatAmount(batch.total_debit || 0, batch.currency || 'INR')}
                        </div>
                        <div className="text-xs font-bold text-emerald-500">
                          +{formatAmount(batch.total_credit || 0, batch.currency || 'INR')}
                        </div>
                      </div>

                      <button
                        onClick={() => setBatchToDelete(batch)}
                        className="p-2 rounded-lg text-[#526C78] dark:text-[#83BDCF] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete batch record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Confirmation Modal for Deleting Batch Record */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Remove Import History Record?
              </h3>
            </div>

            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Are you sure you want to delete the log for <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">{batchToDelete.bank_name}</span> ({batchToDelete.file_name})?
            </p>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              <strong>Notice:</strong> Your transactions in the financial ledger will <strong>not</strong> be deleted. They will remain completely safe. Only the batch history entry will be removed.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBatchToDelete(null)}
                disabled={Boolean(deletingBatchId)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDeleteBatch}
                disabled={Boolean(deletingBatchId)}
                className="flex items-center gap-1.5"
              >
                {deletingBatchId ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Delete History Log</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { ScanLine, UploadCloud, FileText, Sparkles, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function ScanReceipt() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
          <Sparkles size={12} />
          <span>AI OCR Engine</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
          Receipt Scanner (OCR)
        </h2>
        <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
          Upload any paper or digital receipt to automatically extract merchant, amount, date, and suggested category.
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 border-[#C4DCE3]/40 text-center py-12 px-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF] mx-auto flex items-center justify-center">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#243D49] dark:text-[#D6EBF3]">
              Drag and drop your receipt here
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
              Supports JPEG, PNG, WEBP and PDF up to 10MB
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" icon={ScanLine}>
              Browse Files to Scan
            </Button>
          </div>
        </div>
      </Card>

      {/* Safety Notice per guidelines */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Review Guarantee:</span> Extracted receipts are never automatically saved without your explicit confirmation. You will review and edit merchant, line items, and amount before persisting.
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { Landmark, Upload, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function BankImports() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
          <ShieldCheck size={12} />
          <span>Statement Importer</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
          Bank Transaction Imports
        </h2>
        <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
          Import statement data from your financial institution with intelligent duplicate detection and category auto-tagging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Upload size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] mb-1">
            CSV / OFX Upload
          </h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mb-4">
            Upload exported transactions from Chase, BoA, Wells Fargo or credit card portals.
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Choose CSV File
          </Button>
        </Card>

        <Card className="text-center p-6 border-[#C4DCE3]/40">
          <div className="w-12 h-12 rounded-xl bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF] flex items-center justify-center mx-auto mb-3">
            <Landmark size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] mb-1">
            Mock Sandbox Bank
          </h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mb-4">
            Test import pipeline with 15 pre-configured bank transactions ready for deduplication.
          </p>
          <Button variant="primary" size="sm" className="w-full">
            Load Mock Bank Feed
          </Button>
        </Card>

        <Card className="text-center p-6 opacity-60">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] mb-1">
            Live Open Banking
          </h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mb-4">
            Direct connection via Plaid / Teller financial provider API (Ready for Phase 6).
          </p>
          <Button variant="outline" size="sm" disabled className="w-full">
            Provider Integration
          </Button>
        </Card>
      </div>
    </div>
  );
}


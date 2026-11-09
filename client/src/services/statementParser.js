/**
 * SpendWise Statement Parser & Normalization Engine
 * Handles CSV and OFX parsing, column auto-detection, date normalization,
 * category auto-tagging, and intra-statement deduplication.
 */

/**
 * Strips Byte Order Mark (BOM) and normalizes line endings
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Robust CSV Line Splitter (handles commas inside quotes and escaped quotes)
 */
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect delimiter: comma, semicolon, tab, pipe
 */
function detectDelimiter(firstFewLines) {
  const sample = firstFewLines.slice(0, 5).join('\n');
  const commaCount = (sample.match(/,/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  const pipeCount = (sample.match(/\|/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  if (pipeCount > commaCount) return '|';
  return ',';
}

/**
 * Main CSV Parser
 */
export function parseCSVStatement(rawText) {
  const cleaned = cleanText(rawText);
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('The selected CSV file is empty.');
  }

  const delimiter = detectDelimiter(lines);

  // Auto-detect header row by scanning first 10 rows for financial keywords
  const headerKeywords = ['date', 'time', 'desc', 'narration', 'particulars', 'amount', 'debit', 'credit', 'balance', 'ref', 'chq'];
  let headerIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const cols = parseCSVLine(lines[i], delimiter).map((c) => c.toLowerCase());
    const matchCount = cols.filter((col) => headerKeywords.some((kw) => col.includes(kw))).length;
    if (matchCount >= 2) {
      headerIndex = i;
      break;
    }
  }

  // Fallback to first line if no header match found
  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const rawHeaders = parseCSVLine(lines[headerIndex], delimiter);
  // Clean headers
  const headers = rawHeaders.map((h, idx) => (h && h.trim().length > 0 ? h.trim() : `Column ${idx + 1}`));

  const dataRows = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i], delimiter);
    // Ignore lines that don't have enough columns or are summary lines
    if (parsed.length >= 2 && parsed.some((val) => val.length > 0)) {
      dataRows.push(parsed);
    }
  }

  return {
    headers,
    rows: dataRows,
    headerIndex,
    delimiter,
    totalRows: dataRows.length,
  };
}

/**
 * Auto-detect Column Mapping from Headers
 */
export function autoDetectColumnMapping(headers) {
  const mapping = {
    dateCol: '',
    descCol: '',
    amountCol: '',
    debitCol: '',
    creditCol: '',
    balanceCol: '',
    refCol: '',
    isSingleAmount: true,
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // 1. Date column
  const dateIdx = lowerHeaders.findIndex((h) =>
    h === 'date' || h.includes('transaction date') || h.includes('txn date') || h.includes('value date') || h.includes('posting date') || h.includes('date')
  );
  if (dateIdx >= 0) mapping.dateCol = headers[dateIdx];

  // 2. Description column
  const descIdx = lowerHeaders.findIndex((h) =>
    h.includes('narration') || h.includes('particulars') || h.includes('description') || h.includes('memo') || h.includes('details') || h.includes('payee') || h.includes('remark')
  );
  if (descIdx >= 0) mapping.descCol = headers[descIdx];

  // 3. Check for separate Debit / Credit columns
  const debitIdx = lowerHeaders.findIndex((h) =>
    h === 'debit' || h === 'dr' || h.includes('debit') || h.includes('withdrawal') || h.includes('spent')
  );
  const creditIdx = lowerHeaders.findIndex((h) =>
    h === 'credit' || h === 'cr' || h.includes('credit') || h.includes('deposit') || h.includes('received')
  );

  if (debitIdx >= 0 && creditIdx >= 0) {
    mapping.debitCol = headers[debitIdx];
    mapping.creditCol = headers[creditIdx];
    mapping.isSingleAmount = false;
  } else {
    // 4. Single Amount column
    const amountIdx = lowerHeaders.findIndex((h) =>
      h === 'amount' || h.includes('net amount') || h.includes('txn amount') || h.includes('transaction amount') || h.includes('amount')
    );
    if (amountIdx >= 0) {
      mapping.amountCol = headers[amountIdx];
      mapping.isSingleAmount = true;
    }
  }

  // 5. Balance column
  const balIdx = lowerHeaders.findIndex((h) =>
    h.includes('balance') || h.includes('closing balance') || h.includes('running balance')
  );
  if (balIdx >= 0) mapping.balanceCol = headers[balIdx];

  // 6. Reference column
  const refIdx = lowerHeaders.findIndex((h) =>
    h.includes('ref') || h.includes('cheque') || h.includes('chq') || h.includes('utr') || h.includes('txn id') || h.includes('transaction id')
  );
  if (refIdx >= 0) mapping.refCol = headers[refIdx];

  return mapping;
}

/**
 * OFX / QFX Statement Parser
 */
export function parseOFXStatement(rawText) {
  const cleaned = cleanText(rawText);

  // Extract currency if present: <CURDEF>USD or <CURDEF>INR
  const curMatch = cleaned.match(/<CURDEF>([A-Za-z]{3})/i);
  const detectedCurrency = curMatch ? curMatch[1].toUpperCase() : 'INR';

  // Extract Bank / Account identifier
  const bankMatch = cleaned.match(/<BANKID>([^<\r\n]+)/i);
  const acctMatch = cleaned.match(/<ACCTID>([^<\r\n]+)/i);
  const bankName = bankMatch ? `Bank ID: ${bankMatch[1].trim()}` : acctMatch ? `Account: ${acctMatch[1].trim()}` : 'OFX Bank Statement';

  // Extract all <STMTTRN>...</STMTTRN> transaction blocks
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  const matches = [...cleaned.matchAll(trnRegex)];

  // Fallback for SGML without closing tag
  let trnBlocks = [];
  if (matches.length > 0) {
    trnBlocks = matches.map((m) => m[1]);
  } else {
    // Split by <STMTTRN>
    const parts = cleaned.split(/<STMTTRN>/i);
    parts.shift(); // remove preamble
    trnBlocks = parts;
  }

  if (trnBlocks.length === 0) {
    throw new Error('No valid financial transactions (<STMTTRN>) detected in this OFX file.');
  }

  const transactions = [];

  trnBlocks.forEach((block, idx) => {
    const getTag = (tag) => {
      const reg = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
      const m = block.match(reg);
      return m ? m[1].trim() : '';
    };

    const trnType = getTag('TRNTYPE').toUpperCase(); // DEBIT, CREDIT, CHECK, POS, etc.
    const dtPostedRaw = getTag('DTPOSTED');
    const trnAmtRaw = getTag('TRNAMT');
    const fitId = getTag('FITID') || `ofx-fitid-${idx}`;
    const name = getTag('NAME') || getTag('MEMO') || 'Bank Transaction';
    const memo = getTag('MEMO');
    const checkNum = getTag('CHECKNUM') || getTag('REFNUM');

    // Parse amount
    const amtNum = parseFloat(trnAmtRaw.replace(/[^0-9.-]/g, ''));
    if (isNaN(amtNum) || amtNum === 0) return;

    // In OFX: negative amount = DEBIT (expense), positive = CREDIT (income)
    const isCredit = trnType === 'CREDIT' || amtNum > 0;
    const finalAmount = Math.abs(amtNum);

    // Format DTPOSTED (YYYYMMDDHHMMSS or YYYYMMDD) -> YYYY-MM-DD
    let formattedDate = new Date().toISOString().split('T')[0];
    if (dtPostedRaw && dtPostedRaw.length >= 8) {
      const year = dtPostedRaw.slice(0, 4);
      const month = dtPostedRaw.slice(4, 6);
      const day = dtPostedRaw.slice(6, 8);
      formattedDate = `${year}-${month}-${day}`;
    }

    const description = memo && memo !== name ? `${name} - ${memo}` : name;

    transactions.push({
      id: `ofx-${fitId}`,
      fitId,
      date: formattedDate,
      description,
      amount: finalAmount,
      type: isCredit ? 'income' : 'expense',
      reference: fitId || checkNum || '',
      currency: detectedCurrency,
    });
  });

  return {
    bankName,
    detectedCurrency,
    transactions,
    totalTransactions: transactions.length,
  };
}

/**
 * Normalizes various Date formats into standard "YYYY-MM-DD"
 */
export function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const str = dateStr.trim();

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Named month format: 15-Nov-2026 or 15 Nov 2026 or Nov 15, 2026
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const namedMatch = str.match(/(\d{1,2})[-/.\s]+([a-zA-Z]{3,9})[-/.\s]+(\d{2,4})/);
  if (namedMatch) {
    const day = namedMatch[1].padStart(2, '0');
    const mStr = namedMatch[2].slice(0, 3).toLowerCase();
    const month = monthNames[mStr] || '01';
    let year = namedMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // 3. DD/MM/YYYY vs MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    let year = slashMatch[3];
    if (year.length === 2) year = `20${year}`;

    // If first number > 12, it must be DD/MM/YYYY
    if (first > 12) {
      return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
    }
    // Default standard international financial statements: DD/MM/YYYY
    return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Cleans and parses raw numeric amount string
 */
export function normalizeAmount(rawVal) {
  if (rawVal === undefined || rawVal === null) return { amount: 0, isNegative: false };
  let str = String(rawVal).trim();

  // Check parenthesized negative e.g. (120.50)
  let isNegative = false;
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.replace(/[()]/g, '');
  }

  if (str.includes('-')) {
    isNegative = true;
  }

  // Remove currency symbols, spaces, commas
  const cleanNumStr = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanNumStr);
  return {
    amount: isNaN(parsed) ? 0 : Math.abs(parsed),
    isNegative,
  };
}

/**
 * Auto-tag Category & Payment Method based on transaction description
 */
export function autoTagCategoryAndMethod(description = '', isIncome = false, availableCategories = []) {
  if (isIncome) {
    return {
      categoryName: 'Income',
      paymentMethod: 'Bank Transfer',
    };
  }

  const d = description.toLowerCase();

  // Payment Method detection
  let paymentMethod = 'Bank Transfer';
  if (d.includes('upi') || d.includes('/upi/') || d.includes('@ok') || d.includes('@paytm')) {
    paymentMethod = 'UPI';
  } else if (d.includes('neft') || d.includes('rtgs') || d.includes('imps') || d.includes('wire')) {
    paymentMethod = 'Bank Transfer';
  } else if (d.includes('netbank') || d.includes('inb') || d.includes('net banking')) {
    paymentMethod = 'Net Banking';
  } else if (d.includes('pos') || d.includes('debit') || d.includes('card')) {
    paymentMethod = 'Debit Card';
  } else if (d.includes('atm') || d.includes('cash wdl')) {
    paymentMethod = 'Cash';
  } else if (d.includes('ach') || d.includes('auto-debit') || d.includes('direct debit')) {
    paymentMethod = 'Debit Card';
  }

  // Category matching
  let categoryName = 'General';

  if (/(grocery|supermarket|mart|fresh|whole foods|trader joe|walmart|foodland|bigbasket|blinkit|zepto|instacart|costco|spencer)/.test(d)) {
    categoryName = 'Groceries & Food';
  } else if (/(restaurant|cafe|coffee|starbucks|bistro|diner|mcdonald|burger|pizza|subway|zomato|swiggy|uber eats|doordash|bakery|bar)/.test(d)) {
    categoryName = 'Dining Out';
  } else if (/(fuel|gas|petrol|diesel|shell|bp|chevron|exxon|uber|lyft|ola|taxi|metro|railway|train|transit|toll|parking)/.test(d)) {
    categoryName = 'Transport & Fuel';
  } else if (/(electric|power|water|gas bill|utility|energy|broadband|internet|wifi|phone|mobile|airtel|jio|verizon|at&t|recharge)/.test(d)) {
    categoryName = 'Utilities & Bills';
  } else if (/(netflix|spotify|youtube|hulu|disney|prime|steam|playstation|cinema|theater|movie|concert|ticket)/.test(d)) {
    categoryName = 'Entertainment & Leisure';
  } else if (/(pharmacy|chemist|cvs|walgreens|clinic|hospital|dental|gym|fitness|health|doctor|medicine|meds|apollo)/.test(d)) {
    categoryName = 'Health & Fitness';
  } else if (/(rent|lease|maintenance|society|property|mortgage|apartment|hoa)/.test(d)) {
    categoryName = 'Housing & Rent';
  } else if (/(amazon|ebay|flipkart|apple|myntra|zara|h&m|clothing|apparel|shoes|retail|mall|store)/.test(d)) {
    categoryName = 'Shopping';
  }

  // Fallback: verify that category exists in user categories, or default to first expense category
  const exists = availableCategories.some((c) => c.toLowerCase() === categoryName.toLowerCase());
  if (!exists && availableCategories.length > 0) {
    categoryName = availableCategories[0];
  }

  return { categoryName, paymentMethod };
}

/**
 * Intelligent Duplicate Detection:
 * Flags duplicates within statement & against already recorded ledger transactions
 */
export function detectDuplicates(candidateTransactions, existingLedgerTransactions = []) {
  const seenInBatch = new Set();

  return candidateTransactions.map((tx) => {
    let isDuplicate = false;
    let duplicateReason = '';

    // 1. Intra-statement duplicate check
    const batchKey = `${tx.date}_${tx.amount}_${tx.type}_${(tx.description || '').toLowerCase()}`;
    if (seenInBatch.has(batchKey)) {
      isDuplicate = true;
      duplicateReason = 'Duplicate row within statement file';
    } else {
      seenInBatch.add(batchKey);
    }

    // 2. Ledger duplicate check (against already saved transactions)
    if (!isDuplicate && existingLedgerTransactions.length > 0) {
      const matchInLedger = existingLedgerTransactions.find((saved) => {
        const dateMatch = saved.date === tx.date;
        const amountMatch = Math.abs(Number(saved.amount) - Number(tx.amount)) < 0.01;
        const typeMatch = saved.type === tx.type;

        if (dateMatch && amountMatch && typeMatch) {
          // If reference number matches
          if (tx.reference && saved.reference_number && tx.reference === saved.reference_number) {
            return true;
          }
          // If merchant/description closely aligns
          const sDesc = (saved.description || '').toLowerCase();
          const sMerch = (saved.merchant || '').toLowerCase();
          const tDesc = (tx.description || '').toLowerCase();
          if (sDesc.includes(tDesc) || tDesc.includes(sDesc) || (sMerch && tDesc.includes(sMerch))) {
            return true;
          }
        }
        return false;
      });

      if (matchInLedger) {
        isDuplicate = true;
        duplicateReason = `Matches transaction already in ledger (${matchInLedger.date}: ${matchInLedger.description})`;
      }
    }

    return {
      ...tx,
      isDuplicate,
      duplicateReason,
      // Uncheck duplicate transactions by default so user doesn't double-import
      selected: !isDuplicate,
    };
  });
}

/**
 * Map CSV rows to candidate transaction objects using resolved column mapping
 */
export function mapCSVRowsToCandidates(headers, rows, mapping, defaultCurrency = 'INR', availableCategories = []) {
  const headerMap = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const candidates = [];

  rows.forEach((row, idx) => {
    const getVal = (colName) => {
      if (!colName || headerMap[colName] === undefined) return '';
      return (row[headerMap[colName]] || '').trim();
    };

    const rawDate = getVal(mapping.dateCol);
    const date = normalizeDate(rawDate);
    const description = getVal(mapping.descCol) || 'Bank Transaction';
    const reference = getVal(mapping.refCol) || '';

    let amount = 0;
    let type = 'expense';

    if (!mapping.isSingleAmount) {
      // Separate Debit & Credit columns
      const debitRaw = getVal(mapping.debitCol);
      const creditRaw = getVal(mapping.creditCol);
      const debitNorm = normalizeAmount(debitRaw);
      const creditNorm = normalizeAmount(creditRaw);

      if (creditNorm.amount > 0) {
        type = 'income';
        amount = creditNorm.amount;
      } else if (debitNorm.amount > 0) {
        type = 'expense';
        amount = debitNorm.amount;
      } else {
        return; // Skip empty row
      }
    } else {
      // Single amount column
      const amtRaw = getVal(mapping.amountCol);
      const amtNorm = normalizeAmount(amtRaw);
      if (amtNorm.amount === 0) return;

      amount = amtNorm.amount;
      // In single-column statements, negative indicates withdrawal/debit, positive indicates credit
      if (amtNorm.isNegative) {
        type = 'expense';
      } else {
        // If positive, usually credit, or check keywords
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('salary') || lowerDesc.includes('deposit') || lowerDesc.includes('refund') || lowerDesc.includes('credit')) {
          type = 'income';
        } else {
          // If amount is positive and no explicit sign, check if there's a type column or default to expense if standard purchase
          type = 'income';
        }
      }
    }

    const { categoryName, paymentMethod } = autoTagCategoryAndMethod(
      description,
      type === 'income',
      availableCategories
    );

    candidates.push({
      id: `csv-row-${idx}-${Date.now()}`,
      date,
      description,
      merchant: description,
      amount: Number(amount.toFixed(2)),
      type,
      categoryName,
      paymentMethod,
      reference,
      currency: defaultCurrency,
    });
  });

  return candidates;
}

/**
 * Pre-configured Sample Statements for instant testing
 */
export function getSampleBankStatements() {
  const sampleCSV = `Transaction Date,Particulars,Debit,Credit,Balance,Reference
2026-11-01,SALARY CREDIT NOV 2026,,75000.00,85250.00,SAL/984210/ACME
2026-11-02,FRESH MART SUPERSTORE,2450.50,,82799.50,POS/92841/MART
2026-11-03,SHELL EXPRESS FUEL,2100.00,,80699.50,UPI/SHELL/30291
2026-11-04,CITY POWER & ELECTRIC BILL,1850.00,,78849.50,NEFT/UTIL/48201
2026-11-05,ARTISAN ROASTERS CAFE,420.00,,78429.50,UPI/CAFE/19402
2026-11-06,APOLLO PHARMACY HEALTH,890.00,,77539.50,POS/MEDS/84920
2026-11-07,NETFLIX STREAMING SUBSCRIPTION,649.00,,76890.50,AUTOPAY/NFLX/12
2026-11-08,FREELANCE DESIGN INVOICE #104,,18500.00,95390.50,IMPS/CLIENT/5920
2026-11-09,METRONET FIBER INTERNET,1299.00,,94091.50,INB/WIFI/93821
2026-11-09,FRESH MART SUPERSTORE,2450.50,,91641.00,POS/92841/MART`;

  const sampleOFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20261109120000
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>INR
<BANKACCTFROM>
<BANKID>SPENDWISEBANK
<ACCTID>9842019482
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20261101000000
<DTEND>20261109000000
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261101
<TRNAMT>65000.00
<FITID>OFX982410
<NAME>ACME CORP SALARY PAYROLL
<MEMO>MONTHLY DIRECT DEPOSIT
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261103
<TRNAMT>-3200.00
<FITID>OFX982411
<NAME>WHOLE FOODS ORGANIC GROCERY
<MEMO>WEEKLY STAPLES
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261104
<TRNAMT>-1450.00
<FITID>OFX982412
<NAME>BP PETROL STATION FUEL
<MEMO>PUMP #03
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261106
<TRNAMT>-580.00
<FITID>OFX982413
<NAME>STARBUCKS COFFEE DINING
<MEMO>LATTE AND SNACK
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261108
<TRNAMT>-1199.00
<FITID>OFX982414
<NAME>AMAZON RETAIL SHOPPING
<MEMO>ORDER #402-9182
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  return { sampleCSV, sampleOFX };
}

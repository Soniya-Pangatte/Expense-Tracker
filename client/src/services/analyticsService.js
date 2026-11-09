/**
 * SpendWise Advanced Financial Analytics & Reporting Engine
 * Pure mathematical calculations, multi-currency conversion, period-over-period comparisons,
 * category distribution matrices, budget compliance, and CSV/Excel/PDF export generators.
 */

export const DATE_PRESETS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: 'Last 3 Months' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'custom', label: 'Custom Range' },
];

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date string to readable label: e.g. "Nov 15, 2026"
 */
export function formatReadableDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Resolve start and end dates for a preset
 */
export function getDateRangeBoundaries(preset, customStart = '', customEnd = '') {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === 'this_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'This Month',
    };
  }

  if (preset === 'last_month') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'Last Month',
    };
  }

  if (preset === 'last_3_months') {
    const start = new Date(year, month - 2, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'Last 3 Months',
    };
  }

  if (preset === 'last_6_months') {
    const start = new Date(year, month - 5, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'Last 6 Months',
    };
  }

  if (preset === 'this_year') {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'This Year',
    };
  }

  if (preset === 'last_year') {
    const start = new Date(year - 1, 0, 1);
    const end = new Date(year - 1, 11, 31);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
      label: 'Last Year',
    };
  }

  // Custom date range
  const fallbackStart = formatISODate(new Date(year, month, 1));
  const fallbackEnd = formatISODate(new Date(year, month + 1, 0));
  return {
    startDate: customStart || fallbackStart,
    endDate: customEnd || fallbackEnd,
    label: 'Custom Range',
  };
}

/**
 * Calculate the equivalent previous period for comparison
 */
export function getPreviousPeriodBoundaries(startDateStr, endDateStr, preset) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (preset === 'this_month') {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
    return {
      startDate: formatISODate(prevStart),
      endDate: formatISODate(prevEnd),
      label: 'vs last month',
    };
  }

  if (preset === 'last_month') {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
    return {
      startDate: formatISODate(prevStart),
      endDate: formatISODate(prevEnd),
      label: 'vs 2 months ago',
    };
  }

  if (preset === 'this_year') {
    const prevStart = new Date(start.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(start.getFullYear() - 1, 11, 31);
    return {
      startDate: formatISODate(prevStart),
      endDate: formatISODate(prevEnd),
      label: 'vs last year',
    };
  }

  if (preset === 'last_year') {
    const prevStart = new Date(start.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(start.getFullYear() - 1, 11, 31);
    return {
      startDate: formatISODate(prevStart),
      endDate: formatISODate(prevEnd),
      label: 'vs year prior',
    };
  }

  // General duration-based equivalent window
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);
  return {
    startDate: formatISODate(prevStart),
    endDate: formatISODate(prevEnd),
    label: 'vs previous period',
  };
}

/**
 * Main Financial Analytics Calculation
 */
export function calculateFinancialAnalytics({
  transactions = [],
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  currency = 'INR',
  convertAmount = (val) => val,
  categories = [],
  budgets = [],
  monthlyBudgetsList = [],
}) {
  // 1. Filter Transactions into Current and Previous Periods
  const currentPeriodTransactions = transactions.filter((tx) => {
    if (!tx.date) return false;
    return tx.date >= startDate && tx.date <= endDate;
  });

  const previousPeriodTransactions = transactions.filter((tx) => {
    if (!tx.date) return false;
    return tx.date >= prevStartDate && tx.date <= prevEndDate;
  });

  // 2. Aggregate Current Period Financial Totals (multi-currency safe)
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryExpenseMap = {};
  const monthCashflowMap = {};

  currentPeriodTransactions.forEach((tx) => {
    const rawAmt = Number(tx.amount) || 0;
    const convertedAmt = convertAmount(rawAmt, tx.currency || 'INR', currency);
    const isIncome = tx.type === 'income';

    // Monthly cashflow grouping
    const monthKey = tx.date ? tx.date.slice(0, 7) : 'Unknown';
    if (!monthCashflowMap[monthKey]) {
      monthCashflowMap[monthKey] = {
        monthKey,
        income: 0,
        expense: 0,
      };
    }

    if (isIncome) {
      totalIncome += convertedAmt;
      monthCashflowMap[monthKey].income += convertedAmt;
    } else {
      totalExpenses += convertedAmt;
      monthCashflowMap[monthKey].expense += convertedAmt;

      // Category breakdown aggregation
      const catName = tx.categoryName || tx.category_name || 'General';
      if (!categoryExpenseMap[catName]) {
        const catMeta = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        categoryExpenseMap[catName] = {
          name: catName,
          value: 0,
          count: 0,
          color: catMeta?.color || '#447F98',
        };
      }
      categoryExpenseMap[catName].value += convertedAmt;
      categoryExpenseMap[catName].count += 1;
    }
  });

  totalIncome = Number(totalIncome.toFixed(2));
  totalExpenses = Number(totalExpenses.toFixed(2));
  const netSavings = Number((totalIncome - totalExpenses).toFixed(2));

  // Savings rate calculation with safe zero income & deficit handling
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1));
  }

  // 3. Aggregate Previous Period Totals for Comparison
  let prevTotalIncome = 0;
  let prevTotalExpenses = 0;

  previousPeriodTransactions.forEach((tx) => {
    const rawAmt = Number(tx.amount) || 0;
    const convertedAmt = convertAmount(rawAmt, tx.currency || 'INR', currency);
    if (tx.type === 'income') {
      prevTotalIncome += convertedAmt;
    } else {
      prevTotalExpenses += convertedAmt;
    }
  });

  prevTotalIncome = Number(prevTotalIncome.toFixed(2));
  prevTotalExpenses = Number(prevTotalExpenses.toFixed(2));
  const prevNetSavings = Number((prevTotalIncome - prevTotalExpenses).toFixed(2));

  // Percentage changes vs previous equivalent period
  const calcPercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  };

  const incomePercentChange = calcPercentChange(totalIncome, prevTotalIncome);
  const expensePercentChange = calcPercentChange(totalExpenses, prevTotalExpenses);
  const savingsPercentChange = calcPercentChange(netSavings, prevNetSavings);

  // 4. Calculate Average Monthly Expenses
  const uniqueMonths = Object.keys(monthCashflowMap);
  const monthCount = Math.max(1, uniqueMonths.length);
  const avgMonthlyExpenses = Number((totalExpenses / monthCount).toFixed(2));

  // 5. Category Breakdown Details
  const categoryBreakdown = Object.values(categoryExpenseMap)
    .map((item) => ({
      ...item,
      value: Number(item.value.toFixed(2)),
      avgPerTx: item.count > 0 ? Number((item.value / item.count).toFixed(2)) : 0,
      percentage: totalExpenses > 0 ? Number(((item.value / totalExpenses) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
  const lowestCategory = categoryBreakdown.length > 1 ? categoryBreakdown[categoryBreakdown.length - 1] : null;

  // 6. Monthly Cashflow Timeline
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTimeline = Object.values(monthCashflowMap)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => {
      const parts = m.monthKey.split('-');
      const yearStr = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const label = parts.length === 2 && monthIdx >= 0 && monthIdx < 12 ? `${monthNames[monthIdx]} ${yearStr}` : m.monthKey;
      const savings = Number((m.income - m.expense).toFixed(2));
      const rate = m.income > 0 ? Number(((savings / m.income) * 100).toFixed(1)) : 0;

      return {
        monthKey: m.monthKey,
        label,
        income: Number(m.income.toFixed(2)),
        expense: Number(m.expense.toFixed(2)),
        savings,
        savingsRate: rate,
      };
    });

  // 7. Budget Performance for Period
  // Aggregate monthly budgets matching months in this period
  let periodBudgetAllocated = 0;
  uniqueMonths.forEach((mKey) => {
    const record = monthlyBudgetsList.find((mb) => mb.month === mKey);
    if (record && record.amount) {
      periodBudgetAllocated += convertAmount(Number(record.amount), record.currency || 'INR', currency);
    }
  });

  const periodBudgetUtilization = periodBudgetAllocated > 0
    ? Math.round((totalExpenses / periodBudgetAllocated) * 100)
    : 0;
  const periodRemainingBudget = Math.max(0, periodBudgetAllocated - totalExpenses);
  const isPeriodOverBudget = periodBudgetAllocated > 0 && totalExpenses > periodBudgetAllocated;

  // Category Budgets performance across period
  const categoryBudgetPerformance = budgets.map((b) => {
    const catName = b.categoryName || b.category_name;
    const spent = categoryExpenseMap[catName]?.value || 0;
    const rawLimit = Number(b.limit !== undefined ? b.limit : b.limit_amount !== undefined ? b.limit_amount : 0);
    // Multiply monthly limit by number of months in range if multi-month
    const limit = convertAmount(rawLimit * monthCount, b.currency || 'INR', currency);
    const utilization = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const isOver = spent > limit;
    const isWarning = utilization >= 75 && !isOver;

    return {
      ...b,
      categoryName: catName,
      spent: Number(spent.toFixed(2)),
      limit: Number(limit.toFixed(2)),
      remaining: Math.max(0, Number((limit - spent).toFixed(2))),
      utilization,
      isOver,
      isWarning,
      status: isOver ? 'Exceeded' : isWarning ? 'Warning' : 'Normal',
    };
  });

  // 8. Deterministic Financial Insights Engine
  const insights = [];

  // Insight A: Spending Trend
  if (prevTotalExpenses > 0) {
    if (expensePercentChange > 5) {
      insights.push({
        id: 'ins-spending-increase',
        type: 'warning',
        title: 'Spending Increased',
        text: `Your spending increased by ${Math.abs(expensePercentChange)}% compared to the previous period (${totalExpenses} ${currency} vs ${prevTotalExpenses} ${currency}).`,
      });
    } else if (expensePercentChange < -5) {
      insights.push({
        id: 'ins-spending-decrease',
        type: 'positive',
        title: 'Expenses Controlled',
        text: `Great job! Your spending decreased by ${Math.abs(expensePercentChange)}% compared to the previous period.`,
      });
    } else {
      insights.push({
        id: 'ins-spending-stable',
        type: 'neutral',
        title: 'Consistent Spending',
        text: `Your overall spending remained steady with a slight ${expensePercentChange >= 0 ? '+' : ''}${expensePercentChange}% variance compared to the previous period.`,
      });
    }
  }

  // Insight B: Top Expense Driver
  if (highestCategory && highestCategory.percentage >= 20) {
    insights.push({
      id: 'ins-top-category',
      type: 'neutral',
      title: `Top Spending Driver: ${highestCategory.name}`,
      text: `${highestCategory.name} was your largest expenditure, accounting for ${highestCategory.percentage}% (${highestCategory.value} ${currency}) of total expenses across ${highestCategory.count} transactions.`,
    });
  }

  // Insight C: Savings Health
  if (totalIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'ins-savings-healthy',
        type: 'positive',
        title: 'Strong Savings Rate',
        text: `You achieved a ${savingsRate}% savings rate during this period, putting away ${netSavings} ${currency} from your earnings.`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'ins-savings-moderate',
        type: 'neutral',
        title: 'Positive Net Savings',
        text: `You saved ${savingsRate}% (${netSavings} ${currency}) of your income. Aiming for 20%+ can help accelerate your long-term wealth goals.`,
      });
    } else {
      insights.push({
        id: 'ins-savings-deficit',
        type: 'warning',
        title: 'Spending Exceeded Income',
        text: `Expenses exceeded income by ${Math.abs(netSavings)} ${currency} during this timeframe. Review discretionary spending to balance your cashflow.`,
      });
    }
  }

  // Insight D: Budget Adherence
  const overspentCats = categoryBudgetPerformance.filter((cb) => cb.isOver);
  if (overspentCats.length > 0) {
    const names = overspentCats.map((c) => c.categoryName).join(', ');
    insights.push({
      id: 'ins-budget-overspent',
      type: 'warning',
      title: 'Budget Limits Exceeded',
      text: `${names} exceeded budget thresholds during this period. Check category limits or reduce non-essential purchases.`,
    });
  } else if (categoryBudgetPerformance.length > 0 && periodBudgetAllocated > 0 && !isPeriodOverBudget) {
    insights.push({
      id: 'ins-budget-on-track',
      type: 'positive',
      title: 'Budgets on Track',
      text: `All budgeted categories remained strictly within their configured spending allowances during this period.`,
    });
  }

  return {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    currency,
    currentTransactions: currentPeriodTransactions,
    transactionCount: currentPeriodTransactions.length,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    prevTotalIncome,
    prevTotalExpenses,
    prevNetSavings,
    incomePercentChange,
    expensePercentChange,
    savingsPercentChange,
    monthCount,
    avgMonthlyExpenses,
    categoryBreakdown,
    highestCategory,
    lowestCategory,
    monthlyTimeline,
    periodBudgetAllocated,
    periodRemainingBudget,
    periodBudgetUtilization,
    isPeriodOverBudget,
    categoryBudgetPerformance,
    insights,
  };
}

/**
 * =========================================================================
 * REPORT & EXPORT GENERATORS (CSV, Excel, PDF)
 * =========================================================================
 */

/**
 * 1. CSV Export Generator
 */
export function exportToCSV({ transactions = [], dateRangeLabel, currency, convertAmount }) {
  const headers = [
    'Date',
    'Description',
    'Merchant',
    'Category',
    'Transaction Type',
    'Payment Method',
    'Transaction Source',
    'Amount',
    'Currency',
    'Reference Number',
    'Notes',
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map((t) => {
    const rawAmt = Number(t.amount) || 0;
    const convertedAmt = convertAmount(rawAmt, t.currency || 'INR', currency);
    return [
      escapeCSV(t.date),
      escapeCSV(t.description),
      escapeCSV(t.merchant || ''),
      escapeCSV(t.categoryName || t.category_name || 'General'),
      escapeCSV(t.type === 'income' ? 'Income' : 'Expense'),
      escapeCSV(t.paymentMethod || t.payment_method || 'Other'),
      escapeCSV(t.source || 'manual'),
      convertedAmt.toFixed(2),
      escapeCSV(currency),
      escapeCSV(t.reference_number || t.reference || ''),
      escapeCSV(t.notes || ''),
    ].join(',');
  });

  // UTF-8 BOM + CSV Content
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SpendWise_Transactions_${dateRangeLabel.replace(/\s+/g, '_')}_${formatISODate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Excel (.xls XML Workbook) Export Generator
 * Creates a professional, styled multi-section spreadsheet readable by Excel, Sheets & LibreOffice.
 */
export function exportToExcel({ analytics, transactions = [], dateRangeLabel, currency, formatAmount }) {
  const reportDate = formatReadableDate(formatISODate(new Date()));

  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Financial Report</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body { font-family: Calibri, Arial, sans-serif; }
      .header-title { font-size: 16pt; font-weight: bold; color: #243D49; background-color: #E6F3F7; }
      .section-title { font-size: 12pt; font-weight: bold; color: #447F98; background-color: #F0F7FA; border-bottom: 2px solid #447F98; }
      .th { background-color: #447F98; color: #ffffff; font-weight: bold; text-align: left; padding: 6px; }
      .td { padding: 5px; border: 1px solid #DADEE1; }
      .td-num { text-align: right; font-family: Consolas, monospace; }
      .income-val { color: #2E7D32; font-weight: bold; }
      .expense-val { color: #C62828; font-weight: bold; }
      .savings-val { color: #00695C; font-weight: bold; }
    </style>
  </head>
  <body>
    <!-- 1. Header Information -->
    <table>
      <tr><td colspan="6" class="header-title">SpendWise – Financial Performance & Analytics Report</td></tr>
      <tr><td colspan="6"><strong>Reporting Period:</strong> ${dateRangeLabel} (${analytics.startDate} to ${analytics.endDate})</td></tr>
      <tr><td colspan="6"><strong>Generated On:</strong> ${reportDate}</td></tr>
      <tr><td colspan="6"><strong>Reporting Currency:</strong> ${currency}</td></tr>
      <tr><td colspan="6"></td></tr>
    </table>

    <!-- 2. Financial Summary KPI Matrix -->
    <table>
      <tr><td colspan="6" class="section-title">1. Executive Financial Summary</td></tr>
      <tr>
        <th class="th">Metric</th>
        <th class="th">Amount (${currency})</th>
        <th class="th">Prior Period</th>
        <th class="th">Variance (%)</th>
        <th class="th">Key Benchmark</th>
        <th class="th">Status</th>
      </tr>
      <tr>
        <td class="td">Total Income</td>
        <td class="td td-num income-val">${analytics.totalIncome.toFixed(2)}</td>
        <td class="td td-num">${analytics.prevTotalIncome.toFixed(2)}</td>
        <td class="td td-num">${analytics.incomePercentChange}%</td>
        <td class="td">Total Inflows</td>
        <td class="td">Completed</td>
      </tr>
      <tr>
        <td class="td">Total Expenses</td>
        <td class="td td-num expense-val">${analytics.totalExpenses.toFixed(2)}</td>
        <td class="td td-num">${analytics.prevTotalExpenses.toFixed(2)}</td>
        <td class="td td-num">${analytics.expensePercentChange}%</td>
        <td class="td">Total Outflows</td>
        <td class="td">${analytics.expensePercentChange <= 0 ? 'Favorable' : 'Increased'}</td>
      </tr>
      <tr>
        <td class="td">Net Savings</td>
        <td class="td td-num savings-val">${analytics.netSavings.toFixed(2)}</td>
        <td class="td td-num">${analytics.prevNetSavings.toFixed(2)}</td>
        <td class="td td-num">${analytics.savingsPercentChange}%</td>
        <td class="td">Income - Expenses</td>
        <td class="td">${analytics.netSavings >= 0 ? 'Surplus' : 'Deficit'}</td>
      </tr>
      <tr>
        <td class="td">Savings Rate</td>
        <td class="td td-num">${analytics.savingsRate}%</td>
        <td class="td td-num">—</td>
        <td class="td td-num">—</td>
        <td class="td">Target: 20%+</td>
        <td class="td">${analytics.savingsRate >= 20 ? 'Optimal' : analytics.savingsRate > 0 ? 'Fair' : 'Deficit'}</td>
      </tr>
      <tr>
        <td class="td">Avg Monthly Expenses</td>
        <td class="td td-num">${analytics.avgMonthlyExpenses.toFixed(2)}</td>
        <td class="td td-num">—</td>
        <td class="td td-num">—</td>
        <td class="td">Over ${analytics.monthCount} Month(s)</td>
        <td class="td">Normal</td>
      </tr>
      <tr><td colspan="6"></td></tr>
    </table>

    <!-- 3. Category Breakdown -->
    <table>
      <tr><td colspan="6" class="section-title">2. Category-Wise Spending Breakdown</td></tr>
      <tr>
        <th class="th">Category Name</th>
        <th class="th">Total Spent (${currency})</th>
        <th class="th">% Contribution</th>
        <th class="th">Transactions Count</th>
        <th class="th">Average / Tx</th>
        <th class="th">Rank</th>
      </tr>
      ${analytics.categoryBreakdown
        .map(
          (c, idx) => `
        <tr>
          <td class="td">${c.name}</td>
          <td class="td td-num expense-val">${c.value.toFixed(2)}</td>
          <td class="td td-num">${c.percentage}%</td>
          <td class="td td-num">${c.count}</td>
          <td class="td td-num">${c.avgPerTx.toFixed(2)}</td>
          <td class="td">#${idx + 1}</td>
        </tr>
      `
        )
        .join('')}
      <tr><td colspan="6"></td></tr>
    </table>

    <!-- 4. Monthly Cashflow Overview -->
    <table>
      <tr><td colspan="6" class="section-title">3. Monthly Cashflow & Savings Timeline</td></tr>
      <tr>
        <th class="th">Month</th>
        <th class="th">Income (${currency})</th>
        <th class="th">Expenses (${currency})</th>
        <th class="th">Net Savings (${currency})</th>
        <th class="th">Savings Rate (%)</th>
        <th class="th">Status</th>
      </tr>
      ${analytics.monthlyTimeline
        .map(
          (m) => `
        <tr>
          <td class="td">${m.label}</td>
          <td class="td td-num income-val">${m.income.toFixed(2)}</td>
          <td class="td td-num expense-val">${m.expense.toFixed(2)}</td>
          <td class="td td-num savings-val">${m.savings.toFixed(2)}</td>
          <td class="td td-num">${m.savingsRate}%</td>
          <td class="td">${m.savings >= 0 ? 'Surplus' : 'Deficit'}</td>
        </tr>
      `
        )
        .join('')}
      <tr><td colspan="6"></td></tr>
    </table>

    <!-- 5. Transaction Records Ledger -->
    <table>
      <tr><td colspan="8" class="section-title">4. Itemized Transaction Ledger (${transactions.length} Records)</td></tr>
      <tr>
        <th class="th">Date</th>
        <th class="th">Description</th>
        <th class="th">Category</th>
        <th class="th">Type</th>
        <th class="th">Payment Method</th>
        <th class="th">Source</th>
        <th class="th">Amount (${currency})</th>
        <th class="th">Reference #</th>
      </tr>
      ${transactions
        .map(
          (t) => `
        <tr>
          <td class="td">${t.date}</td>
          <td class="td">${t.description}</td>
          <td class="td">${t.categoryName || t.category_name || 'General'}</td>
          <td class="td">${t.type}</td>
          <td class="td">${t.paymentMethod || t.payment_method || 'Other'}</td>
          <td class="td">${t.source || 'manual'}</td>
          <td class="td td-num ${t.type === 'income' ? 'income-val' : 'expense-val'}">${(Number(t.amount) || 0).toFixed(2)}</td>
          <td class="td">${t.reference_number || t.reference || '—'}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SpendWise_Financial_Report_${dateRangeLabel.replace(/\s+/g, '_')}_${formatISODate(new Date())}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 3. PDF Printable Report Generator
 * Opens a clean, dedicated executive financial statement formatted with professional print CSS.
 */
export function openPrintablePDFReport({ analytics, transactions = [], dateRangeLabel, currency, formatAmount }) {
  const reportDate = formatReadableDate(formatISODate(new Date()));
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to open and print the SpendWise Financial PDF Report.');
    return;
  }

  const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>SpendWise Financial Report – ${dateRangeLabel}</title>
    <meta charset="utf-8" />
    <style>
      @page {
        size: A4;
        margin: 15mm 15mm 15mm 15mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #243D49;
        margin: 0;
        padding: 24px;
        background: #ffffff;
        font-size: 11pt;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 16px;
        border-bottom: 2px solid #447F98;
        margin-bottom: 20px;
      }
      .logo {
        font-size: 22pt;
        font-weight: 800;
        color: #447F98;
        letter-spacing: -0.5px;
      }
      .logo-sub {
        font-size: 9pt;
        color: #526C78;
        margin-top: 2px;
      }
      .report-meta {
        text-align: right;
        font-size: 9pt;
        color: #526C78;
      }
      .section-title {
        font-size: 12pt;
        font-weight: 700;
        color: #243D49;
        margin-top: 24px;
        margin-bottom: 10px;
        border-left: 4px solid #447F98;
        padding-left: 8px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }
      .kpi-card {
        background: #F4F8FA;
        border: 1px solid #DADEE1;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      }
      .kpi-title {
        font-size: 8pt;
        text-transform: uppercase;
        color: #526C78;
        font-weight: 600;
      }
      .kpi-value {
        font-size: 14pt;
        font-weight: 800;
        margin-top: 4px;
      }
      .val-income { color: #2E7D32; }
      .val-expense { color: #C62828; }
      .val-savings { color: #00695C; }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
        margin-bottom: 16px;
      }
      th {
        background: #447F98;
        color: #ffffff;
        text-align: left;
        padding: 6px 8px;
        font-weight: 600;
      }
      td {
        padding: 6px 8px;
        border-bottom: 1px solid #E2E8F0;
      }
      .text-right { text-align: right; }
      .footer {
        margin-top: 30px;
        padding-top: 12px;
        border-top: 1px solid #DADEE1;
        display: flex;
        justify-content: space-between;
        font-size: 8pt;
        color: #526C78;
      }
      .print-btn-bar {
        text-align: center;
        margin-bottom: 20px;
      }
      .btn {
        background: #447F98;
        color: #fff;
        border: none;
        padding: 8px 18px;
        font-size: 11pt;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
      }
      @media print {
        .print-btn-bar { display: none; }
        body { padding: 0; }
        tr { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="print-btn-bar">
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="logo">SpendWise</div>
        <div class="logo-sub">Executive Personal Finance Statement & Analytics</div>
      </div>
      <div class="report-meta">
        <div><strong>Reporting Period:</strong> ${dateRangeLabel}</div>
        <div><strong>Date Range:</strong> ${analytics.startDate} to ${analytics.endDate}</div>
        <div><strong>Report Generated:</strong> ${reportDate}</div>
        <div><strong>Currency:</strong> ${currency}</div>
      </div>
    </div>

    <!-- KPI Matrix -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Total Income</div>
        <div class="kpi-value val-income">${formatAmount(analytics.totalIncome, currency)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Expenses</div>
        <div class="kpi-value val-expense">${formatAmount(analytics.totalExpenses, currency)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Net Savings</div>
        <div class="kpi-value val-savings">${formatAmount(analytics.netSavings, currency)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Savings Rate</div>
        <div class="kpi-value">${analytics.savingsRate}%</div>
      </div>
    </div>

    <!-- Category Breakdown Table -->
    <div class="section-title">Expense Distribution by Category</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Amount</th>
          <th class="text-right">% Share</th>
          <th class="text-right">Transactions</th>
          <th class="text-right">Avg / Transaction</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.categoryBreakdown
          .map(
            (c) => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td class="text-right val-expense">${formatAmount(c.value, currency)}</td>
            <td class="text-right">${c.percentage}%</td>
            <td class="text-right">${c.count}</td>
            <td class="text-right">${formatAmount(c.avgPerTx, currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Monthly Cashflow Table -->
    <div class="section-title">Monthly Cashflow Performance</div>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Income</th>
          <th class="text-right">Expenses</th>
          <th class="text-right">Net Savings</th>
          <th class="text-right">Savings Rate</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.monthlyTimeline
          .map(
            (m) => `
          <tr>
            <td><strong>${m.label}</strong></td>
            <td class="text-right val-income">${formatAmount(m.income, currency)}</td>
            <td class="text-right val-expense">${formatAmount(m.expense, currency)}</td>
            <td class="text-right val-savings">${formatAmount(m.savings, currency)}</td>
            <td class="text-right">${m.savingsRate}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Top Transactions Summary -->
    <div class="section-title">Recent Ledger Items (${Math.min(transactions.length, 25)} of ${transactions.length} Records)</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Type</th>
          <th>Method</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transactions
          .slice(0, 25)
          .map(
            (t) => `
          <tr>
            <td>${t.date}</td>
            <td><strong>${t.description}</strong></td>
            <td>${t.categoryName || t.category_name || 'General'}</td>
            <td>${t.type}</td>
            <td>${t.paymentMethod || t.payment_method || 'Other'}</td>
            <td class="text-right ${t.type === 'income' ? 'val-income' : 'val-expense'}">
              ${formatAmount(Number(t.amount) || 0, currency)}
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>SpendWise Intelligent Financial Analytics System • Confidential & Proprietary to Account Owner</div>
      <div>Page 1 of 1</div>
    </div>

    <script>
      // Auto open print dialog on page load
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
  </body>
  </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
}


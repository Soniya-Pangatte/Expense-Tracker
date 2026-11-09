import { createScopedClient, supabaseAdmin } from '../config/supabase.js';
import { demoCategories, demoTransactions, demoBudgets, demoMonthlyBudget } from './demoFinancialData.js';

export class FinancialAnalysisEngine {
  /**
   * Fetch raw financial data for a user from Supabase or fallback
   */
  static async getUserFinancialData(userId, token, isDemo = false, clientData = null) {
    if (isDemo || userId === 'demo-user-id-001') {
      return {
        transactions: clientData?.transactions || demoTransactions,
        budgets: clientData?.budgets || demoBudgets,
        categories: clientData?.categories || demoCategories,
        monthlyBudget: clientData?.monthlyBudget || demoMonthlyBudget,
      };
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      // 1. Fetch Transactions (scoped to user)
      let transactions = [];
      let txQuery = client
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (userId && (!token || client === supabaseAdmin)) {
        txQuery = txQuery.eq('user_id', userId);
      }

      const { data: txData, error: txError } = await txQuery;

      if (!txError && txData) {
        transactions = txData;
      } else if (clientData?.transactions) {
        transactions = clientData.transactions;
      }

      // 2. Fetch Active Monthly Budget (using actual database column 'month_year')
      let monthlyBudget = null;
      let mbQuery = client
        .from('monthly_budgets')
        .select('*')
        .eq('month_year', currentMonthKey);

      if (userId && (!token || client === supabaseAdmin)) {
        mbQuery = mbQuery.eq('user_id', userId);
      }

      const { data: mbData, error: mbError } = await mbQuery.maybeSingle();

      if (!mbError && mbData) {
        monthlyBudget = mbData;
      } else if (clientData?.monthlyBudget) {
        monthlyBudget = clientData.monthlyBudget;
      }

      // 3. Fetch Category Budgets
      let budgets = [];
      let bQuery = client.from('budgets').select('*');
      if (userId && (!token || client === supabaseAdmin)) {
        bQuery = bQuery.eq('user_id', userId);
      }

      const { data: bData, error: bError } = await bQuery;

      if (!bError && bData) {
        budgets = bData;
      } else if (clientData?.budgets) {
        budgets = clientData.budgets;
      }

      // 4. Fetch Categories
      let categories = [];
      const { data: cData, error: cError } = await client
        .from('categories')
        .select('*');

      if (!cError && cData) {
        categories = cData;
      } else if (clientData?.categories) {
        categories = clientData.categories;
      }

      return { transactions, monthlyBudget, budgets, categories };
    } catch (err) {
      console.warn('Error fetching Supabase financial data, falling back to clientData or demo:', err.message);
      return {
        transactions: clientData?.transactions || [],
        monthlyBudget: clientData?.monthlyBudget || null,
        budgets: clientData?.budgets || [],
        categories: clientData?.categories || [],
      };
    }
  }

  /**
   * Comprehensive deterministic financial analysis
   */
  static analyzeFinancials(data, currency = 'INR') {
    const {
      transactions = [],
      monthlyBudget = null,
      budgets = [],
    } = data;

    const currencySymbol = getCurrencySymbol(currency);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = Math.max(1, now.getDate());
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Filter current month transactions
    const currentMonthTxs = transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Use current month if available, else all transactions to provide useful insights
    const activeTxs = currentMonthTxs.length > 0 ? currentMonthTxs : transactions;

    // 1. Basic Income & Expense Metrics
    let totalIncome = 0;
    let totalExpense = 0;

    activeTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Daily Burn Rate & End of Month Projection
    const dailyAverage = totalExpense / currentDay;
    const projectedMonthlySpend = Math.round(dailyAverage * daysInMonth);

    // 2. Category Spend Breakdown
    const categoryMap = {};
    activeTxs
      .filter((tx) => tx.type === 'expense' || !tx.type)
      .forEach((tx) => {
        const cat = tx.categoryName || tx.category || 'General & Other';
        const amt = Number(tx.amount) || 0;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { name: cat, total: 0, count: 0, items: [] };
        }
        categoryMap[cat].total += amt;
        categoryMap[cat].count += 1;
        categoryMap[cat].items.push(tx);
      });

    const categoryBreakdown = Object.values(categoryMap).map((c) => ({
      name: c.name,
      amount: Math.round(c.total * 100) / 100,
      count: c.count,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const highestCategory = categoryBreakdown[0] || null;
    const lowestCategory = categoryBreakdown.length > 1 ? categoryBreakdown[categoryBreakdown.length - 1] : null;

    // 3. Overall Monthly Budget Analysis
    const budgetLimit = monthlyBudget ? Number(monthlyBudget.amount || monthlyBudget.limit) : null;
    let budgetAnalysis = null;

    if (budgetLimit && budgetLimit > 0) {
      const remaining = budgetLimit - totalExpense;
      const utilizationRate = Math.round((totalExpense / budgetLimit) * 100);
      const isOverBudget = totalExpense > budgetLimit;
      const overBudgetAmount = isOverBudget ? Math.round(totalExpense - budgetLimit) : 0;

      let pacingStatus = 'on_track'; // on_track | warning | exceeded
      if (isOverBudget) {
        pacingStatus = 'exceeded';
      } else if (utilizationRate >= 80) {
        pacingStatus = 'warning';
      }

      budgetAnalysis = {
        hasBudget: true,
        limit: budgetLimit,
        spent: totalExpense,
        remaining: Math.max(0, remaining),
        utilizationRate,
        isOverBudget,
        overBudgetAmount,
        pacingStatus,
        projectedMonthlySpend,
        projectedOverBudget: projectedMonthlySpend > budgetLimit,
        projectedDifference: projectedMonthlySpend - budgetLimit,
      };
    } else {
      budgetAnalysis = {
        hasBudget: false,
        limit: null,
        spent: totalExpense,
        remaining: null,
        utilizationRate: null,
        isOverBudget: false,
        overBudgetAmount: 0,
        pacingStatus: 'no_budget',
        projectedMonthlySpend,
      };
    }

    // 4. Category-Specific Budget Overspending
    const categoryBudgetAlerts = [];
    if (budgets && budgets.length > 0) {
      budgets.forEach((b) => {
        const catName = b.categoryName || b.name;
        const limit = Number(b.limit || b.amount) || 0;
        const spent = categoryMap[catName]?.total || 0;
        if (limit > 0) {
          const catUtil = Math.round((spent / limit) * 100);
          if (spent > limit) {
            categoryBudgetAlerts.push({
              category: catName,
              spent,
              limit,
              overAmount: spent - limit,
              status: 'exceeded',
              utilization: catUtil,
            });
          } else if (catUtil >= 80) {
            categoryBudgetAlerts.push({
              category: catName,
              spent,
              limit,
              remaining: limit - spent,
              status: 'warning',
              utilization: catUtil,
            });
          }
        }
      });
    }

    // 5. Detect Spikes and Anomalies
    const anomalySpikes = [];
    Object.values(categoryMap).forEach((catGroup) => {
      if (catGroup.items.length >= 2) {
        const avg = catGroup.total / catGroup.items.length;
        catGroup.items.forEach((item) => {
          const itemAmt = Number(item.amount) || 0;
          if (itemAmt > avg * 2.2 && itemAmt > 500) {
            anomalySpikes.push({
              id: item.id,
              description: item.description,
              amount: itemAmt,
              category: catGroup.name,
              date: item.date,
              categoryAverage: Math.round(avg),
              ratio: (itemAmt / avg).toFixed(1),
            });
          }
        });
      }
    });

    // 6. Detect Potential Recurring & Micro Expenses
    const merchantOccurrences = {};
    activeTxs.forEach((tx) => {
      const m = tx.merchant || tx.description;
      if (m) {
        const key = `${m.toLowerCase()}_${tx.amount}`;
        if (!merchantOccurrences[key]) {
          merchantOccurrences[key] = { merchant: m, amount: tx.amount, count: 0, txs: [] };
        }
        merchantOccurrences[key].count += 1;
        merchantOccurrences[key].txs.push(tx);
      }
    });

    const potentialRecurring = Object.values(merchantOccurrences)
      .filter((o) => o.count >= 2 || /subscription|membership|plan|bill|rent|wifi|internet|netflix|spotify/i.test(o.merchant))
      .map((o) => ({
        merchant: o.merchant,
        amount: Number(o.amount),
        monthlyEstimate: Number(o.amount),
      }));

    // Micro-expenses (< ₹250 or $5)
    const microThreshold = currency === 'INR' ? 250 : 5;
    const microExpenses = activeTxs.filter(
      (tx) => tx.type === 'expense' && Number(tx.amount) <= microThreshold
    );
    const microTotal = microExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    // 7. Savings Opportunities & Discretionary Analysis
    const discretionaryCategories = ['Dining Out', 'Entertainment & Leisure', 'Shopping & Apparel', 'Leisure', 'Food & Dining'];
    let discretionarySpend = 0;
    categoryBreakdown.forEach((cat) => {
      if (discretionaryCategories.some((d) => cat.name.toLowerCase().includes(d.toLowerCase()))) {
        discretionarySpend += cat.amount;
      }
    });

    const potentialSavings15 = Math.round(discretionarySpend * 0.15);
    const potentialSavings25 = Math.round(discretionarySpend * 0.25);

    // Target goal simulation (e.g. Save ₹5000 or $100 per month)
    const targetGoal = currency === 'INR' ? 5000 : 100;
    const targetGap = Math.max(0, targetGoal - Math.max(0, netSavings));

    return {
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      dayOfMonth: currentDay,
      daysInMonth,
      currency,
      currencySymbol,
      metrics: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        projectedMonthlySpend,
        transactionCount: activeTxs.length,
      },
      categories: {
        breakdown: categoryBreakdown,
        highest: highestCategory,
        lowest: lowestCategory,
      },
      budget: budgetAnalysis,
      categoryAlerts: categoryBudgetAlerts,
      anomalies: anomalySpikes,
      recurring: {
        items: potentialRecurring,
        microExpenseCount: microExpenses.length,
        microExpenseTotal: Math.round(microTotal * 100) / 100,
      },
      savings: {
        discretionarySpend: Math.round(discretionarySpend * 100) / 100,
        trim15Percent: potentialSavings15,
        trim25Percent: potentialSavings25,
        targetGoal,
        targetGap,
      },
    };
  }

  /**
   * Generates factual, ground-truth context string to inject into the Gemini prompt
   */
  static buildFinancialSummaryContext(analysis) {
    const { currencySymbol, metrics, categories, budget, categoryAlerts, anomalies, recurring, savings } = analysis;

    let summary = `=== USER FINANCIAL GROUND TRUTH DATA (VERIFIED BY SYSTEM) ===\n`;
    summary += `Active Currency: ${analysis.currency} (${currencySymbol})\n`;
    summary += `Current Period Day: ${analysis.dayOfMonth} of ${analysis.daysInMonth} days\n`;
    summary += `Total Income: ${currencySymbol}${metrics.totalIncome.toLocaleString()}\n`;
    summary += `Total Expenses: ${currencySymbol}${metrics.totalExpense.toLocaleString()}\n`;
    summary += `Net Savings: ${currencySymbol}${metrics.netSavings.toLocaleString()} (Savings Rate: ${metrics.savingsRate}%)\n`;
    summary += `Daily Average Burn Rate: ${currencySymbol}${metrics.dailyAverage.toLocaleString()}/day\n`;
    summary += `Projected Month-End Spend: ${currencySymbol}${metrics.projectedMonthlySpend.toLocaleString()}\n`;
    summary += `Total Transactions Logged: ${metrics.transactionCount}\n\n`;

    summary += `--- BUDGET STATUS ---\n`;
    if (budget.hasBudget) {
      summary += `Overall Monthly Budget Limit: ${currencySymbol}${budget.limit.toLocaleString()}\n`;
      summary += `Spent: ${currencySymbol}${budget.spent.toLocaleString()} (${budget.utilizationRate}% used)\n`;
      summary += `Remaining: ${currencySymbol}${budget.remaining.toLocaleString()}\n`;
      summary += `Pacing Status: ${budget.pacingStatus.toUpperCase()}\n`;
      if (budget.isOverBudget) {
        summary += `ALERT: Already over budget by ${currencySymbol}${budget.overBudgetAmount.toLocaleString()}!\n`;
      } else if (budget.projectedOverBudget) {
        summary += `WARNING: At current spending rate, user is projected to exceed budget by ${currencySymbol}${budget.projectedDifference.toLocaleString()}.\n`;
      }
    } else {
      summary += `Overall Monthly Budget: NOT CONFIGURED by user yet.\n`;
    }

    if (categoryAlerts.length > 0) {
      summary += `\n--- CATEGORY BUDGET WARNINGS ---\n`;
      categoryAlerts.forEach((a) => {
        if (a.status === 'exceeded') {
          summary += `- ${a.category}: EXCEEDED! Spent ${currencySymbol}${a.spent.toLocaleString()} vs limit ${currencySymbol}${a.limit.toLocaleString()} (+${currencySymbol}${a.overAmount.toLocaleString()})\n`;
        } else {
          summary += `- ${a.category}: Near limit (${a.utilization}%). Spent ${currencySymbol}${a.spent.toLocaleString()} of ${currencySymbol}${a.limit.toLocaleString()}.\n`;
        }
      });
    }

    summary += `\n--- SPENDING BY CATEGORY ---\n`;
    if (categories.breakdown.length === 0) {
      summary += `No expense transactions recorded yet.\n`;
    } else {
      categories.breakdown.forEach((c) => {
        summary += `- ${c.name}: ${currencySymbol}${c.amount.toLocaleString()} (${c.percentage}%, ${c.count} transactions)\n`;
      });
      if (categories.highest) {
        summary += `Highest Expense Category: ${categories.highest.name} at ${currencySymbol}${categories.highest.amount.toLocaleString()}\n`;
      }
    }

    if (anomalies.length > 0) {
      summary += `\n--- NOTABLE TRANSACTION SPIKES ---\n`;
      anomalies.slice(0, 3).forEach((sp) => {
        summary += `- ${sp.description} on ${sp.date}: ${currencySymbol}${sp.amount.toLocaleString()} (Category avg is ${currencySymbol}${sp.categoryAverage})\n`;
      });
    }

    summary += `\n--- RECURRING & DISCRETIONARY EXPENSES ---\n`;
    summary += `Discretionary Spending (Dining, Entertainment, Shopping): ${currencySymbol}${savings.discretionarySpend.toLocaleString()}\n`;
    summary += `Potential 15% discretionary trim savings: ${currencySymbol}${savings.trim15Percent.toLocaleString()}/month\n`;
    if (recurring.items.length > 0) {
      summary += `Detected recurring/subscriptions: ${recurring.items.map((i) => `${i.merchant} (${currencySymbol}${i.amount})`).join(', ')}\n`;
    }
    if (recurring.microExpenseCount > 0) {
      summary += `Micro-expenses: ${recurring.microExpenseCount} small purchases totaling ${currencySymbol}${recurring.microExpenseTotal.toLocaleString()}\n`;
    }
    summary += `=== END GROUND TRUTH DATA ===\n`;

    return summary;
  }
}

function getCurrencySymbol(code = 'INR') {
  switch (code.toUpperCase()) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CAD': return 'CA$';
    case 'INR':
    default:
      return '₹';
  }
}


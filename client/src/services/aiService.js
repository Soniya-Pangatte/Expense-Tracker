/**
 * SpendWise AI Assistant Client Service
 * Connects React frontend with the SpendWise AI Express/Gemini backend.
 * Provides client-side fallback calculations if backend server is offline.
 */

const API_BASE_URL = '/api/ai';

function getAuthHeader(session, isDemoUser) {
  if (isDemoUser) {
    return {
      'Authorization': 'Bearer demo-token',
      'x-demo-user': 'true',
    };
  }
  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  return {
    'Authorization': 'Bearer demo-token',
    'x-demo-user': 'true',
  };
}

export async function sendChatMessage({
  message,
  conversationId,
  currency = 'INR',
  clientData = null,
  session = null,
  isDemoUser = false,
}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(session, isDemoUser),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        conversationId,
        currency,
        clientData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('Backend AI chat request failed, generating client-side fallback:', err.message);
    return generateClientSideFallbackChat(message, currency, clientData);
  }
}

export async function fetchFinancialInsights({
  currency = 'INR',
  clientData = null,
  session = null,
  isDemoUser = false,
}) {
  const headers = getAuthHeader(session, isDemoUser);

  try {
    const url = new URL(`${window.location.origin}${API_BASE_URL}/insights`);
    url.searchParams.set('currency', currency);
    if (clientData) {
      url.searchParams.set('clientData', JSON.stringify(clientData));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('Backend AI insights request failed, calculating on client:', err.message);
    return {
      success: true,
      insights: calculateClientSideInsights(clientData, currency),
    };
  }
}

export async function fetchConversationHistory({
  conversationId,
  session = null,
  isDemoUser = false,
}) {
  const headers = getAuthHeader(session, isDemoUser);

  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      headers,
    });
    if (!response.ok) throw new Error('Fetch messages failed');
    return await response.json();
  } catch (err) {
    return { success: false, messages: [] };
  }
}

export async function clearConversationMessages({
  conversationId,
  session = null,
  isDemoUser = false,
}) {
  const headers = getAuthHeader(session, isDemoUser);

  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/clear`, {
      method: 'POST',
      headers,
    });
    return await response.json();
  } catch (err) {
    return { success: true };
  }
}

// -------------------------------------------------------------
// Client-side offline fallback calculations
// -------------------------------------------------------------
function getSymbol(curr) {
  switch (curr) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CAD': return 'CA$';
    default: return '₹';
  }
}

function calculateClientSideInsights(clientData, currency = 'INR') {
  const txs = clientData?.transactions || [];
  const monthlyBudget = clientData?.monthlyBudget || null;
  const recurring = clientData?.recurringExpenses || [];
  const sym = getSymbol(currency);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const day = Math.max(1, now.getDate());
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - day);

  // Current Month vs Previous Month
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};

  let prevIncome = 0;
  let prevExpense = 0;
  const prevCategoryMap = {};

  txs.forEach((t) => {
    if (!t.date) return;
    const d = new Date(t.date);
    const amt = Number(t.amount) || 0;
    const cat = t.categoryName || t.category || 'General';

    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      }
    } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
      if (t.type === 'income') {
        prevIncome += amt;
      } else {
        prevExpense += amt;
        prevCategoryMap[cat] = (prevCategoryMap[cat] || 0) + amt;
      }
    }
  });

  // If no transactions in current month, fallback to all transactions
  if (totalExpense === 0 && totalIncome === 0 && txs.length > 0) {
    txs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') totalIncome += amt;
      else {
        totalExpense += amt;
        const cat = t.categoryName || t.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      }
    });
  }

  const breakdown = Object.entries(categoryMap).map(([name, amount]) => ({
    name,
    amount: Math.round(amount * 100) / 100,
    percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  const highest = breakdown[0] || null;

  // MoM Category Increases
  const momCategoryChanges = [];
  const allCats = new Set([...Object.keys(categoryMap), ...Object.keys(prevCategoryMap)]);
  allCats.forEach((cat) => {
    const cur = categoryMap[cat] || 0;
    const prev = prevCategoryMap[cat] || 0;
    const diff = cur - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : (cur > 0 ? 100 : 0);
    momCategoryChanges.push({
      name: cat,
      currentAmt: cur,
      prevAmt: prev,
      diff,
      percentChange: pct,
      increased: diff > 0,
    });
  });
  momCategoryChanges.sort((a, b) => b.diff - a.diff);
  const topIncreasedCategory = momCategoryChanges.find((c) => c.increased && c.diff > 0) || null;

  const budgetLimit = monthlyBudget ? Number(monthlyBudget.amount || monthlyBudget.limit) : null;
  const hasBudget = Boolean(budgetLimit && budgetLimit > 0);
  const remaining = hasBudget ? Math.max(0, budgetLimit - totalExpense) : 0;
  const utilizationRate = hasBudget ? Math.round((totalExpense / budgetLimit) * 100) : 0;

  // Recurring commitments
  const activeRecurring = recurring.filter((r) => r.status !== 'Paused');
  const recurringCommitment = activeRecurring.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const safeRemainingBudget = hasBudget ? Math.max(0, remaining - recurringCommitment) : null;
  const safeDailySpend = hasBudget ? Math.round(safeRemainingBudget / daysRemaining) : Math.round(totalExpense / day);

  const dailyAverage = totalExpense / day;
  const projectedMonthlySpend = Math.round(dailyAverage * daysInMonth);

  return {
    period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
    dayOfMonth: day,
    daysInMonth,
    daysRemaining,
    currency,
    currencySymbol: sym,
    metrics: {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      dailyAverage: Math.round(dailyAverage),
      projectedMonthlySpend,
      transactionCount: txs.length,
      prevMonthExpense: prevExpense,
      expenseVariance: totalExpense - prevExpense,
      expensePercentVariance: prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : 0,
    },
    categories: {
      breakdown,
      highest,
      topIncreasedCategory,
      momChanges: momCategoryChanges,
    },
    budget: {
      hasBudget,
      limit: budgetLimit,
      spent: totalExpense,
      remaining,
      utilizationRate,
      isOverBudget: hasBudget && totalExpense > budgetLimit,
      overBudgetAmount: hasBudget && totalExpense > budgetLimit ? totalExpense - budgetLimit : 0,
      pacingStatus: !hasBudget ? 'no_budget' : totalExpense > budgetLimit ? 'exceeded' : utilizationRate >= 80 ? 'warning' : 'on_track',
      projectedMonthlySpend,
      safeRemainingBudget,
      safeDailySpend,
    },
    recurring: {
      activeList: activeRecurring,
      totalCommitment: recurringCommitment,
    },
    savings: {
      discretionarySpend: Math.round(totalExpense * 0.35),
      trim15Percent: Math.round(totalExpense * 0.35 * 0.15),
      trim25Percent: Math.round(totalExpense * 0.35 * 0.25),
      targetGoal: currency === 'INR' ? 5000 : 100,
      targetGap: Math.max(0, (currency === 'INR' ? 5000 : 100) - Math.max(0, totalIncome - totalExpense)),
    },
  };
}

function generateClientSideFallbackChat(message, currency, clientData) {
  const insights = calculateClientSideInsights(clientData, currency);
  const sym = insights.currencySymbol;
  const m = insights.metrics;
  const cats = insights.categories;
  const b = insights.budget;
  const r = insights.recurring;
  const q = (message || '').toLowerCase();

  let reply = '';

  // 1. Where am I spending the most?
  if (q.includes('most') || q.includes('highest') || q.includes('where is my money') || q.includes('where am i')) {
    reply = `🏆 **Top Spending Breakdown**\n\n`;
    if (cats.highest) {
      reply += `You are spending the most on **${cats.highest.name}**, which totals **${sym}${cats.highest.amount.toLocaleString()}** (**${cats.highest.percentage}%** of all expenses).\n\n`;
      reply += `**Top Categories:**\n`;
      cats.breakdown.slice(0, 4).forEach((c, idx) => {
        reply += `${idx + 1}. **${c.name}**: ${sym}${c.amount.toLocaleString()} (${c.percentage}%)\n`;
      });
    } else {
      reply += `No categorized expenses found in your records.`;
    }
  }
  // 2. Month-over-Month / Category Increases
  else if (q.includes('increase') || q.includes('last month') || q.includes('compare') || q.includes('mom')) {
    reply = `📈 **Month-over-Month Spending Comparison**\n\n`;
    if (m.prevMonthExpense > 0) {
      reply += `- **Current Month Spending:** **${sym}${m.totalExpense.toLocaleString()}**\n`;
      reply += `- **Previous Month Spending:** **${sym}${m.prevMonthExpense.toLocaleString()}**\n`;
      reply += `- **Total Variance:** **${m.expenseVariance >= 0 ? '+' : ''}${sym}${m.expenseVariance.toLocaleString()}** (${m.expensePercentVariance}% change)\n\n`;
      if (cats.topIncreasedCategory && cats.topIncreasedCategory.diff > 0) {
        reply += `🔍 **Biggest Jump:** **${cats.topIncreasedCategory.name}** increased by **+${sym}${cats.topIncreasedCategory.diff.toLocaleString()}** (+${cats.topIncreasedCategory.percentChange}%).\n`;
      }
    } else {
      reply += `You spent **${sym}${m.totalExpense.toLocaleString()}** this month. No transactions found for last month to compute a comparative variance.`;
    }
  }
  // 3. Recurring Payments & Subscriptions
  else if (q.includes('recurring') || q.includes('upcoming') || q.includes('bill') || q.includes('subscription')) {
    reply = `🔁 **Recurring Commitments & Bills**\n\n`;
    if (r.activeList && r.activeList.length > 0) {
      reply += `You have **${r.activeList.length} active recurring commitments** totaling **${sym}${r.totalCommitment.toLocaleString()}/month**:\n\n`;
      r.activeList.forEach((item) => {
        reply += `- **${item.name || item.merchant}**: **${sym}${item.amount}** (${item.frequency || 'Monthly'}, due: *${item.due_date || item.dueDate || '1st'}*)\n`;
      });
      if (b.safeRemainingBudget !== null) {
        reply += `\n💡 **Budget Impact:** After recurring bills, your discretionary cushion is **${sym}${b.safeRemainingBudget.toLocaleString()}** (~${sym}${b.safeDailySpend}/day).`;
      }
    } else {
      reply += `You have no fixed recurring bills configured. You can set them up in the Recurring Expenses tab!`;
    }
  }
  // 4. Budget Status & Remaining
  else if (q.includes('budget') || q.includes('remaining') || q.includes('track') || q.includes('safe')) {
    if (b.hasBudget) {
      reply = `🎯 **Monthly Budget Status**\n\n`;
      reply += `- **Budget Cap:** **${sym}${b.limit.toLocaleString()}**\n`;
      reply += `- **Spent:** **${sym}${b.spent.toLocaleString()}** (${b.utilizationRate}% used)\n`;
      reply += `- **Remaining:** **${sym}${b.remaining.toLocaleString()}**\n`;
      if (b.safeDailySpend !== null) {
        reply += `- **Recommended Safe Daily Pace:** **${sym}${b.safeDailySpend.toLocaleString()}/day** across the remaining ${insights.daysRemaining} days.\n`;
      }
      if (b.isOverBudget) {
        reply += `\n⚠️ **Alert:** You have exceeded your monthly cap by **${sym}${b.overBudgetAmount.toLocaleString()}**!`;
      } else {
        reply += `\n✨ **Status:** You are pacing safely within your budget allowance.`;
      }
    } else {
      reply = `💡 **No Monthly Budget Configured**\n\nYou currently haven't set a monthly budget. Based on your daily burn of **${sym}${m.dailyAverage.toLocaleString()}/day**, setting a target of **${sym}${Math.round(m.projectedMonthlySpend * 1.1).toLocaleString()}** would give you a healthy safety margin.`;
    }
  }
  // 5. How to reduce expenses / Savings opportunities
  else if (q.includes('save') || q.includes('saving') || q.includes('reduce') || q.includes('cut')) {
    reply = `💰 **Personalized Savings Opportunities**\n\n`;
    reply += `Based on your verified spending data:\n\n`;
    reply += `1. **Discretionary Trim:** A modest **15% trim** on flexible spending frees up **${sym}${insights.savings.trim15Percent.toLocaleString()}** this month.\n`;
    reply += `2. **A 25% trim** unlocks **${sym}${insights.savings.trim25Percent.toLocaleString()}** in additional savings.\n`;
    if (r.activeList && r.activeList.length > 0) {
      reply += `3. **Subscription Audit:** You have **${sym}${r.totalCommitment.toLocaleString()}/mo** in recurring charges across ${r.activeList.length} services. Review if any can be paused.\n`;
    }
    reply += `\n🎯 **Monthly Milestone:** You have saved **${sym}${m.netSavings.toLocaleString()}** (${m.savingsRate}% rate) this period.`;
  }
  // 6. General Financial Pulse
  else {
    reply = `📊 **SpendWise Financial Pulse**\n\n` +
      `So far this period, you have spent **${sym}${m.totalExpense.toLocaleString()}** across **${m.transactionCount} transactions**.\n\n` +
      `- **Total Inflow:** ${sym}${m.totalIncome.toLocaleString()}\n` +
      `- **Net Savings:** ${sym}${m.netSavings.toLocaleString()} (${m.savingsRate}% rate)\n` +
      `- **Daily Average:** ${sym}${m.dailyAverage.toLocaleString()}/day\n` +
      (b.hasBudget
        ? `- **Budget:** ${b.utilizationRate}% used (${sym}${b.remaining.toLocaleString()} left)\n`
        : `- **Budget:** Not set yet\n`) +
      (r.totalCommitment > 0
        ? `- **Recurring Bills:** ${sym}${r.totalCommitment.toLocaleString()}/mo\n`
        : '');
  }

  return {
    success: true,
    reply,
    conversationId: 'client-offline-conv',
    suggestedQuestions: [
      'Where am I spending the most?',
      'Which category increased compared to last month?',
      'How much budget is remaining?',
      'What are my upcoming recurring payments?',
      'How can I reduce my expenses?',
    ],
    analysis: insights,
    engine: 'client-offline-fallback',
  };
}


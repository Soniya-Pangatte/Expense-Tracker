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
  const sym = getSymbol(currency);

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};

  txs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      const cat = t.categoryName || t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    }
  });

  const breakdown = Object.entries(categoryMap).map(([name, amount]) => ({
    name,
    amount: Math.round(amount * 100) / 100,
    percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  const highest = breakdown[0] || null;
  const budgetLimit = monthlyBudget ? Number(monthlyBudget.amount || monthlyBudget.limit) : null;
  const hasBudget = Boolean(budgetLimit && budgetLimit > 0);
  const remaining = hasBudget ? Math.max(0, budgetLimit - totalExpense) : 0;
  const utilizationRate = hasBudget ? Math.round((totalExpense / budgetLimit) * 100) : 0;

  const now = new Date();
  const day = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAverage = totalExpense / day;
  const projectedMonthlySpend = Math.round(dailyAverage * daysInMonth);

  return {
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    dayOfMonth: day,
    daysInMonth,
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
    },
    categories: {
      breakdown,
      highest,
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
    },
    categoryAlerts: [],
    anomalies: [],
    recurring: {
      items: [],
      microExpenseCount: 0,
      microExpenseTotal: 0,
    },
    savings: {
      discretionarySpend: Math.round(totalExpense * 0.3),
      trim15Percent: Math.round(totalExpense * 0.3 * 0.15),
      trim25Percent: Math.round(totalExpense * 0.3 * 0.25),
      targetGoal: currency === 'INR' ? 5000 : 100,
      targetGap: Math.max(0, (currency === 'INR' ? 5000 : 100) - Math.max(0, totalIncome - totalExpense)),
    },
  };
}

function generateClientSideFallbackChat(message, currency, clientData) {
  const insights = calculateClientSideInsights(clientData, currency);
  const sym = insights.currencySymbol;
  const m = insights.metrics;

  const reply = `📊 **SpendWise Financial Pulse**\n\n` +
    `So far this period, you have spent **${sym}${m.totalExpense.toLocaleString()}** across **${m.transactionCount} transactions**.\n\n` +
    `- **Daily Burn Rate:** ${sym}${m.dailyAverage.toLocaleString()}/day\n` +
    `- **Projected Month-End Spend:** ${sym}${m.projectedMonthlySpend.toLocaleString()}\n` +
    `- **Net Savings:** ${sym}${m.netSavings.toLocaleString()} (${m.savingsRate}% rate)\n\n` +
    (insights.budget.hasBudget
      ? `🎯 **Budget:** ${insights.budget.utilizationRate}% utilized (${sym}${insights.budget.remaining.toLocaleString()} remaining).`
      : `💡 *Tip: Set a monthly budget in the sidebar to track your spending limits!*`);

  return {
    success: true,
    reply,
    conversationId: 'client-offline-conv',
    suggestedQuestions: [
      'Am I on track with my monthly budget?',
      'How can I save more this month?',
      'Where is most of my money going?',
    ],
    analysis: insights,
    engine: 'client-offline-fallback',
  };
}


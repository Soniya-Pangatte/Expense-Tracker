import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;
if (apiKey && apiKey !== 'your-gemini-api-key-here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

const SYSTEM_INSTRUCTION = `You are SpendWise AI, the senior personal financial intelligence assistant for the SpendWise platform.
Your tagline is: "Your Personal Finance Assistant".

Your Personality & Voice:
- Clear, encouraging, objective, and professional.
- Use simple, accessible language. Avoid complex financial jargon.
- Non-judgmental: present suggestions as practical recommendations, never labels of guilt.
- Always distinguish verified facts from recommendations.

CRITICAL ACCURACY & FINANCIAL RULES:
1. STRICT DATA ACCURACY: You are provided with a verified "USER FINANCIAL GROUND TRUTH DATA" summary computed directly from the user's records. You MUST use these exact numbers, dates, and categories.
2. NEVER FABRICATE OR HALLUCINATE: Never invent transactions, imaginary debts, or dollar/rupee figures. If data is zero or missing, clearly state that.
3. CURRENCY: Always use the user's active currency symbol specified in the ground truth (e.g., ₹ for INR, $ for USD).
4. DIRECT ANSWERS TO FINANCIAL QUESTIONS:
   - When asked where they spend the most, cite the highest category with its amount and percentage.
   - When asked about month-over-month changes or increases, cite the month-over-month section and specific category changes.
   - When asked about recurring payments, cite active subscriptions and total monthly commitment.
   - When asked about budget status or safe spend, cite the remaining budget and daily safe spending allowance.
5. CONCISE FORMATTING: Use Markdown with bold amounts, clean bullet points, and brief paragraphs (1-3 paragraphs max).`;

export class GeminiService {
  /**
   * Generates response using Gemini API or intelligent deterministic fallback
   */
  static async generateChatResponse(userMessage, financialAnalysis, financialSummaryText, messageHistory = []) {
    // If Gemini API is configured, call it
    if (genAI) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        // Format conversation history for Gemini chat format
        const contents = [];

        // Inject the ground truth financial summary as context
        contents.push({
          role: 'user',
          parts: [{ text: `System Context - Here is my current verified financial status:\n${financialSummaryText}\n\nPlease acknowledge you have this financial snapshot ready.` }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: `Hello! I have your latest financial records and budget status loaded. I'm SpendWise AI, your personal finance assistant. How can I help you analyze your money or optimize your budget today?` }],
        });

        // Append recent previous messages (last 6)
        const recentHistory = messageHistory.slice(-6);
        for (const msg of recentHistory) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }

        // Append current user message
        contents.push({
          role: 'user',
          parts: [{ text: userMessage }],
        });

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();

        return {
          reply: responseText,
          suggestedQuestions: generateContextualSuggestions(financialAnalysis, userMessage),
          engine: 'gemini',
        };
      } catch (err) {
        console.warn('Gemini API call failed, switching to intelligent fallback engine:', err.message);
      }
    }

    // Intelligent Deterministic Fallback Engine (when API key is unset, rate limited, or offline)
    return {
      reply: generateDeterministicResponse(userMessage, financialAnalysis),
      suggestedQuestions: generateContextualSuggestions(financialAnalysis, userMessage),
      engine: 'deterministic-fallback',
    };
  }
}

/**
 * Intelligent deterministic response generator with exact financial metrics
 */
function generateDeterministicResponse(prompt, analysis) {
  const q = prompt.toLowerCase();
  const {
    metrics,
    categories,
    budget,
    categoryAlerts,
    recurring,
    savings,
    currencySymbol,
    daysRemaining,
  } = analysis;

  // 1. If user has no transactions
  if (metrics.transactionCount === 0) {
    return `👋 **Welcome to SpendWise AI!**\n\nI noticed you don't have any transactions logged for this period yet. To get personalized financial insights, start by adding your income and expenses or importing a bank statement.\n\nOnce you add a few entries, I can help you:\n- Analyze your spending habits and category breakdowns.\n- Track your monthly budget utilization in real-time.\n- Uncover savings opportunities and audit recurring bills.`;
  }

  // 2. Month-over-Month Comparison & Category Increases ("Which category increased compared with last month?")
  if (q.includes('increase') || q.includes('last month') || q.includes('compare') || q.includes('higher') || q.includes('mom')) {
    let response = `📈 **Month-over-Month Spending Comparison**\n\n`;

    if (metrics.prevMonthExpense > 0) {
      const diffFormatted = `${metrics.expenseVariance >= 0 ? '+' : ''}${currencySymbol}${Math.abs(metrics.expenseVariance).toLocaleString()}`;
      response += `- **Current Month Spending:** **${currencySymbol}${metrics.totalExpense.toLocaleString()}**\n`;
      response += `- **Previous Month Spending:** **${currencySymbol}${metrics.prevMonthExpense.toLocaleString()}**\n`;
      response += `- **Total Variance:** **${diffFormatted}** (${metrics.expensePercentVariance}% change)\n\n`;

      if (categories.topIncreasedCategory && categories.topIncreasedCategory.diff > 0) {
        response += `🔍 **Largest Category Increase:**\n`;
        response += `Your spending in **${categories.topIncreasedCategory.name}** saw the biggest jump, increasing by **+${currencySymbol}${categories.topIncreasedCategory.diff.toLocaleString()}** (+${categories.topIncreasedCategory.percentChange}%) compared to last month (**${currencySymbol}${categories.topIncreasedCategory.currentAmt.toLocaleString()}** vs **${currencySymbol}${categories.topIncreasedCategory.prevAmt.toLocaleString()}**).\n\n`;
      }

      if (categories.momChanges && categories.momChanges.length > 1) {
        const otherIncreases = categories.momChanges.filter((c) => c.increased && c.name !== categories.topIncreasedCategory?.name);
        if (otherIncreases.length > 0) {
          response += `**Other categories with higher spending:**\n`;
          otherIncreases.slice(0, 3).forEach((c) => {
            response += `- **${c.name}**: +${currencySymbol}${c.diff.toLocaleString()} (+${c.percentChange}%)\n`;
          });
        }
      }
    } else {
      response += `You logged **${currencySymbol}${metrics.totalExpense.toLocaleString()}** this month. I don't have enough recorded transactions from last month to compute a full comparative variance yet. As you continue tracking, month-to-month trends will appear here!`;
    }
    return response;
  }

  // 3. Recurring Expenses & Upcoming Payments
  if (q.includes('recurring') || q.includes('upcoming') || q.includes('bill') || q.includes('subscription') || q.includes('payment')) {
    let response = `🔁 **Recurring Expenses & Commitments**\n\n`;
    if (recurring.activeList.length > 0) {
      response += `You have **${recurring.activeList.length} active recurring commitments** totaling **${currencySymbol}${recurring.totalCommitment.toLocaleString()} per month**:\n\n`;
      recurring.activeList.forEach((r) => {
        response += `- **${r.name || r.merchant}**: **${currencySymbol}${r.amount.toLocaleString()}** (${r.frequency || 'Monthly'}, due: *${r.due_date || r.dueDate || '1st'}*)\n`;
      });

      if (budget.safeRemainingBudget !== null) {
        response += `\n💡 **Impact on Budget:** After setting aside **${currencySymbol}${recurring.totalCommitment.toLocaleString()}** for recurring bills, your remaining discretionary budget is **${currencySymbol}${budget.safeRemainingBudget.toLocaleString()}** (~**${currencySymbol}${budget.safeDailySpend.toLocaleString()}/day**).`;
      }
    } else {
      response += `You have no fixed recurring expenses configured yet. You can add regular bills (rent, utilities, subscriptions) in the **Recurring Expenses** module to track upcoming due dates automatically.`;
    }
    return response;
  }

  // 4. Safe Category Spending Allowance ("How much can I safely spend?")
  if (q.includes('safe') || q.includes('how much can i spend') || q.includes('allowance') || q.includes('can i spend')) {
    let response = `🛡️ **Safe Spending Allowance**\n\n`;
    if (budget.hasBudget) {
      response += `- **Days Remaining This Month:** **${daysRemaining} days**\n`;
      response += `- **Overall Budget Remaining:** **${currencySymbol}${budget.remaining.toLocaleString()}**\n`;
      if (budget.safeRemainingBudget !== null) {
        response += `- **Discretionary Cushion (After Recurring):** **${currencySymbol}${budget.safeRemainingBudget.toLocaleString()}**\n`;
        response += `- **Recommended Safe Daily Pace:** **${currencySymbol}${budget.safeDailySpend.toLocaleString()} per day**\n\n`;
      }

      if (categories.allowances && categories.allowances.length > 0) {
        response += `**Category Spending Caps Remaining:**\n`;
        categories.allowances.forEach((ca) => {
          response += `- **${ca.category}**: **${currencySymbol}${ca.remaining.toLocaleString()}** left (~${currencySymbol}${ca.safeDailySpend}/day)\n`;
        });
      }
    } else {
      response += `You currently don't have a monthly budget configured. Based on your daily burn rate of **${currencySymbol}${metrics.dailyAverage.toLocaleString()}/day**, setting a budget around **${currencySymbol}${Math.round(metrics.projectedMonthlySpend * 1.1).toLocaleString()}** would establish safe boundaries.`;
    }
    return response;
  }

  // 5. Where am I spending the most? / Highest Category
  if (q.includes('most') || q.includes('highest') || q.includes('where does') || q.includes('top spend') || q.includes('where is')) {
    let response = `🏆 **Top Spending Breakdown**\n\n`;
    if (categories.highest) {
      response += `You are spending the most on **${categories.highest.name}**, which accounts for **${currencySymbol}${categories.highest.amount.toLocaleString()}** (**${categories.highest.percentage}%** of your total expenses) across **${categories.highest.count} transactions**.\n\n`;
      response += `**Top 4 Categories:**\n`;
      categories.breakdown.slice(0, 4).forEach((c, idx) => {
        response += `${idx + 1}. **${c.name}**: ${currencySymbol}${c.amount.toLocaleString()} (${c.percentage}%)\n`;
      });
    } else {
      response += `No categorized expenses found for this timeframe.`;
    }
    return response;
  }

  // 6. Unusual or high expense spikes / Anomalies
  if (q.includes('unusual') || q.includes('spike') || q.includes('anomaly') || q.includes('high') || q.includes('unnecessary')) {
    let response = `🔍 **Expense Spike & Anomaly Review**\n\n`;
    if (analysis.anomalies && analysis.anomalies.length > 0) {
      response += `I identified **${analysis.anomalies.length} transactions** that were significantly higher than your typical average in those categories:\n\n`;
      analysis.anomalies.slice(0, 3).forEach((sp) => {
        response += `- **${sp.description}**: **${currencySymbol}${sp.amount.toLocaleString()}** on ${sp.date} (*${sp.ratio}x higher* than category average of ${currencySymbol}${sp.categoryAverage})\n`;
      });
      response += `\nThese may represent planned one-time purchases or potential areas to review.`;
    } else {
      response += `✅ **No unusual expense spikes detected!** Your transactions are well within consistent spending ranges across all categories.`;
    }
    return response;
  }

  // 7. Savings / How to reduce expenses (checked before general spending)
  if (q.includes('save') || q.includes('saving') || q.includes('cut') || q.includes('reduce') || q.includes('trim') || q.includes('lower')) {
    let response = `💰 **Personalized Savings Opportunities**\n\n`;
    response += `Here are actionable, data-backed recommendations based on your actual spending:\n\n`;

    if (savings.discretionarySpend > 0) {
      response += `1. **Discretionary Spending Trim:** You spent **${currencySymbol}${savings.discretionarySpend.toLocaleString()}** on flexible categories (dining, leisure, shopping).\n`;
      response += `   - A modest **15% trim** frees up **${currencySymbol}${savings.trim15Percent.toLocaleString()}** this month!\n`;
      response += `   - A **25% trim** frees up **${currencySymbol}${savings.trim25Percent.toLocaleString()}**.\n\n`;
    }

    if (recurring.activeList.length > 0) {
      response += `2. **Recurring Subscriptions Review:** You have **${currencySymbol}${recurring.totalCommitment.toLocaleString()}/mo** in active recurring bills across ${recurring.activeList.length} services. Review if any unused memberships can be paused.\n\n`;
    }

    if (recurring.microExpenseTotal > 0) {
      response += `3. **Repeated Small Purchases:** You logged **${recurring.microExpenseCount} small purchases** (<${currencySymbol}250) totaling **${currencySymbol}${recurring.microExpenseTotal.toLocaleString()}**. Consolidating micro-transactions can create immediate savings.\n\n`;
    }

    response += `🎯 **Target Savings Milestone:** If your monthly goal is **${currencySymbol}${savings.targetGoal.toLocaleString()}**, ${
      metrics.netSavings >= savings.targetGoal
        ? `you have already achieved it with **${currencySymbol}${metrics.netSavings.toLocaleString()}** saved this month!`
        : `you are **${currencySymbol}${savings.targetGap.toLocaleString()}** away from reaching your target.`
    }`;

    return response;
  }

  // 8. Spending / Expense Overview
  if (q.includes('spend') || q.includes('expense') || q.includes('how much') || q.includes('overview') || q.includes('summary')) {
    let response = `📊 **Current Spending Overview**\n\n`;
    response += `So far this period, you have spent a total of **${currencySymbol}${metrics.totalExpense.toLocaleString()}** across **${metrics.transactionCount} transactions**.\n\n`;

    if (categories.highest) {
      response += `- **Top Category:** **${categories.highest.name}** at **${currencySymbol}${categories.highest.amount.toLocaleString()}** (${categories.highest.percentage}% of total).\n`;
    }
    response += `- **Daily Burn Rate:** Averaging **${currencySymbol}${metrics.dailyAverage.toLocaleString()}** per day.\n`;
    response += `- **Projected Month-End Spend:** **${currencySymbol}${metrics.projectedMonthlySpend.toLocaleString()}**.\n\n`;

    if (budget.hasBudget) {
      if (budget.isOverBudget) {
        response += `⚠️ **Budget Alert:** You have exceeded your monthly limit of **${currencySymbol}${budget.limit.toLocaleString()}** by **${currencySymbol}${budget.overBudgetAmount.toLocaleString()}**. Consider pausing discretionary purchases.`;
      } else {
        response += `✅ **Budget Status:** You have **${currencySymbol}${budget.remaining.toLocaleString()}** remaining (${budget.utilizationRate}% utilized).`;
      }
    } else {
      response += `💡 *Tip: Set a monthly budget in the sidebar or Budgets page to track your pacing in real-time!*`;
    }
    return response;
  }

  // 9. Budget Analysis / Am I on track
  if (q.includes('budget') || q.includes('track') || q.includes('limit') || q.includes('pacing')) {
    if (!budget.hasBudget) {
      return `💡 **No Monthly Budget Set Yet**\n\nYou currently have no monthly budget configured. Based on your current spending of **${currencySymbol}${metrics.totalExpense.toLocaleString()}** and projected spend of **${currencySymbol}${metrics.projectedMonthlySpend.toLocaleString()}**, setting a budget around **${currencySymbol}${Math.round(metrics.projectedMonthlySpend * 1.1).toLocaleString()}** would give you a healthy cushion.\n\nYou can configure your budget anytime in the **Budgets** section!`;
    }

    let response = `🎯 **Monthly Budget Analysis**\n\n`;
    response += `- **Monthly Budget Limit:** **${currencySymbol}${budget.limit.toLocaleString()}**\n`;
    response += `- **Amount Spent:** **${currencySymbol}${budget.spent.toLocaleString()}** (${budget.utilizationRate}%)\n`;
    response += `- **Remaining Cushion:** **${currencySymbol}${budget.remaining.toLocaleString()}**\n`;
    response += `- **Projected End-of-Month:** **${currencySymbol}${budget.projectedMonthlySpend.toLocaleString()}**\n\n`;

    if (budget.isOverBudget) {
      response += `🚨 **Status: Over Budget!** You are currently **${currencySymbol}${budget.overBudgetAmount.toLocaleString()}** above your cap. I recommend limiting non-essential categories like dining out and entertainment for the rest of the month.`;
    } else if (budget.projectedOverBudget) {
      response += `⚠️ **Status: Pace Warning!** While you still have **${currencySymbol}${budget.remaining.toLocaleString()}** remaining, your daily burn rate of **${currencySymbol}${metrics.dailyAverage.toLocaleString()}** will exceed your cap by **${currencySymbol}${budget.projectedDifference.toLocaleString()}** if continued.`;
    } else {
      response += `✨ **Status: Excellent!** You are pacing well within your budget with comfortable buffer remaining.`;
    }

    if (categoryAlerts.length > 0) {
      response += `\n\n**Category Alerts to Watch:**\n`;
      categoryAlerts.forEach((a) => {
        response += `- **${a.category}**: ${a.status === 'exceeded' ? 'Exceeded by ' + currencySymbol + a.overAmount : 'Near limit (' + a.utilization + '%)'}\n`;
      });
    }
    return response;
  }

  // 10. Generic friendly financial consultation response
  let response = `👋 **Hello! I'm SpendWise AI**, your personal finance assistant.\n\n`;
  response += `Here is your current financial pulse:\n`;
  response += `- **Total Expenses:** **${currencySymbol}${metrics.totalExpense.toLocaleString()}**\n`;
  response += `- **Total Income:** **${currencySymbol}${metrics.totalIncome.toLocaleString()}**\n`;
  response += `- **Net Savings:** **${currencySymbol}${metrics.netSavings.toLocaleString()}** (${metrics.savingsRate}% savings rate)\n`;

  if (budget.hasBudget) {
    response += `- **Monthly Budget:** **${budget.utilizationRate}%** used (**${currencySymbol}${budget.remaining.toLocaleString()}** left)\n`;
  }

  response += `\nFeel free to ask me:\n`;
  response += `- *"Where am I spending the most?"*\n`;
  response += `- *"Which category increased compared to last month?"*\n`;
  response += `- *"What are my upcoming recurring payments?"*\n`;
  response += `- *"How much can I safely spend this week?"*\n`;
  response += `- *"How can I reduce my expenses?"*`;

  return response;
}

/**
 * Generates dynamic, contextual follow-up questions
 */
function generateContextualSuggestions(analysis, lastUserMessage = '') {
  const { budget, categories, recurring } = analysis;
  const suggestions = [];

  if (categories.topIncreasedCategory && categories.topIncreasedCategory.diff > 0) {
    suggestions.push(`Why did ${categories.topIncreasedCategory.name} increase this month?`);
  }

  if (categories.highest) {
    suggestions.push(`Where am I spending the most?`);
  }

  if (recurring.activeList && recurring.activeList.length > 0) {
    suggestions.push('What are my upcoming recurring payments?');
  } else {
    suggestions.push('How can I save ₹2,000 next month?');
  }

  if (budget.hasBudget) {
    suggestions.push('How much can I safely spend per day?');
  } else {
    suggestions.push('Am I staying within my budget?');
  }

  return suggestions.slice(0, 4);
}

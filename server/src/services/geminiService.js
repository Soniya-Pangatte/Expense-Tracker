import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;
if (apiKey && apiKey !== 'your-gemini-api-key-here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

const SYSTEM_INSTRUCTION = `You are SpendWise AI, the intelligent personal finance assistant for the SpendWise platform.
Your tagline is: "Your Personal Finance Assistant".

Your Personality & Voice:
- Friendly, encouraging, and professional.
- Clear, practical, and conversational. Avoid complex banking jargon.
- Positive and solution-oriented. Help users make smart financial decisions without feeling judged.

CRITICAL FINANCIAL ACCURACY & SAFETY RULES:
1. STRICT DATA ACCURACY: You are provided with a verified "USER FINANCIAL GROUND TRUTH DATA" summary computed directly from the user's records. You MUST use these exact numbers and facts.
2. NEVER FABRICATE OR HALLUCINATE: Never invent dollar/rupee amounts, imaginary transactions, or non-existent debts. If data is zero or missing, clearly state that and guide the user on how to add it.
3. CURRENCY: Always use the user's active currency symbol specified in the ground truth (e.g., ₹ for INR, $ for USD).
4. ACTIONABLE INSIGHTS: Give practical, realistic advice (e.g., reducing discretionary dining, setting a monthly budget, reviewing subscriptions).
5. FORMATTING: Use clean Markdown with bold numbers, short paragraphs, and bullet points. Keep answers concise (1-3 brief paragraphs).
6. NEVER ASK FOR SENSITIVE CREDENTIALS: Never request passwords, OTPs, full bank account numbers, or card CVVs.`;

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
          parts: [{ text: `System Context - Here is my current financial status:\n${financialSummaryText}\n\nPlease acknowledge you have this financial snapshot ready.` }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: `Hello! I have your latest financial data loaded and ready. I'm SpendWise AI, your personal finance assistant. How can I help you optimize your money today?` }],
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

    // Intelligent Deterministic Fallback Engine (when API key is unset or rate limited)
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
  const { metrics, categories, budget, categoryAlerts, recurring, savings, currencySymbol } = analysis;

  // 1. If user has no transactions
  if (metrics.transactionCount === 0) {
    return `👋 **Welcome to SpendWise!**

I noticed you don't have any transactions logged yet. To get personalized financial insights, start by adding your income and expenses or importing a bank statement.

Once you add a few entries, I can help you:
- Track where your money goes across categories.
- Detect overspending and recurring subscriptions.
- Build a realistic savings plan tailored to your lifestyle.`;
  }

  // 2. Spending / Expense Overview
  if (q.includes('spend') || q.includes('expense') || q.includes('how much') || q.includes('overview') || q.includes('summary')) {
    let response = `📊 **Current Spending Overview**\n\n`;
    response += `So far this period, you have spent a total of **${currencySymbol}${metrics.totalExpense.toLocaleString()}** across **${metrics.transactionCount} transactions**.\n\n`;

    if (categories.highest) {
      response += `- **Top Category:** **${categories.highest.name}** at **${currencySymbol}${categories.highest.amount.toLocaleString()}** (${categories.highest.percentage}% of total expenses).\n`;
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

  // 3. Budget Analysis / Am I on track
  if (q.includes('budget') || q.includes('track') || q.includes('limit') || q.includes('pacing')) {
    if (!budget.hasBudget) {
      return `💡 **No Monthly Budget Set Yet**\n\nYou currently have no monthly budget configured. Based on your current spending of **${currencySymbol}${metrics.totalExpense.toLocaleString()}** and projected spend of **${currencySymbol}${metrics.projectedMonthlySpend.toLocaleString()}**, setting a budget around **${currencySymbol}${Math.round(metrics.projectedMonthlySpend * 1.1).toLocaleString()}** would give you a healthy cushion.\n\nYou can configure your budget anytime using the **Edit Budget** button in the sidebar!`;
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
        response += `- ${a.category}: ${a.status === 'exceeded' ? 'Exceeded by ' + currencySymbol + a.overAmount : 'Near limit (' + a.utilization + '%)'}\n`;
      });
    }
    return response;
  }

  // 4. Savings / How to save money
  if (q.includes('save') || q.includes('saving') || q.includes('cut') || q.includes('reduce') || q.includes('trim')) {
    let response = `💰 **Personalized Savings Strategy**\n\n`;
    response += `Here is how you can boost your savings based on your real spending numbers:\n\n`;

    if (savings.discretionarySpend > 0) {
      response += `1. **Discretionary Spending Trim:** You spent **${currencySymbol}${savings.discretionarySpend.toLocaleString()}** on flexible categories (dining, leisure, shopping).\n`;
      response += `   - Trimming flexible spend by **15%** frees up **${currencySymbol}${savings.trim15Percent.toLocaleString()}** this month!\n`;
      response += `   - Trimming by **25%** frees up **${currencySymbol}${savings.trim25Percent.toLocaleString()}**.\n\n`;
    }

    if (recurring.items.length > 0) {
      response += `2. **Subscription & Recurring Audit:** You have **${recurring.items.length} recurring charges**:\n`;
      recurring.items.slice(0, 3).forEach((item) => {
        response += `   - **${item.merchant}**: ${currencySymbol}${item.amount.toLocaleString()}/mo\n`;
      });
      response += `   Review if any unused subscriptions can be paused.\n\n`;
    }

    if (recurring.microExpenseTotal > 0) {
      response += `3. **Micro-Purchases Check:** You logged **${recurring.microExpenseCount} small purchases** totaling **${currencySymbol}${recurring.microExpenseTotal.toLocaleString()}**. Small coffees or impulse snacks add up fast!\n\n`;
    }

    response += `🎯 **Target Savings Goal:** If your goal is to save **${currencySymbol}${savings.targetGoal.toLocaleString()}** monthly, ${
      metrics.netSavings >= savings.targetGoal
        ? `you've already achieved it with **${currencySymbol}${metrics.netSavings.toLocaleString()}** saved this month!`
        : `you are just **${currencySymbol}${savings.targetGap.toLocaleString()}** away from reaching your target.`
    }`;

    return response;
  }

  // 5. Category Breakdown / Where does my money go?
  if (q.includes('category') || q.includes('categories') || q.includes('breakdown') || q.includes('where does') || q.includes('food') || q.includes('dining')) {
    let response = `🏷️ **Category-by-Category Spend Breakdown**\n\n`;
    if (categories.breakdown.length === 0) {
      return `You don't have any categorized expenses recorded yet.`;
    }

    categories.breakdown.slice(0, 5).forEach((c) => {
      response += `- **${c.name}**: ${currencySymbol}${c.amount.toLocaleString()} (${c.percentage}% of total)\n`;
    });

    if (categories.highest) {
      response += `\nYour largest expense driver is **${categories.highest.name}**, accounting for **${categories.highest.percentage}%** of your total monthly outflow.`;
    }
    return response;
  }

  // 6. Generic friendly financial consultation response
  let response = `👋 **Hello! I'm SpendWise AI**, your personal finance assistant.\n\n`;
  response += `Here is your current financial pulse:\n`;
  response += `- **Total Expenses:** **${currencySymbol}${metrics.totalExpense.toLocaleString()}**\n`;
  response += `- **Total Income:** **${currencySymbol}${metrics.totalIncome.toLocaleString()}**\n`;
  response += `- **Net Savings:** **${currencySymbol}${metrics.netSavings.toLocaleString()}** (${metrics.savingsRate}% rate)\n`;

  if (budget.hasBudget) {
    response += `- **Monthly Budget:** **${budget.utilizationRate}%** used (${currencySymbol}${budget.remaining.toLocaleString()} left)\n`;
  }

  response += `\nFeel free to ask me:\n`;
  response += `- *"How can I save ₹5,000 this month?"*\n`;
  response += `- *"Am I overspending on dining out?"*\n`;
  response += `- *"What is my daily burn rate and projected spend?"*`;

  return response;
}

/**
 * Generates dynamic, contextual follow-up questions
 */
function generateContextualSuggestions(analysis, lastUserMessage = '') {
  const { budget, categories, metrics } = analysis;
  const suggestions = [];

  if (!budget.hasBudget) {
    suggestions.push('What monthly budget should I set?');
  } else if (budget.isOverBudget) {
    suggestions.push('How can I cut expenses to get back on budget?');
  } else {
    suggestions.push('Am I on track with my monthly budget?');
  }

  if (categories.highest) {
    suggestions.push(`How can I reduce spending on ${categories.highest.name}?`);
  }

  suggestions.push('Show my potential savings opportunities');
  suggestions.push('What is my daily burn rate and projection?');

  return suggestions.slice(0, 4);
}


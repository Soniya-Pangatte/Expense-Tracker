import assert from 'assert';
import { FinancialAnalysisEngine } from './src/services/financialAnalysisEngine.js';
import { GeminiService } from './src/services/geminiService.js';
import { requireAuth, DEMO_USER } from './src/middleware/auth.js';

console.log('================================================================');
console.log('       SPENDWISE PHASE 6: RIGOROUS QA & VERIFICATION SUITE       ');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------------------
// SUITE 1: Financial Analysis Engine Calculations & Accuracy
// -------------------------------------------------------------------------
console.log('\n--- SUITE 1: Financial Calculations & Ground Truth ---');

const now = new Date();
const curYear = now.getFullYear();
const curMonth = now.getMonth();
const curMonthStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
const prevMonthYear = curMonth === 0 ? curYear - 1 : curYear;
const prevMonthIdx = curMonth === 0 ? 11 : curMonth - 1;
const prevMonthStr = `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`;

const mockDataset = {
  transactions: [
    // Current month transactions
    { id: 'tx-1', amount: 50000, type: 'income', category: 'Salary', date: `${curMonthStr}-01` },
    { id: 'tx-2', amount: 12000, type: 'expense', category: 'Rent & Housing', description: 'Apartment rent', date: `${curMonthStr}-02` },
    { id: 'tx-3', amount: 8000, type: 'expense', category: 'Food & Dining', description: 'Groceries & dinners', date: `${curMonthStr}-05` },
    { id: 'tx-4', amount: 3000, type: 'expense', category: 'Utilities', description: 'Electricity and water', date: `${curMonthStr}-07` },
    { id: 'tx-5', amount: 5000, type: 'expense', category: 'Entertainment & Leisure', description: 'Weekend concert', date: `${curMonthStr}-10` },
    { id: 'tx-6', amount: 150, type: 'expense', category: 'Food & Dining', description: 'Coffee snack', date: `${curMonthStr}-11` },
    { id: 'tx-7', amount: 120, type: 'expense', category: 'Food & Dining', description: 'Tea snack', date: `${curMonthStr}-12` },
    // Previous month transactions
    { id: 'tx-prev-1', amount: 50000, type: 'income', category: 'Salary', date: `${prevMonthStr}-01` },
    { id: 'tx-prev-2', amount: 12000, type: 'expense', category: 'Rent & Housing', description: 'Apartment rent', date: `${prevMonthStr}-02` },
    { id: 'tx-prev-3', amount: 4000, type: 'expense', category: 'Food & Dining', description: 'Groceries', date: `${prevMonthStr}-05` },
    { id: 'tx-prev-4', amount: 3000, type: 'expense', category: 'Utilities', description: 'Electricity', date: `${prevMonthStr}-07` },
    { id: 'tx-prev-5', amount: 1000, type: 'expense', category: 'Entertainment & Leisure', description: 'Movies', date: `${prevMonthStr}-10` },
  ],
  monthlyBudget: {
    month_year: curMonthStr,
    amount: 35000,
  },
  budgets: [
    { categoryName: 'Food & Dining', limit: 7000 },
    { categoryName: 'Rent & Housing', limit: 12000 },
    { categoryName: 'Entertainment & Leisure', limit: 6000 },
  ],
  recurringExpenses: [
    { id: 'rec-1', name: 'Netflix Premium', amount: 649, frequency: 'Monthly', due_date: '15th', status: 'Active' },
    { id: 'rec-2', name: 'Broadband Fiber', amount: 999, frequency: 'Monthly', due_date: '20th', status: 'Active' },
  ],
};

runTest('1.1: Current Month Income, Expense & Net Savings Calculation', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
  assert.strictEqual(analysis.metrics.totalIncome, 50000);
  assert.strictEqual(analysis.metrics.totalExpense, 28270);
  assert.strictEqual(analysis.metrics.netSavings, 21730);
  assert.strictEqual(analysis.metrics.savingsRate, Math.round((21730 / 50000) * 100)); // 43%
});

runTest('1.2: Month-over-Month Variance & Category Delta Calculation', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
  // Previous month expense: 12000 + 4000 + 3000 + 1000 = 20000
  assert.strictEqual(analysis.metrics.prevMonthExpense, 20000);
  assert.strictEqual(analysis.metrics.expenseVariance, 28270 - 20000); // +8270
  
  // Food & Dining went from 4000 to 8270 (+4270)
  // Entertainment went from 1000 to 5000 (+4000)
  assert(analysis.categories.topIncreasedCategory !== null);
  assert.strictEqual(analysis.categories.topIncreasedCategory.name, 'Food & Dining');
  assert.strictEqual(analysis.categories.topIncreasedCategory.diff, 4270);
});

runTest('1.3: Monthly Budget Utilization & Pacing', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
  assert.strictEqual(analysis.budget.hasBudget, true);
  assert.strictEqual(analysis.budget.limit, 35000);
  assert.strictEqual(analysis.budget.spent, 28270);
  assert.strictEqual(analysis.budget.remaining, 35000 - 28270); // 6730
  assert.strictEqual(analysis.budget.utilizationRate, Math.round((28270 / 35000) * 100)); // 81%
  assert.strictEqual(analysis.budget.pacingStatus, 'warning'); // >= 80% triggers warning
});

runTest('1.4: Recurring Commitments & Safe Daily Allowance', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
  const expectedRecurring = 649 + 999; // 1648
  assert.strictEqual(analysis.recurring.totalCommitment, expectedRecurring);
  assert.strictEqual(analysis.recurring.activeList.length, 2);

  // Safe remaining budget = 6730 - 1648 = 5082
  assert.strictEqual(analysis.budget.safeRemainingBudget, 6730 - expectedRecurring);
  assert(analysis.budget.safeDailySpend > 0);
});

runTest('1.5: Category Alerts (Exceeded & Warning)', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
  // Food & Dining spent 8270 with limit 7000 => exceeded
  const foodAlert = analysis.categoryAlerts.find(a => a.category === 'Food & Dining');
  assert(foodAlert, 'Food & Dining alert must exist');
  assert.strictEqual(foodAlert.status, 'exceeded');
  assert.strictEqual(foodAlert.overAmount, 1270);

  // Rent & Housing spent 12000 with limit 12000 => 100% (exceeded or warning)
  const rentAlert = analysis.categoryAlerts.find(a => a.category === 'Rent & Housing');
  assert(rentAlert, 'Rent & Housing alert must exist');
});

runTest('1.6: Anomaly & Spike Detection', () => {
  const spikeDataset = {
    transactions: [
      { id: 'sp-1', amount: 500, type: 'expense', category: 'Shopping', description: 'Shirt', date: `${curMonthStr}-02` },
      { id: 'sp-2', amount: 600, type: 'expense', category: 'Shopping', description: 'Shoes', date: `${curMonthStr}-04` },
      { id: 'sp-3', amount: 8000, type: 'expense', category: 'Shopping', description: 'Designer Jacket', date: `${curMonthStr}-08` },
    ],
  };
  const analysis = FinancialAnalysisEngine.analyzeFinancials(spikeDataset, 'INR');
  assert(analysis.anomalies.length > 0, 'Should detect Designer Jacket anomaly');
  assert.strictEqual(analysis.anomalies[0].description, 'Designer Jacket');
});

runTest('1.7: Zero Income Edge Case (No NaN or Crash)', () => {
  const zeroIncomeData = {
    transactions: [
      { id: 'z-1', amount: 4500, type: 'expense', category: 'Groceries', date: `${curMonthStr}-05` },
    ],
  };
  const analysis = FinancialAnalysisEngine.analyzeFinancials(zeroIncomeData, 'INR');
  assert.strictEqual(analysis.metrics.totalIncome, 0);
  assert.strictEqual(analysis.metrics.totalExpense, 4500);
  assert.strictEqual(analysis.metrics.netSavings, -4500);
  assert.strictEqual(analysis.metrics.savingsRate, 0); // No NaN
});

runTest('1.8: Empty Transactions Edge Case', () => {
  const emptyData = { transactions: [] };
  const analysis = FinancialAnalysisEngine.analyzeFinancials(emptyData, 'INR');
  assert.strictEqual(analysis.metrics.transactionCount, 0);
  assert.strictEqual(analysis.metrics.totalIncome, 0);
  assert.strictEqual(analysis.metrics.totalExpense, 0);
  assert.strictEqual(analysis.categories.highest, null);
});

// -------------------------------------------------------------------------
// SUITE 2: AI Response Quality & Deterministic Fallback Engine
// -------------------------------------------------------------------------
console.log('\n--- SUITE 2: AI Responses & Query Routing ---');

const baseAnalysis = FinancialAnalysisEngine.analyzeFinancials(mockDataset, 'INR');
const summaryText = FinancialAnalysisEngine.buildFinancialSummaryContext(baseAnalysis);

await runAsyncTest('2.1: Query "Where am I spending the most?"', async () => {
  const res = await GeminiService.generateChatResponse('Where am I spending the most?', baseAnalysis, summaryText);
  assert(res.reply.includes('Rent & Housing') || res.reply.includes('12,000'));
  assert(res.reply.includes('₹') || res.reply.includes('INR'));
});

await runAsyncTest('2.2: Query "Which category increased compared with last month?"', async () => {
  const res = await GeminiService.generateChatResponse('Which category increased compared with last month?', baseAnalysis, summaryText);
  assert(res.reply.includes('Food & Dining'));
  assert(res.reply.includes('4,270') || res.reply.includes('jump') || res.reply.includes('increase'));
});

await runAsyncTest('2.3: Query "What are my upcoming recurring payments?"', async () => {
  const res = await GeminiService.generateChatResponse('What are my recurring payments?', baseAnalysis, summaryText);
  assert(res.reply.includes('Netflix Premium') || res.reply.includes('Broadband Fiber'));
  assert(res.reply.includes('1,648'));
});

await runAsyncTest('2.4: Query "How much can I safely spend each day?"', async () => {
  const res = await GeminiService.generateChatResponse('How much can I spend safely each day?', baseAnalysis, summaryText);
  assert(res.reply.includes('Safe Spending Allowance') || res.reply.includes('Safe Daily Pace'));
  assert(res.reply.includes('5,082') || res.reply.includes('remaining'));
});

await runAsyncTest('2.5: Query "How can I reduce my expenses?"', async () => {
  const res = await GeminiService.generateChatResponse('How can I reduce my expenses?', baseAnalysis, summaryText);
  assert(res.reply.includes('Savings Opportunities') || res.reply.includes('trim') || res.reply.includes('Discretionary'));
});

await runAsyncTest('2.6: Query "Am I staying within my budget?"', async () => {
  const res = await GeminiService.generateChatResponse('Am I staying within my budget?', baseAnalysis, summaryText);
  assert(res.reply.includes('35,000') || res.reply.includes('81%'));
  assert(res.reply.includes('Food & Dining') || res.reply.includes('Exceeded'));
});

await runAsyncTest('2.7: Multi-turn Follow-up Context Injection', async () => {
  const history = [
    { role: 'user', content: 'What is my budget?' },
    { role: 'assistant', content: 'Your budget is ₹35,000.' },
  ];
  const res = await GeminiService.generateChatResponse('Can you tell me more about my food spending?', baseAnalysis, summaryText, history);
  assert(res.reply.length > 50);
  assert(res.suggestedQuestions && res.suggestedQuestions.length > 0);
});

// -------------------------------------------------------------------------
// SUITE 3: Security & Authorization Middleware
// -------------------------------------------------------------------------
console.log('\n--- SUITE 3: Security & Authorization ---');

runTest('3.1: Reject Unauthenticated Requests (No Auth Header)', () => {
  const req = { headers: {} };
  let status = null;
  let responseData = null;
  const res = {
    status: (s) => { status = s; return { json: (d) => { responseData = d; } }; },
  };
  requireAuth(req, res, () => {});
  assert.strictEqual(status, 401);
  assert(responseData.error.includes('Missing or invalid Authorization header'));
});

runTest('3.2: Allow Demo Bypass with x-demo-user', () => {
  const req = { headers: { 'x-demo-user': 'true' } };
  let calledNext = false;
  const res = {};
  requireAuth(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, true);
  assert.strictEqual(req.isDemo, true);
  assert.strictEqual(req.user.id, DEMO_USER.id);
});

runTest('3.3: User Isolation in FinancialAnalysisEngine Queries', () => {
  // Check that FinancialAnalysisEngine scopes with user_id
  const code = FinancialAnalysisEngine.getUserFinancialData.toString();
  assert(code.includes("eq('user_id', userId)"));
});

console.log('================================================================');
console.log(`  ALL ${totalTests} QA TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('================================================================');

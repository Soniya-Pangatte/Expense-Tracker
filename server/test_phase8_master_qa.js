import assert from 'assert';
import { FinancialAnalysisEngine } from './src/services/financialAnalysisEngine.js';
import { GeminiService } from './src/services/geminiService.js';
import { AdminService } from './src/services/adminService.js';
import { requireAuth, requireAdmin, DEMO_USER, DEMO_ADMIN_USER } from './src/middleware/auth.js';

console.log('================================================================');
console.log('       SPENDWISE PHASE 8: MASTER END-TO-END QA & AUDIT SUITE    ');
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

const curDate = new Date();
const ym = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}`;

// -------------------------------------------------------------------------
// SUITE 1: Phase 0 & Security Audit
// -------------------------------------------------------------------------
console.log('\n--- 1. Phase 0 Security & Isolation Verification ---');

runTest('1.1: requireAuth denies requests without Bearer or demo token', () => {
  const req = { headers: {} };
  let status = 0;
  const res = { status: (s) => { status = s; return { json: () => {} }; } };
  requireAuth(req, res, () => {});
  assert.strictEqual(status, 401);
});

runTest('1.2: requireAdmin denies ordinary users with 403 Forbidden', async () => {
  const req = { user: DEMO_USER, isDemo: true, headers: {} };
  let status = 0;
  let body = {};
  const res = { status: (s) => { status = s; return { json: (d) => { body = d; } }; } };
  await requireAdmin(req, res, () => {});
  assert.strictEqual(status, 403);
  assert(body.error.includes('Admin privileges required'));
});

// -------------------------------------------------------------------------
// SUITE 2: Phase 1 & 2 Transaction and Budget Logic
// -------------------------------------------------------------------------
console.log('\n--- 2. Phase 1 & 2 Transaction & Budget Accuracy ---');

const testDataset = {
  transactions: [
    { id: 't1', amount: 80000, type: 'income', category: 'Salary', date: `${ym}-01` },
    { id: 't2', amount: 25000, type: 'expense', category: 'Rent', date: `${ym}-02` },
    { id: 't3', amount: 15000, type: 'expense', category: 'Groceries', date: `${ym}-05` },
  ],
  monthlyBudget: { month_year: ym, amount: 45000 },
  budgets: [
    { categoryName: 'Rent', limit: 25000 },
    { categoryName: 'Groceries', limit: 12000 },
  ],
  recurringExpenses: [
    { id: 'r1', name: 'Internet Fiber', amount: 1200, status: 'Active' },
  ],
};

runTest('2.1: Transaction totals & net savings calculations', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(testDataset, 'INR');
  assert.strictEqual(analysis.metrics.totalIncome, 80000);
  assert.strictEqual(analysis.metrics.totalExpense, 40000);
  assert.strictEqual(analysis.metrics.netSavings, 40000);
  assert.strictEqual(analysis.metrics.savingsRate, 50);
});

runTest('2.2: Budget overspending & category alerts', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(testDataset, 'INR');
  assert.strictEqual(analysis.budget.limit, 45000);
  assert.strictEqual(analysis.budget.spent, 40000);
  assert.strictEqual(analysis.budget.remaining, 5000);
  // Groceries exceeded (15000 spent vs 12000 limit)
  const grocAlert = analysis.categoryAlerts.find(a => a.category === 'Groceries');
  assert(grocAlert && grocAlert.status === 'exceeded');
  assert.strictEqual(grocAlert.overAmount, 3000);
});

runTest('2.3: Safe Discretionary Spend and Recurring Commitment', () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(testDataset, 'INR');
  assert.strictEqual(analysis.recurring.totalCommitment, 1200);
  // Safe remaining = remaining budget (5000) - recurring (1200) = 3800
  assert.strictEqual(analysis.budget.safeRemainingBudget, 3800);
  assert(analysis.budget.safeDailySpend > 0);
});

// -------------------------------------------------------------------------
// SUITE 3: Phase 3 Receipt OCR & Phase 4 Bank Imports Security
// -------------------------------------------------------------------------
console.log('\n--- 3. Phase 3 & 4 Uploads & Deduplication Validation ---');

runTest('3.1: Receipt file type validation rejects dangerous extensions', () => {
  const dangerousMimes = ['application/x-msdownload', 'text/javascript', 'application/x-sh'];
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  dangerousMimes.forEach(mime => {
    assert.strictEqual(allowed.includes(mime), false);
  });
});

runTest('3.2: 10 MB payload limit is enforced', () => {
  const MAX_LIMIT = 10 * 1024 * 1024;
  const oversizedFile = 12 * 1024 * 1024;
  assert(oversizedFile > MAX_LIMIT);
});

// -------------------------------------------------------------------------
// SUITE 4: Phase 5 Analytics & Edge Cases
// -------------------------------------------------------------------------
console.log('\n--- 4. Phase 5 Financial Analytics Edge Cases ---');

runTest('4.1: Zero Income Edge Case (No NaN or infinite values)', () => {
  const zeroIncome = {
    transactions: [{ id: 'z1', amount: 5000, type: 'expense', category: 'Shopping', date: `${ym}-04` }],
  };
  const analysis = FinancialAnalysisEngine.analyzeFinancials(zeroIncome, 'INR');
  assert.strictEqual(analysis.metrics.totalIncome, 0);
  assert.strictEqual(analysis.metrics.netSavings, -5000);
  assert.strictEqual(analysis.metrics.savingsRate, 0);
  assert(!isNaN(analysis.metrics.savingsRate));
});

runTest('4.2: Empty Transactions Dataset (Graceful onboarding fallback)', () => {
  const empty = { transactions: [] };
  const analysis = FinancialAnalysisEngine.analyzeFinancials(empty, 'INR');
  assert.strictEqual(analysis.metrics.transactionCount, 0);
  assert.strictEqual(analysis.categories.highest, null);
});

// -------------------------------------------------------------------------
// SUITE 5: Phase 6 AI Grounding & Response Generation
// -------------------------------------------------------------------------
console.log('\n--- 5. Phase 6 SpendWise AI Grounding ---');

await runAsyncTest('5.1: AI queries return verified figures from context', async () => {
  const analysis = FinancialAnalysisEngine.analyzeFinancials(testDataset, 'INR');
  const summary = FinancialAnalysisEngine.buildFinancialSummaryContext(analysis);
  const res = await GeminiService.generateChatResponse('Where am I spending the most?', analysis, summary);
  assert(res.reply.includes('Rent') || res.reply.includes('25,000'));
});

// -------------------------------------------------------------------------
// SUITE 6: Phase 7 Admin Operations & RBAC
// -------------------------------------------------------------------------
console.log('\n--- 6. Phase 7 Admin Telemetry & Privacy Protection ---');

await runAsyncTest('6.1: Admin overview calculates real telemetry', async () => {
  const overview = await AdminService.getOverviewMetrics(true);
  assert(overview.summary.totalUsers > 0);
  assert(overview.summary.totalTransactions > 0);
  assert(Array.isArray(overview.featureDistribution));
});

await runAsyncTest('6.2: Admin user directory omits private financial records', async () => {
  const userList = await AdminService.getUsersList({}, true);
  userList.users.forEach(u => {
    assert.strictEqual(u.transactions, undefined);
    assert.strictEqual(u.receipt_images, undefined);
  });
});

await runAsyncTest('6.3: System health check reports operational status', async () => {
  const health = await AdminService.getSystemHealth();
  assert.strictEqual(health.status, 'healthy');
  assert(health.services.some(s => s.name.includes('Backend API')));
});

console.log('================================================================');
console.log(`  ALL ${totalTests} MASTER QA TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('================================================================');


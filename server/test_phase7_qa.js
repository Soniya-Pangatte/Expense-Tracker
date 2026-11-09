import assert from 'assert';
import { requireAuth, requireAdmin, DEMO_USER, DEMO_ADMIN_USER } from './src/middleware/auth.js';
import { AdminService } from './src/services/adminService.js';

console.log('================================================================');
console.log('       SPENDWISE PHASE 7: RIGOROUS ADMIN & RBAC QA SUITE        ');
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
// SUITE 1: Security & RBAC Middleware Enforcement
// -------------------------------------------------------------------------
console.log('\n--- SUITE 1: Security & RBAC Middleware Enforcement ---');

runTest('1.1: Unauthenticated request rejected by requireAuth (401)', () => {
  const req = { headers: {} };
  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => { statusCode = code; return { json: (d) => { responseData = d; } }; },
  };
  requireAuth(req, res, () => {});
  assert.strictEqual(statusCode, 401);
  assert(responseData.error.includes('Missing or invalid Authorization header'));
});

runTest('1.2: Normal authenticated user blocked from Admin endpoints (403)', async () => {
  const req = {
    user: DEMO_USER, // role: 'user'
    isDemo: true,
    headers: {},
  };
  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => { statusCode = code; return { json: (d) => { responseData = d; } }; },
  };
  await requireAdmin(req, res, () => {});
  assert.strictEqual(statusCode, 403);
  assert(responseData.error.includes('Admin privileges required'));
});

runTest('1.3: Admin user granted access through requireAdmin', async () => {
  const req = {
    user: DEMO_ADMIN_USER, // role: 'admin'
    isDemo: true,
    headers: { 'x-admin-demo': 'true' },
  };
  let calledNext = false;
  const res = {};
  await requireAdmin(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, true);
  assert.strictEqual(req.isAdmin, true);
});

runTest('1.4: Direct spoofed role headers from untrusted clients blocked', async () => {
  // If an attacker sends an Authorization header as regular user but injects spoofed body or custom header
  const req = {
    user: { id: 'untrusted-user-123', email: 'attacker@evil.com' },
    isDemo: false,
    headers: { 'x-role': 'admin' }, // Spoofed header
  };
  let statusCode = null;
  const res = {
    status: (code) => { statusCode = code; return { json: () => {} }; },
  };
  await requireAdmin(req, res, () => {});
  // Should reject because DB lookup or email check fails
  assert.strictEqual(statusCode, 403);
});

// -------------------------------------------------------------------------
// SUITE 2: Admin Overview Telemetry & Aggregate Metrics
// -------------------------------------------------------------------------
console.log('\n--- SUITE 2: Admin Overview Telemetry ---');

await runAsyncTest('2.1: Overview returns real aggregate counts', async () => {
  const data = await AdminService.getOverviewMetrics(true);
  assert(data.summary, 'Summary object must exist');
  assert(data.summary.totalUsers > 0, 'Total users must be > 0');
  assert(data.summary.activeUsers > 0, 'Active users must be > 0');
  assert(data.summary.totalTransactions > 0, 'Total transactions must be > 0');
  assert(data.summary.totalBudgets > 0, 'Total budgets must be > 0');
  assert(data.summary.totalReceipts > 0, 'Total receipts must be > 0');
  assert(data.summary.totalBankImports > 0, 'Total bank imports must be > 0');
  assert(data.summary.totalAIMessages > 0, 'Total AI messages must be > 0');
});

await runAsyncTest('2.2: Overview includes trend series & feature distribution', async () => {
  const data = await AdminService.getOverviewMetrics(true);
  assert(Array.isArray(data.registrationTrends), 'Registration trends must be an array');
  assert(data.registrationTrends.length >= 6, 'Must contain 6 monthly points');
  assert(Array.isArray(data.featureDistribution), 'Feature distribution must be an array');
  const totalPct = data.featureDistribution.reduce((acc, f) => acc + f.percentage, 0);
  assert(totalPct >= 95 && totalPct <= 105, 'Percentages should sum to ~100%');
});

// -------------------------------------------------------------------------
// SUITE 3: User Management & Privacy Enforcement
// -------------------------------------------------------------------------
console.log('\n--- SUITE 3: User Management & Privacy ---');

await runAsyncTest('3.1: User directory lists registered users with metadata', async () => {
  const result = await AdminService.getUsersList({ limit: 10 }, true);
  assert(Array.isArray(result.users), 'Users must be an array');
  assert(result.total > 0, 'Total must be > 0');
  const u = result.users[0];
  assert(u.id && u.email && u.role);
  assert(typeof u.is_active === 'boolean');
});

await runAsyncTest('3.2: User search by email and name works', async () => {
  const result = await AdminService.getUsersList({ search: 'alex' }, true);
  assert(result.users.length > 0);
  assert(result.users.every(u => u.email.includes('alex') || u.full_name.toLowerCase().includes('alex')));
});

await runAsyncTest('3.3: User status filter works (active vs deactivated)', async () => {
  const activeOnly = await AdminService.getUsersList({ status: 'active' }, true);
  assert(activeOnly.users.every(u => u.is_active === true));

  const deactivatedOnly = await AdminService.getUsersList({ status: 'deactivated' }, true);
  assert(deactivatedOnly.users.every(u => u.is_active === false));
});

await runAsyncTest('3.4: Privacy Protection: No private financial descriptions in user records', async () => {
  const result = await AdminService.getUsersList({ limit: 10 }, true);
  result.users.forEach(u => {
    assert.strictEqual(u.transactions, undefined, 'Private transactions array must NOT be exposed');
    assert.strictEqual(u.bank_statements, undefined, 'Private bank statements must NOT be exposed');
    assert.strictEqual(u.receipt_images, undefined, 'Private receipt images must NOT be exposed');
  });
});

await runAsyncTest('3.5: Admin self-deactivation is prohibited', async () => {
  let threw = false;
  try {
    await AdminService.updateUserStatus('admin-id-1', false, { id: 'admin-id-1', email: 'admin@spendwise.io' }, '127.0.0.1', true);
  } catch (err) {
    threw = true;
    assert(err.message.includes('Self-deactivation prohibited'));
  }
  assert.strictEqual(threw, true);
});

await runAsyncTest('3.6: Status toggling updates user and logs audit entry', async () => {
  const res = await AdminService.updateUserStatus('demo-user-id-002', false, DEMO_ADMIN_USER, '127.0.0.1', true);
  assert.strictEqual(res.is_active, false);

  const logs = await AdminService.getAuditLogs(true, 5);
  const found = logs.find(l => l.target_user_id === 'demo-user-id-002' && l.action === 'USER_DEACTIVATE');
  assert(found, 'Audit log entry must be created');
});

// -------------------------------------------------------------------------
// SUITE 4: System Health & Monitoring
// -------------------------------------------------------------------------
console.log('\n--- SUITE 4: System Health & Monitoring ---');

await runAsyncTest('4.1: System health reports operational statuses', async () => {
  const health = await AdminService.getSystemHealth();
  assert.strictEqual(health.status, 'healthy');
  assert(health.uptimeSeconds >= 0);
  assert(health.services.length >= 4);
  const apiService = health.services.find(s => s.name.includes('Backend API'));
  assert(apiService && apiService.status === 'operational');
});

await runAsyncTest('4.2: Security: No raw credentials exposed in system health', async () => {
  const health = await AdminService.getSystemHealth();
  const rawJson = JSON.stringify(health);
  assert(!rawJson.includes('AIzaSy'), 'Must not expose raw API keys');
  assert(!rawJson.includes('supabaseServiceKey'), 'Must not expose service keys');
});

console.log('================================================================');
console.log(`  ALL ${totalTests} ADMIN & RBAC QA TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('================================================================');

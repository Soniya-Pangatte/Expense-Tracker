/**
 * SpendWise Bank Imports Client Service
 * Handles bulk statement imports, batch history, and Supabase / local persistence.
 */

const API_BASE_URL = '/api/bank-imports';

function getAuthHeaders(session, isDemoUser) {
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

/**
 * Fetch bank import history
 */
export async function fetchBankImportHistory({ session = null, isDemoUser = false }) {
  const userId = session?.user?.id || 'demo-user';
  const headers = getAuthHeaders(session, isDemoUser);

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.imports)) {
        saveImportsListToLocalCache(userId, data.imports);
        return data.imports;
      }
    }
  } catch (err) {
    console.warn('Could not load bank imports from backend, falling back to local storage cache:', err.message);
  }

  return getImportsFromLocalCache(userId);
}

/**
 * Commit bulk imported transactions to database
 */
export async function commitBankImportBatch({
  importBatch,
  transactions,
  session = null,
  isDemoUser = false,
}) {
  const userId = session?.user?.id || 'demo-user';
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(session, isDemoUser),
  };

  const payload = {
    importBatch,
    transactions,
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to commit bank import batch.');
    }

    saveImportToLocalCache(userId, data.importRecord || importBatch);
    return data;
  } catch (err) {
    console.warn('Backend commit failed, persisting locally:', err.message);

    // Save batch to local storage
    const localBatchRecord = {
      ...importBatch,
      id: importBatch.id || `bi-${Date.now()}`,
      user_id: userId,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    saveImportToLocalCache(userId, localBatchRecord);

    return {
      success: true,
      importRecord: localBatchRecord,
      createdCount: transactions.length,
    };
  }
}

/**
 * Delete a bank import history record (without deleting ledger transactions)
 */
export async function deleteBankImportRecord({ importId, session = null, isDemoUser = false }) {
  const userId = session?.user?.id || 'demo-user';
  const headers = getAuthHeaders(session, isDemoUser);

  try {
    await fetch(`${API_BASE_URL}/${importId}`, {
      method: 'DELETE',
      headers,
    });
  } catch (err) {
    console.warn('Backend import history delete failed:', err.message);
  }

  removeImportFromLocalCache(userId, importId);
  return { success: true, importId };
}

// ==========================================
// Local Storage Cache Helpers
// ==========================================

function getImportsCacheKey(userId) {
  return `spendwise_bank_imports_${userId || 'default'}`;
}

export function getImportsFromLocalCache(userId) {
  try {
    const raw = localStorage.getItem(getImportsCacheKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveImportToLocalCache(userId, importRecord) {
  const list = getImportsFromLocalCache(userId);
  const filtered = list.filter((b) => b.id !== importRecord.id);
  const updated = [importRecord, ...filtered];
  localStorage.setItem(getImportsCacheKey(userId), JSON.stringify(updated));
}

function saveImportsListToLocalCache(userId, importsList) {
  localStorage.setItem(getImportsCacheKey(userId), JSON.stringify(importsList));
}

function removeImportFromLocalCache(userId, importId) {
  const list = getImportsFromLocalCache(userId);
  const updated = list.filter((b) => b.id !== importId);
  localStorage.setItem(getImportsCacheKey(userId), JSON.stringify(updated));
}


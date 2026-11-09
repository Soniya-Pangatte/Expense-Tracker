import express from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Apply auth to all bank import routes
router.use(requireAuth);

/**
 * GET /api/bank-imports
 * Retrieve user's previous bank import batches
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isDemo = req.isDemo;

    if (isDemo) {
      return res.json({ imports: [] });
    }

    const { data: imports, error } = await supabaseAdmin
      .from('bank_imports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bank imports:', error);
      return res.status(500).json({ error: 'Failed to retrieve bank import history.' });
    }

    return res.json({ imports: imports || [] });
  } catch (err) {
    console.error('Bank imports fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bank-imports
 * Commit a verified bank statement import batch and bulk insert transactions
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isDemo = req.isDemo;
    const { importBatch, transactions = [] } = req.body;

    if (!importBatch || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Valid import batch metadata and transaction items are required.' });
    }

    const batchId = importBatch.id || crypto.randomUUID();

    // 1. Prepare Batch Record for public.bank_imports
    const batchRecord = {
      id: batchId,
      user_id: userId,
      bank_name: importBatch.bank_name || 'Bank Statement',
      file_name: importBatch.file_name || 'statement.csv',
      file_hash: importBatch.file_hash || null,
      file_size: importBatch.file_size || null,
      total_transactions: Number(importBatch.total_transactions) || transactions.length,
      imported_transactions: Number(importBatch.imported_transactions) || transactions.length,
      duplicates_skipped: Number(importBatch.duplicates_skipped) || 0,
      currency: importBatch.currency || 'INR',
      total_debit: Number(importBatch.total_debit) || 0,
      total_credit: Number(importBatch.total_credit) || 0,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Prepare Transactions for bulk insertion into public.transactions
    const transactionRows = transactions.map((t) => ({
      user_id: userId,
      description: t.description || 'Bank Transaction',
      merchant: t.merchant || t.description || 'Bank Vendor',
      amount: Math.abs(parseFloat(t.amount)) || 0,
      currency: t.currency || importBatch.currency || 'INR',
      type: t.type === 'income' ? 'income' : 'expense',
      category_name: t.categoryName || t.category_name || (t.type === 'income' ? 'Income' : 'General'),
      category_id: t.categoryId || t.category_id || null,
      date: t.date || new Date().toISOString().split('T')[0],
      payment_method: t.paymentMethod || t.payment_method || 'Bank Transfer',
      source: 'bank',
      bank_import_id: batchId,
      reference_number: t.reference || t.reference_number || null,
      status: 'completed',
      notes: t.notes || (t.reference ? `Ref: ${t.reference}` : null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (!isDemo) {
      // Insert bank_imports record
      const { data: savedBatch, error: batchErr } = await supabaseAdmin
        .from('bank_imports')
        .insert(batchRecord)
        .select()
        .single();

      if (batchErr) {
        console.error('Failed to create bank_imports record:', batchErr);
        return res.status(500).json({ error: 'Failed to create import batch record.', details: batchErr.message });
      }

      // Bulk insert transactions
      const { data: savedTransactions, error: txErr } = await supabaseAdmin
        .from('transactions')
        .insert(transactionRows)
        .select();

      if (txErr) {
        console.error('Bulk transaction insert failed:', txErr);
        return res.status(500).json({ error: 'Failed to bulk-insert transactions.', details: txErr.message });
      }

      return res.json({
        success: true,
        importRecord: savedBatch,
        createdTransactions: savedTransactions,
        createdCount: savedTransactions?.length || 0,
      });
    }

    // Demo user response
    return res.json({
      success: true,
      importRecord: batchRecord,
      createdTransactions: transactionRows.map((t, idx) => ({ ...t, id: `demo-tx-import-${Date.now()}-${idx}` })),
      createdCount: transactionRows.length,
    });
  } catch (err) {
    console.error('Bank import commit error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * DELETE /api/bank-imports/:id
 * Delete a bank import history record without deleting ledger transactions
 */
router.delete('/:id', async (req, res) => {
  try {
    const importId = req.params.id;
    const userId = req.user.id;
    const isDemo = req.isDemo;

    if (!isDemo) {
      // Unlink transactions first so they are never deleted
      await supabaseAdmin
        .from('transactions')
        .update({ bank_import_id: null })
        .eq('bank_import_id', importId)
        .eq('user_id', userId);

      const { error } = await supabaseAdmin
        .from('bank_imports')
        .delete()
        .eq('id', importId)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete import history record.' });
      }
    }

    return res.json({ success: true, importId });
  } catch (err) {
    console.error('Delete bank import error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


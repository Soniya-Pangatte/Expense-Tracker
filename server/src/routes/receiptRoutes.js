import express from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { ReceiptOCRService } from '../services/receiptOCRService.js';
import { supabaseAdmin, createScopedClient } from '../config/supabase.js';

const router = express.Router();

// Apply auth to all receipt routes
router.use(requireAuth);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/receipts/scan
 * Upload and run OCR on a receipt
 */
router.post('/scan', async (req, res) => {
  try {
    const {
      fileData, // base64 string
      fileName = 'receipt.jpg',
      fileType = 'image/jpeg',
      fileSize = 0,
      fileHash: clientHash,
      currency = 'INR',
      availableCategories = [],
      forceProcess = false,
    } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'Receipt file data is required (base64).' });
    }

    // 1. Validate MIME type
    const normalizedMime = fileType.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      return res.status(400).json({
        error: `Unsupported file type: ${fileType}. Please upload JPG, PNG, WEBP, or PDF.`,
      });
    }

    // 2. Validate File Size
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File size exceeds the 10 MB limit. (Received ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`,
      });
    }

    // 3. Compute file hash for deduplication
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const computedHash = clientHash || crypto.createHash('sha256').update(buffer).digest('hex');

    const userId = req.user.id;
    const isDemo = req.isDemo;

    // 4. Duplicate Check against confirmed user receipts
    if (!isDemo && !forceProcess) {
      const { data: existingReceipts, error: dupCheckErr } = await supabaseAdmin
        .from('receipt_uploads')
        .select('id, file_name, merchant_name, total_amount, receipt_date, status, created_at, transaction_id')
        .eq('user_id', userId)
        .eq('file_hash', computedHash)
        .limit(1);

      if (!dupCheckErr && existingReceipts && existingReceipts.length > 0) {
        const existing = existingReceipts[0];
        return res.status(409).json({
          isDuplicate: true,
          message: `This receipt appears to have already been uploaded (${existing.merchant_name || 'Receipt'} on ${existing.receipt_date || 'earlier date'}).`,
          existingReceipt: existing,
        });
      }
    }

    // 5. Run OCR Engine (Gemini Vision or Deterministic Fallback)
    const extracted = await ReceiptOCRService.extractReceiptData({
      base64Data: cleanBase64,
      mimeType: normalizedMime,
      fileName,
      currency,
      availableCategories,
    });

    const receiptId = crypto.randomUUID();
    const ext = fileName.split('.').pop() || 'jpg';
    const storagePath = `${userId}/${receiptId}.${ext}`;

    let previewUrl = fileData.startsWith('data:') ? fileData : `data:${normalizedMime};base64,${cleanBase64}`;

    // 6. Upload to Supabase Storage if configured and not demo
    if (!isDemo) {
      try {
        const { error: storageErr } = await supabaseAdmin.storage
          .from('receipts')
          .upload(storagePath, buffer, {
            contentType: normalizedMime,
            upsert: false,
          });

        if (!storageErr) {
          // Generate 1-hour signed URL for private preview
          const { data: signedData } = await supabaseAdmin.storage
            .from('receipts')
            .createSignedUrl(storagePath, 3600);

          if (signedData?.signedUrl) {
            previewUrl = signedData.signedUrl;
          }
        }
      } catch (storageException) {
        console.warn('Supabase storage upload skipped or failed:', storageException.message);
      }
    }

    // 7. Save Record to Database (public.receipt_uploads)
    const receiptRecord = {
      id: receiptId,
      user_id: userId,
      image_url: previewUrl,
      storage_path: storagePath,
      file_name: fileName,
      file_hash: computedHash,
      file_size: fileSize || buffer.length,
      mime_type: normalizedMime,
      merchant_name: extracted.merchant,
      receipt_date: extracted.date,
      receipt_time: extracted.time,
      total_amount: extracted.totalAmount,
      currency: extracted.currency || currency,
      subtotal: extracted.subtotal,
      tax_amount: extracted.taxAmount,
      discount_amount: extracted.discount,
      payment_method: extracted.paymentMethod || 'UPI',
      suggested_category: extracted.suggestedCategory || 'Groceries & Food',
      items: extracted.items || [],
      raw_text: extracted.rawText || '',
      extracted_data: extracted,
      status: 'review_required',
      created_at: new Date().toISOString(),
    };

    if (!isDemo) {
      const { data: savedDbRecord, error: dbErr } = await supabaseAdmin
        .from('receipt_uploads')
        .insert(receiptRecord)
        .select()
        .single();

      if (dbErr) {
        console.error('Failed to save receipt record to database:', dbErr);
      }
    }

    return res.json({
      success: true,
      receipt: receiptRecord,
      extracted,
      isDuplicate: false,
    });
  } catch (err) {
    console.error('Receipt scan error:', err);
    return res.status(500).json({
      error: 'Failed to process receipt',
      details: err.message,
    });
  }
});

/**
 * GET /api/receipts
 * Fetch receipt history for authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isDemo = req.isDemo;

    if (isDemo) {
      // Demo receipts
      return res.json({ receipts: [] });
    }

    const { data: receipts, error } = await supabaseAdmin
      .from('receipt_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      return res.status(500).json({ error: 'Failed to load receipt history.' });
    }

    // Regenerate fresh signed URLs for private previews
    const receiptsWithSignedUrls = await Promise.all(
      (receipts || []).map(async (r) => {
        if (r.storage_path) {
          try {
            const { data: signedData } = await supabaseAdmin.storage
              .from('receipts')
              .createSignedUrl(r.storage_path, 3600);
            if (signedData?.signedUrl) {
              return { ...r, image_url: signedData.signedUrl };
            }
          } catch (e) {
            // Keep existing image_url if signed URL generation fails
          }
        }
        return r;
      })
    );

    return res.json({ receipts: receiptsWithSignedUrls });
  } catch (err) {
    console.error('Receipts list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/receipts/:id/confirm
 * User explicitly confirms OCR review -> creates transaction and marks receipt confirmed
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const userId = req.user.id;
    const isDemo = req.isDemo;

    const {
      merchant,
      amount,
      currency = 'INR',
      categoryName,
      categoryId = null,
      date,
      paymentMethod = 'UPI',
      notes = '',
      subtotal = null,
      taxAmount = null,
      items = [],
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'A positive expense amount is required.' });
    }

    const txDate = date || new Date().toISOString().split('T')[0];
    const txMerchant = merchant ? merchant.trim() : 'Scanned Store';
    const txCategory = categoryName || 'Groceries & Food';

    // 1. Create Transaction in public.transactions
    const transactionPayload = {
      user_id: userId,
      description: `${txMerchant} (Receipt)`,
      merchant: txMerchant,
      amount: parsedAmount,
      currency,
      type: 'expense',
      category_name: txCategory,
      category_id: categoryId || null,
      date: txDate,
      payment_method: paymentMethod || 'UPI',
      source: 'receipt',
      receipt_id: receiptId,
      status: 'completed',
      notes: notes ? notes.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let createdTransaction = null;

    if (!isDemo) {
      const { data: txData, error: txError } = await supabaseAdmin
        .from('transactions')
        .insert(transactionPayload)
        .select()
        .single();

      if (txError) {
        console.error('Transaction creation from receipt failed:', txError);
        return res.status(500).json({
          error: 'Failed to record expense transaction in database.',
          details: txError.message,
        });
      }

      createdTransaction = txData;

      // 2. Update receipt_uploads to status 'confirmed'
      await supabaseAdmin
        .from('receipt_uploads')
        .update({
          status: 'confirmed',
          transaction_id: createdTransaction.id,
          merchant_name: txMerchant,
          total_amount: parsedAmount,
          currency,
          receipt_date: txDate,
          payment_method: paymentMethod,
          suggested_category: txCategory,
          subtotal: subtotal !== null ? Number(subtotal) : null,
          tax_amount: taxAmount !== null ? Number(taxAmount) : null,
          items: items || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId)
        .eq('user_id', userId);
    } else {
      createdTransaction = {
        ...transactionPayload,
        id: `tx-rec-${Date.now()}`,
      };
    }

    return res.json({
      success: true,
      transaction: createdTransaction,
      receiptId,
    });
  } catch (err) {
    console.error('Receipt confirm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/receipts/:id
 * Delete a receipt and its storage file
 */
router.delete('/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const userId = req.user.id;
    const isDemo = req.isDemo;

    if (!isDemo) {
      // Find storage path
      const { data: receipt } = await supabaseAdmin
        .from('receipt_uploads')
        .select('storage_path')
        .eq('id', receiptId)
        .eq('user_id', userId)
        .single();

      if (receipt?.storage_path) {
        try {
          await supabaseAdmin.storage.from('receipts').remove([receipt.storage_path]);
        } catch (e) {
          console.warn('Storage file removal skipped:', e.message);
        }
      }

      const { error } = await supabaseAdmin
        .from('receipt_uploads')
        .delete()
        .eq('id', receiptId)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete receipt.' });
      }
    }

    return res.json({ success: true, receiptId });
  } catch (err) {
    console.error('Delete receipt error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


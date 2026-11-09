import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { initialTransactions, initialCategories, initialBudgets, initialRecurring } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useCurrency } from './CurrencyContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const { user, isDemoUser } = useAuth();
  const { currency, convertAmount } = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [monthlyBudgetsList, setMonthlyBudgetsList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Active selected budget month (defaults to current month "YYYY-MM")
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(currentMonthKey);

  // Normalize category budget
  const normalizeBudget = useCallback((b) => ({
    id: b.id,
    userId: b.user_id,
    user_id: b.user_id,
    categoryId: b.category_id,
    category_id: b.category_id,
    categoryName: b.category_name || b.categoryName || 'General',
    category_name: b.category_name || b.categoryName || 'General',
    limitAmount: Number(b.limit_amount !== undefined ? b.limit_amount : b.limit !== undefined ? b.limit : 0),
    limit_amount: Number(b.limit_amount !== undefined ? b.limit_amount : b.limit !== undefined ? b.limit : 0),
    limit: Number(b.limit_amount !== undefined ? b.limit_amount : b.limit !== undefined ? b.limit : 0),
    currency: b.currency || 'INR',
    period: b.period || 'monthly',
    color: b.color || '#447F98',
    description: b.description || '',
  }), []);

  // Normalize recurring expense
  const normalizeRecurring = useCallback((rec) => ({
    id: rec.id,
    userId: rec.user_id,
    user_id: rec.user_id,
    name: rec.name,
    amount: Number(rec.amount || 0),
    currency: rec.currency || 'INR',
    frequency: rec.frequency || 'Monthly',
    dueDate: rec.due_date || rec.dueDate || '1st of month',
    due_date: rec.due_date || rec.dueDate || '1st of month',
    category: rec.category || 'General',
    paymentMethod: rec.payment_method || rec.paymentMethod || 'UPI',
    payment_method: rec.payment_method || rec.paymentMethod || 'UPI',
    startDate: rec.start_date || rec.startDate || new Date().toISOString().split('T')[0],
    start_date: rec.start_date || rec.startDate || new Date().toISOString().split('T')[0],
    notes: rec.notes || '',
    description: rec.description || '',
    status: rec.status || 'Active',
  }), []);

  // Persist user-specific caches
  const persistUserTransactions = (newTransactionsList) => {
    if (!user || user.isDemo) return;
    localStorage.setItem(`spendwise_transactions_${user.id}`, JSON.stringify(newTransactionsList));
  };

  const persistUserBudgets = (budgetsList) => {
    if (!user || user.isDemo) return;
    localStorage.setItem(`spendwise_budgets_${user.id}`, JSON.stringify(budgetsList));
  };

  const persistUserRecurring = (recurringList) => {
    if (!user || user.isDemo) return;
    localStorage.setItem(`spendwise_recurring_${user.id}`, JSON.stringify(recurringList));
  };

  const persistUserMonthlyBudgets = (monthlyList) => {
    if (!user || user.isDemo) return;
    localStorage.setItem(`spendwise_monthly_budgets_${user.id}`, JSON.stringify(monthlyList));
  };

  // Sync data whenever the authenticated user changes
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setRecurringExpenses([]);
      setBudgets([]);
      setMonthlyBudgetsList([]);
      return;
    }

    // 1. Demo User: use demo financial dataset with preset demo monthly budget
    if (user.isDemo || isDemoUser) {
      const demoTxs = initialTransactions.map((tx) => ({
        ...tx,
        currency: tx.currency || 'INR',
      }));
      setTransactions(demoTxs);
      setCategories(initialCategories);
      setBudgets(initialBudgets.map(normalizeBudget));
      setRecurringExpenses(initialRecurring.map(normalizeRecurring));
      setMonthlyBudgetsList([
        {
          id: 'demo-mb-current',
          user_id: user.id || 'demo-user-id',
          name: 'Main Monthly Budget',
          month_year: currentMonthKey,
          amount: 50000,
          currency: 'INR',
          description: 'Demo monthly spending cap',
        },
      ]);
      return;
    }

    // 2. Real Registered User: Load isolated, user-specific records
    const loadUserFinancialData = async () => {
      setLoadingData(true);
      try {
        const userStorageKey = `spendwise_transactions_${user.id}`;
        const userBudgetsKey = `spendwise_budgets_${user.id}`;
        const userRecurringKey = `spendwise_recurring_${user.id}`;
        const userMonthlyBudgetsKey = `spendwise_monthly_budgets_${user.id}`;

        if (isSupabaseConfigured) {
          // A. Load Transactions (RLS filters by auth.uid())
          const { data: dbTransactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

          if (!txError && dbTransactions) {
            // Normalize database columns into frontend-friendly model
            const normalizedTxs = dbTransactions.map((tx) => {
              let resolvedCurrency = tx.currency;
              let resolvedNotes = tx.notes || '';
              if (!resolvedCurrency || resolvedCurrency === 'INR') {
                const noteMatch = tx.notes?.match(/^Currency:\s*([A-Z]{3})/i);
                if (noteMatch) {
                  resolvedCurrency = noteMatch[1].toUpperCase();
                  resolvedNotes = tx.notes.replace(/^Currency:\s*[A-Z]{3}\s*;?\s*/i, '').trim();
                }
              }

              return {
                ...tx,
                id: tx.id,
                userId: tx.user_id,
                user_id: tx.user_id,
                currency: resolvedCurrency || 'INR',
                categoryId: tx.category_id,
                category_id: tx.category_id,
                categoryName: tx.category_name || 'General',
                category_name: tx.category_name || 'General',
                paymentMethod: tx.payment_method || 'UPI',
                payment_method: tx.payment_method || 'UPI',
                source: tx.source || 'manual',
                notes: resolvedNotes || null,
              };
            });
            setTransactions(normalizedTxs);
            persistUserTransactions(normalizedTxs);
          } else {
            if (txError) console.warn('Error loading transactions from Supabase:', txError.message);
            const cached = localStorage.getItem(userStorageKey);
            setTransactions(cached ? JSON.parse(cached) : []);
          }

          // B. Load Categories from database (System & User categories)
          const { data: dbCategories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

          if (!catError && dbCategories && dbCategories.length > 0) {
            const mappedCategories = dbCategories.map((c) => ({
              id: c.id,
              name: c.name,
              color: c.color || '#526C78',
              icon: c.icon || 'Tag',
              isIncome: Boolean(c.is_income),
              is_income: Boolean(c.is_income),
              isSystem: Boolean(c.is_system),
              is_system: Boolean(c.is_system),
            }));
            setCategories(mappedCategories);
          } else {
            setCategories(initialCategories);
          }

          // C. Load All Monthly Budgets for user
          const { data: dbMonthlyBudgets, error: mbError } = await supabase
            .from('monthly_budgets')
            .select('*')
            .eq('user_id', user.id);

          if (!mbError && dbMonthlyBudgets) {
            setMonthlyBudgetsList(dbMonthlyBudgets);
            persistUserMonthlyBudgets(dbMonthlyBudgets);
          } else {
            const cachedMB = localStorage.getItem(userMonthlyBudgetsKey);
            setMonthlyBudgetsList(cachedMB ? JSON.parse(cachedMB) : []);
          }

          // D. Load Category Budgets
          const { data: dbBudgets, error: bError } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id);

          if (!bError && dbBudgets) {
            const normalized = dbBudgets.map(normalizeBudget);
            setBudgets(normalized);
            persistUserBudgets(normalized);
          } else {
            const cachedB = localStorage.getItem(userBudgetsKey);
            setBudgets(cachedB ? JSON.parse(cachedB).map(normalizeBudget) : []);
          }

          // E. Load Recurring Expenses
          const { data: dbRecurring, error: recError } = await supabase
            .from('recurring_expenses')
            .select('*')
            .eq('user_id', user.id);

          if (!recError && dbRecurring) {
            const normalizedRec = dbRecurring.map(normalizeRecurring);
            setRecurringExpenses(normalizedRec);
            persistUserRecurring(normalizedRec);
          } else {
            const cachedRec = localStorage.getItem(userRecurringKey);
            setRecurringExpenses(cachedRec ? JSON.parse(cachedRec).map(normalizeRecurring) : []);
          }
        } else {
          // Local storage fallback
          const cached = localStorage.getItem(userStorageKey);
          setTransactions(cached ? JSON.parse(cached) : []);
          const cachedMB = localStorage.getItem(userMonthlyBudgetsKey);
          setMonthlyBudgetsList(cachedMB ? JSON.parse(cachedMB) : []);
          const cachedB = localStorage.getItem(userBudgetsKey);
          setBudgets(cachedB ? JSON.parse(cachedB).map(normalizeBudget) : []);
          const cachedRec = localStorage.getItem(userRecurringKey);
          setRecurringExpenses(cachedRec ? JSON.parse(cachedRec).map(normalizeRecurring) : []);
        }
      } catch (err) {
        console.warn('Error loading user financial data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserFinancialData();
  }, [user, isDemoUser, currentMonthKey, normalizeBudget, normalizeRecurring]);

  // Active Monthly Budget record for the currently selected month
  const activeMonthlyBudgetRecord = useMemo(() => {
    return monthlyBudgetsList.find((b) => b.month_year === selectedBudgetMonth) || null;
  }, [monthlyBudgetsList, selectedBudgetMonth]);

  const monthlyBudget = activeMonthlyBudgetRecord ? Number(activeMonthlyBudgetRecord.amount) : null;
  const monthlyBudgetCurrency = activeMonthlyBudgetRecord?.currency || currency;

  // Create or Update Monthly Budget
  const updateMonthlyBudget = async (
    amount,
    budgetCurrency = currency,
    monthKey = selectedBudgetMonth,
    name = 'Monthly Budget',
    description = ''
  ) => {
    const num = Number(amount) || 0;
    const payload = {
      user_id: user?.id,
      month_year: monthKey,
      amount: num,
      currency: budgetCurrency,
      name: name || 'Monthly Budget',
      description: description || null,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user && !user.isDemo) {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert(payload, { onConflict: 'user_id,month_year' })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert monthly_budgets in Supabase:', error.message);
        throw new Error(error.message || 'Failed to update monthly budget.');
      }

      setMonthlyBudgetsList((prev) => {
        const idx = prev.findIndex((b) => b.month_year === monthKey);
        let updated;
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = data || payload;
        } else {
          updated = [...prev, data || payload];
        }
        persistUserMonthlyBudgets(updated);
        return updated;
      });
      return data || payload;
    } else {
      // Local / Demo mode
      setMonthlyBudgetsList((prev) => {
        const idx = prev.findIndex((b) => b.month_year === monthKey);
        let updated;
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = { ...prev[idx], ...payload };
        } else {
          updated = [...prev, { ...payload, id: `mb-${Date.now()}` }];
        }
        persistUserMonthlyBudgets(updated);
        return updated;
      });
      return payload;
    }
  };

  // Delete Monthly Budget
  const deleteMonthlyBudget = async (monthKey = selectedBudgetMonth) => {
    if (isSupabaseConfigured && user && !user.isDemo) {
      const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('month_year', monthKey);

      if (error) {
        console.error('Failed to delete monthly budget:', error);
        throw new Error(error.message || 'Failed to delete monthly budget.');
      }
    }

    setMonthlyBudgetsList((prev) => {
      const updated = prev.filter((b) => b.month_year !== monthKey);
      persistUserMonthlyBudgets(updated);
      return updated;
    });
  };

  // Add Category Budget Limit
  const addCategoryBudget = async (budgetData) => {
    const catName = budgetData.categoryName || budgetData.category_name;
    const limitAmt = parseFloat(budgetData.limitAmount ?? budgetData.limit ?? 0);
    const budgetCurr = budgetData.currency || currency || 'INR';
    const period = budgetData.period || 'monthly';
    const color = budgetData.color || '#447F98';
    const desc = budgetData.description || null;
    const catId = budgetData.categoryId || budgetData.category_id || null;
    const isValidUUID = typeof catId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);

    if (!catName || limitAmt <= 0) {
      throw new Error('Please specify a valid category and a limit amount greater than zero.');
    }

    const existing = budgets.find(
      (b) => (b.categoryName || b.category_name)?.toLowerCase() === catName.toLowerCase()
    );
    if (existing) {
      throw new Error(`A spending limit for "${catName}" already exists. You can edit the existing limit instead.`);
    }

    if (isSupabaseConfigured && user && !user.isDemo) {
      const payload = {
        user_id: user.id,
        category_name: catName,
        category_id: isValidUUID ? catId : null,
        limit_amount: limitAmt,
        currency: budgetCurr,
        period,
        color,
        description: desc,
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase budget insert failed:', error);
        throw new Error(error.message || 'Failed to save category budget.');
      }

      const normalized = normalizeBudget(data);
      setBudgets((prev) => {
        const updated = [normalized, ...prev];
        persistUserBudgets(updated);
        return updated;
      });
      return normalized;
    } else {
      const local = normalizeBudget({
        id: `budget-${Date.now()}`,
        user_id: user?.id,
        category_name: catName,
        category_id: catId,
        limit_amount: limitAmt,
        currency: budgetCurr,
        period,
        color,
        description: desc,
      });
      setBudgets((prev) => {
        const updated = [local, ...prev];
        persistUserBudgets(updated);
        return updated;
      });
      return local;
    }
  };

  // Update Category Budget Limit
  const updateCategoryBudget = async (id, updatedData) => {
    const dbPayload = {};
    if (updatedData.limitAmount !== undefined || updatedData.limit_amount !== undefined || updatedData.limit !== undefined) {
      dbPayload.limit_amount = parseFloat(updatedData.limitAmount ?? updatedData.limit_amount ?? updatedData.limit);
    }
    if (updatedData.currency !== undefined) dbPayload.currency = updatedData.currency;
    if (updatedData.period !== undefined) dbPayload.period = updatedData.period;
    if (updatedData.color !== undefined) dbPayload.color = updatedData.color;
    if (updatedData.description !== undefined) dbPayload.description = updatedData.description;
    if (updatedData.categoryName !== undefined || updatedData.category_name !== undefined) {
      dbPayload.category_name = updatedData.categoryName || updatedData.category_name;
    }

    if (isSupabaseConfigured && user && !user.isDemo) {
      const { data, error } = await supabase
        .from('budgets')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase budget update failed:', error);
        throw new Error(error.message || 'Failed to update category budget.');
      }

      const normalized = normalizeBudget(data);
      setBudgets((prev) => {
        const updated = prev.map((b) => (b.id === id ? normalized : b));
        persistUserBudgets(updated);
        return updated;
      });
      return normalized;
    } else {
      let res = null;
      setBudgets((prev) => {
        const updated = prev.map((b) => {
          if (b.id === id) {
            res = normalizeBudget({ ...b, ...updatedData, limit_amount: dbPayload.limit_amount ?? b.limit_amount });
            return res;
          }
          return b;
        });
        persistUserBudgets(updated);
        return updated;
      });
      return res;
    }
  };

  // Delete Category Budget Limit
  const deleteCategoryBudget = async (id) => {
    if (isSupabaseConfigured && user && !user.isDemo) {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase budget delete failed:', error);
        throw new Error(error.message || 'Failed to delete category budget.');
      }
    }

    setBudgets((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      persistUserBudgets(updated);
      return updated;
    });
  };

  // Add Recurring Expense
  const addRecurringExpense = async (recData) => {
    const name = recData.name || recData.title;
    const amt = parseFloat(recData.amount || 0);
    const recCurrency = recData.currency || currency || 'INR';
    const category = recData.category || 'General';
    const frequency = recData.frequency || 'Monthly';
    const dueDate = recData.dueDate || recData.due_date || '1st of month';
    const paymentMethod = recData.paymentMethod || recData.payment_method || 'UPI';
    const startDate = recData.startDate || recData.start_date || new Date().toISOString().split('T')[0];
    const notes = recData.notes ? recData.notes.trim() : null;
    const status = recData.status || 'Active';

    if (!name || amt <= 0) {
      throw new Error('Please provide a valid bill title and an amount greater than zero.');
    }

    if (isSupabaseConfigured && user && !user.isDemo) {
      const payload = {
        user_id: user.id,
        name,
        amount: amt,
        currency: recCurrency,
        category,
        frequency,
        due_date: dueDate,
        payment_method: paymentMethod,
        start_date: startDate,
        notes,
        status,
      };

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase recurring expense insert failed:', error);
        throw new Error(error.message || 'Failed to add recurring expense.');
      }

      const normalized = normalizeRecurring(data);
      setRecurringExpenses((prev) => {
        const updated = [normalized, ...prev];
        persistUserRecurring(updated);
        return updated;
      });
      return normalized;
    } else {
      const local = normalizeRecurring({
        id: `rec-${Date.now()}`,
        user_id: user?.id,
        name,
        amount: amt,
        currency: recCurrency,
        category,
        frequency,
        due_date: dueDate,
        payment_method: paymentMethod,
        start_date: startDate,
        notes,
        status,
      });
      setRecurringExpenses((prev) => {
        const updated = [local, ...prev];
        persistUserRecurring(updated);
        return updated;
      });
      return local;
    }
  };

  // Edit Recurring Expense
  const updateRecurringExpense = async (id, updatedData) => {
    const dbPayload = {};
    if (updatedData.name !== undefined) dbPayload.name = updatedData.name;
    if (updatedData.amount !== undefined) dbPayload.amount = parseFloat(updatedData.amount);
    if (updatedData.currency !== undefined) dbPayload.currency = updatedData.currency;
    if (updatedData.category !== undefined) dbPayload.category = updatedData.category;
    if (updatedData.frequency !== undefined) dbPayload.frequency = updatedData.frequency;
    if (updatedData.dueDate !== undefined || updatedData.due_date !== undefined) {
      dbPayload.due_date = updatedData.dueDate || updatedData.due_date;
    }
    if (updatedData.paymentMethod !== undefined || updatedData.payment_method !== undefined) {
      dbPayload.payment_method = updatedData.paymentMethod || updatedData.payment_method;
    }
    if (updatedData.startDate !== undefined || updatedData.start_date !== undefined) {
      dbPayload.start_date = updatedData.startDate || updatedData.start_date;
    }
    if (updatedData.notes !== undefined) dbPayload.notes = updatedData.notes;
    if (updatedData.status !== undefined) dbPayload.status = updatedData.status;

    if (isSupabaseConfigured && user && !user.isDemo) {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase recurring expense update failed:', error);
        throw new Error(error.message || 'Failed to update recurring expense.');
      }

      const normalized = normalizeRecurring(data);
      setRecurringExpenses((prev) => {
        const updated = prev.map((r) => (r.id === id ? normalized : r));
        persistUserRecurring(updated);
        return updated;
      });
      return normalized;
    } else {
      let res = null;
      setRecurringExpenses((prev) => {
        const updated = prev.map((r) => {
          if (r.id === id) {
            res = normalizeRecurring({ ...r, ...updatedData, ...dbPayload });
            return res;
          }
          return r;
        });
        persistUserRecurring(updated);
        return updated;
      });
      return res;
    }
  };

  // Toggle status between Active and Paused
  const toggleRecurringExpenseStatus = async (id) => {
    const existing = recurringExpenses.find((r) => r.id === id);
    if (!existing) return;
    const nextStatus = existing.status === 'Active' ? 'Paused' : 'Active';
    return await updateRecurringExpense(id, { status: nextStatus });
  };

  // Delete Recurring Expense
  const deleteRecurringExpense = async (id) => {
    if (isSupabaseConfigured && user && !user.isDemo) {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase recurring expense delete failed:', error);
        throw new Error(error.message || 'Failed to delete recurring expense.');
      }
    }

    setRecurringExpenses((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistUserRecurring(updated);
      return updated;
    });
  };

  // Add new transaction with canonical UUID, correct currency column and category persistence
  const addTransaction = async (transactionData) => {
    const txCurrency = transactionData.currency || currency || 'INR';
    const txAmount = parseFloat(transactionData.amount) || 0;
    const txDate = transactionData.date || new Date().toISOString().split('T')[0];
    const txMethod = transactionData.paymentMethod || transactionData.payment_method || 'Credit Card (Visa)';
    const txSource = transactionData.source || 'manual';
    const txNotes = transactionData.notes ? transactionData.notes.trim() : null;
    const catName = transactionData.categoryName || transactionData.category_name || 'General';
    const catId = transactionData.categoryId || transactionData.category_id;
    const isValidUUID = typeof catId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);

    if (isSupabaseConfigured && user && !user.isDemo) {
      const payload = {
        user_id: user.id,
        description: transactionData.description,
        merchant: transactionData.merchant || transactionData.description,
        amount: txAmount,
        currency: txCurrency, // <--- Correct currency column
        type: transactionData.type || 'expense',
        category_id: isValidUUID ? catId : null,
        category_name: catName, // <--- Category name persisted
        date: txDate,
        payment_method: txMethod,
        source: txSource,
        notes: txNotes, // <--- Preserves clean user notes
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase transaction insert failed:', error);
        throw new Error(error.message || 'Failed to record transaction in database.');
      }

      if (!data) {
        throw new Error('Database did not return the recorded transaction.');
      }

      const savedTx = {
        ...data,
        id: data.id, // Canonical database-generated UUID
        userId: data.user_id,
        user_id: data.user_id,
        currency: data.currency || txCurrency,
        categoryId: data.category_id,
        category_id: data.category_id,
        categoryName: data.category_name || catName,
        category_name: data.category_name || catName,
        paymentMethod: data.payment_method || txMethod,
        payment_method: data.payment_method || txMethod,
        source: data.source || txSource,
        notes: data.notes || txNotes,
      };

      setTransactions((prev) => {
        const updated = [savedTx, ...prev];
        persistUserTransactions(updated);
        return updated;
      });

      return savedTx;
    } else {
      // Local / Demo mode fallback
      const localId = `tx-${Date.now()}`;
      const localTx = {
        ...transactionData,
        id: localId,
        userId: user?.id || 'demo-user-id-001',
        user_id: user?.id || 'demo-user-id-001',
        amount: txAmount,
        currency: txCurrency,
        type: transactionData.type || 'expense',
        categoryId: catId || 'cat-1',
        category_id: catId || 'cat-1',
        categoryName: catName,
        category_name: catName,
        date: txDate,
        paymentMethod: txMethod,
        payment_method: txMethod,
        source: txSource,
        notes: txNotes,
      };

      setTransactions((prev) => {
        const updated = [localTx, ...prev];
        persistUserTransactions(updated);
        return updated;
      });

      return localTx;
    }
  };

  // Bulk add transactions (used by Bank Statement Import & Data feeds)
  const addTransactionsBulk = useCallback((newTransactions) => {
    if (!Array.isArray(newTransactions) || newTransactions.length === 0) return [];

    const normalizedList = newTransactions.map((tx) => ({
      ...tx,
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: tx.user_id || tx.userId || user?.id,
      user_id: tx.user_id || tx.userId || user?.id,
      amount: Number(tx.amount || 0),
      currency: tx.currency || 'INR',
      categoryId: tx.category_id || tx.categoryId,
      category_id: tx.category_id || tx.categoryId,
      categoryName: tx.category_name || tx.categoryName || 'General',
      category_name: tx.category_name || tx.categoryName || 'General',
      paymentMethod: tx.payment_method || tx.paymentMethod || 'Bank Transfer',
      payment_method: tx.payment_method || tx.paymentMethod || 'Bank Transfer',
      source: tx.source || 'bank',
      bankImportId: tx.bank_import_id || tx.bankImportId || null,
      bank_import_id: tx.bank_import_id || tx.bankImportId || null,
      referenceNumber: tx.reference_number || tx.referenceNumber || null,
      reference_number: tx.reference_number || tx.referenceNumber || null,
      notes: tx.notes || null,
      date: tx.date || new Date().toISOString().split('T')[0],
      type: tx.type === 'income' ? 'income' : 'expense',
      description: tx.description || 'Imported Transaction',
      merchant: tx.merchant || tx.description || 'Bank Vendor',
    }));

    setTransactions((prev) => {
      const combined = [...normalizedList, ...prev];
      persistUserTransactions(combined);
      return combined;
    });

    return normalizedList;
  }, [user]);

  // Edit transaction
  const editTransaction = async (id, updatedData) => {
    // Map camelCase fields to snake_case DB columns
    const dbUpdatePayload = {};
    if (updatedData.description !== undefined) dbUpdatePayload.description = updatedData.description;
    if (updatedData.merchant !== undefined) dbUpdatePayload.merchant = updatedData.merchant;
    if (updatedData.amount !== undefined) dbUpdatePayload.amount = parseFloat(updatedData.amount);
    if (updatedData.currency !== undefined) dbUpdatePayload.currency = updatedData.currency;
    if (updatedData.type !== undefined) dbUpdatePayload.type = updatedData.type;
    if (updatedData.date !== undefined) dbUpdatePayload.date = updatedData.date;
    if (updatedData.notes !== undefined) dbUpdatePayload.notes = updatedData.notes;
    if (updatedData.source !== undefined) dbUpdatePayload.source = updatedData.source;
    if (updatedData.paymentMethod !== undefined || updatedData.payment_method !== undefined) {
      dbUpdatePayload.payment_method = updatedData.paymentMethod || updatedData.payment_method;
    }
    if (updatedData.categoryName !== undefined || updatedData.category_name !== undefined) {
      dbUpdatePayload.category_name = updatedData.categoryName || updatedData.category_name;
    }
    const catId = updatedData.categoryId || updatedData.category_id;
    if (catId !== undefined) {
      const isValid = typeof catId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
      dbUpdatePayload.category_id = isValid ? catId : null;
    }

    if (isSupabaseConfigured && user && !user.isDemo) {
      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase transaction update failed:', error);
        throw new Error(error.message || 'Failed to update transaction.');
      }

      const normalizedUpdated = {
        ...data,
        id: data.id,
        userId: data.user_id,
        user_id: data.user_id,
        amount: Number(data.amount),
        currency: data.currency || updatedData.currency || 'INR',
        categoryId: data.category_id,
        category_id: data.category_id,
        categoryName: data.category_name || updatedData.categoryName,
        category_name: data.category_name || updatedData.categoryName,
        paymentMethod: data.payment_method || updatedData.paymentMethod,
        payment_method: data.payment_method || updatedData.paymentMethod,
        source: data.source,
        notes: data.notes,
        date: data.date,
        type: data.type,
        description: data.description,
        merchant: data.merchant,
      };

      setTransactions((prev) => {
        const updated = prev.map((tx) => (tx.id === id ? normalizedUpdated : tx));
        persistUserTransactions(updated);
        return updated;
      });

      return normalizedUpdated;
    } else {
      let updatedLocalTx = null;
      setTransactions((prev) => {
        const updated = prev.map((tx) => {
          if (tx.id === id) {
            updatedLocalTx = {
              ...tx,
              ...updatedData,
              amount: updatedData.amount !== undefined ? Number(updatedData.amount) : tx.amount,
              categoryName: updatedData.categoryName || updatedData.category_name || tx.categoryName,
              category_name: updatedData.categoryName || updatedData.category_name || tx.category_name,
              paymentMethod: updatedData.paymentMethod || updatedData.payment_method || tx.paymentMethod,
              payment_method: updatedData.paymentMethod || updatedData.payment_method || tx.payment_method,
            };
            return updatedLocalTx;
          }
          return tx;
        });
        persistUserTransactions(updated);
        return updated;
      });
      return updatedLocalTx;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id) => {
    if (isSupabaseConfigured && user && !user.isDemo) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase transaction delete failed:', error);
        throw new Error(error.message || 'Failed to delete transaction.');
      }
    }

    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      persistUserTransactions(updated);
      return updated;
    });
  };

  // Populate sample data for newly registered user if requested
  const loadStarterSampleData = () => {
    const starterWithUserId = initialTransactions.map((tx) => ({
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user?.id,
      user_id: user?.id,
      currency: 'INR',
    }));
    setTransactions(starterWithUserId);
    persistUserTransactions(starterWithUserId);
    updateMonthlyBudget(50000, 'INR');
  };

  // Calculate dynamic statistics with multi-currency conversion, accurate monthly budget, category tracking & alerts
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let selectedMonthExpense = 0;
    let currentMonthExpense = 0;
    const allCategoryExpenseMap = {};
    const selectedMonthCatExpenseMap = {};

    transactions.forEach((tx) => {
      const rawAmt = Number(tx.amount) || 0;
      const convertedAmt = convertAmount(rawAmt, tx.currency || 'INR', currency);

      const isCurrentMonth = tx.date && tx.date.startsWith(currentMonthKey);
      const isSelectedMonth = tx.date && tx.date.startsWith(selectedBudgetMonth);

      if (tx.type === 'income') {
        income += convertedAmt;
      } else if (tx.type === 'expense') {
        expense += convertedAmt;
        if (isCurrentMonth) {
          currentMonthExpense += convertedAmt;
        }
        if (isSelectedMonth) {
          selectedMonthExpense += convertedAmt;
        }

        const catName = tx.categoryName || tx.category_name || 'Other';

        // Overall category map
        if (!allCategoryExpenseMap[catName]) {
          const categoryObj = categories.find((c) => c.name === catName || c.id === tx.categoryId || c.id === tx.category_id);
          allCategoryExpenseMap[catName] = {
            name: catName,
            value: 0,
            color: categoryObj?.color || '#526C78',
          };
        }
        allCategoryExpenseMap[catName].value += convertedAmt;

        // Selected budget month category map (strictly expenses, ignoring income)
        if (isSelectedMonth) {
          if (!selectedMonthCatExpenseMap[catName]) {
            const categoryObj = categories.find((c) => c.name === catName || c.id === tx.categoryId || c.id === tx.category_id);
            selectedMonthCatExpenseMap[catName] = {
              name: catName,
              value: 0,
              color: categoryObj?.color || '#526C78',
            };
          }
          selectedMonthCatExpenseMap[catName].value += convertedAmt;
        }
      }
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Category breakdown across all expenses
    const categoryBreakdown = Object.values(allCategoryExpenseMap)
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(2)),
        percentage: expense > 0 ? Number(((item.value / expense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Selected Month Category breakdown
    const selectedMonthCategoryBreakdown = Object.values(selectedMonthCatExpenseMap)
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(2)),
        percentage: selectedMonthExpense > 0 ? Number(((item.value / selectedMonthExpense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly Budget calculations for selectedBudgetMonth
    let convertedMonthlyBudget = null;
    let remainingBudget = 0;
    let budgetUtilization = 0;
    let isOverBudget = false;

    if (monthlyBudget !== null && monthlyBudget > 0) {
      convertedMonthlyBudget = convertAmount(
        monthlyBudget,
        monthlyBudgetCurrency || 'INR',
        currency
      );
      remainingBudget = Math.max(0, convertedMonthlyBudget - selectedMonthExpense);
      budgetUtilization = convertedMonthlyBudget > 0 ? Math.round((selectedMonthExpense / convertedMonthlyBudget) * 100) : 0;
      isOverBudget = selectedMonthExpense > convertedMonthlyBudget;
    }

    const budgetStatus = isOverBudget ? 'Exceeded' : budgetUtilization >= 75 ? 'Warning' : 'Normal';

    // Category Budgets progress (evaluated against expenses in selectedBudgetMonth)
    const budgetProgress = budgets.map((b) => {
      const catName = b.categoryName || b.category_name;
      const spent = selectedMonthCatExpenseMap[catName]?.value || 0;
      const rawLimit = Number(b.limit !== undefined ? b.limit : b.limit_amount !== undefined ? b.limit_amount : 0);
      const limit = convertAmount(rawLimit, b.currency || 'INR', currency);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const isCatOver = spent > limit;
      const isCatWarning = percent >= 75 && !isCatOver;
      const catStatus = isCatOver ? 'Exceeded' : isCatWarning ? 'Warning' : 'Normal';

      return {
        ...b,
        id: b.id,
        categoryName: catName,
        category_name: catName,
        spent: Number(spent.toFixed(2)),
        limit: Number(limit.toFixed(2)),
        remaining: Math.max(0, Number((limit - spent).toFixed(2))),
        percent,
        isOverBudget: isCatOver,
        isWarning: isCatWarning,
        status: catStatus,
      };
    });

    // Proactive Budget Alerts
    const budgetAlerts = [];
    if (monthlyBudget !== null && monthlyBudget > 0 && convertedMonthlyBudget > 0) {
      if (isOverBudget) {
        budgetAlerts.push({
          id: 'mb-exceeded',
          type: 'danger',
          title: 'Monthly Budget Exceeded',
          message: `Spending for ${selectedBudgetMonth} has exceeded your monthly target limit by ${Math.round(selectedMonthExpense - convertedMonthlyBudget)} ${currency}.`,
          percent: budgetUtilization,
        });
      } else if (budgetUtilization >= 75) {
        budgetAlerts.push({
          id: 'mb-warning',
          type: 'warning',
          title: 'Approaching Monthly Budget Limit',
          message: `You have consumed ${budgetUtilization}% of your ${selectedBudgetMonth} budget. Only ${Number(remainingBudget.toFixed(2))} ${currency} remaining.`,
          percent: budgetUtilization,
        });
      }
    }

    budgetProgress.forEach((bp) => {
      if (bp.isOverBudget) {
        budgetAlerts.push({
          id: `cat-exceeded-${bp.id || bp.categoryName}`,
          type: 'danger',
          title: `${bp.categoryName} Limit Exceeded`,
          message: `You spent ${bp.spent} ${currency} against your ${bp.limit} ${currency} limit (${bp.percent}% utilized).`,
          categoryName: bp.categoryName,
          percent: bp.percent,
        });
      } else if (bp.isWarning) {
        budgetAlerts.push({
          id: `cat-warning-${bp.id || bp.categoryName}`,
          type: 'warning',
          title: `${bp.categoryName} Near Cap`,
          message: `You have used ${bp.percent}% of your ${bp.categoryName} allowance (${bp.remaining} ${currency} left).`,
          categoryName: bp.categoryName,
          percent: bp.percent,
        });
      }
    });

    // Recurring expenses analytics
    const activeRecurring = recurringExpenses.filter((r) => r.status === 'Active');
    const totalRecurringCommitment = recurringExpenses.reduce(
      (acc, curr) => acc + convertAmount(Number(curr.amount) || 0, curr.currency || 'INR', currency),
      0
    );
    const activeRecurringCommitment = activeRecurring.reduce(
      (acc, curr) => acc + convertAmount(Number(curr.amount) || 0, curr.currency || 'INR', currency),
      0
    );

    // 7-day or daily spending trend
    const dayMap = {};
    transactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }
      const convertedAmt = convertAmount(Number(tx.amount) || 0, tx.currency || 'INR', currency);
      if (tx.type === 'income') {
        dayMap[dateKey].income += convertedAmt;
      } else {
        dayMap[dateKey].expense += convertedAmt;
      }
    });

    const spendingTrends = Object.values(dayMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));

    return {
      totalIncome: Number(income.toFixed(2)),
      totalExpenses: Number(expense.toFixed(2)),
      availableBalance: Number(balance.toFixed(2)),
      monthlySavings: Number(balance.toFixed(2)),
      savingsRate: Number(savingsRate.toFixed(1)),
      currentMonthExpenses: Number(currentMonthExpense.toFixed(2)),
      selectedMonthExpenses: Number(selectedMonthExpense.toFixed(2)),
      monthlyBudget: convertedMonthlyBudget,
      remainingBudget: Number(remainingBudget.toFixed(2)),
      budgetUtilization,
      isOverBudget,
      budgetStatus,
      hasMonthlyBudget: monthlyBudget !== null && monthlyBudget > 0,
      categoryBreakdown,
      selectedMonthCategoryBreakdown,
      spendingTrends,
      budgetProgress,
      budgetAlerts,
      activeRecurringCount: activeRecurring.length,
      totalRecurringCount: recurringExpenses.length,
      totalRecurringCommitment: Number(totalRecurringCommitment.toFixed(2)),
      activeRecurringCommitment: Number(activeRecurringCommitment.toFixed(2)),
    };
  }, [
    transactions,
    categories,
    budgets,
    monthlyBudget,
    monthlyBudgetCurrency,
    recurringExpenses,
    currency,
    convertAmount,
    currentMonthKey,
    selectedBudgetMonth,
  ]);

  const value = {
    transactions,
    categories,
    budgets,
    recurringExpenses,
    monthlyBudgetsList,
    monthlyBudget,
    monthlyBudgetCurrency,
    activeMonthlyBudgetRecord,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    currentMonthKey,
    updateMonthlyBudget,
    deleteMonthlyBudget,
    addCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
    addRecurringExpense,
    updateRecurringExpense,
    toggleRecurringExpenseStatus,
    deleteRecurringExpense,
    stats,
    loadingData,
    addTransaction,
    addTransactionsBulk,
    editTransaction,
    deleteTransaction,
    loadStarterSampleData,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

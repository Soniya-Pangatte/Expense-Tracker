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
  const [loadingData, setLoadingData] = useState(false);

  // Monthly Budget state (null means new user has no budget set)
  const [monthlyBudget, setMonthlyBudgetState] = useState(null);
  const [monthlyBudgetCurrency, setMonthlyBudgetCurrency] = useState('INR');

  // Current month key, e.g. "2026-11"
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Sync data whenever the authenticated user changes
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setRecurringExpenses([]);
      setMonthlyBudgetState(null);
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
      setBudgets(initialBudgets);
      setRecurringExpenses(initialRecurring);
      setMonthlyBudgetState(50000);
      setMonthlyBudgetCurrency('INR');
      return;
    }

    // 2. Real Registered User: Load isolated, user-specific records
    const loadUserFinancialData = async () => {
      setLoadingData(true);
      try {
        const userStorageKey = `spendwise_transactions_${user.id}`;
        const userBudgetKey = `spendwise_monthly_budget_${user.id}_${currentMonthKey}`;

        if (isSupabaseConfigured) {
          // A. Load Transactions (RLS filters by auth.uid())
          const { data: dbTransactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

          if (!txError && dbTransactions) {
            // Normalize database columns into frontend-friendly model
            const normalizedTxs = dbTransactions.map((tx) => {
              // Retrieve currency from currency column, or recover if legacy note format
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
                id: tx.id, // Canonical database UUID
                userId: tx.user_id,
                user_id: tx.user_id,
                currency: resolvedCurrency || 'INR',
                categoryId: tx.category_id,
                category_id: tx.category_id,
                categoryName: tx.category_name || 'General',
                category_name: tx.category_name || 'General',
                paymentMethod: tx.payment_method || 'Credit Card (Visa)',
                payment_method: tx.payment_method || 'Credit Card (Visa)',
                source: tx.source || 'manual',
                notes: resolvedNotes || null,
              };
            });
            setTransactions(normalizedTxs);
            persistUserTransactions(normalizedTxs);
          } else {
            if (txError) {
              console.warn('Error loading transactions from Supabase:', txError.message);
            }
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

          // C. Load User's Monthly Budget for active month
          const { data: dbBudget, error: budgetError } = await supabase
            .from('monthly_budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_year', currentMonthKey)
            .maybeSingle();

          if (!budgetError && dbBudget) {
            setMonthlyBudgetState(Number(dbBudget.amount));
            setMonthlyBudgetCurrency(dbBudget.currency || 'INR');
          } else {
            // Check local user cache
            const cachedBudget = localStorage.getItem(userBudgetKey);
            if (cachedBudget) {
              const parsed = JSON.parse(cachedBudget);
              setMonthlyBudgetState(Number(parsed.amount));
              setMonthlyBudgetCurrency(parsed.currency || 'INR');
            } else {
              // New users start with NO budget configured
              setMonthlyBudgetState(null);
              setMonthlyBudgetCurrency(currency);
            }
          }

          // D. Load Category Budgets & Recurring
          const { data: dbBudgets } = await supabase.from('budgets').select('*');
          setBudgets(dbBudgets && dbBudgets.length > 0 ? dbBudgets : []);

          const { data: dbRecurring } = await supabase.from('recurring_expenses').select('*');
          setRecurringExpenses(dbRecurring && dbRecurring.length > 0 ? dbRecurring : []);
        } else {
          // Local fallback for registered user
          const cached = localStorage.getItem(userStorageKey);
          setTransactions(cached ? JSON.parse(cached) : []);

          const cachedBudget = localStorage.getItem(userBudgetKey);
          if (cachedBudget) {
            const parsed = JSON.parse(cachedBudget);
            setMonthlyBudgetState(Number(parsed.amount));
            setMonthlyBudgetCurrency(parsed.currency || 'INR');
          } else {
            setMonthlyBudgetState(null);
            setMonthlyBudgetCurrency(currency);
          }
        }
      } catch (err) {
        console.warn('Error loading user financial data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserFinancialData();
  }, [user, isDemoUser, currentMonthKey, currency]);

  // Persist user-specific transactions
  const persistUserTransactions = (newTransactionsList) => {
    if (!user || user.isDemo) return;
    const userStorageKey = `spendwise_transactions_${user.id}`;
    localStorage.setItem(userStorageKey, JSON.stringify(newTransactionsList));
  };

  // Update Monthly Budget
  const updateMonthlyBudget = async (amount, budgetCurrency = currency) => {
    const num = Number(amount) || 0;
    setMonthlyBudgetState(num);
    setMonthlyBudgetCurrency(budgetCurrency);

    if (user && !user.isDemo) {
      // 1. Local Cache
      const userBudgetKey = `spendwise_monthly_budget_${user.id}_${currentMonthKey}`;
      localStorage.setItem(
        userBudgetKey,
        JSON.stringify({ amount: num, currency: budgetCurrency })
      );

      // 2. Supabase Upsert
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('monthly_budgets').upsert(
          {
            user_id: user.id,
            month_year: currentMonthKey,
            amount: num,
            currency: budgetCurrency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,month_year' }
        );

        if (error) {
          console.error('Failed to upsert monthly_budgets in Supabase:', error.message);
          throw new Error(error.message || 'Failed to update monthly budget.');
        }
      }
    }
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

  // Calculate dynamic statistics with multi-currency conversion and accurate monthly budget
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let currentMonthExpense = 0;
    const categoryExpenseMap = {};

    transactions.forEach((tx) => {
      // Convert stored transaction amount to the user's active display currency
      const rawAmt = Number(tx.amount) || 0;
      const convertedAmt = convertAmount(rawAmt, tx.currency || 'INR', currency);

      const isCurrentMonth = tx.date && tx.date.startsWith(currentMonthKey);

      if (tx.type === 'income') {
        income += convertedAmt;
      } else if (tx.type === 'expense') {
        expense += convertedAmt;
        if (isCurrentMonth) {
          currentMonthExpense += convertedAmt;
        }

        const catName = tx.categoryName || tx.category_name || 'Other';
        if (!categoryExpenseMap[catName]) {
          const categoryObj = categories.find((c) => c.name === catName || c.id === tx.categoryId || c.id === tx.category_id);
          categoryExpenseMap[catName] = {
            name: catName,
            value: 0,
            color: categoryObj?.color || '#526C78',
          };
        }
        categoryExpenseMap[catName].value += convertedAmt;
      }
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = Object.values(categoryExpenseMap)
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(2)),
        percentage: expense > 0 ? Number(((item.value / expense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly Budget calculations
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
      remainingBudget = Math.max(0, convertedMonthlyBudget - currentMonthExpense);
      budgetUtilization = Math.round((currentMonthExpense / convertedMonthlyBudget) * 100);
      isOverBudget = currentMonthExpense > convertedMonthlyBudget;
    }

    // Category Budgets progress
    const budgetProgress = budgets.map((b) => {
      const spent = categoryExpenseMap[b.categoryName]?.value || 0;
      const rawLimit = Number(b.limit || b.limit_amount) || 1;
      const limit = convertAmount(rawLimit, b.currency || 'INR', currency);
      const percent = Math.min(Math.round((spent / limit) * 100), 100);
      return {
        ...b,
        spent: Number(spent.toFixed(2)),
        limit: Number(limit.toFixed(2)),
        remaining: Math.max(0, Number((limit - spent).toFixed(2))),
        percent,
        isOverBudget: spent > limit,
      };
    });

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
      monthlyBudget: convertedMonthlyBudget,
      remainingBudget: Number(remainingBudget.toFixed(2)),
      budgetUtilization,
      isOverBudget,
      hasMonthlyBudget: monthlyBudget !== null && monthlyBudget > 0,
      categoryBreakdown,
      spendingTrends,
      budgetProgress,
    };
  }, [
    transactions,
    categories,
    budgets,
    monthlyBudget,
    monthlyBudgetCurrency,
    currency,
    convertAmount,
    currentMonthKey,
  ]);

  const value = {
    transactions,
    categories,
    budgets,
    recurringExpenses,
    monthlyBudget,
    monthlyBudgetCurrency,
    updateMonthlyBudget,
    stats,
    loadingData,
    addTransaction,
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

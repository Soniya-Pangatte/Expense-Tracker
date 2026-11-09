import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

// Supported Currencies Configuration
export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
];

// Fallback exchange rates based on 1 INR (approximate baseline if offline)
const DEFAULT_INR_RATES = {
  INR: 1.0,
  USD: 0.01198,
  EUR: 0.01108,
  GBP: 0.00936,
  CAD: 0.01634,
};

const CACHE_KEY = 'spendwise_exchange_rates';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function CurrencyProvider({ children }) {
  const { user, profile } = useAuth();

  // Default currency for all new users is INR (₹)
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('spendwise_currency') || 'INR';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.rates;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached rates', e);
    }
    return DEFAULT_INR_RATES;
  });

  const [savingCurrency, setSavingCurrency] = useState(false);

  // 1. Fetch live exchange rates with caching
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveRates() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            return; // Cache is still fresh
          }
        }

        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        if (!res.ok) throw new Error('Network error fetching rates');
        const data = await res.json();

        if (data && data.result === 'success' && data.rates && isMounted) {
          const newRates = {
            INR: 1.0,
            USD: data.rates.USD || DEFAULT_INR_RATES.USD,
            EUR: data.rates.EUR || DEFAULT_INR_RATES.EUR,
            GBP: data.rates.GBP || DEFAULT_INR_RATES.GBP,
            CAD: data.rates.CAD || DEFAULT_INR_RATES.CAD,
          };
          setExchangeRates(newRates);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rates: newRates, timestamp: Date.now() })
          );
        }
      } catch (err) {
        console.warn('Using fallback exchange rates:', err.message);
      }
    }

    fetchLiveRates();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sync user's saved currency from Supabase profile / user_preferences on login
  useEffect(() => {
    if (!user) return;

    // Check user profile currency if present
    const userPrefCurrency = profile?.currency || user.user_metadata?.currency;
    if (userPrefCurrency && SUPPORTED_CURRENCIES.some((c) => c.code === userPrefCurrency)) {
      setCurrencyState(userPrefCurrency);
      localStorage.setItem('spendwise_currency', userPrefCurrency);
      return;
    }

    // Try fetching from user_preferences table in Supabase
    if (isSupabaseConfigured && !user.isDemo) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('currency')
            .eq('user_id', user.id)
            .single();

          if (data?.currency && !error) {
            setCurrencyState(data.currency);
            localStorage.setItem('spendwise_currency', data.currency);
          } else {
            // New user: Save default INR
            setCurrencyState('INR');
            localStorage.setItem('spendwise_currency', 'INR');
          }
        } catch (err) {
          console.warn('Could not fetch user_preferences currency:', err);
        }
      })();
    }
  }, [user, profile]);

  // 3. Set currency and persist to Supabase & localStorage
  const setCurrency = async (newCode) => {
    if (!SUPPORTED_CURRENCIES.some((c) => c.code === newCode)) return;

    setCurrencyState(newCode);
    localStorage.setItem('spendwise_currency', newCode);

    if (isSupabaseConfigured && user && !user.isDemo) {
      setSavingCurrency(true);
      try {
        // Update user_preferences table with explicit onConflict
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: user.id,
              currency: newCode,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (prefError) {
          console.warn('user_preferences upsert error:', prefError.message);
        }

        // Also update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ currency: newCode, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (profileError) {
          console.warn('profiles currency update error:', profileError.message);
        }
      } catch (err) {
        console.warn('Failed to save currency preference in Supabase:', err.message);
      } finally {
        setSavingCurrency(false);
      }
    }
  };

  // 4. Currency conversion logic
  // Converts an amount from `fromCurrency` to `toCurrency` using exchange rates based on INR
  const convertAmount = useCallback(
    (amount, fromCurrency = 'INR', toCurrency = currency) => {
      const num = Number(amount) || 0;
      if (!fromCurrency || fromCurrency === toCurrency) return num;

      const rateFrom = exchangeRates[fromCurrency] || DEFAULT_INR_RATES[fromCurrency] || 1;
      const rateTo = exchangeRates[toCurrency] || DEFAULT_INR_RATES[toCurrency] || 1;

      // Base conversion: amount / rateFrom gives amount in INR, then * rateTo gives amount in toCurrency
      const inINR = num / rateFrom;
      const converted = inINR * rateTo;
      return Number(converted.toFixed(2));
    },
    [currency, exchangeRates]
  );

  // 5. Currency formatter using Intl.NumberFormat
  const formatCurrency = useCallback(
    (amount, fromCurrency = null, targetCurrency = null) => {
      const target = targetCurrency || currency;
      const origin = fromCurrency || target;
      const finalAmount = convertAmount(amount, origin, target);

      const currencyConfig =
        SUPPORTED_CURRENCIES.find((c) => c.code === target) ||
        SUPPORTED_CURRENCIES[0];

      try {
        return new Intl.NumberFormat(currencyConfig.locale, {
          style: 'currency',
          currency: currencyConfig.code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(finalAmount);
      } catch (e) {
        return `${currencyConfig.symbol}${finalAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
    },
    [currency, convertAmount]
  );

  // 6. Fast raw formatter (when the amount is already in the target currency, no conversion needed)
  const formatRawCurrency = useCallback(
    (amount, targetCurrency = currency) => {
      const num = Number(amount) || 0;
      const currencyConfig =
        SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) ||
        SUPPORTED_CURRENCIES[0];

      try {
        return new Intl.NumberFormat(currencyConfig.locale, {
          style: 'currency',
          currency: currencyConfig.code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } catch (e) {
        return `${currencyConfig.symbol}${num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
    },
    [currency]
  );

  // 7. Get Currency Symbol
  const getCurrencySymbol = useCallback(
    (code = currency) => {
      const config = SUPPORTED_CURRENCIES.find((c) => c.code === code);
      return config ? config.symbol : '₹';
    },
    [currency]
  );

  const value = {
    currency,
    setCurrency,
    currencies: SUPPORTED_CURRENCIES,
    exchangeRates,
    convertAmount,
    formatCurrency,
    formatRawCurrency,
    getCurrencySymbol,
    savingCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}


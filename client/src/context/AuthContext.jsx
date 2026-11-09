import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export const DEMO_USER = {
  id: 'demo-user-id-001',
  email: 'demo@spendwise.io',
  user_metadata: {
    full_name: 'Jane Doe',
  },
  isDemo: true,
  role: 'user',
};

export const DEMO_ADMIN_USER = {
  id: 'demo-admin-id-001',
  email: 'admin@spendwise.io',
  user_metadata: {
    full_name: 'System Administrator',
  },
  isDemo: true,
  role: 'admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);

  // Fetch or build user profile and verify role
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      return null;
    }

    if (currentUser.isDemo) {
      const isAdm = currentUser.role === 'admin' || currentUser.email === 'admin@spendwise.io';
      setIsAdmin(isAdm);
      setIsDemoAdmin(isAdm);
      const demoProfile = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || (isAdm ? 'System Administrator' : 'Jane Doe'),
        avatar_url: null,
        role: isAdm ? 'admin' : 'user',
      };
      setProfile(demoProfile);
      return demoProfile;
    }

    let userRole = 'user';

    try {
      if (isSupabaseConfigured) {
        // Fetch role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, is_active')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (roleData && roleData.role === 'admin' && roleData.is_active) {
          userRole = 'admin';
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (data && !error) {
          const fullProfile = { ...data, role: userRole };
          setProfile(fullProfile);
          return fullProfile;
        }
      }
    } catch (err) {
      console.warn('Profile fetch warning (falling back to user metadata):', err.message);
    }

    // Fallback to auth metadata if table read is pending or not yet populated
    const metaProfile = {
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      role: userRole,
    };
    setProfile(metaProfile);
    return metaProfile;
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      // Check if demo mode was previously active
      const savedDemo = localStorage.getItem('spendwise_demo_session');
      if (savedDemo === 'admin') {
        if (mounted) {
          setUser(DEMO_ADMIN_USER);
          setIsDemoUser(true);
          setIsDemoAdmin(true);
          setIsAdmin(true);
          await fetchUserProfile(DEMO_ADMIN_USER);
          setLoading(false);
        }
        return;
      }
      if (savedDemo === 'true') {
        if (mounted) {
          setUser(DEMO_USER);
          setIsDemoUser(true);
          setIsDemoAdmin(false);
          setIsAdmin(false);
          await fetchUserProfile(DEMO_USER);
          setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error fetching Supabase session:', error.message);
        }

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsDemoUser(false);
            await fetchUserProfile(initialSession.user);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen for Supabase auth state changes
    let authListener = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        // Clear demo mode if real auth event occurs
        if (newSession?.user) {
          localStorage.removeItem('spendwise_demo_session');
          setIsDemoUser(false);
          setSession(newSession);
          setUser(newSession.user);
          await fetchUserProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsDemoUser(false);
        }
        setLoading(false);
      });
      authListener = data.subscription;
    }

    return () => {
      mounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  // 1. SIGNUP with full name in user_metadata & profile upsert
  const signup = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not yet configured with valid credentials in .env. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // If session returned immediately (email confirmation disabled or auto-confirm)
    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Profile table insert warning:', profileErr.message);
      }
    }

    return data;
  };

  // 2. LOGIN with email & password
  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. You can sign in using the "Explore Demo Account" button below.'
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    localStorage.removeItem('spendwise_demo_session');
    setIsDemoUser(false);
    setUser(data.user);
    setSession(data.session);
    await fetchUserProfile(data.user);
    return data;
  };

  // 3. DEMO LOGIN (for evaluating the dashboard without active Supabase keys)
  const loginAsDemo = () => {
    localStorage.setItem('spendwise_demo_session', 'true');
    setIsDemoUser(true);
    setIsDemoAdmin(false);
    setIsAdmin(false);
    setUser(DEMO_USER);
    setProfile({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      full_name: 'Jane Doe',
      avatar_url: null,
      role: 'user',
    });
    return true;
  };

  // 3b. DEMO ADMIN LOGIN (for evaluating the Phase 7 Admin Dashboard)
  const loginAsDemoAdmin = () => {
    localStorage.setItem('spendwise_demo_session', 'admin');
    setIsDemoUser(true);
    setIsDemoAdmin(true);
    setIsAdmin(true);
    setUser(DEMO_ADMIN_USER);
    setProfile({
      id: DEMO_ADMIN_USER.id,
      email: DEMO_ADMIN_USER.email,
      full_name: 'System Administrator',
      avatar_url: null,
      role: 'admin',
    });
    return true;
  };

  // 4. LOGOUT
  const logout = async () => {
    try {
      localStorage.removeItem('spendwise_demo_session');
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Logout signOut warning:', err.message);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsDemoUser(false);
      setIsAdmin(false);
      setIsDemoAdmin(false);
    }
  };

  // 5. FORGOT PASSWORD
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add valid credentials to .env to send reset emails.');
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
    return data;
  };

  // 6. UPDATE PASSWORD
  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isDemoUser,
    isAdmin,
    isDemoAdmin,
    isConfigured: isSupabaseConfigured,
    signup,
    login,
    loginAsDemo,
    loginAsDemoAdmin,
    logout,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


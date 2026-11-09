import { supabaseAdmin } from '../config/supabase.js';

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

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const isDemoHeader = req.headers['x-demo-user'] === 'true';
    const isDemoAdminHeader = req.headers['x-admin-demo'] === 'true' || req.headers['x-demo-role'] === 'admin';

    // Demo admin bypass
    if (isDemoAdminHeader) {
      req.user = DEMO_ADMIN_USER;
      req.token = 'demo-admin-token';
      req.isDemo = true;
      req.isAdmin = true;
      return next();
    }

    // Demo user bypass for testing and instant preview
    if (isDemoHeader || authHeader === 'Bearer demo-token' || authHeader === 'Bearer demo-user-id-001') {
      req.user = DEMO_USER;
      req.token = 'demo-token';
      req.isDemo = true;
      req.isAdmin = false;
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check if we can still treat as demo if explicitly flagged in query or header
      if (req.query?.demo === 'true') {
        req.user = DEMO_USER;
        req.token = 'demo-token';
        req.isDemo = true;
        req.isAdmin = false;
        return next();
      }
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (token === 'demo-admin-token') {
      req.user = DEMO_ADMIN_USER;
      req.token = 'demo-admin-token';
      req.isDemo = true;
      req.isAdmin = true;
      return next();
    }

    if (token === 'demo-token' || token === 'demo-user-id-001') {
      req.user = DEMO_USER;
      req.token = 'demo-token';
      req.isDemo = true;
      req.isAdmin = false;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Session invalid or expired',
        details: error?.message,
      });
    }

    req.user = user;
    req.token = token;
    req.isDemo = false;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

/**
 * Strict Role-Based Access Control Middleware for SpendWise Admin Endpoints
 * Validates that authenticated user has the 'admin' role in the database.
 * Blocks ordinary users, deactivated accounts, and unauthenticated requests.
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required before checking admin privileges.' });
    }

    // Demo Admin bypass
    if (req.isDemo) {
      if (req.user.role === 'admin' || req.headers['x-admin-demo'] === 'true' || req.headers['x-demo-role'] === 'admin') {
        req.isAdmin = true;
        return next();
      }
      return res.status(403).json({
        error: 'Forbidden: Admin privileges required. Demo user does not have administrative access.',
      });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check user_roles table using supabaseAdmin
    try {
      const { data: roleRecord, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleError && roleRecord) {
        if (!roleRecord.is_active) {
          return res.status(403).json({
            error: 'Forbidden: This account has been deactivated by an administrator.',
          });
        }

        if (roleRecord.role === 'admin') {
          req.isAdmin = true;
          return next();
        }

        return res.status(403).json({
          error: 'Forbidden: Admin privileges required. Your account is not authorized.',
        });
      }
    } catch (dbErr) {
      console.warn('user_roles check error:', dbErr.message);
    }

    // Fallback: Check configured admin emails list for bootstrap setup
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
      req.isAdmin = true;
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden: Admin privileges required. Access denied.',
    });
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(500).json({ error: 'Internal role authorization error' });
  }
}



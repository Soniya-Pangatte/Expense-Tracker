import { supabaseAdmin } from '../config/supabase.js';

export const DEMO_USER = {
  id: 'demo-user-id-001',
  email: 'demo@spendwise.io',
  user_metadata: {
    full_name: 'Jane Doe',
  },
  isDemo: true,
};

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const isDemoHeader = req.headers['x-demo-user'] === 'true';

    // Demo user bypass for testing and instant preview
    if (isDemoHeader || authHeader === 'Bearer demo-token' || authHeader === 'Bearer demo-user-id-001') {
      req.user = DEMO_USER;
      req.token = 'demo-token';
      req.isDemo = true;
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check if we can still treat as demo if explicitly flagged in query or header
      if (req.query?.demo === 'true') {
        req.user = DEMO_USER;
        req.token = 'demo-token';
        req.isDemo = true;
        return next();
      }
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (token === 'demo-token' || token === 'demo-user-id-001') {
      req.user = DEMO_USER;
      req.token = 'demo-token';
      req.isDemo = true;
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


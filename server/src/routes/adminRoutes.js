import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { AdminService } from '../services/adminService.js';

const router = express.Router();

// Strict security: require verified auth and admin role on every admin route
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/overview
 * Real-time aggregated platform metrics and trends
 */
router.get('/overview', async (req, res) => {
  try {
    const isDemo = req.isDemo;
    const data = await AdminService.getOverviewMetrics(isDemo);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin overview metrics', details: err.message });
  }
});

/**
 * GET /api/admin/users
 * User directory with search, filtering, and pagination
 * Strictly excludes private financial transactions, bank imports, or receipts
 */
router.get('/users', async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      role = 'all',
      sortBy = 'created_at',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const data = await AdminService.getUsersList(
      {
        search: String(search),
        status: String(status),
        role: String(role),
        sortBy: String(sortBy),
        order: String(order),
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      },
      req.isDemo
    );

    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Admin users directory error:', err);
    res.status(500).json({ error: 'Failed to retrieve user directory', details: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean (true or false).' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await AdminService.updateUserStatus(id, isActive, req.user, ip, req.isDemo);

    res.json({ success: true, message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`, ...result });
  } catch (err) {
    console.error('Admin update user status error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Assign 'user' or 'admin' role
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Supported roles are "user" and "admin".' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await AdminService.updateUserRole(id, role, req.user, ip, req.isDemo);

    res.json({ success: true, message: `User role has been updated to ${role}.`, ...result });
  } catch (err) {
    console.error('Admin update user role error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/analytics
 * Time-series usage analytics and adoption metrics
 */
router.get('/analytics', async (req, res) => {
  try {
    const data = await AdminService.getApplicationAnalytics(req.isDemo);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve application analytics', details: err.message });
  }
});

/**
 * GET /api/admin/system
 * Real-time health checks, service latencies, and server status
 */
router.get('/system', async (req, res) => {
  try {
    const data = await AdminService.getSystemHealth();
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Admin system health error:', err);
    res.status(500).json({ error: 'Failed to retrieve system health', details: err.message });
  }
});

/**
 * GET /api/admin/logs
 * Retrieve recent administrative audit trail
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const logs = await AdminService.getAuditLogs(req.isDemo, limit);
    res.json({ success: true, logs });
  } catch (err) {
    console.error('Admin audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
});

export default router;

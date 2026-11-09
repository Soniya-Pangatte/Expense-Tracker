import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
} from '../../services/adminService';

export default function AdminUsers() {
  const { session, user: currentAdmin, isDemoUser, isDemoAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'status'|'role', user, targetValue }
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsers({
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        page,
        limit: 10,
        session,
        isDemoUser,
        isDemoAdmin,
      });

      if (res && res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
      } else {
        throw new Error(res?.error || 'Failed to fetch user directory');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, statusFilter, roleFilter, page, session, isDemoUser, isDemoAdmin]);

  const handleStatusToggle = async () => {
    if (!confirmModal || confirmModal.type !== 'status') return;
    const { user, targetValue } = confirmModal;
    setActionLoading(true);

    try {
      await updateAdminUserStatus(user.id, targetValue, { session, isDemoUser, isDemoAdmin });
      setConfirmModal(null);
      await loadUsers();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleToggle = async () => {
    if (!confirmModal || confirmModal.type !== 'role') return;
    const { user, targetValue } = confirmModal;
    setActionLoading(true);

    try {
      await updateAdminUserRole(user.id, targetValue, { session, isDemoUser, isDemoAdmin });
      setConfirmModal(null);
      await loadUsers();
    } catch (err) {
      alert(`Role change failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1B3541] p-5 sm:p-6 rounded-3xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/60 dark:border-[#365765]">
              <Users size={14} className="text-[#447F98]" /> RBAC Directory
            </span>
            <span className="text-xs text-[#526C78] dark:text-[#91ADB8]">
              {total} Total Users
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            User Management & Authorization
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#C0D5DC]">
            Manage account status, verify roles, and audit security credentials with strict financial privacy preservation.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-[#D6EBF3]/40 dark:bg-[#203D49]/40 border border-[#C4DCE3] dark:border-[#365765] flex items-center gap-3 text-xs text-[#526C78] dark:text-[#C0D5DC]">
        <Lock size={16} className="text-[#447F98] shrink-0" />
        <span>
          <strong>Data Privacy Protection Active:</strong> To guarantee zero exposure of private financial information, individual transaction descriptions, bank statement details, and uploaded receipt images are never displayed here.
        </span>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#1B3541] p-4 rounded-2xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#C0D5DC]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email address..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] font-medium"
          >
            <option value="all">All Roles</option>
            <option value="user">User Role</option>
            <option value="admin">Admin Role</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#EBF4F7] dark:bg-[#18303C] border-b border-[#C4DCE3] dark:border-[#365765] text-[#526C78] dark:text-[#83BDCF] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#526C78] dark:text-[#C0D5DC]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#447F98]" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#526C78] dark:text-[#C0D5DC]">
                    No users found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id || (isDemoAdmin && u.id === 'demo-admin-id-001');
                  return (
                    <tr key={u.id} className="hover:bg-[#F4FAFC] dark:hover:bg-[#152B35]/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#EAF4F7] flex items-center justify-center font-bold text-xs shrink-0">
                            {u.full_name?.slice(0, 2).toUpperCase() || 'US'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#243D49] dark:text-[#EAF4F7]">
                                {u.full_name}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#D6EBF3] text-[#243D49] dark:bg-[#203D49] dark:text-[#83BDCF]">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                              : 'bg-[#B9D9E1]/40 text-[#243D49] dark:text-[#C0D5DC] border border-[#C4DCE3]'
                          }`}
                        >
                          {u.role === 'admin' ? <ShieldCheck size={12} /> : <Users size={12} />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{u.is_active ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#526C78] dark:text-[#C0D5DC]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#526C78] dark:text-[#C0D5DC]">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Account Info */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View Account Details"
                            className="p-1.5 text-[#526C78] hover:text-[#243D49] dark:text-[#C0D5DC] dark:hover:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              setConfirmModal({
                                type: 'status',
                                user: u,
                                targetValue: !u.is_active,
                              })
                            }
                            title={isSelf ? 'Cannot deactivate yourself' : u.is_active ? 'Deactivate Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-[#758D97]'
                                : u.is_active
                                ? 'text-amber-600 hover:bg-amber-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>

                          {/* Toggle Admin / User Role */}
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              setConfirmModal({
                                type: 'role',
                                user: u,
                                targetValue: u.role === 'admin' ? 'user' : 'admin',
                              })
                            }
                            title={isSelf ? 'Cannot change your own role' : u.role === 'admin' ? 'Revoke Admin Role' : 'Promote to Admin'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-[#758D97]'
                                : u.role === 'admin'
                                ? 'text-rose-500 hover:bg-rose-500/10'
                                : 'text-purple-600 hover:bg-purple-500/10'
                            }`}
                          >
                            <Shield size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B3541] rounded-3xl border border-[#C4DCE3] dark:border-[#365765] max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#C4DCE3] dark:border-[#365765]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#447F98] text-white flex items-center justify-center font-bold text-sm">
                  {selectedUser.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                    {selectedUser.full_name}
                  </h3>
                  <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#526C78] hover:text-[#243D49] dark:hover:text-[#EAF4F7] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/40 dark:border-[#365765]/40">
                <span className="text-[#526C78] dark:text-[#91ADB8]">User ID:</span>
                <span className="font-mono text-[11px] text-[#243D49] dark:text-[#EAF4F7]">{selectedUser.id}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/40 dark:border-[#365765]/40">
                <span className="text-[#526C78] dark:text-[#91ADB8]">Account Role:</span>
                <span className="font-bold uppercase text-[#447F98] dark:text-[#83BDCF]">{selectedUser.role}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/40 dark:border-[#365765]/40">
                <span className="text-[#526C78] dark:text-[#91ADB8]">Status:</span>
                <span className={selectedUser.is_active ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {selectedUser.is_active ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/40 dark:border-[#365765]/40">
                <span className="text-[#526C78] dark:text-[#91ADB8]">Registration Date:</span>
                <span className="text-[#243D49] dark:text-[#EAF4F7]">{new Date(selectedUser.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/40 dark:border-[#365765]/40">
                <span className="text-[#526C78] dark:text-[#91ADB8]">Last Activity:</span>
                <span className="text-[#243D49] dark:text-[#EAF4F7]">{selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#D6EBF3]/40 dark:bg-[#203D49]/40 border border-[#C4DCE3] dark:border-[#365765] text-[11px] text-[#526C78] dark:text-[#C0D5DC]">
              🔒 <strong>Financial Privacy Guarantee:</strong> Transactions, balances, receipts, and bank statements logged by this user are isolated by Supabase RLS and are not visible in the admin portal.
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 rounded-xl bg-[#447F98] text-white text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B3541] rounded-3xl border border-[#C4DCE3] dark:border-[#365765] max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                {confirmModal.type === 'status'
                  ? confirmModal.targetValue
                    ? 'Activate Account?'
                    : 'Deactivate Account?'
                  : `Change Role to ${confirmModal.targetValue.toUpperCase()}?`}
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                Target: <strong>{confirmModal.user.email}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] text-xs font-semibold text-[#526C78] dark:text-[#C0D5DC]"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={confirmModal.type === 'status' ? handleStatusToggle : handleRoleToggle}
                className="flex-1 py-2 rounded-xl bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

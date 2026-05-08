import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Plus, Search, Edit, Trash2, Mail, X } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import { authService, userService } from '../../../utils/apiService';

/** Values accepted by PUT /users/{id}/status (Dali Data Portal API). */
const ACCOUNT_STATUSES = ['pending', 'active', 'inactive', 'suspended'];

function normalizeUserStatus(user) {
  const s = String(user?.status || '').toLowerCase();
  if (s && ACCOUNT_STATUSES.includes(s)) return s;
  if (s) return s;
  if (user?.is_active === true) return 'active';
  if (user?.is_active === false) return 'inactive';
  return 'pending';
}

function statusSelectOptions(current) {
  const c = String(current || '').toLowerCase();
  if (ACCOUNT_STATUSES.includes(c)) return ACCOUNT_STATUSES;
  return [c, ...ACCOUNT_STATUSES];
}

function statusBadgeColors(status) {
  switch (status) {
    case 'active':
      return { background: 'rgba(16,185,129,0.15)', color: '#10B981' };
    case 'pending':
      return { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
    case 'suspended':
      return { background: 'rgba(107,114,128,0.2)', color: '#6B7280' };
    case 'inactive':
      return { background: 'rgba(239,68,68,0.15)', color: '#EF4444' };
    default:
      return { background: 'rgba(99,102,241,0.15)', color: '#6366F1' };
  }
}

function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join('; ');
  if (d && typeof d === 'object' && d.msg) return d.msg;
  return err?.message || 'Request failed';
}

const Badge = ({ children, style }) => (
  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...style }}>{children}</span>
);

const Modal = ({ open, onClose, title, children, footer, themeColors }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: themeColors.card, borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: themeColors.text, margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: themeColors.textMuted, cursor: 'pointer', padding: 4 }}><X size={24} /></button>
        </div>
        {children}
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  );
};

export default function AdminUsersPage() {
  const themeColors = useThemeColors();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'viewer', password: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [resendId, setResendId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.list({ limit: 100 });
      const data = res.data;
      const list = data?.items || data?.data || data || [];
      setUsers(Array.isArray(list) ? list : []);
      setTotal(data?.total || list.length);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const name = u.full_name || u.name || '';
    const matchSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const st = normalizeUserStatus(u);
    const matchStatus = statusFilter === 'all' || st === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAdd = async () => {
    setSaving(true);
    try {
      const { status: _s, ...createPayload } = form;
      await userService.create(createPayload);
      setIsAddOpen(false);
      setForm({ full_name: '', email: '', role: 'viewer', password: '', status: 'pending' });
      setToast('User created');
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      setToast(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userService.update(selectedUser.id, { full_name: form.full_name, role: form.role });
      const prevStatus = normalizeUserStatus(selectedUser);
      if (form.status && form.status !== prevStatus) {
        await userService.updateStatus(selectedUser.id, { status: form.status });
      }
      setIsEditOpen(false);
      setSelectedUser(null);
      setToast('User updated');
      fetchUsers();
    } catch (err) {
      console.error('Update user error:', err);
      setToast(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userService.delete(selectedUser.id);
      setIsDeleteOpen(false);
      setSelectedUser(null);
      setToast('User deleted');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      setToast(formatApiError(err));
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    const current = normalizeUserStatus(user);
    if (newStatus === current) return;
    setStatusUpdatingId(user.id);
    try {
      await userService.updateStatus(user.id, { status: newStatus });
      setToast(`Status set to ${newStatus}`);
      await fetchUsers();
    } catch (err) {
      console.error('Update status error:', err);
      setToast(formatApiError(err));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleResendVerification = async (user) => {
    if (!user?.email) return;
    setResendId(user.id);
    try {
      await authService.resendVerification({ email: user.email });
      setToast('Verification email resent (if account exists)');
    } catch (err) {
      console.error('Resend verification error:', err);
      setToast(formatApiError(err));
    } finally {
      setResendId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await userService.updateRole(user.id, { role: newRole });
      setToast('Role updated');
      fetchUsers();
    } catch (err) {
      console.error('Role change error:', err);
      setToast(formatApiError(err));
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || user.name || '',
      email: user.email || '',
      role: user.role || 'viewer',
      password: '',
      status: normalizeUserStatus(user),
    });
    setIsEditOpen(true);
  };

  const inputStyle = { width: '100%', background: themeColors.bg, border: `1px solid ${themeColors.border}`, borderRadius: 10, padding: '10px 14px', color: themeColors.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };
  const btnPrimary = { padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#FF8C00', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 };
  const btnOutline = { ...btnPrimary, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted };
  const btnDanger = { ...btnPrimary, background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#EF4444' };

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>User Management</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>
              {loading ? 'Loading...' : `${total} total users`}
            </p>
          </div>
          <button onClick={() => setIsAddOpen(true)} style={btnPrimary}><Plus size={18} /> Add User</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
            <input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 40 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...selectStyle, minWidth: 130, width: 'auto' }}>
            <option value="all">All Roles</option>
            {['admin', 'editor', 'seller', 'buyer', 'viewer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: 140, width: 'auto' }}>
            <option value="all">All Status</option>
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <ChartCard title={`Users (${filtered.length})`}>
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 40 }}>Loading users...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 40 }}>No users found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['User', 'Role', 'Account status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const accountStatus = normalizeUserStatus(user);
                    const statusOpts = statusSelectOptions(accountStatus);
                    const name = user.full_name || user.name || '—';
                    const badge = statusBadgeColors(accountStatus);
                    return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #FF8C00, #ed8936)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: themeColors.text, margin: 0 }}>{name}</p>
                              <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <select value={user.role || 'viewer'} onChange={e => handleRoleChange(user, e.target.value)}
                            style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 8, padding: '4px 8px', color: themeColors.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                            {['admin', 'editor', 'seller', 'buyer', 'viewer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                            <Badge style={{ background: badge.background, color: badge.color, textTransform: 'capitalize' }}>
                              {accountStatus}
                            </Badge>
                            <select
                              title="Active approves a pending account (same outcome as the user completing email verification)."
                              value={accountStatus}
                              disabled={statusUpdatingId === user.id}
                              onChange={(e) => handleStatusChange(user, e.target.value)}
                              style={{
                                background: themeColors.hoverBg,
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                padding: '6px 10px',
                                color: themeColors.text,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: statusUpdatingId === user.id ? 'wait' : 'pointer',
                                outline: 'none',
                                minWidth: 120,
                              }}
                            >
                              {statusOpts.map((s) => (
                                <option key={s} value={s}>
                                  {!ACCOUNT_STATUSES.includes(s)
                                    ? `${s} (current)`
                                    : s === 'active'
                                      ? 'Active (verified)'
                                      : s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button onClick={() => openEdit(user)} style={{ padding: '6px 8px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 8, color: themeColors.textMuted, cursor: 'pointer', display: 'flex' }}>
                              <Edit size={15} />
                            </button>
                            {accountStatus === 'pending' && (
                              <button
                                type="button"
                                title="Resend verification email"
                                onClick={() => handleResendVerification(user)}
                                disabled={resendId === user.id}
                                style={{
                                  padding: '6px 8px',
                                  background: 'rgba(59,130,246,0.1)',
                                  border: '1px solid #3B82F6',
                                  borderRadius: 8,
                                  color: '#3B82F6',
                                  cursor: resendId === user.id ? 'wait' : 'pointer',
                                  display: 'flex',
                                }}
                              >
                                <Mail size={15} />
                              </button>
                            )}
                            <button onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }} style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            borderRadius: 12,
            padding: '14px 20px',
            color: themeColors.text,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 400,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            maxWidth: 360,
          }}
        >
          {toast}
          <button
            type="button"
            onClick={() => setToast('')}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              color: themeColors.textMuted,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              verticalAlign: 'middle',
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New User" themeColors={themeColors}
        footer={[
          <button key="c" onClick={() => setIsAddOpen(false)} style={btnOutline}>Cancel</button>,
          <button key="a" onClick={handleAdd} disabled={saving} style={btnPrimary}>{saving ? 'Adding...' : 'Add User'}</button>
        ]}>
        {[['Full Name', 'full_name', 'text', 'John Doe'], ['Email', 'email', 'email', 'john@example.com'], ['Password', 'password', 'password', '••••••••']].map(([l, k, t, p]) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</label>
            <input type={t} placeholder={p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inputStyle} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
            {['admin', 'editor', 'seller', 'buyer', 'viewer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User" themeColors={themeColors}
        footer={[
          <button key="c" onClick={() => setIsEditOpen(false)} style={btnOutline}>Cancel</button>,
          <button key="s" onClick={handleEdit} disabled={saving} style={btnPrimary}>{saving ? 'Saving...' : 'Save Changes'}</button>
        ]}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
          <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
            {['admin', 'editor', 'seller', 'buyer', 'viewer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={selectStyle}>
            {statusSelectOptions(form.status).map((s) => (
              <option key={s} value={s}>
                {!ACCOUNT_STATUSES.includes(s)
                  ? `${s} (current)`
                  : s === 'active'
                    ? 'Active (verified)'
                    : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User" themeColors={themeColors}
        footer={[
          <button key="c" onClick={() => setIsDeleteOpen(false)} style={btnOutline}>Cancel</button>,
          <button key="d" onClick={handleDelete} style={btnDanger}>Delete</button>
        ]}>
        <p style={{ color: themeColors.textMuted, margin: 0, fontSize: 15 }}>
          Are you sure you want to delete <strong style={{ color: themeColors.text }}>{selectedUser?.full_name || selectedUser?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}

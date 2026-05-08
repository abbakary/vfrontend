import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Building2, Plus, RefreshCw, RotateCcw, Trash2, Pencil } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useThemeColors } from '../../../utils/useThemeColors';
import { organizationService } from '../../../utils/apiService';

const PRIMARY = '#FF8C00';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

const apiErrorMessage = (err) => {
  const d = err?.response?.data?.detail ?? err?.response?.data?.message;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join('; ');
  if (typeof d === 'string') return d;
  return err?.message || 'Request failed';
};

const emptyForm = {
  ref: '',
  name: '',
  type: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  logo: '',
  description: '',
  status: 'active',
};

function buildCreateBody(form) {
  const body = { name: form.name.trim() };
  ['ref', 'type', 'email', 'phone', 'address', 'website', 'logo', 'description'].forEach((k) => {
    const v = form[k]?.trim();
    if (v) body[k] = v;
  });
  if (form.status) body.status = form.status;
  return body;
}

function buildUpdateBody(form) {
  const body = {};
  ['ref', 'name', 'type', 'email', 'phone', 'address', 'website', 'logo', 'description', 'status'].forEach((k) => {
    const v = form[k];
    if (v === '' || v == null) return;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t || k === 'name') body[k] = t;
    } else {
      body[k] = v;
    }
  });
  return body;
}

export default function AdminOrganizationsPage({ role = 'admin' }) {
  const themeColors = useThemeColors();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await organizationService.adminList({ limit: 500 });
      const payload = res.data?.data ?? res.data;
      setOrgs(extractList(payload));
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err));
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = orgs;
    if (showDeleted === 'active') {
      list = list.filter((o) => !o.deleted_at);
    } else if (showDeleted === 'deleted') {
      list = list.filter((o) => o.deleted_at);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => {
      const blob = [o.name, o.ref, o.email, o.type, String(o.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [orgs, search, showDeleted]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
    setSuccess('');
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      ref: row.ref || '',
      name: row.name || '',
      type: row.type || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      website: row.website || '',
      logo: row.logo || '',
      description: row.description || '',
      status: row.status || 'active',
    });
    setEditOpen(true);
    setSuccess('');
  };

  const openDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
    setSuccess('');
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await organizationService.create(buildCreateBody(form));
      setCreateOpen(false);
      setForm(emptyForm);
      setSuccess('Organization created.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected?.id) return;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await organizationService.update(selected.id, buildUpdateBody(form));
      setEditOpen(false);
      setSelected(null);
      setSuccess('Organization updated.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setSaving(true);
    setError('');
    try {
      await organizationService.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      setSuccess('Organization deleted.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (row) => {
    if (!row?.id) return;
    setError('');
    try {
      await organizationService.restore(row.id);
      setSuccess('Organization restored.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Building2 size={28} color={PRIMARY} /> Organization management
            </Typography>
            <Typography sx={{ color: themeColors.textMuted, maxWidth: 640 }}>
              Create, update, soft-delete, and restore organizations using the admin API. Registration and seller flows can reference these records by ID.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={load}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.border, color: themeColors.text }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={openCreate}
              startIcon={<Plus size={18} />}
              sx={{ backgroundColor: PRIMARY, textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#e67e00' } }}
            >
              New organization
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name, ref, email, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Visibility"
            value={showDeleted}
            onChange={(e) => setShowDeleted(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active (not deleted)</MenuItem>
            <MenuItem value="deleted">Deleted only</MenuItem>
          </TextField>
          <Chip label={`${filtered.length} shown`} sx={{ fontWeight: 700 }} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['ID', 'Ref', 'Name', 'Type', 'Email', 'Status', 'Updated', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 14px',
                          textAlign: 'left',
                          fontSize: 11,
                          color: themeColors.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontWeight: 800,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 32, color: themeColors.textMuted, textAlign: 'center' }}>
                        No organizations match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const deleted = Boolean(o.deleted_at);
                      return (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${themeColors.border}`, opacity: deleted ? 0.75 : 1 }}>
                          <td style={{ padding: '12px 14px', fontSize: 13, color: themeColors.textMuted }}>#{o.id}</td>
                          <td style={{ padding: '12px 14px', fontSize: 13, color: themeColors.text }}>{o.ref || '—'}</td>
                          <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: themeColors.text }}>{o.name}</td>
                          <td style={{ padding: '12px 14px', fontSize: 13, color: themeColors.textMuted }}>{o.type || '—'}</td>
                          <td style={{ padding: '12px 14px', fontSize: 13, color: themeColors.textMuted }}>{o.email || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            {deleted ? (
                              <Chip label="Deleted" size="small" sx={{ backgroundColor: '#fef2f2', color: DANGER, fontWeight: 700 }} />
                            ) : (
                              <Chip
                                label={o.status || 'active'}
                                size="small"
                                sx={{
                                  backgroundColor: (o.status || '').toLowerCase() === 'active' ? '#f0fdf4' : '#fffbeb',
                                  color: (o.status || '').toLowerCase() === 'active' ? SUCCESS : WARNING,
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: themeColors.textMuted }}>
                            {o.updated_at ? new Date(o.updated_at).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {!deleted && (
                                <>
                                  <IconButton size="small" onClick={() => openEdit(o)} aria-label="Edit">
                                    <Pencil size={16} color={PRIMARY} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => openDelete(o)} aria-label="Delete">
                                    <Trash2 size={16} color={DANGER} />
                                  </IconButton>
                                </>
                              )}
                              {deleted && (
                                <Button
                                  size="small"
                                  startIcon={<RotateCcw size={14} />}
                                  onClick={() => handleRestore(o)}
                                  sx={{ textTransform: 'none', fontWeight: 700, color: SUCCESS }}
                                >
                                  Restore
                                </Button>
                              )}
                            </Box>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Box>
          )}
        </Card>

        <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: themeColors.card } }}>
          <DialogTitle sx={{ fontWeight: 800, color: themeColors.text }}>New organization</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <OrgFormFields form={form} setForm={setForm} themeColors={themeColors} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={saving} sx={{ color: themeColors.textMuted }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate} disabled={saving} sx={{ backgroundColor: PRIMARY, textTransform: 'none', fontWeight: 700 }}>
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: themeColors.card } }}>
          <DialogTitle sx={{ fontWeight: 800, color: themeColors.text }}>Edit organization #{selected?.id}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <OrgFormFields form={form} setForm={setForm} themeColors={themeColors} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ color: themeColors.textMuted }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleUpdate} disabled={saving} sx={{ backgroundColor: PRIMARY, textTransform: 'none', fontWeight: 700 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteOpen} onClose={() => !saving && setDeleteOpen(false)} PaperProps={{ sx: { backgroundColor: themeColors.card } }}>
          <DialogTitle sx={{ fontWeight: 800, color: themeColors.text }}>Delete organization?</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: themeColors.textMuted }}>
              This will remove <strong style={{ color: themeColors.text }}>{selected?.name}</strong> (ID #{selected?.id}). Users referencing this organization may need to be reassigned.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {saving ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

function OrgFormFields({ form, setForm, themeColors }) {
  const field = (label, key, props = {}) => (
    <TextField
      label={label}
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      fullWidth
      size="small"
      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: themeColors.bg } }}
      {...props}
    />
  );

  return (
    <>
      {field('Name *', 'name', { required: true })}
      {field('Reference code', 'ref')}
      {field('Type', 'type')}
      {field('Email', 'email', { type: 'email' })}
      {field('Phone', 'phone')}
      {field('Address', 'address', { multiline: true, minRows: 2 })}
      {field('Website', 'website')}
      {field('Logo URL', 'logo')}
      {field('Description', 'description', { multiline: true, minRows: 3 })}
      <TextField
        select
        label="Status"
        value={form.status}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        fullWidth
        size="small"
        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: themeColors.bg } }}
      >
        <MenuItem value="active">active</MenuItem>
        <MenuItem value="inactive">inactive</MenuItem>
        <MenuItem value="pending">pending</MenuItem>
      </TextField>
    </>
  );
}

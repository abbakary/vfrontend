import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Plus, Search, Edit, Trash2, Globe, ArrowRight, Zap, X } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import { adService } from '../../../utils/apiService';

const statusColor = {
  active: { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  inactive: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  pending: { bg: 'rgba(234,179,8,0.12)', color: '#EAB308' },
};

const statusOptions = ['active', 'inactive', 'pending'];

function normalizeAd(ad) {
  if (!ad) return null;
  return {
    ...ad,
    id: ad.id ?? ad.ad_id ?? ad.advertisement_id ?? ad.advertisementId,
    title: ad.title ?? ad.name ?? 'Untitled Ad',
    description: ad.description ?? ad.body ?? '',
    url: ad.url ?? ad.link ?? '',
    button_name: ad.button_name ?? ad.buttonName ?? 'Learn More',
    status: (ad.status ?? ad.ad_status ?? 'inactive').toLowerCase(),
    created_at: ad.created_at ?? ad.createdAt ?? null,
    deleted_date: ad.deleted_date ?? ad.deletedAt ?? null,
  };
}

function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((item) => item.msg || JSON.stringify(item)).join('; ');
  if (d && typeof d === 'object' && d.msg) return d.msg;
  return err?.message || 'Request failed';
}

export default function AdminAdvertisementsPage() {
  const themeColors = useThemeColors();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' });
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adService.list({ limit: 100 });
      const data = res.data?.data || res.data?.items || res.data || [];
      setAds(Array.isArray(data) ? data.map(normalizeAd).filter(Boolean) : []);
    } catch (err) {
      console.error('Fetch advertisements error:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const openCreate = () => {
    setForm({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' });
    setSelectedAd(null);
    setIsCreateOpen(true);
  };

  const openEdit = (ad) => {
    setSelectedAd(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      url: ad.url || '',
      button_name: ad.button_name || 'Learn More',
      status: ad.status || 'active',
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.url) {
      showToast('Title and URL are required');
      return;
    }

    setActionLoading(true);
    try {
      if (selectedAd) {
        await adService.update(selectedAd.id, form);
        showToast('Advertisement updated');
      } else {
        await adService.create(form);
        showToast('Advertisement created');
      }
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setSelectedAd(null);
      await fetchAds();
    } catch (err) {
      console.error('Save advertisement error:', err);
      showToast(formatApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (ad) => {
    if (!ad?.id) return;

    setActionLoading(true);
    try {
      if (ad.status === 'active') {
        await adService.deactivate(ad.id);
        showToast('Advertisement deactivated');
      } else {
        await adService.activate(ad.id);
        showToast('Advertisement activated');
      }
      await fetchAds();
    } catch (err) {
      console.error('Toggle advertisement status error:', err);
      showToast(formatApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (ad) => {
    if (!ad?.id) return;
    if (!window.confirm('Delete this advertisement permanently?')) return;

    setActionLoading(true);
    try {
      await adService.delete(ad.id);
      showToast('Advertisement deleted');
      await fetchAds();
    } catch (err) {
      console.error('Delete advertisement error:', err);
      showToast(formatApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAds = ads.filter((ad) => {
    const query = search.toLowerCase();
    return (
      ad.title.toLowerCase().includes(query) ||
      ad.description.toLowerCase().includes(query) ||
      ad.url.toLowerCase().includes(query) ||
      ad.button_name.toLowerCase().includes(query)
    );
  });

  const activeCount = ads.filter((ad) => ad.status === 'active').length;
  const inactiveCount = ads.filter((ad) => ad.status === 'inactive').length;
  const pendingCount = ads.filter((ad) => ad.status === 'pending').length;
  const recentCount = ads.filter((ad) => new Date(ad.created_at || 0) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

  const inputStyle = {
    width: '100%',
    background: themeColors.card,
    border: `1px solid ${themeColors.border}`,
    borderRadius: 12,
    padding: '12px 14px',
    color: themeColors.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: themeColors.text, margin: 0 }}>Advertisements</h2>
            <p style={{ color: themeColors.textMuted, margin: '8px 0 0', fontSize: 16 }}>Manage advertisements across the platform with admin controls.</p>
          </div>
          <button onClick={openCreate} style={{ padding: '14px 24px', background: '#0f766e', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 30px rgba(15,118,110,0.18)' }}>
            <Plus size={18} /> Create Advertisement
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {[
            { label: 'Total Ads', value: ads.length, subtitle: 'All ads', color: '#0f766e', icon: <Zap size={22} /> },
            { label: 'Active Ads', value: activeCount, subtitle: 'Live campaigns', color: '#10b981', icon: <ArrowRight size={22} /> },
            { label: 'Inactive Ads', value: inactiveCount, subtitle: 'Paused or archived', color: '#ef4444', icon: <Trash2 size={22} /> },
            { label: 'New Last 30d', value: recentCount, subtitle: 'Recently added', color: '#f59e0b', icon: <Globe size={22} /> },
          ].map((stat) => (
            <div key={stat.label} style={{ borderRadius: 18, background: themeColors.card, border: `1px solid ${themeColors.border}`, padding: 22, display: 'flex', justifyContent: 'space-between', gap: 18, boxShadow: themeColors.isDarkMode ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 18px rgba(15,23,42,0.06)' }}>
              <div>
                <p style={{ margin: 0, color: themeColors.textMuted, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</p>
                <p style={{ margin: '10px 0 0', color: themeColors.text, fontSize: 32, fontWeight: 800 }}>{stat.value}</p>
                <p style={{ margin: '8px 0 0', color: themeColors.textMuted, fontSize: 13 }}>{stat.subtitle}</p>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${stat.color}22`, display: 'grid', placeItems: 'center', color: stat.color }}>{stat.icon}</div>
            </div>
          ))}
        </div>

        <ChartCard title="Advertisement Library">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: '1 1 320px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Search size={18} style={{ color: themeColors.textMuted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ads by title, URL, or button text"
                style={{ ...inputStyle, paddingLeft: 42 }}
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <span style={{ color: themeColors.textMuted, fontSize: 14 }}>{filteredAds.length} ads displayed</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 24, color: themeColors.textMuted }}>Loading advertisements…</div>
          ) : !filteredAds.length ? (
            <div style={{ padding: 24, color: themeColors.textMuted }}>No advertisements found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {filteredAds.map((ad) => {
                const badge = statusColor[ad.status] || statusColor.inactive;
                return (
                  <div key={ad.id} style={{ borderRadius: 18, border: `1px solid ${themeColors.border}`, background: themeColors.card, padding: 20, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ margin: 0, color: themeColors.text, fontSize: 20, fontWeight: 800 }}>{ad.title}</h3>
                          <p style={{ margin: '8px 0 0', color: themeColors.textMuted, fontSize: 14, maxWidth: 680 }}>{ad.description || 'No description provided.'}</p>
                        </div>
                        <span style={{ padding: '8px 14px', borderRadius: 999, background: badge.bg, color: badge.color, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{ad.status}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 18, color: themeColors.textMuted, fontSize: 13 }}>
                        <a href={ad.url || '#'} target="_blank" rel="noreferrer" style={{ color: '#0f766e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowRight size={14} /> {ad.url || 'No link'}</a>
                        <span>Button: <strong>{ad.button_name}</strong></span>
                        <span>Created: <strong>{ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'N/A'}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <button onClick={() => openEdit(ad)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${themeColors.border}`, background: 'transparent', color: themeColors.text, cursor: 'pointer', textAlign: 'left' }}><Edit size={16} style={{ marginRight: 8 }} /> Edit</button>
                        <button onClick={() => handleToggleStatus(ad)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', background: ad.status === 'active' ? '#fef3c7' : '#d1fae5', color: ad.status === 'active' ? '#b45309' : '#065f46', cursor: 'pointer', textAlign: 'left' }}>{ad.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      </div>
                      <button onClick={() => handleDelete(ad)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', cursor: 'pointer', textAlign: 'left' }}><Trash2 size={16} style={{ marginRight: 8 }} /> Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {(isCreateOpen || isEditOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 30px 70px rgba(0,0,0,0.24)', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: themeColors.text }}>{isEditOpen ? 'Edit Advertisement' : 'Create Advertisement'}</h3>
                <p style={{ margin: '8px 0 0', color: themeColors.textMuted, fontSize: 14 }}>{isEditOpen ? 'Update the ad details and save to publish changes.' : 'Publish a new advertisement on the platform.'}</p>
              </div>
              <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedAd(null); }} style={{ background: 'none', border: 'none', color: themeColors.textMuted, cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <div style={{ display: 'grid', gap: 18 }}>
              {[
                { label: 'Title', key: 'title', type: 'text', placeholder: 'Homepage banner' },
                { label: 'Destination URL', key: 'url', type: 'text', placeholder: 'https://dali.example.com' },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'block', marginBottom: 8, color: themeColors.textMuted, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: themeColors.textMuted, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a short description for the advertisement"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: themeColors.textMuted, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Button Label</label>
                <input
                  type="text"
                  value={form.button_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, button_name: e.target.value }))}
                  placeholder="Learn More"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: themeColors.textMuted, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  style={inputStyle}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedAd(null); }} style={{ background: themeColors.card, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: '12px 22px', color: themeColors.textMuted, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={actionLoading} style={{ background: '#0f766e', border: 'none', borderRadius: 12, padding: '12px 22px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{actionLoading ? 'Saving…' : 'Save Advertisement'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f766e', color: '#fff', padding: '14px 18px', borderRadius: 14, boxShadow: '0 12px 28px rgba(15,118,110,0.2)', zIndex: 300 }}>{toast}</div>}
    </DashboardLayout>
  );
}

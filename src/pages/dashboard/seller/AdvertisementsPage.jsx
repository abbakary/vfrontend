import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Plus, Eye, MousePointer, DollarSign, TrendingUp, BarChart3, X, Edit, Trash2, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adService } from '../../../utils/apiService';
import { getCurrentUserId } from '../../../utils/session';

const OWNER_KEYS = ['user_id', 'owner_user_id', 'seller_user_id', 'created_by_user_id', 'userId', 'seller_id'];

function filterAdsForCurrentUser(ads, userId) {
  const raw = Array.isArray(ads) ? ads : [];
  const hasOwnerHints = raw.some((c) => c && OWNER_KEYS.some((k) => c[k] != null));
  if (!hasOwnerHints) return raw;
  return raw.filter((c) => OWNER_KEYS.some((k) => c[k] != null && String(c[k]) === String(userId)));
}

function normalizeAd(ad) {
  if (!ad) return null;
  return {
    ...ad,
    id: ad.id ?? ad.ad_id ?? ad.advertisement_id ?? ad.advertisementId,
    title: ad.title ?? ad.name ?? 'Untitled Advertisement',
    description: ad.description ?? ad.body ?? '',
    url: ad.url ?? ad.link ?? '',
    button_name: ad.button_name ?? ad.buttonName ?? 'Learn More',
    status: (ad.status ?? ad.ad_status ?? 'inactive').toLowerCase(),
    created_at: ad.created_at ?? ad.createdAt ?? null,
  };
}

const tt = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#1a202c',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const fallbackPerformance = [
  { day: 'Mon', impressions: 1800, clicks: 120 },
  { day: 'Tue', impressions: 2200, clicks: 148 },
  { day: 'Wed', impressions: 1950, clicks: 132 },
  { day: 'Thu', impressions: 2600, clicks: 175 },
  { day: 'Fri', impressions: 2100, clicks: 142 },
  { day: 'Sat', impressions: 1400, clicks: 95 },
  { day: 'Sun', impressions: 1350, clicks: 88 },
];

const statusColor = {
  active: { bg: '#f0fff4', color: '#38a169', border: '1px solid #c6f6d5' },
  inactive: { bg: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2' },
  pending: { bg: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7' },
};

export default function AdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    button_name: 'Learn More',
    status: 'active',
  });
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adService.list({ limit: 50 });
      const data = res.data?.data || res.data?.items || res.data || [];
      const userId = await getCurrentUserId();
      setAds(Array.isArray(data) ? filterAdsForCurrentUser(data, userId).map(normalizeAd).filter(Boolean) : []);
    } catch (error) {
      console.error('Failed to fetch advertisements:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreate = () => {
    setEditingAd(null);
    setForm({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' });
    setIsModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      url: ad.url || '',
      button_name: ad.button_name || 'Learn More',
      status: ad.status || 'inactive',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.url) {
      showToast('Title and URL are required');
      return;
    }

    try {
      if (editingAd) {
        await adService.update(editingAd.id, form);
        showToast('Advertisement updated successfully');
      } else {
        await adService.create(form);
        showToast('Advertisement created successfully');
      }
      setIsModalOpen(false);
      setEditingAd(null);
      setForm({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' });
      await fetchAds();
    } catch (error) {
      console.error('Failed to save advertisement:', error);
      showToast('Failed to save advertisement');
    }
  };

  const handleToggleStatus = async (ad) => {
    if (!ad?.id) return;
    try {
      if (ad.status === 'active') {
        await adService.deactivate(ad.id);
        showToast('Advertisement paused');
      } else {
        await adService.activate(ad.id);
        showToast('Advertisement activated');
      }
      await fetchAds();
    } catch (error) {
      console.error('Failed to toggle advertisement status:', error);
      showToast('Failed to toggle advertisement status');
    }
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      await adService.delete(id);
      showToast('Advertisement deleted successfully');
      await fetchAds();
    } catch (error) {
      console.error('Failed to delete advertisement:', error);
      showToast('Failed to delete advertisement');
    }
  };

  const activeCount = ads.filter((ad) => ad.status === 'active').length;
  const inactiveCount = ads.filter((ad) => ad.status !== 'active').length;
  const recentCount = ads.filter((ad) => ad.created_at && new Date(ad.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

  return (
    <DashboardLayout role="seller">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>Advertisements</h2>
            <p style={{ color: '#718096', margin: '8px 0 0', fontSize: 16 }}>Create and manage your ad campaigns with the platform API.</p>
          </div>
          <button onClick={openCreate} style={{ padding: '12px 24px', background: '#FF8C00', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(255,140,0,0.2)' }}>
            <Plus size={20} /> New Advertisement
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          {[
            { label: 'Total Ads', value: ads.length.toLocaleString(), icon: <Zap size={24} />, color: '#FF8C00' },
            { label: 'Active Ads', value: activeCount.toLocaleString(), icon: <Eye size={24} />, color: '#20B2AA' },
            { label: 'Inactive Ads', value: inactiveCount.toLocaleString(), icon: <BarChart3 size={24} />, color: '#f56565' },
            { label: 'Recent Ads', value: recentCount.toLocaleString(), icon: <TrendingUp size={24} />, color: '#805ad5' },
          ].map((card) => (
            <div key={card.label} style={{ borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div>
                <p style={{ fontSize: 13, color: '#718096', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{card.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#1a202c', margin: '8px 0 0' }}>{card.value}</p>
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#a0aec0' }}>Last 30 days</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: `${card.color}15`, color: card.color }}>{card.icon}</div>
            </div>
          ))}
        </div>

        <ChartCard title="Ad Performance Overview">
          <div style={{ width: '100%', height: 240 }}>
            <div style={{ width: '100%', minHeight: 240, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={240} minHeight={240}>
                <BarChart data={fallbackPerformance}>
                  <XAxis dataKey="day" stroke="#718096" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#718096" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="impressions" name="Impressions" fill="#FF8C00" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="clicks" name="Clicks" fill="#20B2AA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>

        <ChartCard title={`Advertisements (${ads.length})`}>
          {loading ? (
            <div style={{ padding: 24, color: '#718096' }}>Loading advertisements…</div>
          ) : !ads.length ? (
            <div style={{ padding: 24, color: '#718096' }}>No advertisements available. Create a new ad to get started.</div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              {ads.map((ad) => {
                const badge = statusColor[ad.status] || statusColor.inactive;
                return (
                  <div key={ad.id} style={{ borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a202c' }}>{ad.title}</p>
                        <p style={{ margin: '10px 0 0', color: '#718096', fontSize: 14, lineHeight: 1.7 }}>{ad.description || 'No description provided.'}</p>
                      </div>
                      <span style={{ padding: '10px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: badge.bg, color: badge.color, border: badge.border }}>{ad.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginTop: 18, color: '#4a5568', fontSize: 13 }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>URL</p>
                        <p style={{ margin: 0, color: '#1a202c', wordBreak: 'break-all' }}>{ad.url || 'None'}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Button</p>
                        <p style={{ margin: 0, color: '#1a202c' }}>{ad.button_name}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Created</p>
                        <p style={{ margin: 0, color: '#1a202c' }}>{ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
                      <button onClick={() => openEdit(ad)} style={{ padding: '10px 18px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, color: '#4338ca', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Edit size={16} /> Edit</button>
                      <button onClick={() => handleToggleStatus(ad)} style={{ padding: '10px 18px', background: ad.status === 'active' ? '#fef3c7' : '#d1fae5', border: `1px solid ${ad.status === 'active' ? '#fde68a' : '#a7f3d0'}`, borderRadius: 12, color: ad.status === 'active' ? '#b45309' : '#047857', cursor: 'pointer', fontWeight: 700 }}>{ad.status === 'active' ? 'Pause' : 'Activate'}</button>
                      <button onClick={() => handleDelete(ad.id)} style={{ padding: '10px 18px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Trash2 size={16} /> Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ color: '#1a202c', margin: 0, fontSize: 24, fontWeight: 800 }}>{editingAd ? 'Edit Advertisement' : 'Create Advertisement'}</h3>
                <p style={{ color: '#718096', margin: '8px 0 0', fontSize: 14 }}>{editingAd ? 'Update your advertisement and save your changes.' : 'Create a new ad to promote your listing.'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingAd(null); setForm({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' }); }} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4a5568', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
                <input type="text" placeholder="Homepage banner" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1a202c', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4a5568', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea rows={4} placeholder="Write a short summary for the ad" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1a202c', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4a5568', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination URL</label>
                <input type="text" placeholder="https://your-site.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1a202c', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4a5568', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Button Label</label>
                <input type="text" placeholder="Learn More" value={form.button_name} onChange={(e) => setForm({ ...form, button_name: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1a202c', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4a5568', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#1a202c', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                  {['active', 'inactive', 'pending'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={() => { setIsModalOpen(false); setEditingAd(null); setForm({ title: '', description: '', url: '', button_name: 'Learn More', status: 'active' }); }} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#4a5568', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '12px 24px', background: '#FF8C00', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 10px rgba(255,140,0,0.2)' }}>{editingAd ? 'Save Changes' : 'Publish Advertisement'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1a202c', borderRadius: 12, padding: '16px 24px', color: '#fff', fontSize: 15, fontWeight: 700, zIndex: 300, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>{toast}</div>
      )}
    </DashboardLayout>
  );
}

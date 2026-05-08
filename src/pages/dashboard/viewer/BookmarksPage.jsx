import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Search, Bookmark, X, Eye, Download, MapPin, Tag } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import { accessService, publicDatasetService, viewService } from '../../../utils/apiService';

export default function BookmarksPage() {
  const themeColors = useThemeColors();
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToRemove, setItemToRemove] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    accessService.myAccess({ limit: 100 })
      .then(res => {
        const data = res.data;
        const list = data?.items || data?.data || data || [];
        setAccesses(Array.isArray(list) ? list : []);
      })
      .catch(() => setAccesses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accesses.filter(a => {
    const title = a.record?.title || a.dataset?.title || a.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleRemove = async () => {
    if (!itemToRemove) return;
    try {
      await accessService.revoke(itemToRemove.id);
      setAccesses(prev => prev.filter(a => a.id !== itemToRemove.id));
    } catch {}
    setItemToRemove(null);
  };

  const inputStyle = {
    background: themeColors.bg, border: `1px solid ${themeColors.border}`,
    borderRadius: 12, padding: '10px 14px', color: themeColors.text,
    fontSize: 14, outline: 'none', transition: 'all 0.2s',
  };

  return (
    <DashboardLayout role="viewer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>My Access & Bookmarks</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>Datasets you have access to</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, background: themeColors.card, padding: '10px 20px', borderRadius: 12, border: `1px solid ${themeColors.border}`, color: themeColors.text, fontWeight: 700 }}>
            <Bookmark size={16} color="#20B2AA" fill="#20B2AA" />
            <span>{accesses.length} saved</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
          <input
            placeholder="Search saved datasets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 44, boxSizing: 'border-box' }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 180, borderRadius: 16, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: themeColors.card, border: `1px solid ${themeColors.border}`, borderRadius: 24, padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: themeColors.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid ${themeColors.border}` }}>
              <Bookmark size={36} color={themeColors.textMuted} />
            </div>
            <p style={{ color: themeColors.textMuted, margin: '0 0 20px', fontSize: 17, fontWeight: 600 }}>
              {searchQuery ? 'No results found' : 'No saved datasets yet'}
            </p>
            <a href="/dashboard/viewer/browse" style={{ padding: '12px 24px', background: '#FF8C00', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
              Explore Datasets
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {filtered.map(a => {
              const record = a.record || a.dataset || {};
              const title = record.title || a.title || `Record #${a.record_id}`;
              const category = record.category?.name || record.category || '—';
              const country = record.country || '—';
              const expiresAt = a.expires_at;
              const isExpired = expiresAt && new Date(expiresAt) < new Date();

              return (
                <div key={a.id} style={{ background: themeColors.card, border: `1px solid ${themeColors.border}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 6, background: isExpired ? 'linear-gradient(90deg,#EF4444,#f87171)' : 'linear-gradient(90deg,#20B2AA,#FF8C00)' }} />
                  <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: themeColors.text, margin: 0, lineHeight: 1.4, flex: 1 }}>{title}</h3>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: isExpired ? '#EF4444' : '#10B981', flexShrink: 0 }}>
                        {isExpired ? 'Expired' : a.access_type || 'Active'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {category !== '—' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: themeColors.textMuted }}>
                          <Tag size={12} /> <span>{category}</span>
                        </div>
                      )}
                      {country !== '—' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: themeColors.textMuted }}>
                          <MapPin size={12} /> <span>{country}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: themeColors.textMuted, marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${themeColors.border}` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {record.total_views || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={12} /> {record.total_downloads || 0}</span>
                      {expiresAt && (
                        <span style={{ marginLeft: 'auto', fontSize: 11 }}>
                          {isExpired ? 'Expired' : `Expires ${new Date(expiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelected(record)}
                      style={{ flex: 1, padding: '9px', background: '#20B2AA', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setItemToRemove(a)}
                      style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 10, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: `1px solid ${themeColors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ color: themeColors.text, margin: 0, fontSize: 20, fontWeight: 800, flex: 1, paddingRight: 16 }}>{selected.title || '—'}</h3>
              <button onClick={() => setSelected(null)} style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            {(selected.description || selected.summary) && (
              <p style={{ color: themeColors.textMuted, fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>{selected.description || selected.summary}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Category', selected.category?.name || selected.category || '—'],
                ['Country', selected.country || '—'],
                ['Region', selected.region || '—'],
                ['Visibility', selected.visibility || '—'],
                ['Views', (selected.total_views || 0).toLocaleString()],
                ['Downloads', (selected.total_downloads || 0).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '12px 14px', background: themeColors.hoverBg, borderRadius: 10, border: `1px solid ${themeColors.border}` }}>
                  <p style={{ fontSize: 10, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: themeColors.text, margin: '3px 0 0' }}>{String(v)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 24px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirm */}
      {itemToRemove && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${themeColors.border}` }}>
            <h3 style={{ color: themeColors.text, margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>Remove Access?</h3>
            <p style={{ color: themeColors.textMuted, margin: '0 0 28px', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to revoke access to this dataset?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setItemToRemove(null)} style={{ padding: '10px 22px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Cancel</button>
              <button onClick={handleRemove} style={{ padding: '10px 22px', background: '#EF4444', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

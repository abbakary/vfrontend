import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Search, History, Trash2, Clock, X, Eye, Download, Tag, MapPin } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import { viewService, downloadService } from '../../../utils/apiService';
import { getCurrentUserId } from '../../../utils/session';

export default function HistoryPage() {
  const themeColors = useThemeColors();
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('views');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const userId = await getCurrentUserId();
        const [viewsRes, downloadsRes] = await Promise.allSettled([
          viewService.byUser(userId, { limit: 100 }),
          downloadService.history({ limit: 100 }),
        ]);

        if (viewsRes.status === 'fulfilled') {
          const data = viewsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setViews(Array.isArray(list) ? list : []);
        }

        if (downloadsRes.status === 'fulfilled') {
          const data = downloadsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setDownloads(Array.isArray(list) ? list : []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const activeList = activeTab === 'views' ? views : downloads;

  const filtered = activeList.filter(item => {
    const title = item.record?.title || item.dataset?.title || item.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group by date
  const grouped = filtered.reduce((acc, item) => {
    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown Date';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const handleRemoveView = async (item) => {
    try {
      await downloadService.delete(item.id);
    } catch {}
    setViews(prev => prev.filter(v => v.id !== item.id));
  };

  const handleRemoveDownload = async (item) => {
    try {
      await downloadService.delete(item.id);
    } catch {}
    setDownloads(prev => prev.filter(d => d.id !== item.id));
  };

  const handleClear = () => {
    if (activeTab === 'views') setViews([]);
    else setDownloads([]);
    setIsClearDialogOpen(false);
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
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>Activity History</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>
              Your dataset views and downloads
            </p>
          </div>
          <button
            onClick={() => setIsClearDialogOpen(true)}
            disabled={activeList.length === 0}
            style={{ padding: '10px 20px', background: activeList.length === 0 ? themeColors.hoverBg : 'rgba(239,68,68,0.1)', border: `1px solid ${activeList.length === 0 ? themeColors.border : '#EF4444'}`, borderRadius: 12, color: activeList.length === 0 ? themeColors.textMuted : '#EF4444', cursor: activeList.length === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: activeList.length === 0 ? 0.5 : 1 }}
          >
            <Trash2 size={16} /> Clear {activeTab === 'views' ? 'Views' : 'Downloads'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: themeColors.hoverBg, padding: 4, borderRadius: 12, width: 'fit-content', border: `1px solid ${themeColors.border}` }}>
          {[
            { key: 'views', label: `Views (${views.length})`, icon: <Eye size={15} /> },
            { key: 'downloads', label: `Downloads (${downloads.length})`, icon: <Download size={15} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: activeTab === tab.key ? themeColors.card : 'transparent', color: activeTab === tab.key ? themeColors.text : themeColors.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: activeTab === tab.key ? `0 2px 8px rgba(0,0,0,0.1)` : 'none', transition: 'all 0.2s' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
          <input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 44, boxSizing: 'border-box' }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 72, borderRadius: 14, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}` }} />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ background: themeColors.card, border: `1px solid ${themeColors.border}`, borderRadius: 24, padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: themeColors.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid ${themeColors.border}` }}>
              <History size={36} color={themeColors.textMuted} />
            </div>
            <p style={{ color: themeColors.textMuted, margin: '0 0 20px', fontSize: 17, fontWeight: 600 }}>
              {searchQuery ? 'No results found' : `No ${activeTab} history yet`}
            </p>
            <a href="/dashboard/viewer/browse" style={{ padding: '12px 24px', background: '#FF8C00', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Explore Datasets
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(grouped).map(([date, items]) => (
              <ChartCard key={date} title={date}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(item => {
                    const record = item.record || item.dataset || {};
                    const title = record.title || item.title || `Record #${item.record_id || item.id}`;
                    const category = record.category?.name || record.category || null;
                    const country = record.country || null;
                    const time = item.created_at
                      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : null;

                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, transition: 'all 0.2s' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: activeTab === 'views' ? 'rgba(32,178,170,0.15)' : 'rgba(255,140,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: activeTab === 'views' ? '#20B2AA' : '#FF8C00' }}>
                          {activeTab === 'views' ? <Eye size={18} /> : <Download size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: themeColors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                            {category && <span style={{ fontSize: 11, color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><Tag size={10} /> {category}</span>}
                            {country && <span style={{ fontSize: 11, color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {country}</span>}
                            {time && <span style={{ fontSize: 11, color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {time}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => setSelected(record)}
                            style={{ padding: '6px 12px', background: '#20B2AA', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => activeTab === 'views' ? handleRemoveView(item) : handleRemoveDownload(item)}
                            style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', cursor: 'pointer', display: 'flex' }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            ))}
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

      {/* Clear Confirm */}
      {isClearDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${themeColors.border}` }}>
            <h3 style={{ color: themeColors.text, margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>Clear History?</h3>
            <p style={{ color: themeColors.textMuted, margin: '0 0 28px', fontSize: 14, lineHeight: 1.6 }}>
              This will clear your {activeTab} history from this view. Are you sure?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsClearDialogOpen(false)} style={{ padding: '10px 22px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Keep History</button>
              <button onClick={handleClear} style={{ padding: '10px 22px', background: '#EF4444', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Yes, Clear</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

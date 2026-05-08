import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { FileText, Download, BarChart3, TrendingUp, Eye, Plus, X, Search, Tag, MapPin } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useThemeColors } from '../../../utils/useThemeColors';
import { useChartColors } from '../../../utils/useChartColors';
import { reportService, publicDatasetService, viewService, downloadService } from '../../../utils/apiService';
import { getCurrentUserId } from '../../../utils/session';

const COLORS = ['#FF8C00', '#20B2AA', '#ED8936', '#4FD1C5', '#cbd5e0'];

export default function ViewerReportsPage() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [reports, setReports] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [viewStats, setViewStats] = useState({ total: 0, byDay: [] });
  const [downloadStats, setDownloadStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [form, setForm] = useState({ title: '', type: 'Analysis', notes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const userId = await getCurrentUserId();
        const [reportsRes, datasetsRes, viewsRes, downloadsRes] = await Promise.allSettled([
          reportService.mine({ limit: 50 }),
          publicDatasetService.list({ limit: 20 }),
          viewService.byUser(userId, { limit: 100 }),
          downloadService.history({ limit: 100 }),
        ]);

        if (reportsRes.status === 'fulfilled') {
          const data = reportsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setReports(Array.isArray(list) ? list : []);
        }

        if (datasetsRes.status === 'fulfilled') {
          const data = datasetsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setDatasets(Array.isArray(list) ? list : []);
        }

        if (viewsRes.status === 'fulfilled') {
          const data = viewsRes.value.data;
          const list = data?.items || data?.data || data || [];
          const arr = Array.isArray(list) ? list : [];
          // Build by-day chart data
          const dayMap = {};
          arr.forEach(v => {
            if (v.created_at) {
              const day = new Date(v.created_at).toLocaleString('default', { weekday: 'short' });
              dayMap[day] = (dayMap[day] || 0) + 1;
            }
          });
          setViewStats({
            total: data?.total || arr.length,
            byDay: Object.entries(dayMap).map(([day, views]) => ({ day, views })),
          });
        }

        if (downloadsRes.status === 'fulfilled') {
          const data = downloadsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setDownloadStats({ total: data?.total || (Array.isArray(list) ? list.length : 0) });
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // Category breakdown from datasets
  const catMap = {};
  datasets.forEach(d => {
    const cat = d.category?.name || d.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(catMap).slice(0, 5).map(([name, value]) => ({ name, value }));

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await reportService.create({
        title: form.title,
        description: form.notes,
        visibility: 'private',
        tags: [],
      });
      const data = res.data?.data || res.data;
      if (data) setReports(prev => [data, ...prev]);
      showToast('Report created successfully');
      setIsCreateOpen(false);
      setForm({ title: '', type: 'Analysis', notes: '' });
      setSelectedDatasetId('');
    } catch {
      showToast('Failed to create report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reportService.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      showToast('Report deleted');
    } catch {
      showToast('Failed to delete report');
    }
  };

  const inputStyle = {
    width: '100%', background: themeColors.bg, border: `1px solid ${themeColors.border}`,
    borderRadius: 12, padding: '12px 16px', color: themeColors.text,
    fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <DashboardLayout role="viewer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>Reports</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>
              Browse and manage dataset reports
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{ padding: '11px 22px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} /> New Report
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          {[
            { label: 'Total Reports', value: loading ? '...' : reports.length, icon: <FileText size={22} />, color: '#FF8C00' },
            { label: 'Datasets Available', value: loading ? '...' : datasets.length, icon: <BarChart3 size={22} />, color: '#20B2AA' },
            { label: 'Total Views', value: loading ? '...' : viewStats.total.toLocaleString(), icon: <Eye size={22} />, color: '#8b5cf6' },
            { label: 'Total Downloads', value: loading ? '...' : downloadStats.total.toLocaleString(), icon: <Download size={22} />, color: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 16, background: themeColors.card, border: `1px solid ${themeColors.border}`, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: '6px 0 0' }}>{s.value}</p>
              </div>
              <div style={{ padding: 10, borderRadius: 12, background: `${s.color}20`, color: s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <ChartCard title="My Viewing Activity">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewStats.byDay.length ? viewStats.byDay : [{ day: 'No Data', views: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="day" stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                  <YAxis stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Bar dataKey="views" fill="#FF8C00" radius={[6, 6, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Datasets by Category">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.length ? categoryData : [{ name: 'No Data', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none"
                  >
                    {(categoryData.length ? categoryData : [{ name: 'No Data', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Legend iconType="circle" formatter={v => <span style={{ color: themeColors.textMuted, fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Reports List */}
        <ChartCard title={`Reports (${reports.length})`}>
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 40 }}>Loading reports...</p>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <FileText size={40} color={themeColors.textMuted} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: themeColors.textMuted, margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>No reports yet</p>
              <button onClick={() => setIsCreateOpen(true)} style={{ padding: '10px 22px', background: '#FF8C00', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Create First Report
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, flexWrap: 'wrap', transition: 'all 0.2s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,140,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FF8C00' }}>
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{ color: themeColors.text, fontWeight: 700, margin: 0, fontSize: 14 }}>{r.title}</p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      {(r.category?.name || r.category) && (
                        <span style={{ fontSize: 12, color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Tag size={11} /> {r.category?.name || r.category}
                        </span>
                      )}
                      {r.created_at && (
                        <span style={{ fontSize: 12, color: themeColors.textMuted }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Eye size={11} /> {r.total_views || 0}
                      </span>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(255,140,0,0.15)', color: '#FF8C00', textTransform: 'uppercase' }}>
                    {r.visibility || 'public'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelected(r)}
                      style={{ padding: '7px 14px', background: '#20B2AA', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{ padding: '7px 9px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 9, color: '#EF4444', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Available Datasets */}
        <ChartCard title="Available Datasets" action={
          <a href="/dashboard/viewer/browse" style={{ fontSize: 13, color: '#20B2AA', fontWeight: 700, textDecoration: 'none' }}>Browse All</a>
        }>
          {datasets.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>{loading ? 'Loading...' : 'No datasets available'}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['Title', 'Category', 'Country', 'Views', 'Downloads', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets.slice(0, 8).map(d => {
                    const categoryName = d.category?.name || (typeof d.category === 'string' ? d.category : '—');
                    const countryName = d.country || d.country_name || '—';
                    return (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: themeColors.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: themeColors.textMuted }}>{categoryName}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: themeColors.textMuted }}>{countryName}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: themeColors.textMuted }}>{d.total_views || 0}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: themeColors.textMuted }}>{d.total_downloads || 0}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => { setSelectedDatasetId(String(d.id)); setForm(f => ({ ...f, title: `${d.title} — Analysis Report` })); setIsCreateOpen(true); }}
                          style={{ padding: '5px 12px', background: 'rgba(32,178,170,0.15)', border: '1px solid #20B2AA', borderRadius: 8, color: '#20B2AA', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Report
                        </button>
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

      {/* Report Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 540, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: `1px solid ${themeColors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ color: themeColors.text, margin: 0, fontSize: 20, fontWeight: 800, flex: 1, paddingRight: 16 }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            {(selected.description || selected.summary) && (
              <p style={{ color: themeColors.textMuted, fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>{selected.description || selected.summary}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                ['Category', selected.category?.name || selected.category || '—'],
                ['Visibility', selected.visibility || '—'],
                ['Views', (selected.total_views || 0).toLocaleString()],
                ['Downloads', (selected.total_downloads || 0).toLocaleString()],
                ['Published', selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'],
                ['Updated', selected.updated_at ? new Date(selected.updated_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '12px 14px', background: themeColors.hoverBg, borderRadius: 10, border: `1px solid ${themeColors.border}` }}>
                  <p style={{ fontSize: 10, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: themeColors.text, margin: '3px 0 0' }}>{String(v)}</p>
                </div>
              ))}
            </div>
            {/* Tags */}
            {Array.isArray(selected.tags) && selected.tags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Tags</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.tags.map((tag, i) => (
                    <span key={i} style={{ padding: '3px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'rgba(255,140,0,0.12)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.2)' }}>
                      {typeof tag === 'string' ? tag : tag.name || String(tag)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 24px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Close</button>
              <button style={{ padding: '10px 24px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={15} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: themeColors.text, margin: 0, fontSize: 22, fontWeight: 800 }}>Create New Report</h3>
              <button onClick={() => setIsCreateOpen(false)} style={{ background: 'none', border: 'none', color: themeColors.textMuted, cursor: 'pointer', padding: 4 }}><X size={22} /></button>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: themeColors.textMuted, marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tanzania Forest Cover Analysis" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: themeColors.textMuted, marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dataset (optional)</label>
              <select value={selectedDatasetId} onChange={e => setSelectedDatasetId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                <option value="">Select a dataset...</option>
                {datasets.map(d => <option key={d.id} value={String(d.id)}>{d.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, color: themeColors.textMuted, marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes & Objectives</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="What insights are you looking for?"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsCreateOpen(false)} style={{ padding: '11px 22px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.title.trim()} style={{ padding: '11px 22px', background: saving || !form.title.trim() ? themeColors.textMuted : '#FF8C00', border: 'none', borderRadius: 12, color: '#fff', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                {saving ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: themeColors.isDarkMode ? '#1e293b' : '#1a202c', color: '#fff', borderRadius: 12, padding: '14px 22px', fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}

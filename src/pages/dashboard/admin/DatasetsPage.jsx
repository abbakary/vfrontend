import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Database, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Plus, X, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useThemeColors } from '../../../utils/useThemeColors';
import { useChartColors } from '../../../utils/useChartColors';
import { datasetService, categoryService } from '../../../utils/apiService';

const COLORS = ['#FF8C00', '#20B2AA', '#ED8936', '#4FD1C5', '#F6AD55', '#CBD5E0'];

/** GET /datasets/{id} returns { message, data } or a raw object depending on version. */
function pickDatasetPayload(res) {
  const body = res?.data;
  if (body == null || typeof body !== 'object') return null;
  if ('data' in body && body.data != null && typeof body.data === 'object') return body.data;
  return body;
}

function categoryLabel(dataset, categories) {
  const nested =
    dataset?.category?.name ??
    (typeof dataset?.category === 'string' ? dataset.category : null) ??
    dataset?.category_name;
  if (nested) return nested;
  const id = dataset?.category_id;
  if (id == null || !Array.isArray(categories)) return null;
  const cat = categories.find((c) => Number(c.id) === Number(id));
  return cat?.name ?? null;
}

function countryLabel(dataset) {
  return (
    dataset?.country ||
    dataset?.country_name ||
    (dataset?.country_code ? String(dataset.country_code).toUpperCase() : null)
  );
}

function regionLabel(dataset) {
  return dataset?.region || dataset?.spatial_coverage || null;
}

function datasetApprovalStatus(dataset) {
  return dataset?.approval_status || dataset?.status || dataset?.review_status || 'pending';
}

const Badge = ({ children, style }) => (
  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>{children}</span>
);

const StatusBadge = ({ status }) => {
  if (status === 'approved') return <Badge style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}><CheckCircle size={12} /> Approved</Badge>;
  if (status === 'pending') return <Badge style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}><Clock size={12} /> Pending</Badge>;
  return <Badge style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}><XCircle size={12} /> Rejected</Badge>;
};

const Modal = ({ open, onClose, title, children, footer, themeColors }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: themeColors.card, borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${themeColors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
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

export default function AdminDatasetsPage() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [datasets, setDatasets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const [datasetsRes, catsRes] = await Promise.allSettled([
        datasetService.list({ limit: 100 }),
        categoryService.list(),
      ]);

      if (datasetsRes.status === 'fulfilled') {
        const data = datasetsRes.value.data;
        const list = data?.items || data?.data || data || [];
        setDatasets(Array.isArray(list) ? list : []);
        setTotal(data?.total || list.length);
      }

      if (catsRes.status === 'fulfilled') {
        const data = catsRes.value.data;
        const list = data?.items || data?.data || data || [];
        setCategories(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Fetch datasets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDatasets(); }, []);

  useEffect(() => {
    if (!isViewOpen || selected?.id == null) {
      setViewDetail(null);
      setViewDetailLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setViewDetailLoading(true);
      setViewDetail(null);
      try {
        const res = await datasetService.get(selected.id);
        if (cancelled) return;
        const detail = pickDatasetPayload(res);
        setViewDetail(detail && typeof detail === 'object' ? detail : null);
      } catch (err) {
        if (!cancelled) {
          console.error('Fetch dataset detail error:', err);
          setViewDetail(null);
        }
      } finally {
        if (!cancelled) setViewDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isViewOpen, selected?.id]);

  const filtered = datasets.filter((d) => {
    const matchSearch = (d.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const st = datasetApprovalStatus(d);
    const matchStatus = statusFilter === 'all' || st === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await datasetService.delete(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
      fetchDatasets();
    } catch (err) {
      console.error('Delete dataset error:', err);
    }
  };

  // Stats
  const approvedCount = datasets.filter((d) => datasetApprovalStatus(d) === 'approved').length;
  const pendingCount = datasets.filter((d) => datasetApprovalStatus(d) === 'pending').length;
  const totalViews = datasets.reduce((s, d) => s + (d.total_views || 0), 0);
  const totalDownloads = datasets.reduce((s, d) => s + (d.total_downloads || 0), 0);

  // Category chart
  const catMap = {};
  datasets.forEach((d) => {
    const cat = categoryLabel(d, categories) || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catData = Object.entries(catMap).slice(0, 6).map(([name, value]) => ({ name, value }));

  // Status chart
  const statusData = [
    { name: 'Approved', value: approvedCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Rejected', value: datasets.filter((d) => datasetApprovalStatus(d) === 'rejected').length },
  ].filter(s => s.value > 0);

  const inputStyle = { background: themeColors.bg, border: `1px solid ${themeColors.border}`, borderRadius: 10, padding: '10px 14px', color: themeColors.text, fontSize: 14, outline: 'none' };
  const btnPrimary = { padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#FF8C00', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 };
  const btnOutline = { ...btnPrimary, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted };
  const btnDanger = { ...btnPrimary, background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#EF4444' };

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>Datasets Management</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14 }}>{loading ? 'Loading...' : `${total} total datasets`}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          {[
            { label: 'Total', value: total, color: '#FF8C00', icon: <Database size={22} /> },
            { label: 'Approved', value: approvedCount, color: '#10B981', icon: <CheckCircle size={22} /> },
            { label: 'Pending', value: pendingCount, color: '#F59E0B', icon: <Clock size={22} /> },
            { label: 'Total Views', value: totalViews.toLocaleString(), color: '#20B2AA', icon: <Eye size={22} /> },
          ].map(s => (
            <div key={s.label} style={{ background: themeColors.card, borderRadius: 16, padding: 20, border: `1px solid ${themeColors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: '6px 0 0' }}>{loading ? '...' : s.value}</p>
                </div>
                <div style={{ padding: 10, borderRadius: 12, background: `${s.color}20`, color: s.color }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <ChartCard title="Datasets by Category">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData.length ? catData : [{ name: 'No Data', value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={11} axisLine={false} tickLine={false} fontWeight={600} />
                  <YAxis stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Bar dataKey="value" fill="#FF8C00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Status Distribution">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData.length ? statusData : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={6} dataKey="value" stroke="none">
                    {(statusData.length ? statusData : [{ name: 'No Data', value: 1 }]).map((_, i) => (
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

        {/* Table */}
        <ChartCard title="All Datasets" action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
              <input placeholder="Search datasets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 38, width: 220 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ ...inputStyle, minWidth: 130, cursor: 'pointer', appearance: 'none' }}>
              <option value="all">All Status</option>
              {['approved', 'pending', 'rejected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        }>
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 40 }}>Loading datasets...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 40 }}>No datasets found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['Dataset', 'Category', 'Visibility', 'Views', 'Downloads', 'Sales', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ padding: 8, background: 'rgba(255,140,0,0.1)', borderRadius: 10 }}><Database size={16} color="#FF8C00" /></div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: themeColors.text, margin: 0, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                            <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>
                              {[countryLabel(d), regionLabel(d)].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{categoryLabel(d, categories) || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge style={{ background: d.visibility === 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: d.visibility === 'public' ? '#10B981' : '#F59E0B' }}>{d.visibility || 'public'}</Badge>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.total_views || 0}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.total_downloads || 0}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#20B2AA' }}>{d.total_sales || 0}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={datasetApprovalStatus(d)} /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setSelected(d); setViewDetail(null); setIsViewOpen(true); }} style={{ padding: '6px 8px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 8, color: themeColors.textMuted, cursor: 'pointer', display: 'flex' }}>
                            <Eye size={15} />
                          </button>
                          <button onClick={() => { setSelected(d); setIsDeleteOpen(true); }} style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>

      {/* View Modal */}
      <Modal open={isViewOpen} onClose={() => { setIsViewOpen(false); setViewDetail(null); }} title="Dataset Details" themeColors={themeColors}
        footer={[<button key="c" onClick={() => { setIsViewOpen(false); setViewDetail(null); }} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted }}>Close</button>]}>
        {selected && (() => {
          const merged = { ...selected, ...(viewDetail || {}) };
          const cat = categoryLabel(merged, categories);
          const country = countryLabel(merged);
          const region = regionLabel(merged);
          const approval = datasetApprovalStatus(merged);
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {viewDetailLoading && (
              <p style={{ margin: 0, fontSize: 13, color: themeColors.textMuted }}>Refreshing details from server…</p>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ padding: 14, background: 'rgba(255,140,0,0.1)', borderRadius: 12 }}><Database size={36} color="#FF8C00" /></div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: themeColors.text, margin: 0, fontSize: 20, fontWeight: 800 }}>{merged.title}</h3>
                <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14 }}>{merged.summary || merged.description || 'No description'}</p>
              </div>
              <StatusBadge status={approval} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Category', cat || '—'],
                ['Country', country || '—'],
                ['Region', region || '—'],
                ['Visibility', merged.visibility || '—'],
                ['Views', merged.total_views ?? 0],
                ['Downloads', merged.total_downloads ?? 0],
                ['Sales', merged.total_sales ?? 0],
                ['Created', merged.created_at ? new Date(merged.created_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: 14, background: themeColors.hoverBg, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
                  <p style={{ fontSize: 11, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: themeColors.text, margin: '4px 0 0' }}>{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Delete Modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Dataset" themeColors={themeColors}
        footer={[
          <button key="c" onClick={() => setIsDeleteOpen(false)} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted }}>Cancel</button>,
          <button key="d" onClick={handleDelete} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#EF4444' }}>Delete</button>
        ]}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 12, marginBottom: 8 }}>
          <AlertTriangle size={28} color="#EF4444" />
          <p style={{ color: themeColors.text, margin: 0, fontSize: 15 }}>
            Are you sure you want to delete <strong>"{selected?.title}"</strong>? This cannot be undone.
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

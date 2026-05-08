import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import DatasetCard from '../lib/DatasetCard';
import { Search, Download, Eye, ShoppingCart, DollarSign, Calendar, FileText, X } from 'lucide-react';
import { orderService, publicDatasetService } from '../../../utils/apiService';

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const datasetIdsFromOrder = (order) => {
  const ids = new Set();
  if (order?.dataset_id != null) ids.add(order.dataset_id);
  if (Array.isArray(order?.items)) {
    order.items.forEach((it) => {
      if (it?.dataset_id != null) ids.add(it.dataset_id);
    });
  }
  return [...ids];
};

const findDatasetForOrder = (order, datasets) => {
  for (const id of datasetIdsFromOrder(order)) {
    const d = datasets.find((x) => x.id === id || String(x.id) === String(id));
    if (d) return d;
  }
  return null;
};

const Badge = ({ children, style }) => <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em', ...style }}>{children}</span>;
const Input = ({ style, ...p }) => <input style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', color: '#1a202c', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', ...style }} {...p} />;
const Sel = ({ value, onChange, children, style }) => <select value={value} onChange={e => onChange(e.target.value)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', color: '#1a202c', fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none', ...style }}>{children}</select>;

const statusStyle = s => s === 'completed'
  ? { iconBg: '#f0fff4', iconColor: '#38a169', badgeBg: '#f0fff4', badgeColor: '#38a169', border: '1px solid #c6f6d5' }
  : s === 'pending'
  ? { iconBg: '#fffaf0', iconColor: '#dd6b20', badgeBg: '#fffaf0', badgeColor: '#dd6b20', border: '1px solid #feebc8' }
  : { iconBg: '#fff5f5', iconColor: '#e53e3e', badgeBg: '#fff5f5', badgeColor: '#e53e3e', border: '1px solid #fed7d7' };

// Map purchases to allDatasets for card display
// const purchasedDatasetIds = { '1': 'd1', '2': 'd2', '3': 'd4', '4': 'd6', '5': 'd8' };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [allDatasets, setAllDatasets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ordersRes = await orderService.mine({ limit: 100 }).catch(() => ({ data: null }));
        const orders = extractList(ordersRes.data);
        setPurchases(orders);

        const idSet = new Set();
        orders.forEach((o) => datasetIdsFromOrder(o).forEach((id) => idSet.add(id)));
        const ids = [...idSet];
        const datasets = (
          await Promise.all(
            ids.map((id) =>
              publicDatasetService.get(id).then((r) => r.data?.data || r.data).catch(() => null)
            )
          )
        ).filter(Boolean);
        setAllDatasets(datasets);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setPurchases([]);
        setAllDatasets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = purchases.filter(p => {
    const dataset = findDatasetForOrder(p, allDatasets);
    const title = dataset?.title || p.dataset_title || '';
    const ms = title.toLowerCase().includes(searchQuery.toLowerCase());
    const mst = statusFilter === 'all' || p.status === statusFilter;
    return ms && mst;
  });

  const totalSpent = purchases.filter(p => p.status === 'completed').reduce((s, p) => s + (p.total_price || p.amount || 0), 0);
  const completedCount = purchases.filter(p => p.status === 'completed').length;
  const pendingCount = purchases.filter(p => p.status === 'pending').length;

  // Get purchased datasets for card display
  const purchasedDatasets = (() => {
    const out = [];
    const seen = new Set();
    purchases
      .filter((p) => p.status === 'completed')
      .forEach((p) => {
        datasetIdsFromOrder(p).forEach((id) => {
          const d = allDatasets.find((x) => x.id === id || String(x.id) === String(id));
          if (d && !seen.has(d.id)) {
            seen.add(d.id);
            out.push(d);
          }
        });
      });
    return out;
  })();

  return (
    <DashboardLayout role="buyer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 8 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>My Purchases</h2>
          <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 16, fontWeight: 500 }}>View and manage your dataset purchases</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
          {[
            { label: 'Total Purchases', value: completedCount, icon: <ShoppingCart size={28} />, color: '#20B2AA' },
            { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, icon: <DollarSign size={28} />, color: '#FF8C00' },
            { label: 'Pending', value: pendingCount, icon: <Calendar size={28} />, color: '#dd6b20' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', padding: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: 14, borderRadius: 12, background: `${s.color}15`, color: s.color }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 13, color: '#718096', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#1a202c', margin: '4px 0 0' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Purchased Datasets as Cards */}
        <ChartCard title="Your Purchased Datasets">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading datasets...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {purchasedDatasets.map(d => (
                <DatasetCard key={d.id} dataset={d}
                  onAction={() => {}}
                  actionLabel="Download"
                  actionStyle={{ background: '#20B2AA', color: '#fff' }}
                />
              ))}
            </div>
          )}
        </ChartCard>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <Input placeholder="Search purchases..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', paddingLeft: 44, boxSizing: 'border-box' }} />
          </div>
          <Sel value={statusFilter} onChange={setStatusFilter} style={{ minWidth: 160 }}>
            <option value="all">All Status</option>
            {['completed','pending','refunded'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </Sel>
        </div>

        {/* Purchase List */}
        <ChartCard title={`Purchase History (${filtered.length})`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading purchases...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(p => {
                const ss = statusStyle(p.status || 'pending');
                const dataset = findDatasetForOrder(p, allDatasets);
                const title = dataset?.title || p.dataset_title || 'Unknown Dataset';
                const amount = p.total_price || p.amount || 0;
                const date = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown Date';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', flexWrap: 'wrap', gap: 24, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: ss.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: ss.border }}>
                        <FileText size={28} color={ss.iconColor} />
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#1a202c', margin: 0 }}>{title}</p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: '#718096', fontWeight: 600 }}>
                          <span>Purchased {date}</span>
                          <span style={{ color: '#edf2f7' }}>|</span>
                          <span style={{ color: '#20B2AA', fontWeight: 800 }}>${amount}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Badge style={{ background: ss.badgeBg, color: ss.badgeColor, border: ss.border }}>{p.status || 'pending'}</Badge>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {p.status === 'completed' && (
                          <button style={{ padding: '10px 16px', background: '#20B2AA', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 6px rgba(32,178,170,0.2)' }}>
                            <Download size={16} /> Download
                          </button>
                        )}
                        <button onClick={() => setSelectedPurchase(p)} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: '#4a5568', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
             {filtered.length === 0 && (
               <div style={{ textAlign: 'center', padding: '64px 0' }}>
                 <div style={{ padding: 24, borderRadius: '50%', background: '#f8fafc', display: 'inline-block', marginBottom: 20 }}>
                   <ShoppingCart size={48} color="#cbd5e0" />
                 </div>
                 <p style={{ color: '#718096', margin: 0, fontSize: 16, fontWeight: 600 }}>No purchases found matching your criteria</p>
               </div>
             )}
          </div>
          )}
        </ChartCard>
      </div>

      {/* Details Modal */}
      {selectedPurchase && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: '#1a202c', margin: 0, fontSize: 24, fontWeight: 800 }}>Purchase Details</h3>
              <button onClick={() => setSelectedPurchase(null)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <h4 style={{ color: '#1a202c', margin: '0 0 16px', fontSize: 20, fontWeight: 800 }}>
                {findDatasetForOrder(selectedPurchase, allDatasets)?.title || selectedPurchase.dataset_title || `Order #${selectedPurchase.id}`}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
                {[['Purchase ID', `#${selectedPurchase.id}`], ['Date', selectedPurchase.created_at ? new Date(selectedPurchase.created_at).toLocaleDateString() : '—'], ['Amount', `$${Number(selectedPurchase.total_price || selectedPurchase.amount || 0).toLocaleString()}`], ['Status', selectedPurchase.status || '—']].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ color: '#718096', margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{k}</p>
                    <p style={{ color: '#1a202c', fontWeight: 700, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setSelectedPurchase(null)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#4a5568', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>Close</button>
              {selectedPurchase.status === 'completed' && (
                <button style={{ padding: '12px 24px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(32,178,170,0.2)' }}>
                  <Download size={18} /> Download Dataset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { DollarSign, TrendingUp, Users, BarChart3, FileText } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useThemeColors } from '../../../utils/useThemeColors';
import { useChartColors } from '../../../utils/useChartColors';
import { revenueService, userService, datasetService, paymentService } from '../../../utils/apiService';

const COLORS = ['#FF8C00', '#20B2AA', '#ED8936', '#4FD1C5'];

export default function AdminRevenueReportsPage() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [summary, setSummary] = useState(null);
  const [revenues, setRevenues] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalUsers: 0, totalDatasets: 0, totalPayments: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, revenueRes, paymentsRes, usersRes, datasetsRes] = await Promise.allSettled([
          revenueService.summary(),
          revenueService.list({ limit: 50 }),
          paymentService.admin({ limit: 50 }),
          userService.list({ limit: 1 }),
          datasetService.list({ limit: 1 }),
        ]);

        if (summaryRes.status === 'fulfilled') {
          const data = summaryRes.value.data;
          setSummary(data);
          setStats(prev => ({ ...prev, totalRevenue: data?.total_revenue || data?.total || 0 }));
        }

        if (revenueRes.status === 'fulfilled') {
          const data = revenueRes.value.data;
          const list = data?.items || data?.data || data || [];
          setRevenues(Array.isArray(list) ? list : []);
        }

        if (paymentsRes.status === 'fulfilled') {
          const data = paymentsRes.value.data;
          const list = data?.items || data?.data || data || [];
          const arr = Array.isArray(list) ? list : [];
          setPayments(arr);
          setStats(prev => ({ ...prev, totalPayments: data?.total || arr.length }));
        }

        if (usersRes.status === 'fulfilled') {
          const data = usersRes.value.data;
          setStats(prev => ({ ...prev, totalUsers: data?.total || 0 }));
        }

        if (datasetsRes.status === 'fulfilled') {
          const data = datasetsRes.value.data;
          setStats(prev => ({ ...prev, totalDatasets: data?.total || 0 }));
        }
      } catch (err) {
        console.error('Revenue page error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Build monthly chart from revenues
  const monthMap = {};
  revenues.forEach(r => {
    if (r.created_at) {
      const month = new Date(r.created_at).toLocaleString('default', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + (r.amount || r.platform_fee || 0);
    }
  });
  const monthlyData = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));

  // Payment status breakdown
  const statusMap = {};
  payments.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
  const paymentStatusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Revenue by record type
  const typeMap = {};
  revenues.forEach(r => {
    const type = r.record_type || 'other';
    typeMap[type] = (typeMap[type] || 0) + (r.amount || r.platform_fee || 0);
  });
  const revenueByType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>Revenue Reports</h2>
            <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>Platform-wide revenue analytics and financial insights</p>
          </div>
          <button style={{ padding: '10px 22px', background: '#FF8C00', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Export Report
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          <StatCard title="Total Revenue" value={loading ? '...' : `$${Number(stats.totalRevenue).toLocaleString()}`} change={22.4} icon={<DollarSign size={24} />} />
          <StatCard title="Total Payments" value={loading ? '...' : stats.totalPayments} change={13.5} icon={<TrendingUp size={24} />} />
          <StatCard title="Total Users" value={loading ? '...' : stats.totalUsers.toLocaleString()} change={8.9} icon={<Users size={24} />} />
          <StatCard title="Total Datasets" value={loading ? '...' : stats.totalDatasets.toLocaleString()} change={6.2} icon={<BarChart3 size={24} />} />
        </div>

        {/* Revenue Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            {[
              { label: 'Platform Fee', value: summary.total_platform_fee || summary.platform_fee || 0 },
              { label: 'Seller Earnings', value: summary.total_seller_earnings || summary.seller_earnings || 0 },
              { label: 'Subscriptions', value: summary.subscription_revenue || 0 },
              { label: 'Refunds', value: summary.total_refunds || 0 },
            ].map(s => (
              <div key={s.label} style={{ padding: 20, borderRadius: 16, background: themeColors.card, border: `1px solid ${themeColors.border}` }}>
                <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#FF8C00', margin: '8px 0 0' }}>${Number(s.value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <ChartCard title="Monthly Revenue">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData.length ? monthlyData : [{ month: 'No Data', revenue: 0 }]}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                  <YAxis stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartColors.tooltipStyle} formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF8C00" fill="url(#revGrad2)" strokeWidth={4} dot={{ fill: '#FF8C00', r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Revenue by Type">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByType.length ? revenueByType : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                    {(revenueByType.length ? revenueByType : [{ name: 'No Data', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltipStyle} formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} formatter={v => <span style={{ color: themeColors.textMuted, fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Payment Status */}
        <ChartCard title="Payment Status Breakdown">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStatusData.length ? paymentStatusData : [{ name: 'No Data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                <YAxis stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} fontWeight={600} />
                <Tooltip contentStyle={chartColors.tooltipStyle} />
                <Bar dataKey="value" fill="#20B2AA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Recent Payments Table */}
        <ChartCard title="Recent Payments">
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>Loading...</p>
          ) : payments.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>No payments found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['Payment ID', 'User', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>#{p.id}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: themeColors.text }}>{p.user?.full_name || p.user?.email || `#${p.user_id}`}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#20B2AA' }}>${Number(p.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted, textTransform: 'capitalize' }}>{p.payment_method || p.method || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: p.status === 'completed' || p.status === 'success' ? 'rgba(16,185,129,0.15)' : p.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: p.status === 'completed' || p.status === 'success' ? '#10B981' : p.status === 'pending' ? '#F59E0B' : '#EF4444' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';
import { Users, Database, DollarSign, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useThemeColors } from '../../utils/useThemeColors';
import { useChartColors } from '../../utils/useChartColors';
import { userService, datasetService, revenueService, subscriptionService } from '../../utils/apiService';

function dashboardUserStatus(user) {
  const s = String(user?.status || '').toLowerCase();
  if (s) return s;
  if (user?.is_active === true) return 'active';
  if (user?.is_active === false) return 'inactive';
  return 'pending';
}

function dashboardStatusBadgeStyle(status) {
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

const COLORS = ['#FF8C00', '#20B2AA', '#f59e0b', '#38b2ac', '#ed8936'];
const Badge = ({ children, style }) => (
  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...style }}>{children}</span>
);

export default function AdminDashboard() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [stats, setStats] = useState({ totalUsers: 0, totalDatasets: 0, totalRevenue: 0, activeUsers: 0 });
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, datasetsRes, revenueRes, subsRes] = await Promise.allSettled([
          userService.list({ limit: 100 }),
          datasetService.list({ limit: 100 }),
          revenueService.summary(),
          subscriptionService.admin({ limit: 10 }),
        ]);

        if (usersRes.status === 'fulfilled') {
          const data = usersRes.value.data;
          const list = data?.items || data?.data || data || [];
          setUsers(Array.isArray(list) ? list : []);
          const activeCount = Array.isArray(list)
            ? list.filter((u) => dashboardUserStatus(u) === 'active').length
            : 0;
          setStats(prev => ({ ...prev, totalUsers: data?.total || list.length, activeUsers: activeCount }));
        }

        if (datasetsRes.status === 'fulfilled') {
          const data = datasetsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setDatasets(Array.isArray(list) ? list.slice(0, 8) : []);
          setStats(prev => ({ ...prev, totalDatasets: data?.total || list.length }));
        }

        if (revenueRes.status === 'fulfilled') {
          const data = revenueRes.value.data;
          setRevenueSummary(data);
          setStats(prev => ({ ...prev, totalRevenue: data?.total_revenue || data?.total || 0 }));
        }

        if (subsRes.status === 'fulfilled') {
          const data = subsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setSubscriptions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Admin dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Build chart data from real data
  const revenueChartData = revenueSummary?.monthly_breakdown ||
    revenueSummary?.by_month ||
    [
      { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: 0 },
      { month: 'Apr', revenue: 0 }, { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
    ];

  const userGrowthData = revenueSummary?.user_growth || [
    { month: 'Jan', users: 0 }, { month: 'Feb', users: 0 }, { month: 'Mar', users: 0 },
    { month: 'Apr', users: 0 }, { month: 'May', users: 0 }, { month: 'Jun', users: 0 },
  ];

  // Dataset category breakdown from real datasets
  const categoryMap = {};
  datasets.forEach(d => {
    const cat = d.category?.name || d.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const roleMap = {};
  users.forEach(u => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Welcome Banner */}
        <div style={{ borderRadius: 16, backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}`, padding: '32px', boxShadow: themeColors.isDarkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#FF8C00' }} />
          <h2 style={{ fontSize: 32, fontWeight: 800, color: themeColors.text, margin: 0, letterSpacing: '-0.02em' }}>
            Welcome, <span style={{ color: '#FF8C00' }}>Admin!</span>
          </h2>
          <p style={{ color: themeColors.textMuted, marginTop: 8, marginBottom: 0, fontSize: 16, fontWeight: 500 }}>
            {loading ? 'Loading platform overview...' : 'Here is your platform overview'}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          <StatCard title="Total Users" value={loading ? '...' : stats.totalUsers.toLocaleString()} change={12.5} icon={<Users size={24} />} />
          <StatCard title="Total Datasets" value={loading ? '...' : stats.totalDatasets.toLocaleString()} change={8.3} icon={<Database size={24} />} />
          <StatCard title="Total Revenue" value={loading ? '...' : `$${Number(stats.totalRevenue).toLocaleString()}`} change={15.2} icon={<DollarSign size={24} />} />
          <StatCard title="Active Users" value={loading ? '...' : stats.activeUsers.toLocaleString()} change={5.8} icon={<TrendingUp size={24} />} />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <ChartCard title="User Growth">
            <div style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartColors.text} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Bar dataKey="users" fill="#20B2AA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Revenue Overview">
            <div style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartColors.text} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartColors.tooltipStyle} formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF8C00" fill="url(#revGrad)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Stats + Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <ChartCard title="Platform Statistics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, color: '#FF8C00' },
                { label: 'Active Users', value: stats.activeUsers, color: '#20B2AA' },
                { label: 'Total Datasets', value: stats.totalDatasets, color: '#f59e0b' },
                { label: 'Active Subscriptions', value: subscriptions.filter(s => s.status === 'active').length, color: '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${themeColors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: s.color }} />
                    <span style={{ color: themeColors.textMuted, fontSize: 14, fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <span style={{ color: themeColors.text, fontWeight: 700 }}>{loading ? '...' : s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Dataset by Category">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData.length ? categoryData : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {(categoryData.length ? categoryData : [{ name: 'No Data', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Legend formatter={v => <span style={{ color: themeColors.textMuted, fontSize: 11, fontWeight: 600 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Recent Datasets */}
        <ChartCard title="Recent Datasets" action={
          <a href="/dashboard/admin/datasets" style={{ fontSize: 14, color: '#60a5fa', textDecoration: 'none' }}>View All</a>
        }>
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>Loading datasets...</p>
          ) : datasets.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>No datasets found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['Title', 'Category', 'Visibility', 'Views', 'Downloads', 'Created'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets.slice(0, 6).map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: themeColors.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.category?.name || d.category || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge style={{ background: d.visibility === 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: d.visibility === 'public' ? '#10B981' : '#F59E0B' }}>{d.visibility || 'public'}</Badge>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.total_views || 0}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.total_downloads || 0}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* User Management Preview */}
        <ChartCard title="User Management" action={
          <a href="/dashboard/admin/users" style={{ fontSize: 14, color: '#3B82F6', textDecoration: 'none' }}>View All</a>
        }>
          {loading ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>Loading users...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['User', 'Role', 'Status', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 6).map((user) => {
                    const st = dashboardUserStatus(user);
                    const stStyle = dashboardStatusBadgeStyle(st);
                    return (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #FF8C00, #ed8936)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(user.full_name || user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: themeColors.text, margin: 0 }}>{user.full_name || user.name || '—'}</p>
                            <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Badge style={{ background: themeColors.bgSecondary || themeColors.hoverBg, color: themeColors.textMuted, textTransform: 'capitalize' }}>{user.role}</Badge>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Badge style={{
                          background: stStyle.background,
                          color: stStyle.color,
                          textTransform: 'capitalize',
                        }}>
                          {st}
                        </Badge>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, color: themeColors.textMuted, fontWeight: 500 }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* Subscriptions Preview */}
        <ChartCard title="Recent Subscriptions" action={
          <a href="/dashboard/admin/subscriptions" style={{ fontSize: 14, color: '#8b5cf6', textDecoration: 'none' }}>View All</a>
        }>
          {subscriptions.length === 0 ? (
            <p style={{ color: themeColors.textMuted, textAlign: 'center', padding: 32 }}>{loading ? 'Loading...' : 'No subscriptions found'}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    {['User', 'Plan', 'Status', 'Start Date', 'End Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.slice(0, 5).map(sub => (
                    <tr key={sub.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: themeColors.text }}>{sub.user?.full_name || sub.user?.email || `User #${sub.user_id}`}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{sub.plan?.name || `Plan #${sub.plan_id}`}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge style={{ background: sub.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: sub.status === 'active' ? '#10B981' : '#F59E0B' }}>{sub.status}</Badge>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: themeColors.textMuted }}>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}</td>
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

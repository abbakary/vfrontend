import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import DatasetCard from '../lib/DatasetCard';
import { DollarSign, TrendingUp, ShoppingCart, AlertTriangle, Plus, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { publicDatasetService } from '../../../utils/apiService';

const tt = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#1a202c', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

const monthlySpending = [
  { month: 'Jan', spent: 299, budget: 1000 },
  { month: 'Feb', spent: 798, budget: 1000 },
  { month: 'Mar', spent: 499, budget: 1000 },
  { month: 'Apr', spent: 1248, budget: 1500 },
  { month: 'May', spent: 349, budget: 1000 },
  { month: 'Jun', spent: 899, budget: 1000 },
];

const categorySpending = [
  { name: 'Computer Science', value: 1798, color: '#FF8C00' },
  { name: 'Finance', value: 599, color: '#20B2AA' },
  { name: 'Healthcare', value: 499, color: '#ED8936' },
  { name: 'Agriculture', value: 199, color: '#4FD1C5' },
  { name: 'Other', value: 997, color: '#cbd5e0' },
];

export default function BudgetTrackerPage() {
  const [budgetLimit, setBudgetLimit] = useState(10000);
  const [budgetUsed] = useState(6800);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [toast, setToast] = useState('');
  const [allDatasets, setAllDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const { data } = await publicDatasetService.list({ limit: 100 });
        const datasetsArray = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAllDatasets(datasetsArray);
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
        setAllDatasets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const remaining = budgetLimit - budgetUsed;
  const pct = Math.round((budgetUsed / budgetLimit) * 100);
  const budgetData = [{ name: 'Used', value: budgetUsed }, { name: 'Remaining', value: remaining }];
  const COLORS = ['#FF8C00', '#20B2AA'];

  const affordableDatasets = allDatasets.filter(d => (d.status === 'approved' || d.visibility === 'public') && parseFloat(d.price || 0) <= remaining).slice(0, 4);

  return (
    <DashboardLayout role="buyer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>Budget Tracker</h2>
            <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 16, fontWeight: 500 }}>Monitor your dataset spending and budget allocation</p>
          </div>
          <button onClick={() => setIsSetBudgetOpen(true)} style={{ padding: '12px 24px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px rgba(32,178,170,0.2)', transition: 'all 0.2s' }}>
            <Plus size={18} /> Set Budget Limit
          </button>
        </div>

        {/* Budget Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          {[
            { label: 'Total Budget', value: `$${budgetLimit.toLocaleString()}`, color: '#1a202c', icon: <DollarSign size={24} />, bg: '#fff' },
            { label: 'Amount Spent', value: `$${budgetUsed.toLocaleString()}`, color: '#FF8C00', icon: <ShoppingCart size={24} />, bg: '#fff' },
            { label: 'Remaining', value: `$${remaining.toLocaleString()}`, color: '#20B2AA', icon: <TrendingUp size={24} />, bg: '#fff' },
            { label: 'Usage', value: `${pct}%`, color: pct > 80 ? '#e53e3e' : '#dd6b20', icon: <AlertTriangle size={24} />, bg: '#fff' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div>
                <p style={{ fontSize: 13, color: '#718096', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '4px 0 0', letterSpacing: '-0.02em' }}>{s.value}</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: '#f8fafc', color: s.color === '#1a202c' ? '#20B2AA' : s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <ChartCard title="Budget Analysis">
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: '#718096', fontWeight: 600 }}>Budget Used: <strong style={{ color: '#1a202c', fontWeight: 800 }}>${budgetUsed.toLocaleString()}</strong></span>
              <span style={{ color: pct > 80 ? '#e53e3e' : '#718096', fontWeight: 700 }}>{pct}% utilized</span>
              <span style={{ color: '#718096', fontWeight: 600 }}>Total Limit: <strong style={{ color: '#1a202c', fontWeight: 800 }}>${budgetLimit.toLocaleString()}</strong></span>
            </div>
            <div style={{ height: 20, background: '#edf2f7', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 80 ? 'linear-gradient(90deg, #FF8C00, #e53e3e)' : 'linear-gradient(90deg, #20B2AA, #4FD1C5)', borderRadius: 10, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
            {pct > 80 && <p style={{ color: '#e53e3e', fontSize: 13, margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><AlertTriangle size={15} /> Warning: You have utilized over 80% of your current budget limit.</p>}
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ height: 200, flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={budgetData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {budgetData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} formatter={v => [`$${v.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlySpending}>
                  <XAxis dataKey="month" stroke="#718096" fontSize={11} axisLine={false} tickLine={false} fontWeight={600} />
                  <YAxis stroke="#718096" fontSize={11} axisLine={false} tickLine={false} fontWeight={600} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tt} formatter={v => [`$${v}`, '']} />
                  <Legend iconType="circle" />
                  <Bar dataKey="spent" name="Spent" fill="#20B2AA" radius={[4,4,0,0]} />
                  <Bar dataKey="budget" name="Budget" fill="#edf2f7" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>

        {/* Spending by Category */}
        <ChartCard title="Spending by Category">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {categorySpending.map(cat => {
              const catPct = Math.round((cat.value / budgetUsed) * 100);
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#4a5568', fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ color: '#1a202c', fontWeight: 800 }}>${cat.value.toLocaleString()} <span style={{ color: '#a0aec0', fontWeight: 600, fontSize: 12 }}>({catPct}%)</span></span>
                  </div>
                  <div style={{ height: 10, background: '#f7fafc', borderRadius: 5, overflow: 'hidden', border: '1px solid #edf2f7' }}>
                    <div style={{ height: '100%', width: `${catPct}%`, background: cat.color, borderRadius: 5, boxShadow: `0 0 10px ${cat.color}20` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Affordable Datasets */}
        <ChartCard title={`Datasets Within Your Remaining Budget ($${remaining.toLocaleString()})`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading datasets...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
              {affordableDatasets.map(d => (
                <DatasetCard key={d.id} dataset={d}
                  onAction={() => showToast(`Added ${d.title} to cart`)}
                  actionLabel="Buy Now"
                  actionStyle={{ background: '#20B2AA', color: '#fff' }}
                />
              ))}
            </div>
          )}
          {!loading && affordableDatasets.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '24px 0' }}>No datasets within remaining budget</p>}
        </ChartCard>
      </div>

      {/* Set Budget Modal */}
      {isSetBudgetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: '#1a202c', margin: 0, fontSize: 24, fontWeight: 800 }}>Set Budget Limit</h3>
              <button onClick={() => setIsSetBudgetOpen(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <p style={{ color: '#718096', fontSize: 16, margin: '0 0 24px', fontWeight: 500 }}>Current monthly limit: <strong style={{ color: '#20B2AA', fontWeight: 800 }}>${budgetLimit.toLocaleString()}</strong></p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#4a5568', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>New Budget Limit ($)</label>
              <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="e.g. 15000"
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', color: '#1a202c', fontSize: 16, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsSetBudgetOpen(false)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#4a5568', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>Cancel</button>
              <button onClick={() => { if (newBudget) { setBudgetLimit(parseFloat(newBudget)); showToast('Budget limit updated successfully'); setIsSetBudgetOpen(false); setNewBudget(''); } }}
                style={{ padding: '12px 24px', background: '#FF8C00', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 800, boxShadow: '0 4px 10px rgba(255,140,0,0.2)' }}>Update Budget</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1a202c', color: '#fff', borderRadius: 12, padding: '16px 24px', fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>{toast}</div>}
    </DashboardLayout>
  );
}

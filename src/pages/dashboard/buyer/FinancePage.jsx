import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Tab, Tabs, TextField, Typography } from '@mui/material';
import { CreditCard, Landmark, RefreshCw, Wallet } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useThemeColors } from '../../../utils/useThemeColors';
import { paymentService, walletTransactionService, withdrawalService, refundService } from '../../../utils/apiService';
import { getCurrentUserId } from '../../../utils/session';

const PRIMARY = '#FF8C00';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const getBadgeColor = (statusRaw) => {
  const status = (statusRaw || '').toString().toLowerCase();
  if (['success', 'completed', 'paid', 'approved', 'active'].includes(status)) return { bg: '#f0fdf4', color: SUCCESS };
  if (['pending', 'processing', 'initiated', 'requested'].includes(status)) return { bg: '#fffbeb', color: WARNING };
  if (['failed', 'rejected', 'cancelled', 'canceled'].includes(status)) return { bg: '#fef2f2', color: DANGER };
  return { bg: '#f3f4f6', color: '#6b7280' };
};

const formatAmount = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function BuyerFinancePage() {
  const themeColors = useThemeColors();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [withdrawForm, setWithdrawForm] = useState({ amount: '', note: '' });
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const userId = await getCurrentUserId();
      const [paymentsRes, txRes, withdrawalsRes, refundsRes] = await Promise.allSettled([
        paymentService.mine({ limit: 100 }),
        walletTransactionService.byUser(userId, { limit: 100 }),
        withdrawalService.byUser(userId, { limit: 100 }),
        refundService.mine({ limit: 100 }),
      ]);

      if (paymentsRes.status === 'fulfilled') setPayments(extractList(paymentsRes.value.data));
      if (txRes.status === 'fulfilled') setTransactions(extractList(txRes.value.data));
      if (withdrawalsRes.status === 'fulfilled') setWithdrawals(extractList(withdrawalsRes.value.data));
      if (refundsRes.status === 'fulfilled') setRefunds(extractList(refundsRes.value.data));

      const failedAll = [paymentsRes, txRes, withdrawalsRes, refundsRes].every((r) => r.status === 'rejected');
      if (failedAll) setError('Failed to load your finance data. Please re-login and try again.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load finance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => ({
    payments: payments.length,
    transactions: transactions.length,
    withdrawalsPending: withdrawals.filter((w) => ['pending', 'processing'].includes((w.status || '').toLowerCase())).length,
    refundsPending: refunds.filter((r) => ['pending', 'processing', 'requested'].includes((r.status || '').toLowerCase())).length,
  }), [payments, transactions, withdrawals, refunds]);

  const runAction = async (key, call) => {
    setBusyKey(key);
    setSuccess('');
    try {
      await call();
      await loadData();
      setSuccess('Action completed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <DashboardLayout role="buyer">
      <Box sx={{ backgroundColor: themeColors.bg }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5 }}>
              Buyer Transactions
            </Typography>
            <Typography sx={{ color: themeColors.textMuted }}>
              Track payments and wallet activity, request refunds, and manage withdrawal requests.
            </Typography>
          </Box>
          <Button onClick={loadData} variant="contained" startIcon={<RefreshCw size={16} />} sx={{ backgroundColor: PRIMARY, textTransform: 'none', fontWeight: 700 }}>
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          <MiniStat label="Payments" value={summary.payments} icon={<CreditCard size={18} />} themeColors={themeColors} />
          <MiniStat label="Transactions" value={summary.transactions} icon={<Wallet size={18} />} themeColors={themeColors} />
          <MiniStat label="Pending Withdrawals" value={summary.withdrawalsPending} icon={<Landmark size={18} />} themeColors={themeColors} />
          <MiniStat label="Pending Refunds" value={summary.refundsPending} icon={<CreditCard size={18} />} themeColors={themeColors} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: `1px solid ${themeColors.border}` }}>
            <Tab label={`Payments (${payments.length})`} />
            <Tab label={`Transactions (${transactions.length})`} />
            <Tab label={`Withdrawals (${withdrawals.length})`} />
            <Tab label={`Refunds (${refunds.length})`} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {loading ? (
              <Typography sx={{ color: themeColors.textMuted, py: 2 }}>Loading...</Typography>
            ) : (
              <>
                {tab === 0 && <SimpleTable rows={payments} columns={[
                  ['ID', (r) => `#${r.id}`],
                  ['Amount', (r) => <strong style={{ color: PRIMARY }}>{formatAmount(r.amount)}</strong>],
                  ['Method', (r) => r.payment_method || r.method || '—'],
                  ['Status', (r) => <StatusChip status={r.status} />],
                  ['Date', (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—'],
                ]} themeColors={themeColors} />}

                {tab === 1 && <SimpleTable rows={transactions} columns={[
                  ['ID', (r) => `#${r.id}`],
                  ['Type', (r) => r.type || r.transaction_type || '—'],
                  ['Amount', (r) => <strong style={{ color: PRIMARY }}>{formatAmount(r.amount)}</strong>],
                  ['Status', (r) => <StatusChip status={r.status} />],
                  ['Date', (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—'],
                ]} themeColors={themeColors} />}

                {tab === 2 && (
                  <>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, mb: 2 }}>
                      <TextField label="Withdraw Amount" value={withdrawForm.amount} onChange={(e) => setWithdrawForm((p) => ({ ...p, amount: e.target.value }))} />
                      <TextField label="Note (optional)" value={withdrawForm.note} onChange={(e) => setWithdrawForm((p) => ({ ...p, note: e.target.value }))} />
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: PRIMARY, textTransform: 'none' }}
                        disabled={busyKey === 'withdraw-request' || !withdrawForm.amount}
                        onClick={() => runAction('withdraw-request', () => withdrawalService.request({ amount: Number(withdrawForm.amount), note: withdrawForm.note || undefined }))}
                      >
                        Request Withdraw
                      </Button>
                    </Box>
                    <SimpleTable rows={withdrawals} columns={[
                      ['ID', (r) => `#${r.id}`],
                      ['Amount', (r) => <strong style={{ color: PRIMARY }}>{formatAmount(r.amount)}</strong>],
                      ['Method', (r) => r.method || r.withdrawal_method || '—'],
                      ['Status', (r) => <StatusChip status={r.status} />],
                      ['Date', (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—'],
                      ['Action', (r) => {
                        const st = (r.status || '').toLowerCase();
                        if (!['pending', 'processing'].includes(st)) return '—';
                        const key = `withdraw-cancel-${r.id}`;
                        return (
                          <Button size="small" disabled={busyKey === key} onClick={() => runAction(key, () => withdrawalService.cancel(r.id))}>
                            Cancel
                          </Button>
                        );
                      }],
                    ]} themeColors={themeColors} />
                  </>
                )}

                {tab === 3 && (
                  <>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, mb: 2 }}>
                      <TextField label="Refund Amount" value={refundForm.amount} onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))} />
                      <TextField label="Reason" value={refundForm.reason} onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))} />
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: PRIMARY, textTransform: 'none' }}
                        disabled={busyKey === 'refund-request' || !refundForm.amount || !refundForm.reason}
                        onClick={() => runAction('refund-request', () => refundService.request({ amount: Number(refundForm.amount), reason: refundForm.reason }))}
                      >
                        Request Refund
                      </Button>
                    </Box>
                    <SimpleTable rows={refunds} columns={[
                      ['ID', (r) => `#${r.id}`],
                      ['Amount', (r) => <strong style={{ color: PRIMARY }}>{formatAmount(r.amount)}</strong>],
                      ['Reason', (r) => r.reason || r.notes || '—'],
                      ['Status', (r) => <StatusChip status={r.status} />],
                      ['Date', (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—'],
                    ]} themeColors={themeColors} />
                  </>
                )}
              </>
            )}
          </Box>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

function MiniStat({ icon, label, value, themeColors }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', color: themeColors.textMuted, mb: 0.5 }}>{label}</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: themeColors.text }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1, borderRadius: 2, display: 'flex', backgroundColor: '#fff7ed', color: PRIMARY }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const { bg, color } = getBadgeColor(status);
  return <Chip label={status || 'unknown'} size="small" sx={{ backgroundColor: bg, color, fontWeight: 700 }} />;
}

function SimpleTable({ rows, columns, themeColors }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
            {columns.map(([label]) => (
              <th key={label} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '16px', color: themeColors.textMuted }}>No records found</td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
              {columns.map(([label, render]) => (
                <td key={`${row.id}-${label}`} style={{ padding: '12px', fontSize: 13, color: themeColors.text }}>
                  {render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

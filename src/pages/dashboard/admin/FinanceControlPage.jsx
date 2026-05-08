import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { CreditCard, Landmark, MoreHorizontal, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useThemeColors } from '../../../utils/useThemeColors';
import {
  paymentService,
  walletTransactionService,
  withdrawalService,
  refundService,
  payoutService,
} from '../../../utils/apiService';

const PRIMARY = '#FF8C00';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

const getBadgeColor = (statusRaw) => {
  const status = (statusRaw || '').toString().toLowerCase();
  if (['success', 'completed', 'paid', 'approved', 'active'].includes(status)) {
    return { bg: '#f0fdf4', color: SUCCESS };
  }
  if (['pending', 'processing', 'initiated'].includes(status)) {
    return { bg: '#fffbeb', color: WARNING };
  }
  if (['failed', 'rejected', 'cancelled', 'canceled'].includes(status)) {
    return { bg: '#fef2f2', color: DANGER };
  }
  return { bg: '#f3f4f6', color: '#6b7280' };
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const formatAmount = (value) => `$${Number(value || 0).toLocaleString()}`;

function StatCard({ icon, label, value, themeColors }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', color: themeColors.textMuted, mb: 0.5 }}>{label}</Typography>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: themeColors.text }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1, borderRadius: 2, display: 'flex', backgroundColor: '#fff7ed', color: PRIMARY }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminFinanceControlPage({ role = 'admin' }) {
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [success, setSuccess] = useState('');
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, actions: [], rowId: null });

  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, txRes, withdrawalsRes, refundsRes, payoutsRes] = await Promise.allSettled([
        paymentService.admin({ limit: 100 }),
        walletTransactionService.list({ limit: 100 }),
        withdrawalService.list({ limit: 100 }),
        refundService.admin({ limit: 100 }),
        payoutService.admin({ limit: 100 }),
      ]);

      if (paymentsRes.status === 'fulfilled') setPayments(extractList(paymentsRes.value.data));
      if (txRes.status === 'fulfilled') setTransactions(extractList(txRes.value.data));
      if (withdrawalsRes.status === 'fulfilled') setWithdrawals(extractList(withdrawalsRes.value.data));
      if (refundsRes.status === 'fulfilled') setRefunds(extractList(refundsRes.value.data));
      if (payoutsRes.status === 'fulfilled') setPayouts(extractList(payoutsRes.value.data));

      const failedAll = [paymentsRes, txRes, withdrawalsRes, refundsRes, payoutsRes].every(r => r.status === 'rejected');
      if (failedAll) setError('Failed to load finance data. Please check API auth/permissions.');
    } catch (err) {
      console.error('Finance control load error:', err);
      setError(err?.response?.data?.message || 'Failed to load finance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runAction = async (key, call, onDone) => {
    setActionKey(key);
    try {
      await call();
      if (onDone) await onDone();
      setSuccess('Action completed successfully.');
    } catch (err) {
      console.error('Finance action failed:', err);
      alert(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionKey('');
    }
  };

  const openActionsMenu = (event, rowId, actions) => {
    setActionMenu({ anchorEl: event.currentTarget, actions, rowId });
  };

  const closeActionsMenu = () => {
    setActionMenu({ anchorEl: null, actions: [], rowId: null });
  };

  const summary = useMemo(() => ({
    payments: payments.length,
    transactions: transactions.length,
    withdrawalsPending: withdrawals.filter(w => ['pending', 'processing'].includes((w.status || '').toLowerCase())).length,
    refundsPending: refunds.filter(r => ['pending', 'processing', 'requested'].includes((r.status || '').toLowerCase())).length,
    payoutsPending: payouts.filter(p => ['pending', 'processing', 'queued'].includes((p.status || '').toLowerCase())).length,
  }), [payments, transactions, withdrawals, refunds, payouts]);

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg, transition: 'background-color 0.3s ease' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5 }}>
              Finance Control Center
            </Typography>
            <Typography sx={{ color: themeColors.textMuted }}>
              Full admin oversight for payments, wallet transactions, withdrawals, refunds, and payouts.
            </Typography>
          </Box>
          <Button
            onClick={loadAll}
            variant="contained"
            startIcon={<RefreshCw size={16} />}
            disabled={loading}
            sx={{ backgroundColor: PRIMARY, textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { backgroundColor: '#e67e00' } }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
          <StatCard icon={<CreditCard size={18} />} label="Payments" value={summary.payments} themeColors={themeColors} />
          <StatCard icon={<Wallet size={18} />} label="Transactions" value={summary.transactions} themeColors={themeColors} />
          <StatCard icon={<Landmark size={18} />} label="Pending Withdrawals" value={summary.withdrawalsPending} themeColors={themeColors} />
          <StatCard icon={<ShieldCheck size={18} />} label="Pending Refunds" value={summary.refundsPending} themeColors={themeColors} />
          <StatCard icon={<Landmark size={18} />} label="Pending Payouts" value={summary.payoutsPending} themeColors={themeColors} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: `1px solid ${themeColors.border}` }}
          >
            <Tab label={`Payments (${payments.length})`} />
            <Tab label={`Transactions (${transactions.length})`} />
            <Tab label={`Withdrawals (${withdrawals.length})`} />
            <Tab label={`Refunds (${refunds.length})`} />
            <Tab label={`Payouts (${payouts.length})`} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {activeTab === 0 && (
                  <TableWrapper headers={['ID', 'User', 'Amount', 'Method', 'Status', 'Date', 'Actions']} themeColors={themeColors}>
                    {payments.map((p) => {
                      const badge = getBadgeColor(p.status);
                      const key = `payment-verify-${p.id}`;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                          <TableCell themeColors={themeColors}>#{p.id}</TableCell>
                          <TableCell themeColors={themeColors}>{p.user?.full_name || p.user?.email || `#${p.user_id || '-'}`}</TableCell>
                          <TableCell themeColors={themeColors}><strong style={{ color: PRIMARY }}>{formatAmount(p.amount)}</strong></TableCell>
                          <TableCell themeColors={themeColors}>{p.payment_method || p.method || '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <Chip label={p.status || 'unknown'} size="small" sx={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell themeColors={themeColors}>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <IconButton
                              size="small"
                              onClick={(e) => openActionsMenu(e, `payment-${p.id}`, [
                                { label: 'Verify Payment', key, run: () => runAction(key, () => paymentService.verify(p.id), loadAll) },
                              ])}
                              disabled={actionKey === key}
                            >
                              <MoreHorizontal size={16} />
                            </IconButton>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableWrapper>
                )}

                {activeTab === 1 && (
                  <TableWrapper headers={['ID', 'Type', 'User', 'Amount', 'Status', 'Date']} themeColors={themeColors}>
                    {transactions.map((tx) => {
                      const badge = getBadgeColor(tx.status);
                      return (
                        <tr key={tx.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                          <TableCell themeColors={themeColors}>#{tx.id}</TableCell>
                          <TableCell themeColors={themeColors}>{tx.type || tx.transaction_type || '—'}</TableCell>
                          <TableCell themeColors={themeColors}>{tx.user?.full_name || tx.user?.email || `#${tx.user_id || '-'}`}</TableCell>
                          <TableCell themeColors={themeColors}><strong style={{ color: PRIMARY }}>{formatAmount(tx.amount)}</strong></TableCell>
                          <TableCell themeColors={themeColors}>
                            <Chip label={tx.status || 'unknown'} size="small" sx={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell themeColors={themeColors}>{tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</TableCell>
                        </tr>
                      );
                    })}
                  </TableWrapper>
                )}

                {activeTab === 2 && (
                  <TableWrapper headers={['ID', 'User', 'Amount', 'Method', 'Status', 'Requested', 'Actions']} themeColors={themeColors}>
                    {withdrawals.map((w) => {
                      const badge = getBadgeColor(w.status);
                      const base = `withdraw-${w.id}`;
                      return (
                        <tr key={w.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                          <TableCell themeColors={themeColors}>#{w.id}</TableCell>
                          <TableCell themeColors={themeColors}>{w.user?.full_name || w.user?.email || `#${w.user_id || '-'}`}</TableCell>
                          <TableCell themeColors={themeColors}><strong style={{ color: PRIMARY }}>{formatAmount(w.amount)}</strong></TableCell>
                          <TableCell themeColors={themeColors}>{w.method || w.withdrawal_method || '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <Chip label={w.status || 'unknown'} size="small" sx={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell themeColors={themeColors}>{w.created_at ? new Date(w.created_at).toLocaleString() : '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <IconButton
                              size="small"
                              onClick={(e) => openActionsMenu(e, `withdraw-${w.id}`, [
                                { label: 'Approve', key: `${base}-approve`, run: () => runAction(`${base}-approve`, () => withdrawalService.approve(w.id), loadAll) },
                                { label: 'Reject', key: `${base}-reject`, run: () => runAction(`${base}-reject`, () => withdrawalService.reject(w.id), loadAll) },
                                { label: 'Mark as Processing', key: `${base}-processing`, run: () => runAction(`${base}-processing`, () => withdrawalService.processing(w.id), loadAll) },
                                { label: 'Mark as Paid', key: `${base}-paid`, run: () => runAction(`${base}-paid`, () => withdrawalService.paid(w.id), loadAll) },
                              ])}
                            >
                              <MoreHorizontal size={16} />
                            </IconButton>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableWrapper>
                )}

                {activeTab === 3 && (
                  <TableWrapper headers={['ID', 'User', 'Amount', 'Reason', 'Status', 'Date', 'Actions']} themeColors={themeColors}>
                    {refunds.map((r) => {
                      const badge = getBadgeColor(r.status);
                      const base = `refund-${r.id}`;
                      return (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                          <TableCell themeColors={themeColors}>#{r.id}</TableCell>
                          <TableCell themeColors={themeColors}>{r.user?.full_name || r.user?.email || `#${r.user_id || '-'}`}</TableCell>
                          <TableCell themeColors={themeColors}><strong style={{ color: PRIMARY }}>{formatAmount(r.amount)}</strong></TableCell>
                          <TableCell themeColors={themeColors}>{r.reason || r.notes || '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <Chip label={r.status || 'unknown'} size="small" sx={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell themeColors={themeColors}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <IconButton
                              size="small"
                              onClick={(e) => openActionsMenu(e, `refund-${r.id}`, [
                                { label: 'Approve', key: `${base}-approve`, run: () => runAction(`${base}-approve`, () => refundService.approve(r.id), loadAll) },
                                { label: 'Reject', key: `${base}-reject`, run: () => runAction(`${base}-reject`, () => refundService.reject(r.id), loadAll) },
                                { label: 'Process Refund', key: `${base}-process`, run: () => runAction(`${base}-process`, () => refundService.process(r.id), loadAll) },
                              ])}
                            >
                              <MoreHorizontal size={16} />
                            </IconButton>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableWrapper>
                )}

                {activeTab === 4 && (
                  <TableWrapper headers={['ID', 'User', 'Amount', 'Status', 'Date', 'Actions']} themeColors={themeColors}>
                    {payouts.map((p) => {
                      const badge = getBadgeColor(p.status);
                      const base = `payout-${p.id}`;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                          <TableCell themeColors={themeColors}>#{p.id}</TableCell>
                          <TableCell themeColors={themeColors}>{p.user?.full_name || p.user?.email || `#${p.user_id || '-'}`}</TableCell>
                          <TableCell themeColors={themeColors}><strong style={{ color: PRIMARY }}>{formatAmount(p.amount)}</strong></TableCell>
                          <TableCell themeColors={themeColors}>
                            <Chip label={p.status || 'unknown'} size="small" sx={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell themeColors={themeColors}>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</TableCell>
                          <TableCell themeColors={themeColors}>
                            <IconButton
                              size="small"
                              onClick={(e) => openActionsMenu(e, `payout-${p.id}`, [
                                { label: 'Complete Payout', key: `${base}-complete`, run: () => runAction(`${base}-complete`, () => payoutService.complete(p.id), loadAll) },
                                { label: 'Fail Payout', key: `${base}-fail`, run: () => runAction(`${base}-fail`, () => payoutService.fail(p.id), loadAll) },
                              ])}
                            >
                              <MoreHorizontal size={16} />
                            </IconButton>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableWrapper>
                )}
              </>
            )}
          </Box>
        </Card>
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={Boolean(actionMenu.anchorEl)}
          onClose={closeActionsMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { minWidth: 220, borderRadius: 2 } }}
        >
          {actionMenu.actions.map((action, index) => {
            const busy = actionKey === action.key;
            return (
              <Box key={action.key}>
                <MenuItem
                  disabled={busy}
                  onClick={async () => {
                    closeActionsMenu();
                    await action.run();
                  }}
                  sx={{ fontSize: 13, fontWeight: 600, py: 1.2 }}
                >
                  {busy ? 'Processing...' : action.label}
                </MenuItem>
                {index < actionMenu.actions.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Menu>
      </Box>
    </DashboardLayout>
  );
}

function TableWrapper({ headers, children, themeColors }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!children && (
        <Box sx={{ p: 4, textAlign: 'center', color: themeColors.textMuted }}>
          No records found
        </Box>
      )}
    </Box>
  );
}

function TableCell({ children, themeColors }) {
  return (
    <td style={{ padding: '12px', fontSize: 13, color: themeColors.text }}>
      {children}
    </td>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  CreditCard,
  Landmark,
  RefreshCw,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useThemeColors } from "../../../utils/useThemeColors";
import {
  paymentService,
  withdrawalService,
  refundService,
  payoutService,
} from "../../../utils/apiService";
import { getCurrentUserId } from "../../../utils/session";

const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Direct fetch for wallet transactions (no service abstraction needed)
const fetchWalletTransactionsByUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/wallet-transactions/user/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok)
    throw new Error(`Failed to fetch wallet transactions: ${res.status}`);
  return res.json(); // returns List[WalletTransactionResponse]
};

const PRIMARY = "#FF8C00";
const SUCCESS = "#16a34a";
const WARNING = "#f59e0b";
const DANGER = "#dc2626";
const INFO = "#3182ce";

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
  const status = (statusRaw || "").toString().toLowerCase();
  if (["success", "completed", "paid", "approved", "active"].includes(status))
    return { bg: "#f0fdf4", color: SUCCESS };
  if (["pending", "processing", "initiated", "requested"].includes(status))
    return { bg: "#fffbeb", color: WARNING };
  if (["failed", "rejected", "cancelled", "canceled"].includes(status))
    return { bg: "#fef2f2", color: DANGER };
  return { bg: "#f3f4f6", color: "#6b7280" };
};

const getDirectionColor = (direction) => {
  const d = (direction || "").toLowerCase();
  if (d === "credit" || d === "in")
    return {
      bg: "#f0fdf4",
      color: SUCCESS,
      icon: <ArrowDownCircle size={13} />,
    };
  if (d === "debit" || d === "out")
    return { bg: "#fef2f2", color: DANGER, icon: <ArrowUpCircle size={13} /> };
  return { bg: "#f3f4f6", color: "#6b7280", icon: null };
};

const formatAmount = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SellerFinancePage() {
  const themeColors = useThemeColors();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const [withdrawForm, setWithdrawForm] = useState({ amount: "", note: "" });
  const [refundForm, setRefundForm] = useState({ amount: "", reason: "" });
  const [busyKey, setBusyKey] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const userId = await getCurrentUserId();

      const [paymentsRes, txRes, withdrawalsRes, refundsRes, payoutsRes] =
        await Promise.allSettled([
          paymentService.mine({ limit: 100 }),
          fetchWalletTransactionsByUser(userId), // ← direct API call
          withdrawalService.byUser(userId, { limit: 100 }),
          refundService.mine({ limit: 100 }),
          payoutService.mine({ limit: 100 }),
        ]);

      if (paymentsRes.status === "fulfilled")
        setPayments(extractList(paymentsRes.value?.data ?? paymentsRes.value));
      // wallet-transactions returns List directly (array), not paginated
      if (txRes.status === "fulfilled")
        setTransactions(
          Array.isArray(txRes.value) ? txRes.value : extractList(txRes.value),
        );
      if (withdrawalsRes.status === "fulfilled")
        setWithdrawals(
          extractList(withdrawalsRes.value?.data ?? withdrawalsRes.value),
        );
      if (refundsRes.status === "fulfilled")
        setRefunds(extractList(refundsRes.value?.data ?? refundsRes.value));
      if (payoutsRes.status === "fulfilled")
        setPayouts(extractList(payoutsRes.value?.data ?? payoutsRes.value));

      const failedAll = [
        paymentsRes,
        txRes,
        withdrawalsRes,
        refundsRes,
        payoutsRes,
      ].every((r) => r.status === "rejected");
      if (failedAll)
        setError(
          "Failed to load your finance data. Please re-login and try again.",
        );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load finance data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const txCredits = transactions.filter((t) =>
      ["credit", "in"].includes((t.direction || "").toLowerCase()),
    );
    const txDebits = transactions.filter((t) =>
      ["debit", "out"].includes((t.direction || "").toLowerCase()),
    );
    return {
      payments: payments.length,
      transactions: transactions.length,
      txCredits: txCredits.length,
      txDebits: txDebits.length,
      withdrawalsPending: withdrawals.filter((w) =>
        ["pending", "processing"].includes((w.status || "").toLowerCase()),
      ).length,
      refundsPending: refunds.filter((r) =>
        ["pending", "processing", "requested"].includes(
          (r.status || "").toLowerCase(),
        ),
      ).length,
    };
  }, [payments, transactions, withdrawals, refunds]);

  const runAction = async (key, call) => {
    setBusyKey(key);
    setSuccess("");
    setError("");
    try {
      await call();
      await loadData();
      setSuccess("Action completed successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Action failed");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <DashboardLayout role="seller">
      <Box sx={{ backgroundColor: themeColors.bg }}>
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "2rem",
                fontWeight: 800,
                color: themeColors.text,
                mb: 0.5,
              }}
            >
              Seller Transactions
            </Typography>
            <Typography sx={{ color: themeColors.textMuted }}>
              Manage your payments, wallet transactions, withdrawals, refunds,
              and payouts.
            </Typography>
          </Box>
          <Button
            onClick={loadData}
            variant="contained"
            startIcon={<RefreshCw size={16} />}
            sx={{
              backgroundColor: PRIMARY,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <MiniStat
            label="Payments"
            value={summary.payments}
            icon={<CreditCard size={18} />}
            themeColors={themeColors}
          />
          <MiniStat
            label="Wallet Transactions"
            value={summary.transactions}
            icon={<Wallet size={18} />}
            themeColors={themeColors}
          />
          <MiniStat
            label="Pending Withdrawals"
            value={summary.withdrawalsPending}
            icon={<Landmark size={18} />}
            themeColors={themeColors}
          />
          <MiniStat
            label="Pending Refunds"
            value={summary.refundsPending}
            icon={<CreditCard size={18} />}
            themeColors={themeColors}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Card
          sx={{
            borderRadius: 2,
            border: `1px solid ${themeColors.border}`,
            boxShadow: "none",
            backgroundColor: themeColors.card,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: `1px solid ${themeColors.border}` }}
          >
            <Tab label={`Payments (${payments.length})`} />
            <Tab label={`Wallet Transactions (${transactions.length})`} />
            <Tab label={`Withdrawals (${withdrawals.length})`} />
            <Tab label={`Refunds (${refunds.length})`} />
            <Tab label={`Payouts (${payouts.length})`} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {loading ? (
              <Typography sx={{ color: themeColors.textMuted, py: 2 }}>
                Loading...
              </Typography>
            ) : (
              <>
                {/* PAYMENTS TAB */}
                {tab === 0 && (
                  <SimpleTable
                    rows={payments}
                    columns={[
                      ["ID", (r) => `#${r.id}`],
                      ["Order", (r) => (r.order_id ? `#${r.order_id}` : "—")],
                      [
                        "Amount",
                        (r) => (
                          <strong style={{ color: PRIMARY }}>
                            {formatAmount(r.amount)}
                          </strong>
                        ),
                      ],
                      ["Currency", (r) => r.currency || "—"],
                      ["Method", (r) => r.payment_method || r.method || "—"],
                      ["Provider", (r) => r.provider || "—"],
                      ["Status", (r) => <StatusChip status={r.status} />],
                      [
                        "Paid At",
                        (r) =>
                          r.paid_at
                            ? new Date(r.paid_at).toLocaleString()
                            : "—",
                      ],
                      [
                        "Date",
                        (r) =>
                          r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : "—",
                      ],
                    ]}
                    themeColors={themeColors}
                  />
                )}

                {/* WALLET TRANSACTIONS TAB */}
                {tab === 1 && (
                  <>
                    {/* Credit/Debit mini-summary */}
                    <Box
                      sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          background: "#f0fdf4",
                          color: SUCCESS,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <ArrowDownCircle size={15} /> Credits:{" "}
                        {summary.txCredits}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          background: "#fef2f2",
                          color: DANGER,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <ArrowUpCircle size={15} /> Debits: {summary.txDebits}
                      </Box>
                    </Box>
                    <SimpleTable
                      rows={transactions}
                      columns={[
                        ["ID", (r) => `#${r.id}`],
                        [
                          "Type",
                          (r) => (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "#475569",
                              }}
                            >
                              {r.transaction_type || "—"}
                            </span>
                          ),
                        ],
                        [
                          "Direction",
                          (r) => {
                            const { bg, color, icon } = getDirectionColor(
                              r.direction,
                            );
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 10px",
                                  borderRadius: 8,
                                  background: bg,
                                  color,
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                {icon} {r.direction || "—"}
                              </span>
                            );
                          },
                        ],
                        [
                          "Amount",
                          (r) => {
                            const isCredit = ["credit", "in"].includes(
                              (r.direction || "").toLowerCase(),
                            );
                            return (
                              <strong
                                style={{ color: isCredit ? SUCCESS : DANGER }}
                              >
                                {isCredit ? "+" : "-"}
                                {formatAmount(r.amount)}
                              </strong>
                            );
                          },
                        ],
                        [
                          "Balance Before",
                          (r) => (
                            <span
                              style={{
                                color: themeColors.textMuted,
                                fontSize: 12,
                              }}
                            >
                              {formatAmount(r.balance_before)}
                            </span>
                          ),
                        ],
                        [
                          "Balance After",
                          (r) => (
                            <span style={{ fontWeight: 700 }}>
                              {formatAmount(r.balance_after)}
                            </span>
                          ),
                        ],
                        ["Ref Type", (r) => r.reference_type || "—"],
                        [
                          "Ref ID",
                          (r) => (r.reference_id ? `#${r.reference_id}` : "—"),
                        ],
                        [
                          "Description",
                          (r) => (
                            <span
                              style={{
                                fontSize: 12,
                                color: themeColors.textMuted,
                                maxWidth: 200,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.description || "—"}
                            </span>
                          ),
                        ],
                        ["Status", (r) => <StatusChip status={r.status} />],
                        [
                          "Date",
                          (r) =>
                            r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : "—",
                        ],
                      ]}
                      themeColors={themeColors}
                    />
                  </>
                )}

                {/* WITHDRAWALS TAB */}
                {tab === 2 && (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
                        mb: 2,
                      }}
                    >
                      <TextField
                        label="Withdraw Amount"
                        type="number"
                        value={withdrawForm.amount}
                        onChange={(e) =>
                          setWithdrawForm((p) => ({
                            ...p,
                            amount: e.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Note (optional)"
                        value={withdrawForm.note}
                        onChange={(e) =>
                          setWithdrawForm((p) => ({
                            ...p,
                            note: e.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: PRIMARY,
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                        disabled={
                          busyKey === "withdraw-request" || !withdrawForm.amount
                        }
                        onClick={() =>
                          runAction("withdraw-request", () =>
                            withdrawalService.request({
                              amount: Number(withdrawForm.amount),
                              note: withdrawForm.note || undefined,
                            }),
                          )
                        }
                      >
                        Request Withdraw
                      </Button>
                    </Box>
                    <SimpleTable
                      rows={withdrawals}
                      columns={[
                        ["ID", (r) => `#${r.id}`],
                        [
                          "Amount",
                          (r) => (
                            <strong style={{ color: PRIMARY }}>
                              {formatAmount(r.amount)}
                            </strong>
                          ),
                        ],
                        ["Currency", (r) => r.currency || "—"],
                        [
                          "Method",
                          (r) =>
                            r.withdraw_method ||
                            r.method ||
                            r.withdrawal_method ||
                            "—",
                        ],
                        [
                          "Account",
                          (r) => r.account_name || r.account_number || "—",
                        ],
                        ["Status", (r) => <StatusChip status={r.status} />],
                        [
                          "Date",
                          (r) =>
                            r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : "—",
                        ],
                        [
                          "Action",
                          (r) => {
                            const st = (r.status || "").toLowerCase();
                            if (!["pending", "processing"].includes(st))
                              return "—";
                            const key = `withdraw-cancel-${r.id}`;
                            return (
                              <Button
                                size="small"
                                color="error"
                                disabled={busyKey === key}
                                onClick={() =>
                                  runAction(key, () =>
                                    withdrawalService.cancel(r.id),
                                  )
                                }
                              >
                                Cancel
                              </Button>
                            );
                          },
                        ],
                      ]}
                      themeColors={themeColors}
                    />
                  </>
                )}

                {/* REFUNDS TAB */}
                {tab === 3 && (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
                        mb: 2,
                      }}
                    >
                      <TextField
                        label="Refund Amount"
                        type="number"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm((p) => ({
                            ...p,
                            amount: e.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Reason"
                        value={refundForm.reason}
                        onChange={(e) =>
                          setRefundForm((p) => ({
                            ...p,
                            reason: e.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: PRIMARY,
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                        disabled={
                          busyKey === "refund-request" ||
                          !refundForm.amount ||
                          !refundForm.reason
                        }
                        onClick={() =>
                          runAction("refund-request", () =>
                            refundService.request({
                              amount: Number(refundForm.amount),
                              reason: refundForm.reason,
                            }),
                          )
                        }
                      >
                        Request Refund
                      </Button>
                    </Box>
                    <SimpleTable
                      rows={refunds}
                      columns={[
                        ["ID", (r) => `#${r.id}`],
                        ["Order", (r) => (r.order_id ? `#${r.order_id}` : "—")],
                        [
                          "Payment",
                          (r) => (r.payment_id ? `#${r.payment_id}` : "—"),
                        ],
                        [
                          "Amount",
                          (r) => (
                            <strong style={{ color: PRIMARY }}>
                              {formatAmount(r.amount)}
                            </strong>
                          ),
                        ],
                        [
                          "Reason",
                          (r) => (
                            <span
                              style={{
                                fontSize: 12,
                                color: themeColors.textMuted,
                                maxWidth: 180,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.reason || r.notes || "—"}
                            </span>
                          ),
                        ],
                        ["Status", (r) => <StatusChip status={r.status} />],
                        [
                          "Date",
                          (r) =>
                            r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : "—",
                        ],
                      ]}
                      themeColors={themeColors}
                    />
                  </>
                )}

                {/* PAYOUTS TAB */}
                {tab === 4 && (
                  <SimpleTable
                    rows={payouts}
                    columns={[
                      ["ID", (r) => `#${r.id}`],
                      [
                        "Withdrawal",
                        (r) =>
                          r.withdrawal_request_id
                            ? `#${r.withdrawal_request_id}`
                            : "—",
                      ],
                      [
                        "Amount",
                        (r) => (
                          <strong style={{ color: PRIMARY }}>
                            {formatAmount(r.amount)}
                          </strong>
                        ),
                      ],
                      ["Provider", (r) => r.provider || "—"],
                      [
                        "Ref",
                        (r) => (
                          <span
                            style={{
                              fontSize: 11,
                              color: themeColors.textMuted,
                              fontFamily: "monospace",
                            }}
                          >
                            {r.transaction_reference
                              ? r.transaction_reference.slice(0, 12) + "…"
                              : "—"}
                          </span>
                        ),
                      ],
                      ["Status", (r) => <StatusChip status={r.status} />],
                      [
                        "Processed At",
                        (r) =>
                          r.processed_at
                            ? new Date(r.processed_at).toLocaleString()
                            : "—",
                      ],
                      [
                        "Date",
                        (r) =>
                          r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : "—",
                      ],
                    ]}
                    themeColors={themeColors}
                  />
                )}
              </>
            )}
          </Box>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniStat({ icon, label, value, themeColors }) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        border: `1px solid ${themeColors.border}`,
        boxShadow: "none",
        backgroundColor: themeColors.card,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: "0.8rem", color: themeColors.textMuted, mb: 0.5 }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: themeColors.text,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              display: "flex",
              backgroundColor: "#fff7ed",
              color: PRIMARY,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const { bg, color } = getBadgeColor(status);
  return (
    <Chip
      label={status || "unknown"}
      size="small"
      sx={{ backgroundColor: bg, color, fontWeight: 700, fontSize: 11 }}
    />
  );
}

function SimpleTable({ rows, columns, themeColors }) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
            {columns.map(([label]) => (
              <th
                key={label}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: 11,
                  color: themeColors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "24px 12px",
                  color: themeColors.textMuted,
                  textAlign: "center",
                }}
              >
                No records found
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                style={{ borderBottom: `1px solid ${themeColors.border}` }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafafa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {columns.map(([label, render]) => (
                  <td
                    key={`${row.id ?? i}-${label}`}
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      color: themeColors.text,
                    }}
                  >
                    {render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Box>
  );
}

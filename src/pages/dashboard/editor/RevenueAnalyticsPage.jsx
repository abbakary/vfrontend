import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import ChartCard from "../components/ChartCard";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

/* ─── API config ─── */
const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ─── Constants ─── */
const PRIMARY = "#FF8C00";
const TEAL = "#20B2AA";
const tt = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  color: "#1a202c",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const ACTION_COLORS = {
  approved: { bg: "#f0fff4", color: "#38a169", border: "#c6f6d5" },
  rejected: { bg: "#fff5f5", color: "#e53e3e", border: "#fed7d7" },
  returned_for_revision: { bg: "#fffaf0", color: "#dd6b20", border: "#feebc8" },
  review_started: { bg: "#ebf8ff", color: "#3182ce", border: "#bee3f8" },
  escalated: { bg: "#faf5ff", color: "#805ad5", border: "#e9d8fd" },
};

const STATUS_EARNING = {
  pending: { bg: "#fef9c3", color: "#854d0e" },
  confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
  paid: { bg: "#dcfce7", color: "#15803d" },
};

/* ─── Helpers ─── */
function fmt(n, currency = "TZS") {
  return `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
function fmtDuration(secs) {
  if (!secs) return "—";
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${(secs / 3600).toFixed(1)}h`;
}

/* ─── Stat card ─── */
function StatCard({ title, value, sub, accent = PRIMARY, icon }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #edf2f7",
        padding: 24,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: `${accent}15`,
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            color: "#718096",
            margin: 0,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#1a202c",
            margin: "4px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </p>
        {sub && (
          <p
            style={{
              fontSize: 12,
              color: "#a0aec0",
              margin: "2px 0 0",
              fontWeight: 500,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function RevenueAnalyticsPage() {
  /* ── state ── */
  const [profile, setProfile] = useState(null); // editor profile (has profile.id)
  const [earnings, setEarnings] = useState(null); // EditorEarningsSummary
  const [logs, setLogs] = useState([]); // review log items
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ── Step 1: fetch editor profile via /check-me ── */
  const fetchProfile = async () => {
    const res = await fetch(`${BASE_URL}/editor-profiles/check-me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
    const json = await res.json();
    return json.profile; // EditorProfileResponse
  };

  /* ── Step 2: fetch earnings summary ── */
  const fetchEarnings = async (profileId) => {
    const res = await fetch(
      `${BASE_URL}/editor-profiles/${profileId}/earnings`,
      { headers: authHeaders() },
    );
    if (!res.ok) throw new Error(`Earnings fetch failed: ${res.status}`);
    return res.json(); // EditorEarningsSummary
  };

  /* ── Step 3: fetch review logs (paginated) ── */
  const fetchLogs = async (profileId, page = 1) => {
    setLogsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/editor-profiles/${profileId}/review-logs?page=${page}&page_size=20`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(`Logs fetch failed: ${res.status}`);
      const json = await res.json();
      setLogs(json.items || []);
      setLogsTotal(json.total || json.items?.length || 0);
      setLogsPage(page);
    } finally {
      setLogsLoading(false);
    }
  };

  /* ── Initial load ── */
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const prof = await fetchProfile();
      setProfile(prof);
      const [earn] = await Promise.all([
        fetchEarnings(prof.id),
        fetchLogs(prof.id, 1),
      ]);
      setEarnings(earn);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ── Derived chart data from review logs ── */
  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  const actionChartData = Object.entries(actionCounts).map(
    ([action, count]) => ({
      action: action.replace(/_/g, " "),
      count,
      color: ACTION_COLORS[action]?.color || "#718096",
    }),
  );

  // Group logs by month for timeline
  const logsByMonth = logs.reduce((acc, log) => {
    if (!log.created_at) return acc;
    const month = new Date(log.created_at).toLocaleString("default", {
      month: "short",
    });
    if (!acc[month])
      acc[month] = { month, reviews: 0, approved: 0, rejected: 0 };
    acc[month].reviews += 1;
    if (log.action === "approved") acc[month].approved += 1;
    if (log.action === "rejected") acc[month].rejected += 1;
    return acc;
  }, {});
  const activityTimeline = Object.values(logsByMonth).slice(-6);

  /* ── Avg duration from logs ── */
  const durLogs = logs.filter((l) => l.duration_seconds);
  const avgDuration = durLogs.length
    ? Math.round(
        durLogs.reduce((s, l) => s + l.duration_seconds, 0) / durLogs.length,
      )
    : null;

  /* ── Currency from profile ── */
  const currency = profile?.currency || "TZS";

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <DashboardLayout role="editor">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── Header ── */}
        <div
          style={{
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: 24,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#1a202c",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Revenue Analytics
              </h2>
              <p
                style={{
                  color: "#718096",
                  margin: "4px 0 0",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Your earnings summary and review activity
              </p>
            </div>
            <button
              onClick={loadAll}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#4a5568",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            style={{
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              borderRadius: 12,
              padding: "12px 18px",
              color: "#c53030",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <X size={16} /> {error}
            <button
              onClick={loadAll}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#c53030",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#718096",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Loading analytics…
          </div>
        )}

        {!loading && earnings && (
          <>
            {/* ── All stats: one unified 4-col grid so every card is the same width ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 24,
              }}
            >
              {/* Row 1 — earnings */}
              <StatCard
                title="Total Earned"
                value={fmt(earnings.total_earned, currency)}
                sub={`${earnings.review_count} reviews completed`}
                accent={PRIMARY}
                icon={<DollarSign size={24} />}
              />
              <StatCard
                title="Pending Payout"
                value={fmt(earnings.total_pending, currency)}
                sub="Awaiting confirmation"
                accent="#dd6b20"
                icon={<Clock size={24} />}
              />
              <StatCard
                title="Confirmed"
                value={fmt(earnings.total_confirmed, currency)}
                sub="Ready to pay out"
                accent="#3182ce"
                icon={<TrendingUp size={24} />}
              />
              <StatCard
                title="Paid Out"
                value={fmt(earnings.total_paid, currency)}
                sub="Already disbursed"
                accent="#38a169"
                icon={<CheckCircle size={24} />}
              />

              {/* Row 2 — profile counters (exactly 4, balanced with row 1) */}
              {profile && (
                <>
                  <StatCard
                    title="Total Reviews"
                    value={profile.total_reviews ?? 0}
                    sub={`Fee: ${fmt(profile.review_fee, currency)}`}
                    accent={PRIMARY}
                    icon={<BarChart3 size={24} />}
                  />
                  <StatCard
                    title="Approvals"
                    value={profile.total_approvals ?? 0}
                    accent="#38a169"
                    icon={<CheckCircle size={24} />}
                  />
                  <StatCard
                    title="Rejections"
                    value={profile.total_rejections ?? 0}
                    accent="#e53e3e"
                    icon={<XCircle size={24} />}
                  />
                  <StatCard
                    title="Avg Review Time"
                    value={
                      avgDuration
                        ? fmtDuration(avgDuration)
                        : profile.avg_review_hours
                          ? `${profile.avg_review_hours.toFixed(1)}h`
                          : "—"
                    }
                    accent={TEAL}
                    icon={<Clock size={24} />}
                  />
                </>
              )}
            </div>

            {/* ── Earnings breakdown ── */}
            <ChartCard title="Earnings Breakdown">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    {
                      label: "Pending",
                      value: earnings.total_pending,
                      fill: "#f6ad55",
                    },
                    {
                      label: "Confirmed",
                      value: earnings.total_confirmed,
                      fill: "#63b3ed",
                    },
                    {
                      label: "Paid",
                      value: earnings.total_paid,
                      fill: "#68d391",
                    },
                  ]}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tt}
                    formatter={(v) => [fmt(v, currency), "Amount"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {[
                      earnings.total_pending,
                      earnings.total_confirmed,
                      earnings.total_paid,
                    ].map((_, i) => (
                      <Cell
                        key={i}
                        fill={["#f6ad55", "#63b3ed", "#68d391"][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Review activity + action breakdown ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
                gap: 24,
              }}
            >
              {activityTimeline.length > 0 && (
                <ChartCard title="Monthly Review Activity">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={activityTimeline}>
                      <defs>
                        <linearGradient
                          id="revGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={PRIMARY}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={PRIMARY}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="tealGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={TEAL}
                            stopOpacity={0.15}
                          />
                          <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        stroke="#718096"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        fontWeight={600}
                      />
                      <YAxis
                        stroke="#718096"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        fontWeight={600}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tt} />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ paddingTop: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="reviews"
                        name="Total"
                        stroke={PRIMARY}
                        fill="url(#revGrad)"
                        strokeWidth={3}
                        dot={{ r: 3, fill: PRIMARY }}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke={TEAL}
                        fill="url(#tealGrad)"
                        strokeWidth={3}
                        dot={{ r: 3, fill: TEAL }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {actionChartData.length > 0 && (
                <ChartCard title="Reviews by Action Type">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={actionChartData} layout="vertical">
                      <XAxis
                        type="number"
                        stroke="#718096"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        fontWeight={600}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="action"
                        stroke="#718096"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        fontWeight={600}
                        width={130}
                      />
                      <Tooltip
                        contentStyle={tt}
                        formatter={(v) => [v, "Reviews"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {actionChartData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </>
        )}

        {/* ── Review Logs Table ── */}
        {!loading && (
          <ChartCard
            title={`Review Logs${logsTotal ? ` · ${logsTotal} total` : ""}`}
          >
            {logsLoading ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#718096",
                  padding: "24px 0",
                  fontWeight: 600,
                }}
              >
                Loading logs…
              </p>
            ) : logs.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#a0aec0",
                  padding: "24px 0",
                  fontWeight: 600,
                }}
              >
                No review logs yet
              </p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                        {[
                          "Record",
                          "Action",
                          "Status Change",
                          "Duration",
                          "Remarks",
                          "Earning",
                          "Date",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#718096",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const ac = ACTION_COLORS[log.action] || {
                          bg: "#f7fafc",
                          color: "#718096",
                          border: "#e2e8f0",
                        };
                        return (
                          <tr
                            key={log.id}
                            style={{ borderBottom: "1px solid #f7fafc" }}
                          >
                            {/* Record */}
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 13,
                                color: "#1a202c",
                                fontWeight: 700,
                              }}
                            >
                              <span
                                style={{
                                  textTransform: "capitalize",
                                  color: "#4a5568",
                                }}
                              >
                                {log.record_type}
                              </span>
                              <span style={{ color: "#a0aec0", marginLeft: 4 }}>
                                #{log.record_id}
                              </span>
                            </td>
                            {/* Action badge */}
                            <td style={{ padding: "14px 16px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: ac.bg,
                                  color: ac.color,
                                  border: `1px solid ${ac.border}`,
                                  textTransform: "capitalize",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            {/* Status change */}
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 12,
                                color: "#718096",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.previous_status ? (
                                <>
                                  <span style={{ fontWeight: 600 }}>
                                    {log.previous_status}
                                  </span>{" "}
                                  →{" "}
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#1a202c",
                                    }}
                                  >
                                    {log.new_status || "—"}
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: "#cbd5e0" }}>—</span>
                              )}
                            </td>
                            {/* Duration */}
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 13,
                                color: "#4a5568",
                                fontWeight: 600,
                              }}
                            >
                              {fmtDuration(log.duration_seconds)}
                            </td>
                            {/* Remarks */}
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 12,
                                color: "#718096",
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.remarks || (
                                <span style={{ color: "#cbd5e0" }}>—</span>
                              )}
                            </td>
                            {/* Earning */}
                            <td style={{ padding: "14px 16px" }}>
                              {log.earning_id ? (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#38a169",
                                    background: "#f0fff4",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                  }}
                                >
                                  #{log.earning_id}
                                </span>
                              ) : (
                                <span
                                  style={{ color: "#cbd5e0", fontSize: 12 }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                            {/* Date */}
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 12,
                                color: "#a0aec0",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {timeAgo(log.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {profile && (logs.length === 20 || logsPage > 1) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 20,
                    }}
                  >
                    <button
                      onClick={() => fetchLogs(profile.id, logsPage - 1)}
                      disabled={logsPage === 1 || logsLoading}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: logsPage === 1 ? "#cbd5e0" : "#4a5568",
                        cursor: logsPage === 1 ? "not-allowed" : "pointer",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      ← Prev
                    </button>
                    <span
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        color: "#718096",
                        fontWeight: 600,
                      }}
                    >
                      Page {logsPage}
                    </span>
                    <button
                      onClick={() => fetchLogs(profile.id, logsPage + 1)}
                      disabled={logs.length < 20 || logsLoading}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: logs.length < 20 ? "#cbd5e0" : "#4a5568",
                        cursor: logs.length < 20 ? "not-allowed" : "pointer",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </ChartCard>
        )}
      </div>
    </DashboardLayout>
  );
}

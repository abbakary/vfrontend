import { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import {
  Eye,
  Bookmark,
  TrendingUp,
  FileText,
  Download,
  Activity,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { useThemeColors } from "../../utils/useThemeColors";
import { useChartColors } from "../../utils/useChartColors";
import {
  publicDatasetService,
  viewService,
  downloadService,
  reportService,
} from "../../utils/apiService";
import { getCurrentUserId } from "../../utils/session";

// ─── PALETTE ────────────────────────────────────────────────────────────────
const P = {
  orange: "#FF8C00",
  teal: "#20B2AA",
  amber: "#F59E0B",
  rose: "#F43F5E",
  indigo: "#6366F1",
  emerald: "#10B981",
  sky: "#0EA5E9",
  slate: "#64748B",
};
const PIE_COLORS = [P.orange, P.teal, P.amber, P.indigo, P.emerald];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
};

const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");

// ─── MINI BADGE ─────────────────────────────────────────────────────────────
const Trend = ({ value }) => {
  const up = value >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 11,
        fontWeight: 700,
        color: up ? P.emerald : P.rose,
        background: up ? "#d1fae5" : "#ffe4e6",
        borderRadius: 20,
        padding: "2px 8px",
      }}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(value)}%
    </span>
  );
};

// ─── METRIC CARD ────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon, accent, trend, loading }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #f1f5f9",
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* accent bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: accent,
        borderRadius: "20px 20px 0 0",
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
        }}
      >
        {icon}
      </div>
      {trend !== undefined && !loading && <Trend value={trend} />}
    </div>
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {loading ? (
          <div
            style={{
              width: 80,
              height: 28,
              background: "#f1f5f9",
              borderRadius: 8,
            }}
          />
        ) : (
          fmt(value)
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#94a3b8",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      {sub && !loading && (
        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

// ─── SECTION HEADER ─────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 16,
    }}
  >
    <div>
      <h3
        style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}
      >
        {title}
      </h3>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: "#94a3b8",
            margin: "3px 0 0",
            fontWeight: 500,
          }}
        >
          {sub}
        </p>
      )}
    </div>
    {action}
  </div>
);

// ─── PANEL ──────────────────────────────────────────────────────────────────
const Panel = ({ children, style = {} }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #f1f5f9",
      padding: 24,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── CUSTOM TOOLTIP ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        minWidth: 120,
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "#94a3b8",
          margin: "0 0 6px",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: p.color,
            margin: "2px 0",
          }}
        >
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── DATASET ROW ────────────────────────────────────────────────────────────
const DatasetRow = ({ d, i, themeColors }) => (
  <tr
    style={{
      borderBottom: "1px solid #f8fafc",
      background: i % 2 === 0 ? "#fff" : "#fafbfc",
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdfa")}
    onMouseLeave={(e) =>
      (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc")
    }
  >
    <td style={{ padding: "13px 16px" }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#0f172a",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {d.title || "Untitled"}
      </div>
      {d.summary && (
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
        >
          {d.summary}
        </div>
      )}
    </td>
    <td style={{ padding: "13px 16px" }}>
      {d.category_name || d.category?.name ? (
        <span
          style={{
            padding: "2px 9px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            background: "#eff6ff",
            color: "#3b82f6",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {d.category_name || d.category?.name}
        </span>
      ) : (
        <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
      )}
    </td>
    <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b" }}>
      {d.country || d.country_code || "—"}
    </td>
    <td style={{ padding: "13px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 60,
            height: 5,
            background: "#f1f5f9",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 99,
              background: P.teal,
              width: `${Math.min(100, ((d.total_views || 0) / 5000) * 100)}%`,
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
          {fmt(d.total_views || 0)}
        </span>
      </div>
    </td>
    <td
      style={{
        padding: "13px 16px",
        fontSize: 12,
        fontWeight: 700,
        color: "#0f172a",
      }}
    >
      {fmt(d.total_downloads || 0)}
    </td>
  </tr>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function SellerDashboard() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [datasets, setDatasets] = useState([]);
  const [viewHistory, setViewHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    datasetsViewed: 0,
    totalDatasets: 0,
    reportsCount: 0,
    downloadsCount: 0,
    totalViews: 0,
    avgViews: 0,
    topCategory: "—",
    engagementRate: 0,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const userId = await getCurrentUserId();
      const [datasetsRes, historyRes, reportsRes, downloadsRes] =
        await Promise.allSettled([
          publicDatasetService.list({ limit: 50 }),
          viewService.byUser(userId, { limit: 50 }),
          reportService.mine({ limit: 20 }),
          downloadService.history({ limit: 20 }),
        ]);

      let allDatasets = [];
      if (datasetsRes.status === "fulfilled") {
        const data = datasetsRes.value.data;
        const list = data?.items || data?.data || data || [];
        allDatasets = Array.isArray(list) ? list : [];
        setDatasets(allDatasets);

        // Compute richer stats from datasets
        const totalViews = allDatasets.reduce(
          (s, d) => s + (d.total_views || 0),
          0,
        );
        const totalDl = allDatasets.reduce(
          (s, d) => s + (d.total_downloads || 0),
          0,
        );
        const avgViews = allDatasets.length
          ? Math.round(totalViews / allDatasets.length)
          : 0;

        // Top category by dataset count
        const catCount = {};
        allDatasets.forEach((d) => {
          const c = d.category_name || d.category?.name || "Other";
          catCount[c] = (catCount[c] || 0) + 1;
        });
        const topCategory =
          Object.entries(catCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";
        const engagementRate =
          totalViews > 0
            ? parseFloat(((totalDl / totalViews) * 100).toFixed(1))
            : 0;

        setStats((prev) => ({
          ...prev,
          totalDatasets: data?.total || allDatasets.length,
          totalViews,
          avgViews,
          topCategory,
          engagementRate,
          downloadsCount: totalDl,
        }));
      }

      if (historyRes.status === "fulfilled") {
        const data = historyRes.value.data;
        const list = data?.items || data?.data || data || [];
        const arr = Array.isArray(list) ? list : [];
        setViewHistory(arr);
        setStats((prev) => ({
          ...prev,
          datasetsViewed: data?.total || arr.length,
        }));
      }

      if (reportsRes.status === "fulfilled") {
        const data = reportsRes.value.data;
        const list = data?.items || data?.data || data || [];
        const arr = Array.isArray(list) ? list : [];
        setReports(arr);
        setStats((prev) => ({
          ...prev,
          reportsCount: data?.total || arr.length,
        }));
      }

      if (downloadsRes.status === "fulfilled") {
        const data = downloadsRes.value.data;
        const list = data?.items || data?.data || data || [];
        setStats((prev) => ({
          ...prev,
          downloadsCount:
            data?.total || (Array.isArray(list) ? list.length : 0),
        }));
      }
    } catch (err) {
      console.error("Viewer dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived chart data ────────────────────────────────────────────────────

  // Category breakdown
  const catMap = {};
  datasets.forEach((d) => {
    const cat = d.category_name || d.category?.name || "Other";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Views by category
  const catViewMap = {};
  datasets.forEach((d) => {
    const cat = d.category_name || d.category?.name || "Other";
    catViewMap[cat] = (catViewMap[cat] || 0) + (d.total_views || 0);
  });
  const categoryViewData = Object.entries(catViewMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, views]) => ({ name, views }));

  // View history by weekday
  const dayMap = {};
  DAYS.forEach((d) => {
    dayMap[d] = 0;
  });
  viewHistory.forEach((v) => {
    if (v.created_at || v.viewed_at) {
      const day = DAYS[new Date(v.created_at || v.viewed_at).getDay()];
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
  });
  const viewingHistoryData = DAYS.map((day) => ({ day, views: dayMap[day] }));

  // View history by month (from datasets created_at)
  const monthMap = {};
  datasets.forEach((d) => {
    if (d.created_at) {
      const m = MONTH_NAMES[new Date(d.created_at).getMonth()];
      if (!monthMap[m]) monthMap[m] = { month: m, views: 0, downloads: 0 };
      monthMap[m].views += d.total_views || 0;
      monthMap[m].downloads += d.total_downloads || 0;
    }
  });
  const trendData = MONTH_NAMES.filter((m) => monthMap[m])
    .map((m) => monthMap[m])
    .slice(-6);

  // Top 5 datasets by views
  const topDatasets = [...datasets]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 5)
    .map((d) => ({
      name:
        d.title?.length > 18
          ? d.title.slice(0, 18) + "…"
          : d.title || "Untitled",
      views: d.total_views || 0,
      downloads: d.total_downloads || 0,
    }));

  // Engagement funnel
  const totalViews = datasets.reduce((s, d) => s + (d.total_views || 0), 0);
  const totalDl = datasets.reduce((s, d) => s + (d.total_downloads || 0), 0);
  const funnelData = [
    { name: "Browsed", value: totalViews, fill: P.sky },
    { name: "Viewed", value: Math.round(totalViews * 0.6), fill: P.teal },
    { name: "Downloaded", value: totalDl, fill: P.orange },
  ];

  // Radial activity score
  const activityScore = Math.min(
    100,
    Math.round(
      (stats.datasetsViewed * 2 +
        stats.downloadsCount * 5 +
        stats.reportsCount * 10) /
        10,
    ),
  );
  const radialData = [
    { name: "Activity", value: activityScore, fill: P.orange },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="viewer">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .viewer-dash * { font-family: 'DM Sans', sans-serif; }
        .viewer-dash h1,
        .viewer-dash h2,
        .viewer-dash h3 { font-family: 'Syne', sans-serif; }
        .dash-fade-in { animation: dashFadeIn 0.5s ease both; }
        @keyframes dashFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
      `}</style>

      <div
        className="viewer-dash"
        style={{ display: "flex", flexDirection: "column", gap: 28 }}
      >
        {/* ── HERO BANNER ─────────────────────────────────────────────── */}
        <div
          className="dash-fade-in"
          style={{
            borderRadius: 24,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f3460 100%)",
            padding: "36px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 20px 40px rgba(15,23,42,0.3)",
          }}
        >
          {/* BG decoration */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: 120,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,140,0,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: 200,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(32,178,170,0.12) 0%, transparent 70%)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: P.emerald,
                  boxShadow: `0 0 0 3px rgba(16,185,129,0.3)`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: P.emerald,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Live Dashboard
              </span>
            </div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: 0,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Data Explorer <span style={{ color: P.orange }}>Overview</span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                margin: "10px 0 0",
                fontSize: 15,
                fontWeight: 500,
                maxWidth: 420,
              }}
            >
              {loading
                ? "Loading your analytics..."
                : `Tracking ${fmt(stats.totalDatasets)} datasets · ${fmt(stats.totalViews)} total views · ${stats.engagementRate}% engagement rate`}
            </p>
          </div>

          {/* Radial activity score */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ width: 120, height: 120, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}
                >
                  {activityScore}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Score
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#64748b",
                margin: "6px 0 0",
                fontWeight: 600,
              }}
            >
              Activity Score
            </p>
          </div>
        </div>

        {/* ── METRIC CARDS ────────────────────────────────────────────── */}
        <div
          className="dash-fade-in"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            animationDelay: "0.1s",
            paddingBottom: 8,
            justifyContent: "flex-start",
          }}
        >
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Datasets Viewed"
              value={stats.datasetsViewed}
              trend={12}
              icon={<Eye size={20} />}
              accent={P.teal}
              loading={loading}
            />
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Total Datasets"
              value={stats.totalDatasets}
              trend={8}
              icon={<Bookmark size={20} />}
              accent={P.indigo}
              loading={loading}
            />
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Downloads"
              value={stats.downloadsCount}
              trend={5}
              icon={<Download size={20} />}
              accent={P.orange}
              loading={loading}
            />
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Total Views"
              value={stats.totalViews}
              trend={15}
              icon={<Activity size={20} />}
              accent={P.sky}
              loading={loading}
              sub={`Avg ${fmt(stats.avgViews)} per dataset`}
            />
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Reports"
              value={stats.reportsCount}
              icon={<FileText size={20} />}
              accent={P.rose}
              loading={loading}
            />
          </div>
          <div style={{ flex: "1 1 30%", minWidth: 250, maxWidth: 340 }}>
            <MetricCard
              label="Engagement Rate"
              value={stats.engagementRate}
              trend={3}
              icon={<Zap size={20} />}
              accent={P.emerald}
              loading={loading}
              sub={`Downloads ÷ Views`}
            />
          </div>
        </div>

        {/* ── TREND + WEEKDAY ACTIVITY ────────────────────────────────── */}
        <div
          className="dash-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 20,
            animationDelay: "0.2s",
          }}
        >
          <Panel>
            <SectionHeader
              title="Views & Downloads Trend"
              sub="Monthly breakdown from your dataset portfolio"
              action={
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: P.teal,
                    background: "#f0fdfa",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  Last 6 months
                </span>
              }
            />
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    trendData.length
                      ? trendData
                      : [{ month: "—", views: 0, downloads: 0 }]
                  }
                >
                  <defs>
                    <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.teal} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={P.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDl" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={P.orange}
                        stopOpacity={0.2}
                      />
                      <stop offset="95%" stopColor={P.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: 12,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke={P.teal}
                    fill="url(#gView)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    name="Downloads"
                    stroke={P.orange}
                    fill="url(#gDl)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              title="Weekday Activity"
              sub="When you're most active"
            />
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewingHistoryData} barSize={16}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="views" name="Views" radius={[6, 6, 0, 0]}>
                    {viewingHistoryData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={
                          e.views ===
                          Math.max(...viewingHistoryData.map((d) => d.views))
                            ? P.orange
                            : P.teal
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ── CATEGORY VIEWS + FUNNEL ──────────────────────────────────── */}
        <div
          className="dash-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
            animationDelay: "0.3s",
          }}
        >
          {/* Category pie */}
          <Panel>
            <SectionHeader title="Datasets by Category" sub="Distribution" />
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      categoryData.length
                        ? categoryData
                        : [{ name: "No Data", value: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(categoryData.length ? categoryData : [{}]).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Category views bar */}
          <Panel>
            <SectionHeader title="Views by Category" sub="Top 5 categories" />
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    categoryViewData.length
                      ? categoryViewData
                      : [{ name: "—", views: 0 }]
                  }
                  layout="vertical"
                  barSize={14}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="views" name="Views" radius={[0, 6, 6, 0]}>
                    {categoryViewData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Engagement funnel */}
          <Panel>
            <SectionHeader
              title="Engagement Funnel"
              sub="Browse → View → Download"
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              {funnelData.map((f, i) => {
                const maxVal = funnelData[0].value || 1;
                const w = Math.max(10, (f.value / maxVal) * 100);
                return (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#475569",
                        }}
                      >
                        {f.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {fmt(f.value)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: "#f1f5f9",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${w}%`,
                          background: f.fill,
                          borderRadius: 99,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    {i < funnelData.length - 1 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginTop: 3,
                          fontWeight: 600,
                        }}
                      >
                        {pct(funnelData[i + 1].value, f.value)}% conversion
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Engagement rate ring */}
              <div
                style={{
                  marginTop: 8,
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `conic-gradient(${P.orange} ${stats.engagementRate * 3.6}deg, #e2e8f0 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {stats.engagementRate}%
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Engagement Rate
                  </p>
                  <p
                    style={{
                      margin: "1px 0 0",
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    Downloads ÷ Views
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── TOP DATASETS CHART ───────────────────────────────────────── */}
        <div className="dash-fade-in" style={{ animationDelay: "0.35s" }}>
          <Panel>
            <SectionHeader
              title="Top Datasets by Views"
              sub="Your 5 most-viewed datasets"
              action={
                <a
                  href="/dashboard/viewer/browse"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: P.teal,
                    background: "#f0fdfa",
                    padding: "4px 12px",
                    borderRadius: 20,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Browse All <ArrowUpRight size={12} />
                </a>
              }
            />
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    topDatasets.length
                      ? topDatasets
                      : [{ name: "No Data", views: 0, downloads: 0 }]
                  }
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: 10,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="views"
                    name="Views"
                    fill={P.teal}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="downloads"
                    name="Downloads"
                    fill={P.orange}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ── DATASETS TABLE ───────────────────────────────────────────── */}
        <div className="dash-fade-in" style={{ animationDelay: "0.4s" }}>
          <Panel>
            <SectionHeader
              title="Explore Datasets"
              sub={`Showing ${Math.min(8, datasets.length)} of ${stats.totalDatasets} datasets`}
              action={
                <a
                  href="/dashboard/viewer/browse"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: P.teal,
                    background: "#f0fdfa",
                    padding: "4px 12px",
                    borderRadius: 20,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Browse All <ArrowUpRight size={12} />
                </a>
              }
            />
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "#94a3b8",
                }}
              >
                Loading datasets...
              </div>
            ) : datasets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 36, margin: "0 0 8px" }}>📦</p>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>
                  No datasets available
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                      {[
                        "Dataset",
                        "Category",
                        "Country",
                        "Views",
                        "Downloads",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "11px 16px",
                            textAlign: "left",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.slice(0, 8).map((d, i) => (
                      <DatasetRow
                        key={d.id}
                        d={d}
                        i={i}
                        themeColors={themeColors}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* ── RECENT VIEWS + REPORTS ───────────────────────────────────── */}
        <div
          className="dash-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: reports.length > 0 ? "1fr 1fr" : "1fr",
            gap: 20,
            animationDelay: "0.45s",
          }}
        >
          {/* Recent view history */}
          <Panel>
            <SectionHeader
              title="Recent View History"
              sub="Datasets you've viewed recently"
              action={
                <a
                  href="/dashboard/viewer/history"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: P.teal,
                    background: "#f0fdfa",
                    padding: "4px 12px",
                    borderRadius: 20,
                    textDecoration: "none",
                  }}
                >
                  View All
                </a>
              }
            />
            {viewHistory.length === 0 ? (
              <p
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "24px 0",
                  fontSize: 13,
                }}
              >
                {loading
                  ? "Loading..."
                  : "No view history yet. Start exploring datasets!"}
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {viewHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0fdfa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "#e0fdf4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: P.emerald,
                        flexShrink: 0,
                      }}
                    >
                      <Eye size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.record?.title ||
                          item.dataset?.title ||
                          `Record #${item.record_id}`}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          margin: "2px 0 0",
                          fontWeight: 500,
                        }}
                      >
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                    <Globe
                      size={14}
                      style={{ color: "#cbd5e1", flexShrink: 0 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Reports */}
          {reports.length > 0 && (
            <Panel>
              <SectionHeader
                title="Available Reports"
                sub="Analytical reports for you"
                action={
                  <a
                    href="/dashboard/viewer/reports"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: P.teal,
                      background: "#f0fdfa",
                      padding: "4px 12px",
                      borderRadius: 20,
                      textDecoration: "none",
                    }}
                  >
                    View All
                  </a>
                }
              />
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {reports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fff7ed")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "#fff7ed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: P.orange,
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.title || "Untitled Report"}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          margin: "2px 0 0",
                          fontWeight: 500,
                        }}
                      >
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <Star
                      size={14}
                      style={{ color: "#fcd34d", flexShrink: 0 }}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

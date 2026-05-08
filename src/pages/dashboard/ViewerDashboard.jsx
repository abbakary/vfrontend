import { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import {
  Eye,
  Bookmark,
  TrendingUp,
  FileText,
  AlertTriangle,
  Loader,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useThemeColors } from "../../utils/useThemeColors";
import { useChartColors } from "../../utils/useChartColors";

// ─── Auth helpers ────────────────────────────────────────────────────────────
const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/** Fetch the current user's profile and return it, or throw on failure. */
async function fetchCurrentUser() {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN");

  const res = await fetch(`${BASE_URL}/users/me/profile`, {
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("FETCH_FAILED");

  const json = await res.json();
  // Backend returns { data: { ...user } }
  return json?.data ?? json;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = ["#FF8C00", "#20B2AA", "#ED8936", "#4FD1C5", "#CBD5E0"];

// ─── Auth gate states ─────────────────────────────────────────────────────────
const AUTH_STATE = {
  CHECKING: "checking",
  OK: "ok",
  NO_TOKEN: "no_token",
  UNAUTHORIZED: "unauthorized",
  WRONG_ROLE: "wrong_role",
  INACTIVE: "inactive",
  ERROR: "error",
};

// ─── Blocking screen shown while / instead of dashboard ──────────────────────
function AuthBlock({ state, themeColors }) {
  const configs = {
    [AUTH_STATE.CHECKING]: {
      icon: (
        <Loader
          size={40}
          style={{ animation: "spin 1s linear infinite", color: "#FF8C00" }}
        />
      ),
      title: "Verifying access…",
      message: "Please wait while we confirm your credentials.",
      color: "#FF8C00",
    },
    [AUTH_STATE.NO_TOKEN]: {
      icon: <AlertTriangle size={40} color="#ef4444" />,
      title: "Not logged in",
      message: "You must be logged in to view this page.",
      action: { label: "Go to Login", href: "/login" },
      color: "#ef4444",
    },
    [AUTH_STATE.UNAUTHORIZED]: {
      icon: <AlertTriangle size={40} color="#ef4444" />,
      title: "Session expired",
      message: "Your session has expired. Please log in again.",
      action: { label: "Log in again", href: "/login" },
      color: "#ef4444",
    },
    [AUTH_STATE.WRONG_ROLE]: {
      icon: <AlertTriangle size={40} color="#f59e0b" />,
      title: "Access denied",
      message:
        "This dashboard is only available to Viewer accounts. Your account does not have the required role.",
      action: { label: "Go back", href: "/dashboard" },
      color: "#f59e0b",
    },
    [AUTH_STATE.INACTIVE]: {
      icon: <AlertTriangle size={40} color="#f59e0b" />,
      title: "Account inactive",
      message:
        "Your account is not currently active. Please contact support to restore access.",
      action: { label: "Contact support", href: "/support" },
      color: "#f59e0b",
    },
    [AUTH_STATE.ERROR]: {
      icon: <AlertTriangle size={40} color="#ef4444" />,
      title: "Something went wrong",
      message: "We could not verify your identity. Please try again or log in.",
      action: { label: "Try again", href: "/login" },
      color: "#ef4444",
    },
  };

  const cfg = configs[state] ?? configs[AUTH_STATE.ERROR];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: themeColors?.bg ?? "#0f172a",
        padding: 24,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          borderRadius: 24,
          background: themeColors?.card ?? "#1e293b",
          border: `1px solid ${themeColors?.border ?? "#334155"}`,
          padding: "48px 40px",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ marginBottom: 20 }}>{cfg.icon}</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: cfg.color,
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          {cfg.title}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: themeColors?.textMuted ?? "#94a3b8",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          {cfg.message}
        </p>
        {cfg.action && (
          <a
            href={cfg.action.href}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 12,
              background: cfg.color,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            {cfg.action.label}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main dashboard component ─────────────────────────────────────────────────
export default function ViewerDashboard() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  // Auth gate
  const [authState, setAuthState] = useState(AUTH_STATE.CHECKING);
  const [currentUser, setCurrentUser] = useState(null);

  // Dashboard data
  const [datasets, setDatasets] = useState([]);
  const [viewHistory, setViewHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    datasetsViewed: 0,
    totalDatasets: 0,
    reportsCount: 0,
    downloadsCount: 0,
  });

  // ── Step 1: validate user ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const user = await fetchCurrentUser();

        // Role check
        if (user.role !== "viewer") {
          setAuthState(AUTH_STATE.WRONG_ROLE);
          return;
        }

        // Status check — only 'active' is permitted
        if (user.status !== "active") {
          setAuthState(AUTH_STATE.INACTIVE);
          return;
        }

        setCurrentUser(user);
        setAuthState(AUTH_STATE.OK);
      } catch (err) {
        if (err.message === "NO_TOKEN") setAuthState(AUTH_STATE.NO_TOKEN);
        else if (err.message === "UNAUTHORIZED")
          setAuthState(AUTH_STATE.UNAUTHORIZED);
        else setAuthState(AUTH_STATE.ERROR);
      }
    })();
  }, []);

  // ── Step 2: load dashboard data (only once auth is OK) ─────────────────────
  useEffect(() => {
    if (authState !== AUTH_STATE.OK || !currentUser) return;

    (async () => {
      try {
        const userId = currentUser.id;

        const [datasetsRes, historyRes, reportsRes, downloadsRes] =
          await Promise.allSettled([
            publicDatasetService.list({ limit: 20 }),
            viewService.byUser(userId, { limit: 20 }),
            reportService.mine({ limit: 10 }),
            downloadService.history({ limit: 10 }),
          ]);

        if (datasetsRes.status === "fulfilled") {
          const data = datasetsRes.value.data;
          const list = data?.items || data?.data || data || [];
          const arr = Array.isArray(list) ? list : [];
          setDatasets(arr);
          setStats((prev) => ({
            ...prev,
            totalDatasets: data?.total || arr.length,
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
        console.error("Viewer dashboard data error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authState, currentUser]);

  // ── Render auth gate for non-OK states ────────────────────────────────────
  if (authState !== AUTH_STATE.OK) {
    return <AuthBlock state={authState} themeColors={themeColors} />;
  }

  // ── Derived chart data ────────────────────────────────────────────────────
  const catMap = {};
  datasets.forEach((d) => {
    const cat = d.category?.name || d.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(catMap)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const dayMap = {};
  viewHistory.forEach((v) => {
    if (v.created_at || v.viewed_at) {
      const day = new Date(v.created_at || v.viewed_at).toLocaleString(
        "default",
        { weekday: "short" },
      );
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
  });
  const viewingHistoryData = Object.entries(dayMap).map(([day, views]) => ({
    day,
    views,
  }));

  // ── Render dashboard ──────────────────────────────────────────────────────
  const displayName = currentUser?.full_name?.split(" ")[0] || "Viewer";

  return (
    <DashboardLayout role="viewer">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Welcome Banner */}
        <div
          style={{
            borderRadius: 24,
            background: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            padding: 40,
            color: themeColors.text,
            boxShadow: themeColors.isDarkMode
              ? "0 20px 25px -5px rgba(0,0,0,0.3)"
              : "0 20px 25px -5px rgba(0,0,0,0.05)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.02em",
                color: themeColors.text,
              }}
            >
              Welcome back,{" "}
              <span style={{ color: "#FF8C00" }}>{displayName}!</span>
            </h2>
            <p
              style={{
                color: themeColors.textMuted,
                marginTop: 8,
                marginBottom: 0,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {loading
                ? "Loading your dashboard…"
                : "Explore datasets and discover new insights."}
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background:
                "linear-gradient(135deg, #FF8C00 0%, transparent 70%)",
              opacity: 0.1,
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 24,
          }}
        >
          <StatCard
            title="Datasets Viewed"
            value={loading ? "…" : stats.datasetsViewed}
            change={12}
            icon={<Eye size={24} />}
          />
          <StatCard
            title="Available Datasets"
            value={loading ? "…" : stats.totalDatasets}
            change={8}
            icon={<Bookmark size={24} />}
          />
          <StatCard
            title="Downloads"
            value={loading ? "…" : stats.downloadsCount}
            change={5}
            icon={<TrendingUp size={24} />}
          />
          <StatCard
            title="Reports"
            value={loading ? "…" : stats.reportsCount}
            icon={<FileText size={24} />}
          />
        </div>

        {/* Browse Datasets */}
        <ChartCard
          title="Explore Datasets"
          action={
            <a
              href="/dashboard/viewer/browse"
              style={{
                fontSize: 14,
                color: "#20B2AA",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse All
            </a>
          }
        >
          {loading ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              Loading datasets…
            </p>
          ) : datasets.length === 0 ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              No datasets available
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{ borderBottom: `1px solid ${themeColors.border}` }}
                  >
                    {["Title", "Category", "Country", "Views", "Downloads"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 13,
                            fontWeight: 700,
                            color: themeColors.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {datasets.slice(0, 8).map((d) => (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        viewService.add("dataset", d.id).catch(() => {})
                      }
                    >
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: themeColors.text,
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.title}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.category?.name || d.category || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.country || d.country_code || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.total_views || 0}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.total_downloads || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* Charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24,
          }}
        >
          <ChartCard title="My Viewing Activity">
            <div style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    viewingHistoryData.length
                      ? viewingHistoryData
                      : [{ day: "No Data", views: 0 }]
                  }
                >
                  <XAxis
                    dataKey="day"
                    stroke={chartColors.text}
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Bar dataKey="views" fill="#20B2AA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Datasets by Category">
            <div style={{ height: 256 }}>
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
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {(categoryData.length
                      ? categoryData
                      : [{ name: "No Data", value: 1 }]
                    ).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* View History */}
        <ChartCard
          title="Recent View History"
          action={
            <a
              href="/dashboard/viewer/history"
              style={{
                fontSize: 14,
                color: "#20B2AA",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View All
            </a>
          }
        >
          {viewHistory.length === 0 ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              {loading
                ? "Loading…"
                : "No view history yet. Start exploring datasets!"}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 20,
              }}
            >
              {viewHistory.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    borderRadius: 16,
                    background: themeColors.hoverBg,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: themeColors.isDarkMode
                        ? "#1e3a1e"
                        : "#f0fff4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#38a169",
                    }}
                  >
                    <Eye size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: themeColors.text,
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
                        fontSize: 12,
                        color: themeColors.textMuted,
                        margin: "2px 0 0",
                        fontWeight: 600,
                      }}
                    >
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Reports */}
        {reports.length > 0 && (
          <ChartCard
            title="Available Reports"
            action={
              <a
                href="/dashboard/viewer/reports"
                style={{
                  fontSize: 14,
                  color: "#20B2AA",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View All
              </a>
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 16,
              }}
            >
              {reports.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    background: themeColors.hoverBg,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: themeColors.text,
                      margin: "0 0 8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: themeColors.textMuted,
                      margin: 0,
                    }}
                  >
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </DashboardLayout>
  );
}

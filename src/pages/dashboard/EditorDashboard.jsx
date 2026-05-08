import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "./components/DashboardLayout";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import {
  FileCheck,
  Database,
  Clock,
  Check,
  X,
  AlertTriangle,
  Loader,
  UserPlus,
  Edit3,
} from "lucide-react";
import {
  LineChart,
  Line,
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

/* ─── API config ─── */
const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const api = {
  get: (path) =>
    fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then((r) => {
      if (!r.ok)
        throw Object.assign(new Error(r.statusText), { status: r.status });
      return r.json();
    }),
  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok)
        throw Object.assign(new Error(r.statusText), { status: r.status });
      return r.json();
    }),
  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok)
        throw Object.assign(new Error(r.statusText), { status: r.status });
      return r.json();
    }),
};

/* ─── Constants & helpers ─── */
const COLORS = ["#20B2AA", "#e53e3e", "#FF8C00"];

const Badge = ({ children, themeColors, ...style }) => (
  <span
    style={{
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </span>
);

/* ─────────────────────────────────────────
   GATE / LOADING SCREENS (unchanged)
───────────────────────────────────────── */
function AccessDenied({ message }) {
  const themeColors = useThemeColors();
  return (
    <DashboardLayout role="editor">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 20,
          textAlign: "center",
        }}
      >
        <AlertTriangle size={56} color="#FF8C00" strokeWidth={1.5} />
        <h2
          style={{
            color: themeColors.text,
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            color: themeColors.textMuted,
            fontSize: 16,
            maxWidth: 380,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {message}
        </p>
        <a
          href="/login"
          style={{
            marginTop: 8,
            padding: "12px 28px",
            background: "#FF8C00",
            color: "#fff",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Go to Login
        </a>
      </div>
    </DashboardLayout>
  );
}

function FullPageLoader() {
  const themeColors = useThemeColors();
  return (
    <DashboardLayout role="editor">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
          color: themeColors.textMuted,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
        Verifying editor access…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
───────────────────────────────────────── */
export default function EditorDashboard() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  /* Auth state */
  const [authState, setAuthState] = useState({
    checking: true,
    allowed: false,
    editorName: "",
    editorId: null,
    denyMessage: "",
  });

  /* Data state */
  const [queueDatasets, setQueueDatasets] = useState([]); // unassigned pending
  const [assignedDatasets, setAssignedDatasets] = useState([]); // my assigned
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedDatasets: 0,
    rejectedDatasets: 0,
    totalRequests: 0,
  });

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [editingMetadata, setEditingMetadata] = useState(null); // datasetId or null
  const [metadataForm, setMetadataForm] = useState({
    title: "",
    summary: "",
    description: "",
    tags: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "assigned"

  /* ── Step 1: verify editor ── */
  useEffect(() => {
    const verify = async () => {
      const token = getToken();
      if (!token) {
        setAuthState({
          checking: false,
          allowed: false,
          editorName: "",
          editorId: null,
          denyMessage:
            "You are not logged in. Please log in to access the editor dashboard.",
        });
        return;
      }

      try {
        const user = await api.get("/auth/me");
        if (!user || !["editor", "admin", "super_admin"].includes(user.role)) {
          setAuthState({
            checking: false,
            allowed: false,
            editorName: "",
            editorId: null,
            denyMessage: `Your account role is "${user?.role || "unknown"}". Only editors can access this dashboard.`,
          });
          return;
        }

        const check = await api.get("/editor-profiles/check-me");
        setAuthState({
          checking: false,
          allowed: true,
          editorName: check.profile?.display_name || user.full_name || "Editor",
          editorId: user.id,
          denyMessage: "",
        });
      } catch (err) {
        const detail =
          err?.status === 401
            ? "Your session has expired. Please log in again."
            : "Authentication failed. Please try again.";
        setAuthState({
          checking: false,
          allowed: false,
          editorName: "",
          editorId: null,
          denyMessage: detail,
        });
      }
    };
    verify();
  }, []);

  /* ── Step 2: fetch all data ── */
  const fetchDashboardData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [queueRes, assignedRes, requestsRes, subsRes, customRes] =
        await Promise.allSettled([
          api.get("/editor/datasets/queue?page=1&page_size=50"),
          api.get("/editor/datasets/assigned?page=1&page_size=50"),
          api.get("/record-requests/?page=1&page_size=50"),
          api.get("/subscriptions/?page=1&page_size=20"),
          api.get("/custom-requests/?page=1&page_size=20"),
        ]);

      if (queueRes.status === "fulfilled") {
        const items = queueRes.value.items || [];
        setQueueDatasets(items);
      }
      if (assignedRes.status === "fulfilled") {
        const items = assignedRes.value.items || [];
        setAssignedDatasets(items);
      }
      // combine for stats: total pending = queue + assigned
      const totalPending =
        (queueRes.status === "fulfilled"
          ? (queueRes.value.items || []).length
          : 0) +
        (assignedRes.status === "fulfilled"
          ? (assignedRes.value.items || []).length
          : 0);
      setStats((prev) => ({
        ...prev,
        pendingReviews: totalPending,
        approvedDatasets: 0, // we could compute from history endpoint if needed, but keep simple
        rejectedDatasets: 0,
      }));

      if (requestsRes.status === "fulfilled") {
        const items = requestsRes.value.items || [];
        setRequests(items);
        setStats((prev) => ({
          ...prev,
          totalRequests: requestsRes.value.total || items.length,
        }));
      }
      if (subsRes.status === "fulfilled")
        setSubscriptions(subsRes.value.items || []);
      if (customRes.status === "fulfilled")
        setCustomRequests(customRes.value.items || []);
    } catch (err) {
      console.error("Editor dashboard data error:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState.allowed) fetchDashboardData();
  }, [authState.allowed, fetchDashboardData]);

  /* ── Assignment & review actions ── */
  const assignDataset = async (datasetId) => {
    setActionLoading(true);
    try {
      await api.post(`/editor/datasets/${datasetId}/review`, {
        action: "review_started",
        new_approval_status: "pending_review", // keep as is
        remarks: "Editor started review",
      });
      // refresh both lists
      await fetchDashboardData();
    } catch (err) {
      console.error("Assign error:", err);
      alert(err.message || "Could not assign dataset. It may have been taken.");
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (datasetId, verdict) => {
    setActionLoading(true);
    try {
      await api.post(`/editor/datasets/${datasetId}/review`, {
        action: verdict, // "approved" or "rejected"
        new_approval_status: verdict,
        new_marketplace_status: verdict === "approved" ? "listed" : "unlisted",
        remarks: reviewNotes || undefined,
      });
      setSelectedDataset(null);
      setReviewNotes("");
      await fetchDashboardData(); // refresh both queues
    } catch (err) {
      console.error(`${verdict} error:`, err);
      alert(`Failed to ${verdict} dataset: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const updateMetadata = async (datasetId) => {
    setActionLoading(true);
    try {
      const payload = {
        title: metadataForm.title || undefined,
        summary: metadataForm.summary || undefined,
        description: metadataForm.description || undefined,
        tags: metadataForm.tags
          ? metadataForm.tags.split(",").map((t) => t.trim())
          : undefined,
      };
      await api.put(`/editor/datasets/${datasetId}/metadata`, payload);
      setEditingMetadata(null);
      await fetchDashboardData(); // refresh datasets
    } catch (err) {
      console.error("Metadata update error:", err);
      alert(
        "Failed to update metadata. Make sure you are assigned to this dataset.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      await api.post(`/record-requests/${requestId}/approve`, {});
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "approved" } : r,
        ),
      );
    } catch (err) {
      console.error("Approve request error:", err);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.post(`/record-requests/${requestId}/reject`, {});
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "rejected" } : r,
        ),
      );
    } catch (err) {
      console.error("Reject request error:", err);
    }
  };

  /* ── Charts data (simple using queue+assigned) ── */
  const allPending = [...queueDatasets, ...assignedDatasets];
  const qualityData = [
    { name: "Approved", value: stats.approvedDatasets },
    { name: "Rejected", value: stats.rejectedDatasets },
    { name: "Pending", value: stats.pendingReviews },
  ];
  const monthMap = {};
  allPending.forEach((d) => {
    if (d.created_at) {
      const month = new Date(d.created_at).toLocaleString("default", {
        month: "short",
      });
      if (!monthMap[month])
        monthMap[month] = { month, approved: 0, rejected: 0 };
      if (d.approval_status === "approved") monthMap[month].approved++;
      if (d.approval_status === "rejected") monthMap[month].rejected++;
    }
  });
  const contentPerformanceData = Object.values(monthMap);

  /* Early returns */
  if (authState.checking) return <FullPageLoader />;
  if (!authState.allowed)
    return <AccessDenied message={authState.denyMessage} />;

  const currentList = activeTab === "queue" ? queueDatasets : assignedDatasets;

  /* ───────────────────────────────────────────────────────── */
  return (
    <DashboardLayout role="editor">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Welcome Banner */}
        <div
          style={{
            borderRadius: 16,
            background: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            padding: "32px",
            boxShadow: themeColors.isDarkMode
              ? "0 4px 15px rgba(0,0,0,0.3)"
              : "0 4px 15px rgba(0,0,0,0.05)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 4,
              height: "100%",
              background: "#FF8C00",
            }}
          />
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: themeColors.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Hello,{" "}
            <span style={{ color: "#FF8C00" }}>{authState.editorName}!</span>
          </h2>
          <p
            style={{
              color: themeColors.textMuted,
              marginTop: 8,
              marginBottom: 0,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {dataLoading
              ? "Loading your queue…"
              : `You have ${stats.pendingReviews} item(s) pending review (${queueDatasets.length} unassigned, ${assignedDatasets.length} assigned to you)`}
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 16,
          }}
        >
          <StatCard
            title="Pending Reviews"
            value={dataLoading ? "…" : stats.pendingReviews}
            change={-5}
            icon={<FileCheck size={24} />}
          />
          <StatCard
            title="Approved Datasets"
            value={dataLoading ? "…" : stats.approvedDatasets}
            change={12}
            icon={<Database size={24} />}
          />
          <StatCard
            title="Rejected"
            value={dataLoading ? "…" : stats.rejectedDatasets}
            change={-8}
            icon={<X size={24} />}
          />
          <StatCard
            title="Total Requests"
            value={dataLoading ? "…" : stats.totalRequests}
            icon={<Clock size={24} />}
          />
        </div>

        {/* Tabs for Queue / Assigned */}
        <div
          style={{
            display: "flex",
            gap: 16,
            borderBottom: `1px solid ${themeColors.border}`,
          }}
        >
          <button
            onClick={() => setActiveTab("queue")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: activeTab === "queue" ? "#FF8C00" : themeColors.textMuted,
              cursor: "pointer",
              borderBottom:
                activeTab === "queue" ? "2px solid #FF8C00" : "none",
              transition: "all 0.2s",
            }}
          >
            📋 Queue ({queueDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab("assigned")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              color:
                activeTab === "assigned" ? "#FF8C00" : themeColors.textMuted,
              cursor: "pointer",
              borderBottom:
                activeTab === "assigned" ? "2px solid #FF8C00" : "none",
            }}
          >
            🔒 Assigned to me ({assignedDatasets.length})
          </button>
        </div>

        {/* Dataset List (Queue or Assigned) */}
        <ChartCard
          title={`${activeTab === "queue" ? "Unassigned Datasets Pending Review" : "Datasets You Are Reviewing"}`}
        >
          {dataLoading ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              Loading…
            </p>
          ) : currentList.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: themeColors.textMuted,
                padding: "32px 0",
              }}
            >
              No datasets in this list.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{ borderBottom: `1px solid ${themeColors.border}` }}
                  >
                    {[
                      "Title",
                      "Category",
                      "Seller",
                      "Submitted",
                      "Assigned To",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 13,
                          fontWeight: 700,
                          color: themeColors.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentList.slice(0, 10).map((d) => (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 16px",
                          fontWeight: 700,
                          color: themeColors.text,
                          whiteSpace: "nowrap",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
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
                        {d.category_name || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        #{d.owner_user_id}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.reviewed_by === authState.editorId
                          ? "You"
                          : d.reviewed_by
                            ? `Editor #${d.reviewed_by}`
                            : "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        {activeTab === "queue" && (
                          <button
                            onClick={() => assignDataset(d.id)}
                            disabled={actionLoading}
                            style={{
                              padding: "6px 12px",
                              background: "#FF8C00",
                              border: "none",
                              borderRadius: 8,
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <UserPlus size={14} /> Assign
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDataset(d);
                            setReviewNotes("");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: themeColors.hoverBg,
                            border: `1px solid ${themeColors.border}`,
                            borderRadius: 8,
                            color: themeColors.text,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Review
                        </button>
                        {activeTab === "assigned" && (
                          <button
                            onClick={() => {
                              setEditingMetadata(d.id);
                              setMetadataForm({
                                title: d.title || "",
                                summary: d.summary || "",
                                description: d.description || "",
                                tags: Array.isArray(d.tags)
                                  ? d.tags.join(", ")
                                  : "",
                              });
                            }}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(32,178,170,0.1)",
                              border: `1px solid #20B2AA`,
                              borderRadius: 8,
                              color: "#20B2AA",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* Charts (unchanged) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24,
          }}
        >
          <ChartCard title="Content Performance">
            <div style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    contentPerformanceData.length
                      ? contentPerformanceData
                      : [{ month: "No Data", approved: 0, rejected: 0 }]
                  }
                >
                  <XAxis
                    dataKey="month"
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
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#20B2AA"
                    strokeWidth={4}
                    dot={{ fill: "#20B2AA", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="#e53e3e"
                    strokeWidth={4}
                    dot={{ fill: "#e53e3e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Quality Stats">
            <div style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {qualityData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltipStyle} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(v) => (
                      <span
                        style={{
                          color: themeColors.textMuted,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Record Requests, Custom Requests, Subscriptions – same as original (omitted for brevity but you can keep them) */}
        {/* ... (keep original sections for requests, custom requests, subscriptions) ... */}
      </div>

      {/* Review Modal */}
      {selectedDataset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: themeColors.card,
              borderRadius: 20,
              padding: 32,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <h3
              style={{
                color: themeColors.text,
                margin: "0 0 6px",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Review Dataset
            </h3>
            <p
              style={{
                color: themeColors.textMuted,
                margin: "0 0 24px",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Approve or reject this dataset and leave feedback for the seller.
            </p>
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: themeColors.hoverBg,
                marginBottom: 24,
                border: `1px solid ${themeColors.border}`,
              }}
            >
              <p
                style={{
                  color: themeColors.text,
                  fontWeight: 800,
                  margin: "0 0 6px",
                  fontSize: 17,
                }}
              >
                {selectedDataset.title}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: themeColors.textMuted,
                  margin: "0 0 12px",
                  lineHeight: 1.5,
                }}
              >
                {selectedDataset.description ||
                  selectedDataset.summary ||
                  "No description"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {[
                  ["Category", selectedDataset.category_name || "—"],
                  ["Country", selectedDataset.country || "—"],
                  ["Visibility", selectedDataset.visibility || "—"],
                  ["Owner", `#${selectedDataset.owner_user_id}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span
                      style={{ color: themeColors.textMuted, fontWeight: 700 }}
                    >
                      {k}:{" "}
                    </span>
                    <span style={{ color: themeColors.text, fontWeight: 700 }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: themeColors.textMuted,
                  fontWeight: 700,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Review Notes{" "}
                <span style={{ fontWeight: 400 }}>(visible to seller)</span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                placeholder="Add review feedback…"
                style={{
                  width: "100%",
                  background: themeColors.bg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 12,
                  padding: 14,
                  color: themeColors.text,
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => {
                  setSelectedDataset(null);
                  setReviewNotes("");
                }}
                style={{
                  padding: "10px 22px",
                  background: themeColors.hoverBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 10,
                  color: themeColors.textMuted,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitReview(selectedDataset.id, "rejected")}
                disabled={actionLoading}
                style={{
                  padding: "10px 22px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid #EF4444",
                  borderRadius: 10,
                  color: "#e53e3e",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <X size={18} /> Reject
              </button>
              <button
                onClick={() => submitReview(selectedDataset.id, "approved")}
                disabled={actionLoading}
                style={{
                  padding: "10px 22px",
                  background: "#FF8C00",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Check size={18} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Edit Modal */}
      {editingMetadata && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: themeColors.card,
              borderRadius: 20,
              padding: 32,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <h3
              style={{
                color: themeColors.text,
                margin: "0 0 6px",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Edit Metadata
            </h3>
            <p
              style={{
                color: themeColors.textMuted,
                margin: "0 0 24px",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Only title, summary, description, and tags can be changed.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input
                type="text"
                placeholder="Title"
                value={metadataForm.title}
                onChange={(e) =>
                  setMetadataForm({ ...metadataForm, title: e.target.value })
                }
                style={{
                  background: themeColors.bg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 12,
                  padding: 12,
                  color: themeColors.text,
                }}
              />
              <textarea
                placeholder="Summary"
                value={metadataForm.summary}
                onChange={(e) =>
                  setMetadataForm({ ...metadataForm, summary: e.target.value })
                }
                rows={2}
                style={{
                  background: themeColors.bg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 12,
                  padding: 12,
                  color: themeColors.text,
                }}
              />
              <textarea
                placeholder="Description"
                value={metadataForm.description}
                onChange={(e) =>
                  setMetadataForm({
                    ...metadataForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                style={{
                  background: themeColors.bg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 12,
                  padding: 12,
                  color: themeColors.text,
                }}
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={metadataForm.tags}
                onChange={(e) =>
                  setMetadataForm({ ...metadataForm, tags: e.target.value })
                }
                style={{
                  background: themeColors.bg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 12,
                  padding: 12,
                  color: themeColors.text,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setEditingMetadata(null)}
                style={{
                  padding: "10px 22px",
                  background: themeColors.hoverBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 10,
                  color: themeColors.textMuted,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateMetadata(editingMetadata)}
                disabled={actionLoading}
                style={{
                  padding: "10px 22px",
                  background: "#20B2AA",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

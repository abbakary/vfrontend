import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Modal,
  Fade,
  Backdrop,
  IconButton,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Avatar,
  Grid,
  Divider,
  TextField,
} from "@mui/material";
import {
  FileText,
  DollarSign,
  Users,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Target,
  Search,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";

// ─── API setup ────────────────────────────────────────────────────────────────

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
    fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then((r) =>
      r.json(),
    ),
  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = "#FF8C00";
const SECONDARY = "#20B2AA";
const SUCCESS = "#16a34a";
const WARNING = "#f59e0b";
const DANGER = "#dc2626";
const INFO = "#3b82f6";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getStatusMeta = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return {
        bg: "#fffbeb",
        color: WARNING,
        label: "Pending",
        icon: <Clock size={14} />,
      };
    case "approved":
      return {
        bg: "#f0fdf4",
        color: SUCCESS,
        label: "Approved",
        icon: <CheckCircle size={14} />,
      };
    case "rejected":
      return {
        bg: "#fef2f2",
        color: DANGER,
        label: "Rejected",
        icon: <X size={14} />,
      };
    default:
      return {
        bg: "#f9fafb",
        color: "#6b7280",
        label: status || "Unknown",
        icon: <AlertCircle size={14} />,
      };
  }
};

const fmtMoney = (v) =>
  `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtNum = (v) => Number(v || 0).toLocaleString();

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BidsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalBudgetValue: 0,
    avgBudgetValue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, dsRes] = await Promise.allSettled([
        api.get("/record-requests?limit=100"),
        api.get("/datasets/mine?limit=100"),
      ]);

      const allRequests =
        reqRes.status === "fulfilled" ? extractList(reqRes.value) : [];
      const allDatasets =
        dsRes.status === "fulfilled" ? extractList(dsRes.value) : [];

      setRequests(allRequests);
      setDatasets(allDatasets);

      const pending = allRequests.filter(
        (r) => (r.status || "").toLowerCase() === "pending",
      ).length;
      const approved = allRequests.filter(
        (r) => (r.status || "").toLowerCase() === "approved",
      ).length;
      const rejected = allRequests.filter(
        (r) => (r.status || "").toLowerCase() === "rejected",
      ).length;
      const total = allRequests.length;
      const totalBudget = allRequests.reduce(
        (s, r) => s + (r.budget_amount || 0),
        0,
      );
      const avgBudget = total > 0 ? totalBudget / total : 0;
      const convRate = total > 0 ? (approved / total) * 100 : 0;

      setStats({
        totalDatasets: allDatasets.length,
        totalRequests: total,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        totalBudgetValue: totalBudget,
        avgBudgetValue: avgBudget,
        conversionRate: convRate,
      });
    } catch (err) {
      console.error("BidsPage loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (req) => {
    setSelected(req);
    setModalOpen(true);
  };
  const closeModal = () => {
    setSelected(null);
    setModalOpen(false);
  };

  const handleApprove = async () => {
    try {
      await api.put(`/record-requests/${selected.id}/approve`);
      loadData();
      closeModal();
    } catch (err) {
      alert("Error approving: " + err.message);
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/record-requests/${selected.id}/reject`);
      loadData();
      closeModal();
    } catch (err) {
      alert("Error rejecting: " + err.message);
    }
  };

  const filtered = requests.filter((r) => {
    const matchFilter =
      filter === "all" || (r.status || "").toLowerCase() === filter;
    const matchSearch =
      !search ||
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <DashboardLayout role="seller">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* ── Header ── */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
            >
              <BarChart3 size={26} color={PRIMARY} />
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#1a202c",
                  letterSpacing: "-0.02em",
                }}
              >
                Dataset Bids & Requests
              </Typography>
            </Box>
            <Typography sx={{ color: "#64748b", fontSize: 14 }}>
              Manage buyer requests and monitor dataset performance.
            </Typography>
          </Box>
          <Button
            onClick={loadData}
            variant="outlined"
            startIcon={<RefreshCw size={15} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#e2e8f0",
              color: "#475569",
              borderRadius: 2,
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* ── Tabs ── */}
        <Box sx={{ borderBottom: "1px solid #e9eef3", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ minHeight: 44, "& .MuiTab-root": { minHeight: 44 } }}
          >
            <Tab
              label={`My Datasets (${datasets.length})`}
              sx={{
                textTransform: "none",
                fontSize: "0.92rem",
                fontWeight: 600,
                "&.Mui-selected": { color: PRIMARY },
              }}
            />
            <Tab
              label={`Buyer Requests (${requests.length})`}
              sx={{
                textTransform: "none",
                fontSize: "0.92rem",
                fontWeight: 600,
                "&.Mui-selected": { color: PRIMARY },
              }}
            />
          </Tabs>
        </Box>

        {loading && (
          <LinearProgress
            sx={{
              mb: 2,
              height: 3,
              borderRadius: 2,
              backgroundColor: "#fff7ed",
              "& .MuiLinearProgress-bar": { backgroundColor: PRIMARY },
            }}
          />
        )}

        {/* ── Tab 0: My Datasets ── */}
        {tabValue === 0 &&
          !loading &&
          (datasets.length === 0 ? (
            <EmptyState
              icon={<FileText size={44} color="#cbd5e1" />}
              title="No datasets yet"
              sub="Create your first dataset to start receiving buyer requests."
            />
          ) : (
            /* Simple table-style list: category | title | conversion % */
            <Card
              sx={{
                borderRadius: 2.5,
                border: "1px solid #edf2f7",
                boxShadow: "none",
                backgroundColor: "#fff",
              }}
            >
              {/* Table header */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 120px",
                  px: 2.5,
                  py: 1.25,
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Category
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Dataset
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: "right",
                  }}
                >
                  Conversion
                </Typography>
              </Box>

              {datasets.map((d, i) => {
                const convPct =
                  d.total_views > 0
                    ? ((d.total_sales / d.total_views) * 100).toFixed(1)
                    : "0.0";
                const isLast = i === datasets.length - 1;
                return (
                  <Box
                    key={d.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 120px",
                      px: 2.5,
                      py: 1.5,
                      alignItems: "center",
                      borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                      transition: "background 0.15s",
                      "&:hover": { backgroundColor: "#fafbfc" },
                    }}
                  >
                    {/* Category */}
                    <Box>
                      {d.category_name ? (
                        <Chip
                          label={d.category_name}
                          size="small"
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            height: 22,
                            backgroundColor: "#eef2ff",
                            color: "#4338ca",
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "#cbd5e1",
                            fontStyle: "italic",
                          }}
                        >
                          Read also "category_name": null
                        </Typography>
                      )}
                    </Box>

                    {/* Title */}
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {d.title || "Untitled Dataset"}
                    </Typography>

                    {/* Conversion % */}
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        sx={{
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          color: Number(convPct) > 0 ? SUCCESS : "#94a3b8",
                        }}
                      >
                        {convPct}%
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Card>
          ))}

        {/* ── Tab 1: Buyer Requests ── */}
        {tabValue === 1 && !loading && (
          <Box>
            <Box
              sx={{
                mb: 3,
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                placeholder="Search requests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{
                  minWidth: 250,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    fontSize: "0.9rem",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Search
                      size={16}
                      color="#94a3b8"
                      style={{ marginRight: 6 }}
                    />
                  ),
                }}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { key: "all", label: "All", count: stats.totalRequests },
                  {
                    key: "pending",
                    label: "Pending",
                    count: stats.pendingRequests,
                  },
                  {
                    key: "approved",
                    label: "Approved",
                    count: stats.approvedRequests,
                  },
                  {
                    key: "rejected",
                    label: "Rejected",
                    count: stats.rejectedRequests,
                  },
                ].map((f) => (
                  <Chip
                    key={f.key}
                    label={`${f.label} (${f.count})`}
                    onClick={() => setFilter(f.key)}
                    size="small"
                    sx={{
                      backgroundColor: filter === f.key ? PRIMARY : "#fff",
                      color: filter === f.key ? "#fff" : "#475569",
                      borderColor: "#e2e8f0",
                      border: "1px solid",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor:
                          filter === f.key ? "#e65100" : "#f8fafc",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={44} color="#cbd5e1" />}
                title={
                  filter === "all" ? "No requests yet" : `No ${filter} requests`
                }
                sub={
                  filter === "all"
                    ? "Buyer requests will appear here."
                    : `No requests match "${filter}".`
                }
              />
            ) : (
              <Grid container spacing={2.5}>
                {filtered.map((req) => (
                  <Grid item xs={12} md={6} key={req.id}>
                    <RequestCard
                      request={req}
                      onAction={() => openModal(req)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* ── Modal ── */}
        <Modal
          open={modalOpen}
          onClose={closeModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 400,
            sx: { backgroundColor: "rgba(17,24,39,0.75)" },
          }}
        >
          <Fade in={modalOpen}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: { xs: "96%", sm: 680 },
                maxHeight: "90vh",
                bgcolor: "#fff",
                borderRadius: 3,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  px: 3.5,
                  py: 2.5,
                  backgroundColor: "#fafbfc",
                  borderBottom: "1px solid #edf2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "#1a202c",
                    }}
                  >
                    Request Details
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Review and respond to request #{selected?.id}
                  </Typography>
                </Box>
                <IconButton
                  onClick={closeModal}
                  size="small"
                  sx={{ color: "#94a3b8" }}
                >
                  <X size={20} />
                </IconButton>
              </Box>

              <Box sx={{ flex: 1, p: 3.5, overflowY: "auto" }}>
                {selected &&
                  (() => {
                    const sm = getStatusMeta(selected.status);
                    return (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#475569",
                              textTransform: "uppercase",
                              mb: 1,
                            }}
                          >
                            Description
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.9rem",
                              color: "#334155",
                              lineHeight: 1.6,
                              mb: 3,
                            }}
                          >
                            {selected.description || "No description provided."}
                          </Typography>
                          <Divider sx={{ mb: 2.5 }} />
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  backgroundColor: "#f8fafc",
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.68rem",
                                    color: "#64748b",
                                    mb: 0.5,
                                  }}
                                >
                                  Budget
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "1.4rem",
                                    fontWeight: 800,
                                    color: SECONDARY,
                                  }}
                                >
                                  {fmtMoney(selected.budget_amount)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  backgroundColor: "#f8fafc",
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.68rem",
                                    color: "#64748b",
                                    mb: 0.5,
                                  }}
                                >
                                  Status
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    mt: 0.25,
                                  }}
                                >
                                  <span style={{ color: sm.color }}>
                                    {sm.icon}
                                  </span>
                                  <Typography
                                    sx={{
                                      fontSize: "0.85rem",
                                      fontWeight: 700,
                                      color: sm.color,
                                    }}
                                  >
                                    {sm.label}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            {selected.dataset_id && (
                              <Grid item xs={12}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    backgroundColor: "#f8fafc",
                                    borderRadius: 2,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.68rem",
                                      color: "#64748b",
                                      mb: 0.25,
                                    }}
                                  >
                                    Dataset ID
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "0.88rem",
                                      fontWeight: 600,
                                      color: "#1e293b",
                                    }}
                                  >
                                    #{selected.dataset_id}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <Box
                            sx={{
                              p: 2.5,
                              backgroundColor: "#fafbfc",
                              borderRadius: 2.5,
                              border: "1px solid #edf2f7",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "#475569",
                                mb: 2,
                                textTransform: "uppercase",
                              }}
                            >
                              Buyer Information
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                mb: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: PRIMARY,
                                  fontSize: "1rem",
                                }}
                              >
                                {selected.user?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "B"}
                              </Avatar>
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                  }}
                                >
                                  {selected.user?.name || "Unknown Buyer"}
                                </Typography>
                                <Typography
                                  sx={{ fontSize: "0.7rem", color: "#94a3b8" }}
                                >
                                  {selected.user?.email || "—"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    );
                  })()}
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "#fafbfc",
                  borderTop: "1px solid #edf2f7",
                  display: "flex",
                  gap: 1.5,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  onClick={closeModal}
                  sx={{
                    px: 3,
                    textTransform: "none",
                    color: "#64748b",
                    fontWeight: 500,
                    borderRadius: 2,
                  }}
                >
                  Close
                </Button>
                {(selected?.status || "").toLowerCase() === "pending" && (
                  <>
                    <Button
                      onClick={handleReject}
                      sx={{
                        px: 3,
                        color: DANGER,
                        border: `1px solid ${DANGER}`,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#fef2f2" },
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      variant="contained"
                      sx={{
                        px: 3,
                        backgroundColor: SUCCESS,
                        fontWeight: 600,
                        textTransform: "none",
                        borderRadius: 2,
                        boxShadow: "none",
                        "&:hover": { backgroundColor: "#15803d" },
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Fade>
        </Modal>
      </Box>
    </DashboardLayout>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }) {
  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid #edf2f7",
        boxShadow: "none",
        p: 6,
        textAlign: "center",
        backgroundColor: "#fff",
      }}
    >
      <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
        {icon}
      </Box>
      <Typography
        sx={{ color: "#475569", fontSize: "1rem", fontWeight: 700, mb: 0.75 }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>
        {sub}
      </Typography>
    </Card>
  );
}

function RequestCard({ request: r, onAction }) {
  const sm = getStatusMeta(r.status);
  return (
    <Card
      onClick={onAction}
      sx={{
        borderRadius: 2.5,
        border: "1px solid #edf2f7",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px -8px rgba(0,0,0,0.12)",
          borderColor: PRIMARY,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: 1, pr: 1 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}
            >
              <Typography
                sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}
              >
                #{r.id}
              </Typography>
              <Chip
                label={sm.label}
                size="small"
                icon={
                  <span style={{ color: sm.color, display: "flex" }}>
                    {sm.icon}
                  </span>
                }
                sx={{
                  backgroundColor: sm.bg,
                  color: sm.color,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  height: 20,
                }}
              />
              {r.dataset_id && (
                <Typography sx={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                  Dataset #{r.dataset_id}
                </Typography>
              )}
            </Box>
            <Typography
              sx={{
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "#1e293b",
                lineHeight: 1.4,
                mb: 1.5,
              }}
            >
              {(r.description || "Dataset Request").substring(0, 80)}
              {(r.description || "").length > 80 && "…"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                sx={{
                  width: 22,
                  height: 22,
                  bgcolor: PRIMARY,
                  fontSize: "0.68rem",
                }}
              >
                {r.user?.name?.charAt(0)?.toUpperCase() || "B"}
              </Avatar>
              <Typography
                sx={{ fontSize: "0.73rem", color: "#475569", fontWeight: 500 }}
              >
                {r.user?.name || "Unknown Buyer"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography
              sx={{ fontSize: "1.2rem", fontWeight: 800, color: SECONDARY }}
            >
              {fmtMoney(r.budget_amount)}
            </Typography>
            <Typography sx={{ fontSize: "0.62rem", color: "#94a3b8" }}>
              Budget
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            sx={{
              px: 2,
              py: 0.5,
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: PRIMARY,
              color: "#fff",
              borderRadius: 1.5,
              minWidth: "auto",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#e65100" },
            }}
          >
            Review
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

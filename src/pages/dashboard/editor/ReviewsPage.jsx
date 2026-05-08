import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import ChartCard from "../components/ChartCard";
import {
  Search,
  Check,
  X,
  Clock,
  RefreshCw,
  TrendingUp,
  Calendar,
  FileIcon,
  HardDrive,
  Download,
  MapPin,
  BadgeCheck,
  CornerDownLeft,
  AlertTriangle,
  Loader,
  Edit3,
  UserPlus,
} from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";
import { useNavigate } from "react-router-dom";
import { Typography, Card, CardContent, Box, Chip } from "@mui/material";

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
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
    if (!res.ok)
      throw Object.assign(new Error(res.statusText), { status: res.status });
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw Object.assign(new Error(res.statusText), { status: res.status });
    return res.json();
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw Object.assign(new Error(res.statusText), { status: res.status });
    return res.json();
  },
};

/* ─── Constants ─── */
const PRIMARY_COLOR = "#61C5C3";
const REVIEW_ACTIONS = [
  {
    key: "approved",
    label: "Approve",
    icon: <Check size={16} />,
    style: {
      background: "#FF8C00",
      border: "none",
      color: "#fff",
      boxShadow: "0 4px 10px rgba(255,140,0,0.3)",
    },
    newApprovalStatus: "approved",
    newMarketplaceStatus: "listed",
  },
  {
    key: "rejected",
    label: "Reject",
    icon: <X size={16} />,
    style: {
      background: "#fff",
      border: "1px solid #fed7d7",
      color: "#e53e3e",
    },
    newApprovalStatus: "rejected",
    newMarketplaceStatus: "unlisted",
  },
  {
    key: "returned_for_revision",
    label: "Return for Revision",
    icon: <CornerDownLeft size={16} />,
    style: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      color: "#4a5568",
    },
    newApprovalStatus: "draft",
    newMarketplaceStatus: null,
  },
];

const STATUS_COLORS = {
  approved: { bg: "#dcfce7", text: "#15803d" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  pending_review: { bg: "#fef9c3", text: "#854d0e" },
  draft: { bg: "#f3f4f6", text: "#374151" },
  listed: { bg: "#dbeafe", text: "#1d4ed8" },
  active: { bg: "#dcfce7", text: "#15803d" },
};

const getStatus = (d) => d.approval_status || d.status || "pending_review";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 30 * 86400) return `${Math.floor(diff / (7 * 86400))}w ago`;
  if (diff < 365 * 86400) return `${Math.floor(diff / (30 * 86400))}mo ago`;
  return `${Math.floor(diff / (365 * 86400))}y ago`;
}

function formatPrice(price, currency, pricingType, discountPrice) {
  if (price == null) return null;
  const curr = currency || "TZS";
  if (pricingType === "free" || price === 0)
    return { label: "Free", color: "#22c55e", original: null };
  const fmt = (v) =>
    `${curr} ${Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  if (discountPrice != null && discountPrice < price)
    return {
      label: fmt(discountPrice),
      original: fmt(price),
      color: PRIMARY_COLOR,
    };
  return { label: fmt(price), original: null, color: PRIMARY_COLOR };
}

/* ─── Helper Components ─── */
const Input = ({ style, ...p }) => (
  <input
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#1a202c",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.2s",
      ...style,
    }}
    {...p}
  />
);

/* ─── DatasetCard (identical to original, used for preview) ─── */
function DatasetCard({
  dataset,
  viewType = "grid",
  showStatus = false,
  actionLabel,
  actionStyle,
  onCardClick,
}) {
  const navigate = useNavigate();
  const themeColors = useThemeColors();
  const imageUrl =
    dataset.thumbnail ||
    dataset.image ||
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";
  const author =
    dataset.owner_user_name || `User #${dataset.owner_user_id}` || "Unknown";
  const licenseType = dataset.license_type || "Public";
  const fileLabel = dataset.file_format || dataset.format || "File";
  const sizeLabel = dataset.file_size_human || dataset.size || "—";
  const downloadsLabel = dataset.total_downloads?.toLocaleString() ?? "0";
  const timeAgoLabel = timeAgo(dataset.updated_at || dataset.created_at);
  const country = dataset.country || dataset.country_code || "—";
  const approvalStatus = getStatus(dataset);
  const cardTags = [
    dataset.subcategory_name,
    dataset.category_name,
    dataset.country,
  ]
    .filter(Boolean)
    .map((t) => t.trim().split(/\s+/)[0])
    .slice(0, 3);
  const licenseColor =
    licenseType?.toLowerCase() === "private"
      ? themeColors.isDarkMode
        ? "#fca5a5"
        : "#b91c1c"
      : licenseType?.toLowerCase() === "restricted"
        ? themeColors.isDarkMode
          ? "#fcd34d"
          : "#b45309"
        : PRIMARY_COLOR;
  const priceInfo = formatPrice(
    dataset.price,
    dataset.currency,
    dataset.pricing_type,
    dataset.discount_price,
  );
  const PriceDisplay = priceInfo ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
      {priceInfo.original && (
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 500,
            color: themeColors.textMuted,
            textDecoration: "line-through",
          }}
        >
          {priceInfo.original}
        </Typography>
      )}
      <Typography
        sx={{ fontSize: "0.8rem", fontWeight: 700, color: priceInfo.color }}
      >
        {priceInfo.label}
      </Typography>
    </Box>
  ) : null;
  const s = STATUS_COLORS[approvalStatus?.toLowerCase()] || {
    bg: "#f3f4f6",
    text: "#374151",
  };
  const StatusBadgeEl =
    showStatus && approvalStatus ? (
      <Box
        sx={{
          px: 1,
          py: 0.2,
          borderRadius: "5px",
          fontSize: "0.68rem",
          fontWeight: 800,
          backgroundColor: themeColors.isDarkMode ? `${s.text}22` : s.bg,
          color: s.text,
          textTransform: "capitalize",
          letterSpacing: "0.02em",
          border: `1px solid ${themeColors.isDarkMode ? `${s.text}33` : "transparent"}`,
        }}
      >
        {approvalStatus === "pending_review"
          ? "Pending Review"
          : approvalStatus}
      </Box>
    ) : null;
  const DownloadRatePill =
    typeof dataset.total_downloads === "number" &&
    typeof dataset.total_views === "number" &&
    dataset.total_views > 0 ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.4,
          backgroundColor: "rgba(22,22,22,0.75)",
          backdropFilter: "blur(4px)",
          px: 1,
          py: 0.5,
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <TrendingUp size={12} color="#4ade80" />
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24" }}
        >
          {Math.round((dataset.total_downloads / dataset.total_views) * 100)}%
        </Typography>
      </Box>
    ) : null;
  const handleOpen = () => {
    if (onCardClick) return onCardClick(dataset);
    navigate(
      dataset.slug
        ? `/dataset-info/${dataset.slug}`
        : `/dataset-info/${dataset.id}`,
      { state: { dataset } },
    );
  };
  const ActionButton = actionLabel ? (
    <Box
      onClick={handleOpen}
      sx={{
        px: 2,
        py: 0.6,
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.78rem",
        fontWeight: 700,
        transition: "all .2s",
        "&:hover": { opacity: 0.85 },
        ...actionStyle,
      }}
    >
      {actionLabel}
    </Box>
  ) : null;

  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          padding: 2.5,
          backgroundColor: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: "12px",
          transition: "all .3s ease",
          alignItems: "stretch",
          "&:hover": {
            boxShadow: themeColors.isDarkMode
              ? "0 10px 24px rgba(97,197,195,0.2)"
              : "0 10px 24px rgba(97,197,195,0.12)",
            borderColor: PRIMARY_COLOR,
          },
        }}
      >
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            onClick={handleOpen}
            sx={{
              width: 100,
              height: 100,
              borderRadius: "8px",
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
            }}
          />
          {DownloadRatePill && (
            <Box sx={{ position: "absolute", bottom: 6, left: 6 }}>
              {DownloadRatePill}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mb: 0.6,
              }}
            >
              <Typography
                onClick={handleOpen}
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: themeColors.text,
                  cursor: "pointer",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  "&:hover": { color: PRIMARY_COLOR },
                }}
              >
                {dataset.title}
              </Typography>
              {StatusBadgeEl}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.8,
                color: themeColors.textMuted,
              }}
            >
              <Typography sx={{ fontSize: "0.85rem" }}>{author}</Typography>
              <Box
                sx={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  backgroundColor: themeColors.border,
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Calendar size={13} />
                <Typography sx={{ fontSize: "0.8rem" }}>
                  {timeAgoLabel}
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: themeColors.text }}>
              Country <b>{country}</b> · {fileLabel} · {sizeLabel} ·{" "}
              {downloadsLabel} downloads
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.8rem",
                color: themeColors.textMuted,
              }}
            >
              <BadgeCheck size={14} color={licenseColor} />
              <span>{licenseType}</span>
            </Box>
            {ActionButton || PriceDisplay}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        boxShadow: "none",
        transition: "all .3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: themeColors.isDarkMode
            ? "0 10px 24px rgba(97,197,195,0.2)"
            : "0 10px 24px rgba(97,197,195,0.12)",
          borderColor: PRIMARY_COLOR,
        },
      }}
    >
      <Box
        sx={{
          height: 130,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {DownloadRatePill && (
          <Box sx={{ position: "absolute", top: 10, left: 10 }}>
            {DownloadRatePill}
          </Box>
        )}
        {StatusBadgeEl && (
          <Box sx={{ position: "absolute", top: 10, right: 10 }}>
            {StatusBadgeEl}
          </Box>
        )}
      </Box>
      <CardContent
        sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Typography
          onClick={handleOpen}
          sx={{
            fontSize: "0.96rem",
            fontWeight: 700,
            lineHeight: 1.4,
            color: themeColors.text,
            cursor: "pointer",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color .2s ease",
            mb: 1.5,
            "&:hover": { color: PRIMARY_COLOR },
          }}
        >
          {dataset.title}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.85rem",
            color: themeColors.text,
            fontWeight: 500,
            mb: 1.2,
          }}
        >
          {author}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            mb: 1.5,
            fontSize: "0.8rem",
            color: themeColors.textMuted,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <MapPin size={14} />
            <Typography sx={{ fontSize: "inherit" }}>{country}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <Calendar size={14} />
            <Typography sx={{ fontSize: "inherit" }}>{timeAgoLabel}</Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${themeColors.border}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {[
            { Icon: FileIcon, val: fileLabel },
            { Icon: HardDrive, val: sizeLabel },
            { Icon: Download, val: downloadsLabel },
          ].map(({ Icon, val }, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                minWidth: 0,
              }}
            >
              {i > 0 && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: themeColors.border,
                    flexShrink: 0,
                  }}
                />
              )}
              <Icon size={14} color={PRIMARY_COLOR} />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: themeColors.textMuted,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {val}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 0.7,
            flexWrap: "nowrap",
            overflow: "hidden",
            mb: 0.6,
          }}
        >
          {cardTags.map((tag, i) => (
            <Chip
              key={`${tag}-${i}`}
              label={tag}
              size="small"
              sx={{
                height: 24,
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: themeColors.textMuted,
                backgroundColor: themeColors.isDarkMode
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(15,23,42,0.04)",
                border: "none",
                maxWidth: "33%",
                flexShrink: 1,
                "& .MuiChip-label": {
                  px: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            />
          ))}
        </Box>
      </CardContent>
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${themeColors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: themeColors.bgSecondary,
          transition: "all .3s ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            color: themeColors.textMuted,
          }}
        >
          <BadgeCheck size={14} color={licenseColor} />
          <Typography
            sx={{ fontSize: "0.8rem", fontWeight: 600, color: "inherit" }}
          >
            {licenseType}
          </Typography>
        </Box>
        {ActionButton || PriceDisplay}
      </Box>
    </Card>
  );
}

/* ─── Review Logs Panel ─── */
function ReviewLogsPanel({ datasetId }) {
  const themeColors = useThemeColors();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/editor/datasets/${datasetId}/review-logs`)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (loading)
    return (
      <div
        style={{
          color: themeColors.textMuted,
          fontSize: 13,
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />{" "}
        Loading history…
      </div>
    );

  if (!logs.length)
    return (
      <p style={{ fontSize: 13, color: themeColors.textMuted, margin: 0 }}>
        No review history yet.
      </p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: themeColors.hoverBg || "#f8fafc",
            border: `1px solid ${themeColors.border || "#edf2f7"}`,
            fontSize: 13,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: log.remarks ? 4 : 0,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                color: "#1a202c",
                textTransform: "capitalize",
              }}
            >
              {log.action.replace(/_/g, " ")}
            </span>
            <span style={{ color: "#718096", fontSize: 12 }}>
              {timeAgo(log.created_at)}
            </span>
          </div>
          {log.previous_status && (
            <span style={{ fontSize: 12, color: "#718096" }}>
              {log.previous_status} → {log.new_status}
            </span>
          )}
          {log.remarks && (
            <p style={{ margin: "4px 0 0", color: "#4a5568", lineHeight: 1.5 }}>
              {log.remarks}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ReviewsPage() {
  const themeColors = useThemeColors();
  const navigate = useNavigate();

  // Data state
  const [queueDatasets, setQueueDatasets] = useState([]); // unassigned pending
  const [assignedDatasets, setAssignedDatasets] = useState([]); // assigned to me pending
  const [historyDatasets, setHistoryDatasets] = useState([]); // completed reviews

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("grid");

  // Review dialog & metadata editing state
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    title: "",
    summary: "",
    description: "",
    tags: "",
  });

  // Derived counts
  const pendingCount = queueDatasets.length + assignedDatasets.length;
  const approvedCount = historyDatasets.filter(
    (d) => getStatus(d) === "approved",
  ).length;
  const rejectedCount = historyDatasets.filter(
    (d) => getStatus(d) === "rejected",
  ).length;
  const totalReviewed = historyDatasets.length;

  /* ── Data fetching ── */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queueRes, assignedRes, historyRes] = await Promise.allSettled([
        api.get("/editor/datasets/queue?page=1&page_size=100"),
        api.get("/editor/datasets/assigned?page=1&page_size=100"),
        api.get("/editor/datasets/history?page=1&page_size=100"),
      ]);

      if (queueRes.status === "fulfilled")
        setQueueDatasets(queueRes.value.items || []);
      else setQueueDatasets([]);

      if (assignedRes.status === "fulfilled")
        setAssignedDatasets(assignedRes.value.items || []);
      else setAssignedDatasets([]);

      if (historyRes.status === "fulfilled")
        setHistoryDatasets(historyRes.value.items || []);
      else setHistoryDatasets([]);
    } catch (err) {
      setError("Failed to load datasets. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ── Assignment & review actions ── */
  const assignDataset = async (dataset) => {
    setSubmitting("assign");
    try {
      await api.post(`/editor/datasets/${dataset.id}/review`, {
        action: "review_started",
        remarks: "Editor started review",
      });
      // Move dataset from queue to assigned
      setQueueDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
      setAssignedDatasets((prev) => [dataset, ...prev]);
    } catch (err) {
      console.error("Assign error:", err);
      alert("Could not assign dataset. It may have been taken.");
    } finally {
      setSubmitting(null);
    }
  };

  const submitReview = async (dataset, actionDef) => {
    if (!dataset || submitting) return;
    setSubmitting(actionDef.key);
    try {
      await api.post(`/editor/datasets/${dataset.id}/review`, {
        action: actionDef.key,
        new_approval_status: actionDef.newApprovalStatus,
        new_marketplace_status: actionDef.newMarketplaceStatus ?? undefined,
        remarks: reviewNotes || undefined,
      });
      // Remove from assigned and add to history with new status
      setAssignedDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
      const updatedDataset = {
        ...dataset,
        approval_status: actionDef.newApprovalStatus,
      };
      setHistoryDatasets((prev) => [updatedDataset, ...prev]);
      setSelectedDataset(null);
      setReviewNotes("");
    } catch (err) {
      console.error(`Review action '${actionDef.key}' failed:`, err);
      alert(`Failed to ${actionDef.key} dataset: ${err.message}`);
    } finally {
      setSubmitting(null);
    }
  };

  const updateMetadata = async (datasetId) => {
    setSubmitting("metadata");
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
      // Update local state
      const updateFn = (list) =>
        list.map((d) =>
          d.id === datasetId
            ? {
                ...d,
                title: metadataForm.title || d.title,
                summary: metadataForm.summary || d.summary,
                description: metadataForm.description || d.description,
                tags: payload.tags || d.tags,
              }
            : d,
        );
      setAssignedDatasets(updateFn);
      setQueueDatasets(updateFn);
      setHistoryDatasets(updateFn);
      setEditingMetadata(false);
    } catch (err) {
      console.error("Metadata update error:", err);
      alert(
        "Failed to update metadata. Make sure you are assigned to this dataset.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  /* ── Filtering based on active tab ── */
  let displayDatasets = [];
  if (activeTab === "pending") {
    displayDatasets = [...queueDatasets, ...assignedDatasets];
  } else if (activeTab === "assigned") {
    displayDatasets = assignedDatasets;
  } else if (activeTab === "approved") {
    displayDatasets = historyDatasets.filter(
      (d) => getStatus(d) === "approved",
    );
  } else if (activeTab === "rejected") {
    displayDatasets = historyDatasets.filter(
      (d) => getStatus(d) === "rejected",
    );
  } else if (activeTab === "all") {
    displayDatasets = historyDatasets;
  }

  const filtered = displayDatasets.filter(
    (d) =>
      !searchQuery ||
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.owner_user_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ── Render ── */
  return (
    <DashboardLayout role="editor">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
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
                Editorial Reviews
              </h2>
              <p
                style={{
                  color: "#718096",
                  margin: "4px 0 0",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Manage dataset submissions – review, approve, or reject
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* View toggle */}
              <div
                style={{
                  display: "flex",
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: 4,
                  gap: 4,
                  border: "1px solid #edf2f7",
                }}
              >
                {[
                  { type: "grid", label: "⊞" },
                  { type: "list", label: "☰" },
                ].map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setViewType(type)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 700,
                      background: viewType === type ? "#fff" : "transparent",
                      color: viewType === type ? PRIMARY_COLOR : "#718096",
                      boxShadow:
                        viewType === type
                          ? "0 1px 4px rgba(0,0,0,0.08)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchAllData}
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
                <RefreshCw
                  size={15}
                  style={
                    loading ? { animation: "spin 1s linear infinite" } : {}
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

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
            <AlertTriangle size={16} />
            {error}
            <button
              onClick={fetchAllData}
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

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 24,
          }}
        >
          {[
            {
              label: "Pending Review",
              count: pendingCount,
              icon: <Clock size={40} />,
              accent: "#FF8C00",
            },
            {
              label: "Approved",
              count: approvedCount,
              icon: <Check size={40} />,
              accent: "#20B2AA",
            },
            {
              label: "Rejected",
              count: rejectedCount,
              icon: <X size={40} />,
              accent: "#e53e3e",
            },
            {
              label: "Total Reviewed",
              count: totalReviewed,
              icon: <FileIcon size={40} />,
              accent: "#6366f1",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #edf2f7",
                padding: 24,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: `${s.accent}15`,
                  color: s.accent,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#718096",
                    margin: 0,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#1a202c",
                    margin: "4px 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : s.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#f8fafc",
              borderRadius: 16,
              padding: 6,
              gap: 6,
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            {[
              { key: "pending", label: "Pending Review" },
              { key: "assigned", label: "Assigned to Me" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
              { key: "all", label: "History" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 800,
                  background: activeTab === tab.key ? "#FF8C00" : "transparent",
                  color: activeTab === tab.key ? "#fff" : "#718096",
                  transition: "all 0.2s",
                  boxShadow:
                    activeTab === tab.key
                      ? "0 4px 10px rgba(255,140,0,0.25)"
                      : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#a0aec0",
              }}
            />
            <Input
              placeholder="Search by title or author…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 44, width: 280 }}
            />
          </div>
        </div>

        {/* Dataset Cards */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#718096",
              fontSize: 16,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Loader
              size={20}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Loading datasets…
          </div>
        )}

        {!loading && (
          <div
            style={{
              display: viewType === "grid" ? "grid" : "flex",
              gridTemplateColumns:
                viewType === "grid"
                  ? "repeat(auto-fill, minmax(300px, 1fr))"
                  : undefined,
              flexDirection: viewType === "list" ? "column" : undefined,
              gap: 20,
            }}
          >
            {filtered.map((d) => {
              const isAssigned = assignedDatasets.some((a) => a.id === d.id);
              const isPending = getStatus(d) === "pending_review";
              return (
                <DatasetCard
                  key={d.id}
                  dataset={d}
                  viewType={viewType}
                  showStatus
                  onCardClick={() => {
                    if (
                      isPending &&
                      (activeTab === "pending" || activeTab === "assigned")
                    ) {
                      setSelectedDataset(d);
                    } else {
                      navigate(
                        d.slug
                          ? `/dataset-info/${d.slug}`
                          : `/dataset-info/${d.id}`,
                        { state: { dataset: d } },
                      );
                    }
                  }}
                  actionLabel={
                    isPending
                      ? isAssigned
                        ? "Review"
                        : "Assign & Review"
                      : "View"
                  }
                  actionStyle={{
                    background: isPending ? "#FF8C00" : "#f7fafc",
                    color: isPending ? "#fff" : "#4a5568",
                    border: isPending ? "none" : "1px solid #e2e8f0",
                  }}
                />
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <ChartCard title="">
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p
                style={{
                  color: "#718096",
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                No datasets in this list.
              </p>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Review Dialog */}
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
              background: "#fff",
              borderRadius: 24,
              padding: 32,
              width: "100%",
              maxWidth: 720,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                color: "#1a202c",
                margin: "0 0 6px",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Review Dataset
            </h3>
            <p
              style={{
                color: "#718096",
                margin: "0 0 24px",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Review the details, check history, then approve, reject, or return
              for revision.
            </p>

            <DatasetCard dataset={selectedDataset} viewType="list" showStatus />

            {/* Metadata Edit (for assigned datasets) */}
            {assignedDatasets.some((d) => d.id === selectedDataset.id) && (
              <div style={{ margin: "24px 0" }}>
                {!editingMetadata ? (
                  <button
                    onClick={() => {
                      setMetadataForm({
                        title: selectedDataset.title || "",
                        summary: selectedDataset.summary || "",
                        description: selectedDataset.description || "",
                        tags: Array.isArray(selectedDataset.tags)
                          ? selectedDataset.tags.join(", ")
                          : "",
                      });
                      setEditingMetadata(true);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(32,178,170,0.1)",
                      border: `1px solid #20B2AA`,
                      borderRadius: 8,
                      color: "#20B2AA",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Edit3 size={14} /> Edit Metadata
                  </button>
                ) : (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 16,
                      border: "1px solid #edf2f7",
                      borderRadius: 12,
                      background: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Title"
                        value={metadataForm.title}
                        onChange={(e) =>
                          setMetadataForm({
                            ...metadataForm,
                            title: e.target.value,
                          })
                        }
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <textarea
                        placeholder="Summary"
                        value={metadataForm.summary}
                        onChange={(e) =>
                          setMetadataForm({
                            ...metadataForm,
                            summary: e.target.value,
                          })
                        }
                        rows={2}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
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
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={metadataForm.tags}
                        onChange={(e) =>
                          setMetadataForm({
                            ...metadataForm,
                            tags: e.target.value,
                          })
                        }
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => setEditingMetadata(false)}
                          style={{
                            padding: "6px 12px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateMetadata(selectedDataset.id)}
                          disabled={submitting === "metadata"}
                          style={{
                            padding: "6px 12px",
                            background: "#20B2AA",
                            border: "none",
                            borderRadius: 8,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Review History */}
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#718096",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 10px",
                }}
              >
                Review History
              </p>
              <ReviewLogsPanel datasetId={selectedDataset.id} />
            </div>

            {/* Review Notes */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#4a5568",
                  fontWeight: 800,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Review Notes{" "}
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: "none",
                    color: "#a0aec0",
                  }}
                >
                  (visible to seller)
                </span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                placeholder="Add feedback for the seller…"
                style={{
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 14,
                  color: "#1a202c",
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  setSelectedDataset(null);
                  setReviewNotes("");
                  setEditingMetadata(false);
                }}
                disabled={!!submitting}
                style={{
                  padding: "12px 24px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  color: "#4a5568",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>

              {!assignedDatasets.some((d) => d.id === selectedDataset.id) && (
                <button
                  onClick={() => assignDataset(selectedDataset)}
                  disabled={!!submitting}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 12,
                    background: "#FF8C00",
                    border: "none",
                    color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: 15,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <UserPlus size={16} />
                  Assign to Me
                </button>
              )}

              {REVIEW_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  onClick={() => submitReview(selectedDataset, action)}
                  disabled={!!submitting}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 12,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: 15,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: submitting ? 0.6 : 1,
                    transition: "opacity 0.2s",
                    ...action.style,
                  }}
                >
                  {submitting === action.key ? (
                    <Loader
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    action.icon
                  )}
                  {submitting === action.key ? "Saving…" : action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

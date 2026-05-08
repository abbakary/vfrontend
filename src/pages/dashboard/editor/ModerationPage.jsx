import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  ShieldAlert,
  Flag,
  CheckCircle,
  Trash2,
  Search,
  X,
  RefreshCw,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";
import { useNavigate } from "react-router-dom";
import { Typography, Card, CardContent, Box, Chip } from "@mui/material";
import {
  TrendingUp,
  Calendar,
  FileIcon,
  HardDrive,
  Download,
  MapPin,
  BadgeCheck,
} from "lucide-react";

/* ─── API config (mirrors other editor pages) ─── */
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
};

/* ─── Constants ─── */
const PRIMARY_COLOR = "#61C5C3";

/* ─── Helpers ─── */
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

/* ─── Severity / Status palettes (for flag overlays) ─── */
const sevColor = {
  high: { bg: "#fff5f5", color: "#e53e3e", border: "#fed7d7" },
  medium: { bg: "#fffaf0", color: "#dd6b20", border: "#feebc8" },
  low: { bg: "#ebf8ff", color: "#3182ce", border: "#bee3f8" },
};
const flagStatusColor = {
  open: { bg: "#fff5f5", color: "#e53e3e", border: "#fed7d7" },
  resolved: { bg: "#f0fff4", color: "#38a169", border: "#c6f6d5" },
  dismissed: { bg: "#f7fafc", color: "#718096", border: "#e2e8f0" },
};

const approvalStatusColors = {
  approved: { bg: "#dcfce7", text: "#15803d" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  pending: { bg: "#fef9c3", text: "#854d0e" },
  listed: { bg: "#dbeafe", text: "#1d4ed8" },
  active: { bg: "#dcfce7", text: "#15803d" },
};

/* ─── Shared UI primitives ─── */
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

/* ═══════════════════════════════════════════════════
   DatasetCard — inline (same as other editor pages)
═══════════════════════════════════════════════════ */
function DatasetCard({
  dataset,
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
    dataset.owner_user_name ||
    dataset.author ||
    `User #${dataset.owner_user_id}` ||
    "Unknown";
  const licenseType = dataset.license_type || "Public";
  const fileLabel = dataset.file_format || dataset.format || "File";
  const sizeLabel = dataset.file_size_human || dataset.size || "—";
  const downloadsLabel = dataset.total_downloads?.toLocaleString() ?? "0";
  const timeAgoLabel = timeAgo(dataset.updated_at || dataset.created_at);
  const country = dataset.country || dataset.country_code || "—";
  const approvalStatus = dataset.approval_status || dataset.status || null;

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

  const handleOpen = () => {
    if (onCardClick) return onCardClick(dataset);
    const path = dataset.slug
      ? `/dataset-info/${dataset.slug}`
      : `/dataset-info/${dataset.id}`;
    navigate(path, { state: { dataset } });
  };

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

  const StatusBadgeEl =
    showStatus && approvalStatus
      ? (() => {
          const s = approvalStatusColors[approvalStatus.toLowerCase()] || {
            bg: "#f3f4f6",
            text: "#374151",
          };
          return (
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
              {approvalStatus}
            </Box>
          );
        })()
      : null;

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
            width: "100%",
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

/* ─── Review Logs Panel (optional, can be added later) ─── */

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ModerationPage() {
  const [datasets, setDatasets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  /* ── Fetch datasets that have flags (using the queue endpoint as source) ── */
  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both queue and assigned? For simplicity, fetch queue only.
      const data = await api.get("/editor/datasets/queue?page=1&page_size=100");
      const items = data.items || [];
      // Filter to only flagged datasets (custom field, added by separate system)
      const flaggedItems = items.filter((d) => d.flagged || d.flag_reason);
      setDatasets(flaggedItems);
    } catch (err) {
      setError(err.message || "Failed to load flagged content");
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const getFlagStatus = (d) => d.flag_status || "open";
  const getSeverity = (d) => d.severity || "low";
  const getFlagReason = (d) => d.flag_reason || "—";

  const flagged = datasets;
  const filtered = flagged.filter((f) => {
    const matchSearch =
      !search ||
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.owner_user_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.summary?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      statusFilter === "all" || getFlagStatus(f) === statusFilter;
    return matchSearch && matchFilter;
  });

  const counts = {
    open: flagged.filter((f) => getFlagStatus(f) === "open").length,
    resolved: flagged.filter((f) => getFlagStatus(f) === "resolved").length,
    dismissed: flagged.filter((f) => getFlagStatus(f) === "dismissed").length,
  };

  /* ── Moderation actions using the review endpoint ── */
  const resolveFlag = async (id) => {
    setSubmitting(true);
    try {
      await api.post(`/editor/datasets/${id}/review`, {
        action: "approved",
        new_approval_status: "approved",
        new_marketplace_status: "listed",
        remarks: "Flag resolved by editor – content approved",
      });
      // Optimistically update local flag_status
      setDatasets((prev) =>
        prev.map((d) => (d.id === id ? { ...d, flag_status: "resolved" } : d)),
      );
      showToast("Flag resolved – dataset approved");
    } catch (err) {
      console.error(err);
      showToast("Failed to resolve flag");
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  const removeContent = async (id) => {
    setSubmitting(true);
    try {
      await api.post(`/editor/datasets/${id}/review`, {
        action: "rejected",
        new_approval_status: "rejected",
        new_marketplace_status: "unlisted",
        remarks: "Dataset removed by moderator due to policy violation",
      });
      // Remove from local list (no longer pending)
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      showToast("Dataset removed from platform");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove dataset");
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
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
                Content Moderation
              </h2>
              <p
                style={{
                  color: "#718096",
                  margin: "4px 0 0",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Review flagged content and take moderation actions
              </p>
            </div>
            <button
              onClick={fetchDatasets}
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

        {/* Error banner */}
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
              onClick={fetchDatasets}
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
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 24,
          }}
        >
          {[
            {
              label: "Open Flags",
              count: counts.open,
              accent: "#e53e3e",
              icon: <Flag size={32} />,
            },
            {
              label: "Resolved",
              count: counts.resolved,
              accent: "#38a169",
              icon: <CheckCircle size={32} />,
            },
            {
              label: "Dismissed",
              count: counts.dismissed,
              accent: "#718096",
              icon: <ShieldAlert size={32} />,
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
                gap: 16,
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
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#1a202c",
                    margin: "4px 0 0",
                  }}
                >
                  {loading ? "—" : s.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 250 }}>
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
              placeholder="Search flagged content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: 44,
                boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "10px 16px",
              color: "#1a202c",
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              minWidth: 160,
              appearance: "none",
            }}
          >
            <option value="all">All Flags</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* Loading */}
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
            Loading flagged content…
          </div>
        )}

        {/* Dataset Cards with flag overlays */}
        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 20,
            }}
          >
            {filtered.map((item) => {
              const sc = sevColor[getSeverity(item)] || sevColor.low;
              const stc =
                flagStatusColor[getFlagStatus(item)] || flagStatusColor.open;
              return (
                <div key={item.id} style={{ position: "relative" }}>
                  <DatasetCard
                    dataset={item}
                    showStatus
                    onCardClick={() => setSelected(item)}
                    actionLabel="Review Flag"
                    actionStyle={{
                      background:
                        getFlagStatus(item) === "open" ? "#FF8C00" : "#f7fafc",
                      color:
                        getFlagStatus(item) === "open" ? "#fff" : "#4a5568",
                      border:
                        getFlagStatus(item) === "open"
                          ? "none"
                          : "1px solid #e2e8f0",
                    }}
                  />
                  {/* Severity + reason badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      display: "flex",
                      gap: 4,
                      flexDirection: "column",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        textTransform: "uppercase",
                      }}
                    >
                      {getSeverity(item)}
                    </span>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                      }}
                    >
                      {getFlagReason(item)}
                    </span>
                  </div>
                  {/* Flag status badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: stc.bg,
                        color: stc.color,
                        border: `1px solid ${stc.border}`,
                        textTransform: "capitalize",
                      }}
                    >
                      {getFlagStatus(item)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "#718096",
              padding: "48px 0",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {error
              ? "Could not load flagged content"
              : "No flagged content found"}
          </p>
        )}
      </div>

      {/* Moderation Modal */}
      {selected && (
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
              maxWidth: 580,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#1a202c",
                    margin: "0 0 4px",
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  Moderation Review
                </h3>
                <p
                  style={{
                    color: "#718096",
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Review details and take action
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#a0aec0",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Dataset preview card */}
            <div style={{ marginBottom: 20 }}>
              <DatasetCard dataset={selected} showStatus />
            </div>

            {/* Flag details grid */}
            <div
              style={{
                borderRadius: 12,
                border: "1px solid #edf2f7",
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #edf2f7",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#718096",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Flag Details
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "#edf2f7",
                }}
              >
                {[
                  [
                    "Owner",
                    selected.owner_user_name ||
                      `User #${selected.owner_user_id}` ||
                      "—",
                  ],
                  [
                    "Category",
                    selected.category_name || `#${selected.category_id}` || "—",
                  ],
                  ["Flag Reason", getFlagReason(selected)],
                  ["Severity", getSeverity(selected)],
                  ["Flag Status", getFlagStatus(selected)],
                  ["Country", selected.country || selected.country_code || "—"],
                  ["Format", selected.file_format || "—"],
                  ["Size", selected.file_size_human || "—"],
                  [
                    "Downloads",
                    selected.total_downloads?.toLocaleString() ?? "0",
                  ],
                  ["Views", selected.total_views?.toLocaleString() ?? "0"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: "10px 14px",
                      background: "#fff",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#718096", fontWeight: 700 }}>
                      {k}:{" "}
                    </span>
                    <span
                      style={{
                        color: "#1a202c",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {(selected.description || selected.summary) && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #edf2f7",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#718096",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 8px",
                  }}
                >
                  Description
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#4a5568",
                    margin: 0,
                    lineHeight: 1.7,
                  }}
                >
                  {selected.description || selected.summary}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setSelected(null)}
                disabled={submitting}
                style={{
                  padding: "10px 22px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  color: "#4a5568",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => resolveFlag(selected.id)}
                disabled={submitting}
                style={{
                  padding: "10px 22px",
                  background: "#f0fff4",
                  border: "1px solid #c6f6d5",
                  borderRadius: 10,
                  color: "#38a169",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <CheckCircle size={16} /> Resolve Issue
              </button>
              <button
                onClick={() => removeContent(selected.id)}
                disabled={submitting}
                style={{
                  padding: "10px 22px",
                  background: "#FF8C00",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 10px rgba(255,140,0,0.2)",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Trash2 size={16} /> Remove Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            background: "#1a202c",
            borderRadius: 12,
            padding: "16px 24px",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            zIndex: 300,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle size={18} color="#4ade80" />
          {toast}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

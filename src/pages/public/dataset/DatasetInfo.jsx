import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  Chip,
  CircularProgress,
  Avatar,
  TextField,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  Calendar,
  Globe,
  Shield,
  BarChart2,
  Database,
  HardDrive,
  Hash,
  CheckCircle2,
  Info,
  Package,
  Zap,
  Share2,
  Copy,
  X,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  MapPin,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import PageLayout from "../components/PageLayout";
import { useThemeColors } from "../../../utils/useThemeColors";

const ACCENT = "#61C5C3";
const SITE_NAME = "Dali Portal";
const SITE_URL = "https://testing.daligeotech.com";

/* ─── API config ─── */
const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ─── Alphabet‑only ID decoder ──────────────────────────────────────────── */
function decodeAlphaId(uid) {
  if (!uid || typeof uid !== "string") return NaN;
  const upper = uid.toUpperCase();
  if (/^[A-Z]+$/.test(upper)) {
    return [...upper].reduce(
      (acc, ch) => acc * 26 + (ch.charCodeAt(0) - 65),
      0,
    );
  }
  if (/^\d+$/.test(uid)) return parseInt(uid, 10);
  return NaN;
}

/* ── status badge palette ── */
const STATUS_MAP = {
  approved: { bg: "#dcfce7", text: "#15803d" },
  listed: { bg: "#dbeafe", text: "#1d4ed8" },
  public: { bg: "#f0fdf4", text: "#166534" },
  active: { bg: "#dcfce7", text: "#15803d" },
  pending: { bg: "#fef9c3", text: "#854d0e" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  free: { bg: "#e0f2fe", text: "#0369a1" },
};

function StatusBadge({ label, isDark }) {
  if (!label) return null;
  const key = label.toLowerCase();
  const p = STATUS_MAP[key] || {
    bg: isDark ? "#2a2a2a" : "#f3f4f6",
    text: isDark ? "#aaa" : "#374151",
  };
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        borderRadius: "5px",
        fontSize: "0.72rem",
        fontWeight: 700,
        backgroundColor: isDark ? `${p.text}22` : p.bg,
        color: p.text,
        letterSpacing: "0.02em",
      }}
    />
  );
}

/* ── helpers ── */
function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtNum(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}
function fmtCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
function relTime(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} ${m === 1 ? "min" : "mins"} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} ${h === 1 ? "hr" : "hrs"} ago`;
  }
  if (diff < 7 * 86400) {
    const d = Math.floor(diff / 86400);
    return `${d} ${d === 1 ? "day" : "days"} ago`;
  }
  if (diff < 30 * 86400) {
    const w = Math.floor(diff / (7 * 86400));
    return `${w} ${w === 1 ? "week" : "weeks"} ago`;
  }
  if (diff < 365 * 86400) {
    const mo = Math.floor(diff / (30 * 86400));
    return `${mo} ${mo === 1 ? "month" : "months"} ago`;
  }
  const y = Math.floor(diff / (365 * 86400));
  return `${y} ${y === 1 ? "year" : "years"} ago`;
}

function fmtPrice(price, currency, pricingType, discountPrice) {
  if (price === null || price === undefined) return null;
  const curr = currency || "TZS";
  if (pricingType === "free" || price === 0)
    return { label: "Free", color: "#22c55e", original: null };
  const fmt = (v) =>
    `${curr} ${Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  if (discountPrice != null && discountPrice < price)
    return { label: fmt(discountPrice), original: fmt(price), color: ACCENT };
  return { label: fmt(price), original: null, color: ACCENT };
}

const MOCK_DISCUSSIONS = [
  {
    id: 1,
    user: "Alex.Data",
    avatar: "https://i.pravatar.cc/150?u=alex",
    content:
      "Is there an updated version for the next term? I noticed some early drafts on the official portal.",
    timestamp: "2 days ago",
    upvotes: 12,
    replies: 2,
  },
  {
    id: 2,
    user: "DataAnalyst",
    avatar: "https://i.pravatar.cc/150?u=analyst",
    content:
      "Excellent compilation. The category grouping is particularly helpful for tracking specific activities.",
    timestamp: "1 week ago",
    upvotes: 8,
    replies: 0,
  },
];

const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1460925895917-adf4e5d1baaa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=900&q=80",
];

function SideRow({ icon: Icon, label, value, colors }) {
  if (!value) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        py: 1.3,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <Icon size={13} color={ACCENT} style={{ marginTop: 3, flexShrink: 0 }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: "0.78rem", color: colors.textMuted }}>
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.8rem",
            color: colors.text,
            fontWeight: 600,
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 800,
        color: ACCENT,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

/* ═══════════════════════════════════════════════════
   SHARE MODAL (mobile‑friendly)
═══════════════════════════════════════════════════ */
function ShareModal({ open, onClose, dataset, shareUrl, colors }) {
  const [copied, setCopied] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  if (!dataset) return null;

  const thumb =
    dataset.thumbnail || FALLBACK_THUMBS[dataset.id % FALLBACK_THUMBS.length];
  const price = fmtPrice(
    dataset.price,
    dataset.currency,
    dataset.pricing_type,
    dataset.discount_price,
  );
  const author =
    dataset.owner?.full_name || dataset.owner_user_name || "Unknown";
  const tags = (dataset.tags || []).slice(0, 4);
  const engagement = dataset.total_views
    ? ((dataset.total_downloads / dataset.total_views) * 100).toFixed(1)
    : "0.0";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setSnackOpen(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const SHARE_ACTIONS = [
    {
      label: "Copy link",
      icon: <Copy size={15} />,
      color: "#64748b",
      bg: colors.isDarkMode ? "#1e293b" : "#f1f5f9",
      onClick: handleCopy,
    },
    {
      label: "Twitter / X",
      icon: <Twitter size={15} />,
      color: "#1d9bf0",
      bg: "#e7f5fe",
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(dataset.title)}`,
          "_blank",
        ),
    },
    {
      label: "LinkedIn",
      icon: <Linkedin size={15} />,
      color: "#0a66c2",
      bg: "#e8f0fa",
      onClick: () =>
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(dataset.title)}`,
          "_blank",
        ),
    },
    {
      label: "Facebook",
      icon: <Facebook size={15} />,
      color: "#1877f2",
      bg: "#e8f0fe",
      onClick: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank",
        ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0,0,0,0.55)",
            },
          },
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "94vw", sm: 720 },
              maxWidth: 760,
              borderRadius: "20px",
              overflow: "hidden",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: colors.isDarkMode
                ? "0 32px 80px rgba(0,0,0,0.6)"
                : "0 32px 80px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              maxHeight: "90vh",
              outline: "none",
            }}
          >
            {/* LEFT PANEL – card preview */}
            <Box
              sx={{
                flex: "0 0 300px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                borderRight: { sm: `1px solid ${colors.border}` },
                borderBottom: { xs: `1px solid ${colors.border}`, sm: "none" },
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: 140,
                  backgroundImage: `url(${thumb})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65))",
                  }}
                />
                {dataset.total_views > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      backgroundColor: "rgba(15,15,15,0.75)",
                      backdropFilter: "blur(4px)",
                      px: 1,
                      py: 0.4,
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <TrendingUp size={11} color="#4ade80" />
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#fbbf24",
                      }}
                    >
                      {engagement}% engagement
                    </Typography>
                  </Box>
                )}
                {price && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      px: 1.2,
                      py: 0.3,
                      borderRadius: "6px",
                      backgroundColor: "rgba(0,0,0,0.65)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        color: price.label === "Free" ? "#4ade80" : "#fff",
                      }}
                    >
                      {price.label}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  p: 2.5,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  backgroundColor: colors.isDarkMode ? colors.card : "#fafafa",
                }}
              >
                {dataset.category_name && (
                  <Chip
                    label={dataset.category_name}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      height: 20,
                      borderRadius: "5px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      backgroundColor: `${ACCENT}18`,
                      color: ACCENT,
                    }}
                  />
                )}
                <Typography
                  sx={{
                    fontSize: "0.97rem",
                    fontWeight: 800,
                    color: colors.text,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {dataset.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      backgroundColor: ACCENT,
                      color: "#fff",
                    }}
                  >
                    {author[0]}
                  </Avatar>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: colors.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {author}
                  </Typography>
                  {dataset.country && (
                    <>
                      <Box
                        sx={{
                          width: 3,
                          height: 3,
                          borderRadius: "50%",
                          backgroundColor: colors.border,
                        }}
                      />
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.3 }}
                      >
                        <MapPin size={11} color={colors.textMuted} />
                        <Typography
                          sx={{ fontSize: "0.73rem", color: colors.textMuted }}
                        >
                          {dataset.country}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {[
                    {
                      icon: <Eye size={12} color={ACCENT} />,
                      val: fmtCount(dataset.total_views),
                      label: "views",
                    },
                    {
                      icon: <Download size={12} color={ACCENT} />,
                      val: fmtCount(dataset.total_downloads),
                      label: "downloads",
                    },
                  ].map(({ icon, val, label }) => (
                    <Box
                      key={label}
                      sx={{ display: "flex", alignItems: "center", gap: 0.4 }}
                    >
                      {icon}
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: colors.text,
                        }}
                      >
                        {val}
                      </Typography>
                      <Typography
                        sx={{ fontSize: "0.7rem", color: colors.textMuted }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {tags.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap" }}>
                    {tags.map((t) => (
                      <Box
                        key={t}
                        sx={{
                          px: 0.9,
                          py: 0.2,
                          borderRadius: "5px",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          color: colors.textMuted,
                          backgroundColor: colors.isDarkMode
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.05)",
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {t}
                      </Box>
                    ))}
                  </Box>
                )}
                <Box
                  sx={{
                    mt: "auto",
                    pt: 1.5,
                    borderTop: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: ACCENT,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {SITE_NAME}
                  </Typography>
                  {dataset.updated_at && (
                    <Typography
                      sx={{ fontSize: "0.68rem", color: colors.textMuted }}
                    >
                      Updated {relTime(dataset.updated_at)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* RIGHT PANEL – QR + share options */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                p: { xs: 2.5, sm: 3 },
                gap: 2.5,
                position: "relative",
              }}
            >
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: colors.textMuted,
                  backgroundColor: colors.bgSecondary,
                  width: 30,
                  height: 30,
                  "&:hover": { backgroundColor: colors.hoverBg },
                }}
              >
                <X size={14} />
              </IconButton>
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: colors.text,
                    mb: 0.3,
                  }}
                >
                  Share Dataset
                </Typography>
                <Typography
                  sx={{ fontSize: "0.78rem", color: colors.textMuted }}
                >
                  Scan the QR code or choose a platform below
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "14px",
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "#fff",
                    boxShadow: colors.isDarkMode
                      ? "0 4px 20px rgba(0,0,0,0.3)"
                      : "0 4px 20px rgba(0,0,0,0.06)",
                    display: "inline-flex",
                  }}
                >
                  <QRCodeSVG
                    value={shareUrl}
                    size={150}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: colors.textMuted,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  Scan to open on any device
                </Typography>
              </Box>
              {/* URL bar – fixed missing closing </Box> */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  borderRadius: "10px",
                  border: `1px solid ${colors.border}`,
                  overflow: "hidden",
                  backgroundColor: colors.bgSecondary,
                }}
              >
                <Box sx={{ px: 1.5, display: "flex", alignItems: "center" }}>
                  <Link2 size={13} color={colors.textMuted} />
                </Box>
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: "0.75rem",
                    color: colors.textMuted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    py: 1.1,
                  }}
                >
                  {shareUrl}
                </Typography>
                <Button
                  onClick={handleCopy}
                  size="small"
                  sx={{
                    height: "100%",
                    borderRadius: 0,
                    borderLeft: `1px solid ${colors.border}`,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: copied ? "#22c55e" : ACCENT,
                    px: 1.8,
                    flexShrink: 0,
                    minWidth: 68,
                    transition: "color .2s",
                    "&:hover": { backgroundColor: `${ACCENT}10` },
                  }}
                >
                  {copied ? (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.4 }}
                    >
                      <CheckCircle2 size={12} />
                      Copied
                    </Box>
                  ) : (
                    "Copy"
                  )}
                </Button>
              </Box>{" "}
              {/* ✅ fixed: closes the URL bar Box */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    mb: 1.2,
                  }}
                >
                  Share via
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0.9,
                  }}
                >
                  {SHARE_ACTIONS.map((action) => (
                    <Box
                      key={action.label}
                      onClick={action.onClick}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.4,
                        py: 1,
                        borderRadius: "8px",
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.card,
                        cursor: "pointer",
                        transition: "all .18s ease",
                        "&:hover": {
                          backgroundColor: colors.hoverBg,
                          borderColor: action.color,
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "6px",
                          backgroundColor: action.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: action.color,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: colors.text,
                        }}
                      >
                        {action.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   HELMET (SEO)
═══════════════════════════════════════════════════ */
function DatasetHelmet({ d, rawId }) {
  const metaDesc = (d.summary || d.description || "")
    .replace(/\n/g, " ")
    .slice(0, 160)
    .trim();

  const canonicalUrl = `${SITE_URL}/datasets/${rawId}`;
  const ownerName = d.owner?.full_name || d.owner_user_name || null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: d.title,
    description: d.summary || d.description || undefined,
    url: canonicalUrl,
    identifier: String(rawId),
    version: d.version || undefined,
    license: d.license_type || undefined,
    keywords: d.tags?.length ? d.tags : undefined,
    isAccessibleForFree: d.pricing_type === "free" || d.price === 0,
    datePublished: d.published_at || undefined,
    dateModified: d.updated_at || undefined,
    spatialCoverage: d.spatial_coverage || undefined,
    temporalCoverage: d.temporal_start
      ? `${d.temporal_start}/${d.temporal_end || ".."}`
      : undefined,
    creator: ownerName
      ? {
          "@type": "Person",
          name: ownerName,
          ...(d.owner?.email ? { email: d.owner.email } : {}),
        }
      : undefined,
    distribution: d.resources?.length
      ? d.resources.map((r) => ({
          "@type": "DataDownload",
          name: r.name,
          encodingFormat: r.resource_type,
          contentSize: r.file_size_human,
        }))
      : undefined,
  };

  return (
    <Helmet>
      <title>
        {d.title} | {SITE_NAME}
      </title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonicalUrl} />
      {d.tags?.length > 0 && (
        <meta name="keywords" content={d.tags.join(", ")} />
      )}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={d.title} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={canonicalUrl} />
      {d.thumbnail && <meta property="og:image" content={d.thumbnail} />}
      <meta
        name="twitter:card"
        content={d.thumbnail ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={d.title} />
      <meta name="twitter:description" content={metaDesc} />
      {d.thumbnail && <meta name="twitter:image" content={d.thumbnail} />}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function DatasetInfo() {
  const { id: uidParam } = useParams();
  const navigate = useNavigate();
  const colors = useThemeColors();

  const [tab, setTab] = useState(0);
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const rawId = useMemo(() => decodeAlphaId(uidParam), [uidParam]);
  const shareUrl = `${SITE_URL}/datasets/${uidParam}`;

  // Ref to prevent duplicate view recording
  const viewRecordedRef = useRef(false);

  const fetchDataset = useCallback(async () => {
    if (!rawId || isNaN(rawId)) {
      setError("Invalid dataset ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/public-datasets/${rawId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setD(json?.data ?? json);
    } catch (e) {
      setError(e.message);
      setD(null);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  // 🆕 Record view when dataset is successfully loaded (once)
  useEffect(() => {
    if (!loading && d && rawId && !isNaN(rawId) && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      const recordView = async () => {
        try {
          await fetch(`${BASE_URL}/views/dataset/${rawId}`, {
            method: "POST",
            headers: authHeaders(),
          });
        } catch (err) {
          // Fail silently – view recording should never break the UI
          console.warn("Failed to record view:", err);
        }
      };
      recordView();
    }
  }, [loading, d, rawId]);

  const engagement = useMemo(() => {
    if (!d?.total_views) return "0.0";
    return ((d.total_downloads / d.total_views) * 100).toFixed(1);
  }, [d]);

  const priceInfo = d
    ? fmtPrice(d.price, d.currency, d.pricing_type, d.discount_price)
    : null;

  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <Helmet>
          <title>Loading dataset… | {SITE_NAME}</title>
        </Helmet>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={34} sx={{ color: ACCENT }} thickness={3} />
            <Typography sx={{ color: colors.textMuted, fontSize: "0.875rem" }}>
              Loading dataset…
            </Typography>
          </Stack>
        </Box>
      </PageLayout>
    );
  }

  // Not found / error
  if (!d) {
    return (
      <PageLayout>
        <Helmet>
          <title>Dataset not found | {SITE_NAME}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <Typography sx={{ color: "#f87171", fontWeight: 700 }}>
              Dataset not found
            </Typography>
            {error && (
              <Typography sx={{ fontSize: "0.85rem", color: colors.textMuted }}>
                {error}
              </Typography>
            )}
            <Button
              onClick={() => navigate(-1)}
              sx={{ color: ACCENT, textTransform: "none", fontWeight: 700 }}
            >
              Go Back
            </Button>
          </Stack>
        </Box>
      </PageLayout>
    );
  }

  // Main render
  return (
    <PageLayout>
      <DatasetHelmet d={d} rawId={rawId} />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        dataset={d}
        shareUrl={shareUrl}
        colors={colors}
      />

      <Box sx={{ minHeight: "100vh", backgroundColor: colors.bg }}>
        {/* HERO SECTION */}
        <Box sx={{ position: "relative", overflow: "hidden" }}>
          {d.thumbnail && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${d.thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                filter: "brightness(0.22) saturate(0.5)",
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, ${d.thumbnail ? "transparent" : colors.bg} 0%, ${colors.bg} 100%)`,
            }}
          />

          <Container
            maxWidth="xl"
            sx={{
              position: "relative",
              zIndex: 1,
              pt: { xs: 3, md: 5 },
              pb: 5,
            }}
          >
            <Button
              startIcon={<ArrowLeft size={14} />}
              onClick={() => navigate(-1)}
              sx={{
                mb: 4,
                color: d.thumbnail ? "rgba(255,255,255,0.7)" : ACCENT,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 0,
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: d.thumbnail ? "#fff" : ACCENT,
                },
              }}
            >
              Back
            </Button>

            <Box
              sx={{
                display: "flex",
                gap: { xs: 3, md: 4 },
                alignItems: "flex-start",
                flexWrap: { xs: "wrap", md: "nowrap" },
              }}
            >
              {/* Title & metadata block */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mb: 2, flexWrap: "wrap", gap: 0.8 }}
                >
                  {d.category_name && (
                    <Chip
                      label={d.category_name}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: "5px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: d.thumbnail
                          ? "rgba(255,255,255,0.15)"
                          : `${ACCENT}20`,
                        color: d.thumbnail ? "#e2e8f0" : ACCENT,
                        backdropFilter: "blur(4px)",
                        border: `1px solid ${d.thumbnail ? "rgba(255,255,255,0.1)" : `${ACCENT}30`}`,
                      }}
                    />
                  )}
                  {d.subcategory_name && (
                    <Chip
                      label={d.subcategory_name}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: "5px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: d.thumbnail
                          ? "rgba(255,255,255,0.10)"
                          : `${ACCENT}12`,
                        color: d.thumbnail ? "#cbd5e1" : ACCENT,
                        border: `1px solid ${d.thumbnail ? "rgba(255,255,255,0.08)" : `${ACCENT}20`}`,
                      }}
                    />
                  )}
                  {d.is_featured && (
                    <Chip
                      label="Featured"
                      size="small"
                      icon={<Zap size={10} />}
                      sx={{
                        height: 22,
                        borderRadius: "5px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: "#fbbf2420",
                        color: "#f59e0b",
                        border: "1px solid #fbbf2440",
                        "& .MuiChip-icon": { color: "#f59e0b", ml: "6px" },
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  sx={{
                    fontSize: { xs: "1.7rem", md: "2.4rem" },
                    fontWeight: 900,
                    lineHeight: 1.13,
                    color: d.thumbnail ? "#fff" : colors.text,
                    letterSpacing: "-0.025em",
                    mb: 1.5,
                    textShadow: d.thumbnail
                      ? "0 2px 16px rgba(0,0,0,0.5)"
                      : "none",
                  }}
                >
                  {d.title}
                </Typography>

                {d.summary && (
                  <Typography
                    sx={{
                      fontSize: "0.92rem",
                      color: d.thumbnail
                        ? "rgba(255,255,255,0.65)"
                        : colors.textMuted,
                      lineHeight: 1.7,
                      maxWidth: 600,
                      mb: 2.5,
                    }}
                  >
                    {d.summary}
                  </Typography>
                )}

                <Stack
                  direction="row"
                  spacing={0}
                  sx={{ gap: 2, flexWrap: "wrap", alignItems: "center" }}
                >
                  {(d.owner?.full_name || d.owner_user_name) && (
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Avatar
                        sx={{
                          width: 22,
                          height: 22,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          backgroundColor: ACCENT,
                          color: "#fff",
                        }}
                      >
                        {(d.owner?.full_name || d.owner_user_name)[0]}
                      </Avatar>
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          color: d.thumbnail
                            ? "rgba(255,255,255,0.7)"
                            : colors.textMuted,
                          fontWeight: 600,
                        }}
                      >
                        {d.owner?.full_name || d.owner_user_name}
                      </Typography>
                    </Stack>
                  )}
                  {d.updated_at && (
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        color: d.thumbnail
                          ? "rgba(255,255,255,0.5)"
                          : colors.textMuted,
                      }}
                    >
                      Updated {relTime(d.updated_at)}
                    </Typography>
                  )}
                  {d.version && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.2,
                        borderRadius: "5px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        backgroundColor: d.thumbnail
                          ? "rgba(255,255,255,0.1)"
                          : colors.bgSecondary,
                        color: d.thumbnail
                          ? "rgba(255,255,255,0.6)"
                          : colors.textMuted,
                        border: `1px solid ${d.thumbnail ? "rgba(255,255,255,0.15)" : colors.border}`,
                      }}
                    >
                      {d.version}
                    </Box>
                  )}
                  {priceInfo && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.2,
                        py: 0.3,
                        borderRadius: "6px",
                        backgroundColor: d.thumbnail
                          ? "rgba(255,255,255,0.12)"
                          : `${priceInfo.color}15`,
                        border: `1px solid ${d.thumbnail ? "rgba(255,255,255,0.2)" : `${priceInfo.color}30`}`,
                      }}
                    >
                      {priceInfo.original && (
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            color: d.thumbnail
                              ? "rgba(255,255,255,0.45)"
                              : colors.textMuted,
                            textDecoration: "line-through",
                          }}
                        >
                          {priceInfo.original}
                        </Typography>
                      )}
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: d.thumbnail
                            ? priceInfo.label === "Free"
                              ? "#4ade80"
                              : "#fff"
                            : priceInfo.color,
                        }}
                      >
                        {priceInfo.label}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Action buttons (mobile‑friendly column) */}
              <Stack
                spacing={1}
                sx={{
                  flexShrink: 0,
                  alignItems: "stretch",
                  minWidth: { xs: "100%", sm: 180 },
                }}
              >
                {d.is_downloadable && (
                  <Button
                    variant="contained"
                    startIcon={<Download size={15} />}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: "0.875rem",
                      py: 1.2,
                      backgroundColor: ACCENT,
                      color: "#fff",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "#50ada8",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Download
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Eye size={15} />}
                  onClick={() => setTab(1)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    py: 1.2,
                    borderColor: d.thumbnail
                      ? "rgba(255,255,255,0.25)"
                      : colors.border,
                    color: d.thumbnail ? "rgba(255,255,255,0.85)" : colors.text,
                    "&:hover": {
                      backgroundColor: d.thumbnail
                        ? "rgba(255,255,255,0.08)"
                        : colors.hoverBg,
                      borderColor: ACCENT,
                    },
                  }}
                >
                  Preview Files
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share2 size={15} />}
                  onClick={() => setShareOpen(true)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    py: 1.2,
                    borderColor: d.thumbnail
                      ? "rgba(255,255,255,0.25)"
                      : colors.border,
                    color: d.thumbnail ? "rgba(255,255,255,0.85)" : ACCENT,
                    "&:hover": {
                      backgroundColor: d.thumbnail
                        ? "rgba(255,255,255,0.08)"
                        : `${ACCENT}10`,
                      borderColor: ACCENT,
                    },
                  }}
                >
                  Share
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* Error banner */}
        {error && (
          <Box
            sx={{
              backgroundColor: colors.isDarkMode ? "#1c1c1e" : "#fffbeb",
              borderBottom: `1px solid ${colors.isDarkMode ? "#2d2d2d" : "#fde68a"}`,
              py: 0.9,
              px: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Info size={13} color="#f59e0b" />
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: colors.isDarkMode ? "#fbbf24" : "#92400e",
                }}
              >
                Could not reach API ({error}) — showing cached data
              </Typography>
            </Stack>
            <Button
              size="small"
              startIcon={<RefreshCw size={12} />}
              onClick={fetchDataset}
              sx={{
                textTransform: "none",
                fontSize: "0.76rem",
                color: "#f59e0b",
                fontWeight: 700,
                minWidth: "auto",
                py: 0.3,
              }}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* MAIN CONTENT */}
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          {/* Stat pills (responsive grid) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" },
              gap: 1.5,
              mb: 4,
            }}
          >
            {[
              { label: "Views", value: d.total_views, color: "#3b82f6" },
              {
                label: "Downloads",
                value: d.total_downloads,
                color: "#10b981",
              },
              { label: "Sales", value: d.total_sales, color: ACCENT },
              {
                label: "Engagement",
                value: `${engagement}%`,
                color: colors.text,
              },
            ].map(({ label, value, color }) => (
              <Box
                key={label}
                sx={{
                  p: "14px 18px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1.45rem",
                    fontWeight: 900,
                    color,
                    lineHeight: 1,
                    mb: 0.3,
                  }}
                >
                  {typeof value === "number" ? fmtNum(value) : value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Two‑column layout */}
          <Box
            sx={{
              display: "flex",
              gap: 4,
              alignItems: "flex-start",
              flexWrap: { xs: "wrap", lg: "nowrap" },
            }}
          >
            {/* LEFT – main content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ borderBottom: `1px solid ${colors.border}`, mb: 3.5 }}>
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  sx={{
                    minHeight: 40,
                    "& .MuiTabs-indicator": {
                      backgroundColor: ACCENT,
                      height: 2.5,
                      borderRadius: 999,
                    },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      minHeight: 40,
                      px: 0,
                      mr: 3,
                      fontSize: "0.875rem",
                      color: colors.textMuted,
                      fontWeight: 500,
                    },
                    "& .Mui-selected": {
                      color: `${colors.text} !important`,
                      fontWeight: 700,
                    },
                  }}
                >
                  <Tab label="Overview" />
                  <Tab label="Files & Preview" />
                  <Tab label={`Discussion (${MOCK_DISCUSSIONS.length})`} />
                  {d.versions?.length > 0 && (
                    <Tab label={`Versions (${d.versions.length})`} />
                  )}
                </Tabs>
              </Box>

              {tab === 0 && (
                <Box>
                  {d.description && (
                    <Box sx={{ mb: 4 }}>
                      <SectionLabel>Description</SectionLabel>
                      {d.description.split("\n\n").map((p, i) => (
                        <Typography
                          key={i}
                          sx={{
                            fontSize: "0.9rem",
                            color: colors.textMuted,
                            lineHeight: 1.85,
                            mb: 1.5,
                          }}
                        >
                          {p}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {(d.spatial_coverage || d.temporal_start) && (
                    <Box sx={{ mb: 4 }}>
                      <SectionLabel>Coverage</SectionLabel>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 3,
                          flexWrap: "wrap",
                          p: 2.5,
                          borderRadius: "12px",
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.card,
                        }}
                      >
                        {d.spatial_coverage && (
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                backgroundColor: `${ACCENT}18`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Globe size={15} color={ACCENT} />
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  color: colors.textMuted,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                }}
                              >
                                Spatial
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.875rem",
                                  color: colors.text,
                                  fontWeight: 700,
                                }}
                              >
                                {d.spatial_coverage}
                              </Typography>
                            </Box>
                          </Stack>
                        )}
                        {d.temporal_start && (
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                backgroundColor: `${ACCENT}18`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Calendar size={15} color={ACCENT} />
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  color: colors.textMuted,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                }}
                              >
                                Temporal
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.875rem",
                                  color: colors.text,
                                  fontWeight: 700,
                                }}
                              >
                                {fmtDate(d.temporal_start)} –{" "}
                                {d.temporal_end
                                  ? fmtDate(d.temporal_end)
                                  : "Present"}
                              </Typography>
                            </Box>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  )}
                  {d.tags?.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <SectionLabel>Tags</SectionLabel>
                      <Stack
                        direction="row"
                        spacing={0}
                        sx={{ gap: 0.8, flexWrap: "wrap" }}
                      >
                        {d.tags.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            size="small"
                            sx={{
                              height: 26,
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              backgroundColor: colors.isDarkMode
                                ? `${ACCENT}14`
                                : "#e6f7f6",
                              color: colors.isDarkMode ? ACCENT : "#0d7373",
                              border: `1px solid ${colors.isDarkMode ? `${ACCENT}28` : "#b2e8e7"}`,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {d.metadata?.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <SectionLabel>Additional Metadata</SectionLabel>
                      <Box
                        sx={{
                          borderRadius: "12px",
                          border: `1px solid ${colors.border}`,
                          overflow: "hidden",
                          backgroundColor: colors.card,
                        }}
                      >
                        {d.metadata.map((m, i) => (
                          <Box
                            key={m.id}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              px: 2.5,
                              py: 1.4,
                              gap: 2,
                              borderBottom:
                                i < d.metadata.length - 1
                                  ? `1px solid ${colors.border}`
                                  : "none",
                              "&:hover": { backgroundColor: colors.hoverBg },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: colors.textMuted,
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              {m.metadata_key.replace(/_/g, " ")}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.82rem",
                                color: colors.text,
                                fontWeight: 600,
                                textAlign: "right",
                                wordBreak: "break-word",
                              }}
                            >
                              {m.metadata_value || "—"}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {d.pricing?.filter((p) => p.is_active).length > 0 && (
                    <Box>
                      <SectionLabel>Pricing Plans</SectionLabel>
                      <Stack spacing={1.5}>
                        {d.pricing
                          .filter((p) => p.is_active)
                          .map((p) => (
                            <Box
                              key={p.id}
                              sx={{
                                p: 2.5,
                                borderRadius: "12px",
                                border: `1px solid ${p.price === 0 ? "#34d39940" : colors.border}`,
                                backgroundColor:
                                  p.price === 0
                                    ? colors.isDarkMode
                                      ? "#052e16"
                                      : "#f0fdf4"
                                    : colors.card,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                flexWrap: "wrap",
                              }}
                            >
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ mb: 0.5 }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.9rem",
                                      fontWeight: 800,
                                      color: colors.text,
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {p.pricing_type}
                                  </Typography>
                                  <StatusBadge
                                    label={p.license_type}
                                    isDark={colors.isDarkMode}
                                  />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                  {p.download_limit && (
                                    <Typography
                                      sx={{
                                        fontSize: "0.76rem",
                                        color: colors.textMuted,
                                      }}
                                    >
                                      Max {p.download_limit} downloads
                                    </Typography>
                                  )}
                                  {p.access_period_days && (
                                    <Typography
                                      sx={{
                                        fontSize: "0.76rem",
                                        color: colors.textMuted,
                                      }}
                                    >
                                      Access {p.access_period_days} days
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                              <Box sx={{ textAlign: "right" }}>
                                {p.discount_price != null &&
                                  p.discount_price < p.price && (
                                    <Typography
                                      sx={{
                                        fontSize: "0.8rem",
                                        color: colors.textMuted,
                                        textDecoration: "line-through",
                                      }}
                                    >
                                      {p.currency}{" "}
                                      {Number(p.price).toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                        },
                                      )}
                                    </Typography>
                                  )}
                                <Typography
                                  sx={{
                                    fontSize: "1.4rem",
                                    fontWeight: 900,
                                    color: p.price === 0 ? "#059669" : ACCENT,
                                  }}
                                >
                                  {p.price === 0
                                    ? "Free"
                                    : `${p.discount_price != null && p.discount_price < p.price ? p.discount_price : p.price} ${p.currency}`}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  {d.resources?.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <SectionLabel>Files ({d.resources.length})</SectionLabel>
                      <Stack spacing={1}>
                        {d.resources.map((r) => (
                          <Box
                            key={r.id}
                            sx={{
                              p: "14px 18px",
                              borderRadius: "10px",
                              border: `1px solid ${r.is_primary ? ACCENT + "45" : colors.border}`,
                              backgroundColor: r.is_primary
                                ? colors.isDarkMode
                                  ? `${ACCENT}0b`
                                  : "#f0fdfd"
                                : colors.card,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "8px",
                                  backgroundColor: `${ACCENT}18`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <FileText size={15} color={ACCENT} />
                              </Box>
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={0.8}
                                  alignItems="center"
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.875rem",
                                      fontWeight: 700,
                                      color: colors.text,
                                    }}
                                  >
                                    {r.name}
                                  </Typography>
                                  {r.is_primary && (
                                    <Chip
                                      label="Primary"
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.64rem",
                                        fontWeight: 700,
                                        backgroundColor: `${ACCENT}20`,
                                        color: ACCENT,
                                        borderRadius: "4px",
                                      }}
                                    />
                                  )}
                                </Stack>
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: colors.textMuted,
                                    mt: 0.2,
                                  }}
                                >
                                  {r.resource_type} · {r.file_size_human || "—"}{" "}
                                  · {fmtNum(r.download_count)} downloads
                                </Typography>
                              </Box>
                            </Stack>
                            {r.is_downloadable && (
                              <Button
                                size="small"
                                startIcon={<Download size={12} />}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,
                                  fontSize: "0.76rem",
                                  color: ACCENT,
                                  borderRadius: "7px",
                                  border: `1px solid ${ACCENT}40`,
                                  px: 1.5,
                                  py: 0.5,
                                  "&:hover": { backgroundColor: `${ACCENT}12` },
                                }}
                              >
                                Download
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {(!d.resources || d.resources.length === 0) && (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        color: colors.textMuted,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.9rem" }}>
                        No files available for this dataset.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {tab === 2 && (
                <Box>
                  <Stack
                    spacing={0}
                    sx={{
                      borderRadius: "12px",
                      border: `1px solid ${colors.border}`,
                      overflow: "hidden",
                      backgroundColor: colors.card,
                      mb: 3,
                    }}
                  >
                    {MOCK_DISCUSSIONS.map((msg, idx) => (
                      <Box key={msg.id}>
                        <Box sx={{ display: "flex", gap: 2, p: 2.5 }}>
                          <Avatar
                            src={msg.avatar}
                            sx={{ width: 36, height: 36, flexShrink: 0 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mb: 0.8 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.875rem",
                                  fontWeight: 800,
                                  color: colors.text,
                                }}
                              >
                                {msg.user}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  color: colors.textMuted,
                                }}
                              >
                                {msg.timestamp}
                              </Typography>
                            </Stack>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                color: colors.textMuted,
                                lineHeight: 1.7,
                                mb: 1.5,
                              }}
                            >
                              {msg.content}
                            </Typography>
                            <Stack direction="row" spacing={2.5}>
                              {[
                                { Icon: ThumbsUp, label: msg.upvotes },
                                {
                                  Icon: MessageCircle,
                                  label: `${msg.replies} Replies`,
                                },
                              ].map(({ Icon, label }, i) => (
                                <Stack
                                  key={i}
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={{
                                    cursor: "pointer",
                                    color: colors.textMuted,
                                    "&:hover": { color: ACCENT },
                                    transition: "color .15s",
                                  }}
                                >
                                  <Icon size={13} />
                                  <Typography
                                    sx={{
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {label}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                        {idx < MOCK_DISCUSSIONS.length - 1 && (
                          <Divider sx={{ borderColor: colors.border }} />
                        )}
                      </Box>
                    ))}
                  </Stack>
                  <TextField
                    fullWidth
                    placeholder="Write a comment…"
                    multiline
                    rows={3}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: colors.card,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      mt: 1.5,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 700,
                      backgroundColor: ACCENT,
                      color: "#fff",
                      boxShadow: "none",
                      px: 3,
                    }}
                  >
                    Post Comment
                  </Button>
                </Box>
              )}

              {tab === 3 && d.versions?.length > 0 && (
                <Stack spacing={1.5}>
                  {d.versions.map((v, i) => (
                    <Box
                      key={v.id}
                      sx={{
                        p: 2.5,
                        borderRadius: "12px",
                        border: `1px solid ${i === 0 ? ACCENT + "50" : colors.border}`,
                        backgroundColor:
                          i === 0
                            ? colors.isDarkMode
                              ? `${ACCENT}0a`
                              : "#f0fdfd"
                            : colors.card,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.9rem",
                              fontWeight: 800,
                              color: colors.text,
                            }}
                          >
                            {v.version_name}
                          </Typography>
                          {i === 0 && (
                            <Chip
                              label="Latest"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.64rem",
                                fontWeight: 700,
                                backgroundColor: `${ACCENT}20`,
                                color: ACCENT,
                                borderRadius: "4px",
                              }}
                            />
                          )}
                        </Stack>
                        {v.change_log && (
                          <Typography
                            sx={{
                              fontSize: "0.82rem",
                              color: colors.textMuted,
                              lineHeight: 1.6,
                            }}
                          >
                            {v.change_log}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          color: colors.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {fmtDate(v.published_at)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* RIGHT – sidebar (sticky on larger screens) */}
            <Box sx={{ width: { xs: "100%", lg: 272 }, flexShrink: 0 }}>
              <Box
                sx={{
                  borderRadius: "16px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  overflow: "hidden",
                  position: { lg: "sticky" },
                  top: { lg: 88 },
                }}
              >
                {d.thumbnail && (
                  <Box
                    sx={{
                      height: 110,
                      backgroundImage: `url(${d.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
                <Box sx={{ p: 2.5 }}>
                  <SectionLabel>Dataset Details</SectionLabel>
                  <SideRow
                    icon={Database}
                    label="Data type"
                    value={d.data_type}
                    colors={colors}
                  />
                  <SideRow
                    icon={Package}
                    label="Source type"
                    value={d.source_type}
                    colors={colors}
                  />
                  <SideRow
                    icon={HardDrive}
                    label="Format"
                    value={d.file_format}
                    colors={colors}
                  />
                  <SideRow
                    icon={BarChart2}
                    label="Size"
                    value={d.file_size_human}
                    colors={colors}
                  />
                  <SideRow
                    icon={Hash}
                    label="Version"
                    value={d.version}
                    colors={colors}
                  />
                  <SideRow
                    icon={RefreshCw}
                    label="Updates"
                    value={d.update_frequency}
                    colors={colors}
                  />
                  <SideRow
                    icon={Shield}
                    label="License"
                    value={d.license_type}
                    colors={colors}
                  />
                  <SideRow
                    icon={Calendar}
                    label="Published"
                    value={fmtDate(d.published_at)}
                    colors={colors}
                  />
                  <SideRow
                    icon={Calendar}
                    label="Last updated"
                    value={fmtDate(d.updated_at)}
                    colors={colors}
                  />
                  {d.country && (
                    <SideRow
                      icon={Globe}
                      label="Country"
                      value={d.country}
                      colors={colors}
                    />
                  )}
                  {d.region && (
                    <SideRow
                      icon={Globe}
                      label="Region"
                      value={d.region}
                      colors={colors}
                    />
                  )}
                  <Stack
                    direction="row"
                    spacing={0.8}
                    sx={{ pt: 1.5, flexWrap: "wrap", gap: 0.8 }}
                  >
                    <StatusBadge
                      label={d.approval_status}
                      isDark={colors.isDarkMode}
                    />
                    <StatusBadge
                      label={d.marketplace_status}
                      isDark={colors.isDarkMode}
                    />
                    <StatusBadge
                      label={d.visibility}
                      isDark={colors.isDarkMode}
                    />
                  </Stack>
                </Box>

                {(d.owner || d.owner_user_name) && (
                  <>
                    <Divider sx={{ borderColor: colors.border }} />
                    <Box sx={{ p: 2.5 }}>
                      <SectionLabel>Publisher</SectionLabel>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: ACCENT,
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            color: "#fff",
                          }}
                        >
                          {(d.owner?.full_name || d.owner_user_name || "?")[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: colors.text,
                            }}
                          >
                            {d.owner?.full_name || d.owner_user_name}
                          </Typography>
                          {d.owner?.email && (
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: colors.textMuted,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.owner.email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </PageLayout>
  );
}

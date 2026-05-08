import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Typography,
  Card,
  CardContent,
  TextField,
  Box,
  InputAdornment,
  Chip,
  Select,
  MenuItem,
  Zoom,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  ChevronUp,
  Calendar,
  FileIcon,
  HardDrive,
  Download,
  X,
  Grid3x3,
  List,
  MapPin,
  BadgeCheck,
  Eye,
  Flame,
  Users,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import CategorySidebar from "../components/CategorySidebar";
import FiltersPanel from "../components/FiltersPanel";
import { useThemeColors } from "../../../utils/useThemeColors";

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
const PRIMARY_COLOR = "#61C5C3";
const SIDEBAR_EXPANDED = 280;
const NAVBAR_HEIGHT = 64;
const PAGE_SIZE = 12;
const SITE_NAME = "Dali Portal";
const SITE_URL = "https://daliportal.daligeotech.com";

/* ─── Unsplash fallback thumbnails ─── */
const UNSPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1460925895917-adf4e5d1baaa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1599658880436-c61792e70672?auto=format&fit=crop&w=900&q=80",
];

function getFallbackThumbnail(id) {
  return UNSPLASH_FALLBACKS[(id ?? 0) % UNSPLASH_FALLBACKS.length];
}

/* ─── Sort options ─── */
const sortOptions = [
  { value: "created_at", label: "Newest" },
  { value: "updated_at", label: "Recently Updated" },
  { value: "title", label: "Title" },
  { value: "total_views", label: "Most Viewed" },
  { value: "total_downloads", label: "Most Downloaded" },
  { value: "total_sales", label: "Most Sold" },
];

/* ─── Alphabet-only ID encoder ─────────────────────────────────────────────
   Encodes a numeric id into a pure A-Z string (base-26).
   Minimum 4 characters, left-padded with 'A' (equivalent to 0).

   Encoding:  0→A, 1→B, …, 25→Z
   Examples:  0 → "AAAA"  |  1 → "AAAB"  |  25 → "AAAZ"  |  26 → "AABA"

   To DECODE on the detail page:
     function decodeAlphaId(uid) {
       return [...uid.toUpperCase()].reduce(
         (acc, ch) => acc * 26 + (ch.charCodeAt(0) - 65),
         0
       );
     }
     const rawId = decodeAlphaId(uid); // → original numeric id
─────────────────────────────────────────────────────────────────────────── */
function encryptId(id) {
  if (id == null) return "AAAA";
  let n = Number(id);
  if (!isFinite(n) || n < 0) return "AAAA";

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const BASE = 26;
  let result = "";

  if (n === 0) return "AAAA";

  while (n > 0) {
    result = ALPHABET[n % BASE] + result;
    n = Math.floor(n / BASE);
  }

  // Left-pad with 'A' to ensure at least 4 characters
  return result.padStart(4, "A");
}

/* ─── Build navigation path ─────────────────────────────────────────────────
   Always navigates to /datasets/<uid>
   Appends ?slug=<slug> when a slug is available.

   Detail page can read:
     const { uid } = useParams();
     const slug   = new URLSearchParams(location.search).get("slug");
     const rawId  = decodeAlphaId(uid); // see decoder above
─────────────────────────────────────────────────────────────────────────── */
function buildDatasetPath(uid, slug) {
  const base = `/datasets/${uid}`;
  return slug ? `${base}?slug=${encodeURIComponent(slug)}` : base;
}

/* ─── Build subtitle from category + tags ─── */
function buildSubtitle(categoryName, tags) {
  const parts = [];
  if (categoryName) parts.push(categoryName);
  if (Array.isArray(tags)) {
    const extra = tags.find(
      (t) => t && t.toLowerCase() !== (categoryName ?? "").toLowerCase(),
    );
    if (extra) parts.push(extra);
  }
  return parts.join(" · ") || "";
}

/* ─── Time ago helper ─── */
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m}${m === 1 ? " min" : " mins"} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h}${h === 1 ? " hr" : " hrs"} ago`;
  }
  if (diff < 7 * 86400) {
    const d = Math.floor(diff / 86400);
    return `${d}${d === 1 ? " day" : " days"} ago`;
  }
  if (diff < 30 * 86400) {
    const w = Math.floor(diff / (7 * 86400));
    return `${w}${w === 1 ? " week" : " weeks"} ago`;
  }
  if (diff < 365 * 86400) {
    const mo = Math.floor(diff / (30 * 86400));
    return `${mo}${mo === 1 ? " month" : " months"} ago`;
  }
  const y = Math.floor(diff / (365 * 86400));
  return `${y}${y === 1 ? " year" : " years"} ago`;
}

/* ─── Compact number formatter ─── */
function fmtCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ─── Price formatter ─── */
function formatPrice(price, currency, pricingType, discountPrice) {
  if (price === null || price === undefined) return null;
  const curr = currency || "TZS";
  if (pricingType === "free" || price === 0)
    return { label: "Free", color: "#22c55e", original: null };
  const fmt = (val) =>
    `${curr} ${Number(val).toLocaleString(undefined, {
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

/* ─── Build query string ─── */
function buildQuery({ search, selectedCategory, filters, page }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  params.set("sort_by", filters.sortBy || "created_at");
  params.set("sort_order", filters.sortOrder || "desc");
  const q = (filters.search || search || "").trim();
  if (q) params.set("search", q);
  if (filters.region) params.set("region", filters.region);
  if (filters.country) params.set("country", filters.country);
  if (filters.dataType) params.set("data_type", filters.dataType);
  if (filters.isFeatured !== "") params.set("is_featured", filters.isFeatured);
  if (filters.isDownloadable !== "")
    params.set("is_downloadable", filters.isDownloadable);
  const sub =
    filters.subcategory || selectedCategory?.selectedSubcategory?.name || "";
  if (sub) params.set("subcategory", sub);
  if (selectedCategory) {
    if (selectedCategory.id)
      params.set("category_id", String(selectedCategory.id));
    else if (selectedCategory.name) params.set("search", selectedCategory.name);
  }
  return params.toString();
}

/* ─── API helpers ─── */
async function fetchDatasets(queryString) {
  const res = await fetch(`${BASE_URL}/public-datasets/?${queryString}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ─── JWT decode ─── */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.sub ? Number(payload.sub) : null;
}

/* ═══════════════════════════════════════════════════
   HELMET
═══════════════════════════════════════════════════ */
function DatasetsHelmet({ total, search, selectedCategory }) {
  const categoryPart =
    selectedCategory?.selectedSubcategory?.name ??
    selectedCategory?.name ??
    null;
  const searchPart = search.trim() || null;

  let title = "Datasets";
  if (categoryPart && searchPart) title = `"${searchPart}" in ${categoryPart}`;
  else if (categoryPart) title = `${categoryPart} Datasets`;
  else if (searchPart) title = `"${searchPart}" Datasets`;

  const countPart =
    total > 0 ? `Browse ${total.toLocaleString()} datasets` : "Browse datasets";
  const topicPart = categoryPart ? ` in ${categoryPart}` : "";
  const searchDesc = searchPart ? ` matching "${searchPart}"` : "";
  const description = `${countPart}${topicPart}${searchDesc} on ${SITE_NAME}. Open data for research, analysis, and decision-making.`;
  const canonicalUrl = `${SITE_URL}/datasets`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} | ${SITE_NAME}`,
    description,
    url: canonicalUrl,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <Helmet>
      <title>
        {title} | {SITE_NAME}
      </title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {searchPart && <meta name="robots" content="noindex, follow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={`${title} | ${SITE_NAME}`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={`${title} | ${SITE_NAME}`} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

/* ═══════════════════════════════════════════════════
   SEARCH DROPDOWN
═══════════════════════════════════════════════════ */
function SearchDropdown({ themeColors, onSelectSearch, onSelectDataset }) {
  const [userViews, setUserViews] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!getToken();
  const userId = getCurrentUserId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        /* ── 1. User's own view history (logged-in only) ── */
        if (isLoggedIn && userId) {
          const res = await fetch(
            `${BASE_URL}/views/user/${userId}?record_type=dataset`,
            { headers: authHeaders() },
          );
          if (res.ok) {
            const data = await res.json();

            const seen = new Set();
            const unique = [];
            for (const v of data) {
              if (!seen.has(v.record_id)) {
                seen.add(v.record_id);
                unique.push(v);
              }
            }

            const items = unique.slice(0, 5).map((v) => ({
              uid: encryptId(v.record_id),
              slug: v.slug ?? null,
              record_id: v.record_id,
              title: v.title ?? "Untitled",
              image: v.thumbnail || getFallbackThumbnail(v.record_id),
              subtitle: buildSubtitle(v.category_name, v.tags),
              viewed_at: v.viewed_at,
            }));

            if (!cancelled) setUserViews(items);
          }
        }

        /* ── 2. Most-viewed — public, no auth ── */
        const mvRes = await fetch(
          `${BASE_URL}/views/most-viewed/dataset?limit=5`,
        );
        if (mvRes.ok) {
          const mvData = await mvRes.json();

          const items = mvData.map((row) => ({
            uid: encryptId(row.record_id),
            slug: row.slug ?? null,
            record_id: row.record_id,
            title: row.title ?? "Untitled",
            image: row.thumbnail || getFallbackThumbnail(row.record_id),
            subtitle: buildSubtitle(row.category_name, row.tags),
            view_count: row.view_count,
            unique_users: row.unique_users,
            unique_ips: row.unique_ips,
          }));

          if (!cancelled) setMostViewed(items);
        }
      } catch {
        // silently fail — dropdown is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userId]);

  const relatedTags = [
    "agriculture",
    "climate",
    "trade",
    "demographics",
    "health",
    "finance",
    "transport",
    "energy",
  ];

  return (
    <Box
      sx={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        backgroundColor: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: "12px",
        boxShadow: themeColors.isDarkMode
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : "0 8px 24px rgba(0,0,0,0.1)",
        zIndex: 200,
        overflow: "hidden",
        transition: "background-color 0.3s ease",
        maxHeight: 500,
        overflowY: "auto",
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={22} sx={{ color: PRIMARY_COLOR }} />
        </Box>
      ) : (
        <>
          {/* ── User's Recent Views ── */}
          {isLoggedIn && userViews.length > 0 && (
            <Box sx={{ borderBottom: `1px solid ${themeColors.border}` }}>
              <DropdownSectionHeader
                icon={<Eye size={13} color={PRIMARY_COLOR} />}
                label="Your Recent Views"
                themeColors={themeColors}
              />
              {userViews.map((item) => (
                <DropdownRow
                  key={`uv-${item.record_id}`}
                  item={item}
                  themeColors={themeColors}
                  onSelect={onSelectDataset}
                  badge={item.viewed_at ? timeAgo(item.viewed_at) : null}
                  badgeColor={themeColors.textMuted}
                />
              ))}
            </Box>
          )}

          {/* ── Most Viewed ── */}
          {mostViewed.length > 0 && (
            <Box sx={{ borderBottom: `1px solid ${themeColors.border}` }}>
              <DropdownSectionHeader
                icon={<Flame size={13} color="#f97316" />}
                label={
                  isLoggedIn && userViews.length > 0
                    ? "Trending Datasets"
                    : "Most Viewed"
                }
                themeColors={themeColors}
              />
              {mostViewed.map((item) => (
                <MostViewedRow
                  key={`mv-${item.record_id}`}
                  item={item}
                  themeColors={themeColors}
                  onSelect={onSelectDataset}
                />
              ))}
            </Box>
          )}

          {/* ── Browse by Tag ── */}
          <Box sx={{ p: 2.5 }}>
            <DropdownSectionHeader
              label="Browse by Tag"
              themeColors={themeColors}
              inline
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {relatedTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => onSelectSearch(tag)}
                  sx={{
                    backgroundColor: themeColors.bgSecondary,
                    color: themeColors.text,
                    fontSize: "0.78rem",
                    height: 26,
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: `${PRIMARY_COLOR}20`,
                      color: PRIMARY_COLOR,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

/* ─── Shared section header ─── */
function DropdownSectionHeader({
  icon = null,
  label,
  themeColors,
  inline = false,
}) {
  return (
    <Box
      sx={{
        px: 2.5,
        pt: inline ? 0 : 2,
        pb: 0.8,
        display: "flex",
        alignItems: "center",
        gap: 0.8,
      }}
    >
      {icon}
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: themeColors.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/* ─── Recent-views row ─── */
function DropdownRow({ item, themeColors, onSelect, badge, badgeColor }) {
  return (
    <Box
      onClick={() => onSelect(item)}
      sx={{
        px: 2.5,
        py: 1.3,
        display: "flex",
        gap: 1.5,
        cursor: "pointer",
        alignItems: "center",
        "&:hover": { backgroundColor: themeColors.hoverBg },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "8px",
          backgroundImage: `url(${item.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
          border: `1px solid ${themeColors.border}`,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.87rem",
            fontWeight: 600,
            color: themeColors.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </Typography>
        {item.subtitle && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: themeColors.textMuted,
              mt: 0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.subtitle}
          </Typography>
        )}
      </Box>
      {badge && (
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: badgeColor || themeColors.textMuted,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </Typography>
      )}
    </Box>
  );
}

/* ─── Most-viewed row ─── */
function MostViewedRow({ item, themeColors, onSelect }) {
  return (
    <Box
      onClick={() => onSelect(item)}
      sx={{
        px: 2.5,
        py: 1.3,
        display: "flex",
        gap: 1.5,
        cursor: "pointer",
        alignItems: "center",
        "&:hover": { backgroundColor: themeColors.hoverBg },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "8px",
          backgroundImage: `url(${item.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
          border: `1px solid ${themeColors.border}`,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.87rem",
            fontWeight: 600,
            color: themeColors.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </Typography>
        {item.subtitle && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: themeColors.textMuted,
              mt: 0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.subtitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.35,
          flexShrink: 0,
        }}
      >
        {item.view_count != null && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
            <Eye size={10} color="#f97316" />
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#f97316",
                whiteSpace: "nowrap",
              }}
            >
              {fmtCount(item.view_count)} views
            </Typography>
          </Box>
        )}
        {item.unique_ips != null && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
            <Users size={10} color={themeColors.textMuted} />
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: themeColors.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              {fmtCount(item.unique_ips)} visitors
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function DatasetsPage() {
  const navigate = useNavigate();
  const themeColors = useThemeColors();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [viewType, setViewType] = useState("grid");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    subcategory: "",
    region: "",
    country: "",
    dataType: "",
    isFeatured: "",
    isDownloadable: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [datasets, setDatasets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);
  const datasetsTopRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setDatasets([]);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setDatasets([]);
  }, [appliedFilters, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = buildQuery({
          search,
          selectedCategory,
          filters: appliedFilters,
          page,
        });
        const result = await fetchDatasets(qs);
        if (!cancelled) {
          setDatasets((prev) =>
            isFirstPage ? result.data : [...prev, ...result.data],
          );
          setTotalPages(result.total_pages);
          setTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, appliedFilters, selectedCategory, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && page < totalPages)
          setPage((p) => p + 1);
      },
      { rootMargin: "120px", threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadingMore, page, totalPages]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 380);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setIsFiltersPanelOpen(false);
  };

  const handleClearFilters = () => {
    const c = {
      search: "",
      subcategory: "",
      region: "",
      country: "",
      dataType: "",
      isFeatured: "",
      isDownloadable: "",
      sortBy: "created_at",
      sortOrder: "desc",
    };
    setSearch("");
    setFilters(c);
    setAppliedFilters(c);
  };

  const handleBackToTop = () => {
    datasetsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    }) ?? window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── handleOpenDataset ───────────────────────────────────────────────────
     Accepts two shapes:
       • Dropdown item  → { uid (alpha-encoded), slug, record_id, ... }
       • DatasetCard    → { id, slug, title, ... }  (raw dataset object)

     Navigation path: /datasets/<UID>?slug=<slug>
       uid  = encryptId(numeric_id)  — pure A-Z, min 4 chars
       slug = dataset.slug           — appended as query param when present

     On the detail page:
       const { uid } = useParams();
       const slug = new URLSearchParams(location.search).get("slug");
       // decode uid back to numeric id:
       const rawId = [...uid.toUpperCase()].reduce(
         (acc, ch) => acc * 26 + (ch.charCodeAt(0) - 65), 0
       );
  ──────────────────────────────────────────────────────────────────────── */
  const handleOpenDataset = useCallback(
    (dataset) => {
      // Dropdown items already have uid pre-encoded; cards have raw id
      const uid = dataset.uid ?? encryptId(dataset.id);
      const slug = dataset.slug ?? null;
      const path = buildDatasetPath(uid, slug);
      navigate(path, { state: { uid, slug } });
    },
    [navigate],
  );

  const getPlaceholder = () => {
    if (selectedCategory?.selectedSubcategory)
      return `Search datasets in ${selectedCategory.selectedSubcategory.name}`;
    if (selectedCategory) return `Search datasets in ${selectedCategory.name}`;
    return total > 0 ? `Search ${total} datasets` : "Search datasets";
  };

  return (
    <PageLayout>
      <DatasetsHelmet
        total={total}
        search={search}
        selectedCategory={selectedCategory}
      />

      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: themeColors.bg,
          transition: "background-color 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            px: { xs: 2, md: 3, lg: 4 },
            pt: 1.5,
            pb: 4,
            gap: { xs: 2, md: 2.5, lg: 3 },
          }}
        >
          {/* Sidebar */}
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: SIDEBAR_EXPANDED },
              position: { xs: "relative", lg: "sticky" },
              top: { lg: NAVBAR_HEIGHT + 16 },
              maxHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 32}px)` },
              overflowY: { lg: "hidden" },
            }}
          >
            <CategorySidebar
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              disableCollapse
            />
          </Box>

          {/* Main */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              ref={datasetsTopRef}
              sx={{
                mb: 2.5,
                position: "relative",
                zIndex: "auto",
                backgroundColor: themeColors.bg,
                borderBottom: `1px solid ${themeColors.border}`,
                pb: 2,
                transition: "background-color 0.3s ease",
              }}
            >
              {/* Toolbar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", lg: "center" },
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 2,
                }}
              >
                {/* Search */}
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    minWidth: { xs: "100%", md: 280 },
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder={getPlaceholder()}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setIsSearchFocused(false), 220)
                    }
                    variant="outlined"
                    sx={{
                      backgroundColor: themeColors.card,
                      borderRadius: "10px",
                      transition: "background-color 0.3s ease",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        height: 44,
                        fontSize: "0.95rem",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} color={themeColors.text} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  {isSearchFocused && (
                    <SearchDropdown
                      themeColors={themeColors}
                      onSelectSearch={(tag) => setSearch(tag)}
                      onSelectDataset={handleOpenDataset}
                    />
                  )}
                </Box>

                {/* Filter */}
                <Box
                  onClick={() => setIsFiltersPanelOpen(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    color: PRIMARY_COLOR,
                    cursor: "pointer",
                    px: 1.2,
                    py: 0.7,
                    height: 44,
                    borderRadius: "8px",
                    border: `1px solid ${themeColors.border}`,
                    backgroundColor: themeColors.card,
                    flexShrink: 0,
                    "&:hover": { backgroundColor: `${PRIMARY_COLOR}10` },
                  }}
                >
                  <SlidersHorizontal size={16} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Filter
                  </Typography>
                </Box>

                {/* Sort */}
                <Select
                  value={appliedFilters.sortBy || "created_at"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilters((p) => ({ ...p, sortBy: v }));
                    setAppliedFilters((p) => ({ ...p, sortBy: v }));
                  }}
                  sx={{
                    backgroundColor: themeColors.bgSecondary,
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: `1px solid ${themeColors.border}`,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: themeColors.text,
                    minWidth: "130px",
                    height: 44,
                    flexShrink: 0,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    "&:hover": { backgroundColor: themeColors.hoverBg },
                    "& .MuiSvgIcon-root": { color: themeColors.textMuted },
                  }}
                >
                  {sortOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>

                {/* View toggle */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    backgroundColor: themeColors.bgSecondary,
                    borderRadius: "8px",
                    padding: "3px",
                    border: `1px solid ${themeColors.border}`,
                    flexShrink: 0,
                  }}
                >
                  {[
                    { type: "grid", Icon: Grid3x3 },
                    { type: "list", Icon: List },
                  ].map(({ type, Icon }) => (
                    <Box
                      key={type}
                      onClick={() => setViewType(type)}
                      title={`${type} view`}
                      sx={{
                        p: 0.75,
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s",
                        backgroundColor:
                          viewType === type ? themeColors.card : "transparent",
                        border:
                          viewType === type
                            ? `1px solid ${themeColors.border}`
                            : "none",
                        "&:hover": { backgroundColor: themeColors.hoverBg },
                      }}
                    >
                      <Icon
                        size={17}
                        color={
                          viewType === type
                            ? PRIMARY_COLOR
                            : themeColors.textMuted
                        }
                      />
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Result count */}
              {!loading && (
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    color: themeColors.textMuted,
                    mb: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {total > 0
                    ? `${total} dataset${total !== 1 ? "s" : ""} found`
                    : ""}
                </Typography>
              )}

              {/* Category chips */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 3,
                  alignItems: "center",
                }}
              >
                <Chip
                  label="All Datasets"
                  onClick={() => setSelectedCategory(null)}
                  variant={!selectedCategory ? "filled" : "outlined"}
                  sx={{
                    borderRadius: "6px",
                    fontSize: "0.83rem",
                    height: 30,
                    px: 1.2,
                    backgroundColor: !selectedCategory
                      ? PRIMARY_COLOR
                      : themeColors.card,
                    color: !selectedCategory ? "#fff" : themeColors.text,
                    borderColor: themeColors.border,
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: !selectedCategory
                        ? PRIMARY_COLOR
                        : themeColors.hoverBg,
                    },
                  }}
                />
                {selectedCategory && (
                  <Chip
                    label={selectedCategory.name}
                    onClick={() =>
                      setSelectedCategory({
                        ...selectedCategory,
                        selectedSubcategory: null,
                      })
                    }
                    onDelete={() => setSelectedCategory(null)}
                    deleteIcon={<X size={13} />}
                    variant={
                      !selectedCategory.selectedSubcategory
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontSize: "0.83rem",
                      height: 30,
                      px: 1.2,
                      backgroundColor: !selectedCategory.selectedSubcategory
                        ? PRIMARY_COLOR
                        : themeColors.card,
                      color: !selectedCategory.selectedSubcategory
                        ? "#fff"
                        : themeColors.text,
                      borderColor: themeColors.border,
                      fontWeight: 600,
                    }}
                  />
                )}
                {selectedCategory?.subcategories?.map((sub) => (
                  <Chip
                    key={sub.id}
                    label={sub.name}
                    onClick={() =>
                      setSelectedCategory({
                        ...selectedCategory,
                        selectedSubcategory: sub,
                      })
                    }
                    onDelete={
                      selectedCategory.selectedSubcategory?.id === sub.id
                        ? () =>
                            setSelectedCategory({
                              ...selectedCategory,
                              selectedSubcategory: null,
                            })
                        : undefined
                    }
                    deleteIcon={
                      selectedCategory.selectedSubcategory?.id === sub.id ? (
                        <X size={13} />
                      ) : undefined
                    }
                    variant={
                      selectedCategory.selectedSubcategory?.id === sub.id
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontSize: "0.83rem",
                      height: 30,
                      px: 1.2,
                      backgroundColor:
                        selectedCategory.selectedSubcategory?.id === sub.id
                          ? PRIMARY_COLOR
                          : themeColors.card,
                      color:
                        selectedCategory.selectedSubcategory?.id === sub.id
                          ? "#fff"
                          : themeColors.text,
                      borderColor: themeColors.border,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>

              {loading && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 8,
                  }}
                >
                  <CircularProgress size={36} sx={{ color: PRIMARY_COLOR }} />
                </Box>
              )}

              {!loading && error && (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ color: "#f87171", fontWeight: 600, mb: 1 }}>
                    Failed to load datasets
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.85rem", color: themeColors.textMuted }}
                  >
                    {error}
                  </Typography>
                  <Box
                    onClick={() => {
                      setPage(1);
                      setDatasets([]);
                    }}
                    sx={{
                      mt: 2,
                      display: "inline-block",
                      px: 3,
                      py: 1,
                      backgroundColor: PRIMARY_COLOR,
                      color: "#fff",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Retry
                  </Box>
                </Box>
              )}

              {!loading && !error && (
                <>
                  <Box
                    sx={{
                      display: viewType === "grid" ? "grid" : "flex",
                      gridTemplateColumns:
                        viewType === "grid"
                          ? {
                              xs: "1fr",
                              sm: "repeat(2, 1fr)",
                              lg: "repeat(3, 1fr)",
                              xl: "repeat(3, 1fr)",
                            }
                          : undefined,
                      flexDirection: viewType === "list" ? "column" : undefined,
                      gap: 2.5,
                      transition: "grid-template-columns 0.28s ease",
                    }}
                  >
                    {datasets.length > 0 ? (
                      datasets.map((d) => (
                        <DatasetCard
                          key={d.id}
                          dataset={d}
                          viewType={viewType}
                          onOpen={handleOpenDataset}
                        />
                      ))
                    ) : (
                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          textAlign: "center",
                          py: 6,
                          width: "100%",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            color: themeColors.textMuted,
                            fontWeight: 500,
                          }}
                        >
                          No datasets found
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {page < totalPages && (
                    <Box
                      ref={loadMoreRef}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 5,
                        mb: 2,
                      }}
                    >
                      {loadingMore ? (
                        <CircularProgress
                          size={28}
                          sx={{ color: PRIMARY_COLOR }}
                        />
                      ) : (
                        <Box
                          onClick={() => setPage((p) => p + 1)}
                          sx={{
                            px: 3.5,
                            py: 1.2,
                            backgroundColor: PRIMARY_COLOR,
                            color: "#fff",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.93rem",
                            cursor: "pointer",
                            transition: "all .2s ease",
                            border: `2px solid ${PRIMARY_COLOR}`,
                            "&:hover": {
                              backgroundColor: "#50ada8",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(97,197,195,0.2)",
                            },
                            "&:active": { transform: "translateY(0)" },
                          }}
                        >
                          Load More
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>

        <FiltersPanel
          isOpen={isFiltersPanelOpen}
          onClose={() => setIsFiltersPanelOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <Zoom in={showBackToTop}>
          <Box
            onClick={handleBackToTop}
            role="button"
            aria-label="Back to top"
            sx={{
              position: "fixed",
              right: { xs: 16, md: 24 },
              bottom: { xs: 18, md: 28 },
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #61C5C3, #3aa7a4)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 1300,
              boxShadow: "0 10px 24px rgba(58,167,164,0.45)",
              animation: "floatPulse 2.1s ease-in-out infinite",
              "@keyframes floatPulse": {
                "0%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-4px)" },
                "100%": { transform: "translateY(0)" },
              },
              "&:hover": {
                transform: "translateY(-3px) scale(1.06)",
                boxShadow: "0 14px 30px rgba(58,167,164,0.5)",
              },
            }}
          >
            <ChevronUp size={22} />
          </Box>
        </Zoom>
      </Box>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   DatasetCard
═══════════════════════════════════════════════════ */
function DatasetCard({ dataset, viewType = "grid", onOpen }) {
  const themeColors = useThemeColors();

  const imageUrl = dataset.thumbnail || getFallbackThumbnail(dataset.id);
  const author = dataset.owner_user_name || "Unknown Author";
  const licenseType = dataset.license_type || "Public";
  const fileLabel = dataset.file_format || "File";
  const sizeLabel = dataset.file_size_human || "—";
  const downloadsLabel = dataset.total_downloads?.toLocaleString() ?? "0";
  const timeAgoLabel = timeAgo(dataset.updated_at);
  const country = dataset.country || "—";

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

  // Pass raw dataset; handleOpenDataset handles uid encoding + slug query param
  const handleOpen = () => onOpen(dataset);

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

  /* ════ LIST VIEW ════ */
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
            sx={{
              width: 100,
              height: 100,
              borderRadius: "8px",
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
            }}
            onClick={handleOpen}
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
          }}
        >
          <Box>
            <Typography
              onClick={handleOpen}
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: themeColors.text,
                cursor: "pointer",
                mb: 0.8,
                "&:hover": { color: PRIMARY_COLOR },
              }}
            >
              {dataset.title}
            </Typography>
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
                  width: 4,
                  height: 4,
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
            {PriceDisplay}
          </Box>
        </Box>
      </Box>
    );
  }

  /* ════ GRID VIEW ════ */
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
        {PriceDisplay}
      </Box>
    </Card>
  );
}

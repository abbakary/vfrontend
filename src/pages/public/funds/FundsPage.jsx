import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Wallet,
  Calendar,
  MoreVertical,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Plus,
  Send,
  Grid3x3,
  List,
  SlidersHorizontal,
  DollarSign,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import FundsFiltersPanel from "../components/FundsFiltersPanel";
import fundRequestService from "../../../utils/fundRequestService";
import { useAuth } from "../../../context/AuthContext";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const PAGE_SIZE = 12;
const PRIMARY = "#61C5C3";

// Fallback image for funds (since API doesn't provide thumbnails)
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";

// Helper: compact number
function fmtCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// Helper: format currency
function formatCurrency(amount, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper: days left until end_date
function daysLeft(endDateStr) {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

// Auth helpers
const getToken = () =>
  localStorage.getItem("dali-token") || sessionStorage.getItem("dali-token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Build query string for /public-funds/
function buildFundQuery({
  search,
  selectedCategory,
  selectedType,
  selectedRegion,
  selectedCountry,
  filters,
  page,
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  params.set("sort_by", filters.sortBy || "created_at");
  params.set("sort_order", filters.sortOrder || "desc");

  const q = (filters.search || search || "").trim();
  if (q) params.set("search", q);

  if (selectedRegion) params.set("region", selectedRegion);
  if (selectedCountry) params.set("country", selectedCountry);
  if (selectedType && selectedType !== "All") params.set("type", selectedType);
  if (selectedCategory && selectedCategory !== "All Categories")
    params.set("category_name", selectedCategory);
  if (filters.status && filters.status !== "All")
    params.set("status", filters.status);

  return params.toString();
}

// Fetch funds from API
async function fetchFunds(queryString) {
  const res = await fetch(`${API_BASE}/public-funds/?${queryString}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json; // { total, page, page_size, total_pages, has_next, has_prev, data }
}

export default function FundsPage() {
  const navigate = useNavigate();
  const { authUser, userId } = useAuth();

  // --- State ---
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [viewType, setViewType] = useState("grid");
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const [latestRequest, setLatestRequest] = useState(null);

  const [funds, setFunds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // --- Categories for chips (from fetched funds, extracted dynamically) ---
  const [categoryOptions, setCategoryOptions] = useState(["All Categories"]);

  // --- Filters state (for sorting and status) ---
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // --- Request form state ---
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Finance and Investment",
    dataType: "CSV",
    fundingType: "Grant",
    amount: "",
    amountCurrency: "USD",
    timeline: "0-30 days",
    company: "",
    contactName: "",
    contactEmail: "",
  });

  // --- Load latest request from sessionStorage ---
  const refreshLatestRequest = useCallback(() => {
    if (!userId) {
      setLatestRequest(null);
      return;
    }
    setLatestRequest(fundRequestService.getLatestRequestByUser(String(userId)));
  }, [userId]);

  useEffect(() => {
    refreshLatestRequest();
  }, [refreshLatestRequest]);

  // --- Extract unique categories from fetched funds (for chips row) ---
  useEffect(() => {
    if (funds.length > 0) {
      const cats = new Set(funds.map((f) => f.category_name).filter(Boolean));
      setCategoryOptions(["All Categories", ...Array.from(cats)]);
    }
  }, [funds]);

  // --- Debounced search ---
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setFunds([]);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // --- Reset page when filters/category/type/region/country change ---
  useEffect(() => {
    setPage(1);
    setFunds([]);
  }, [
    appliedFilters,
    selectedCategory,
    selectedType,
    selectedRegion,
    selectedCountry,
  ]);

  // --- Fetch funds (with pagination) ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = buildFundQuery({
          search,
          selectedCategory,
          selectedType,
          selectedRegion,
          selectedCountry,
          filters: appliedFilters,
          page,
        });
        const result = await fetchFunds(qs);
        if (!cancelled) {
          setFunds((prev) =>
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
  }, [
    page,
    appliedFilters,
    selectedCategory,
    selectedType,
    selectedRegion,
    selectedCountry,
    search,
  ]);

  // --- Infinite scroll observer ---
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

  // --- Back to top ---
  const [showBackToTop, setShowBackToTop] = useState(false);
  const topRef = useRef(null);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 380);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleBackToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) ??
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Stats (derived from API total and current page) ---
  const activeCount = funds.filter((f) => f.status === "Active").length;
  const stats = [
    {
      label: "Total Funds",
      value: fmtCount(total),
      change: "",
      icon: <Wallet size={22} color={PRIMARY} />,
    },
    {
      label: "Active Campaigns",
      value: fmtCount(activeCount),
      change: "",
      icon: <Target size={22} color={PRIMARY} />,
    },
    {
      label: "Total Disbursed",
      value: formatCurrency(
        funds.reduce((sum, f) => sum + (f.disbursed || 0), 0),
        "USD",
      ),
      change: "",
      icon: <TrendingUp size={22} color={PRIMARY} />,
    },
    {
      label: "Avg. Progress",
      value: funds.length
        ? `${Math.round(funds.reduce((sum, f) => sum + (f.progress || 0), 0) / funds.length)}%`
        : "—",
      change: "",
      icon: <CheckCircle size={22} color={PRIMARY} />,
    },
  ];

  const sortOptions = [
    { value: "created_at", label: "Newest" },
    { value: "updated_at", label: "Recently Updated" },
    { value: "title", label: "Title" },
    { value: "total_amount", label: "Largest Amount" },
    { value: "progress", label: "Progress" },
    { value: "end_date", label: "Ending Soon" },
  ];

  const fundingTypes = ["All", "Grant", "Loan", "Donation", "Investment"];

  const handleApplyFilters = (newFilters) => {
    setAppliedFilters(newFilters);
    setIsFiltersPanelOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedType("All");
    setSelectedRegion("");
    setSelectedCountry("");
    setAppliedFilters({ ...filters, status: "All" });
    setSearch("");
  };

  // --- Request modal handlers ---
  const openRequest = () => {
    setForm((p) => ({
      ...p,
      company: p.company || authUser?.company || "",
      contactName: p.contactName || authUser?.full_name || authUser?.name || "",
      contactEmail: p.contactEmail || authUser?.email || "",
    }));
    setRequestOpen(true);
  };

  const validate = () => {
    const errors = [];
    if (!userId) errors.push("Please sign in first to request funding.");
    if (!form.title.trim()) errors.push("Title is required.");
    if (!form.description.trim()) errors.push("Description is required.");
    if (!form.company.trim()) errors.push("Company is required.");
    if (!form.contactName.trim()) errors.push("Contact name is required.");
    if (!form.contactEmail.trim() || !form.contactEmail.includes("@"))
      errors.push("A valid email is required.");
    if (!String(form.amount).trim() || Number(form.amount) <= 0)
      errors.push("Requested amount must be greater than 0.");
    return errors;
  };

  const submitFundRequest = () => {
    const errors = validate();
    if (errors.length) {
      setSnack({ open: true, severity: "error", message: errors[0] });
      return;
    }

    const req = fundRequestService.createRequest({
      userId: String(userId),
      userName: form.contactName.trim(),
      userEmail: form.contactEmail.trim(),
      company: form.company.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      dataType: form.dataType,
      fundingType: form.fundingType,
      amount: Number(form.amount),
      amountCurrency: form.amountCurrency,
      timeline: form.timeline,
    });

    setLatestRequest(req);
    setRequestOpen(false);
    setSnack({
      open: true,
      severity: "success",
      message: "Fund request submitted. Awaiting Admin/Editor review.",
    });
    refreshLatestRequest();
  };

  return (
    <PageLayout>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-gray)",
          py: 4,
          transition: "background-color 0.3s ease",
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              mb: 4,
              flexWrap: { xs: "wrap", md: "nowrap" },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
              >
                <Wallet size={28} color={PRIMARY} />
                <Typography
                  sx={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                  }}
                >
                  Funding Opportunities
                </Typography>
              </Box>
              <Typography sx={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Buy practical fund application guides, eligibility details, and
                winning strategies to improve your chance of funding in
                research, projects, and innovation programs.
              </Typography>
            </Box>
            <Box
              onClick={openRequest}
              sx={{
                px: 2.5,
                py: 1.2,
                backgroundColor: PRIMARY,
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
                "&:hover": { backgroundColor: "#49b2b1" },
              }}
            >
              <Plus size={16} color="#fff" />
              <Typography
                sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}
              >
                Request Funding Support
              </Typography>
            </Box>
          </Box>

          {/* Latest request banner */}
          {latestRequest && (
            <Card
              sx={{
                borderRadius: 2,
                border: `1px solid ${PRIMARY}55`,
                boxShadow: "none",
                mb: 3,
                backgroundColor: `${PRIMARY}10`,
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontWeight: 900, color: "var(--text-dark)" }}
                  >
                    Latest fund request
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                      mt: 0.3,
                    }}
                  >
                    {latestRequest.title} • {latestRequest.amountCurrency}{" "}
                    {Number(latestRequest.amount || 0).toLocaleString()} •{" "}
                    {latestRequest.timeline}
                  </Typography>
                </Box>
                <Chip
                  label={String(latestRequest.status).toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    backgroundColor:
                      latestRequest.status === "PENDING"
                        ? "#fffbeb"
                        : latestRequest.status === "APPROVED"
                          ? "#f0fdf4"
                          : latestRequest.status === "REJECTED"
                            ? "#fef2f2"
                            : "#f9fafb",
                    color:
                      latestRequest.status === "PENDING"
                        ? "#f59e0b"
                        : latestRequest.status === "APPROVED"
                          ? "#16a34a"
                          : latestRequest.status === "REJECTED"
                            ? "#dc2626"
                            : "#6b7280",
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" },
              gap: 2,
              mb: 4,
            }}
          >
            {stats.map((s) => (
              <Card
                key={s.label}
                sx={{
                  borderRadius: 2,
                  border: "1px solid var(--border-color)",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor: "rgba(97, 197, 195, 0.1)",
                        flexShrink: 0,
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          color: "var(--text-dark)",
                          lineHeight: 1.1,
                        }}
                      >
                        {s.value}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.label}
                      </Typography>
                    </Box>
                    {s.change && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.3,
                          flexShrink: 0,
                        }}
                      >
                        <ArrowUpRight size={12} color="#16a34a" />
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            color: "#16a34a",
                            fontWeight: 700,
                          }}
                        >
                          {s.change}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Controls Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              gap: 1,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}>
              <TextField
                fullWidth
                placeholder="Search funding opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                variant="outlined"
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    height: 44,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#6b7280" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box
              onClick={() => setIsFiltersPanelOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                color: PRIMARY,
                cursor: "pointer",
                px: 1.2,
                py: 0.7,
                height: 44,
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--card-bg)",
                flexShrink: 0,
                "&:hover": { backgroundColor: `${PRIMARY}10` },
              }}
            >
              <SlidersHorizontal size={16} />
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Filter
              </Typography>
            </Box>

            <Select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value;
                setSortBy(val);
                setAppliedFilters((p) => ({ ...p, sortBy: val }));
              }}
              size="small"
              sx={{
                minWidth: 170,
                height: 44,
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
                fontSize: "0.84rem",
                color: "var(--text-dark)",
                flexShrink: 0,
              }}
            >
              {sortOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                backgroundColor: "#fff",
                borderRadius: "8px",
                padding: "4px",
                border: "1px solid #e5e7eb",
              }}
            >
              {[
                { type: "grid", Icon: Grid3x3 },
                { type: "list", Icon: List },
              ].map(({ type, Icon }) => (
                <Box
                  key={type}
                  onClick={() => setViewType(type)}
                  sx={{
                    p: 0.8,
                    borderRadius: "6px",
                    backgroundColor:
                      viewType === type ? "#f9fafb" : "transparent",
                    border: viewType === type ? "1px solid #e5e7eb" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  <Icon
                    size={18}
                    color={viewType === type ? PRIMARY : "#6b7280"}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Category chips row (extracted from fetched funds) */}
          {categoryOptions.length > 1 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 3,
                flexWrap: "nowrap",
                overflowX: "auto",
                pb: 0.5,
              }}
            >
              {categoryOptions.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "filled" : "outlined"}
                  sx={{
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                    height: 30,
                    backgroundColor:
                      selectedCategory === cat ? PRIMARY : "var(--card-bg)",
                    color:
                      selectedCategory === cat ? "#fff" : "var(--text-dark)",
                    borderColor: "var(--border-color)",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor:
                        selectedCategory === cat ? PRIMARY : "var(--hover-bg)",
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Funds Grid/List */}
          <Box ref={topRef}>
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={36} sx={{ color: PRIMARY }} />
              </Box>
            )}
            {!loading && error && (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ color: "#f87171", fontWeight: 600, mb: 1 }}>
                  Failed to load funds
                </Typography>
                <Typography
                  sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {error}
                </Typography>
                <Box
                  onClick={() => {
                    setPage(1);
                    setFunds([]);
                  }}
                  sx={{
                    mt: 2,
                    display: "inline-block",
                    px: 3,
                    py: 1,
                    backgroundColor: PRIMARY,
                    color: "#fff",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
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
                            sm: "repeat(2,1fr)",
                            lg: "repeat(3,1fr)",
                          }
                        : undefined,
                    flexDirection: viewType === "list" ? "column" : undefined,
                    gap: 3,
                  }}
                >
                  {funds.length > 0 ? (
                    funds.map((fund) => (
                      <FundCard
                        key={fund.id}
                        fund={fund}
                        viewType={viewType}
                        onOpen={() =>
                          navigate(`/funds/${fund.id}`, { state: { fund } })
                        }
                      />
                    ))
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 8,
                        width: "100%",
                        gridColumn: "1 / -1",
                      }}
                    >
                      <Wallet
                        size={48}
                        color="#d1d5db"
                        style={{ margin: "0 auto 16px" }}
                      />
                      <Typography sx={{ color: "var(--text-muted)" }}>
                        No funding opportunities found
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
                      <CircularProgress size={28} sx={{ color: PRIMARY }} />
                    ) : (
                      <Box
                        onClick={() => setPage((p) => p + 1)}
                        sx={{
                          px: 3.5,
                          py: 1.2,
                          backgroundColor: PRIMARY,
                          color: "#fff",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "0.93rem",
                          cursor: "pointer",
                          transition: "all .2s ease",
                          border: `2px solid ${PRIMARY}`,
                          "&:hover": {
                            backgroundColor: "#50ada8",
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 16px rgba(97,197,195,0.2)",
                          },
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
        </Container>

        {/* Request Dialog (unchanged) */}
        <Dialog
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            Request Funding Support
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              Your request will be reviewed by Admin/Editor and matched with the
              right funding guidance resources.
            </Alert>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField
                label="Request title"
                placeholder="e.g. Funding for Healthcare Analytics Dataset Expansion"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Describe your funding need"
                placeholder="What dataset are you building or improving, and why you need funding?"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={3}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  select
                  label="Funding type"
                  value={form.fundingType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fundingType: e.target.value }))
                  }
                  fullWidth
                >
                  {["Grant", "Investment", "Research Grant", "Crowdfund"].map(
                    (t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ),
                  )}
                </TextField>
                <TextField
                  select
                  label="Data type"
                  value={form.dataType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dataType: e.target.value }))
                  }
                  fullWidth
                >
                  {["CSV", "JSON", "Images", "Text", "API", "Mixed"].map(
                    (t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="Requested amount"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  select
                  label="Currency"
                  value={form.amountCurrency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amountCurrency: e.target.value }))
                  }
                  fullWidth
                >
                  {["USD", "EUR", "GBP"].map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                select
                label="Timeline"
                value={form.timeline}
                onChange={(e) =>
                  setForm((p) => ({ ...p, timeline: e.target.value }))
                }
                fullWidth
              >
                {["0-30 days", "1-3 months", "3-6 months", "6-12 months"].map(
                  (t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <TextField
                label="Company"
                value={form.company}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company: e.target.value }))
                }
                fullWidth
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="Contact name"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactName: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Contact email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactEmail: e.target.value }))
                  }
                  fullWidth
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setRequestOpen(false)}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitFundRequest}
              startIcon={<Send size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                backgroundColor: PRIMARY,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#49b2b1", boxShadow: "none" },
              }}
            >
              Submit request
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

        <FundsFiltersPanel
          isOpen={isFiltersPanelOpen}
          onClose={() => setIsFiltersPanelOpen(false)}
          selectedCategory={selectedCategory}
          selectedType={selectedType}
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry}
          onCategoryChange={setSelectedCategory}
          onTypeChange={setSelectedType}
          onRegionChange={setSelectedRegion}
          onCountryChange={setSelectedCountry}
          onClear={handleClearFilters}
          categories={categoryOptions}
          fundingTypes={fundingTypes}
        />

        {/* Back to top */}
        {showBackToTop && (
          <Box
            onClick={handleBackToTop}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: PRIMARY,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.2s",
              "&:hover": { transform: "translateY(-3px)" },
            }}
          >
            <ArrowUpRight size={20} />
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}

// ----------------------------------------------------------------------
// Fund Card Component (supports grid & list)
// ----------------------------------------------------------------------
function FundCard({ fund, viewType, onOpen }) {
  const progress = fund.progress ?? 0;
  const isFunded = progress >= 100;
  const daysRemaining = daysLeft(fund.end_date);
  const isEndingSoon =
    daysRemaining !== null &&
    daysRemaining > 0 &&
    daysRemaining <= 7 &&
    !isFunded;

  const donor = fund.donor || fund.manager || "Unknown";
  const category = fund.category_name || fund.type || "Fund";

  // Card image overlay badges
  const imageBadges = (
    <>
      {fund.type && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            px: 1,
            py: 0.3,
            borderRadius: 1,
            backgroundColor:
              fund.type === "Grant"
                ? "#3b82f6"
                : fund.type === "Investment"
                  ? "#8b5cf6"
                  : fund.type === "Loan"
                    ? "#f59e0b"
                    : "#22c55e",
          }}
        >
          <Typography
            sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}
          >
            {fund.type}
          </Typography>
        </Box>
      )}
      {isFunded && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            px: 1,
            py: 0.3,
            borderRadius: 1,
            backgroundColor: "#16a34a",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <CheckCircle size={11} color="#fff" />
          <Typography
            sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}
          >
            Funded!
          </Typography>
        </Box>
      )}
      {isEndingSoon && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            px: 1,
            py: 0.3,
            borderRadius: 1,
            backgroundColor: "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Clock size={11} color="#fff" />
          <Typography
            sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}
          >
            {daysRemaining}d left
          </Typography>
        </Box>
      )}
    </>
  );

  // Progress section
  const progressSection = (
    <Box sx={{ mb: viewType === "list" ? 0.8 : 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--text-dark)",
          }}
        >
          {formatCurrency(fund.disbursed, fund.currency)}
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          of {formatCurrency(fund.total_amount, fund.currency)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: viewType === "list" ? 5 : 7,
          borderRadius: 4,
          backgroundColor: "#e5e7eb",
          "& .MuiLinearProgress-bar": {
            backgroundColor: isFunded ? "#16a34a" : PRIMARY,
            borderRadius: 4,
          },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: isFunded ? "#16a34a" : PRIMARY,
          }}
        >
          {progress}% funded
        </Typography>
        {fund.status && (
          <Chip
            label={fund.status}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              backgroundColor:
                fund.status === "Active"
                  ? "#e0f2fe"
                  : fund.status === "Partially Disbursed"
                    ? "#fffbeb"
                    : fund.status === "Fully Disbursed"
                      ? "#f0fdf4"
                      : "#fef2f2",
              color:
                fund.status === "Active"
                  ? "#0284c7"
                  : fund.status === "Partially Disbursed"
                    ? "#f59e0b"
                    : fund.status === "Fully Disbursed"
                      ? "#16a34a"
                      : "#dc2626",
            }}
          />
        )}
      </Box>
    </Box>
  );

  // LIST VIEW
  if (viewType === "list") {
    return (
      <Card
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          boxShadow: "none",
          transition: "all 0.25s ease",
          cursor: "pointer",
          display: "flex",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(97,197,195,0.13)",
            borderColor: PRIMARY,
          },
        }}
        onClick={onOpen}
      >
        <Box
          sx={{
            width: 180,
            flexShrink: 0,
            backgroundImage: `url(${FALLBACK_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {imageBadges}
        </Box>
        <CardContent
          sx={{
            p: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                lineHeight: 1.35,
                mb: 0.3,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {fund.title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: "#1f2937",
                fontWeight: 500,
                mb: 0.3,
              }}
            >
              {donor}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {category} • {fund.country || "Various"}
            </Typography>
            {progressSection}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pt: 1,
              mt: 1,
              borderTop: "1px solid #e5e7eb",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Calendar size={13} color={PRIMARY} />
              <Typography
                sx={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
              >
                {fund.start_date
                  ? `From ${new Date(fund.start_date).toLocaleDateString()}`
                  : "TBD"}
              </Typography>
            </Box>
            {fund.end_date && (
              <Typography
                sx={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
              >
                to {new Date(fund.end_date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // GRID VIEW
  return (
    <Card
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "none",
        transition: "all 0.25s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 10px 24px rgba(97,197,195,0.13)",
          borderColor: PRIMARY,
        },
      }}
      onClick={onOpen}
    >
      <Box
        sx={{
          height: 160,
          backgroundImage: `url(${FALLBACK_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {imageBadges}
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
            mb: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-dark)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {fund.title}
          </Typography>
          <MoreVertical size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "#1f2937",
            fontWeight: 500,
            mb: 0.6,
          }}
        >
          {donor}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            mb: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {category} • {fund.country || "Various"}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 0.6,
            mb: 1.4,
            pb: 1.4,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {[
            {
              icon: <Target size={12} color={PRIMARY} />,
              label: formatCurrency(fund.total_amount, fund.currency),
            },
            {
              icon: <Calendar size={12} color={PRIMARY} />,
              label: fund.end_date ? `${daysRemaining ?? 0}d left` : "Open",
            },
            {
              icon: <Users size={12} color={PRIMARY} />,
              label: fund.status || "Active",
            },
          ].map((item, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.3,
                p: 0.6,
                borderRadius: 1,
                backgroundColor: "#f9fafb",
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {progressSection}
      </CardContent>
    </Card>
  );
}

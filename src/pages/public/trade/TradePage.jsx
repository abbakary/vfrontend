import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardContent,
  TextField,
  Box,
  Container,
  IconButton,
  InputAdornment,
  Chip,
  Select,
  MenuItem,
  Zoom,
  Modal,
  Fade,
  Backdrop,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  ChevronUp,
  Calendar,
  X,
  Grid3x3,
  List,
  BarChart3,
  ArrowUpRight,
  Globe,
  Plus,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import TradeFiltersPanel from "../components/TradeFiltersPanel";
import { useThemeColors } from "../../../utils/useThemeColors";
import { useAuth } from "../../../context/AuthContext";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const PAGE_SIZE = 12;

// Fallback image
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";

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

// Auth helpers
const getToken = () =>
  localStorage.getItem("dali-token") || sessionStorage.getItem("dali-token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Build query string for /public-trade/
function buildTradeQuery({
  search,
  selectedRegion,
  selectedCountry,
  selectedCategory,
  selectedType,
  selectedStatus,
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

  if (selectedRegion && selectedRegion !== "All Regions")
    params.set("region", selectedRegion);
  if (selectedCountry) params.set("country", selectedCountry);
  if (selectedCategory && selectedCategory !== "All Categories")
    params.set("category_name", selectedCategory);
  if (selectedType && selectedType !== "All") params.set("type", selectedType);
  if (selectedStatus && selectedStatus !== "All")
    params.set("status", selectedStatus);

  return params.toString();
}

// Fetch trades from API
async function fetchTrades(queryString) {
  const res = await fetch(`${API_BASE}/public-trade/?${queryString}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json; // { total, page, page_size, total_pages, has_next, has_prev, data }
}

export default function TradePage() {
  const navigate = useNavigate();
  const { authUser, userId } = useAuth();
  const themeColors = useThemeColors();
  const PRIMARY_COLOR = themeColors.teal || "#61C5C3";

  // --- State ---
  const [search, setSearch] = useState("");
  const [viewType, setViewType] = useState("grid");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // API data
  const [trades, setTrades] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters & sort
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // Categories for chips (extracted from fetched trades)
  const [categoryOptions, setCategoryOptions] = useState(["All Categories"]);

  // --- Request form state (unchanged) ---
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tradeType: "Export Data",
    regions: [],
    budget: "",
    deadline: "",
    specifications: "",
    priorityLevel: "Medium",
  });

  const loadMoreRef = useRef(null);
  const tradesTopRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // --- Extract unique categories from fetched trades ---
  useEffect(() => {
    if (trades.length > 0) {
      const cats = new Set(trades.map((t) => t.category_name).filter(Boolean));
      setCategoryOptions(["All Categories", ...Array.from(cats)]);
    }
  }, [trades]);

  // --- Debounced search ---
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setTrades([]);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // --- Reset page when filters/region/category/type/status change ---
  useEffect(() => {
    setPage(1);
    setTrades([]);
  }, [
    appliedFilters,
    selectedRegion,
    selectedCategory,
    selectedType,
    selectedStatus,
    selectedCountry,
  ]);

  // --- Fetch trades (with pagination) ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = buildTradeQuery({
          search,
          selectedRegion,
          selectedCountry,
          selectedCategory,
          selectedType,
          selectedStatus,
          filters: appliedFilters,
          page,
        });
        const result = await fetchTrades(qs);
        if (!cancelled) {
          setTrades((prev) =>
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
    selectedRegion,
    selectedCategory,
    selectedType,
    selectedStatus,
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
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 380);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBackToTop = () => {
    tradesTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    }) ?? window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Filter handlers ---
  const handleApplyFilters = (newFilters) => {
    // newFilters would come from the filters panel (region, country, category, type, status)
    // We'll handle them via the existing state setters that are passed to the panel
    setIsFiltersPanelOpen(false);
  };

  const handleClearTradeFilters = () => {
    setSelectedRegion("All Regions");
    setSelectedCountry("");
    setSelectedCategory("All Categories");
    setSelectedType("All");
    setSelectedStatus("All");
    setAppliedFilters({ ...filters });
  };

  // --- Sort options mapping to API sort_by ---
  const sortOptions = [
    { value: "created_at", label: "Newest" },
    { value: "updated_at", label: "Recently Updated" },
    { value: "title", label: "Title" },
    { value: "value", label: "Highest Value" },
    { value: "growth", label: "Highest Growth" },
    { value: "end_date", label: "Ending Soon" },
  ];

  const tradeRegions = [
    "All Regions",
    "North",
    "West",
    "East",
    "Central",
    "South",
  ];

  const tradeTypes = ["All", "Import", "Export", "Re-export", "Transit"];
  const tradeStatuses = [
    "All",
    "Active",
    "Pending",
    "Completed",
    "Suspended",
    "Cancelled",
  ];

  // --- Request modal handlers (unchanged) ---
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      title: "",
      description: "",
      category: "",
      tradeType: "Export Data",
      regions: [],
      budget: "",
      deadline: "",
      specifications: "",
      priorityLevel: "Medium",
    });
  };
  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };
  const handleRegionToggle = (region) => {
    setForm({
      ...form,
      regions: form.regions.includes(region)
        ? form.regions.filter((r) => r !== region)
        : [...form.regions, region],
    });
  };
  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.budget || !form.deadline) {
      alert("Please fill in all required fields");
      return;
    }
    const newRequest = {
      id: `tr_${Date.now()}`,
      ...form,
      userId: userId ?? "user-1",
      userName:
        authUser?.full_name || authUser?.name || authUser?.username || "You",
      status: "PENDING",
      createdAt: new Date(),
      proposals: [],
    };
    const existingRequests = JSON.parse(
      sessionStorage.getItem("tradeRequests") || "[]",
    );
    existingRequests.push(newRequest);
    sessionStorage.setItem("tradeRequests", JSON.stringify(existingRequests));
    alert(
      "Trade request created successfully! You will receive proposals from trade data providers.",
    );
    handleCloseModal();
  };

  return (
    <PageLayout>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-gray)",
          py: 4,
          position: "relative",
        }}
      >
        <Container maxWidth="xl">
          <Box ref={tradesTopRef} sx={{ position: "relative", width: "100%" }}>
            {/* Header Section */}
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
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <Globe size={28} color="var(--text-dark)" strokeWidth={2.5} />
                  <Typography
                    sx={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: "var(--text-dark)",
                    }}
                  >
                    Global Trade Marketplace
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: "var(--text-muted)",
                    fontSize: "1rem",
                    maxWidth: "600px",
                  }}
                >
                  Explore comprehensive trade and commerce datasets covering
                  global market trends, import/export data, and international
                  business intelligence.
                </Typography>
              </Box>
              <Box
                onClick={handleOpenModal}
                sx={{
                  px: 2.5,
                  py: 1.2,
                  backgroundColor: PRIMARY_COLOR,
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  "&:hover": { backgroundColor: "rgba(32, 178, 170, 0.85)" },
                  transition: "all 0.3s ease",
                }}
              >
                <Plus size={16} color="#fff" />
                <Typography
                  sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}
                >
                  Request Custom Trade Data
                </Typography>
              </Box>
            </Box>

            {/* Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: { xs: "stretch", lg: "center" },
                justifyContent: "space-between",
                mb: 4,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <BarChart3
                  size={24}
                  color="var(--text-dark)"
                  strokeWidth={2.5}
                />
                <Typography
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-dark)",
                  }}
                >
                  Trade Datasets
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}>
                  <TextField
                    fullWidth
                    placeholder="Search trade datasets, markets, partners..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    sx={{
                      backgroundColor: "var(--bg-white)",
                      borderRadius: "10px",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        height: 44,
                        fontSize: "0.95rem",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} color="var(--text-dark)" />
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
                    color: PRIMARY_COLOR,
                    cursor: "pointer",
                    px: 1.2,
                    py: 0.7,
                    height: 44,
                    borderRadius: "8px",
                    border: `1px solid var(--border-color)`,
                    backgroundColor: "var(--card-bg)",
                    flexShrink: 0,
                    "&:hover": { backgroundColor: `${PRIMARY_COLOR}10` },
                  }}
                >
                  <SlidersHorizontal size={16} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Filter
                  </Typography>
                </Box>

                {/* Sorting Dropdown */}
                <Select
                  value={appliedFilters.sortBy}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters((p) => ({ ...p, sortBy: val }));
                    setAppliedFilters((p) => ({ ...p, sortBy: val }));
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.8,
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: `1px solid var(--border-color)`,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-dark)",
                    transition: "all 0.2s",
                    minWidth: "140px",
                    height: 40,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover": {
                      backgroundColor: "var(--hover-bg)",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "var(--text-muted)",
                    },
                  }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                {/* View Toggle */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "8px",
                    padding: "4px",
                    border: `1px solid var(--border-color)`,
                  }}
                >
                  <Box
                    onClick={() => setViewType("grid")}
                    sx={{
                      p: 0.8,
                      borderRadius: "6px",
                      backgroundColor:
                        viewType === "grid"
                          ? `${PRIMARY_COLOR}15`
                          : "transparent",
                      border:
                        viewType === "grid"
                          ? `1px solid ${PRIMARY_COLOR}`
                          : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: `${PRIMARY_COLOR}10`,
                      },
                    }}
                    title="Grid View"
                  >
                    <Grid3x3
                      size={18}
                      color={
                        viewType === "grid"
                          ? PRIMARY_COLOR
                          : "var(--text-muted)"
                      }
                    />
                  </Box>
                  <Box
                    onClick={() => setViewType("list")}
                    sx={{
                      p: 0.8,
                      borderRadius: "6px",
                      backgroundColor:
                        viewType === "list"
                          ? `${PRIMARY_COLOR}15`
                          : "transparent",
                      border:
                        viewType === "list"
                          ? `1px solid ${PRIMARY_COLOR}`
                          : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: `${PRIMARY_COLOR}10`,
                      },
                    }}
                    title="List View"
                  >
                    <List
                      size={18}
                      color={
                        viewType === "list"
                          ? PRIMARY_COLOR
                          : "var(--text-muted)"
                      }
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Category chips row (dynamic from API) */}
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
                        selectedCategory === cat
                          ? PRIMARY_COLOR
                          : "var(--card-bg)",
                      color:
                        selectedCategory === cat ? "#fff" : "var(--text-dark)",
                      borderColor: "var(--border-color)",
                      flexShrink: 0,
                      "&:hover": {
                        backgroundColor:
                          selectedCategory === cat
                            ? PRIMARY_COLOR
                            : "var(--hover-bg)",
                      },
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Trade Cards Grid/List */}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={36} sx={{ color: PRIMARY_COLOR }} />
              </Box>
            )}
            {!loading && error && (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ color: "#f87171", fontWeight: 600, mb: 1 }}>
                  Failed to load trade data
                </Typography>
                <Typography
                  sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {error}
                </Typography>
                <Box
                  onClick={() => {
                    setPage(1);
                    setTrades([]);
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
                          }
                        : undefined,
                    flexDirection: viewType === "list" ? "column" : undefined,
                    gap: 3,
                  }}
                >
                  {trades.length > 0 ? (
                    trades.map((trade) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        viewType={viewType}
                        PRIMARY_COLOR={PRIMARY_COLOR}
                      />
                    ))
                  ) : (
                    <Box
                      sx={{
                        gridColumn: viewType === "grid" ? "1 / -1" : undefined,
                        textAlign: "center",
                        py: 6,
                        width: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        No trade datasets found
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Load More trigger */}
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
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: `2px solid ${PRIMARY_COLOR}`,
                          "&:hover": {
                            filter: "brightness(0.95)",
                            transform: "translateY(-2px)",
                            boxShadow: `0 6px 16px ${PRIMARY_COLOR}33`,
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
      </Box>

      {/* Trade Request Modal (unchanged) */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: "rgba(17, 24, 39, 0.7)" },
        }}
      >
        <Fade in={isModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", sm: 650, md: 750 },
              bgcolor: "var(--card-bg)",
              borderRadius: 3,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              p: 0,
              overflow: "hidden",
              outline: "none",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                backgroundColor: themeColors.isDarkMode
                  ? "rgba(30, 41, 59, 0.5)"
                  : "#f9fafb",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    backgroundColor: `${PRIMARY_COLOR}20`,
                    borderRadius: 1.5,
                    display: "flex",
                  }}
                >
                  <Plus size={20} color={PRIMARY_COLOR} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "var(--text-dark)",
                    }}
                  >
                    Request Custom Trade Data
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Get specialized trade datasets tailored to your business
                    requirements
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseModal}
                size="small"
                sx={{
                  color: themeColors.textMuted,
                  "&:hover": {
                    color: "var(--text-dark)",
                    backgroundColor: themeColors.hoverBg,
                  },
                }}
              >
                <X size={20} />
              </IconButton>
            </Box>

            <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
              {/* Section 1: Trade Request Overview */}
              <Box sx={{ mb: 3.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: PRIMARY_COLOR,
                    mb: 2.5,
                    borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    pb: 1,
                  }}
                >
                  📋 Request Details
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Request Title *
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. Southeast Asian Export Data"
                      value={form.title}
                      onChange={handleInputChange("title")}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Category *
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      value={form.category}
                      onChange={handleInputChange("category")}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    >
                      {tradeCategories
                        .filter((c) => c !== "All Categories")
                        .map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Box>
                </Box>

                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--text-dark)",
                      mb: 0.8,
                    }}
                  >
                    Description *
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Describe the trade data you need, products/services, trading partners, time period..."
                    value={form.description}
                    onChange={handleInputChange("description")}
                    required
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
              </Box>

              {/* Section 2: Trade Specifications */}
              <Box sx={{ mb: 3.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: PRIMARY_COLOR,
                    mb: 2.5,
                    borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    pb: 1,
                  }}
                >
                  🌍 Trade Scope
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2.5,
                    mb: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Trade Type *
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      value={form.tradeType}
                      onChange={handleInputChange("tradeType")}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    >
                      <MenuItem value="Export Data">Export Data</MenuItem>
                      <MenuItem value="Import Data">Import Data</MenuItem>
                      <MenuItem value="Trade Routes">Trade Routes</MenuItem>
                      <MenuItem value="Tariff Analysis">
                        Tariff Analysis
                      </MenuItem>
                      <MenuItem value="Market Entry">
                        Market Entry Data
                      </MenuItem>
                    </TextField>
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Additional Specifications
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. HS codes, product types, timeframe"
                      value={form.specifications}
                      onChange={handleInputChange("specifications")}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--text-dark)",
                      mb: 1.2,
                    }}
                  >
                    Target Regions (Optional)
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {tradeRegions
                      .filter((r) => r !== "All Regions")
                      .map((region) => (
                        <Chip
                          key={region}
                          label={region}
                          onClick={() => handleRegionToggle(region)}
                          variant={
                            form.regions.includes(region)
                              ? "filled"
                              : "outlined"
                          }
                          sx={{
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                            height: 30,
                            backgroundColor: form.regions.includes(region)
                              ? PRIMARY_COLOR
                              : "var(--card-bg)",
                            color: form.regions.includes(region)
                              ? "#fff"
                              : "var(--text-dark)",
                            borderColor: "var(--border-color)",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: form.regions.includes(region)
                                ? PRIMARY_COLOR
                                : "var(--bg-secondary)",
                            },
                          }}
                        />
                      ))}
                  </Box>
                </Box>
              </Box>

              {/* Section 3: Budget & Timeline */}
              <Box sx={{ mb: 3.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: PRIMARY_COLOR,
                    mb: 2.5,
                    borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    pb: 1,
                  }}
                >
                  💼 Budget & Timeline
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Budget (USD) *
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. 3000"
                      type="number"
                      value={form.budget}
                      onChange={handleInputChange("budget")}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        mb: 0.8,
                      }}
                    >
                      Deadline *
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={form.deadline}
                      onChange={handleInputChange("deadline")}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Section 4: Priority */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: PRIMARY_COLOR,
                    mb: 2.5,
                    borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    pb: 1,
                  }}
                >
                  ⚡ Priority
                </Typography>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--text-dark)",
                      mb: 0.8,
                    }}
                  >
                    Priority Level
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={form.priorityLevel}
                    onChange={handleInputChange("priorityLevel")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </TextField>
                </Box>
              </Box>
            </Box>

            {/* Modal Footer */}
            <Box
              sx={{
                p: 2.5,
                backgroundColor: themeColors.isDarkMode
                  ? "rgba(30, 41, 59, 0.5)"
                  : "#f9fafb",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={handleCloseModal}
                sx={{
                  px: 3,
                  py: 1,
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={
                  !form.title ||
                  !form.category ||
                  !form.budget ||
                  !form.deadline
                }
                sx={{
                  px: 4,
                  py: 1,
                  backgroundColor: PRIMARY_COLOR,
                  "&:hover": { backgroundColor: "rgba(32, 178, 170, 0.85)" },
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "none",
                  borderRadius: 2,
                }}
              >
                Submit Trade Request
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Filters Panel */}
      <TradeFiltersPanel
        isOpen={isFiltersPanelOpen}
        onClose={() => setIsFiltersPanelOpen(false)}
        selectedRegion={selectedRegion}
        selectedCountry={selectedCountry}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        onRegionChange={setSelectedRegion}
        onCountryChange={setSelectedCountry}
        onCategoryChange={setSelectedCategory}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
        onClear={handleClearTradeFilters}
        categories={categoryOptions}
        tradeTypes={tradeTypes}
        tradeStatuses={tradeStatuses}
        regions={tradeRegions}
      />

      {/* Back to top button */}
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
            backgroundColor: PRIMARY_COLOR,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1300,
            boxShadow: `0 10px 24px ${PRIMARY_COLOR}44`,
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            animation: "floatPulse 2.1s ease-in-out infinite",
            "@keyframes floatPulse": {
              "0%": { transform: "translateY(0)" },
              "50%": { transform: "translateY(-4px)" },
              "100%": { transform: "translateY(0)" },
            },
            "&:hover": {
              transform: "translateY(-3px) scale(1.06)",
              boxShadow: `0 14px 30px ${PRIMARY_COLOR}55`,
            },
          }}
        >
          <ChevronUp size={22} />
        </Box>
      </Zoom>
    </PageLayout>
  );
}

// Helper: trade categories list for modal (same as before)
const tradeCategories = [
  "All Categories",
  "Export Markets",
  "Import Data",
  "Trade Compliance",
  "Market Analysis",
  "Trade Statistics",
  "Commerce Trends",
];

// ----------------------------------------------------------------------
// TradeCard Component (supports grid & list)
// ----------------------------------------------------------------------
function TradeCard({ trade, viewType, PRIMARY_COLOR }) {
  const navigate = useNavigate();

  // Map API fields to display
  const category = trade.category_name || trade.sector || trade.type || "Trade";
  const route = trade.partner
    ? `${trade.country || "?"} ↔ ${trade.partner}`
    : trade.country || "Global";
  const value = formatCurrency(trade.value, trade.currency);
  const growth =
    trade.growth != null
      ? `${trade.growth >= 0 ? "+" : ""}${trade.growth}%`
      : "—";
  const volume = trade.volume || "—";
  const transport = trade.transport || "—";
  const period =
    trade.start_date && trade.end_date
      ? `${new Date(trade.start_date).toLocaleDateString()} – ${new Date(trade.end_date).toLocaleDateString()}`
      : trade.updated
        ? `Updated ${new Date(trade.updated).toLocaleDateString()}`
        : "—";
  const status = trade.status || "Active";
  const tags = trade.tags || [];
  const image = FALLBACK_IMAGE; // API does not provide image; use fallback

  const handleOpenTrade = () => {
    navigate(`/trade/${trade.id}`, { state: { trade } });
  };

  // List view layout
  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          padding: 2,
          backgroundColor: "var(--card-bg)",
          border: `1px solid var(--border-color)`,
          borderRadius: "12px",
          transition: "all 0.25s ease",
          alignItems: "stretch",
          "&:hover": {
            boxShadow: "0 10px 24px rgba(97,197,195,0.12)",
            borderColor: PRIMARY_COLOR,
          },
        }}
      >
        <Box
          sx={{
            width: 132,
            minWidth: 132,
            borderRadius: "10px",
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={handleOpenTrade}
        >
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 42,
              height: 42,
              borderRadius: "12px",
              backgroundColor: "rgba(239, 246, 255, 0.88)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUpRight size={18} color="#3f6212" />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1.2,
              }}
            >
              <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap" }}>
                <Chip
                  label={category}
                  size="small"
                  sx={{
                    height: 30,
                    borderRadius: "10px",
                    backgroundColor: "#ecf5dc",
                    color: "#3f6212",
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={trade.region || "Global"}
                  size="small"
                  sx={{
                    height: 30,
                    borderRadius: "10px",
                    backgroundColor: "#eef2ff",
                    color: "#4f46e5",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>

            <Typography
              onClick={handleOpenTrade}
              sx={{
                mt: 1.25,
                fontSize: "1.02rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                lineHeight: 1.35,
                cursor: "pointer",
                transition: "color 0.2s ease",
                "&:hover": { color: PRIMARY_COLOR },
              }}
            >
              {trade.title}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: 0.8,
                color: "var(--text-muted)",
                fontSize: "0.82rem",
              }}
            >
              <Globe size={14} />
              <Typography sx={{ fontSize: "inherit" }}>{route}</Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                mt: 1.3,
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: "0.74rem", color: "var(--text-muted)" }}
                >
                  Trade Value
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1.08rem",
                    fontWeight: 700,
                    color: "#3f6212",
                  }}
                >
                  {value}
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                <Typography
                  sx={{ fontSize: "0.74rem", color: "var(--text-muted)" }}
                >
                  YoY Growth
                </Typography>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.35,
                    color: "#3f6212",
                  }}
                >
                  <TrendingUp size={14} />
                  <Typography
                    sx={{ fontSize: "1rem", fontWeight: 700, color: "inherit" }}
                  >
                    {growth}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                mt: 1.3,
              }}
            >
              {[
                { label: "Volume", value: volume, color: "var(--text-dark)" },
                { label: "Transport", value: transport, color: "#4f46e5" },
                { label: "Period", value: period, color: "var(--text-dark)" },
              ].map((item) => (
                <Box key={item.label} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize: item.label === "Period" ? "0.82rem" : "0.9rem",
                      fontWeight: 600,
                      color: item.color,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap", mt: 1.25 }}>
              {tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  icon={<Globe size={12} />}
                  label={tag}
                  size="small"
                  sx={{
                    height: 28,
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-dark)",
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mt: 1.4,
              pt: 1.2,
              borderTop: `1px solid var(--border-color)`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                color: "var(--text-muted)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.45,
                  color: status === "Active" ? "#3f6212" : "var(--text-muted)",
                }}
              >
                <Globe size={14} />
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "inherit",
                  }}
                >
                  {status}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <Calendar size={14} />
                <Typography sx={{ fontSize: "0.82rem" }}>
                  {trade.updated_at
                    ? new Date(trade.updated_at).toLocaleDateString()
                    : "—"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Grid view layout
  return (
    <Card
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "var(--card-bg)",
        border: `1px solid var(--border-color)`,
        boxShadow: "none",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 10px 24px rgba(97, 197, 195, 0.12)",
          borderColor: PRIMARY_COLOR,
        },
      }}
    >
      <Box
        sx={{
          height: 132,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 44,
            height: 44,
            borderRadius: "14px",
            backgroundColor: "rgba(239, 246, 255, 0.88)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowUpRight size={18} color="#3f6212" />
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 0.6,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: "calc(100% - 64px)",
          }}
        >
          <Chip
            label={category}
            size="small"
            sx={{
              height: 30,
              borderRadius: "10px",
              backgroundColor: "rgba(236, 245, 220, 0.96)",
              color: "#3f6212",
              fontWeight: 600,
            }}
          />
          <Chip
            label={trade.region || "Global"}
            size="small"
            sx={{
              height: 30,
              borderRadius: "10px",
              backgroundColor: "rgba(238, 242, 255, 0.96)",
              color: "#4f46e5",
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      <CardContent
        sx={{ p: 2.2, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Typography
          onClick={handleOpenTrade}
          sx={{
            fontSize: "0.96rem",
            fontWeight: 700,
            color: "var(--text-dark)",
            lineHeight: 1.35,
            cursor: "pointer",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
            "&:hover": { color: PRIMARY_COLOR },
          }}
        >
          {trade.title}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.9,
            color: "var(--text-muted)",
          }}
        >
          <Globe size={14} />
          <Typography sx={{ fontSize: "0.82rem" }}>{route}</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: "0.74rem", color: "var(--text-muted)" }}
            >
              Trade Value
            </Typography>
            <Typography
              sx={{ fontSize: "1rem", fontWeight: 700, color: "#3f6212" }}
            >
              {value}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              sx={{ fontSize: "0.74rem", color: "var(--text-muted)" }}
            >
              YoY Growth
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.35,
                color: "#3f6212",
              }}
            >
              <TrendingUp size={14} />
              <Typography
                sx={{ fontSize: "0.96rem", fontWeight: 700, color: "inherit" }}
              >
                {growth}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 1,
            mt: 1.4,
          }}
        >
          {[
            { label: "Volume", value: volume, color: "var(--text-dark)" },
            { label: "Transport", value: transport, color: "#4f46e5" },
            { label: "Period", value: period, color: "var(--text-dark)" },
          ].map((item) => (
            <Box key={item.label} sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
              >
                {item.label}
              </Typography>
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: item.label === "Period" ? "0.8rem" : "0.9rem",
                  fontWeight: 600,
                  color: item.color,
                  lineHeight: 1.3,
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap", mt: 1.35 }}>
          {tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              icon={<Globe size={12} />}
              label={tag}
              size="small"
              sx={{
                height: 28,
                borderRadius: "10px",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-dark)",
              }}
            />
          ))}
        </Box>

        <Box
          sx={{
            mt: "auto",
            pt: 1.5,
            borderTop: `1px solid var(--border-color)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "var(--text-muted)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                color: status === "Active" ? "#3f6212" : "var(--text-muted)",
              }}
            >
              <Globe size={14} />
              <Typography
                sx={{ fontSize: "0.86rem", fontWeight: 700, color: "inherit" }}
              >
                {status}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <Calendar size={14} />
              <Typography sx={{ fontSize: "0.8rem" }}>
                {trade.updated_at
                  ? new Date(trade.updated_at).toLocaleDateString()
                  : "—"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

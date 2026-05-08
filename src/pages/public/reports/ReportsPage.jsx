import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  Select,
  Modal,
  Fade,
  Backdrop,
  MenuItem,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  FileIcon,
  HardDrive,
  Download,
  SlidersHorizontal,
  ArrowUpRight,
  Plus,
  X,
  Grid3x3,
  List,
  CheckCircle,
  BookOpen,
  Eye,
  Users,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import ReportsFiltersPanel from "../components/ReportsFiltersPanel";
import { useThemeColors } from "../../../utils/useThemeColors";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const PAGE_SIZE = 12;

// Helper: format currency
function formatCurrency(amount, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper: compact number
function fmtCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// Auth helpers
const getToken = () =>
  localStorage.getItem("dali-token") || sessionStorage.getItem("dali-token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Build query string for /public-reports/
function buildReportQuery({
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
  if (selectedCategory && selectedCategory !== "All")
    params.set("category_name", selectedCategory);
  if (selectedType && selectedType !== "All Types")
    params.set("report_type", selectedType.toLowerCase());

  return params.toString();
}

// Fetch reports from API
async function fetchReports(queryString) {
  const res = await fetch(`${API_BASE}/public-reports/?${queryString}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json; // { total, page, page_size, total_pages, has_next, has_prev, data }
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const themeColors = useThemeColors();
  const PRIMARY = themeColors.teal || "#61C5C3";

  // --- State (API data) ---
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Filters & UI state ---
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [viewType, setViewType] = useState("grid");
  const [sortBy, setSortBy] = useState("created_at");
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    budget: "",
    priority: "Medium",
  });

  // Derived: category options from fetched reports
  const [categoryOptions, setCategoryOptions] = useState(["All"]);
  const [reportTypes, setReportTypes] = useState(["All Types"]);

  // Extract unique categories and types from fetched data
  useEffect(() => {
    if (reports.length > 0) {
      const cats = new Set(reports.map((r) => r.category_name).filter(Boolean));
      setCategoryOptions(["All", ...Array.from(cats)]);
      const types = new Set(reports.map((r) => r.report_type).filter(Boolean));
      setReportTypes(["All Types", ...Array.from(types)]);
    }
  }, [reports]);

  // --- Filters state (for sorting) ---
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const loadMoreRef = useRef(null);
  const reportsTopRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // --- Debounced search ---
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setReports([]);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // --- Reset page when filters/region/category/type change ---
  useEffect(() => {
    setPage(1);
    setReports([]);
  }, [
    appliedFilters,
    selectedRegion,
    selectedCategory,
    selectedType,
    selectedCountry,
  ]);

  // --- Fetch reports (with pagination) ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = buildReportQuery({
          search,
          selectedCategory,
          selectedType,
          selectedRegion,
          selectedCountry,
          filters: appliedFilters,
          page,
        });
        const result = await fetchReports(qs);
        if (!cancelled) {
          setReports((prev) =>
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
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 380);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleBackToTop = () => {
    reportsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    }) ?? window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Stats (derived from API totals) ---
  const reportStats = [
    {
      label: "Published Reports",
      value: fmtCount(total),
      change: "",
      icon: <FileText size={22} color={PRIMARY} />,
    },
    {
      label: "Total Views",
      value: fmtCount(
        reports.reduce((sum, r) => sum + (r.total_views || 0), 0),
      ),
      change: "",
      icon: <Eye size={22} color={PRIMARY} />,
    },
    {
      label: "Total Downloads",
      value: fmtCount(
        reports.reduce((sum, r) => sum + (r.total_downloads || 0), 0),
      ),
      change: "",
      icon: <Download size={22} color={PRIMARY} />,
    },
    {
      label: "Contributors",
      value: fmtCount(
        new Set(reports.map((r) => r.owner_user_name).filter(Boolean)).size,
      ),
      change: "",
      icon: <Users size={22} color={PRIMARY} />,
    },
  ];

  const sortOptions = [
    { value: "created_at", label: "Newest" },
    { value: "updated_at", label: "Recently Updated" },
    { value: "title", label: "Title" },
    { value: "total_views", label: "Most Viewed" },
    { value: "total_downloads", label: "Most Downloaded" },
    { value: "total_sales", label: "Most Sold" },
  ];

  // --- Filter handlers ---
  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSelectedType("All Types");
    setSelectedRegion("");
    setSelectedCountry("");
    setAppliedFilters({ ...filters });
  };

  // --- Modal handlers (unchanged) ---
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      title: "",
      description: "",
      deadline: "",
      budget: "",
      priority: "Medium",
    });
  };
  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };
  const handleSubmit = () => {
    if (!form.title || !form.description) return;
    // In a real app, you would submit to an API endpoint
    alert("Report request submitted (demo).");
    handleCloseModal();
  };

  return (
    <PageLayout>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-gray)",
          pt: 3,
          pb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Box
            ref={reportsTopRef}
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
                <FileText size={28} color={PRIMARY} />
                <Typography
                  sx={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                  }}
                >
                  Reports Marketplace
                </Typography>
              </Box>
              <Typography sx={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Discover and purchase premium analytical reports for business,
                policy, and research decisions.
              </Typography>
            </Box>

            <Box
              onClick={handleOpenModal}
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
                "&:hover": { opacity: 0.9 },
              }}
            >
              <Plus size={16} color="#fff" />
              <Typography
                sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}
              >
                Request Custom Report
              </Typography>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" },
              gap: 2,
              mb: 4,
            }}
          >
            {reportStats.map((s) => (
              <Card
                key={s.label}
                sx={{
                  borderRadius: 2,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          mb: 0.5,
                        }}
                      >
                        {s.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "1.6rem",
                          fontWeight: 800,
                          color: "var(--text-dark)",
                        }}
                      >
                        {s.value}
                      </Typography>
                      {s.change && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          <ArrowUpRight size={13} color="#16a34a" />
                          <Typography
                            sx={{
                              fontSize: "0.78rem",
                              color: "#16a34a",
                              fontWeight: 600,
                            }}
                          >
                            {s.change}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        backgroundColor: "rgba(97, 197, 195, 0.1)",
                      }}
                    >
                      {s.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Controls Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "stretch", lg: "center" },
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}>
                <TextField
                  fullWidth
                  placeholder="Search reports, topics, owners..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  variant="outlined"
                  sx={{
                    backgroundColor: "var(--card-bg)",
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
                        <Search size={18} color={themeColors.textMuted} />
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
                value={appliedFilters.sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((p) => ({ ...p, sortBy: val }));
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
                {sortOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
                padding: "4px",
                border: "1px solid var(--border-color)",
              }}
            >
              <Box
                onClick={() => setViewType("grid")}
                sx={{
                  p: 0.8,
                  borderRadius: "6px",
                  backgroundColor:
                    viewType === "grid" ? "var(--bg-secondary)" : "transparent",
                  border:
                    viewType === "grid"
                      ? "1px solid var(--border-color)"
                      : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { backgroundColor: "var(--hover-bg)" },
                }}
                title="Grid View"
              >
                <Grid3x3
                  size={18}
                  color={viewType === "grid" ? PRIMARY : themeColors.textMuted}
                />
              </Box>
              <Box
                onClick={() => setViewType("list")}
                sx={{
                  p: 0.8,
                  borderRadius: "6px",
                  backgroundColor:
                    viewType === "list" ? "var(--bg-secondary)" : "transparent",
                  border:
                    viewType === "list"
                      ? "1px solid var(--border-color)"
                      : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { backgroundColor: "var(--hover-bg)" },
                }}
                title="List View"
              >
                <List
                  size={18}
                  color={viewType === "list" ? PRIMARY : themeColors.textMuted}
                />
              </Box>
            </Box>
          </Box>

          {/* Category chips row (dynamic) */}
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

          {/* Reports Grid/List */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} sx={{ color: PRIMARY }} />
            </Box>
          )}
          {!loading && error && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ color: "#f87171", fontWeight: 600, mb: 1 }}>
                Failed to load reports
              </Typography>
              <Typography
                sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
              >
                {error}
              </Typography>
              <Box
                onClick={() => {
                  setPage(1);
                  setReports([]);
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
                      ? { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }
                      : undefined,
                  flexDirection: viewType === "list" ? "column" : undefined,
                  gap: 3,
                }}
              >
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      viewType={viewType}
                      onOpen={() =>
                        navigate(`/reports/${report.id}`, { state: { report } })
                      }
                      PRIMARY={PRIMARY}
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
                    <FileText
                      size={48}
                      color="var(--border-color)"
                      style={{ margin: "0 auto 16px" }}
                    />
                    <Typography sx={{ color: "var(--text-muted)" }}>
                      No reports found
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
        </Container>
      </Box>

      {/* Request Modal (unchanged) */}
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
              width: { xs: "90%", sm: 550 },
              bgcolor: "var(--card-bg)",
              borderRadius: 3,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              p: 0,
              overflow: "hidden",
              outline: "none",
            }}
          >
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
              <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>
                Request Custom Report
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <X size={20} />
              </IconButton>
            </Box>

            <Box
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              <TextField
                fullWidth
                label="Report Title / Topic"
                value={form.title}
                onChange={handleInputChange("title")}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detailed Requirements"
                value={form.description}
                onChange={handleInputChange("description")}
                required
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Budget (USD)"
                  type="number"
                  value={form.budget}
                  onChange={handleInputChange("budget")}
                />
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={form.priority}
                  onChange={handleInputChange("priority")}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </TextField>
              </Box>
              <TextField
                fullWidth
                label="Deadline"
                type="date"
                value={form.deadline}
                onChange={handleInputChange("deadline")}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={!form.title || !form.description}
                sx={{
                  mt: 1,
                  py: 1.5,
                  backgroundColor: PRIMARY,
                  "&:hover": { opacity: 0.9 },
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  boxShadow: "none",
                }}
              >
                Submit Request
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Filters Panel */}
      <ReportsFiltersPanel
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
        reportTypes={reportTypes}
      />

      {/* Back to top button */}
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
    </PageLayout>
  );
}

// ----------------------------------------------------------------------
// ReportCard Component (supports grid & list)
// ----------------------------------------------------------------------
function ReportCard({ report, viewType, onOpen, PRIMARY }) {
  // Extract first active pricing
  let priceInfo = null;
  if (report.pricing && report.pricing.length > 0) {
    const activePricing =
      report.pricing.find((p) => p.is_active) || report.pricing[0];
    if (activePricing) {
      priceInfo = {
        price: activePricing.price,
        currency: activePricing.currency,
        license: activePricing.license_type,
      };
    }
  }

  const priceLabel = priceInfo
    ? formatCurrency(priceInfo.price, priceInfo.currency)
    : "Contact for price";
  const licenseLabel = priceInfo?.license || report.license_type || "Standard";

  // File info from first resource (if any)
  let fileLabel = report.file_format || "File";
  let sizeLabel = "—";
  let downloadsLabel = fmtCount(report.total_downloads);
  if (report.resources && report.resources.length > 0) {
    const firstResource = report.resources[0];
    fileLabel = firstResource.resource_type || fileLabel;
    sizeLabel = firstResource.file_size_human || sizeLabel;
  }

  const relativeTime = report.updated_at
    ? new Date(report.updated_at).toLocaleDateString()
    : "—";
  const author = report.owner_user_name || report.author || "Unknown";
  const category = report.category_name || report.report_type || "Report";
  const country = report.country || "—";
  const thumbnail =
    report.thumbnail ||
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";
  const tags = report.tags || [];

  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 2,
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          transition: "all 0.25s ease",
          alignItems: "stretch",
          "&:hover": {
            boxShadow: "0 10px 24px rgba(97,197,195,0.12)",
            borderColor: PRIMARY,
          },
        }}
      >
        <Box
          sx={{
            width: 132,
            height: 96,
            borderRadius: "10px",
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        />

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
            <Typography
              onClick={onOpen}
              sx={{
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "var(--text-dark)",
                lineHeight: 1.35,
                cursor: "pointer",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                transition: "color 0.2s ease",
                "&:hover": { color: PRIMARY },
              }}
            >
              {report.title}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                mt: 0.6,
                color: "var(--text-muted)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <MapPin size={13} color={PRIMARY} />
                <Typography sx={{ fontSize: "0.78rem" }}>{country}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <Calendar size={13} color={PRIMARY} />
                <Typography sx={{ fontSize: "0.78rem" }}>
                  {relativeTime}
                </Typography>
              </Box>
            </Box>

            {report.summary && (
              <Typography
                sx={{
                  mt: 0.8,
                  fontSize: "0.74rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {report.summary}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
                color: "var(--text-muted)",
                fontSize: "0.76rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <FileIcon size={12} color={PRIMARY} />
                <Typography sx={{ fontSize: "inherit" }}>
                  {fileLabel}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "var(--border-color)",
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <HardDrive size={12} color={PRIMARY} />
                <Typography sx={{ fontSize: "inherit" }}>
                  {sizeLabel}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "var(--border-color)",
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <Download size={12} color={PRIMARY} />
                <Typography sx={{ fontSize: "inherit" }}>
                  {downloadsLabel}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{ mt: 1, pt: 1, borderTop: "1px solid var(--border-color)" }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mt: 1.2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.55,
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              <CheckCircle size={14} color={PRIMARY} />
              <Typography sx={{ fontSize: "inherit", fontWeight: 600 }}>
                {licenseLabel}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.1,
                py: 0.45,
                borderRadius: 1,
                backgroundColor: `${PRIMARY}14`,
                color: PRIMARY,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {priceLabel}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Grid view
  return (
    <Card
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        boxShadow: "none",
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 24px rgba(97,197,195,0.12)",
          borderColor: PRIMARY,
        },
      }}
    >
      <Box
        sx={{
          height: 132,
          backgroundImage: `url(${thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      />

      <CardContent sx={{ p: 2 }}>
        <Typography
          onClick={onOpen}
          sx={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--text-dark)",
            lineHeight: 1.4,
            cursor: "pointer",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
            "&:hover": { color: PRIMARY },
          }}
        >
          {report.title}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.1,
            color: "var(--text-muted)",
            mb: 0.8,
            mt: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
            <MapPin size={13} color={PRIMARY} />
            <Typography sx={{ fontSize: "0.75rem" }}>{country}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
            <Calendar size={13} color={PRIMARY} />
            <Typography sx={{ fontSize: "0.75rem" }}>{relativeTime}</Typography>
          </Box>
        </Box>

        {report.summary && (
          <Typography
            sx={{
              mb: 1.2,
              fontSize: "0.74rem",
              color: "var(--text-muted)",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {report.summary}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.9,
            flexWrap: "nowrap",
            mb: 1.5,
            pb: 1.5,
            borderBottom: "1px solid var(--border-color)",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {[
            { icon: <FileIcon size={12} color={PRIMARY} />, label: fileLabel },
            { icon: <HardDrive size={12} color={PRIMARY} />, label: sizeLabel },
            {
              icon: <Download size={12} color={PRIMARY} />,
              label: downloadsLabel,
            },
          ].map((item, i) => (
            <Box
              key={i}
              sx={{ display: "flex", alignItems: "center", minWidth: 0 }}
            >
              {i > 0 && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "var(--border-color)",
                    flexShrink: 0,
                    mr: 0.8,
                  }}
                />
              )}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  minWidth: 0,
                }}
              >
                {item.icon}
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1,
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.55,
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <CheckCircle size={14} color={PRIMARY} />
            <span style={{ fontWeight: 600 }}>{licenseLabel}</span>
          </Box>
          <Box
            sx={{
              px: 1.1,
              py: 0.45,
              borderRadius: 1,
              backgroundColor: `${PRIMARY}14`,
              color: PRIMARY,
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            {priceLabel}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

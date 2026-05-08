import { useEffect, useMemo, useRef, useState } from "react";
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
  LinearProgress,
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
  FolderOpen,
  ChevronUp,
  Calendar,
  MapPin,
  FileIcon,
  HardDrive,
  Download,
  Users,
  GitFork,
  Star,
  Clock,
  CheckCircle,
  Play,
  SlidersHorizontal,
  TrendingUp,
  ArrowUpRight,
  Plus,
  X,
  Grid3x3,
  List,
} from "lucide-react";
import ProjectFiltersPanel from "../components/ProjectFiltersPanel";
import PageLayout from "../components/PageLayout";
import { useThemeColors } from "../../../utils/useThemeColors";
import { useAuth } from "../../../context/AuthContext";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const PAGE_SIZE = 12;

const statusColors = {
  Active: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Planning: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Completed: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "On Hold": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Cancelled: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  Submitted: { bg: "#e0f2fe", color: "#0284c7", border: "#bae6fd" },
};

const CURRENT_COUNTRY = { name: "Tanzania", flag: "🇹🇿" };

// Helper: time ago
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

// Build query string for /public-projects/
function buildProjectQuery({
  search,
  selectedCategory,
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

  if (filters.region) params.set("region", filters.region);
  if (filters.country) params.set("country", filters.country);
  if (filters.type) params.set("type", filters.type);
  if (selectedStatus && selectedStatus !== "All")
    params.set("status", selectedStatus);
  if (filters.priority && filters.priority !== "All")
    params.set("priority", filters.priority);

  // Category from the single-line chip selection
  if (selectedCategory && selectedCategory !== "All")
    params.set("category_name", selectedCategory);

  return params.toString();
}

// Fetch projects from API
async function fetchProjects(queryString) {
  const res = await fetch(`${API_BASE}/public-projects/?${queryString}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json; // { total, page, page_size, total_pages, has_next, has_prev, data }
}

export default function ProjectPage() {
  const navigate = useNavigate();
  const { authUser, userId } = useAuth();
  const themeColors = useThemeColors();
  const PRIMARY = themeColors.teal || "#61C5C3";
  const SECONDARY = themeColors.teal;

  // --- State ---
  const [categoryOptions, setCategoryOptions] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewType, setViewType] = useState("grid");
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    region: "",
    country: "",
    type: "",
    priority: "All",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal state (custom project request)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    dataType: "CSV",
    datasetSize: "1-10GB",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    preferredCollaborator: "",
    openToSuggestions: true,
    priorityLevel: "Medium",
    sourcePreference: "",
    attachmentUrl: "",
  });

  const loadMoreRef = useRef(null);
  const projectsTopRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // --- Load categories (for the chips row) ---
  useEffect(() => {
    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/categories/with-dataset-categories`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );
        if (!response.ok) throw new Error(`Failed: ${response.status}`);
        const payload = await response.json();
        const names = Array.isArray(payload)
          ? payload.map((item) => item?.name).filter(Boolean)
          : [];
        setCategoryOptions(["All", ...names.slice(0, 6)]);
      } catch (error) {
        if (error.name === "AbortError") return;
        setCategoryOptions(["All"]);
      }
    };
    loadCategories();
    return () => controller.abort();
  }, []);

  // --- Debounced search ---
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setProjects([]);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // --- Reset page when filters or category/status change ---
  useEffect(() => {
    setPage(1);
    setProjects([]);
  }, [appliedFilters, selectedCategory, selectedStatus]);

  // --- Fetch projects (with pagination) ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const qs = buildProjectQuery({
          search,
          selectedCategory,
          selectedStatus,
          filters: appliedFilters,
          page,
        });
        const result = await fetchProjects(qs);
        if (!cancelled) {
          setProjects((prev) =>
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
  }, [page, appliedFilters, selectedCategory, selectedStatus, search]);

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
    projectsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    }) ?? window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Derived stats ---
  const projectStats = [
    {
      label: "Total Projects",
      value: total,
      change: "",
      icon: <FolderOpen size={22} color={PRIMARY} />,
    },
    {
      label: "Active",
      value: projects.filter((p) => p.status === "Active").length,
      change: "",
      icon: <TrendingUp size={22} color={PRIMARY} />,
    },
    {
      label: "Planning",
      value: projects.filter((p) => p.status === "Planning").length,
      change: "",
      icon: <Users size={22} color={PRIMARY} />,
    },
    {
      label: "Completed",
      value: projects.filter((p) => p.status === "Completed").length,
      change: "",
      icon: <CheckCircle size={22} color={PRIMARY} />,
    },
  ];

  const sortOptions = [
    { value: "created_at", label: "Newest" },
    { value: "updated_at", label: "Recently Updated" },
    { value: "title", label: "Title" },
    { value: "priority", label: "Priority" },
    { value: "progress", label: "Progress" },
  ];
  const statuses = [
    "All",
    "Active",
    "Planning",
    "On Hold",
    "Completed",
    "Cancelled",
    "Submitted",
  ];

  // --- Filter handlers ---
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setIsFiltersPanelOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: "",
      region: "",
      country: "",
      type: "",
      priority: "All",
      sortBy: "created_at",
      sortOrder: "desc",
    };
    setSearch("");
    setFilters(cleared);
    setAppliedFilters(cleared);
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  // --- Modal handlers ---
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      title: "",
      description: "",
      category: "",
      dataType: "CSV",
      datasetSize: "1-10GB",
      budgetMin: "",
      budgetMax: "",
      deadline: "",
      preferredCollaborator: "",
      openToSuggestions: true,
      priorityLevel: "Medium",
      sourcePreference: "",
      attachmentUrl: "",
    });
  };
  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };
  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.category ||
      !form.budgetMin ||
      !form.budgetMax ||
      !form.deadline
    ) {
      alert("Please fill in all required fields");
      return;
    }
    const newRequest = {
      id: `pr_${Date.now()}`,
      ...form,
      buyerId: userId ?? "4",
      buyerName:
        authUser?.full_name || authUser?.name || authUser?.username || "You",
      status: "PENDING",
      createdAt: new Date(),
      bids: [],
    };
    const existingRequests = JSON.parse(
      sessionStorage.getItem("projectRequests") || "[]",
    );
    existingRequests.push(newRequest);
    sessionStorage.setItem("projectRequests", JSON.stringify(existingRequests));
    alert("Request created successfully! Redirecting to buyer dashboard...");
    handleCloseModal();
    navigate("/dashboard/buyer/requests");
  };

  // --- Open project detail (if you have a detail page) ---
  const handleOpenProject = (project) => {
    navigate(`/projects/${project.id}`, { state: { project } });
  };

  return (
    <PageLayout>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-gray)",
          pt: 1.5,
          pb: 4,
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
                <FolderOpen size={28} color={PRIMARY} />
                <Typography
                  sx={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                  }}
                >
                  Projects for {CURRENT_COUNTRY.flag} {CURRENT_COUNTRY.name}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  mt: 0.5,
                }}
              >
                Get access to {CURRENT_COUNTRY.name}&rsquo;s top-rated dataset
                projects. Collaborate, invest, and build with local and regional
                expert teams.
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
                Request Custom Project
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
            {projectStats.map((s) => (
              <Card
                key={s.label}
                sx={{
                  borderRadius: 2,
                  border: `1px solid var(--border-color)`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          backgroundColor: "rgba(97,197,195,0.1)",
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
                          {fmtCount(s.value)}
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
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Controls */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", lg: "center" },
              gap: 1,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}>
              <TextField
                fullWidth
                placeholder="Search projects, tags, contributors..."
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
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
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
                  border: `1px solid var(--border-color)`,
                  backgroundColor: "var(--card-bg)",
                  flexShrink: 0,
                  "&:hover": { background: `${PRIMARY}10` },
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
                  const v = e.target.value;
                  setFilters((p) => ({ ...p, sortBy: v }));
                  setAppliedFilters((p) => ({ ...p, sortBy: v }));
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

            {/* View toggle */}
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                backgroundColor: "var(--card-bg)",
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
                    viewType === "grid" ? "var(--bg-secondary)" : "transparent",
                  border:
                    viewType === "grid"
                      ? `1px solid var(--border-color)`
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
                      ? `1px solid var(--border-color)`
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

          {/* Category chips row (single line) */}
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
                  color: selectedCategory === cat ? "#fff" : "var(--text-dark)",
                  borderColor: "var(--border-color)",
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor:
                      selectedCategory === cat ? PRIMARY : themeColors.hoverBg,
                  },
                }}
              />
            ))}
          </Box>

          {/* Projects List */}
          <Box ref={projectsTopRef}>
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={36} sx={{ color: PRIMARY }} />
              </Box>
            )}
            {!loading && error && (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ color: "#f87171", fontWeight: 600, mb: 1 }}>
                  Failed to load projects
                </Typography>
                <Typography
                  sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {error}
                </Typography>
                <Box
                  onClick={() => {
                    setPage(1);
                    setProjects([]);
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
                            md: "repeat(3,1fr)",
                          }
                        : undefined,
                    flexDirection: viewType === "list" ? "column" : undefined,
                    gap: 3,
                  }}
                >
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewType={viewType}
                        onOpen={handleOpenProject}
                        PRIMARY={PRIMARY}
                        themeColors={themeColors}
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
                      <FolderOpen
                        size={48}
                        color="var(--border-color)"
                        style={{ margin: "0 auto 16px" }}
                      />
                      <Typography sx={{ color: "var(--text-muted)" }}>
                        No projects found
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

          {/* Project Form Modal (unchanged, but kept for completeness) */}
          <Modal
            open={isModalOpen}
            onClose={handleCloseModal}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
              sx: { backgroundColor: "rgba(17,24,39,0.7)" },
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
                    "0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)",
                  p: 0,
                  overflow: "hidden",
                  outline: "none",
                  maxHeight: "90vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2.5,
                    backgroundColor: themeColors.isDarkMode
                      ? "rgba(30,41,59,0.5)"
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
                        backgroundColor: "rgba(97,197,195,0.1)",
                        borderRadius: 1.5,
                        display: "flex",
                      }}
                    >
                      <Plus size={20} color={PRIMARY} />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          color: "var(--text-dark)",
                        }}
                      >
                        Request Custom Project
                      </Typography>
                      <Typography
                        sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                      >
                        Define your project requirements and connect with expert
                        teams
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
                  {/* Section 1 */}
                  <Box sx={{ mb: 3.5 }}>
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: PRIMARY,
                        mb: 2.5,
                        borderBottom: `2px solid ${PRIMARY}`,
                        pb: 1,
                      }}
                    >
                      📋 Project Overview
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
                          Project Name *
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="e.g. E-commerce Customer Analytics Platform"
                          value={form.title}
                          onChange={handleInputChange("title")}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                          }}
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
                          sx={{
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                          }}
                        >
                          {categoryOptions
                            .filter((c) => c !== "All")
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
                        Project Description *
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe your project vision, objectives, key features, data requirements..."
                        value={form.description}
                        onChange={handleInputChange("description")}
                        required
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Box>
                  </Box>
                  {/* Section 2 */}
                  <Box sx={{ mb: 3.5 }}>
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: PRIMARY,
                        mb: 2.5,
                        borderBottom: `2px solid ${PRIMARY}`,
                        pb: 1,
                      }}
                    >
                      🎯 Project Specifications
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
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
                          Project Type *
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={form.dataType}
                          onChange={handleInputChange("dataType")}
                          required
                        >
                          <MenuItem value="CSV">
                            Dataset Collection & Integration
                          </MenuItem>
                          <MenuItem value="JSON">
                            Data Pipeline & Processing
                          </MenuItem>
                          <MenuItem value="Images">
                            Analytics & Reporting
                          </MenuItem>
                          <MenuItem value="Text">ML Model Development</MenuItem>
                          <MenuItem value="API">
                            Data Cleaning & Preparation
                          </MenuItem>
                          <MenuItem value="Database">
                            Data Visualization
                          </MenuItem>
                          <MenuItem value="Mixed">
                            Custom Specification
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
                          Expected Data Scale *
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={form.datasetSize}
                          onChange={handleInputChange("datasetSize")}
                          required
                        >
                          <MenuItem value="small">
                            Small (Less than 1GB)
                          </MenuItem>
                          <MenuItem value="1-10GB">Medium (1-10 GB)</MenuItem>
                          <MenuItem value="10-50GB">Large (10-50 GB)</MenuItem>
                          <MenuItem value="enterprise">
                            Enterprise (50GB+)
                          </MenuItem>
                          <MenuItem value="tbd">To Be Determined</MenuItem>
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
                          Technology Stack (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="e.g. Python, React, PostgreSQL, AWS, etc."
                          value={form.sourcePreference}
                          onChange={handleInputChange("sourcePreference")}
                        />
                      </Box>
                    </Box>
                  </Box>
                  {/* Section 3 */}
                  <Box sx={{ mb: 3.5 }}>
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: SECONDARY,
                        mb: 2.5,
                        borderBottom: `2px solid ${SECONDARY}`,
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
                          Budget Min (USD) *
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="e.g. 2000"
                          type="number"
                          value={form.budgetMin}
                          onChange={handleInputChange("budgetMin")}
                          required
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
                          Budget Max (USD) *
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="e.g. 5000"
                          type="number"
                          value={form.budgetMax}
                          onChange={handleInputChange("budgetMax")}
                          required
                        />
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
                        Deadline (Required Completion) *
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        value={form.deadline}
                        onChange={handleInputChange("deadline")}
                        required
                      />
                    </Box>
                  </Box>
                  {/* Section 4 */}
                  <Box sx={{ mb: 3.5 }}>
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: SECONDARY,
                        mb: 2.5,
                        borderBottom: `2px solid ${SECONDARY}`,
                        pb: 1,
                      }}
                    >
                      🤝 Team & Preferences
                    </Typography>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--text-dark)",
                          mb: 0.8,
                        }}
                      >
                        Preferred Partner (Optional)
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="Specify a preferred team or expert (leave empty to receive multiple proposals)"
                        value={form.preferredCollaborator}
                        onChange={handleInputChange("preferredCollaborator")}
                      />
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(97,197,195,0.05)",
                        borderRadius: 2,
                        border: `1px solid ${SECONDARY}20`,
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.openToSuggestions}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            openToSuggestions: e.target.checked,
                          })
                        }
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: "var(--text-dark)",
                          }}
                        >
                          Accept Proposals from Other Teams
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          If unchecked, only your preferred partner will be
                          contacted
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Section 5 */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: PRIMARY,
                        mb: 2.5,
                        borderBottom: `2px solid ${PRIMARY}`,
                        pb: 1,
                      }}
                    >
                      📎 Additional Details
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
                          Priority Level
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={form.priorityLevel}
                          onChange={handleInputChange("priorityLevel")}
                        >
                          <MenuItem value="Low">Low</MenuItem>
                          <MenuItem value="Medium">Medium</MenuItem>
                          <MenuItem value="High">High</MenuItem>
                          <MenuItem value="Urgent">Urgent</MenuItem>
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
                          Documentation Link (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Link to wireframes, designs, specifications, or RFP document"
                          value={form.attachmentUrl}
                          onChange={handleInputChange("attachmentUrl")}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: themeColors.isDarkMode
                      ? "rgba(30,41,59,0.5)"
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
                      !form.budgetMin ||
                      !form.budgetMax ||
                      !form.deadline
                    }
                    sx={{
                      px: 4,
                      py: 1,
                      backgroundColor: PRIMARY,
                      "&:hover": { opacity: 0.9 },
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "none",
                      borderRadius: 2,
                    }}
                  >
                    Post Custom Project
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>

          <ProjectFiltersPanel
            isOpen={isFiltersPanelOpen}
            onClose={() => setIsFiltersPanelOpen(false)}
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            categories={categoryOptions}
            statuses={statuses}
          />
        </Container>

        {/* Back to top button */}
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
            transition: "all 0.2s ease",
            opacity: showBackToTop ? 1 : 0,
            visibility: showBackToTop ? "visible" : "hidden",
            "&:hover": { transform: "translateY(-3px) scale(1.06)" },
          }}
        >
          <ChevronUp size={22} />
        </Box>
      </Box>
    </PageLayout>
  );
}

// ----------------------------------------------------------------------
// Project Card Component (supports grid & list)
// ----------------------------------------------------------------------
function ProjectCard({ project, viewType, onOpen, PRIMARY, themeColors }) {
  const statusStyle = statusColors[project.status] || statusColors.Active;
  const tags = project.tags || [];
  const updatedAgo = timeAgo(project.updated_at);
  const author = project.requested_by || "Unknown";
  const category = project.category_name || project.type || "Project";
  const region = project.region || "";
  const country = project.country || "";

  // Fallback image (since API doesn't provide thumbnails)
  const fallbackImage =
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";

  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 2,
          backgroundColor: "var(--card-bg)",
          border: `1px solid var(--border-color)`,
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
            backgroundImage: `url(${fallbackImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              px: 0.8,
              py: 0.15,
              borderRadius: 0.8,
              backgroundColor: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.66rem",
                fontWeight: 800,
                color: statusStyle.color,
              }}
            >
              {project.status}
            </Typography>
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
            <Typography
              onClick={() => onOpen(project)}
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
              {project.title}
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
                <Typography sx={{ fontSize: "0.78rem" }}>
                  {country || "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                <Calendar size={13} color={PRIMARY} />
                <Typography sx={{ fontSize: "0.78rem" }}>
                  {updatedAgo}
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{ mt: 0.7, fontSize: "0.78rem", color: "var(--text-muted)" }}
            >
              Owner:{" "}
              <span style={{ color: "var(--text-dark)", fontWeight: 700 }}>
                {author}
              </span>
            </Typography>
            {project.progress != null && (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.4,
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Progress
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: PRIMARY,
                    }}
                  >
                    {project.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: "var(--border-color)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        project.progress === 100 ? "#16a34a" : PRIMARY,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}
            <Box
              sx={{
                mt: 1,
                pt: 1,
                borderTop: `1px solid var(--border-color)`,
                display: "flex",
                gap: 0.6,
                flexWrap: "wrap",
              }}
            >
              {tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  sx={{
                    height: 22,
                    borderRadius: "6px",
                    fontSize: "0.68rem",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-muted)",
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
                {category}
              </Typography>
            </Box>
            {project.priority && (
              <Box
                sx={{
                  px: 1.1,
                  py: 0.45,
                  borderRadius: 1,
                  backgroundColor: `${PRIMARY}14`,
                  color: PRIMARY,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                Priority: {project.priority}
              </Box>
            )}
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
        border: `1px solid var(--border-color)`,
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
          backgroundImage: `url(${fallbackImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            px: 0.8,
            py: 0.2,
            borderRadius: 0.8,
            backgroundColor: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.66rem",
              fontWeight: 700,
              color: statusStyle.color,
            }}
          >
            {project.status}
          </Typography>
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            display: "flex",
            gap: 0.5,
            flexWrap: "wrap",
            maxWidth: "calc(100% - 16px)",
          }}
        >
          {tags.slice(0, 2).map((tag) => (
            <Chip
              key={tag}
              size="small"
              label={tag}
              sx={{
                height: 20,
                borderRadius: "999px",
                fontSize: "0.64rem",
                color: "#fff",
                backgroundColor: "rgba(15,23,42,0.68)",
                backdropFilter: "blur(2px)",
                "& .MuiChip-label": { px: 0.8 },
              }}
            />
          ))}
        </Box>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography
          onClick={() => onOpen(project)}
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
          {project.title}
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
            <Typography sx={{ fontSize: "0.75rem" }}>
              {country || "—"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
            <Calendar size={13} color={PRIMARY} />
            <Typography sx={{ fontSize: "0.75rem" }}>{updatedAgo}</Typography>
          </Box>
        </Box>
        <Typography
          sx={{ mb: 1, fontSize: "0.78rem", color: "var(--text-muted)" }}
        >
          Owner:{" "}
          <span style={{ color: "var(--text-dark)", fontWeight: 700 }}>
            {author}
          </span>
        </Typography>
        {project.progress != null && (
          <Box sx={{ mb: 1.2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography
                sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                Progress
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: project.progress === 100 ? "#16a34a" : PRIMARY,
                }}
              >
                {project.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              sx={{
                height: 5,
                borderRadius: 3,
                backgroundColor: "var(--border-color)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    project.progress === 100 ? "#16a34a" : PRIMARY,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.9,
            flexWrap: "nowrap",
            mb: 1.5,
            pb: 1.5,
            borderBottom: `1px solid var(--border-color)`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {[
            { icon: <FileIcon size={12} color={PRIMARY} />, label: category },
            {
              icon: <HardDrive size={12} color={PRIMARY} />,
              label: project.progress ? `${project.progress}%` : "—",
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
            borderTop: `1px solid var(--border-color)`,
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
            <span style={{ fontWeight: 600 }}>{category}</span>
          </Box>
          {project.priority && (
            <Box
              sx={{
                px: 1.1,
                py: 0.45,
                borderRadius: 1,
                backgroundColor: `${PRIMARY}14`,
                color: PRIMARY,
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {project.priority}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

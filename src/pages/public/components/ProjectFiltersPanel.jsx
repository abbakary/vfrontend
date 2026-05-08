import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  InputAdornment,
  Button,
  Slider,
  Select,
  MenuItem,
} from "@mui/material";
import {
  X,
  Search,
  Users,
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";

/**
 * ProjectFiltersPanel
 * A dedicated filtering panel for Dataset Projects.
 * Tailored for project-specific metadata like status, progress, and community stats.
 */

const PRIMARY_COLOR = "#FF8C00"; // Orange
const SECONDARY_COLOR = "#20B2AA"; // Teal
const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const AFRICA_REGIONS = ["North", "West", "East", "Central", "South"];
const SELECT_MENU_PROPS = {
  sx: { zIndex: 13001 },
  PaperProps: { sx: { zIndex: 13001 } },
};

export default function ProjectFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  categories = [],
  statuses = [],
}) {
  const themeColors = useThemeColors();
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    if (!filters.region) {
      setCountries([]);
      if (filters.country) {
        onFiltersChange({ ...filters, country: "" });
      }
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/africa-countries?region=${encodeURIComponent(filters.region)}&page=1&page_size=100`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );
        if (!res.ok) throw new Error("Failed to load countries");
        const payload = await res.json();
        const names = Array.isArray(payload?.data)
          ? payload.data
              .map((item) => item?.country)
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b))
          : [];

        setCountries(names);
        if (filters.country && !names.includes(filters.country)) {
          onFiltersChange({ ...filters, country: "" });
        }
      } catch (error) {
        if (error?.name !== "AbortError") setCountries([]);
      }
    };

    load();
    return () => controller.abort();
  }, [filters.region]);

  const handleToggle = (field, value) => {
    const currentValues = filters[field] || [];
    const updated = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [field]: updated,
    });
  };

  const setSingleValue = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: themeColors.isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Filter Panel */}
      <Box
        sx={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          width: { xs: "100%", sm: 420 },
          backgroundColor: "var(--card-bg)",
          boxShadow: isOpen
            ? themeColors.isDarkMode
              ? "-4px 0 16px rgba(0, 0, 0, 0.4)"
              : "-4px 0 16px rgba(0, 0, 0, 0.15)"
            : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out, background-color 0.3s ease",
          zIndex: 9999,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "var(--bg-secondary)",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "var(--border-color)",
            borderRadius: "3px",
            "&:hover": { backgroundColor: "var(--text-muted)" },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            backgroundColor: "var(--card-bg)",
            zIndex: 10,
            transition: "background-color 0.3s ease, border-color 0.3s ease",
          }}
        >
          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-dark)",
              transition: "color 0.3s ease",
            }}
          >
            Project Filters
          </Typography>
          <Box
            onClick={onClose}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--bg-secondary)",
              "&:hover": { backgroundColor: "var(--border-color)" },
              transition: "background-color 0.3s ease",
            }}
          >
            <X size={18} />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5 }}>
          {/* Tags Search */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
                transition: "color 0.3s ease",
              }}
            >
              Tags / Keywords
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. climate, machine-learning"
              value={filters.tagSearch || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, tagSearch: e.target.value })
              }
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Box>

          {/* Region / Country */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
                transition: "color 0.3s ease",
              }}
            >
              Region
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.region || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, region: e.target.value })
              }
              displayEmpty
              sx={{ mb: 2 }}
              MenuProps={SELECT_MENU_PROPS}
            >
              <MenuItem value="">All Regions</MenuItem>
              {AFRICA_REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>

            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
                transition: "color 0.3s ease",
              }}
            >
              Country
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.country || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, country: e.target.value })
              }
              displayEmpty
              disabled={!filters.region}
              MenuProps={SELECT_MENU_PROPS}
            >
              <MenuItem value="">All Countries</MenuItem>
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Project Status */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
                transition: "color 0.3s ease",
              }}
            >
              Project Status
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {statuses
                .filter((s) => s !== "All")
                .map((status) => (
                  <Chip
                    key={status}
                    label={status}
                    onClick={() => handleToggle("selectedStatuses", status)}
                    variant={
                      filters.selectedStatuses?.includes(status)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontWeight: 600,
                      backgroundColor: filters.selectedStatuses?.includes(
                        status,
                      )
                        ? SECONDARY_COLOR
                        : "transparent",
                      color: filters.selectedStatuses?.includes(status)
                        ? "#fff"
                        : "var(--text-muted)",
                      borderColor: "var(--border-color)",
                      "&:hover": {
                        backgroundColor: filters.selectedStatuses?.includes(
                          status,
                        )
                          ? SECONDARY_COLOR
                          : "var(--bg-secondary)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
            </Box>
          </Box>

          {/* Categories */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
                transition: "color 0.3s ease",
              }}
            >
              Categories
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onClick={() => handleToggle("selectedCategories", cat)}
                    variant={
                      filters.selectedCategories?.includes(cat)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontWeight: 600,
                      backgroundColor: filters.selectedCategories?.includes(cat)
                        ? PRIMARY_COLOR
                        : "transparent",
                      color: filters.selectedCategories?.includes(cat)
                        ? "#fff"
                        : "var(--text-muted)",
                      borderColor: "var(--border-color)",
                      "&:hover": {
                        backgroundColor: filters.selectedCategories?.includes(
                          cat,
                        )
                          ? PRIMARY_COLOR
                          : "var(--bg-secondary)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
            </Box>
          </Box>

          {/* Progress Slider */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 2,
                transition: "color 0.3s ease",
              }}
            >
              Completion Progress (%)
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={filters.progressRange || [0, 100]}
                onChange={(e, val) =>
                  onFiltersChange({ ...filters, progressRange: val })
                }
                valueLabelDisplay="auto"
                sx={{ color: SECONDARY_COLOR }}
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {filters.progressRange?.[0] || 0}%
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {filters.progressRange?.[1] || 100}%
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 3.5, mb: 4 }}
          >
            {/* Project Type */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  textTransform: "uppercase",
                  mb: 1.5,
                  transition: "color 0.3s ease",
                }}
              >
                Project Type
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  "New Dataset Creation",
                  "Data Cleaning & Refinement",
                  "Metadata Enrichment",
                  "Dataset Labelling",
                  "AI Training Set Prep",
                ].map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => handleToggle("selectedProjectTypes", type)}
                    variant={
                      filters.selectedProjectTypes?.includes(type)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontWeight: 600,
                      backgroundColor: filters.selectedProjectTypes?.includes(
                        type,
                      )
                        ? SECONDARY_COLOR
                        : "transparent",
                      color: filters.selectedProjectTypes?.includes(type)
                        ? "#fff"
                        : "var(--text-muted)",
                      borderColor: "var(--border-color)",
                      "&:hover": {
                        backgroundColor: filters.selectedProjectTypes?.includes(
                          type,
                        )
                          ? SECONDARY_COLOR
                          : "var(--bg-secondary)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Monetization Strategy */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  textTransform: "uppercase",
                  mb: 1.5,
                  transition: "color 0.3s ease",
                }}
              >
                Monetization Model
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  "Commercial",
                  "Subscription",
                  "One-time Sale",
                  "Open Data",
                ].map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    onClick={() =>
                      handleToggle("selectedMonetizationTypes", model)
                    }
                    variant={
                      filters.selectedMonetizationTypes?.includes(model)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      borderRadius: "6px",
                      fontWeight: 600,
                      backgroundColor:
                        filters.selectedMonetizationTypes?.includes(model)
                          ? PRIMARY_COLOR
                          : "transparent",
                      color: filters.selectedMonetizationTypes?.includes(model)
                        ? "#fff"
                        : "var(--text-muted)",
                      borderColor: "var(--border-color)",
                      "&:hover": {
                        backgroundColor:
                          filters.selectedMonetizationTypes?.includes(model)
                            ? PRIMARY_COLOR
                            : "var(--bg-secondary)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  transition: "color 0.3s ease",
                }}
              >
                <Users size={14} /> Min Contributors
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={filters.minContributors || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minContributors: e.target.value,
                  })
                }
                placeholder="0"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  transition: "color 0.3s ease",
                }}
              >
                <Star size={14} /> Min Stars
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={filters.minStars || ""}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minStars: e.target.value })
                }
                placeholder="0"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              />
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2.5,
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            gap: 2,
            position: "sticky",
            bottom: 0,
            backgroundColor: "var(--card-bg)",
            zIndex: 10,
            transition: "background-color 0.3s ease, border-color 0.3s ease",
          }}
        >
          <Button
            fullWidth
            onClick={onClear}
            sx={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-dark)",
              fontWeight: 700,
              textTransform: "none",
              py: 1.2,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "var(--border-color)" },
              transition: "all 0.3s ease",
            }}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            onClick={onApply}
            sx={{
              backgroundColor: PRIMARY_COLOR,
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              py: 1.2,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#e67e00" },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  InputAdornment,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { X, Search } from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";

const PRIMARY = "#61C5C3";
const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";

const AFRICA_REGIONS = ["North", "West", "East", "Central", "South"];

const DATA_TYPES = [
  { value: "tabular", label: "Tabular" },
  { value: "spatial_vector", label: "Spatial Vector" },
  { value: "spatial_raster", label: "Spatial Raster" },
  { value: "document", label: "Document" },
  { value: "dashboard", label: "Dashboard" },
  { value: "api", label: "API" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Newest" },
  { value: "updated_at", label: "Recently Updated" },
  { value: "title", label: "Title" },
  { value: "total_views", label: "Most Viewed" },
  { value: "total_downloads", label: "Most Downloaded" },
  { value: "total_sales", label: "Most Sold" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const SELECT_MENU_PROPS = {
  sx: { zIndex: 13001 },
  PaperProps: { sx: { zIndex: 13001 } },
};

export default function FiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  mode = "drawer",
}) {
  const { isDarkMode, text, textMuted } = useThemeColors();
  const isInline = mode === "inline";
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const selectedRegion = filters.region || "";
    if (!selectedRegion) {
      setCountries([]);
      if (filters.country) {
        onFiltersChange({ ...filters, country: "" });
      }
      return;
    }

    const controller = new AbortController();

    const loadCountries = async () => {
      try {
        const url = `${API_BASE}/africa-countries?region=${encodeURIComponent(selectedRegion)}&page=1&page_size=100`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
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
        if (error?.name !== "AbortError") {
          setCountries([]);
        }
      }
    };

    loadCountries();
    return () => controller.abort();
  }, [filters.region]);

  const countryOptions = useMemo(() => countries, [countries]);

  /* ── token aliases ── */
  const panelBg = isDarkMode ? "#0d1f2e" : "#ffffff";
  const sectionLbl = isDarkMode ? "#F1F5F9" : "#111827";
  const inputBg = isDarkMode ? "rgba(4,18,29,0.85)" : "#ffffff";
  const inputBdr = isDarkMode ? "rgba(255,255,255,0.15)" : "#e5e7eb";
  const inputHover = isDarkMode ? "rgba(255,255,255,0.25)" : "#d1d5db";
  const chipBg = isDarkMode ? "rgba(255,255,255,0.06)" : "transparent";
  const chipClr = isDarkMode ? "#CBD5E1" : "#374151";
  const chipBdr = isDarkMode ? "rgba(255,255,255,0.14)" : "#d1d5db";
  const chipHover = isDarkMode ? "rgba(255,255,255,0.12)" : "#f3f4f6";
  const closeBg = isDarkMode ? "rgba(255,255,255,0.08)" : "#f3f4f6";
  const closeHover = isDarkMode ? "rgba(255,255,255,0.15)" : "#e5e7eb";
  const clearBg = isDarkMode ? "rgba(255,255,255,0.08)" : "#f3f4f6";
  const clearClr = isDarkMode ? "#CBD5E1" : "#374151";
  const clearHover = isDarkMode ? "rgba(255,255,255,0.14)" : "#e5e7eb";
  const dividerClr = isDarkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const scrollThumb = isDarkMode
    ? "rgba(97,197,195,0.35)"
    : "rgba(97,197,195,0.55)";
  const scrollTrack = isDarkMode
    ? "rgba(255,255,255,0.04)"
    : "rgba(0,0,0,0.04)";

  /* ── shared text-field sx ── */
  const tfSx = (extraSx = {}) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "0.9rem",
      backgroundColor: inputBg,
      color: text,
      "& fieldset": { borderColor: inputBdr },
      "&:hover fieldset": { borderColor: inputHover },
      "&.Mui-focused fieldset": { borderColor: PRIMARY },
      ...extraSx,
    },
    "& .MuiOutlinedInput-input::placeholder": {
      color: textMuted,
      opacity: 1,
    },
  });

  const setField = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  /* ── chip sx factory ── */
  const chipSx = (active) => ({
    backgroundColor: active ? PRIMARY : chipBg,
    color: active ? "#fff" : chipClr,
    borderColor: active ? PRIMARY : chipBdr,
    fontWeight: 500,
    fontSize: "0.83rem",
    height: 30,
    transition: "all 0.18s ease",
    "&:hover": {
      backgroundColor: active ? "#49b2b1" : chipHover,
    },
  });

  /* ── section label ── */
  const SectionLabel = ({ children }) => (
    <Typography
      sx={{
        fontSize: "0.78rem",
        fontWeight: 800,
        color: sectionLbl,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <>
      {/* Overlay */}
      {!isInline && isOpen && (
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Panel */}
      <Box
        sx={{
          position: isInline ? "relative" : "fixed",
          right: isInline ? "auto" : 0,
          top: isInline ? "auto" : 0,
          height: isInline ? "auto" : "100vh",
          width: isInline ? "100%" : { xs: "100%", sm: 420 },
          backgroundColor: panelBg,
          boxShadow: isInline
            ? "none"
            : isOpen
              ? "-6px 0 32px rgba(0,0,0,0.25)"
              : "none",
          transform: isInline
            ? "none"
            : isOpen
              ? "translateX(0)"
              : "translateX(100%)",
          transition:
            "transform 0.3s cubic-bezier(0.4,0,0.2,1), background-color 0.3s ease",
          zIndex: isInline ? 1 : 9999,
          display: "flex",
          flexDirection: "column",
          overflowY: isInline ? "visible" : "auto",
          borderLeft: isInline ? "none" : `1px solid ${dividerClr}`,
          border: isInline ? `1px solid ${dividerClr}` : "none",
          borderRadius: isInline ? "12px" : 0,
          /* Scrollbar */
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-track": {
            background: scrollTrack,
            borderRadius: "99px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: scrollThumb,
            borderRadius: "99px",
            "&:hover": { background: PRIMARY },
          },
          scrollbarWidth: "thin",
          scrollbarColor: `${scrollThumb} ${scrollTrack}`,
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${dividerClr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: isInline ? "flex-start" : "space-between",
            position: isInline ? "static" : "sticky",
            top: isInline ? "auto" : 0,
            backgroundColor: panelBg,
            zIndex: 10,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: "1.1rem", fontWeight: 800, color: sectionLbl }}
            >
              Filters
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: textMuted, mt: 0.2 }}>
              Refine your dataset results
            </Typography>
          </Box>
          {!isInline && (
            <Box
              onClick={onClose}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "8px",
                backgroundColor: closeBg,
                color: textMuted,
                border: `1px solid ${dividerClr}`,
                transition: "all 0.18s ease",
                "&:hover": {
                  backgroundColor: closeHover,
                  color: text,
                  borderColor: inputHover,
                },
              }}
            >
              <X size={16} />
            </Box>
          )}
        </Box>

        {/* ── Content ── */}
        <Box
          sx={{
            p: 2.5,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box>
            <SectionLabel>Search</SectionLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="Title or summary"
              value={filters.search || ""}
              onChange={(e) => setField("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color={textMuted} />
                  </InputAdornment>
                ),
              }}
              sx={tfSx()}
            />
          </Box>

          <Box>
            <SectionLabel>Subcategory</SectionLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. climate, agriculture"
              value={filters.subcategory || ""}
              onChange={(e) => setField("subcategory", e.target.value)}
              sx={tfSx()}
            />
          </Box>

          <Box>
            <SectionLabel>Region</SectionLabel>
            <Select
              fullWidth
              size="small"
              value={filters.region || ""}
              onChange={(e) => setField("region", e.target.value)}
              displayEmpty
              MenuProps={SELECT_MENU_PROPS}
              sx={{
                ...tfSx()["& .MuiOutlinedInput-root"],
                borderRadius: "8px",
              }}
            >
              <MenuItem value="">All Regions</MenuItem>
              {AFRICA_REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <SectionLabel>Country</SectionLabel>
            <Select
              fullWidth
              size="small"
              value={filters.country || ""}
              onChange={(e) => setField("country", e.target.value)}
              displayEmpty
              disabled={!filters.region}
              MenuProps={SELECT_MENU_PROPS}
              sx={{
                ...tfSx()["& .MuiOutlinedInput-root"],
                borderRadius: "8px",
              }}
            >
              <MenuItem value="">All Countries</MenuItem>
              {countryOptions.map((countryName) => (
                <MenuItem key={countryName} value={countryName}>
                  {countryName}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <SectionLabel>Data Type</SectionLabel>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {DATA_TYPES.map((item) => {
                const active = filters.dataType === item.value;
                return (
                  <Chip
                    key={item.value}
                    label={item.label}
                    size="small"
                    onClick={() =>
                      setField("dataType", active ? "" : item.value)
                    }
                    variant={active ? "filled" : "outlined"}
                    sx={chipSx(active)}
                  />
                );
              })}
            </Box>
          </Box>

          <Box>
            <SectionLabel>Featured</SectionLabel>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {[
                { value: "", label: "Any" },
                { value: "true", label: "Featured only" },
                { value: "false", label: "Not featured" },
              ].map((item) => {
                const active = (filters.isFeatured || "") === item.value;
                return (
                  <Chip
                    key={item.label}
                    label={item.label}
                    size="small"
                    onClick={() => setField("isFeatured", item.value)}
                    variant={active ? "filled" : "outlined"}
                    sx={chipSx(active)}
                  />
                );
              })}
            </Box>
          </Box>

          <Box>
            <SectionLabel>Downloadable</SectionLabel>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {[
                { value: "", label: "Any" },
                { value: "true", label: "Downloadable" },
                { value: "false", label: "Not downloadable" },
              ].map((item) => {
                const active = (filters.isDownloadable || "") === item.value;
                return (
                  <Chip
                    key={item.label}
                    label={item.label}
                    size="small"
                    onClick={() => setField("isDownloadable", item.value)}
                    variant={active ? "filled" : "outlined"}
                    sx={chipSx(active)}
                  />
                );
              })}
            </Box>
          </Box>

          <Box>
            <SectionLabel>Sort By</SectionLabel>
            <Select
              fullWidth
              size="small"
              value={filters.sortBy || "created_at"}
              onChange={(e) => setField("sortBy", e.target.value)}
              MenuProps={SELECT_MENU_PROPS}
              sx={{
                ...tfSx()["& .MuiOutlinedInput-root"],
                borderRadius: "8px",
              }}
            >
              {SORT_BY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <SectionLabel>Order</SectionLabel>
            <Select
              fullWidth
              size="small"
              value={filters.sortOrder || "desc"}
              onChange={(e) => setField("sortOrder", e.target.value)}
              MenuProps={SELECT_MENU_PROPS}
              sx={{
                ...tfSx()["& .MuiOutlinedInput-root"],
                borderRadius: "8px",
              }}
            >
              {SORT_ORDER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: `1px solid ${dividerClr}`,
            display: "flex",
            gap: 1.5,
            position: isInline ? "static" : "sticky",
            bottom: isInline ? "auto" : 0,
            backgroundColor: panelBg,
            zIndex: 10,
          }}
        >
          <Button
            fullWidth
            onClick={onClear}
            sx={{
              backgroundColor: clearBg,
              color: clearClr,
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              py: 1.2,
              borderRadius: "8px",
              border: `1px solid ${dividerClr}`,
              transition: "all 0.18s ease",
              "&:hover": { backgroundColor: clearHover },
            }}
          >
            Clear all
          </Button>
          <Button
            fullWidth
            onClick={onApply}
            sx={{
              backgroundColor: PRIMARY,
              color: "#04121D",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              py: 1.2,
              borderRadius: "8px",
              boxShadow: "0 8px 20px rgba(97,197,195,0.25)",
              transition: "all 0.18s ease",
              "&:hover": {
                backgroundColor: "#49b2b1",
                boxShadow: "0 10px 24px rgba(97,197,195,0.35)",
              },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </>
  );
}

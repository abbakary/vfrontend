import { useEffect, useState } from "react";
import { Box, Typography, Chip, Button, Select, MenuItem } from "@mui/material";
import { X, Globe, BarChart3 } from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const AFRICA_REGIONS = ["North", "West", "East", "Central", "South"];
const SELECT_MENU_PROPS = {
  sx: { zIndex: 13001 },
  PaperProps: { sx: { zIndex: 13001 } },
};

export default function TradeFiltersPanel({
  isOpen,
  onClose,
  selectedRegion,
  selectedCountry = "",
  selectedCategory,
  onRegionChange,
  onCountryChange = () => {},
  onCategoryChange,
  onClear,
  categories = [],
}) {
  const themeColors = useThemeColors();
  const primaryColor = themeColors.teal || "#20B2AA";
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    if (!selectedRegion || selectedRegion === "All Regions") {
      setCountries([]);
      if (selectedCountry) onCountryChange("");
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/africa-countries?region=${encodeURIComponent(selectedRegion)}&page=1&page_size=100`,
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
        if (selectedCountry && !names.includes(selectedCountry)) {
          onCountryChange("");
        }
      } catch (error) {
        if (error?.name !== "AbortError") setCountries([]);
      }
    };

    load();
    return () => controller.abort();
  }, [selectedRegion]);

  return (
    <>
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
        }}
      >
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
          }}
        >
          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-dark)",
            }}
          >
            Trade Filters
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
            }}
          >
            <X size={18} />
          </Box>
        </Box>

        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 4 }}>
          <Box>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Region
            </Typography>
            <Select
              fullWidth
              size="small"
              value={selectedRegion || "All Regions"}
              onChange={(e) => onRegionChange(e.target.value)}
              MenuProps={SELECT_MENU_PROPS}
            >
              <MenuItem value="All Regions">All Regions</MenuItem>
              {AFRICA_REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Country
            </Typography>
            <Select
              fullWidth
              size="small"
              value={selectedCountry || ""}
              onChange={(e) => onCountryChange(e.target.value)}
              displayEmpty
              disabled={!selectedRegion || selectedRegion === "All Regions"}
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

          <Box>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Category
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  icon={<BarChart3 size={14} />}
                  label={category}
                  onClick={() => onCategoryChange(category)}
                  variant={
                    selectedCategory === category ? "filled" : "outlined"
                  }
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 600,
                    backgroundColor:
                      selectedCategory === category
                        ? primaryColor
                        : "transparent",
                    color:
                      selectedCategory === category
                        ? "#fff"
                        : "var(--text-muted)",
                    borderColor: "var(--border-color)",
                    "&:hover": {
                      backgroundColor:
                        selectedCategory === category
                          ? primaryColor
                          : "var(--bg-secondary)",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

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
            }}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            onClick={onClose}
            sx={{
              backgroundColor: primaryColor,
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              py: 1.2,
              borderRadius: "8px",
              "&:hover": { backgroundColor: primaryColor },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </>
  );
}

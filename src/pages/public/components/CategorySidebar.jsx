import { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Badge, Tooltip } from "@mui/material";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import SparkleTwoToneIcon from "@mui/icons-material/AutoAwesomeTwoTone";
import { useThemeColors } from "../../../utils/useThemeColors";

const PRIMARY = "#61C5C3";
const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";

const normalizeApiCategories = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    id: item.id,
    slug: item.slug ?? null,
    name: item.name,
    icon: item.icon ?? null,
    color: item.color ?? null,
    datasetCount: Number(item.total_dataset_count ?? 0),
    subcategories: Array.isArray(item.dataset_categories)
      ? item.dataset_categories.map((sub) => ({
          id: sub.id,
          parent_id: sub.parent_id ?? null,
          slug: sub.slug ?? null,
          name: sub.name,
          datasetCount: Number(sub.dataset_count ?? 0),
        }))
      : [],
  }));
};

const renderCategoryIcon = (category, props = {}) => {
  const icon = category?.icon;

  if (typeof icon === "string" && icon.trim()) {
    return (
      <Box
        component="span"
        sx={{
          fontSize: props.fontSize || "1rem",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <BarChart3 size={props.size || 15} strokeWidth={props.strokeWidth || 2} />
  );
};

export default function CategorySidebar({
  onCategorySelect,
  selectedCategory,
  onCollapseChange,
  disableCollapse = false,
}) {
  const themeColors = useThemeColors();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [flyoutRect, setFlyoutRect] = useState(null);
  const [categories, setCategories] = useState([]);
  const closeTimer = useRef(null);

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

        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.status}`);
        }

        const payload = await response.json();
        setCategories(normalizeApiCategories(payload));
      } catch (error) {
        if (error.name === "AbortError") return;
        setCategories([]);
      }
    };

    loadCategories();

    return () => controller.abort();
  }, []);

  const isDark = themeColors.isDarkMode;
  const selectedBg = isDark ? "rgba(32,178,170,0.15)" : "#e6f7f6";
  const hoverBg = isDark ? "rgba(32,178,170,0.08)" : "#f0fffe";
  const subHoverBg = isDark ? "rgba(32,178,170,0.06)" : "#f3fffe";
  const scrollThumb = isDark
    ? "rgba(97,197,195,0.35)"
    : "rgba(97,197,195,0.55)";
  const scrollTrack = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const flyoutBg = isDark ? "#0d2236" : "#ffffff";
  const flyoutBorder = isDark
    ? "rgba(97,197,195,0.18)"
    : "rgba(97,197,195,0.30)";

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const queueClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => {
      setHoveredId(null);
      setFlyoutRect(null);
    }, 160);
  };

  const handleCategoryClick = (cat) => {
    clearClose();
    setHoveredId(null);
    setFlyoutRect(null);
    onCategorySelect(null);
  };

  const handleSubClick = (cat, sub) => {
    onCategorySelect({ ...cat, selectedSubcategory: sub });
    setHoveredId(null);
  };

  const hoveredCat = categories.find((c) => c.id === hoveredId);

  /* ─── Flyout position ─── */
  const getFlyoutPos = () => {
    if (!flyoutRect) return { left: 0, top: 0 };
    const gap = 8;
    const menuW = 260;
    const pad = 10;
    const subCount = hoveredCat?.subcategories?.length ?? 0;
    const menuH = Math.min(subCount * 44 + 24, window.innerHeight - pad * 2);
    let left = flyoutRect.right + gap;
    if (left + menuW > window.innerWidth - pad)
      left = flyoutRect.left - menuW - gap;
    let top = flyoutRect.top - 4;
    if (top + menuH > window.innerHeight - pad)
      top = window.innerHeight - menuH - pad;
    if (top < pad) top = pad;
    return { left, top };
  };

  const flyoutPos = getFlyoutPos();

  /* ─── Widths ─── */
  const EXPANDED_W = 280;
  const COLLAPSED_W = 56;
  const isCollapsed = disableCollapse ? false : collapsed;

  return (
    <Box
      sx={{
        width: { xs: "100%", md: isCollapsed ? COLLAPSED_W : EXPANDED_W },
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        alignSelf: "start",
        position: { xs: "relative", md: "sticky" },
        top: { md: 12 },
        height: { xs: "auto", md: "calc(100vh - 24px)" },
        maxHeight: { xs: "none", md: "calc(100vh - 24px)" },
        mb: { xs: 3, md: 0 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          overflow: "hidden",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
          height: "100%",
        }}
      >
        {/* ── Header / Toggle ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            px: isCollapsed ? 0 : 2.5,
            py: 1.6,
            borderBottom: `1px solid ${isDark ? "rgba(97,197,195,0.10)" : "rgba(97,197,195,0.18)"}`,
            minHeight: 52,
          }}
        >
          {!isCollapsed && (
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 900,
                background: "linear-gradient(135deg, #61C5C3 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              Categories
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* ...existing code... */}

            {!disableCollapse && (
              <Box
                onClick={() => {
                  const next = !collapsed;
                  setCollapsed(next);
                  onCollapseChange?.(next);
                }}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: PRIMARY,
                  border: `1px solid ${isDark ? "rgba(97,197,195,0.25)" : "rgba(97,197,195,0.35)"}`,
                  bgcolor: isDark
                    ? "rgba(97,197,195,0.07)"
                    : "rgba(97,197,195,0.06)",
                  transition: "all 0.18s ease",
                  flexShrink: 0,
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(97,197,195,0.16)"
                      : "rgba(97,197,195,0.14)",
                    borderColor: PRIMARY,
                  },
                }}
              >
                {isCollapsed ? (
                  <ChevronRight size={15} />
                ) : (
                  <ChevronLeft size={15} />
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* ── List ── */}
        <Box
          sx={{
            height: "calc(100% - 52px)",
            maxHeight: "calc(100% - 52px)",
            overflowY: "auto",
            overflowX: "hidden",
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
          {categories.map((cat, idx) => {
            const iconColor = cat.color || PRIMARY;
            const isCatSel =
              selectedCategory?.id === cat.id &&
              !selectedCategory?.selectedSubcategory;
            const hasSubSel =
              selectedCategory?.id === cat.id &&
              !!selectedCategory?.selectedSubcategory;
            const isActive = isCatSel || hasSubSel;

            return (
              <Box key={cat.id}>
                <Tooltip
                  title={isCollapsed ? cat.name : ""}
                  placement="right"
                  arrow
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: isDark ? "#1a3a52" : "#04121D",
                        color: "#fff",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        borderRadius: "8px",
                        px: 1.4,
                        py: 0.7,
                      },
                    },
                  }}
                >
                  <Box
                    onMouseEnter={(e) => {
                      clearClose();
                      setHoveredId(cat.id);
                      setFlyoutRect(e.currentTarget.getBoundingClientRect());
                    }}
                    onMouseLeave={queueClose}
                    onClick={() => handleCategoryClick(cat)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: isCollapsed ? 0 : 1.4,
                      px: isCollapsed ? 0 : 2,
                      py: 1.1,
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      cursor: "pointer",
                      position: "relative",
                      backgroundColor: isActive ? selectedBg : "transparent",
                      borderLeft: isCollapsed
                        ? "none"
                        : isActive
                          ? `4px solid ${PRIMARY}`
                          : "4px solid transparent",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: hoverBg,
                        ...(!isCollapsed && {
                          transform: "translateX(3px)",
                          borderLeftColor: PRIMARY,
                        }),
                      },
                    }}
                  >
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        bgcolor: isActive
                          ? isDark
                            ? "rgba(97,197,195,0.18)"
                            : "rgba(97,197,195,0.14)"
                          : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                        border: `1px solid ${
                          isActive
                            ? "rgba(97,197,195,0.40)"
                            : isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.07)"
                        }`,
                        transition: "all 0.2s ease",
                        color: isActive ? PRIMARY : iconColor,
                      }}
                    >
                      {renderCategoryIcon(cat, {
                        size: 15,
                        strokeWidth: 2,
                        fontSize: "1rem",
                      })}
                    </Box>

                    {/* Name + count — hidden when collapsed */}
                    {!isCollapsed && (
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: isActive ? PRIMARY : "var(--text-dark)",
                            letterSpacing: "0.2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.3,
                            transition: "color 0.2s ease",
                          }}
                        >
                          {cat.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.71rem",
                            fontWeight: 600,
                            color: isActive ? PRIMARY : "var(--text-muted)",
                            transition: "color 0.2s ease",
                            mt: 0.15,
                          }}
                        >
                          {cat.datasetCount} datasets
                        </Typography>
                      </Box>
                    )}

                    {/* Active dot in collapsed mode */}
                    {isCollapsed && isActive && (
                      <Box
                        sx={{
                          position: "absolute",
                          right: 6,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: PRIMARY,
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>

                {idx < categories.length - 1 && (
                  <Box
                    sx={{
                      mx: isCollapsed ? 1 : 2.5,
                      borderBottom: isDark
                        ? "1px solid rgba(97,197,195,0.08)"
                        : "1px solid rgba(97,197,195,0.18)",
                    }}
                  />
                )}
              </Box>
            );
          })}
          <Box sx={{ height: 10 }} />
        </Box>
      </Paper>

      {/* ── Portal flyout (hover subcategories) ── */}
      {hoveredCat &&
        createPortal(
          <Box
            onMouseEnter={clearClose}
            onMouseLeave={queueClose}
            sx={{
              position: "fixed",
              left: flyoutPos.left,
              top: flyoutPos.top,
              width: 260,
              bgcolor: flyoutBg,
              border: `1px solid ${flyoutBorder}`,
              borderRadius: "12px",
              boxShadow: isDark
                ? "0 12px 40px rgba(0,0,0,0.55)"
                : "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 20000,
              py: 1,
              overflow: "hidden",
              animation: "catFlyIn 0.18s ease",
              "@keyframes catFlyIn": {
                from: { opacity: 0, transform: "translateX(-10px)" },
                to: { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            {/* Flyout header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                pb: 1,
                mb: 0.5,
                borderBottom: `1px solid ${flyoutBorder}`,
              }}
            >
              {(() => {
                return renderCategoryIcon(hoveredCat, {
                  size: 14,
                  strokeWidth: 2.5,
                  fontSize: "0.95rem",
                });
              })()}
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: hoveredCat.color || PRIMARY,
                  letterSpacing: "0.3px",
                }}
              >
                {hoveredCat.name}
              </Typography>
            </Box>

            {/* Subcategory rows */}
            {hoveredCat.subcategories.map((sub) => {
              const isSubSel =
                selectedCategory?.selectedSubcategory?.id === sub.id;
              return (
                <Box
                  key={sub.id}
                  onClick={() => handleSubClick(hoveredCat, sub)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    mx: 0.8,
                    borderRadius: "8px",
                    bgcolor: isSubSel ? selectedBg : "transparent",
                    color: isSubSel
                      ? PRIMARY
                      : isDark
                        ? "rgba(255,255,255,0.70)"
                        : "rgba(0,0,0,0.65)",
                    transition: "all 0.15s ease",
                    "&:hover": { bgcolor: subHoverBg },
                  }}
                >
                  {/* Dot */}
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      flexShrink: 0,
                      bgcolor: isSubSel
                        ? PRIMARY
                        : isDark
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(0,0,0,0.20)",
                      transition: "background 0.2s ease",
                    }}
                  />

                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: "0.83rem",
                      fontWeight: isSubSel ? 700 : 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "inherit",
                    }}
                  >
                    {sub.name}
                  </Typography>

                  <Badge
                    badgeContent={sub.datasetCount}
                    sx={{
                      flexShrink: 0,
                      "& .MuiBadge-badge": {
                        position: "static",
                        transform: "none",
                        bgcolor: isSubSel
                          ? PRIMARY
                          : isDark
                            ? "rgba(255,255,255,0.10)"
                            : "#e5e7eb",
                        color: isSubSel
                          ? "#fff"
                          : isDark
                            ? "rgba(255,255,255,0.55)"
                            : "#374151",
                        fontSize: "0.63rem",
                        height: 17,
                        minWidth: 17,
                        padding: "0 4px",
                        fontWeight: 700,
                        borderRadius: "99px",
                        transition: "all 0.2s ease",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>,
          document.body,
        )}

      {/* ...existing code... */}
    </Box>
  );
}

// src/components/Sidebar.jsx

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  CalendarDays,
  Activity,
  CloudSun,
  Map,
  Waves,
  Droplets,
  Tractor,
  Images,
  Brain,
  AlertTriangle,
} from "lucide-react";

import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Divider,
  Collapse,
} from "@mui/material";

import { styled } from "@mui/material/styles";

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 70;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    backgroundColor: "#04121D",
    color: "#fff",
    overflowX: "hidden",
    transition: "width 0.3s ease",
    borderLeft: "none",
    padding: theme.spacing(1),
  },
}));

const TOKEN_KEY = "orbi-agriculture-token";
const USER_KEY = "orbi-user";
const COMPANY_KEY = "orbi-company";
const OPENKEY_STORAGE = "rada-sidebar-openKey";
const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000";

export default function Sidebar({
  collapsed,
  setCollapsed,
  isMobile,
  mobileOpen,
  onClose,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const effectiveCollapsed = isMobile ? false : collapsed;
  const listRef = useRef(null);

  const [planCheck, setPlanCheck] = useState({
    loading: true,
    success: true,
    status: null,
    message: "",
  });

  const coreMenus = [
    { name: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
    { name: "Calendar", path: "/calendar", Icon: CalendarDays },
    {
      type: "group",
      key: "fields",
      label: "My Fields",
      icon: Tractor,
      basePath: "/field/manage",
      activePrefixes: ["/field"],
      tooltip: "Add field, Manage field, Field images",
      subItems: [
        { name: "Add Field", path: "/field/add", Icon: Tractor },
        { name: "Manage Field", path: "/field/manage", Icon: Tractor },
        { name: "Field Images", path: "/field/images", Icon: Images },
      ],
    },
    {
      name: "Indices",
      path: "/indices",
      Icon: Activity,
      activePrefixes: ["/indices"],
    },
    {
      name: "Weather",
      path: "/weather",
      Icon: CloudSun,
      activePrefixes: ["/weather"],
    },
    { name: "Soil", path: "/soil", Icon: Droplets, activePrefixes: ["/soil"] },
    {
      name: "VRA Maps",
      path: "/vra-map",
      Icon: Map,
      activePrefixes: ["/vra-map", "/vra"],
    },
    {
      name: "Flood",
      path: "/flood",
      Icon: Waves,
      activePrefixes: ["/flood"],
    },
    {
      name: "Drought",
      path: "/drought",
      Icon: Droplets,
      activePrefixes: ["/drought"],
    },
    {
      name: "AI Reports",
      path: "/reports",
      Icon: Brain,
      badge: "New",
      activePrefixes: ["/reports", "/report"],
    },
  ];

  const getPrimaryPath = (pathname) => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}` : "/";
  };

  const primaryPath = useMemo(
    () => getPrimaryPath(location.pathname),
    [location.pathname],
  );

  const isPathMatch = (targetPath, prefixes = []) => {
    if (!targetPath && (!prefixes || !prefixes.length)) return false;

    if (targetPath && location.pathname === targetPath) return true;
    if (targetPath && location.pathname.startsWith(`${targetPath}/`))
      return true;

    return prefixes.some(
      (prefix) =>
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`),
    );
  };

  const getToken = useCallback(
    () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
    [],
  );

  const allowedWhenNoPlan = useMemo(
    () => new Set(["/dashboard", "/calendar", "/field/manage"]),
    [],
  );

  const filteredMenus = useMemo(() => {
    if (planCheck.loading || planCheck.success !== false) {
      return coreMenus;
    }

    return coreMenus
      .map((item) => {
        if (item.type === "group" && item.key === "fields") {
          return {
            ...item,
            subItems: (item.subItems || []).filter(
              (si) => si.path === "/field/manage",
            ),
          };
        }

        return item;
      })
      .filter((item) => {
        if (item.type === "group") {
          return item.key === "fields";
        }

        return allowedWhenNoPlan.has(item.path);
      });
  }, [coreMenus, planCheck.loading, planCheck.success, allowedWhenNoPlan]);

  const buttonBaseSx = (active = false) => ({
    py: 0.7,
    minHeight: 44,
    px: effectiveCollapsed ? 0 : 2,
    justifyContent: effectiveCollapsed ? "center" : "flex-start",
    backgroundColor: active ? "rgba(4, 146, 194, 0.25)" : "transparent",
    "&:hover": { backgroundColor: "rgba(4, 146, 194, 0.15)" },
    borderRadius: 1.5,
    transition: "background-color .2s ease",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      left: effectiveCollapsed ? 4 : 8,
      top: 6,
      bottom: 6,
      width: 3,
      borderRadius: 999,
      backgroundImage: active
        ? "linear-gradient(180deg, #0492C2, #037AA0, #025D7D, #0492C2)"
        : "linear-gradient(180deg, rgba(148,163,184,0.7), rgba(30,64,175,0.9))",
      backgroundSize: "100% 300%",
      animation: "radaMenuBorder 2s linear infinite",
      opacity: active ? 1 : 0.45,
      boxShadow: active
        ? "0 0 10px rgba(4, 146, 194, 0.8)"
        : "0 0 6px rgba(15,23,42,0.7)",
    },
  });

  const iconBaseSx = {
    color: "#0492C2",
    minWidth: effectiveCollapsed ? 0 : 40,
    mr: effectiveCollapsed ? 0 : 1.5,
    display: "grid",
    placeItems: "center",
  };

  const ACCENT_BG_OPEN = "rgba(4, 146, 194, 0.22)";
  const ACCENT_BG_OPEN_HOVER = "rgba(4, 146, 194, 0.28)";
  const SUB_BG_OPEN = "rgba(255,255,255,0.06)";
  const SUB_BG_ACTIVE = "rgba(4, 146, 194, 0.30)";
  const SUB_BG_ACTIVE_HOVER = "rgba(4, 146, 194, 0.38)";

  const parentOpenSx = {
    backgroundColor: ACCENT_BG_OPEN,
    boxShadow: "inset 0 0 0 1px rgba(4, 146, 194, 0.45)",
    "&:hover": { backgroundColor: ACCENT_BG_OPEN_HOVER },
  };

  const subItemSx = ({ active = false, sectionOpen = false }) => ({
    py: 0.65,
    minHeight: 42,
    pl: effectiveCollapsed ? 0 : 3,
    pr: effectiveCollapsed ? 0 : 2,
    justifyContent: effectiveCollapsed ? "center" : "flex-start",
    borderRadius: 1.5,
    position: "relative",
    backgroundColor: active
      ? SUB_BG_ACTIVE
      : sectionOpen
        ? SUB_BG_OPEN
        : "transparent",
    "&:hover": {
      backgroundColor: active ? SUB_BG_ACTIVE_HOVER : "rgba(255,255,255,0.12)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      left: effectiveCollapsed ? 10 : 14,
      top: 6,
      bottom: 6,
      width: 2,
      borderRadius: 999,
      backgroundColor: active ? "#0492C2" : "rgba(255,255,255,0.18)",
      boxShadow: active ? "0 0 10px rgba(4, 146, 194, 0.55)" : "none",
      opacity: sectionOpen ? 1 : 0,
    },
  });

  const badgeSx = {
    ml: 1,
    px: 0.9,
    py: 0.2,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.6,
    color: "#04121D",
    background:
      "linear-gradient(135deg, #22c55e 0%, #4ade80 55%, #86efac 100%)",
    boxShadow: "0 0 12px rgba(74, 222, 128, 0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flexShrink: 0,
  };

  const Section = ({ children }) => (
    <Box
      sx={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        boxShadow: "0px 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </Box>
  );

  const [openKey, setOpenKey] = useState(() => {
    try {
      const saved = localStorage.getItem(OPENKEY_STORAGE);
      return saved || null;
    } catch {
      return null;
    }
  });

  const routeOpenKey = useMemo(() => {
    if (primaryPath === "/field") return "fields";
    return null;
  }, [primaryPath]);

  useEffect(() => {
    if (routeOpenKey) {
      setOpenKey(routeOpenKey);
    }
  }, [routeOpenKey]);

  useEffect(() => {
    try {
      if (openKey) localStorage.setItem(OPENKEY_STORAGE, openKey);
      else localStorage.removeItem(OPENKEY_STORAGE);
    } catch {
      // ignore
    }
  }, [openKey]);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();

    if (!token) {
      setPlanCheck({
        loading: false,
        success: true,
        status: null,
        message: "",
      });
      return;
    }

    const checkPlan = async () => {
      try {
        setPlanCheck((prev) => ({ ...prev, loading: true }));

        const res = await axios.get(`${API_BASE}/auth/plan-check`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 12000,
        });

        if (!cancelled) {
          setPlanCheck({
            loading: false,
            success: res?.data?.success !== false,
            status: res?.data?.status || null,
            message: res?.data?.message || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          if (error?.response?.status === 401) {
            setPlanCheck({
              loading: false,
              success: true,
              status: null,
              message: "",
            });
          } else {
            setPlanCheck({
              loading: false,
              success: true,
              status: null,
              message: "",
            });
          }
        }
      }
    };

    checkPlan();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const handleMenuItemClick = () => {
    setOpenKey(null);
    if (isMobile) onClose?.();
  };

  const handleParentClick = (basePath, key) => {
    if (effectiveCollapsed) {
      navigate(basePath);
      if (isMobile) onClose?.();
      return;
    }

    setOpenKey((prev) => (prev === key ? null : key));
  };

  const SimpleItem = ({ to, label, Icon, badge, activePrefixes = [] }) => {
    const active = isPathMatch(to, activePrefixes);

    return (
      <Section>
        <Tooltip title={effectiveCollapsed ? label : ""} placement="left" arrow>
          <ListItemButton
            component={Link}
            to={to}
            sx={buttonBaseSx(active)}
            data-active={active ? "true" : undefined}
            onClick={handleMenuItemClick}
          >
            <ListItemIcon sx={iconBaseSx}>
              <Icon size={20} />
            </ListItemIcon>

            {!effectiveCollapsed && (
              <Box
                sx={{
                  width: "100%",
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <ListItemText primary={label} />
                {badge ? (
                  <Box component="span" sx={badgeSx}>
                    {badge}
                  </Box>
                ) : null}
              </Box>
            )}
          </ListItemButton>
        </Tooltip>
      </Section>
    );
  };

  useEffect(() => {
    if (!listRef.current) return;

    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (!activeEl) return;

    const parentRect = listRef.current.getBoundingClientRect();
    const rect = activeEl.getBoundingClientRect();

    const isOutOfView =
      rect.top < parentRect.top + 20 || rect.bottom > parentRect.bottom - 20;

    if (isOutOfView) {
      activeEl.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [location.pathname, effectiveCollapsed]);

  const handleLogout = () => {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
      storage.removeItem(COMPANY_KEY);
    });

    window.dispatchEvent(new Event("auth:updated"));

    if (isMobile) onClose?.();

    navigate("/logout", { replace: true });
  };

  const sidebarContent = (
    <>
      <style>
        {`
          @keyframes radaMenuBorder {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% 100%; }
          }
        `}
      </style>

      {!isMobile && (
        <Box
          display="flex"
          justifyContent={collapsed ? "center" : "flex-start"}
          p={1}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "#0492C2",
              color: "#04121D",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </Box>
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.3)" }} />

      <List
        component="nav"
        ref={listRef}
        sx={{ flexGrow: 1, gap: 1, display: "flex", flexDirection: "column" }}
      >
        {filteredMenus.map((item) => {
          if (item.type !== "group") {
            return (
              <SimpleItem
                key={item.path}
                to={item.path}
                label={item.name}
                Icon={item.Icon}
                badge={item.badge}
                activePrefixes={item.activePrefixes || []}
              />
            );
          }

          const isGroupOpen = openKey === item.key;
          const groupActive =
            isPathMatch(item.basePath, item.activePrefixes || []) ||
            item.subItems.some((si) =>
              isPathMatch(si.path, si.activePrefixes || []),
            );

          return (
            <Section key={item.key}>
              <Tooltip
                title={effectiveCollapsed ? item.tooltip || item.label : ""}
                placement="left"
                arrow
              >
                <ListItemButton
                  sx={{
                    ...buttonBaseSx(groupActive),
                    ...(isGroupOpen ? parentOpenSx : {}),
                  }}
                  data-active={groupActive ? "true" : undefined}
                  onClick={() => handleParentClick(item.basePath, item.key)}
                >
                  <ListItemIcon sx={iconBaseSx}>
                    <item.icon size={20} />
                  </ListItemIcon>

                  {!effectiveCollapsed && (
                    <>
                      <ListItemText primary={item.label} />
                      {isGroupOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>

              <Collapse
                in={!effectiveCollapsed && isGroupOpen}
                timeout="auto"
                unmountOnExit
              >
                <Box
                  sx={{
                    position: "relative",
                    ml: 1,
                    mt: 0.5,
                    mb: 0.5,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: effectiveCollapsed ? 10 : 14,
                      top: 10,
                      bottom: 10,
                      width: 2,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.14)",
                    },
                  }}
                >
                  <List component="div" disablePadding>
                    {item.subItems.map((si) => {
                      const active = isPathMatch(
                        si.path,
                        si.activePrefixes || [],
                      );

                      return (
                        <Box key={si.path}>
                          <ListItemButton
                            component={Link}
                            to={si.path}
                            sx={subItemSx({
                              active,
                              sectionOpen: isGroupOpen,
                            })}
                            data-active={active ? "true" : undefined}
                            onClick={() => {
                              setOpenKey(item.key);
                              if (isMobile) onClose?.();
                            }}
                          >
                            <ListItemIcon sx={iconBaseSx}>
                              <si.Icon size={18} />
                            </ListItemIcon>
                            {!effectiveCollapsed && (
                              <ListItemText primary={si.name} />
                            )}
                          </ListItemButton>
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              </Collapse>
            </Section>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", my: 1 }} />

      {planCheck.success === false &&
        !planCheck.loading &&
        !effectiveCollapsed && (
          <Section>
            <Box
              sx={{
                px: 1.5,
                py: 1.25,
                borderRadius: 1.5,
                background:
                  "linear-gradient(180deg, rgba(255,193,7,0.18), rgba(255,87,34,0.16))",
                border: "1px solid rgba(255,193,7,0.35)",
                color: "#fff3cd",
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Box sx={{ mt: "2px", color: "#fcb900", flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 0.4,
                    color: "#ffd666",
                  }}
                >
                  Plan Alert
                </Box>
                <Box
                  sx={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  {planCheck.message ||
                    "Your subscription plan needs attention."}
                </Box>
              </Box>
            </Box>
          </Section>
        )}

      {planCheck.success === false &&
        !planCheck.loading &&
        effectiveCollapsed && (
          <Section>
            <Tooltip
              title={planCheck.message || "Plan alert"}
              placement="left"
              arrow
            >
              <ListItemButton
                sx={{
                  ...buttonBaseSx(false),
                  justifyContent: "center",
                  backgroundColor: "rgba(255,193,7,0.12)",
                  "&:hover": { backgroundColor: "rgba(255,193,7,0.18)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#fcb900",
                    minWidth: 0,
                    mr: 0,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Section>
        )}

      <Section>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            ...buttonBaseSx(false),
            "&:hover": { backgroundColor: "rgba(255,0,0,0.25)" },
          }}
        >
          <ListItemIcon sx={iconBaseSx}>
            <LogOut size={20} />
          </ListItemIcon>
          {!effectiveCollapsed && <ListItemText primary="Logout" />}
        </ListItemButton>
      </Section>
    </>
  );

  return (
    <>
      <StyledDrawer
        anchor="right"
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
          "& .MuiDrawer-paper": {
            width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
            top: "70px",
            height: "calc(100% - 70px)",
          },
        }}
      >
        {sidebarContent}
      </StyledDrawer>

      <StyledDrawer
        anchor="right"
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidthExpanded,
            top: "70px",
          },
        }}
      >
        {sidebarContent}
      </StyledDrawer>
    </>
  );
}

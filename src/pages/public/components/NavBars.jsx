import { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Database,
  Menu as MenuIcon,
  FolderOpen,
  Wallet,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import SparkleTwoToneIcon from "@mui/icons-material/AutoAwesomeTwoTone";
import logo from "../../../assets/logo.png";
import { useTheme } from "../../../context/ThemeContext";
import { useThemeColors } from "../../../utils/useThemeColors";
import { useAuth } from "../../../context/AuthContext";
import RequestDataModal from "./RequestDataModal"; // ← separate component

const PRIMARY = "#61C5C3";
const SECONDARY = "#F58A24";
const PURPLE = "#8b5cf6";

const NAV_ICON_COLORS = {
  Dataset: { light: "#2563eb", dark: "#60a5fa" },
  Project: { light: "#0ea5e9", dark: "#38bdf8" },
  Funds: { light: "#16a34a", dark: "#4ade80" },
  Trade: { light: "#0f766e", dark: "#2dd4bf" },
  Reports: { light: "#7c3aed", dark: "#a78bfa" },
  "Request Any Data": { light: "#ca8a04", dark: "#facc15" },
};

const getRoleDashboardPath = (role) => {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  return (
    {
      admin: "/dashboard/admin",
      editor: "/dashboard/editor",
      seller: "/dashboard/seller",
      buyer: "/dashboard/buyer",
      viewer: "/dashboard/viewer",
    }[r] || "/dashboard/viewer"
  );
};

export const NAVBAR_HEIGHT = 64;

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { text, textMuted } = useThemeColors();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const { authUser, isLoggedIn, displayName } = useAuth();
  const handleLogout = () => navigate("/logout", { replace: true });

  const navLinks = [
    { label: "Dataset", path: "/datasets", icon: Database },
    { label: "Project", path: "/public/project", icon: FolderOpen },
    { label: "Funds", path: "/public/funds", icon: Wallet },
    { label: "Trade", path: "/public/trade", icon: Globe },
    { label: "Reports", path: "/public/reports", icon: BarChart3 },
    {
      label: "Request Any Data",
      path: null, // opens modal — no navigation
      icon: (props) => (
        <SparkleTwoToneIcon
          fontSize="small"
          sx={{
            verticalAlign: "middle",
            marginBottom: "2px",
            color: props?.color || NAV_ICON_COLORS["Request Any Data"].light,
          }}
        />
      ),
    },
  ];

  const isNavActive = (path) =>
    path &&
    (location.pathname === path || location.pathname.startsWith(`${path}/`));

  const avatarLetter = displayName.charAt(0).toUpperCase();

  /* ── derived tokens ── */
  const navBg = isDarkMode ? "rgba(7,26,41,0.88)" : "rgba(255,255,255,0.88)";
  const navBorder = isDarkMode
    ? "rgba(97,197,195,0.12)"
    : "rgba(97,197,195,0.20)";
  const menuBg = isDarkMode ? "#071a29" : "#ffffff";
  const menuBorder = isDarkMode ? "rgba(97,197,195,0.15)" : "#f1f5f9";
  const itemClr = isDarkMode ? "#CBD5E1" : "#475569";
  const itemHover = isDarkMode ? "rgba(97,197,195,0.10)" : "#f1f5f9";
  const userBoxBg = isDarkMode ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const userBoxBdr = isDarkMode ? "rgba(255,255,255,0.12)" : "#e2e8f0";
  const themeBtnBg = isDarkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9";

  const menuItemSx = (danger = false) => ({
    borderRadius: "8px",
    fontSize: "0.87rem",
    fontWeight: danger ? 600 : 500,
    color: danger ? "#ef4444" : itemClr,
    py: 1.1,
    gap: 1.4,
    "&:hover": {
      backgroundColor: danger
        ? isDarkMode
          ? "rgba(239,68,68,0.12)"
          : "#fef2f2"
        : itemHover,
      color: danger ? "#ef4444" : PRIMARY,
    },
  });

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          "@keyframes activeMenuLineShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "100%": { backgroundPosition: "200% 50%" },
          },
          backgroundColor: navBg,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${navBorder}`,
          color: text,
          height: NAVBAR_HEIGHT,
          transition: "background-color 0.3s ease, border-color 0.3s ease",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: NAVBAR_HEIGHT,
            px: { xs: 2, md: 4 },
          }}
        >
          {/* ── Logo ── */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Dali Data"
              sx={{ height: 38, width: "auto", objectFit: "contain" }}
            />
          </Box>

          {/* ── Desktop nav links ── */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {navLinks.map(({ label, path, icon: Icon }) => {
              const active = isNavActive(path);
              const isGradient = label === "Request Any Data";
              return (
                <Button
                  key={label}
                  onClick={
                    isGradient ? () => setRequestModalOpen(true) : undefined
                  }
                  component={isGradient ? "button" : RouterLink}
                  to={isGradient ? undefined : path}
                  color="inherit"
                  startIcon={
                    <Icon
                      size={15}
                      color={
                        active
                          ? SECONDARY
                          : isDarkMode
                            ? NAV_ICON_COLORS[label]?.dark || PRIMARY
                            : NAV_ICON_COLORS[label]?.light || PRIMARY
                      }
                    />
                  }
                  sx={{
                    fontSize: "0.84rem",
                    fontWeight: active ? 700 : 600,
                    textTransform: "none",
                    borderRadius: "7px",
                    px: 1.4,
                    pb: 1.1,
                    minWidth: "auto",
                    color: isGradient ? undefined : active ? SECONDARY : text,
                    position: "relative",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "#f1f5f9",
                      color: isGradient
                        ? undefined
                        : active
                          ? SECONDARY
                          : PRIMARY,
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 4,
                      height: 2,
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                      backgroundSize: "220% 100%",
                      animation: active
                        ? "activeMenuLineShift 1.8s linear infinite"
                        : "none",
                      boxShadow: active
                        ? `0 0 10px ${PRIMARY}66, 0 0 16px ${SECONDARY}55`
                        : "none",
                      opacity: active ? 1 : 0,
                      transform: active ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "center",
                      transition: "opacity 0.25s ease, transform 0.25s ease",
                    },
                  }}
                >
                  {isGradient ? (
                    <span
                      style={{
                        background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </Button>
              );
            })}
          </Box>

          {/* ── Desktop right controls ── */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1.2,
              alignItems: "center",
            }}
          >
            {/* Theme toggle */}
            <IconButton
              onClick={toggleTheme}
              title={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              sx={{
                borderRadius: "8px",
                p: "8px",
                backgroundColor: themeBtnBg,
                color: isDarkMode ? "#fbbf24" : "#f59e0b",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.14)"
                    : "#e0e7ff",
                  transform: "rotate(20deg)",
                },
              }}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </IconButton>

            {isLoggedIn ? (
              <>
                {/* User chip */}
                <Box
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.1,
                    cursor: "pointer",
                    padding: "5px 12px",
                    borderRadius: "10px",
                    backgroundColor: userBoxBg,
                    border: `1px solid ${userBoxBdr}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: PRIMARY,
                      backgroundColor: isDarkMode
                        ? "rgba(97,197,195,0.08)"
                        : "#f0fffe",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: "0.82rem",
                      bgcolor: PRIMARY,
                      color: "#04121D",
                      fontWeight: 800,
                      boxShadow: "0 2px 6px rgba(97,197,195,0.25)",
                    }}
                  >
                    {avatarLetter}
                  </Avatar>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "0.83rem",
                        fontWeight: 700,
                        color: isDarkMode ? "#F1F5F9" : "#1e293b",
                        lineHeight: 1.2,
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: PRIMARY,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {authUser?.role || "Member"}
                    </Typography>
                  </Box>
                  <ChevronDown size={15} color={textMuted} />
                </Box>

                {/* User dropdown */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 220,
                      borderRadius: "12px",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                      border: `1px solid ${menuBorder}`,
                      p: "4px",
                      backgroundColor: menuBg,
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.4,
                      mb: 0.5,
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "#f8fafc",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: isDarkMode ? "#F1F5F9" : "#1e293b",
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Typography sx={{ fontSize: "0.73rem", color: textMuted }}>
                      {authUser?.email || "Signed in"}
                    </Typography>
                  </Box>

                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      navigate(getRoleDashboardPath(authUser?.role));
                    }}
                    sx={menuItemSx()}
                  >
                    <LayoutDashboard size={17} /> My Dashboard
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      navigate("/profile");
                    }}
                    sx={menuItemSx()}
                  >
                    <User size={17} /> Profile Settings
                  </MenuItem>

                  <Divider
                    sx={{
                      my: 0.8,
                      borderColor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : "#e5e7eb",
                    }}
                  />

                  <MenuItem onClick={handleLogout} sx={menuItemSx(true)}>
                    <LogOut size={17} /> Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  sx={{
                    borderRadius: "7px",
                    textTransform: "none",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    px: 2,
                    "&:hover": {
                      borderColor: PRIMARY,
                      backgroundColor: isDarkMode
                        ? "rgba(97,197,195,0.12)"
                        : "#e6f7f6",
                    },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    borderRadius: "7px",
                    textTransform: "none",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    backgroundColor: PRIMARY,
                    color: "#04121D",
                    px: 2,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#49b2b1",
                      boxShadow: "0 8px 20px rgba(97,197,195,0.25)",
                    },
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>

          {/* ── Mobile controls ── */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton
              onClick={toggleTheme}
              sx={{
                borderRadius: "8px",
                p: "7px",
                backgroundColor: themeBtnBg,
                color: isDarkMode ? "#fbbf24" : "#f59e0b",
                transition: "all 0.3s ease",
              }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>

            {isLoggedIn && (
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "0.73rem",
                  bgcolor: PRIMARY,
                  color: "#04121D",
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </Avatar>
            )}

            <IconButton
              onClick={(e) => setMobileMenu(e.currentTarget)}
              sx={{ color: text }}
            >
              <MenuIcon size={20} />
            </IconButton>

            {/* Mobile menu */}
            <Menu
              anchorEl={mobileMenu}
              open={Boolean(mobileMenu)}
              onClose={() => setMobileMenu(null)}
              PaperProps={{
                sx: {
                  backgroundColor: menuBg,
                  color: text,
                  minWidth: 200,
                  borderRadius: "12px",
                  border: `1px solid ${menuBorder}`,
                  p: "4px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                },
              }}
            >
              {navLinks.map(({ label, path, icon: Icon }) => {
                const active = isNavActive(path);
                const isGradient = label === "Request Any Data";
                return (
                  <MenuItem
                    key={label}
                    onClick={() => {
                      setMobileMenu(null);
                      if (isGradient) setRequestModalOpen(true);
                      else if (path) navigate(path);
                    }}
                    sx={{
                      borderRadius: "8px",
                      gap: 1.2,
                      fontSize: "0.87rem",
                      fontWeight: active || isGradient ? 700 : 500,
                      color: active ? SECONDARY : itemClr,
                      "&:hover": {
                        backgroundColor: itemHover,
                        color: active ? SECONDARY : PRIMARY,
                      },
                    }}
                  >
                    <Icon
                      size={15}
                      color={
                        active
                          ? SECONDARY
                          : isDarkMode
                            ? NAV_ICON_COLORS[label]?.dark || PRIMARY
                            : NAV_ICON_COLORS[label]?.light || PRIMARY
                      }
                    />
                    {isGradient ? (
                      <span
                        style={{
                          background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {label}
                      </span>
                    ) : (
                      label
                    )}
                  </MenuItem>
                );
              })}

              <Divider
                sx={{
                  my: 0.6,
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "#e5e7eb",
                }}
              />

              {isLoggedIn
                ? [
                    <MenuItem
                      key="dash"
                      onClick={() => {
                        setMobileMenu(null);
                        navigate(getRoleDashboardPath(authUser?.role));
                      }}
                      sx={{ ...menuItemSx(), borderRadius: "8px" }}
                    >
                      <LayoutDashboard size={15} /> My Dashboard
                    </MenuItem>,
                    <MenuItem
                      key="prof"
                      onClick={() => {
                        setMobileMenu(null);
                        navigate("/profile");
                      }}
                      sx={{ ...menuItemSx(), borderRadius: "8px" }}
                    >
                      <User size={15} /> Profile
                    </MenuItem>,
                    <MenuItem
                      key="out"
                      onClick={() => {
                        setMobileMenu(null);
                        handleLogout();
                      }}
                      sx={{ ...menuItemSx(true), borderRadius: "8px" }}
                    >
                      <LogOut size={15} /> Sign Out
                    </MenuItem>,
                  ]
                : [
                    <MenuItem
                      key="login"
                      onClick={() => {
                        setMobileMenu(null);
                        navigate("/login");
                      }}
                      sx={{
                        borderRadius: "8px",
                        color: PRIMARY,
                        fontWeight: 600,
                        "&:hover": { backgroundColor: itemHover },
                      }}
                    >
                      Sign In
                    </MenuItem>,
                    <MenuItem
                      key="reg"
                      onClick={() => {
                        setMobileMenu(null);
                        navigate("/register");
                      }}
                      sx={{
                        borderRadius: "8px",
                        color: PURPLE,
                        fontWeight: 600,
                        "&:hover": { backgroundColor: itemHover },
                      }}
                    >
                      Register
                    </MenuItem>,
                  ]}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Modal lives here, outside AppBar ── */}
      <RequestDataModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

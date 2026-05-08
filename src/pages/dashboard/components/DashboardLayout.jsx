import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Database,
  DollarSign,
  Settings,
  FileCheck,
  BarChart3,
  ShoppingCart,
  Heart,
  ListChecks,
  Package,
  Eye,
  Bookmark,
  History,
  FileText,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  User,
  Zap,
  Send,
  CreditCard,
  Wallet,
  TrendingUp,
  Globe,
  Building2,
} from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";
import logo from "../../../assets/logo.png";
import { authService } from "../../../utils/apiService";

const USER_KEY = "dali-user";

const roleNavItems = {
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/dashboard/admin/users", icon: Users },
    {
      label: "Organizations",
      href: "/dashboard/admin/organizations",
      icon: Building2,
    },
    { label: "Datasets", href: "/dashboard/admin/datasets", icon: Database },
    {
      label: "Advertisements",
      href: "/dashboard/admin/advertisements",
      icon: Zap,
    },
    { label: "Record Requests", href: "/dashboard/admin/requests", icon: Send },
    {
      label: "Subscriptions",
      href: "/dashboard/admin/subscriptions",
      icon: CreditCard,
    },
    { label: "Fund Requests", href: "/dashboard/admin/funds", icon: Wallet },
    { label: "Reports", href: "/dashboard/admin/reports", icon: FileText },
    {
      label: "Project Requests",
      href: "/dashboard/admin/projects",
      icon: Globe,
    },
    {
      label: "Finance Control",
      href: "/dashboard/admin/finance",
      icon: CreditCard,
    },
    { label: "Revenue", href: "/dashboard/admin/revenue", icon: DollarSign },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],
  editor: [
    { label: "Overview", href: "/dashboard/editor", icon: LayoutDashboard },
    {
      label: "Review Queue",
      href: "/dashboard/editor/reviews",
      icon: FileCheck,
    },
    {
      label: "Approvals",
      href: "/dashboard/editor/approvals",
      icon: ListChecks,
    },
    { label: "Moderation", href: "/dashboard/editor/moderation", icon: Eye },
    {
      label: "Record Requests",
      href: "/dashboard/editor/requests",
      icon: Send,
    },
    {
      label: "Subscriptions",
      href: "/dashboard/editor/subscriptions",
      icon: CreditCard,
    },
    { label: "Fund Requests", href: "/dashboard/editor/funds", icon: Wallet },
    {
      label: "Analysis Reports",
      href: "/dashboard/editor/reports",
      icon: FileText,
    },
    {
      label: "Project Requests",
      href: "/dashboard/editor/projects",
      icon: Globe,
    },
    {
      label: "Revenue Analytics",
      href: "/dashboard/editor/analytics",
      icon: TrendingUp,
    },
    { label: "Settings", href: "/dashboard/editor/settings", icon: Settings },
  ],
  seller: [
    { label: "Overview", href: "/dashboard/seller", icon: LayoutDashboard },
    {
      label: "Add Listing",
      href: "/dashboard/seller/add-listing",
      icon: FileCheck,
    },
    { label: "My Listings", href: "/dashboard/seller/listings", icon: Package },
    {
      label: "Orders & Sales",
      href: "/dashboard/seller/pending",
      icon: FileCheck,
    },
    {
      label: "Sales Analytics",
      href: "/dashboard/seller/analytics",
      icon: BarChart3,
    },
    { label: "Inventory", href: "/dashboard/seller/inventory", icon: Database },
    { label: "Advertisements", href: "/dashboard/seller/ads", icon: Zap },
    { label: "Transactions", href: "/dashboard/seller/finance", icon: Wallet },
    {
      label: "Opportunities",
      href: "/dashboard/seller/bids",
      icon: TrendingUp,
    },
    { label: "Customer Chats", href: "/dashboard/seller/chats", icon: Users },
  ],
  buyer: [
    { label: "Overview", href: "/dashboard/buyer", icon: LayoutDashboard },
    {
      label: "My Orders",
      href: "/dashboard/buyer/purchases",
      icon: ShoppingCart,
    },
    { label: "Custom Requests", href: "/dashboard/buyer/requests", icon: Send },
    { label: "Transactions", href: "/dashboard/buyer/finance", icon: Wallet },
    { label: "Wishlist", href: "/dashboard/buyer/wishlist", icon: Heart },
    {
      label: "Recommendations",
      href: "/dashboard/buyer/recommendations",
      icon: ListChecks,
    },
    {
      label: "Budget Tracker",
      href: "/dashboard/buyer/budget",
      icon: DollarSign,
    },
  ],
  viewer: [
    { label: "Overview", href: "/dashboard/viewer", icon: LayoutDashboard },
    {
      label: "Browse Datasets",
      href: "/dashboard/viewer/browse",
      icon: Database,
    },
    {
      label: "Recomended",
      href: "/dashboard/viewer/bookmarks",
      icon: Bookmark,
    },
    { label: "View History", href: "/dashboard/viewer/history", icon: History },
    { label: "Reports", href: "/dashboard/viewer/reports", icon: FileText },
  ],
};

/* Accent colors per role — used for active indicator & header stripe */
const roleAccents = {
  admin: { accent: "#5DCAA5", dim: "rgba(93,202,165,0.15)", badge: "#1D9E75" },
  editor: {
    accent: "#7F77DD",
    dim: "rgba(127,119,221,0.15)",
    badge: "#534AB7",
  },
  seller: { accent: "#EF9F27", dim: "rgba(239,159,39,0.15)", badge: "#BA7517" },
  buyer: { accent: "#85B7EB", dim: "rgba(133,183,235,0.15)", badge: "#185FA5" },
  viewer: {
    accent: "#ED93B1",
    dim: "rgba(237,147,177,0.15)",
    badge: "#993556",
  },
};

const roleTitles = {
  admin: "Admin Dashboard",
  editor: "Editor Dashboard",
  seller: "Seller Dashboard",
  buyer: "Buyer Dashboard",
  viewer: "Viewer Dashboard",
};

/* ─── Sidebar nav group labels ────────────────────────────────────── */
const roleGroups = {
  admin: [
    { heading: "Platform", items: [0, 1, 2, 3, 4] },
    { heading: "Operations", items: [5, 6, 7, 8, 9] },
    { heading: "Finance", items: [10, 11, 12] },
  ],
  editor: [
    { heading: "Content", items: [0, 1, 2, 3] },
    { heading: "Workflow", items: [4, 5, 6, 7, 8] },
    { heading: "Insights", items: [9, 10] },
  ],
  seller: [
    { heading: "Listings", items: [0, 1, 2] },
    { heading: "Sales", items: [3, 4, 5] },
    { heading: "Growth", items: [6, 7, 8, 9] },
  ],
  buyer: [
    { heading: "Shopping", items: [0, 1, 2] },
    { heading: "Finance", items: [3] },
    { heading: "Discover", items: [4, 5, 6] },
  ],
  viewer: [
    { heading: "Browse", items: [0, 1] },
    { heading: "Library", items: [2, 3, 4] },
  ],
};

export default function DashboardLayout({ children, role: propRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(USER_KEY) ||
          sessionStorage.getItem(USER_KEY) ||
          "null",
      );
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const themeColors = useThemeColors();

  const role = user?.role || propRole || "viewer";

  useEffect(() => {
    authService
      .me()
      .then((res) => {
        const u = res.data?.data || res.data;
        if (u) {
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        }
      })
      .catch(() => {});
  }, []);

  const navItems = roleNavItems[role] || roleNavItems.viewer;
  const groups = roleGroups[role] || roleGroups.viewer;
  const accent = roleAccents[role] || roleAccents.viewer;
  const title = roleTitles[role] || "Dashboard";

  const displayName = user?.full_name || user?.name || "User";
  const initials =
    displayName !== "User"
      ? displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : role[0].toUpperCase();

  const handleLogout = () => navigate("/logout");

  /* breadcrumb segment */
  const pathSegment = location.pathname.split("/").pop();
  const pageName = pathSegment
    ? pathSegment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Overview";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: themeColors.isDarkMode ? "#0D1117" : "#F4F6FA",
        color: themeColors.text,
        fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
        transition: "background 0.3s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .dd-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          color: rgba(203,213,225,0.75);
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
          position: relative;
          letter-spacing: 0.01em;
        }
        .dd-nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          transform: translateX(-2px);
        }
        .dd-nav-link.active {
          background: ${accent.dim};
          color: ${accent.accent};
          font-weight: 600;
        }
        .dd-nav-link.active .dd-icon-wrap {
          background: ${accent.dim};
          border-color: ${accent.accent}40;
        }
        .dd-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .dd-nav-link:hover .dd-icon-wrap {
          background: rgba(255,255,255,0.1);
        }
        .dd-group-heading {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.5);
          padding: 16px 14px 6px;
          user-select: none;
        }
        .dd-search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          font-family: inherit;
          width: 140px;
          transition: width 0.2s ease;
          color: inherit;
        }
        .dd-search-input::placeholder { color: rgba(148,163,184,0.5); }
        .dd-search-input:focus { width: 200px; }
        .dd-btn-icon {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(203,213,225,0.8);
          cursor: pointer;
          padding: 9px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .dd-btn-icon:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.18);
          color: #e2e8f0;
        }

        @media (min-width: 1024px) {
          .dd-sidebar { transform: translateX(0) !important; }
          .dd-main    { margin-right: 300px !important; }
          .dd-hamburger { display: none !important; }
        }
      `}</style>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="dd-sidebar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 50,
          height: "100%",
          width: 300,
          background: "linear-gradient(180deg, #131C2E 0%, #0D1117 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
            padding: "0 22px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <img
              src={logo}
              alt="DaliData"
              style={{ height: 32, width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* Role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accent.accent,
                background: accent.dim,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${accent.accent}30`,
              }}
            >
              {role}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="dd-btn-icon"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px 12px",
            scrollbarWidth: "none",
          }}
        >
          {groups.map((group) => (
            <div key={group.heading}>
              <div className="dd-group-heading">{group.heading}</div>
              {group.items.map((idx) => {
                const item = navItems[idx];
                if (!item) return null;
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`dd-nav-link${isActive ? " active" : ""}`}
                  >
                    <span className="dd-icon-wrap">
                      <Icon
                        size={16}
                        strokeWidth={2}
                        color={isActive ? accent.accent : "currentColor"}
                      />
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && (
                      <ChevronRight size={14} color={accent.accent} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: "14px 14px 18px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* User card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: accent.dim,
                border: `2px solid ${accent.accent}50`,
                color: accent.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "rgba(148,163,184,0.7)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  marginTop: 2,
                }}
              >
                {user?.email || `${role}@dalidata.com`}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setSidebarOpen(false);
                navigate("/profile");
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "9px 0",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                color: "rgba(203,213,225,0.85)",
                fontWeight: 500,
                transition: "all 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              <User size={14} /> Profile
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "9px 0",
                background: "rgba(226,29,72,0.08)",
                border: "1px solid rgba(226,29,72,0.2)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                color: "#f87171",
                fontWeight: 500,
                transition: "all 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="dd-main" style={{ transition: "margin 0.35s ease" }}>
        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: themeColors.isDarkMode
              ? "rgba(13,17,23,0.92)"
              : "rgba(244,246,250,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${themeColors.isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              height: 68,
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 32px",
            }}
          >
            {/* Left */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                className="dd-hamburger dd-btn-icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: accent.accent,
                    marginBottom: 1,
                  }}
                >
                  {role} Portal
                </div>
                <h1
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    margin: 0,
                    color: themeColors.isDarkMode ? "#F1F5F9" : "#0F172A",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {title}
                </h1>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Search */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 14px",
                  background: themeColors.isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                  border: `1px solid ${
                    searchFocused
                      ? accent.accent + "60"
                      : themeColors.isDarkMode
                        ? "rgba(255,255,255,0.09)"
                        : "rgba(0,0,0,0.1)"
                  }`,
                  borderRadius: 10,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: searchFocused
                    ? `0 0 0 3px ${accent.accent}18`
                    : "none",
                }}
              >
                <Search
                  size={15}
                  color={
                    themeColors.isDarkMode
                      ? "rgba(148,163,184,0.6)"
                      : "rgba(100,116,139,0.7)"
                  }
                />
                <input
                  className="dd-search-input"
                  placeholder="Search..."
                  style={{
                    color: themeColors.isDarkMode ? "#CBD5E1" : "#334155",
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>

              {/* Notifications */}
              <button
                className="dd-btn-icon"
                style={{
                  color: themeColors.isDarkMode
                    ? "rgba(203,213,225,0.7)"
                    : "rgba(51,65,85,0.8)",
                  background: themeColors.isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                  border: `1px solid ${themeColors.isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}`,
                  position: "relative",
                }}
              >
                <Bell size={18} />
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: accent.accent,
                    border: `2px solid ${themeColors.isDarkMode ? "#0D1117" : "#F4F6FA"}`,
                  }}
                />
              </button>

              {/* Avatar */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: accent.dim,
                  border: `2px solid ${accent.accent}50`,
                  color: accent.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onClick={() => navigate("/profile")}
              >
                {initials}
              </div>
            </div>
          </div>

          {/* Breadcrumb bar */}
          <div
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              padding: "0 32px",
              borderTop: `1px solid ${themeColors.isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}`,
              background: themeColors.isDarkMode
                ? "rgba(255,255,255,0.015)"
                : "rgba(0,0,0,0.015)",
              gap: 8,
            }}
          >
            <Link
              to={`/dashboard/${role}`}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: themeColors.isDarkMode
                  ? "rgba(148,163,184,0.7)"
                  : "rgba(100,116,139,0.8)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "color 0.15s ease",
              }}
            >
              <LayoutDashboard size={12} />
              Dashboard
            </Link>
            <ChevronRight size={12} color="rgba(148,163,184,0.4)" />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: themeColors.isDarkMode
                  ? "rgba(148,163,184,0.7)"
                  : "rgba(100,116,139,0.8)",
                textTransform: "capitalize",
              }}
            >
              {role}
            </span>
            <ChevronRight size={12} color="rgba(148,163,184,0.4)" />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: accent.accent,
              }}
            >
              {pageName}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            padding: "36px 40px",
            maxWidth: 1600,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: themeColors.isDarkMode ? "#0D1117" : "#F4F6FA",
            minHeight: "calc(100vh - 108px)",
            transition: "background 0.3s ease",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

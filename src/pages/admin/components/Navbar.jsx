import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaUnlockAlt,
  FaSatellite,
} from "react-icons/fa";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import axios from "axios";

function getDashboardPath(role) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  switch (normalizedRole) {
    case "super_admin":
    case "admin":
      return "/settings/admin-dashboard";
    case "reviewer":
      return "/editor/dashboard";
    case "seller":
      return "/seller/dashboard";
    case "viewer":
      return "/viewer/dashboard";
    case "buyer":
    default:
      return "/dashboard";
  }
}

export default function Navbar({ isMobile, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000";

  const TOKEN_KEY = "dali-token";
  const USER_KEY = "dali-user";
  const CHECK_INTERVAL_MS = 1 * 60 * 1000;

  const companyName = "DALI DATA PORTAL";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  );

  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const notifPollRef = useRef(null);
  const authPollRef = useRef(null);

  const clearAllAuth = useCallback(() => {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    });

    setToken(null);
    setUser(null);
    setNotifCount(0);
    window.dispatchEvent(new Event("auth:updated"));
  }, []);

  const redirectToLogout = useCallback(() => {
    if (location.pathname !== "/logout") {
      navigate("/logout", { replace: true });
    }
  }, [navigate, location.pathname]);

  const forceLogout = useCallback(() => {
    clearAllAuth();
    redirectToLogout();
  }, [clearAllAuth, redirectToLogout]);

  const syncAuth = useCallback(() => {
    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    setToken(currentToken);

    const storedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    syncAuth();
    window.addEventListener("auth:updated", syncAuth);
    return () => window.removeEventListener("auth:updated", syncAuth);
  }, [syncAuth]);

  const axiosAuth = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      timeout: 8000,
    });

    instance.interceptors.request.use((config) => {
      const currentToken =
        localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }

      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          clearAllAuth();
          if (window.location.pathname !== "/logout") {
            window.location.replace("/logout");
          }
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }, [API_BASE, clearAllAuth]);

  const validateAuth = useCallback(async () => {
    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    const storedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (!currentToken || !storedUser) {
      forceLogout();
      return false;
    }

    let parsedStoredUser = null;

    try {
      parsedStoredUser = JSON.parse(storedUser);
    } catch {
      forceLogout();
      return false;
    }

    if (!parsedStoredUser?.email) {
      forceLogout();
      return false;
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
        timeout: 8000,
      });

      if (!res?.data?.id) {
        forceLogout();
        return false;
      }

      const storage = localStorage.getItem(TOKEN_KEY)
        ? localStorage
        : sessionStorage;

      storage.setItem(USER_KEY, JSON.stringify(res.data));
      setUser(res.data);
      setToken(currentToken);
      return true;
    } catch {
      forceLogout();
      return false;
    }
  }, [API_BASE, forceLogout]);

  const fetchUnreadCount = useCallback(async () => {
    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    const storedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (!currentToken || !storedUser) {
      forceLogout();
      return;
    }

    if (!user?.id) return;
    if (location.pathname === "/logout") return;

    setNotifLoading(true);

    try {
      const res = await axiosAuth.get("/notifications");
      const rows = Array.isArray(res.data) ? res.data : [];

      const unread = rows.filter(
        (item) =>
          Number(item?.user_id) === Number(user.id) &&
          item?.deleted_date == null &&
          (item?.read_status === false ||
            item?.read_status === 0 ||
            item?.read_status === "0"),
      ).length;

      setNotifCount(unread);
    } catch {
      setNotifCount(0);
    } finally {
      setNotifLoading(false);
    }
  }, [axiosAuth, user?.id, location.pathname, forceLogout]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (location.pathname === "/logout") {
        if (mounted) setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      await validateAuth();
      if (mounted) setAuthChecking(false);
    };

    run();

    return () => {
      mounted = false;
    };
  }, [validateAuth, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/logout") return;

    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    const storedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (!currentToken || !storedUser) {
      forceLogout();
      return;
    }

    if (authPollRef.current) clearInterval(authPollRef.current);

    authPollRef.current = setInterval(async () => {
      await validateAuth();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (authPollRef.current) clearInterval(authPollRef.current);
    };
  }, [validateAuth, location.pathname, forceLogout]);

  useEffect(() => {
    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    const storedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (location.pathname === "/logout") return;

    if (!currentToken || !storedUser) {
      forceLogout();
      return;
    }

    if (!user?.id) return;

    fetchUnreadCount();

    if (notifPollRef.current) clearInterval(notifPollRef.current);

    notifPollRef.current = setInterval(fetchUnreadCount, CHECK_INTERVAL_MS);

    return () => {
      if (notifPollRef.current) clearInterval(notifPollRef.current);
    };
  }, [fetchUnreadCount, user?.id, location.pathname, forceLogout]);

  useEffect(() => {
    const onStorage = () => {
      const currentToken =
        localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

      const storedUser =
        localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

      if (!currentToken || !storedUser) {
        forceLogout();
      } else {
        syncAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [forceLogout, syncAuth]);

  const handleLogout = () => {
    forceLogout();
  };

  const displayName = user?.full_name?.trim() || user?.email || "Guest";

  const homePath = getDashboardPath(user?.role);

  if (authChecking && location.pathname !== "/logout") return null;

  return (
    <nav
      className="navbar navbar-expand-lg fixed-top shadow-sm"
      style={{ backgroundColor: "#04121D", minHeight: 56, zIndex: 1030 }}
    >
      <style>{`
        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          transition: all .15s ease;
          flex-shrink: 0;
          text-decoration: none;
        }

        .icon-btn:hover {
          background: rgba(255,255,255,.08);
          transform: translateY(-1px);
          color: #fff;
        }

        .satellite-orbit {
          display: inline-flex;
          align-items: center;
          animation: satelliteSpin 4s linear infinite;
        }

        .notif-ring {
          animation: notifPulse 1.6s ease-in-out infinite;
        }

        @keyframes satelliteSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes notifPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="container-fluid d-flex justify-content-between align-items-center px-2">
        <div className="d-flex align-items-center gap-2">
          {(isMobile ?? true) && (
            <button
              className="icon-btn"
              onClick={onToggleSidebar}
              type="button"
            >
              <FaBars size={18} />
            </button>
          )}

          <Link
            to={homePath}
            className="navbar-brand d-flex align-items-center text-white text-decoration-none gap-2 m-0"
          >
            <span className="satellite-orbit">
              <FaSatellite size={20} color="#0492C2" />
            </span>
            <span
              className="fw-bold d-none d-md-inline"
              style={{ fontSize: "1.1rem" }}
            >
              {companyName}
            </span>
          </Link>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/notifications"
            className="icon-btn position-relative"
            style={{ opacity: !token ? 0.6 : 1 }}
            title={notifLoading ? "Loading notifications..." : "Notifications"}
          >
            <FaBell className={notifCount > 0 ? "notif-ring" : ""} />
            {notifCount > 0 && (
              <span
                className="badge position-absolute"
                style={{
                  top: 2,
                  right: 2,
                  background: "#0492C2",
                  fontSize: 9,
                  minWidth: 16,
                  height: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  padding: 0,
                }}
              >
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>

          <Link
            to="/settings/profile"
            className="d-flex align-items-center gap-2 text-white text-decoration-none"
          >
            {user?.photo ? (
              <img
                src={`${API_BASE}${user.photo}`}
                alt="profile"
                className="rounded-circle"
                style={{ width: 30, height: 30, objectFit: "cover" }}
              />
            ) : (
              <FaUserCircle size={28} />
            )}
            <span className="d-none d-sm-inline" style={{ fontSize: "0.9rem" }}>
              {displayName}
            </span>
          </Link>

          <button className="icon-btn" onClick={handleLogout} type="button">
            <FaUnlockAlt size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}

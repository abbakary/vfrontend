import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../assets/logo.png";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Database,
  ShoppingCart,
  FileBarChart2,
  ArrowLeftRight,
  Coins,
} from "lucide-react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

import { getDashboardPath } from "../utils/roleRedirect";
import { useThemeColors } from "../utils/useThemeColors";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";
const USER_KEY = "dali-user";

const PRIMARY = "#61C5C3";
const SECONDARY = "#F58A24";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/* ─── Left-panel value tips ─── */
const VALUE_TIPS = [
  {
    icon: <Database size={17} color="#F68822" strokeWidth={2} />,
    title: "Turn data into cash",
    desc: "Upload your datasets and start earning from buyers across Africa instantly.",
  },
  {
    icon: <ShoppingCart size={17} color="#F68822" strokeWidth={2} />,
    title: "Stop overspending on research",
    desc: "Access ready-made market data and cut research costs dramatically.",
  },
  {
    icon: <FileBarChart2 size={17} color="#F68822" strokeWidth={2} />,
    title: "Buy insights that matter",
    desc: "Get powerful reports that drive high-stakes business and investment decisions.",
  },
  {
    icon: <ArrowLeftRight size={17} color="#F68822" strokeWidth={2} />,
    title: "Win in cross-border trade",
    desc: "Leverage real trade data to price smarter and move faster across markets.",
  },
  {
    icon: <Coins size={17} color="#F68822" strokeWidth={2} />,
    title: "Unlock funding opportunities",
    desc: "Find active grants, funds, and investors looking for projects like yours.",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { isDarkMode, text, textMuted, border, teal } = useThemeColors();
  const ACCENT = teal;

  /* ── theme tokens ── */
  const panelBg = "rgba(7,26,41,0.94)";
  const cardBg = isDarkMode ? "rgba(7,26,41,0.96)" : "#ffffff";
  const cardText = isDarkMode ? "#fff" : text;
  const cardMuted = isDarkMode ? "rgba(255,255,255,0.65)" : textMuted;
  const inputBg = isDarkMode ? "rgba(4,18,29,0.85)" : "#fafafa";
  const inputText = isDarkMode ? "#fff" : text;
  const inputLbl = isDarkMode ? "rgba(255,255,255,0.80)" : textMuted;
  const inputBdr = isDarkMode ? "rgba(255,255,255,0.20)" : border;

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: inputLbl },
    "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
    "& .MuiOutlinedInput-root": {
      color: inputText,
      borderRadius: 2,
      backgroundColor: inputBg,
      "& input": { color: inputText },
      "& fieldset": { borderColor: inputBdr },
      "&:hover fieldset": { borderColor: "rgba(94,196,195,0.70)" },
      "&.Mui-focused fieldset": { borderColor: ACCENT },
    },
    "& .MuiFormHelperText-root": { color: cardMuted },
  };

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (severity, message) => {
    setToastState({ open: true, severity, message });
  };

  const closeToast = (_, reason) => {
    if (reason === "clickaway") return;
    setToastState((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const token =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const user =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!token || !user) return;
    try {
      navigate(getDashboardPath(JSON.parse(user)?.role), { replace: true });
    } catch {}
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const clearStoredAuth = () => {
    [TOKEN_KEY, USER_KEY].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      showToast("error", "Email is required");
      return false;
    }
    if (!form.password.trim()) {
      showToast("error", "Password is required");
      return false;
    }
    if (form.password.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return false;
    }
    if (form.password.length > 72) {
      showToast("error", "Password must not exceed 72 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const email = form.email.trim().toLowerCase();
      const { data } = await api.post("/auth/login", {
        email,
        password: form.password,
      });
      const token = data?.access_token;
      if (!token) throw new Error("No access token returned");
      clearStoredAuth();
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, token);
      let meData = null;
      try {
        const me = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        meData = me?.data || null;
      } catch {
        meData = { email, role: "viewer", status: "pending" };
      }
      storage.setItem(USER_KEY, JSON.stringify(meData));
      window.dispatchEvent(new Event("auth:updated"));
      showToast("success", "Welcome to DALI Data Portal");
      navigate(getDashboardPath(meData?.role), { replace: true });
    } catch (err) {
      showToast(
        "error",
        err?.response?.data?.detail ||
          err?.message ||
          "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="279879910537-d6nkoal0vk1j9so0l441vacl2g8nd34p.apps.googleusercontent.com">
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

        .login-root {
          min-height: 100vh; width: 100%; background: ${isDarkMode ? "#020c14" : "#f0f4f8"};
          display: flex; align-items: center; justify-content: center;
          padding: 32px 24px; font-family: 'Poppins', sans-serif;
          position: relative; overflow: hidden; animation: lgFadeIn 0.45s ease;
        }
        .login-orb {
          position: absolute; border-radius: 999px; filter: blur(80px);
          pointer-events: none; animation: lgFloat 9s ease-in-out infinite;
        }
        .login-orb-1 { width:420px;height:420px;top:-120px;left:-110px;background:${PRIMARY};opacity:.08; }
        .login-orb-2 { width:340px;height:340px;right:-90px;bottom:-90px;background:${SECONDARY};opacity:.08;animation-delay:1.5s; }
        .login-orb-3 { width:220px;height:220px;left:44%;top:62%;background:${PRIMARY};opacity:.05;animation-delay:3.2s; }
        .login-grid {
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(97,197,195,.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(97,197,195,.028) 1px,transparent 1px);
          background-size:48px 48px;
        }
        @keyframes lgFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lgFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(22px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

        <div className="login-root">
          <div className="login-orb login-orb-1" />
          <div className="login-orb login-orb-2" />
          <div className="login-orb login-orb-3" />
          <div className="login-grid" />

          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth: 960,
              borderRadius: 4,
              overflow: "hidden",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              boxShadow: "0 32px 90px rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* ══════════════════════════════════════
   {/* ══════════════════════════════════════
    LEFT — Value Tips  (50%)
══════════════════════════════════════ */}
            <Box
              sx={{
                width: { xs: "100%", md: "50%" },
                bgcolor: "rgba(7,26,41,0.94)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                p: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity: 0,
                animation: "fadeUp 0.7s ease forwards",
                animationDelay: "0.08s",
              }}
            >
              <Typography
                sx={{
                  color: "#62C6C4",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  mb: 0.6,
                }}
              >
                Why DALI?
              </Typography>
              <Typography
                sx={{ color: "rgba(98,198,196,0.55)", fontSize: 11.5, mb: 3.5 }}
              >
                Earn & save money through African data
              </Typography>

              {VALUE_TIPS.map(({ icon, title, desc }, i) => (
                <Box
                  key={title}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.6,
                    mb: i < VALUE_TIPS.length - 1 ? 2.6 : 0,
                    opacity: 0,
                    animation: "fadeUp 0.6s ease forwards",
                    animationDelay: `${0.18 + i * 0.07}s`,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      flexShrink: 0,
                      mt: "1px",
                      bgcolor: "rgba(246,136,34,0.12)",
                      border: "1.5px solid rgba(246,136,34,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        color: "#62C6C4",
                        fontSize: 13,
                        fontWeight: 800,
                        lineHeight: 1.3,
                        mb: 0.3,
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(98,198,196,0.55)",
                        fontSize: 11,
                        lineHeight: 1.55,
                      }}
                    >
                      {desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* ══════════════════════════════════════
              RIGHT — Login form  (50%)
          ══════════════════════════════════════ */}
            <Box
              sx={{
                width: { xs: "100%", md: "50%" },
                bgcolor: cardBg,
                p: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {/* Logo */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  mb: 2.5,
                  opacity: 0,
                  animation: "fadeUp 0.7s ease forwards",
                  animationDelay: "0.10s",
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Dali Data"
                  sx={{
                    height: 48,
                    objectFit: "contain",
                    mb: 1,
                    filter: isDarkMode
                      ? "drop-shadow(0 8px 18px rgba(0,0,0,0.4))"
                      : "drop-shadow(0 8px 18px rgba(0,0,0,0.15))",
                  }}
                />
                <Typography
                  sx={{
                    color: cardText,
                    fontSize: 19,
                    fontWeight: 950,
                    lineHeight: 1.2,
                  }}
                >
                  Sign in
                </Typography>
                <Typography sx={{ color: cardMuted, fontSize: 12, mt: 0.5 }}>
                  Access your DALI account to buy and sell data, explore
                  projects and funds, and review trade analysis reports.
                </Typography>
              </Box>

              <Divider
                sx={{
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(15,23,42,0.08)",
                  mb: 2,
                }}
              />

              {/* Form */}
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  opacity: 0,
                  animation: "fadeUp 0.7s ease forwards",
                  animationDelay: "0.18s",
                }}
              >
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={17} color={ACCENT} />
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={17} color={ACCENT} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPw((p) => !p)}
                          edge="end"
                          sx={{ color: ACCENT }}
                        >
                          {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 0.2,
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.remember}
                        onChange={handleChange}
                        name="remember"
                        sx={{
                          color: cardMuted,
                          "&.Mui-checked": { color: ACCENT },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: 13, color: cardText }}>
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    underline="none"
                    sx={{ color: ACCENT, fontWeight: 900, fontSize: 13.5 }}
                  >
                    Forgot?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 0.5,
                    height: 46,
                    borderRadius: 2.5,
                    fontWeight: 950,
                    textTransform: "none",
                    bgcolor: ACCENT,
                    color: "#04121D",
                    boxShadow: "0 12px 28px rgba(94,196,195,0.22)",
                    "&:hover": { bgcolor: "#49b2b1" },
                    "&.Mui-disabled": {
                      bgcolor: "rgba(94,196,195,0.45)",
                      color: "#04121D",
                    },
                  }}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>

                <Typography
                  sx={{
                    textAlign: "center",
                    fontSize: 12.5,
                    color: cardMuted,
                    mt: 0.5,
                  }}
                >
                  Don't have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/register"
                    underline="none"
                    sx={{ color: ACCENT, fontWeight: 800 }}
                  >
                    Create one
                  </Link>
                </Typography>

                <Typography
                  sx={{
                    textAlign: "center",
                    mt: 0.5,
                    fontSize: 11,
                    opacity: 0.55,
                    color: cardMuted,
                  }}
                >
                  © {new Date().getFullYear()} Dali Data Portal
                </Typography>

                {/* Google Login Button */}
                <Divider sx={{ my: 2 }}>or</Divider>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      if (!credentialResponse.credential) {
                        showToast(
                          "error",
                          "Google login failed: No credential",
                        );
                        return;
                      }
                      setLoading(true);
                      try {
                        const { data } = await api.post("/auth/google-login", {
                          id_token: credentialResponse.credential,
                        });
                        const token = data?.access_token;
                        if (!token) throw new Error("No access token returned");
                        clearStoredAuth();
                        localStorage.setItem(TOKEN_KEY, token);
                        let meData = null;
                        try {
                          const me = await api.get("/auth/me", {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          meData = me?.data || null;
                        } catch {
                          meData = { role: "viewer", status: "active" };
                        }
                        localStorage.setItem(USER_KEY, JSON.stringify(meData));
                        window.dispatchEvent(new Event("auth:updated"));
                        showToast("success", "Welcome to DALI Data Portal");
                        navigate(getDashboardPath(meData?.role), {
                          replace: true,
                        });
                      } catch (err) {
                        showToast(
                          "error",
                          err?.response?.data?.detail ||
                            err?.message ||
                            "Google login failed",
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={() => {
                      showToast("error", "Google login failed");
                    }}
                    width="100%"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </div>

        <Snackbar
          open={toastState.open}
          autoHideDuration={3000}
          onClose={closeToast}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={closeToast}
            severity={toastState.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toastState.message}
          </Alert>
        </Snackbar>
      </>
    </GoogleOAuthProvider>
  );
}

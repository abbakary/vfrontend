import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import logo from "../assets/logo.png";

import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Hash,
} from "lucide-react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import { useThemeColors } from "../utils/useThemeColors";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const INFO_STEPS = [
  {
    icon: <Hash size={17} color="#F68822" strokeWidth={2} />,
    title: "Enter your 6-digit code",
    desc: "Check the email we sent you and copy the code here",
  },
  {
    icon: <KeyRound size={17} color="#F68822" strokeWidth={2} />,
    title: "Choose a strong password",
    desc: "At least 8 characters with a mix of letters and numbers",
  },
  {
    icon: <ShieldCheck size={17} color="#F68822" strokeWidth={2} />,
    title: "Avoid reusing passwords",
    desc: "Use a password you haven't used on any other site",
  },
  {
    icon: <Lock size={17} color="#F68822" strokeWidth={2} />,
    title: "Keep it private",
    desc: "Never share your password with anyone, including support staff",
  },
  {
    icon: <CheckCircle2 size={17} color="#F68822" strokeWidth={2} />,
    title: "You're all set",
    desc: "After resetting, sign in with your new credentials immediately",
  },
];

// Password strength utility
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "transparent",
    "#e53935",
    "#FB8C00",
    "#F9A825",
    "#43A047",
    "#00897B",
  ];
  return {
    score,
    label: labels[score] || "Very Strong",
    color: colors[score] || "#00897B",
  };
};

const RULES = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "No more than 72 characters",
    test: (pw) => pw.length > 0 && pw.length <= 72,
  },
];

// How many seconds to wait on the success screen before auto-redirecting
const REDIRECT_DELAY = 4;

export default function NewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, text, textMuted, border, teal } = useThemeColors();
  const ACCENT = teal;

  // Email is passed via router state from ForgotPasswordPage
  const emailFromState = location.state?.email || "";

  const leftBg = isDarkMode ? "rgba(4,18,29,0.97)" : "#04121D";
  const stepTitle = "#62C6C4";
  const stepDesc = "rgba(98,198,196,0.55)";
  const stepIconBg = "rgba(246,136,34,0.12)";
  const stepIconBdr = "rgba(246,136,34,0.35)";

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

  const [form, setForm] = useState({
    email: emailFromState,
    otp: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const [toastState, setToastState] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (severity, message) =>
    setToastState({ open: true, severity, message });

  const closeToast = (_, reason) => {
    if (reason === "clickaway") return;
    setToastState((prev) => ({ ...prev, open: false }));
  };

  const strength = getStrength(form.password);

  // Warn if no email was passed in from ForgotPassword page
  useEffect(() => {
    if (!emailFromState) {
      showToast(
        "warning",
        "No email detected. Please enter it manually or go back.",
      );
    }
  }, [emailFromState]);

  // Auto-redirect countdown after successful reset
  useEffect(() => {
    if (!done) return;
    if (countdown <= 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [done, countdown, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // OTP field: only allow digits, max 6 chars
    if (name === "otp") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setForm((p) => ({ ...p, otp: digits }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const allRulesPassed = RULES.every((r) => r.test(form.password));
  const passwordsMatch =
    form.password && form.confirm && form.password === form.confirm;
  const otpComplete = form.otp.length === 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) return showToast("error", "Email is required");
    if (!emailRegex.test(email))
      return showToast("error", "Enter a valid email address");
    if (!otpComplete)
      return showToast(
        "error",
        "Please enter the 6-digit code from your email",
      );
    if (!form.password)
      return showToast("error", "Please enter a new password");
    if (!allRulesPassed)
      return showToast("error", "Password does not meet the requirements");
    if (!form.confirm)
      return showToast("error", "Please confirm your password");
    if (form.password !== form.confirm)
      return showToast("error", "Passwords do not match");

    try {
      setLoading(true);
      await api.post("/auth/reset-password", {
        email,
        otp: form.otp,
        new_password: form.password,
      });

      // Clear any stale auth token — server has already set is_login=False
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      setDone(true);
      setCountdown(REDIRECT_DELAY);
      showToast("success", "Password updated! Redirecting to login…");
    } catch (err) {
      const detail = err?.response?.data?.detail;

      // Provide clearer messages for known backend error strings
      const friendlyMessages = {
        "No active reset code found. Please request a new one.":
          "No active code found. Please request a new reset code.",
        "Reset code has expired (30 minutes). Please request a new one.":
          "Your code has expired. Please go back and request a new one.",
        "Invalid reset code.":
          "That code is incorrect. Double-check the email and try again.",
        "User with this email was not found":
          "We couldn't find an account with that email address.",
      };

      showToast(
        "error",
        friendlyMessages[detail] ||
          detail ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDarkMode ? "#020c14" : "#f0f4f8",
        fontFamily: "'Poppins', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        "@keyframes fadeUp": {
          "0%": { opacity: 0, transform: "translateY(22px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes fadeIn": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        animation: "fadeIn 0.45s ease",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 940,
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          boxShadow: isDarkMode
            ? "0 28px 64px rgba(0,0,0,0.65)"
            : "0 28px 64px rgba(0,0,0,0.18)",
        }}
      >
        {/* LEFT */}
        <Box
          sx={{
            width: { xs: "100%", md: "42%" },
            bgcolor: leftBg,
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
            New Password
          </Typography>
          <Typography
            sx={{ color: "rgba(98,198,196,0.55)", fontSize: 11.5, mb: 3.5 }}
          >
            Secure your account with a fresh password
          </Typography>

          {INFO_STEPS.map(({ icon, title, desc }, i) => (
            <Box
              key={title}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.6,
                mb: i < INFO_STEPS.length - 1 ? 2.6 : 0,
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
                  bgcolor: stepIconBg,
                  border: `1.5px solid ${stepIconBdr}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: "1px",
                }}
              >
                {icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: stepTitle,
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    mb: 0.3,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{ color: stepDesc, fontSize: 11, lineHeight: 1.55 }}
                >
                  {desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            width: { xs: "100%", md: "58%" },
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
              alt="Dali Portal"
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
              {done ? "Password Updated!" : "Set New Password"}
            </Typography>
            <Typography sx={{ color: cardMuted, fontSize: 12, mt: 0.5 }}>
              {done
                ? `Redirecting to login in ${countdown}s…`
                : "Enter the 6-digit code from your email, then choose a new password."}
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

          {!done ? (
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                opacity: 0,
                animation: "fadeUp 0.7s ease forwards",
                animationDelay: "0.18s",
              }}
            >
              {/* Email — pre-filled from router state, still editable */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                sx={textFieldSx}
              />

              {/* 6-digit OTP */}
              <TextField
                fullWidth
                label="6-Digit Reset Code"
                name="otp"
                type="text"
                inputMode="numeric"
                value={form.otp}
                onChange={handleChange}
                placeholder="e.g. 048271"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Hash
                        size={17}
                        color={otpComplete ? ACCENT : cardMuted}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: otpComplete ? (
                    <InputAdornment position="end">
                      <CheckCircle2 size={16} color={ACCENT} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  ...textFieldSx,
                  "& .MuiOutlinedInput-root": {
                    ...textFieldSx["& .MuiOutlinedInput-root"],
                    "& input": {
                      ...textFieldSx["& .MuiOutlinedInput-root"]["& input"],
                      fontFamily: "'Courier New', monospace",
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "0.3em",
                    },
                    "& fieldset": {
                      borderColor: otpComplete
                        ? ACCENT
                        : form.otp.length > 0
                          ? "rgba(94,196,195,0.45)"
                          : inputBdr,
                    },
                  },
                }}
                helperText={
                  form.otp.length > 0 && !otpComplete
                    ? `${6 - form.otp.length} digit${6 - form.otp.length !== 1 ? "s" : ""} remaining`
                    : ""
                }
              />

              {/* New Password */}
              <TextField
                fullWidth
                label="New Password"
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

              {/* Strength bar */}
              {form.password && (
                <Box sx={{ px: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(strength.score / 5) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: strength.color,
                        borderRadius: 2,
                        transition: "all 0.4s ease",
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: strength.color,
                      mt: 0.4,
                      fontWeight: 700,
                    }}
                  >
                    {strength.label}
                  </Typography>
                </Box>
              )}

              {/* Rules checklist */}
              {form.password && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                  {RULES.map(({ label, test }) => {
                    const passed = test(form.password);
                    return (
                      <Box
                        key={label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          px: 1,
                          py: 0.3,
                          borderRadius: 1.5,
                          bgcolor: passed
                            ? "rgba(94,196,195,0.10)"
                            : isDarkMode
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.04)",
                          border: `1px solid ${
                            passed ? "rgba(94,196,195,0.35)" : inputBdr
                          }`,
                          transition: "all 0.25s ease",
                        }}
                      >
                        {passed ? (
                          <CheckCircle2 size={11} color={ACCENT} />
                        ) : (
                          <XCircle size={11} color={cardMuted} />
                        )}
                        <Typography
                          sx={{
                            fontSize: 10,
                            color: passed ? ACCENT : cardMuted,
                            fontWeight: 600,
                          }}
                        >
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Confirm Password */}
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={handleChange}
                error={!!form.confirm && !passwordsMatch}
                helperText={
                  form.confirm && !passwordsMatch
                    ? "Passwords do not match"
                    : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock
                        size={17}
                        color={
                          passwordsMatch
                            ? ACCENT
                            : form.confirm
                              ? "#e53935"
                              : ACCENT
                        }
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm((p) => !p)}
                        edge="end"
                        sx={{ color: ACCENT }}
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  ...textFieldSx,
                  "& .MuiOutlinedInput-root": {
                    ...textFieldSx["& .MuiOutlinedInput-root"],
                    "& fieldset": {
                      borderColor:
                        form.confirm && !passwordsMatch
                          ? "#e53935"
                          : passwordsMatch
                            ? ACCENT
                            : inputBdr,
                    },
                  },
                }}
              />

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
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </Box>
          ) : (
            /* ── Success state ── */
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                py: 2,
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "rgba(94,196,195,0.12)",
                  border: `2px solid rgba(94,196,195,0.40)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={28} color={ACCENT} />
              </Box>

              <Typography
                sx={{ color: cardText, fontWeight: 800, fontSize: 15 }}
              >
                Password updated!
              </Typography>

              <Typography
                sx={{
                  color: cardMuted,
                  fontSize: 12,
                  textAlign: "center",
                  maxWidth: 300,
                }}
              >
                Your password has been reset successfully. Redirecting to login
                in{" "}
                <Box
                  component="span"
                  sx={{ color: ACCENT, fontWeight: 800, fontSize: 13 }}
                >
                  {countdown}s
                </Box>
                …
              </Typography>

              {/* Progress bar draining down to zero */}
              <LinearProgress
                variant="determinate"
                value={(countdown / REDIRECT_DELAY) * 100}
                sx={{
                  width: "100%",
                  maxWidth: 280,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: ACCENT,
                    borderRadius: 2,
                    transition: "transform 1s linear",
                  },
                }}
              />

              <Button
                onClick={() => navigate("/login")}
                sx={{
                  mt: 1,
                  height: 44,
                  borderRadius: 2.5,
                  fontWeight: 950,
                  textTransform: "none",
                  bgcolor: ACCENT,
                  color: "#04121D",
                  px: 4,
                  "&:hover": { bgcolor: "#49b2b1" },
                }}
              >
                Go to Sign In Now
              </Button>
            </Box>
          )}

          <Divider
            sx={{
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.10)"
                : "rgba(15,23,42,0.08)",
              my: 2,
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              underline="none"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                color: ACCENT,
                fontWeight: 800,
                fontSize: 13,
                "&:hover": { opacity: 0.8 },
              }}
            >
              <ArrowLeft size={15} />
              Request a new code
            </Link>
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              opacity: 0.65,
              color: cardMuted,
              textAlign: "center",
              mt: 1.5,
            }}
          >
            © {new Date().getFullYear()} Dali Portal
          </Typography>
        </Box>
      </Paper>

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
    </Box>
  );
}

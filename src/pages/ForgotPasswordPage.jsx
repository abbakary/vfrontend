import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../assets/logo.png";

import {
  Mail,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Clock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  Divider,
  Paper,
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
    icon: <Mail size={17} color="#F68822" strokeWidth={2} />,
    title: "Enter your email",
    desc: "Provide the email address linked to your Dali Portal account",
  },
  {
    icon: <ShieldCheck size={17} color="#F68822" strokeWidth={2} />,
    title: "Check your inbox",
    desc: "We'll send a 6-digit reset code to your email address",
  },
  {
    icon: <KeyRound size={17} color="#F68822" strokeWidth={2} />,
    title: "Enter the code",
    desc: "Use the 6-digit code to verify your identity and set a new password",
  },
  {
    icon: <Clock size={17} color="#F68822" strokeWidth={2} />,
    title: "Code expires in 30 min",
    desc: "Request a new code if yours expires before you use it",
  },
  {
    icon: <RefreshCw size={17} color="#F68822" strokeWidth={2} />,
    title: "Back to normal",
    desc: "Sign in with your new password and resume your work",
  },
];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isDarkMode, text, textMuted, border, teal } = useThemeColors();
  const ACCENT = teal;

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

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // "idle" | "sent"
  const [stage, setStage] = useState("idle");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("error", "Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast("error", "Please enter a valid email address");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
    } catch (_) {
      // Swallow error — always show success to avoid email enumeration
    } finally {
      setLoading(false);
      setStage("sent");
      showToast("success", "Reset code sent! Check your inbox.");
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
    } catch (_) {
      // Swallow silently
    } finally {
      setLoading(false);
      showToast("success", "A new code has been sent to your inbox.");
    }
  };

  // Navigate to reset-password page, carrying the email in router state
  // so NewPassword can pre-fill the email field
  const handleGoToReset = () => {
    navigate("/reset-password", {
      state: { email: email.trim().toLowerCase() },
    });
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
        {/* LEFT — Info steps */}
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
            Password Reset
          </Typography>
          <Typography
            sx={{ color: "rgba(98,198,196,0.55)", fontSize: 11.5, mb: 3.5 }}
          >
            Regain access to your account
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

        {/* RIGHT — Form / Sent state */}
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
          {/* Logo + heading */}
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
              {stage === "sent" ? "Code Sent!" : "Forgot Password"}
            </Typography>
            <Typography sx={{ color: cardMuted, fontSize: 12, mt: 0.5 }}>
              {stage === "sent"
                ? "Check your inbox, then proceed to reset your password."
                : "Enter your email and we'll send you a 6-digit reset code."}
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

          {/* ── STAGE: idle — email form ── */}
          {stage === "idle" && (
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
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={17} color={ACCENT} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
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
                {loading ? "Sending…" : "Send Reset Code"}
              </Button>
            </Box>
          )}

          {/* ── STAGE: sent — success + action buttons ── */}
          {stage === "sent" && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards",
              }}
            >
              {/* Success icon */}
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
                <ShieldCheck size={28} color={ACCENT} />
              </Box>

              <Typography
                sx={{ color: cardText, fontWeight: 800, fontSize: 15 }}
              >
                Check your inbox
              </Typography>

              <Typography
                sx={{
                  color: cardMuted,
                  fontSize: 12,
                  textAlign: "center",
                  maxWidth: 300,
                  lineHeight: 1.6,
                }}
              >
                A 6-digit reset code has been sent to{" "}
                <b style={{ color: ACCENT }}>{email}</b>. It expires in{" "}
                <b style={{ color: cardText }}>30 minutes</b>.
              </Typography>

              {/* Primary CTA — navigate to NewPassword with email pre-filled */}
              <Button
                onClick={handleGoToReset}
                fullWidth
                endIcon={<ArrowRight size={16} />}
                sx={{
                  mt: 0.5,
                  height: 46,
                  borderRadius: 2.5,
                  fontWeight: 950,
                  textTransform: "none",
                  fontSize: 14,
                  bgcolor: ACCENT,
                  color: "#04121D",
                  boxShadow: "0 12px 28px rgba(94,196,195,0.22)",
                  "&:hover": { bgcolor: "#49b2b1" },
                }}
              >
                Enter Reset Code
              </Button>

              {/* Secondary — resend code */}
              <Button
                onClick={handleResend}
                disabled={loading}
                variant="outlined"
                fullWidth
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  borderColor: "rgba(94,196,195,0.35)",
                  color: ACCENT,
                  "&:hover": {
                    borderColor: ACCENT,
                    bgcolor: "rgba(94,196,195,0.06)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "rgba(94,196,195,0.18)",
                    color: "rgba(94,196,195,0.40)",
                  },
                }}
              >
                {loading ? "Resending…" : "Resend Code"}
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
              to="/login"
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
              Back to Sign In
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

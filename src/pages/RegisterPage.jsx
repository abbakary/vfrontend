import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../assets/logo.png";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Briefcase,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Globe,
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
  MenuItem,
  LinearProgress,
  Autocomplete,
  Snackbar,
  Alert,
} from "@mui/material";

import { useThemeColors } from "../utils/useThemeColors";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";
const PRIMARY = "#61C5C3";
const SECONDARY = "#F58A24";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/* ─── ISO Countries with dial codes & flags ─── */
const COUNTRIES = [
  { code: "AF", name: "Afghanistan", dial: "+93", flag: "🇦🇫" },
  { code: "AL", name: "Albania", dial: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { code: "CD", name: "Congo (DRC)", dial: "+243", flag: "🇨🇩" },
  { code: "HR", name: "Croatia", dial: "+385", flag: "🇭🇷" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "ET", name: "Ethiopia", dial: "+251", flag: "🇪🇹" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "IR", name: "Iran", dial: "+98", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", dial: "+7", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "LY", name: "Libya", dial: "+218", flag: "🇱🇾" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", dial: "+258", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "PE", name: "Peru", dial: "+51", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", dial: "+221", flag: "🇸🇳" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "SY", name: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼" },
  { code: "TZ", name: "Tanzania", dial: "+255", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "UG", name: "Uganda", dial: "+256", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", dial: "+380", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "UZ", name: "Uzbekistan", dial: "+998", flag: "🇺🇿" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial: "+263", flag: "🇿🇼" },
];

const toBusinessTypeOptions = (items = []) =>
  items.map((item) => ({
    id: item.id,
    label: item.name,
  }));

/* ─── Password strength ─── */
const PW_RULES = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "A number", test: (pw) => /[0-9]/.test(pw) },
  { label: "Max 72 chars", test: (pw) => pw.length > 0 && pw.length <= 72 },
];
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return {
    score: s,
    label:
      ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][s] || "Very Strong",
    color:
      ["transparent", "#e53935", "#FB8C00", "#F9A825", "#43A047", "#00897B"][
        s
      ] || "#00897B",
  };
};

/* ─── Steps for left panel ─── */
const STEPS = [
  {
    icon: <User size={17} color="#F68822" strokeWidth={2} />,
    title: "Create your account",
    desc: "Enter your name, email and choose a secure password",
  },
  {
    icon: <Phone size={17} color="#F68822" strokeWidth={2} />,
    title: "Verify your email",
    desc: "Click the confirmation link we send to your inbox",
  },
  {
    icon: <Briefcase size={17} color="#F68822" strokeWidth={2} />,
    title: "Set up your profile",
    desc: "Add your organisation details and select your role",
  },
  {
    icon: <Shield size={17} color="#F68822" strokeWidth={2} />,
    title: "Choose your plan",
    desc: "Pick a subscription that fits your data access needs",
  },
  {
    icon: <Activity size={17} color="#F68822" strokeWidth={2} />,
    title: "Access your data",
    desc: "Browse datasets, manage requests and subscriptions",
  },
];

const EMPTY = {
  full_name: "",
  email: "",
  password: "",
  confirm: "",
  phone: "",
  country: null,
  business_type_id: "",
  agree: false,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isDarkMode, text, textMuted, border, teal } = useThemeColors();
  const ACCENT = teal;

  /* ── Theme tokens ── */
  const cardBg = isDarkMode ? "rgba(7,26,41,0.96)" : "#ffffff";
  const cardText = isDarkMode ? "#fff" : text;
  const cardMuted = isDarkMode ? "rgba(255,255,255,0.65)" : textMuted;
  const inputBg = isDarkMode ? "rgba(4,18,29,0.85)" : "#fafafa";
  const inputText = isDarkMode ? "#fff" : text;
  const inputLbl = isDarkMode ? "rgba(255,255,255,0.80)" : textMuted;
  const inputBdr = isDarkMode ? "rgba(255,255,255,0.20)" : border;

  const tfSx = {
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
    "& .MuiSelect-select": { color: inputText },
    "& .MuiFormHelperText-root": { color: cardMuted },
    "& .MuiSvgIcon-root": { color: cardMuted },
    "& .MuiAutocomplete-input": { color: inputText },
  };

  /* ── State ── */
  const [form, setForm] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState("");
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
    let isMounted = true;

    const loadReferenceData = async () => {
      setReferenceLoading(true);
      setReferenceError("");

      try {
        const businessTypesResponse = await api.get("/business-types/");

        if (!isMounted) {
          return;
        }

        setBusinessTypes(toBusinessTypeOptions(businessTypesResponse.data));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load registration options.";

        setBusinessTypes([]);
        setReferenceError(message);
        showToast("error", message);
      } finally {
        if (isMounted) {
          setReferenceLoading(false);
        }
      }
    };

    loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const strength = getStrength(form.password);
  const pwMatch =
    form.password && form.confirm && form.password === form.confirm;
  const allRules = PW_RULES.every((r) => r.test(form.password));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCountry = (_, val) => {
    setForm((p) => ({ ...p, country: val, phone: val ? val.dial + " " : "" }));
  };

  /* ── Validation ── */
  const validate = () => {
    if (!form.full_name.trim()) {
      showToast("error", "Full name is required");
      return false;
    }
    if (!form.email.trim()) {
      showToast("error", "Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showToast("error", "Enter a valid email");
      return false;
    }
    if (!form.country) {
      showToast("error", "Please select your country");
      return false;
    }
    if (!form.phone.trim()) {
      showToast("error", "Phone number is required");
      return false;
    }
    if (!form.business_type_id) {
      showToast("error", "Please select a business type");
      return false;
    }
    if (referenceLoading) {
      showToast("error", "Registration options are still loading");
      return false;
    }
    if (referenceError) {
      showToast("error", "Reload the page and try again");
      return false;
    }
    if (!form.password) {
      showToast("error", "Password is required");
      return false;
    }
    if (!allRules) {
      showToast("error", "Password does not meet requirements");
      return false;
    }
    if (form.password !== form.confirm) {
      showToast("error", "Passwords do not match");
      return false;
    }
    if (!form.agree) {
      showToast("error", "You must agree to the Terms of Service");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post("/auth/register", {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        country: form.country?.name,
        business_type_id: Number(form.business_type_id),
      });
      showToast("success", "Account created! Please check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      showToast(
        "error",
        err?.response?.data?.detail || err?.message || "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .reg-root {
          min-height:100vh; width:100%; background:${isDarkMode ? "#020c14" : "#f0f4f8"};
          display:flex; align-items:center; justify-content:center;
          padding:32px 24px; font-family:'Poppins',sans-serif;
          position:relative; overflow:hidden; animation:regFadeIn .45s ease;
        }
        .reg-orb {
          position:absolute; border-radius:999px; filter:blur(80px);
          pointer-events:none; animation:regFloat 9s ease-in-out infinite;
        }
        .reg-orb-1 { width:420px;height:420px;top:-120px;left:-110px;background:${PRIMARY};opacity:.08; }
        .reg-orb-2 { width:340px;height:340px;right:-90px;bottom:-90px;background:${SECONDARY};opacity:.08;animation-delay:1.5s; }
        .reg-orb-3 { width:220px;height:220px;left:44%;top:62%;background:${PRIMARY};opacity:.05;animation-delay:3.2s; }
        .reg-grid {
          position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(97,197,195,.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(97,197,195,.028) 1px,transparent 1px);
          background-size:48px 48px;
        }
        @keyframes regFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes regFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(22px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="reg-root">
        <div className="reg-orb reg-orb-1" />
        <div className="reg-orb reg-orb-2" />
        <div className="reg-orb reg-orb-3" />
        <div className="reg-grid" />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 980,
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            boxShadow: "0 32px 90px rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* ══ LEFT — Steps 50% dark glass ══ */}
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
              Get Started
            </Typography>
            <Typography
              sx={{ color: "rgba(98,198,196,0.55)", fontSize: 11.5, mb: 3.5 }}
            >
              Create your account in 5 easy steps
            </Typography>

            {STEPS.map(({ icon, title, desc }, i) => (
              <Box
                key={title}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.6,
                  mb: i < STEPS.length - 1 ? 2.6 : 0,
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
                    bgcolor: "rgba(246,136,34,0.12)",
                    border: "1.5px solid rgba(246,136,34,0.35)",
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

          {/* ══ RIGHT — Form 50% theme-aware ══ */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              bgcolor: cardBg,
              p: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflowY: "auto",
              maxHeight: "100vh",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                mb: 2,
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
                  height: 44,
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
                Create Account
              </Typography>
              <Typography sx={{ color: cardMuted, fontSize: 12, mt: 0.5 }}>
                Join DALI Data Portal: manage datasets, analysis and reports.
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

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.4,
                opacity: 0,
                animation: "fadeUp 0.7s ease forwards",
                animationDelay: "0.18s",
              }}
            >
              {/* Full Name — col-12 */}
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={16} color={ACCENT} />
                    </InputAdornment>
                  ),
                }}
                sx={tfSx}
              />

              {/* Email — col-12 */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={16} color={ACCENT} />
                    </InputAdornment>
                  ),
                }}
                sx={tfSx}
              />

              {/* Country — col-12 ISO autocomplete with flag */}
              <Autocomplete
                options={COUNTRIES}
                value={form.country}
                onChange={handleCountry}
                getOptionLabel={(o) => `${o.flag}  ${o.name} (${o.code})`}
                isOptionEqualToValue={(o, v) => o.code === v.code}
                renderOption={(props, o) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      fontSize: 13,
                      gap: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {o.flag}
                    </span>
                    <span>{o.name}</span>
                    <span
                      style={{ marginLeft: "auto", opacity: 0.5, fontSize: 11 }}
                    >
                      {o.code} {o.dial}
                    </span>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    sx={tfSx}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          {form.country ? (
                            <span style={{ fontSize: 20, lineHeight: 1 }}>
                              {form.country.flag}
                            </span>
                          ) : (
                            <Globe size={16} color={ACCENT} />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                PaperComponent={({ children, ...p }) => (
                  <Box
                    {...p}
                    sx={{
                      bgcolor: isDarkMode ? "#071a29" : "#fff",
                      border: `1px solid ${inputBdr}`,
                      borderRadius: 2,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      "& .MuiAutocomplete-option": { color: inputText },
                      "& .MuiAutocomplete-option.Mui-focused": {
                        bgcolor: isDarkMode
                          ? "rgba(94,196,195,0.12)"
                          : "rgba(94,196,195,0.08)",
                      },
                    }}
                  >
                    {children}
                  </Box>
                )}
              />

              {/* Phone — col-12 with dial prefix from country */}
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={
                  form.country
                    ? `${form.country.dial} …`
                    : "Select country first"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {form.country ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            pr: 0.5,
                            borderRight: `1px solid ${inputBdr}`,
                            mr: 0.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>
                            {form.country.flag}
                          </span>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: inputText,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {form.country.dial}
                          </Typography>
                        </Box>
                      ) : (
                        <Phone size={16} color={ACCENT} />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={tfSx}
              />

              {/* Business Type — col-12 */}
              <TextField
                select
                fullWidth
                label="Business Type"
                name="business_type_id"
                value={form.business_type_id}
                onChange={handleChange}
                disabled={referenceLoading || !!referenceError}
                helperText={
                  referenceError
                    ? "Unable to load business types"
                    : referenceLoading
                      ? "Loading business types..."
                      : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Briefcase size={16} color={ACCENT} />
                    </InputAdornment>
                  ),
                }}
                sx={tfSx}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: isDarkMode ? "#071a29" : "#fff",
                        color: cardText,
                        "& .MuiMenuItem-root:hover": {
                          bgcolor: isDarkMode
                            ? "rgba(94,196,195,0.12)"
                            : "rgba(94,196,195,0.08)",
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled sx={{ fontSize: 13, opacity: 0.5 }}>
                  Select business type…
                </MenuItem>
                {businessTypes.map((b) => (
                  <MenuItem key={b.id} value={b.id} sx={{ fontSize: 13 }}>
                    {b.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Password — col-12 */}
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
                      <Lock size={16} color={ACCENT} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPw((p) => !p)}
                        edge="end"
                        sx={{ color: ACCENT }}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={tfSx}
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
                        transition: "all .4s ease",
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

              {/* Rules pills */}
              {form.password && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                  {PW_RULES.map(({ label, test }) => {
                    const ok = test(form.password);
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
                          transition: "all .25s ease",
                          bgcolor: ok
                            ? "rgba(94,196,195,0.10)"
                            : isDarkMode
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.04)",
                          border: `1px solid ${ok ? "rgba(94,196,195,0.35)" : inputBdr}`,
                        }}
                      >
                        {ok ? (
                          <CheckCircle2 size={11} color={ACCENT} />
                        ) : (
                          <XCircle size={11} color={cardMuted} />
                        )}
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: ok ? ACCENT : cardMuted,
                          }}
                        >
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Confirm Password — col-12 */}
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirm"
                type={showCf ? "text" : "password"}
                value={form.confirm}
                onChange={handleChange}
                error={!!form.confirm && !pwMatch}
                helperText={
                  form.confirm && !pwMatch ? "Passwords do not match" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock
                        size={16}
                        color={
                          pwMatch ? ACCENT : form.confirm ? "#e53935" : ACCENT
                        }
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCf((p) => !p)}
                        edge="end"
                        sx={{ color: ACCENT }}
                      >
                        {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  ...tfSx,
                  "& .MuiOutlinedInput-root": {
                    ...tfSx["& .MuiOutlinedInput-root"],
                    "& fieldset": {
                      borderColor:
                        form.confirm && !pwMatch
                          ? "#e53935"
                          : pwMatch
                            ? ACCENT
                            : inputBdr,
                    },
                  },
                }}
              />

              {/* Terms */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.agree}
                    onChange={handleChange}
                    name="agree"
                    sx={{
                      color: cardMuted,
                      "&.Mui-checked": { color: ACCENT },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 12, color: cardMuted }}>
                    I agree to the{" "}
                    <Link
                      href="#"
                      underline="none"
                      sx={{ color: ACCENT, fontWeight: 700 }}
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      underline="none"
                      sx={{ color: ACCENT, fontWeight: 700 }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                disabled={loading || referenceLoading || !!referenceError}
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
                {loading
                  ? "Creating account..."
                  : referenceLoading
                    ? "Loading options..."
                    : "Create Account"}
              </Button>

              <Divider
                sx={{
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(15,23,42,0.08)",
                  my: 0.5,
                }}
              />

              <Typography
                sx={{ textAlign: "center", fontSize: 13, color: cardMuted }}
              >
                Already have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="none"
                  sx={{ color: ACCENT, fontWeight: 800 }}
                >
                  Sign in
                </Link>
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  opacity: 0.65,
                  color: cardMuted,
                  textAlign: "center",
                }}
              >
                © {new Date().getFullYear()} Dali Data Portal
              </Typography>
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
  );
}

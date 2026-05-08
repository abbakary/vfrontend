// Password validation rules and strength logic
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Chip,
} from "@mui/material";
import {
  Settings,
  LogOut,
  Edit2,
  Lock,
  User,
  HelpCircle,
  Star,
  Megaphone,
  Users,
} from "lucide-react";
import PageLayout from "../public/components/PageLayout";

const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";
const USER_KEY = "dali-user";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const roleBadge = (role) => {
  const map = {
    super_admin: { label: "Super Admin", color: "warning" },
    admin: { label: "Admin", color: "error" },
    editor: { label: "Editor", color: "secondary" },
    seller: { label: "Seller", color: "success" },
    buyer: { label: "Buyer", color: "primary" },
    viewer: { label: "Viewer", color: "default" },
  };
  return map[role] || map.viewer;
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const MENU_ITEMS = [
  { id: "adverts", label: "Recommended Ads", icon: <Megaphone size={16} /> },
  { id: "profile", label: "Edit Profile", icon: <User size={16} /> },
  { id: "security", label: "Security & Password", icon: <Lock size={16} /> },
  { id: "support", label: "Support", icon: <Star size={16} /> },
  {
    id: "faq",
    label: "Frequently Asked Questions",
    icon: <HelpCircle size={16} />,
  },
];

// ════════════════════════════════════════════════════════════════════════════
export default function UserProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("adverts");

  const [toast, setToast] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Edit profile dialog
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [countryInput, setCountryInput] = useState("");

  // Change password dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");

  // ── Fetch /auth/me on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data);
      setNameInput(data.full_name || "");
      setPhoneInput(data.phone || "");
      setCountryInput(data.country || "");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── PUT /users/me/profile ────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/users/me/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: nameInput.trim() || undefined,
          phone: phoneInput.trim() || undefined,
          country: countryInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      await fetchMe();
      setProfileOpen(false);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── PUT /users/me/password ───────────────────────────────────────────────
  const savePassword = async () => {
    setPwError("");
    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwNew.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/users/me/password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          current_password: pwCurrent,
          new_password: pwNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Password change failed");
      showToast("Password changed. Logging you out...");
      setPwOpen(false);
      setTimeout(() => handleLogout(), 2000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── POST /auth/logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("auth:updated"));
    navigate("/login");
  };

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  const openProfileDialog = () => {
    setNameInput(user?.full_name || "");
    setPhoneInput(user?.phone || "");
    setCountryInput(user?.country || "");
    setProfileOpen(true);
  };

  const openPasswordDialog = () => {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwError("");
    setPwOpen(true);
  };

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    if (id === "profile") {
      openProfileDialog();
      return;
    }
    if (id === "security") {
      openPasswordDialog();
      return;
    }
  };

  // ── CONTENT PANELS ───────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeMenu) {
      case "adverts":
        return (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Recommended Ads
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ pt: 6, textAlign: "center", color: "#6b7280" }}>
              <Megaphone
                size={48}
                color="#d1d5db"
                style={{ marginBottom: 12 }}
              />
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                No recommended ads yet
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                You will see recommended ads here based on your interests.
              </Typography>
            </Box>
          </>
        );

      case "support":
        return (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Support
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ pt: 6, textAlign: "center", color: "#6b7280" }}>
              <Star size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                No support messages yet
              </Typography>
              <Typography variant="body2">
                Contact support for any help or inquiries. Support messages will
                appear here.
              </Typography>
            </Box>
          </>
        );

      case "faq":
        return (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Frequently Asked Questions
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {[
              {
                q: "How do I list a dataset?",
                a: "Go to your seller dashboard and click 'Add New Listing'.",
              },
              {
                q: "How do I get paid?",
                a: "Payments are processed after a buyer completes a purchase. Your earnings appear in your wallet.",
              },
              {
                q: "Can I update my listing?",
                a: "Yes, you can edit any listing from your dataset management page.",
              },
              {
                q: "How do I verify my email?",
                a: "Check your inbox for a verification email sent at registration.",
              },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.5 }}>
                  {item.q}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {item.a}
                </Typography>
              </Box>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  const rb = user ? roleBadge(user.role) : roleBadge("viewer");

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <Box
        sx={{
          p: 3,
          background: "#dce6f0",
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          gap: 2,
        }}
      >
        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <Paper
          sx={{
            width: 260,
            p: 2,
            borderRadius: 3,
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          {/* Settings / Logout icons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <IconButton size="small" title="Settings">
              <Settings size={17} />
            </IconButton>
            <IconButton
              size="small"
              title="Logout"
              onClick={handleLogout}
              sx={{ "&:hover": { background: "#fee2e2", color: "#ef4444" } }}
            >
              <LogOut size={17} />
            </IconButton>
          </Box>

          {/* Avatar + name */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                <CircularProgress size={40} sx={{ color: "#20B2AA" }} />
              </Box>
            ) : (
              <Avatar
                sx={{
                  width: 84,
                  height: 84,
                  mx: "auto",
                  mb: 1,
                  background: "linear-gradient(135deg, #20B2AA, #FF8C00)",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {getInitials(user?.full_name)}
              </Avatar>
            )}

            <Typography
              sx={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}
            >
              {user?.full_name || "User"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontSize: 12, mb: 1 }}
            >
              {user?.email || ""}
            </Typography>

            {/* Role + status badges */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 0.5,
                flexWrap: "wrap",
                mb: 1.5,
              }}
            >
              <Chip
                label={rb.label}
                color={rb.color}
                size="small"
                sx={{ fontSize: 10, fontWeight: 700, height: 20 }}
              />
              {user?.status && (
                <Chip
                  label={user.status}
                  size="small"
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    height: 20,
                    background:
                      user.status === "active" ? "#d1fae5" : "#fee2e2",
                    color: user.status === "active" ? "#065f46" : "#991b1b",
                  }}
                />
              )}
            </Box>

            {/* Edit profile shortcut */}
            <Button
              size="small"
              startIcon={<Edit2 size={13} />}
              onClick={openProfileDialog}
              sx={{
                textTransform: "none",
                fontSize: 12,
                color: "#20B2AA",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": { background: "#f0fdfa" },
              }}
            >
              Edit Profile
            </Button>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {/* Nav menu */}
          <List sx={{ p: 0 }}>
            {MENU_ITEMS.map((item) => (
              <ListItem
                key={item.id}
                button
                onClick={() => handleMenuClick(item.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: 1.5,
                  background:
                    activeMenu === item.id ? "#f0fdfa" : "transparent",
                  color: activeMenu === item.id ? "#20B2AA" : "#475569",
                  "&:hover": { background: "#f0fdfa", color: "#20B2AA" },
                  transition: "all 0.15s",
                }}
              >
                <Box
                  sx={{
                    mr: 1.5,
                    display: "flex",
                    alignItems: "center",
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </Box>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: activeMenu === item.id ? 700 : 500,
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ mt: 1, mb: 1.5 }} />

          <Button
            fullWidth
            startIcon={<LogOut size={14} />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontSize: 13,
              fontWeight: 700,
              color: "#ef4444",
              borderRadius: 2,
              "&:hover": { background: "#fef2f2" },
            }}
          >
            Log Out
          </Button>
        </Paper>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <Paper
          sx={{ flex: 1, p: 3, minHeight: 420, borderRadius: 1, width: "100%" }}
        >
          {activeMenu === "profile" ? (
            <Box sx={{ width: "100%", maxWidth: 600, mx: "auto" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Edit Profile
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  size="small"
                  placeholder="+255 700 000 000"
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                <TextField
                  label="Country"
                  fullWidth
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  size="small"
                  placeholder="e.g. Tanzania"
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Email changes require re-verification. Contact support to
                  update your email.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Button
                    onClick={() => setActiveMenu("adverts")}
                    sx={{ textTransform: "none", color: "#64748b" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveProfile}
                    variant="contained"
                    disabled={saving}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      background: "#20B2AA",
                      "&:hover": { background: "#1a9e97" },
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : activeMenu === "security" ? (
            <Box sx={{ maxWidth: 480, mx: "auto" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {pwError && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {pwError}
                  </Alert>
                )}
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  size="small"
                  helperText="Minimum 8 characters, uppercase, number."
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                {/* Password strength bar */}
                {pwNew && (
                  <Box sx={{ px: 0.5 }}>
                    <Box
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.08)",
                        mb: 0.5,
                        width: "100%",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(getStrength(pwNew).score / 5) * 100}%`,
                          height: 4,
                          borderRadius: 2,
                          background: getStrength(pwNew).color,
                          transition: "all .4s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        color: getStrength(pwNew).color,
                        mt: 0.4,
                        fontWeight: 700,
                      }}
                    >
                      {getStrength(pwNew).label}
                    </Typography>
                  </Box>
                )}
                {/* Password rules pills */}
                {pwNew && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                    {PW_RULES.map(({ label, test }) => {
                      const ok = test(pwNew);
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
                              : "rgba(0,0,0,0.04)",
                            border: `1px solid ${ok ? "rgba(94,196,195,0.35)" : "#e0e0e0"}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: ok ? "#43A047" : "#aaa",
                            }}
                          >
                            ●
                          </span>
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: ok ? "#43A047" : "#aaa",
                            }}
                          >
                            {label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#20B2AA",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  After changing your password you will be logged out
                  automatically.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Button
                    onClick={() => setActiveMenu("adverts")}
                    sx={{ textTransform: "none", color: "#64748b" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={savePassword}
                    variant="contained"
                    disabled={saving}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      background: "#20B2AA",
                      "&:hover": { background: "#1a9e97" },
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            renderContent()
          )}
        </Paper>
      </Box>

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
}

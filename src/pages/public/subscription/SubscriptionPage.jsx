import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Bell,
  BarChart2,
  Zap,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const PRIMARY = "#61C5C3";
const HEADER_COLOR = "#7C3AED";

// Hardcoded per-plan UI, descriptions, and prices keyed by ref (from DB)
const PLAN_HARDCODED = {
  notify: {
    icon: Bell,
    accentColor: "#059669",
    accentLight: "#ECFDF5",
    accentMid: "#6EE7B7",
    description:
      "Stay ahead with instant alerts across all your subscribed categories.",
    monthlyPrice: 9,
    annualPrice: 89,
    currency: "USD",
  },
  seller: {
    icon: BarChart2,
    accentColor: "#2563EB",
    accentLight: "#EFF6FF",
    accentMid: "#93C5FD",
    description:
      "Understand what buyers want and optimise your listings for maximum visibility.",
    monthlyPrice: 29,
    annualPrice: 279,
    currency: "USD",
  },
  premium: {
    icon: Zap,
    accentColor: "#7C3AED",
    accentLight: "#F5F3FF",
    accentMid: "#C4B5FD",
    description:
      "Full access with exclusive savings on every data purchase you make.",
    monthlyPrice: 49,
    annualPrice: 469,
    currency: "USD",
  },
  vip: {
    icon: Crown,
    accentColor: "#B45309",
    accentLight: "#FFFBEB",
    accentMid: "#FCD34D",
    description:
      "Everything unlimited with priority access and dedicated personal support.",
    monthlyPrice: 99,
    annualPrice: 949,
    currency: "USD",
  },
};

const statusMeta = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Pending review",
        bg: "#fffbeb",
        color: "#d97706",
        icon: <Clock size={12} color="#d97706" />,
      };
    case "active":
      return {
        label: "Active",
        bg: "#f0fdf4",
        color: "#16a34a",
        icon: <CheckCircle size={12} color="#16a34a" />,
      };
    case "expired":
    case "suspended":
      return {
        label: status === "expired" ? "Expired" : "Suspended",
        bg: "#fef2f2",
        color: "#dc2626",
        icon: <XCircle size={12} color="#dc2626" />,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        bg: "#f9fafb",
        color: "#6b7280",
        icon: <XCircle size={12} color="#6b7280" />,
      };
    default:
      return {
        label: status || "—",
        bg: "#f9fafb",
        color: "#6b7280",
        icon: null,
      };
  }
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { authUser, userId, token } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const [latestRequest, setLatestRequest] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [apiPlans, setApiPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingToggle, setBillingToggle] = useState("monthly");

  const [form, setForm] = useState({
    planKey: "",
    billingCycle: "monthly",
    company: "",
    notes: "",
    contactEmail: "",
    contactName: "",
  });

  // Merge DB plan names/features with hardcoded descriptions & prices
  const displayPlans = useMemo(
    () =>
      apiPlans.map((apiPlan) => {
        const hc = PLAN_HARDCODED[apiPlan.ref] || {};
        return {
          key: apiPlan.ref,
          id: apiPlan.id,
          // name comes from DB
          name: apiPlan.name,
          // description hardcoded
          description: hc.description || apiPlan.description || "",
          features: Array.isArray(apiPlan.features) ? apiPlan.features : [],
          icon: hc.icon || CreditCard,
          // prices hardcoded
          monthlyPrice: hc.monthlyPrice ?? null,
          annualPrice: hc.annualPrice ?? null,
          currency: hc.currency || "USD",
          billingDefault: "monthly",
          accentColor: hc.accentColor || PRIMARY,
          accentLight: hc.accentLight || "#ECFDF5",
          accentMid: hc.accentMid || "#A7F3D0",
          cta: "Subscribe",
          status: apiPlan.status,
        };
      }),
    [apiPlans],
  );

  const selectedPlan = useMemo(
    () =>
      displayPlans.find((plan) => plan.key === form.planKey) ||
      displayPlans[0] ||
      null,
    [displayPlans, form.planKey],
  );

  useEffect(() => {
    setPlansLoading(true);
    api
      .get("/subscription-plans/public")
      .then((res) => {
        const plans = res.data?.data || [];
        setApiPlans(plans);
        if (plans.length) {
          const defaultPlan = plans[0];
          setForm((prev) => ({
            ...prev,
            planKey:
              prev.planKey && plans.some((plan) => plan.ref === prev.planKey)
                ? prev.planKey
                : defaultPlan.ref,
            billingCycle: prev.billingCycle || "monthly",
          }));
        }
      })
      .catch(() => {
        setApiPlans([]);
        setSnack({
          open: true,
          severity: "error",
          message: "Unable to load subscription plans right now.",
        });
      })
      .finally(() => setPlansLoading(false));
  }, []);

  const refreshUserState = useCallback(async () => {
    if (!userId || !token) {
      setLatestRequest(null);
      setActiveSubscription(null);
      return;
    }
    try {
      const res = await api.get("/subscriptions/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subs = res.data?.data || [];
      setActiveSubscription(subs.find((s) => s.status === "active") || null);
      setLatestRequest(subs[0] || null);
    } catch {
      setLatestRequest(null);
      setActiveSubscription(null);
    }
  }, [userId, token]);

  useEffect(() => {
    refreshUserState();
  }, [refreshUserState]);

  const openRequestDialog = (planKey) => {
    if (!userId) {
      setLoginModalOpen(true);
      return;
    }
    const plan =
      displayPlans.find((item) => item.key === planKey) ||
      displayPlans[0] ||
      null;
    if (!plan) {
      setSnack({
        open: true,
        severity: "error",
        message: "No subscription plans are available right now.",
      });
      return;
    }
    setForm((p) => ({
      ...p,
      planKey: plan.key,
      billingCycle: billingToggle,
      contactName: p.contactName || authUser?.full_name || authUser?.name || "",
      contactEmail: p.contactEmail || authUser?.email || "",
      company: p.company || authUser?.company || "",
    }));
    setRequestOpen(true);
  };

  const validate = () => {
    const errors = [];
    if (!userId) errors.push("Please sign in first.");
    if (!form.contactName.trim()) errors.push("Contact name is required.");
    if (!form.contactEmail.trim() || !form.contactEmail.includes("@"))
      errors.push("A valid email is required.");
    if (!form.company.trim()) errors.push("Company is required.");
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length) {
      setSnack({ open: true, severity: "error", message: errors[0] });
      return;
    }
    const plan_id = selectedPlan?.id ?? null;
    if (!plan_id) {
      setSnack({
        open: true,
        severity: "error",
        message: "Plan not available. Please try again later.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(
        "/subscriptions/",
        {
          plan_id,
          billing_cycle: form.billingCycle,
          company: form.company.trim() || null,
          contact_name: form.contactName.trim() || null,
          contact_email: form.contactEmail.trim() || null,
          notes: form.notes.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRequestOpen(false);
      setSnack({
        open: true,
        severity: "success",
        message: "Request submitted. Awaiting admin / editor review.",
      });
      refreshUserState();
    } catch (e) {
      setSnack({
        open: true,
        severity: "error",
        message:
          e?.response?.data?.detail || "Failed to submit request. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!latestRequest?.id) return;
    setCancelling(true);
    try {
      await api.post(
        `/subscriptions/${latestRequest.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSnack({ open: true, severity: "info", message: "Request cancelled." });
      refreshUserState();
    } catch (e) {
      setSnack({
        open: true,
        severity: "error",
        message: e?.response?.data?.detail || "Unable to cancel.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleLoginSubmit = () => {
    setLoginModalOpen(false);
    navigate("/login");
  };

  return (
    <PageLayout>
      <Box
        sx={{ minHeight: "100vh", backgroundColor: "var(--bg-gray)", py: 4 }}
      >
        <Container maxWidth="xl">
          {/* ── Page header — center aligned ── */}
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
              }}
            >
              <CreditCard size={26} color={HEADER_COLOR} />
              <Typography
                sx={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: HEADER_COLOR,
                }}
              >
                Subscription
              </Typography>
            </Box>
            <Typography
              sx={{
                color: "var(--text-muted)",
                fontSize: "0.95rem",
                maxWidth: 520,
                mx: "auto",
              }}
            >
              Choose a plan and submit a request. Your subscription activates
              after admin&nbsp;/&nbsp;editor approval.
            </Typography>
          </Box>

          {/* ── Status cards ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 4,
            }}
          >
            {/* Current subscription */}
            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid var(--border-color)",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  sx={{ fontWeight: 800, color: "var(--text-dark)", mb: 1 }}
                >
                  Current subscription
                </Typography>
                {!userId ? (
                  <Typography
                    sx={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                  >
                    Sign in to view your subscription status.
                  </Typography>
                ) : activeSubscription?.status === "active" ? (
                  <>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        mb: 1.5,
                        backgroundColor: "#f0fdf4",
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "var(--text-dark)",
                      }}
                    >
                      {activeSubscription.plan_name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text-muted)",
                        mt: 0.5,
                        fontSize: "0.875rem",
                      }}
                    >
                      {activeSubscription.billing_cycle} ·{" "}
                      {activeSubscription.company}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    sx={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                  >
                    No active subscription yet.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Latest request */}
            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid var(--border-color)",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  sx={{ fontWeight: 800, color: "var(--text-dark)", mb: 1 }}
                >
                  Latest request
                </Typography>
                {!userId ? (
                  <Typography
                    sx={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                  >
                    Sign in to submit a request.
                  </Typography>
                ) : !latestRequest ? (
                  <Typography
                    sx={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                  >
                    No request submitted yet.
                  </Typography>
                ) : (
                  <>
                    {(() => {
                      const s = statusMeta(latestRequest.status);
                      return (
                        <Chip
                          icon={s.icon}
                          label={s.label}
                          size="small"
                          sx={{
                            mb: 1.5,
                            backgroundColor: s.bg,
                            color: s.color,
                            fontWeight: 700,
                          }}
                        />
                      );
                    })()}
                    <Typography
                      sx={{
                        fontSize: "1rem",
                        fontWeight: 900,
                        color: "var(--text-dark)",
                      }}
                    >
                      {latestRequest.plan_name} ({latestRequest.billing_cycle})
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text-muted)",
                        mt: 0.5,
                        fontSize: "0.875rem",
                      }}
                    >
                      Company: {latestRequest.company}
                    </Typography>
                    {latestRequest.review_notes && (
                      <Typography
                        sx={{
                          color: "var(--text-muted)",
                          mt: 1,
                          fontSize: "0.875rem",
                        }}
                      >
                        Review notes:{" "}
                        <b style={{ color: "var(--text-dark)" }}>
                          {latestRequest.review_notes}
                        </b>
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelRequest}
                        disabled={
                          latestRequest.status !== "pending" || cancelling
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          borderColor: "var(--border-color)",
                          color: "var(--text-dark)",
                        }}
                      >
                        {cancelling ? "Cancelling…" : "Cancel request"}
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Send size={14} />}
                        onClick={() =>
                          openRequestDialog(latestRequest.plan_ref)
                        }
                        disabled={latestRequest.status !== "pending"}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          backgroundColor: PRIMARY,
                          color: "#fff",
                          boxShadow: "none",
                          "&:hover": {
                            backgroundColor: "#49b2b1",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Resubmit
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* ── Plans section header ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "var(--text-dark)",
                  fontSize: "1.1rem",
                }}
              >
                💼 Subscription plans
              </Typography>
              <Typography
                sx={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
              >
                Choose a plan that works for you
              </Typography>
            </Box>

            {/* Billing toggle + badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Monthly / Annual pill toggle */}
              <Box
                sx={{
                  display: "flex",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 999,
                  p: "3px",
                  gap: "3px",
                }}
              >
                {["monthly", "annual"].map((cycle) => (
                  <Box
                    key={cycle}
                    onClick={() => setBillingToggle(cycle)}
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 999,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      transition: "all 0.18s",
                      backgroundColor:
                        billingToggle === cycle ? "#fff" : "transparent",
                      color:
                        billingToggle === cycle
                          ? "var(--text-dark)"
                          : "var(--text-muted)",
                      boxShadow:
                        billingToggle === cycle
                          ? "0 1px 4px rgba(0,0,0,0.1)"
                          : "none",
                    }}
                  >
                    {cycle === "monthly" ? "Monthly" : "Annual"}
                    {cycle === "annual" && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.75,
                          fontSize: "0.7rem",
                          color: "#059669",
                          fontWeight: 800,
                        }}
                      >
                        Save ~20%
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              <Chip
                icon={<ShieldCheck size={14} />}
                label="Reviewed by admin / editor"
                variant="outlined"
                sx={{
                  fontSize: "0.8rem",
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
              />
            </Box>
          </Box>

          {/* ── Plan cards ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                lg: "repeat(4,1fr)",
              },
              gap: 2.5,
              alignItems: "stretch",
            }}
          >
            {plansLoading ? (
              <Card
                sx={{
                  gridColumn: "1 / -1",
                  borderRadius: 2,
                  border: "1px solid var(--border-color)",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ color: "var(--text-muted)" }}>
                    Loading subscription plans...
                  </Typography>
                </CardContent>
              </Card>
            ) : displayPlans.length === 0 ? (
              <Card
                sx={{
                  gridColumn: "1 / -1",
                  borderRadius: 2,
                  border: "1px solid var(--border-color)",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ color: "var(--text-muted)" }}>
                    No subscription plans are currently available.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              displayPlans.map((plan) => {
                const PlanIcon = plan.icon;
                const displayPrice =
                  billingToggle === "annual"
                    ? plan.annualPrice
                    : plan.monthlyPrice;
                const priceLabel =
                  billingToggle === "annual" ? "/ year" : "/ month";

                return (
                  <Card
                    key={plan.key}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${plan.accentMid}`,
                      boxShadow: "none",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "visible",
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        height: "100%",
                      }}
                    >
                      {/* Icon + name */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.25,
                        }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            backgroundColor: plan.accentLight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <PlanIcon size={18} color={plan.accentColor} />
                        </Box>
                        <Box>
                          {/* Name from DB */}
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: "var(--text-dark)",
                              fontSize: "1rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {plan.name}
                          </Typography>
                          {/* Description hardcoded */}
                          <Typography
                            sx={{
                              color: "var(--text-muted)",
                              fontSize: "0.78rem",
                              mt: 0.3,
                            }}
                          >
                            {plan.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price — hardcoded */}
                      {displayPrice != null && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 0.5,
                            px: 0.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "1.65rem",
                              fontWeight: 900,
                              color: plan.accentColor,
                              lineHeight: 1,
                            }}
                          >
                            ${displayPrice}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            {priceLabel}
                          </Typography>
                        </Box>
                      )}

                      {/* Features */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.9,
                          flex: 1,
                        }}
                      >
                        {plan.features.map((f) => (
                          <Box
                            key={f}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 0.9,
                            }}
                          >
                            <CheckCircle
                              size={14}
                              color={plan.accentColor}
                              style={{ marginTop: 2, flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.84rem",
                                color: "var(--text-dark)",
                                lineHeight: 1.45,
                              }}
                            >
                              {f}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* CTA button */}
                      <Button
                        variant="outlined"
                        onClick={() => openRequestDialog(plan.key)}
                        disabled={plan.status !== "active"}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontWeight: 900,
                          mt: 0.5,
                          backgroundColor: "transparent",
                          borderColor: plan.accentColor,
                          color: plan.accentColor,
                          boxShadow: "none",
                          "&:hover": {
                            backgroundColor: plan.accentColor,
                            color: "#fff",
                            boxShadow: "none",
                          },
                        }}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        </Container>

        {/* ── Submit request dialog ── */}
        <Dialog
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
            Submit subscription request
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" variant="outlined" sx={{ mb: 2.5, mt: 0.5 }}>
              Requests are reviewed and activated by admin / editor roles.
            </Alert>
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                select
                label="Plan"
                value={form.planKey}
                onChange={(e) => {
                  const nextPlan =
                    displayPlans.find((plan) => plan.key === e.target.value) ||
                    null;
                  setForm((p) => ({
                    ...p,
                    planKey: e.target.value,
                    billingCycle: nextPlan?.billingDefault || p.billingCycle,
                  }));
                }}
                fullWidth
              >
                {displayPlans.map((p) => (
                  <MenuItem key={p.key} value={p.key}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Billing cycle"
                value={form.billingCycle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, billingCycle: e.target.value }))
                }
                fullWidth
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="annual">Annual</MenuItem>
              </TextField>
              <TextField
                label="Company"
                value={form.company}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Contact name"
                value={form.contactName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactName: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Contact email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactEmail: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Notes (optional)"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                fullWidth
                multiline
                minRows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => setRequestOpen(false)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={<Send size={15} />}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                backgroundColor: PRIMARY,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#49b2b1", boxShadow: "none" },
              }}
            >
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

        {/* ── Login modal ── */}
        <Dialog
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              animation: "slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              "@keyframes slideIn": {
                "0%": { transform: "translateX(100%)", opacity: 0 },
                "100%": { transform: "translateX(0)", opacity: 1 },
              },
            },
          }}
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontSize: "1.25rem" }}>
            Sign in to continue
          </DialogTitle>
          <DialogContent>
            <Typography
              sx={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
            >
              You need to be signed in to access subscription plans and submit a
              request. Click <b>Sign in</b> to go to the login page.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setLoginModalOpen(false)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleLoginSubmit}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                backgroundColor: PRIMARY,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#49b2b1", boxShadow: "none" },
              }}
            >
              Sign in
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageLayout>
  );
}

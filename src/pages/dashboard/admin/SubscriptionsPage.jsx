import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
  IconButton,
} from "@mui/material";
import { CheckCircle, Clock, Eye, Trash2, XCircle } from "lucide-react";
import { useThemeColors } from "../../../utils/useThemeColors";
import DashboardLayout from "../components/DashboardLayout";
import subscriptionRequestService from "../../../utils/subscriptionRequestService";

const PRIMARY = "#FF8C00";
const SUCCESS = "#16a34a";
const WARNING = "#f59e0b";
const DANGER = "#dc2626";

export default function AdminSubscriptionsPage({ role = "admin" }) {
  const themeColors = useThemeColors();
  const [filter, setFilter] = useState("all");
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const load = () => {
    const all = subscriptionRequestService.getAllRequests();
    setRequests(all);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const approved = requests.filter((r) => r.status === "APPROVED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => String(r.status).toLowerCase() === filter);
  }, [requests, filter]);

  const statusColor = (status) => {
    switch (status) {
      case "PENDING":
        return { bg: "#fffbeb", color: WARNING, label: "Pending" };
      case "APPROVED":
        return { bg: "#f0fdf4", color: SUCCESS, label: "Approved" };
      case "REJECTED":
        return { bg: "#fef2f2", color: DANGER, label: "Rejected" };
      case "CANCELLED":
        return { bg: "#f9fafb", color: "#6b7280", label: "Cancelled" };
      default:
        return { bg: "#f9fafb", color: "#6b7280", label: status };
    }
  };

  const openDetails = (req) => {
    setSelected(req);
    setReviewNotes(req.reviewNotes || "");
    setOpen(true);
  };

  const approve = () => {
    if (!selected) return;
    subscriptionRequestService.approveRequest(selected.id, { reviewerRole: role, reviewNotes });
    setOpen(false);
    setSelected(null);
    load();
  };

  const reject = () => {
    if (!selected) return;
    subscriptionRequestService.rejectRequest(selected.id, { reviewerRole: role, reviewNotes });
    setOpen(false);
    setSelected(null);
    load();
  };

  const cancel = (id) => {
    subscriptionRequestService.cancelRequest(id, { reviewedByRole: role });
    load();
  };

  const statsCards = [
    { label: "Total Requests", value: stats.total, icon: <Eye size={20} color={PRIMARY} /> },
    { label: "Pending", value: stats.pending, icon: <Clock size={20} color={WARNING} /> },
    { label: "Approved", value: stats.approved, icon: <CheckCircle size={20} color={SUCCESS} /> },
    { label: "Rejected", value: stats.rejected, icon: <XCircle size={20} color={DANGER} /> },
  ];

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg, transition: "background-color 0.3s ease" }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: themeColors.text, mb: 0.5 }}>
            Subscription Requests
          </Typography>
          <Typography sx={{ color: themeColors.textMuted, fontSize: "1rem" }}>
            Review and activate subscriptions submitted from the public Subscription page
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
          {statsCards.map((s) => (
            <Card key={s.label} sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: "none", backgroundColor: themeColors.card }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.8rem", color: themeColors.textMuted, mb: 0.5 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: themeColors.text }}>{s.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, backgroundColor: `${PRIMARY}20`, borderRadius: 2, display: "flex" }}>{s.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              onClick={() => setFilter(t.key)}
              variant={filter === t.key ? "filled" : "outlined"}
              sx={{
                backgroundColor: filter === t.key ? PRIMARY : themeColors.card,
                color: filter === t.key ? "#fff" : themeColors.text,
                borderColor: themeColors.border,
                fontSize: "0.9rem",
              }}
            />
          ))}
        </Box>

        {filtered.length === 0 ? (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: "none", p: 4, textAlign: "center", backgroundColor: themeColors.card }}>
            <Typography sx={{ color: themeColors.textMuted, fontWeight: 700 }}>No subscription requests found</Typography>
          </Card>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr" }, gap: 2.5 }}>
            {filtered.map((r) => {
              const sc = statusColor(r.status);
              return (
                <Card key={r.id} sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: "none", backgroundColor: themeColors.card }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: themeColors.text }}>
                          {r.planName} ({r.billingCycle}) • {r.seats} seat{r.seats > 1 ? "s" : ""}
                        </Typography>
                        <Typography sx={{ fontSize: "0.85rem", color: themeColors.textMuted, mt: 0.5 }}>
                          {r.userName} • {r.userEmail} • {r.company}
                        </Typography>
                      </Box>
                      <Chip label={sc.label} size="small" sx={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 700 }} />
                    </Box>

                    <Box sx={{ mt: 2.5, display: "flex", gap: 2 }}>
                      <Button
                        onClick={() => openDetails(r)}
                        variant="contained"
                        startIcon={<Eye size={16} />}
                        sx={{ backgroundColor: PRIMARY, color: "#fff", fontWeight: 800, textTransform: "none", borderRadius: 1.5, flex: 1, "&:hover": { backgroundColor: "#e67e00" } }}
                      >
                        View / Review
                      </Button>
                      <IconButton
                        onClick={() => cancel(r.id)}
                        disabled={r.status !== "PENDING"}
                        sx={{ color: DANGER, borderRadius: 1.5, "&:hover": { backgroundColor: "#fef2f2" } }}
                        title="Cancel request"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: themeColors.card } }}>
          {selected && (
            <>
              <DialogTitle sx={{ fontWeight: 900, color: themeColors.text }}>Review subscription request</DialogTitle>
              <DialogContent sx={{ color: themeColors.text }}>
                <Box sx={{ display: "grid", gap: 1.5, mt: 1 }}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: "none", backgroundColor: themeColors.bgSecondary }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ fontWeight: 900, color: themeColors.text }}>
                        {selected.planName} ({selected.billingCycle})
                      </Typography>
                      <Typography sx={{ color: themeColors.textMuted, mt: 0.5 }}>
                        Seats: {selected.seats} • Company: {selected.company}
                      </Typography>
                      <Typography sx={{ color: themeColors.textMuted, mt: 0.5 }}>
                        Requested by: {selected.userName} • {selected.userEmail}
                      </Typography>
                      {selected.notes ? (
                        <Typography sx={{ color: themeColors.text, mt: 1 }}>
                          Notes: <b>{selected.notes}</b>
                        </Typography>
                      ) : null}
                    </CardContent>
                  </Card>

                  <TextField
                    label="Review notes (optional)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={() => setOpen(false)} sx={{ color: themeColors.textMuted, fontWeight: 800, textTransform: "none" }}>
                  Close
                </Button>
                <Button
                  onClick={reject}
                  disabled={selected.status !== "PENDING"}
                  sx={{ fontWeight: 900, textTransform: "none", borderRadius: 1.5, color: DANGER, border: `1px solid ${DANGER}55` }}
                >
                  Reject
                </Button>
                <Button
                  onClick={approve}
                  disabled={selected.status !== "PENDING"}
                  variant="contained"
                  sx={{ backgroundColor: PRIMARY, fontWeight: 900, textTransform: "none", borderRadius: 1.5, "&:hover": { backgroundColor: "#e67e00" } }}
                >
                  Approve & Activate
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}


/**
 * RequestDataModal.jsx
 *
 * Dependencies (add to your project if not already present):
 *   npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
 *
 * Props:
 *   open       {boolean}  – controls Dialog visibility
 *   onClose    {function} – called when modal should close
 *   isDarkMode {boolean}  – theme flag
 *   userEmail  {string}   – pre-fill email if user is logged in (optional)
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Chip,
  Backdrop,
  Fade,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Slider,
  InputAdornment,
} from "@mui/material";
import {
  X,
  Send,
  CheckCircle2,
  FileText,
  AlignLeft,
  DollarSign,
  Calendar,
  Mail,
  Globe,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  FolderOpen,
  TrendingUp,
  PieChart,
  Database,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Undo2,
  Redo2,
} from "lucide-react";
import SparkleTwoToneIcon from "@mui/icons-material/AutoAwesomeTwoTone";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const PRIMARY = "#61C5C3";
const SECONDARY = "#F58A24";
const PURPLE = "#8b5cf6";

const REQUEST_TYPES = [
  { value: "dataset", label: "Dataset", icon: Database },
  { value: "report", label: "Report", icon: BarChart2 },
  { value: "trade_analysis", label: "Trade Analysis", icon: TrendingUp },
  { value: "fund_report", label: "Fund Report", icon: PieChart },
  { value: "project_summary", label: "Project Summary", icon: FolderOpen },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "#16a34a" },
  { value: "normal", label: "Normal", color: PRIMARY },
  { value: "high", label: "High", color: SECONDARY },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

const BUDGET_MARKS = [
  { value: 0, label: "$0" },
  { value: 25, label: "$500" },
  { value: 50, label: "$2k" },
  { value: 75, label: "$5k" },
  { value: 100, label: "$10k+" },
];

const sliderValueToLabel = (v) => {
  const map = {
    0: "$0",
    25: "$500",
    50: "$2,000",
    75: "$5,000",
    100: "$10,000+",
  };
  return map[v] ?? `$${v}`;
};

/** Comprehensive country list */
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Benin",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Gabon",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Guinea",
  "Haiti",
  "Honduras",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Latvia",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malaysia",
  "Mali",
  "Mauritania",
  "Mexico",
  "Moldova",
  "Mongolia",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
].sort();

const STEPS = ["Scope", "Details", "Budget & Timeline", "Contact"];

const INITIAL_FORM = {
  country: "",
  type: "",
  title: "",
  description: "", // stored as HTML from tiptap
  budgetMin: 0,
  budgetMax: 50,
  deadline: "",
  priority: "normal",
  email: "",
};

/* ─────────────────────────────────────────────
   Tiptap mini toolbar
───────────────────────────────────────────── */
function EditorToolbar({ editor, isDarkMode }) {
  if (!editor) return null;
  const btnSx = (active) => ({
    p: "5px",
    minWidth: 0,
    borderRadius: "6px",
    color: active ? PRIMARY : isDarkMode ? "#94a3b8" : "#64748b",
    backgroundColor: active
      ? isDarkMode
        ? "rgba(97,197,195,0.15)"
        : "rgba(97,197,195,0.1)"
      : "transparent",
    "&:hover": {
      backgroundColor: isDarkMode
        ? "rgba(97,197,195,0.2)"
        : "rgba(97,197,195,0.12)",
      color: PRIMARY,
    },
  });
  const tools = [
    {
      icon: <Bold size={14} />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: <Italic size={14} />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: <Heading2 size={14} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: <List size={14} />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      icon: <ListOrdered size={14} />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    { divider: true },
    {
      icon: <Undo2 size={14} />,
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
    },
    {
      icon: <Redo2 size={14} />,
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
    },
  ];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.3,
        px: 1,
        py: 0.6,
        borderBottom: `1px solid ${isDarkMode ? "rgba(97,197,195,0.15)" : "#e2e8f0"}`,
        backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#f8fafc",
        borderRadius: "10px 10px 0 0",
        flexWrap: "wrap",
      }}
    >
      {tools.map((t, i) =>
        t.divider ? (
          <Box
            key={i}
            sx={{
              width: 1,
              height: 16,
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "#e2e8f0",
              mx: 0.4,
            }}
          />
        ) : (
          <Button
            key={i}
            onClick={t.action}
            sx={btnSx(t.isActive)}
            size="small"
          >
            {t.icon}
          </Button>
        ),
      )}
    </Box>
  );
}

/* ─────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────── */
export default function RequestDataModal({
  open,
  onClose,
  isDarkMode = false,
  userEmail = "",
}) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM, email: userEmail });

  /* ── Tiptap ── */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Describe the data you need — purpose, date range, geographic scope, key metrics, any specific sources…",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) =>
      setForm((p) => ({ ...p, description: editor.getHTML() })),
  });

  /* ── Tokens ── */
  const bg = isDarkMode ? "#071a29" : "#ffffff";
  const surfaceBg = isDarkMode ? "rgba(255,255,255,0.04)" : "#f8fafc";
  const borderClr = isDarkMode ? "rgba(97,197,195,0.18)" : "#e2e8f0";
  const labelClr = isDarkMode ? "#94a3b8" : "#64748b";
  const inputClr = isDarkMode ? "#f1f5f9" : "#1e293b";
  const inputBg = isDarkMode ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const headingClr = isDarkMode ? "#f1f5f9" : "#0f172a";

  const sharedInputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: inputBg,
      borderRadius: "10px",
      color: inputClr,
      fontSize: "0.88rem",
      "& fieldset": { borderColor: borderClr },
      "&:hover fieldset": { borderColor: PRIMARY },
      "&.Mui-focused fieldset": { borderColor: PRIMARY, borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: labelClr, fontSize: "0.85rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY },
    "& .MuiSelect-icon": { color: labelClr },
  };

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleClose = () => {
    setStep(0);
    setSubmitted(false);
    setForm({ ...INITIAL_FORM, email: userEmail });
    editor?.commands.clearContent();
    onClose();
  };

  const canNext = () => {
    if (step === 0) return form.country && form.type;
    if (step === 1)
      return form.title && form.description && form.description !== "<p></p>";
    if (step === 2) return form.deadline;
    return true;
  };

  const handleSubmit = () => {
    if (!canNext()) return;
    setSubmitted(true);
  };

  /* ── Step 0: Scope ── */
  const ScopeStep = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Country */}
      <FormControl fullWidth size="small" sx={sharedInputSx}>
        <InputLabel>Country / Region</InputLabel>
        <Select
          value={form.country}
          onChange={set("country")}
          label="Country / Region"
          startAdornment={
            <Box sx={{ mr: 1, display: "flex", color: labelClr }}>
              <Globe size={14} />
            </Box>
          }
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 260, backgroundColor: bg, color: inputClr },
            },
          }}
        >
          <MenuItem
            value="global"
            sx={{ fontSize: "0.85rem", fontStyle: "italic", color: PRIMARY }}
          >
            🌍 Global / Multi-country
          </MenuItem>
          {COUNTRIES.map((c) => (
            <MenuItem key={c} value={c} sx={{ fontSize: "0.85rem" }}>
              {c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Request Type — card grid */}
      <Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: labelClr,
            mb: 1.2,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Request Type
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
          {REQUEST_TYPES.map(({ value, label, icon: Icon }) => {
            const active = form.type === value;
            return (
              <Box
                key={value}
                onClick={() => setForm((p) => ({ ...p, type: value }))}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  px: 1.6,
                  py: 1.3,
                  borderRadius: "10px",
                  cursor: "pointer",
                  border: `1.5px solid ${active ? PRIMARY : borderClr}`,
                  backgroundColor: active
                    ? isDarkMode
                      ? "rgba(97,197,195,0.10)"
                      : "rgba(97,197,195,0.07)"
                    : inputBg,
                  transition: "all 0.18s ease",
                  "&:hover": {
                    borderColor: PRIMARY,
                    backgroundColor: isDarkMode
                      ? "rgba(97,197,195,0.10)"
                      : "rgba(97,197,195,0.07)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "8px",
                    backgroundColor: active
                      ? isDarkMode
                        ? "rgba(97,197,195,0.2)"
                        : "rgba(97,197,195,0.15)"
                      : isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} color={active ? PRIMARY : labelClr} />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? isDarkMode
                        ? "#f1f5f9"
                        : "#0f172a"
                      : labelClr,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );

  /* ── Step 1: Details ── */
  const DetailsStep = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
      {/* Title */}
      <TextField
        label="Request Title"
        placeholder="e.g. Tanzania Agricultural Census 2023"
        value={form.title}
        onChange={set("title")}
        fullWidth
        size="small"
        sx={sharedInputSx}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", color: labelClr }}>
              <FileText size={15} />
            </Box>
          ),
        }}
      />

      {/* Tiptap editor */}
      <Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: labelClr,
            mb: 0.8,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Description
        </Typography>
        <Box
          sx={{
            border: `1.5px solid ${borderClr}`,
            borderRadius: "10px",
            overflow: "hidden",
            transition: "border-color 0.2s",
            "&:focus-within": { borderColor: PRIMARY },
            "& .ProseMirror": {
              outline: "none",
              minHeight: 130,
              maxHeight: 200,
              overflowY: "auto",
              px: 1.6,
              py: 1.4,
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: inputClr,
              backgroundColor: inputBg,
              caretColor: PRIMARY,
              "& p.is-editor-empty:first-of-type::before": {
                content: "attr(data-placeholder)",
                color: isDarkMode ? "rgba(148,163,184,0.5)" : "#94a3b8",
                pointerEvents: "none",
                float: "left",
                height: 0,
              },
              "& h2": {
                fontSize: "1rem",
                fontWeight: 700,
                mt: 1,
                mb: 0.5,
                color: headingClr,
              },
              "& ul, & ol": { pl: "1.4rem" },
              "& strong": { color: isDarkMode ? "#f1f5f9" : "#0f172a" },
            },
          }}
        >
          <EditorToolbar editor={editor} isDarkMode={isDarkMode} />
          <EditorContent editor={editor} />
        </Box>
      </Box>
    </Box>
  );

  /* ── Step 2: Budget & Timeline ── */
  const BudgetStep = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.8 }}>
      {/* Budget range */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: labelClr,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Estimated Budget Range
          </Typography>
          <Typography
            sx={{ fontSize: "0.85rem", fontWeight: 700, color: PRIMARY }}
          >
            {sliderValueToLabel(form.budgetMin)} –{" "}
            {sliderValueToLabel(form.budgetMax)}
          </Typography>
        </Box>
        <Slider
          value={[form.budgetMin, form.budgetMax]}
          onChange={(_, v) =>
            setForm((p) => ({ ...p, budgetMin: v[0], budgetMax: v[1] }))
          }
          min={0}
          max={100}
          step={25}
          marks={BUDGET_MARKS}
          valueLabelDisplay="off"
          sx={{
            color: PRIMARY,
            "& .MuiSlider-thumb": {
              backgroundColor: PRIMARY,
              border: `2px solid ${isDarkMode ? "#071a29" : "#fff"}`,
              width: 18,
              height: 18,
              "&:hover, &.Mui-focusVisible": {
                boxShadow: `0 0 0 6px ${PRIMARY}33`,
              },
            },
            "& .MuiSlider-track": {
              background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
              border: "none",
              height: 4,
            },
            "& .MuiSlider-rail": {
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "#e2e8f0",
              height: 4,
            },
            "& .MuiSlider-mark": { backgroundColor: "transparent" },
            "& .MuiSlider-markLabel": { fontSize: "0.72rem", color: labelClr },
          }}
        />
      </Box>

      {/* Deadline */}
      <TextField
        label="Deadline"
        type="date"
        value={form.deadline}
        onChange={set("deadline")}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: new Date().toISOString().split("T")[0] }}
        sx={{
          ...sharedInputSx,
          "& input[type='date']::-webkit-calendar-picker-indicator": {
            filter: isDarkMode ? "invert(0.7)" : "none",
            cursor: "pointer",
          },
        }}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", color: labelClr }}>
              <Calendar size={15} />
            </Box>
          ),
        }}
      />

      {/* Priority */}
      <Box>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: labelClr,
            mb: 1.2,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Priority
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {PRIORITY_LEVELS.map(({ value, label, color }) => {
            const active = form.priority === value;
            return (
              <Chip
                key={value}
                label={label}
                onClick={() => setForm((p) => ({ ...p, priority: value }))}
                size="small"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? `${color}22` : "transparent",
                  color: active ? color : labelClr,
                  border: `1.5px solid ${active ? color : borderClr}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  px: 0.8,
                  "&:hover": {
                    backgroundColor: `${color}18`,
                    color,
                    borderColor: color,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );

  /* ── Step 3: Contact ── */
  const ContactStep = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
      <Box
        sx={{
          p: 2,
          borderRadius: "10px",
          backgroundColor: isDarkMode
            ? "rgba(97,197,195,0.07)"
            : "rgba(97,197,195,0.06)",
          border: `1px solid ${isDarkMode ? "rgba(97,197,195,0.2)" : "rgba(97,197,195,0.25)"}`,
        }}
      >
        <Typography
          sx={{ fontSize: "0.82rem", color: labelClr, lineHeight: 1.6 }}
        >
          We'll send a confirmation and updates to your email. If you're logged
          in, your account email is used automatically.
        </Typography>
      </Box>

      <TextField
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={set("email")}
        fullWidth
        size="small"
        sx={sharedInputSx}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", color: labelClr }}>
              <Mail size={15} />
            </Box>
          ),
        }}
      />

      {/* Summary card */}
      <Box
        sx={{
          mt: 1,
          p: 2,
          borderRadius: "12px",
          border: `1px solid ${borderClr}`,
          backgroundColor: surfaceBg,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: labelClr,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            mb: 1.5,
          }}
        >
          Request Summary
        </Typography>
        {[
          { label: "Country", value: form.country || "—" },
          {
            label: "Type",
            value:
              REQUEST_TYPES.find((t) => t.value === form.type)?.label || "—",
          },
          { label: "Title", value: form.title || "—" },
          {
            label: "Budget",
            value: `${sliderValueToLabel(form.budgetMin)} – ${sliderValueToLabel(form.budgetMax)}`,
          },
          { label: "Deadline", value: form.deadline || "—" },
          {
            label: "Priority",
            value:
              PRIORITY_LEVELS.find((p) => p.value === form.priority)?.label ||
              "—",
          },
        ].map(({ label, value }) => (
          <Box
            key={label}
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}
          >
            <Typography
              sx={{ fontSize: "0.78rem", color: labelClr, fontWeight: 500 }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: headingClr,
                maxWidth: "60%",
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const STEP_CONTENT = [ScopeStep, DetailsStep, BudgetStep, ContactStep];

  /* ── Success view ── */
  const SuccessView = (
    <Box
      sx={{
        p: { xs: 4, sm: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${PRIMARY}22, ${SECONDARY}22)`,
          border: `2px solid ${PRIMARY}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
          "@keyframes popIn": {
            from: { transform: "scale(0)", opacity: 0 },
            to: { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        <CheckCircle2 size={34} color={PRIMARY} />
      </Box>

      <Typography
        sx={{ fontSize: "1.15rem", fontWeight: 800, color: headingClr }}
      >
        Request Submitted!
      </Typography>
      <Typography
        sx={{
          fontSize: "0.87rem",
          color: labelClr,
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        Your{" "}
        <strong style={{ color: headingClr }}>
          {REQUEST_TYPES.find((t) => t.value === form.type)?.label}
        </strong>{" "}
        request for{" "}
        <strong style={{ color: headingClr }}>{form.country}</strong> has been
        received.{" "}
        {form.email && (
          <>
            We'll notify you at{" "}
            <strong style={{ color: PRIMARY }}>{form.email}</strong>.
          </>
        )}
      </Typography>

      <Box
        sx={{
          mt: 1,
          px: 2.5,
          py: 1.4,
          borderRadius: "12px",
          backgroundColor: surfaceBg,
          border: `1px solid ${borderClr}`,
          display: "flex",
          gap: 2.5,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          {
            label: "Priority",
            value: PRIORITY_LEVELS.find((p) => p.value === form.priority)
              ?.label,
          },
          {
            label: "Budget",
            value: `${sliderValueToLabel(form.budgetMin)} – ${sliderValueToLabel(form.budgetMax)}`,
          },
          { label: "Deadline", value: form.deadline || "Open" },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.67rem",
                color: labelClr,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.83rem",
                fontWeight: 700,
                color: headingClr,
                mt: 0.3,
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Button
        onClick={handleClose}
        sx={{
          mt: 1,
          textTransform: "none",
          fontSize: "0.87rem",
          fontWeight: 700,
          borderRadius: "9px",
          px: 3.5,
          background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
          color: "#04121D",
          "&:hover": {
            boxShadow: `0 8px 24px ${PRIMARY}55`,
            transform: "translateY(-1px)",
          },
        }}
      >
        Done
      </Button>
    </Box>
  );

  /* ── Render ── */
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0,0,0,0.55)",
          },
        },
      }}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          backgroundColor: bg,
          borderRadius: "18px",
          border: `1px solid ${borderClr}`,
          boxShadow: isDarkMode
            ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(97,197,195,0.1)"
            : "0 32px 80px rgba(0,0,0,0.12)",
          overflow: "hidden",
          m: 2,
        },
      }}
    >
      {/* Gradient top stripe */}
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 50%, ${PURPLE} 100%)`,
        }}
      />

      <DialogContent sx={{ p: 0 }}>
        {submitted ? (
          SuccessView
        ) : (
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Modal header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, ${PRIMARY}22 0%, ${SECONDARY}22 100%)`,
                    border: `1px solid ${isDarkMode ? "rgba(97,197,195,0.25)" : "rgba(97,197,195,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SparkleTwoToneIcon sx={{ color: SECONDARY, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: headingClr,
                      lineHeight: 1.2,
                    }}
                  >
                    Request Any Data
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: labelClr, mt: 0.3 }}
                  >
                    Step {step + 1} of {STEPS.length} — {STEPS[step]}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{
                  color: labelClr,
                  borderRadius: "8px",
                  p: "6px",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.08)"
                      : "#f1f5f9",
                    color: inputClr,
                  },
                }}
              >
                <X size={17} />
              </IconButton>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
              {STEPS.map((label, i) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: "0.72rem",
                        color:
                          i <= step
                            ? isDarkMode
                              ? "#f1f5f9"
                              : "#0f172a"
                            : labelClr,
                        fontWeight: i === step ? 700 : 400,
                      },
                      "& .MuiStepIcon-root": {
                        color:
                          i < step
                            ? PRIMARY
                            : i === step
                              ? PRIMARY
                              : isDarkMode
                                ? "rgba(255,255,255,0.15)"
                                : "#e2e8f0",
                      },
                      "& .MuiStepIcon-root.Mui-active": { color: PRIMARY },
                      "& .MuiStepIcon-root.Mui-completed": { color: PRIMARY },
                      "& .MuiStepConnector-line": {
                        borderColor: isDarkMode
                          ? "rgba(255,255,255,0.12)"
                          : "#e2e8f0",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step content */}
            <Box sx={{ minHeight: 260 }}>{STEP_CONTENT[step]}</Box>

            {/* Navigation */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3.5 }}
            >
              <Button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                startIcon={<ChevronLeft size={15} />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: labelClr,
                  borderRadius: "9px",
                  px: 2,
                  visibility: step === 0 ? "hidden" : "visible",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.06)"
                      : "#f1f5f9",
                  },
                }}
              >
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  endIcon={<ChevronRight size={15} />}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    borderRadius: "9px",
                    px: 2.8,
                    background: canNext()
                      ? `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`
                      : isDarkMode
                        ? "rgba(255,255,255,0.1)"
                        : "#e2e8f0",
                    color: canNext()
                      ? "#04121D"
                      : isDarkMode
                        ? "rgba(255,255,255,0.3)"
                        : "#94a3b8",
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                    "&:hover": canNext()
                      ? {
                          boxShadow: `0 8px 24px ${PRIMARY}44`,
                          transform: "translateY(-1px)",
                        }
                      : {},
                    "&:disabled": {
                      background: isDarkMode
                        ? "rgba(255,255,255,0.1)"
                        : "#e2e8f0",
                      color: isDarkMode ? "rgba(255,255,255,0.3)" : "#94a3b8",
                    },
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  startIcon={<Send size={15} />}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    borderRadius: "9px",
                    px: 2.8,
                    background: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                    color: "#04121D",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: `0 8px 24px ${PRIMARY}44`,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Submit Request
                </Button>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

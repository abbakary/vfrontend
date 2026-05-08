import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import DashboardLayout from "../components/DashboardLayout";

const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// -------------------
// TIPTAP EDITOR
// -------------------
const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btn = (action, isActive, icon, title) => (
    <button
      type="button"
      title={title}
      onClick={action}
      style={{
        background: isActive ? "#61C5C3" : "none",
        color: isActive ? "#fff" : "#475569",
        border: "1px solid",
        borderColor: isActive ? "#61C5C3" : "#e2e8f0",
        borderRadius: 6,
        padding: "4px 9px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#f0fffe";
          e.currentTarget.style.borderColor = "#61C5C3";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }
      }}
    >
      {icon}
    </button>
  );

  const divider = () => (
    <div
      style={{
        width: 1,
        background: "#e2e8f0",
        margin: "0 4px",
        alignSelf: "stretch",
      }}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        alignItems: "center",
        padding: "8px 10px",
        borderBottom: "1px solid #e2e8f0",
        background: "#fff",
      }}
    >
      {btn(
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive("bold"),
        <b>B</b>,
        "Bold",
      )}
      {btn(
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive("italic"),
        <i>I</i>,
        "Italic",
      )}
      {btn(
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive("underline"),
        <u>U</u>,
        "Underline",
      )}
      {btn(
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive("strike"),
        <s>S</s>,
        "Strikethrough",
      )}
      {divider()}
      {btn(
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive("heading", { level: 2 }),
        "H2",
        "Heading 2",
      )}
      {btn(
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive("heading", { level: 3 }),
        "H3",
        "Heading 3",
      )}
      {divider()}
      {btn(
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive("bulletList"),
        "• List",
        "Bullet List",
      )}
      {btn(
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive("orderedList"),
        "1. List",
        "Numbered List",
      )}
      {btn(
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive("blockquote"),
        "❝",
        "Blockquote",
      )}
      {divider()}
      {btn(() => editor.chain().focus().undo().run(), false, "↩", "Undo")}
      {btn(() => editor.chain().focus().redo().run(), false, "↪", "Redo")}
      {btn(
        () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
        false,
        "✕",
        "Clear Format",
      )}
    </div>
  );
};

const RichTextEditor = ({ label, value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
            fontSize: 13,
            color: "#475569",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
          background: "#f8fafc",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#61C5C3")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
      >
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap { padding: 12px 14px; outline: none; font-size: 14px; color: #1a202c; line-height: 1.6; min-height: 130px; }
        .tiptap p { margin: 0 0 8px 0; }
        .tiptap h2 { font-size: 18px; font-weight: 700; margin: 12px 0 6px 0; color: #1a202c; }
        .tiptap h3 { font-size: 15px; font-weight: 700; margin: 10px 0 4px 0; color: #1a202c; }
        .tiptap ul, .tiptap ol { padding-left: 20px; margin: 6px 0; }
        .tiptap li { margin: 2px 0; }
        .tiptap blockquote { border-left: 3px solid #61C5C3; padding-left: 12px; color: #64748b; margin: 8px 0; font-style: italic; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap p.is-editor-empty:first-child::before { color: #94a3b8; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .tiptap:focus { outline: none; }
      `}</style>
    </div>
  );
};

// -------------------
// UI COMPONENTS
// -------------------
const Input = ({ label, required, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          fontSize: 13,
          color: "#475569",
        }}
      >
        {label}
        {required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
      </div>
    )}
    <input
      required={required}
      style={{
        width: "100%",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        color: "#1a202c",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#61C5C3")}
      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      {...props}
    />
  </div>
);

const SelectField = ({ label, required, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          fontSize: 13,
          color: "#475569",
        }}
      >
        {label}
        {required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
      </div>
    )}
    <select
      required={required}
      style={{
        width: "100%",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        color: "#1a202c",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#61C5C3")}
      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      {...props}
    >
      {children}
    </select>
  </div>
);

// -------------------
// AUTOCOMPLETE
// -------------------
const AutocompleteField = ({
  label,
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  required,
  hasError,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ marginBottom: 16, position: "relative" }} ref={ref}>
      {label && (
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
            fontSize: 13,
            color: "#475569",
          }}
        >
          {label}
          {required && (
            <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>
          )}
        </div>
      )}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          background: disabled ? "#f1f5f9" : "#f8fafc",
          border: `1px solid ${hasError ? "#fc8181" : "#e2e8f0"}`,
          borderRadius: 10,
          padding: "10px 14px",
          color: disabled ? "#94a3b8" : "#1a202c",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocusCapture={(e) => {
          if (!disabled) e.target.style.borderColor = "#61C5C3";
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = hasError ? "#fc8181" : "#e2e8f0";
        }}
      />
      {open && suggestions.length > 0 && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => {
                onSelect(s);
                setOpen(false);
              }}
              style={{
                padding: "10px 14px",
                fontSize: 14,
                cursor: "pointer",
                borderBottom:
                  i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f0fffe")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {s.label}
              {s.sublabel && (
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>
                  {s.sublabel}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------
// TAG INPUT
// -------------------
const TagInput = ({ tags, onChange, allTags }) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (val) => {
    setInput(val);
    if (val.trim().length > 0) {
      setSuggestions(
        allTags
          .filter(
            (t) =>
              t.name.toLowerCase().includes(val.toLowerCase()) &&
              !tags.includes(t.name),
          )
          .slice(0, 8),
      );
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const addTag = (tagName) => {
    const clean = tagName.trim();
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0)
      removeTag(tags[tags.length - 1]);
  };

  return (
    <div style={{ marginBottom: 16 }} ref={ref}>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          fontSize: 13,
          color: "#475569",
        }}
      >
        Tags{" "}
        <span style={{ fontWeight: 400, color: "#94a3b8" }}>
          (type to search or add new)
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "8px 12px",
          minHeight: 44,
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: "#e0f7f7",
              color: "#0d9488",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tag}
            <span
              onClick={() => removeTag(tag)}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ×
            </span>
          </span>
        ))}
        <div style={{ position: "relative", flex: 1, minWidth: 120 }}>
          <input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input && setOpen(true)}
            placeholder={
              tags.length === 0
                ? "Type a tag and press Enter..."
                : "Add more..."
            }
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: "#1a202c",
              width: "100%",
              padding: "2px 0",
            }}
          />
          {open && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 100,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                maxHeight: 200,
                overflowY: "auto",
                minWidth: 200,
              }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onMouseDown={() => addTag(s.name)}
                  style={{
                    padding: "8px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    borderBottom:
                      i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f0fffe")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
        Press Enter or comma to add a new tag
      </div>
    </div>
  );
};

// -------------------
// UPLOAD PROGRESS BAR
// -------------------
const UploadProgress = ({ progress, fileName }) => (
  <div style={{ marginTop: 8, marginBottom: 4 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "#475569",
        marginBottom: 4,
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "80%",
        }}
      >
        📤 {fileName}
      </span>
      <span
        style={{
          fontWeight: 700,
          color: progress === 100 ? "#10b981" : "#61C5C3",
        }}
      >
        {progress}%
      </span>
    </div>
    <div
      style={{
        height: 6,
        background: "#e2e8f0",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 10,
          transition: "width 0.3s ease",
          background: progress === 100 ? "#10b981" : "#61C5C3",
          width: `${progress}%`,
        }}
      />
    </div>
    {progress === 100 && (
      <div
        style={{
          fontSize: 11,
          color: "#10b981",
          marginTop: 3,
          fontWeight: 600,
        }}
      >
        ✅ Upload complete
      </div>
    )}
  </div>
);

// -------------------
// CONSTANTS
// -------------------
const RESOURCE_TYPES = [
  "csv",
  "excel",
  "geojson",
  "shapefile",
  "kml",
  "tiff",
  "pdf",
  "image",
  "api",
  "wms",
  "wfs",
  "xyz_tiles",
  "zip",
  "json",
  "link",
];
const LICENSE_TYPES = ["standard", "extended", "exclusive"];
const PRICING_TYPES = ["free", "paid_once", "subscription", "request_quote"];

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Version" },
  { number: 3, label: "Resources" },
  { number: 4, label: "Pricing" },
];

const StepIndicator = ({ currentStep }) => (
  <div
    style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 0 }}
  >
    {STEPS.map((s, i) => (
      <div
        key={s.number}
        style={{
          display: "flex",
          alignItems: "center",
          flex: i < STEPS.length - 1 ? 1 : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              background: currentStep >= s.number ? "#61C5C3" : "#e2e8f0",
              color: currentStep >= s.number ? "#fff" : "#94a3b8",
              transition: "all 0.3s",
              flexShrink: 0,
            }}
          >
            {currentStep > s.number ? "✓" : s.number}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: currentStep >= s.number ? "#61C5C3" : "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div
            style={{
              flex: 1,
              height: 2,
              background: currentStep > s.number ? "#61C5C3" : "#e2e8f0",
              margin: "0 8px",
              marginBottom: 20,
              transition: "background 0.3s",
            }}
          />
        )}
      </div>
    ))}
  </div>
);

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
};
const nextBtnStyle = {
  background: "#61C5C3",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderRadius: 10,
  padding: "12px 32px",
  cursor: "pointer",
};
const backBtnStyle = {
  background: "#f1f5f9",
  color: "#64748b",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderRadius: 10,
  padding: "12px 32px",
  cursor: "pointer",
};
const btnRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginTop: 24,
};

const EMPTY_RESOURCE = {
  name: "",
  resource_type: "csv",
  external_url: "",
  file: null,
  is_primary: false,
  is_downloadable: true,
  uploadMode: "url",
  progress: 0,
  uploaded: false,
};

const INITIAL_FORM = {
  category_id: "", // top-level category (UI only, not sent to API)
  dataset_category_id: "", // sub-category → sent as category_id to API
  country: "",
  country_code: "",
  region: "",
  title: "",
  // summary removed — not collected or sent
  description: "",
  version_name: "",
  change_log: "",
  pricing_type: "free",
  price: "0",
  currency: "USD",
  license_type: "standard",
};

// -------------------
// MAIN COMPONENT
// -------------------
export default function AddListing() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [tags, setTags] = useState([]);
  const [resources, setResources] = useState([{ ...EMPTY_RESOURCE }]);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null);

  // --- Category state ---
  const [categories, setCategories] = useState([]);
  const [datasetCategories, setDatasetCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [datasetCategoryInput, setDatasetCategoryInput] = useState("");

  // --- Field-level errors for Step 1 ---
  const [fieldErrors, setFieldErrors] = useState({});

  const [countries, setCountries] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [datasetId, setDatasetId] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [versionName, setVersionName] = useState("");
  const [countryInput, setCountryInput] = useState("");

  const countrySuggestions =
    countryInput.length > 0
      ? countries
          .filter((c) =>
            c.country.toLowerCase().includes(countryInput.toLowerCase()),
          )
          .slice(0, 8)
          .map((c) => ({ label: c.country, sublabel: c.region, data: c }))
      : [];

  const categorySuggestions =
    categoryInput.length > 0
      ? categories
          .filter((c) =>
            c.name.toLowerCase().includes(categoryInput.toLowerCase()),
          )
          .slice(0, 8)
          .map((c) => ({ label: c.name, data: c }))
      : categories.slice(0, 8).map((c) => ({ label: c.name, data: c }));

  const datasetCategorySuggestions =
    datasetCategoryInput.length > 0
      ? datasetCategories
          .filter((c) =>
            c.name.toLowerCase().includes(datasetCategoryInput.toLowerCase()),
          )
          .slice(0, 8)
          .map((c) => ({ label: c.name, data: c }))
      : datasetCategories.slice(0, 8).map((c) => ({ label: c.name, data: c }));

  useEffect(() => {
    async function fetchMeta() {
      try {
        const userRes = await fetch(`${BASE_URL}/auth/me`, {
          headers: authHeaders(),
        });
        if (!userRes.ok) throw new Error("Failed to fetch user info");
        const userData = await userRes.json();
        setUser(userData);

        const sellerRes = await fetch(`${BASE_URL}/seller-profiles/check-me`, {
          headers: authHeaders(),
        });
        if (sellerRes.ok) {
          const sellerData = await sellerRes.json();
          setSellerId(sellerData.profile.id);
          setSellerStatus(sellerData.status);
        } else {
          const errData = await sellerRes.json();
          setSellerStatus("not_seller");
          setError(errData.detail || "You are not registered as a seller.");
        }

        const catRes = await fetch(`${BASE_URL}/categories/active/list`, {
          headers: authHeaders(),
        });
        if (catRes.ok) {
          const d = await catRes.json();
          setCategories(Array.isArray(d) ? d : []);
        }

        const countryRes = await fetch(
          `${BASE_URL}/africa-countries/?page_size=100`,
          { headers: authHeaders() },
        );
        if (countryRes.ok) {
          const d = await countryRes.json();
          setCountries(d.data || d);
        }

        const tagsRes = await fetch(`${BASE_URL}/tags/?page_size=100`, {
          headers: authHeaders(),
        });
        if (tagsRes.ok) {
          const d = await tagsRes.json();
          setAllTags(d.data || []);
        }
      } catch (err) {
        setError("Could not load page data. Please refresh or login again.");
      }
    }
    fetchMeta();
  }, []);

  // When top-level category changes, load sub-categories
  useEffect(() => {
    if (!form.category_id) {
      setDatasetCategories([]);
      setDatasetCategoryInput("");
      setForm((prev) => ({ ...prev, dataset_category_id: "" }));
      return;
    }

    async function fetchDatasetCategories() {
      try {
        const res = await fetch(
          `${BASE_URL}/dataset-categories/by-category/${form.category_id}`,
          { headers: authHeaders() },
        );
        if (res.ok) {
          const d = await res.json();
          setDatasetCategories(Array.isArray(d) ? d : []);
        }
      } catch {
        setDatasetCategories([]);
      }
    }
    fetchDatasetCategories();
  }, [form.category_id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field error on change
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleCategorySelect = (suggestion) => {
    setCategoryInput(suggestion.label);
    setDatasetCategoryInput("");
    setForm((prev) => ({
      ...prev,
      category_id: suggestion.data.id,
      dataset_category_id: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      category_id: "",
      dataset_category_id: "",
    }));
  };

  const handleDatasetCategorySelect = (suggestion) => {
    setDatasetCategoryInput(suggestion.label);
    setForm((prev) => ({ ...prev, dataset_category_id: suggestion.data.id }));
    setFieldErrors((prev) => ({ ...prev, dataset_category_id: "" }));
  };

  const handleCountrySelect = (suggestion) => {
    setCountryInput(suggestion.label);
    setForm((prev) => ({
      ...prev,
      country: suggestion.data.country,
      country_code: suggestion.data.country_code,
      region: suggestion.data.region,
    }));
    setFieldErrors((prev) => ({ ...prev, country: "" }));
  };

  const handleResourceChange = (index, field, value) =>
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );

  const addResource = () =>
    setResources((prev) => [...prev, { ...EMPTY_RESOURCE }]);

  const removeResource = (index) => {
    if (resources.length === 1) return;
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFileWithProgress = (r, index) =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("record_type", "dataset");
      formData.append("record_id", datasetId);
      formData.append("name", r.name);
      formData.append("resource_type", r.resource_type);
      formData.append("version_id", versionId);
      formData.append("version", versionName);
      formData.append("is_primary", r.is_primary);
      formData.append("is_downloadable", r.is_downloadable);
      formData.append("file", r.file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/resources/upload-file`);
      xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          handleResourceChange(
            index,
            "progress",
            Math.round((e.loaded / e.total) * 100),
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          handleResourceChange(index, "progress", 100);
          handleResourceChange(index, "uploaded", true);
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(
            new Error(JSON.parse(xhr.responseText)?.detail || "Upload failed"),
          );
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });

  // -------------------
  // STEP VALIDATION
  // -------------------
  const validateStep1 = () => {
    const errors = {};

    if (!form.category_id) {
      errors.category_id = "Please select a category.";
    }
    if (!form.dataset_category_id) {
      errors.dataset_category_id = "Please select a sub-category.";
    }
    if (!form.country_code) {
      errors.country = "Please select a country.";
    }
    if (!form.title || !form.title.trim()) {
      errors.title = "Title is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // -------------------
  // STEP SUBMISSIONS
  // -------------------
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateStep1()) {
      setError("Please fill in all required fields before proceeding.");
      return;
    }

    setStepLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/seller-dataset-registration/step-one`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            owner_user_id: user.id,
            seller_profile_id: sellerId,
            category_id: Number(form.dataset_category_id), // sub-category id → required, non-null
            country_code: form.country_code,
            region: form.region,
            country: form.country,
            title: form.title.trim(),
            // summary removed — not sent to API
            description: form.description,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Step 1 failed");
      }
      const data = await res.json();
      setDatasetId(data.dataset_id);
      setForm((prev) => ({ ...prev, dataset_id: data.dataset_id }));
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.version_name || !form.version_name.trim()) {
      setError("Version name is required.");
      return;
    }

    setStepLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/seller-dataset-registration/step-two`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            dataset_id: datasetId,
            version_name: form.version_name.trim(),
            change_log: form.change_log,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Step 2 failed");
      }
      const data = await res.json();
      setVersionId(data.version_id);
      setVersionName(data.version_name);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError("");
    setStepLoading(true);
    try {
      for (let i = 0; i < resources.length; i++) {
        const r = resources[i];
        if (r.uploadMode === "file" && r.file) {
          await uploadFileWithProgress(r, i);
        }
      }

      const urlResources = resources.filter(
        (r) => r.uploadMode === "url" && r.name,
      );
      if (urlResources.length > 0) {
        const res = await fetch(
          `${BASE_URL}/seller-dataset-registration/step-three`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              dataset_id: datasetId,
              version_id: versionId,
              version_name: versionName,
              resources: urlResources.map((r) => ({
                record_type: "dataset",
                record_id: datasetId,
                name: r.name,
                resource_type: r.resource_type,
                external_url: r.external_url || null,
                is_primary: r.is_primary,
                is_downloadable: r.is_downloadable,
              })),
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Step 3 failed");
        }
      }

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/seller-dataset-registration/step-four`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            dataset_id: datasetId,
            tags: tags,
            pricing: {
              record_type: "dataset",
              record_id: datasetId,
              pricing_type: form.pricing_type,
              price: parseFloat(form.price) || 0,
              currency: form.currency,
              license_type: form.license_type,
            },
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Step 4 failed");
      }
      const data = await res.json();
      setSuccess(data.message || "Listing submitted successfully! 🎉");
      setStep(1);
      setForm(INITIAL_FORM);
      setTags([]);
      setResources([{ ...EMPTY_RESOURCE }]);
      setDatasetId(null);
      setVersionId(null);
      setVersionName("");
      setCountryInput("");
      setCategoryInput("");
      setDatasetCategoryInput("");
      setDatasetCategories([]);
      setFieldErrors({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // ERROR COMPONENTS
  // -------------------
  const ErrorBox = ({ msg }) =>
    msg ? (
      <div
        style={{
          background: "#fff5f5",
          border: "1px solid #fed7d7",
          color: "#c53030",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        {msg}
      </div>
    ) : null;

  const FieldError = ({ msg }) =>
    msg ? (
      <div
        style={{
          color: "#e53e3e",
          fontSize: 12,
          marginTop: -10,
          marginBottom: 10,
        }}
      >
        ⚠ {msg}
      </div>
    ) : null;

  if (sellerStatus === "not_seller" || sellerStatus === "suspended") {
    return (
      <DashboardLayout>
        <div
          style={{
            maxWidth: 500,
            margin: "80px auto",
            padding: 40,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "#1a202c",
              marginBottom: 8,
            }}
          >
            Access Denied
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {sellerStatus === "suspended"
              ? "Your seller account has been suspended."
              : "You need an active seller profile to add listings."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        style={{
          maxWidth: 900,
          margin: "32px auto 0 auto",
          padding: "32px 32px 48px 32px",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          minHeight: 600,
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontSize: 26,
            marginBottom: 6,
            color: "#1a202c",
          }}
        >
          Add New Listing
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
          Complete all steps to publish your dataset listing.
        </p>

        <StepIndicator currentStep={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} style={cardStyle}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 20,
                color: "#1a202c",
              }}
            >
              Basic Info
            </h2>

            {/* Top-level Category */}
            <AutocompleteField
              label="Category"
              required
              value={categoryInput}
              hasError={!!fieldErrors.category_id}
              onChange={(val) => {
                setCategoryInput(val);
                setDatasetCategoryInput("");
                setForm((prev) => ({
                  ...prev,
                  category_id: "",
                  dataset_category_id: "",
                }));
                setFieldErrors((prev) => ({
                  ...prev,
                  category_id: "",
                  dataset_category_id: "",
                }));
              }}
              suggestions={categorySuggestions}
              onSelect={handleCategorySelect}
              placeholder="Type to search category..."
            />
            <FieldError msg={fieldErrors.category_id} />

            {/* Sub-category — shown after top-level category is selected */}
            {form.category_id ? (
              <>
                <AutocompleteField
                  label="Sub-category"
                  required
                  value={datasetCategoryInput}
                  hasError={!!fieldErrors.dataset_category_id}
                  onChange={(val) => {
                    setDatasetCategoryInput(val);
                    setForm((prev) => ({ ...prev, dataset_category_id: "" }));
                    setFieldErrors((prev) => ({
                      ...prev,
                      dataset_category_id: "",
                    }));
                  }}
                  suggestions={datasetCategorySuggestions}
                  onSelect={handleDatasetCategorySelect}
                  placeholder={
                    datasetCategories.length === 0
                      ? "No sub-categories available"
                      : "Type to search sub-category..."
                  }
                  disabled={datasetCategories.length === 0}
                />
                <FieldError msg={fieldErrors.dataset_category_id} />
              </>
            ) : (
              // Greyed-out disabled placeholder shown before category is picked
              <AutocompleteField
                label="Sub-category"
                required
                value=""
                onChange={() => {}}
                suggestions={[]}
                onSelect={() => {}}
                placeholder="Select a category first..."
                disabled
                hasError={!!fieldErrors.dataset_category_id}
              />
            )}

            {/* Country */}
            <AutocompleteField
              label="Country"
              required
              value={countryInput}
              hasError={!!fieldErrors.country}
              onChange={(val) => {
                setCountryInput(val);
                setFieldErrors((prev) => ({ ...prev, country: "" }));
              }}
              suggestions={countrySuggestions}
              onSelect={handleCountrySelect}
              placeholder="Type to search country..."
            />
            <FieldError msg={fieldErrors.country} />

            <input type="hidden" value={form.region} readOnly />
            <input type="hidden" value={form.country_code} readOnly />

            <Input
              label="Title"
              required
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter a clear, descriptive title"
            />
            <FieldError msg={fieldErrors.title} />

            {/* Summary field removed */}

            <RichTextEditor
              label="Description"
              value={form.description}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, description: val }))
              }
              placeholder="Write a full description of your dataset..."
            />

            <ErrorBox msg={error} />
            <div style={{ ...btnRowStyle, justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={stepLoading}
                style={{ ...nextBtnStyle, opacity: stepLoading ? 0.7 : 1 }}
              >
                {stepLoading ? "Saving..." : "Next →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} style={cardStyle}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 20,
                color: "#1a202c",
              }}
            >
              Version Details
            </h2>

            <Input
              label="Version Name"
              required
              name="version_name"
              value={form.version_name}
              onChange={handleChange}
              placeholder="e.g. 1.0.0"
            />

            <RichTextEditor
              label="Change Log / Release Notes"
              value={form.change_log}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, change_log: val }))
              }
              placeholder="Describe what's new in this version..."
            />

            <ErrorBox msg={error} />
            <div style={btnRowStyle}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={backBtnStyle}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={stepLoading}
                style={{ ...nextBtnStyle, opacity: stepLoading ? 0.7 : 1 }}
              >
                {stepLoading ? "Saving..." : "Next →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} style={cardStyle}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 4,
                color: "#1a202c",
              }}
            >
              Resources
            </h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
              Add files or links. Upload up to 200MB per file.
            </p>

            {resources.map((r, index) => (
              <div
                key={index}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}
                  >
                    Resource {index + 1}
                  </span>
                  {resources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      style={{
                        background: "#fff5f5",
                        border: "1px solid #fed7d7",
                        color: "#c53030",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <Input
                  label="Resource Name"
                  required
                  value={r.name}
                  onChange={(e) =>
                    handleResourceChange(index, "name", e.target.value)
                  }
                  placeholder="e.g. Tanzania Population CSV"
                />

                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    Resource Type <span style={{ color: "#e53e3e" }}>*</span>
                  </div>
                  <select
                    value={r.resource_type}
                    onChange={(e) =>
                      handleResourceChange(
                        index,
                        "resource_type",
                        e.target.value,
                      )
                    }
                    required
                    style={{
                      width: "100%",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["url", "file"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        handleResourceChange(index, "uploadMode", mode)
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background:
                          r.uploadMode === mode ? "#61C5C3" : "#f1f5f9",
                        color: r.uploadMode === mode ? "#fff" : "#64748b",
                        borderColor:
                          r.uploadMode === mode ? "#61C5C3" : "#e2e8f0",
                      }}
                    >
                      {mode === "url" ? "🔗 External URL" : "📁 Upload File"}
                    </button>
                  ))}
                </div>

                {r.uploadMode === "url" ? (
                  <Input
                    label="External URL"
                    value={r.external_url}
                    onChange={(e) =>
                      handleResourceChange(
                        index,
                        "external_url",
                        e.target.value,
                      )
                    }
                    placeholder="https://example.com/file.csv"
                    type="url"
                  />
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        fontSize: 13,
                        color: "#475569",
                      }}
                    >
                      Upload File (max 200MB)
                    </div>
                    <input
                      type="file"
                      onChange={(e) => {
                        handleResourceChange(index, "file", e.target.files[0]);
                        handleResourceChange(index, "progress", 0);
                        handleResourceChange(index, "uploaded", false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        fontSize: 13,
                        color: "#475569",
                      }}
                    />
                    {r.file && r.progress === 0 && !r.uploaded && (
                      <div
                        style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                      >
                        📄 {r.file.name} (
                        {(r.file.size / 1024 / 1024).toFixed(2)} MB) — uploads
                        when you click Next
                      </div>
                    )}
                    {r.file && r.progress > 0 && (
                      <UploadProgress
                        progress={r.progress}
                        fileName={r.file.name}
                      />
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={r.is_primary}
                      onChange={(e) =>
                        handleResourceChange(
                          index,
                          "is_primary",
                          e.target.checked,
                        )
                      }
                    />
                    Primary Resource
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={r.is_downloadable}
                      onChange={(e) =>
                        handleResourceChange(
                          index,
                          "is_downloadable",
                          e.target.checked,
                        )
                      }
                    />
                    Downloadable
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addResource}
              style={{
                width: "100%",
                background: "#f0fffe",
                border: "2px dashed #61C5C3",
                color: "#61C5C3",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              + Add Another Resource
            </button>

            <ErrorBox msg={error} />
            <div style={btnRowStyle}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={backBtnStyle}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={stepLoading}
                style={{ ...nextBtnStyle, opacity: stepLoading ? 0.7 : 1 }}
              >
                {stepLoading ? "Uploading..." : "Next →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <form onSubmit={handleStep4Submit} style={cardStyle}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 20,
                color: "#1a202c",
              }}
            >
              Pricing & Tags
            </h2>

            <SelectField
              label="Pricing Type"
              required
              name="pricing_type"
              value={form.pricing_type}
              onChange={handleChange}
            >
              {PRICING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </SelectField>

            <Input
              label="Price"
              required
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 49.99 (use 0 for free)"
              type="number"
              min="0"
              step="0.01"
            />
            <Input
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              placeholder="e.g. USD"
            />

            <SelectField
              label="License Type"
              required
              name="license_type"
              value={form.license_type}
              onChange={handleChange}
            >
              {LICENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </SelectField>

            <TagInput tags={tags} onChange={setTags} allTags={allTags} />

            <ErrorBox msg={error} />
            {success && (
              <div
                style={{
                  background: "#f0fff4",
                  border: "1px solid #c6f6d5",
                  color: "#276749",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {success}
              </div>
            )}

            <div style={btnRowStyle}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={backBtnStyle}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...nextBtnStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Submitting..." : "Submit Listing ✓"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

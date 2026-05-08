import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Edit,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

const BASE_URL = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const api = {
  get: (path) =>
    fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then((r) =>
      r.json(),
    ),
  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
};

// -------------------
// UI COMPONENTS
// -------------------
const Input = ({ style, ...p }) => (
  <input
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#1a202c",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.2s",
      ...style,
    }}
    onFocus={(e) => (e.target.style.borderColor = "#61C5C3")}
    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
    {...p}
  />
);

const Sel = ({ value, onChange, children, style }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#1a202c",
      fontSize: 14,
      outline: "none",
      cursor: "pointer",
      ...style,
    }}
  >
    {children}
  </select>
);

const Badge = ({ s }) => {
  const map = {
    public: { bg: "#ebf8ff", color: "#3182ce" },
    private: { bg: "#fffaf0", color: "#dd6b20" },
    restricted: { bg: "#faf5ff", color: "#805ad5" },
  };
  const st = map[s] || map.private;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        background: st.bg,
        color: st.color,
      }}
    >
      {s || "—"}
    </span>
  );
};

const Toast = ({ msg, type }) =>
  msg ? (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        background: type === "error" ? "#fff5f5" : "#f0fff4",
        border: `1px solid ${type === "error" ? "#fed7d7" : "#c6f6d5"}`,
        color: type === "error" ? "#c53030" : "#276749",
        borderRadius: 12,
        padding: "12px 20px",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {msg}
    </div>
  ) : null;

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 32,
          width: "100%",
          maxWidth: 600,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              color: "#1a202c",
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a0aec0",
              cursor: "pointer",
            }}
          >
            <X size={22} />
          </button>
        </div>
        {children}
        {footer && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const EMPTY_FORM = {
  title: "",
  summary: "",
  description: "",
  visibility: "public",
  category_id: "",
  country_code: "",
  region: "",
  country: "",
};

export default function InventoryPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  useEffect(() => {
    fetchDatasets();
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [catData, countryData] = await Promise.all([
        api.get("/categories/?page_size=100"),
        api.get("/africa-countries/?page_size=100"),
      ]);
      setCategories(catData?.items || []);
      setCountries(countryData?.data || countryData || []);
    } catch (err) {
      console.error("Form data error:", err);
    }
  };

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      let all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const d = await api.get(`/datasets/mine?page=${page}&page_size=100`);
        all = [...all, ...(d?.items || [])];
        totalPages = d?.total_pages || 1;
        page++;
      } while (page <= totalPages);
      setDatasets(all);
    } catch {
      showToast("Failed to load datasets", "error");
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (d) => {
    setSelected(d);
    setEditForm({
      title: d.title || "",
      summary: d.summary || "",
      description: d.description || "",
      visibility: d.visibility || "public",
      category_id: d.category_id || "",
      country_code: d.country_code || "",
      region: d.region || "",
      country: d.country || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    try {
      setSaving(true);
      const res = await api.put(`/datasets/${selected.id}`, {
        title: editForm.title.trim(),
        summary: editForm.summary?.trim() || "",
        description: editForm.description?.trim() || "",
        visibility: editForm.visibility,
        category_id: parseInt(editForm.category_id) || null,
        country_code: editForm.country_code || "",
        region: editForm.region || "",
        country: editForm.country || "",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update");
      }
      showToast("Dataset updated successfully");
      setIsEditOpen(false);
      setSelected(null);
      fetchDatasets();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter by visibility
  const filteredData = useMemo(
    () =>
      visibilityFilter === "all"
        ? datasets
        : datasets.filter((d) => d.visibility === visibilityFilter),
    [datasets, visibilityFilter],
  );

  // -------------------
  // STATS
  // -------------------
  const totalViews = datasets.reduce((s, d) => s + (d.total_views || 0), 0);
  const totalDownloads = datasets.reduce(
    (s, d) => s + (d.total_downloads || 0),
    0,
  );

  // -------------------
  // TABLE COLUMNS
  // -------------------
  const columns = useMemo(
    () => [
      {
        header: "#",
        id: "index",
        size: 50,
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <span style={{ color: "#a0aec0", fontWeight: 600, fontSize: 13 }}>
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        header: "Title",
        accessorKey: "title",
        cell: ({ getValue, row }) => (
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#1a202c",
                fontSize: 14,
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getValue() || "Untitled"}
            </div>
            {row.original.summary && (
              <div
                style={{
                  fontSize: 12,
                  color: "#718096",
                  marginTop: 2,
                  maxWidth: 240,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.original.summary}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Country",
        accessorKey: "country",
        size: 120,
        cell: ({ getValue, row }) => (
          <span style={{ fontSize: 13, color: "#475569" }}>
            {getValue() || row.original.country_code || "—"}
          </span>
        ),
      },
      {
        header: "Category",
        accessorKey: "category_id",
        size: 100,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 13, color: "#20B2AA", fontWeight: 700 }}>
            {getValue() ? `#${getValue()}` : "—"}
          </span>
        ),
      },
      {
        header: "Visibility",
        accessorKey: "visibility",
        size: 110,
        cell: ({ getValue }) => <Badge s={getValue() || "public"} />,
      },
      {
        header: "Views",
        accessorKey: "total_views",
        size: 80,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            {(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Downloads",
        accessorKey: "total_downloads",
        size: 100,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            {(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Sales",
        accessorKey: "total_sales",
        size: 80,
        cell: ({ getValue }) => (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: getValue() > 0 ? "#38a169" : "#a0aec0",
            }}
          >
            {(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Created",
        accessorKey: "created_at",
        size: 110,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 12, color: "#718096" }}>
            {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        size: 80,
        cell: ({ row }) => (
          <button
            onClick={() => openEdit(row.original)}
            style={{
              padding: "6px 14px",
              background: "#FF8C00",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Edit size={13} /> Edit
          </button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <DashboardLayout role="seller">
      <Toast msg={toast.msg} type={toast.type} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24 }}>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#1a202c",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Inventory
          </h2>
          <p
            style={{
              color: "#718096",
              margin: "4px 0 0",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Manage all your dataset listings
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 16,
          }}
        >
          {[
            {
              label: "Total Listings",
              value: datasets.length,
              icon: <Package size={24} />,
              color: "#718096",
            },
            {
              label: "Public",
              value: datasets.filter((d) => d.visibility === "public").length,
              icon: <CheckCircle size={24} />,
              color: "#38a169",
            },
            {
              label: "Private",
              value: datasets.filter((d) => d.visibility === "private").length,
              icon: <Clock size={24} />,
              color: "#dd6b20",
            },
            {
              label: "Restricted",
              value: datasets.filter((d) => d.visibility === "restricted")
                .length,
              icon: <XCircle size={24} />,
              color: "#805ad5",
            },
            {
              label: "Total Views",
              value: totalViews.toLocaleString(),
              icon: <Package size={24} />,
              color: "#3182ce",
            },
            {
              label: "Downloads",
              value: totalDownloads.toLocaleString(),
              icon: <Package size={24} />,
              color: "#20B2AA",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                borderRadius: 14,
                background: "#fff",
                border: "1px solid #edf2f7",
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  padding: 8,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#718096",
                    margin: 0,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: s.color,
                    margin: "2px 0 0",
                  }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a202c" }}>
              Datasets
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#a0aec0",
                }}
              >
                ({table.getFilteredRowModel().rows.length} results)
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search all columns..."
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 14,
                  outline: "none",
                  minWidth: 220,
                  color: "#1a202c",
                }}
              />
              <Sel
                value={visibilityFilter}
                onChange={setVisibilityFilter}
                style={{ minWidth: 140 }}
              >
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
              </Sel>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 14,
                  outline: "none",
                  color: "#1a202c",
                  cursor: "pointer",
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    Show {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#718096",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                Loading your inventory...
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p
                  style={{
                    color: "#718096",
                    fontSize: 15,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  No datasets found
                </p>
                <p style={{ color: "#a0aec0", fontSize: 13, marginTop: 4 }}>
                  {globalFilter
                    ? "Try a different search term"
                    : "Your datasets will appear here"}
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#718096",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            width: h.column.columnDef.size,
                          }}
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid #f7fafc",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f0fffe")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i % 2 === 0 ? "#fff" : "#fafafa")
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            padding: "13px 16px",
                            verticalAlign: "middle",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && table.getPageCount() > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderTop: "1px solid #f1f5f9",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, color: "#718096", fontWeight: 600 }}>
                Page{" "}
                <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{table.getPageCount()}</strong> ·{" "}
                {table.getFilteredRowModel().rows.length} total
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[
                  {
                    icon: <ChevronsLeft size={16} />,
                    action: () => table.setPageIndex(0),
                    disabled: !table.getCanPreviousPage(),
                  },
                  {
                    icon: <ChevronLeft size={16} />,
                    action: () => table.previousPage(),
                    disabled: !table.getCanPreviousPage(),
                  },
                  {
                    icon: <ChevronRight size={16} />,
                    action: () => table.nextPage(),
                    disabled: !table.getCanNextPage(),
                  },
                  {
                    icon: <ChevronsRight size={16} />,
                    action: () => table.setPageIndex(table.getPageCount() - 1),
                    disabled: !table.getCanNextPage(),
                  },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    disabled={btn.disabled}
                    style={{
                      width: 34,
                      height: 34,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: btn.disabled ? "#f8fafc" : "#fff",
                      color: btn.disabled ? "#cbd5e0" : "#4a5568",
                      cursor: btn.disabled ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!btn.disabled)
                        e.currentTarget.style.background = "#f0fffe";
                    }}
                    onMouseLeave={(e) => {
                      if (!btn.disabled)
                        e.currentTarget.style.background = "#fff";
                    }}
                  >
                    {btn.icon}
                  </button>
                ))}
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from(
                    { length: Math.min(5, table.getPageCount()) },
                    (_, i) => {
                      const curr = table.getState().pagination.pageIndex;
                      const total = table.getPageCount();
                      let page;
                      if (total <= 5) page = i;
                      else if (curr < 3) page = i;
                      else if (curr >= total - 3) page = total - 5 + i;
                      else page = curr - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => table.setPageIndex(page)}
                          style={{
                            width: 34,
                            height: 34,
                            border: "1px solid",
                            borderColor: curr === page ? "#61C5C3" : "#e2e8f0",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: curr === page ? "#61C5C3" : "#fff",
                            color: curr === page ? "#fff" : "#4a5568",
                          }}
                        >
                          {page + 1}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        title="Edit Dataset"
        footer={[
          <button
            key="c"
            onClick={() => {
              setIsEditOpen(false);
              setSelected(null);
            }}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              color: "#4a5568",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>,
          <button
            key="s"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#FF8C00",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>,
        ]}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Title *
            </label>
            <Input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Category
            </label>
            <select
              value={editForm.category_id}
              onChange={(e) =>
                setEditForm({ ...editForm, category_id: e.target.value })
              }
              style={{
                width: "100%",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                color: "#1a202c",
              }}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Visibility
            </label>
            <select
              value={editForm.visibility}
              onChange={(e) =>
                setEditForm({ ...editForm, visibility: e.target.value })
              }
              style={{
                width: "100%",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                color: "#1a202c",
              }}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Country
            </label>
            <select
              value={editForm.country_code}
              onChange={(e) => {
                const c = countries.find(
                  (c) => c.country_code === e.target.value,
                );
                setEditForm({
                  ...editForm,
                  country_code: e.target.value,
                  country: c?.country || "",
                  region: c?.region || "",
                });
              }}
              style={{
                width: "100%",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                color: "#1a202c",
              }}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.country_code}>
                  {c.country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Summary
            </label>
            <Input
              type="text"
              value={editForm.summary}
              onChange={(e) =>
                setEditForm({ ...editForm, summary: e.target.value })
              }
              style={{ width: "100%", boxSizing: "border-box" }}
              placeholder="Short description"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#4a5568",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={4}
              style={{
                width: "100%",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#1a202c",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              placeholder="Full description"
            />
          </div>
        </div>

        {editForm.region && (
          <div
            style={{
              padding: "8px 12px",
              background: "#f0fffe",
              border: "1px solid #61C5C3",
              borderRadius: 8,
              fontSize: 12,
              color: "#0d9488",
              fontWeight: 600,
            }}
          >
            📍 Region auto-filled: <strong>{editForm.region}</strong>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

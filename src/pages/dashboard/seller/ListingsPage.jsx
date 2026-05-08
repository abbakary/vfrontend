import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
};

// -------------------
// ID ENCRYPTION (btoa/atob based — lightweight, not cryptographic)
// -------------------
const encryptId = (id) => {
  try {
    return btoa(`dali_${id}_${Date.now()}`).replace(/=/g, "");
  } catch {
    return btoa(String(id));
  }
};

// -------------------
// UI COMPONENTS
// -------------------
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  return (
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
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    published: { bg: "#f0fff4", color: "#38a169", label: "Published" },
    draft: { bg: "#fffaf0", color: "#dd6b20", label: "Draft" },
    archived: { bg: "#f7f7f7", color: "#718096", label: "Archived" },
    active: { bg: "#ebf8ff", color: "#3182ce", label: "Active" },
  };
  const key = (status || "draft").toLowerCase();
  const st = map[key] || map.draft;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        background: st.bg,
        color: st.color,
      }}
    >
      {st.label}
    </span>
  );
};

// Format date as "2 April, 26"
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = String(d.getFullYear()).slice(2);
    return `${day} ${month}, ${year}`;
  } catch {
    return "—";
  }
};

export default function ListingsPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await api.get("/datasets/mine?page_size=100");
      setDatasets(data?.items || []);
    } catch {
      showToast("Failed to load datasets", "error");
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to view page with encrypted id
  const goToView = (dataset) => {
    const enc = encryptId(dataset.id);
    navigate(`/seller/listings/view/${enc}`);
  };

  // Navigate to edit page with encrypted id
  const goToEdit = (dataset) => {
    const enc = encryptId(dataset.id);
    navigate(`/seller/listings/edit/${enc}`);
  };

  // -------------------
  // TABLE COLUMNS
  // -------------------
  const columns = useMemo(
    () => [
      {
        header: "S/N",
        id: "index",
        size: 56,
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <span style={{ color: "#a0aec0", fontWeight: 700, fontSize: 13 }}>
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
            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: 14 }}>
              {getValue()}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#718096",
                fontFamily: "monospace",
                background: "#f1f5f9",
                borderRadius: 6,
                padding: "2px 7px",
                display: "inline-block",
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 4,
              }}
            >
              {row.original.slug || "—"}
            </div>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "category_name",
        size: 160,
        cell: ({ getValue, row }) => (
          <span style={{ fontSize: 13, color: "#20B2AA", fontWeight: 700 }}>
            {getValue() || row.original.category_id || "—"}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 110,
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      },
      {
        header: "Created",
        accessorKey: "created_at",
        size: 140,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 13, color: "#718096", fontWeight: 500 }}>
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        size: 140,
        cell: ({ row }) => (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => goToView(row.original)}
              title="View listing"
              style={{
                padding: "6px 12px",
                background: "#20B2AA",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Eye size={13} /> View
            </button>
            <button
              onClick={() => goToEdit(row.original)}
              title="Edit listing"
              style={{
                padding: "6px 12px",
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
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Edit size={13} /> Edit
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: datasets,
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
            }}
          >
            My Listings
          </h2>
          <p style={{ color: "#718096", margin: "4px 0 0", fontSize: 16 }}>
            Manage your dataset listings
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 20,
          }}
        >
          {[
            {
              label: "Total Listings",
              value: datasets.length,
              icon: <Package size={28} />,
              color: "#38a169",
            },
            {
              label: "Published",
              value: datasets.filter(
                (d) => (d.status || "").toLowerCase() === "published",
              ).length,
              icon: <Eye size={28} />,
              color: "#20B2AA",
            },
            {
              label: "Draft",
              value: datasets.filter(
                (d) => (d.status || "draft").toLowerCase() === "draft",
              ).length,
              icon: <DollarSign size={28} />,
              color: "#FF8C00",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #edf2f7",
                padding: 20,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: `${s.color}15`,
                  color: s.color,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 12,
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
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#1a202c",
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
          {/* Table toolbar */}
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
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a202c" }}>
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
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  minWidth: 240,
                  color: "#1a202c",
                }}
              />
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
                Loading your datasets...
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p
                  style={{
                    color: "#718096",
                    fontSize: 16,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  No listings found
                </p>
                <p style={{ color: "#a0aec0", fontSize: 14, marginTop: 4 }}>
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
                {table.getFilteredRowModel().rows.length} total records
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
                      transition: "all 0.15s",
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

                {/* Page number buttons */}
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
                            transition: "all 0.15s",
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
    </DashboardLayout>
  );
}

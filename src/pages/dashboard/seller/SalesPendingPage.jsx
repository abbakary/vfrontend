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
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Eye,
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
// UI COMPONENTS
// -------------------
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

const StatusBadge = ({ s }) => {
  const map = {
    pending: { bg: "#fffaf0", color: "#dd6b20" },
    paid: { bg: "#f0fff4", color: "#38a169" },
    failed: { bg: "#fff5f5", color: "#e53e3e" },
    cancelled: { bg: "#f7fafc", color: "#718096" },
    refunded: { bg: "#ebf8ff", color: "#3182ce" },
    delivered: { bg: "#f0fff4", color: "#38a169" },
    active: { bg: "#f0fff4", color: "#38a169" },
  };
  const st = map[s] || { bg: "#f7fafc", color: "#718096" };
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

const Modal = ({ open, onClose, title, children }) => {
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
          maxWidth: 620,
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
      </div>
    </div>
  );
};

// -------------------
// DATA TABLE
// -------------------
const DataTable = ({
  data,
  columns,
  loading,
  emptyIcon,
  emptyText,
  emptySubtext,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
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
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a202c" }}>
          Results
          <span
            style={{
              marginLeft: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#a0aec0",
            }}
          >
            ({table.getFilteredRowModel().rows.length})
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
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

      {/* Table body */}
      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "48px 0", color: "#718096" }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading...
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {emptyIcon || "📦"}
            </div>
            <p
              style={{
                color: "#718096",
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {emptyText || "No records found"}
            </p>
            {emptySubtext && (
              <p style={{ color: "#a0aec0", fontSize: 13, marginTop: 4 }}>
                {emptySubtext}
              </p>
            )}
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
                      {flexRender(h.column.columnDef.header, h.getContext())}
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
                      style={{ padding: "13px 16px", verticalAlign: "middle" }}
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
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
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
                  if (!btn.disabled) e.currentTarget.style.background = "#fff";
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
  );
};

// -------------------
// MAIN PAGE
// -------------------
export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItemsForModal, setOrderItemsForModal] = useState([]);
  const [loadingModalItems, setLoadingModalItems] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  useEffect(() => {
    fetchOrders();
    fetchSellerItems();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      let all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const data = await api.get(`/orders/seller?page=${page}&page_size=100`);
        all = [...all, ...(data?.data || [])];
        totalPages = data?.total_pages || 1;
        page++;
      } while (page <= totalPages);
      setOrders(all);
    } catch (err) {
      showToast("Failed to load orders", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSellerItems = async () => {
    try {
      setLoadingItems(true);
      const data = await api.get("/order-items/seller/items");
      setOrderItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("Failed to load order items", "error");
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchOrderItems = async (orderId) => {
    try {
      setLoadingModalItems(true);
      const data = await api.get(`/order-items/order/${orderId}`);
      setOrderItemsForModal(Array.isArray(data) ? data : []);
    } catch {
      setOrderItemsForModal([]);
    } finally {
      setLoadingModalItems(false);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  // -------------------
  // STATS
  // -------------------
  const totalRevenue = orderItems.reduce(
    (sum, item) => sum + (item.owner_earning || 0),
    0,
  );
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "paid").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // -------------------
  // ORDERS COLUMNS
  // -------------------
  const orderColumns = useMemo(
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
        header: "Order Number",
        accessorKey: "order_number",
        cell: ({ getValue }) => (
          <span
            style={{
              fontWeight: 700,
              color: "#1a202c",
              fontSize: 13,
              fontFamily: "monospace",
            }}
          >
            {getValue()?.slice(0, 16)}...
          </span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "total_amount",
        size: 120,
        cell: ({ getValue, row }) => (
          <span style={{ fontWeight: 700, color: "#38a169", fontSize: 14 }}>
            {row.original.currency || "TZS"}{" "}
            {Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        cell: ({ getValue }) => <StatusBadge s={getValue()} />,
      },
      {
        header: "Payment",
        accessorKey: "payment_status",
        size: 120,
        cell: ({ getValue }) => <StatusBadge s={getValue()} />,
      },
      {
        header: "Source",
        accessorKey: "source",
        size: 160,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
            {getValue()?.replace(/_/g, " ") || "—"}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "created_at",
        size: 120,
        cell: ({ getValue }) => (
          <span style={{ fontSize: 12, color: "#718096" }}>
            {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        size: 90,
        cell: ({ row }) => (
          <button
            onClick={() => openOrderDetail(row.original)}
            style={{
              padding: "6px 14px",
              background: "#61C5C3",
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
            <Eye size={13} /> View
          </button>
        ),
      },
    ],
    [],
  );

  // -------------------
  // ORDER ITEMS COLUMNS
  // -------------------
  const itemColumns = useMemo(
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
        header: "Record Title",
        accessorKey: "record_title",
        cell: ({ getValue }) => (
          <div style={{ fontWeight: 700, color: "#1a202c", fontSize: 14 }}>
            {getValue() || "—"}
          </div>
        ),
      },
      {
        header: "Type",
        accessorKey: "record_type",
        size: 100,
        cell: ({ getValue }) => (
          <span
            style={{
              fontSize: 12,
              color: "#475569",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {getValue() || "—"}
          </span>
        ),
      },
      {
        header: "Unit Price",
        accessorKey: "unit_price",
        size: 110,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 600, color: "#475569", fontSize: 13 }}>
            {Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Qty",
        accessorKey: "quantity",
        size: 60,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 700, color: "#1a202c", fontSize: 13 }}>
            {getValue() || 1}
          </span>
        ),
      },
      {
        header: "Subtotal",
        accessorKey: "subtotal",
        size: 110,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 700, color: "#1a202c", fontSize: 13 }}>
            {Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Platform Fee",
        accessorKey: "platform_fee",
        size: 120,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 600, color: "#e53e3e", fontSize: 13 }}>
            -{Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Your Earning",
        accessorKey: "owner_earning",
        size: 130,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 800, color: "#38a169", fontSize: 14 }}>
            {Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 110,
        cell: ({ getValue }) => <StatusBadge s={getValue()} />,
      },
    ],
    [],
  );

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
            Orders
          </h2>
          <p style={{ color: "#718096", margin: "4px 0 0", fontSize: 16 }}>
            Track your sales and earnings
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 16,
          }}
        >
          {[
            {
              label: "Total Orders",
              value: totalOrders,
              icon: <ShoppingBag size={26} />,
              color: "#3182ce",
            },
            {
              label: "Paid Orders",
              value: paidOrders,
              icon: <TrendingUp size={26} />,
              color: "#38a169",
            },
            {
              label: "Pending",
              value: pendingOrders,
              icon: <Package size={26} />,
              color: "#dd6b20",
            },
            {
              label: "Total Earnings",
              value: `TZS ${totalRevenue.toLocaleString()}`,
              icon: <DollarSign size={26} />,
              color: "#805ad5",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                borderRadius: 14,
                background: "#fff",
                border: "1px solid #edf2f7",
                padding: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  color: s.color,
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

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#f1f5f9",
            borderRadius: 12,
            padding: 4,
            width: "fit-content",
          }}
        >
          {[
            { key: "orders", label: "📦 Orders" },
            { key: "items", label: "🧾 Sales Items" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                background: activeTab === tab.key ? "#fff" : "transparent",
                color: activeTab === tab.key ? "#1a202c" : "#718096",
                boxShadow:
                  activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tables */}
        {activeTab === "orders" && (
          <DataTable
            data={orders}
            columns={orderColumns}
            loading={loadingOrders}
            emptyIcon="📦"
            emptyText="No orders yet"
            emptySubtext="Your sales orders will appear here"
          />
        )}

        {activeTab === "items" && (
          <DataTable
            data={orderItems}
            columns={itemColumns}
            loading={loadingItems}
            emptyIcon="🧾"
            emptyText="No sales items yet"
            emptySubtext="Items from your sold datasets will appear here"
          />
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setOrderItemsForModal([]);
        }}
        title={`Order #${selectedOrder?.order_number?.slice(0, 8) || ""}...`}
      >
        {selectedOrder && (
          <>
            {/* Order Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Order Number", selectedOrder.order_number],
                ["Status", null, <StatusBadge s={selectedOrder.status} />],
                [
                  "Payment Status",
                  null,
                  <StatusBadge s={selectedOrder.payment_status} />,
                ],
                [
                  "Total Amount",
                  `${selectedOrder.currency || "TZS"} ${Number(selectedOrder.total_amount || 0).toLocaleString()}`,
                ],
                ["Source", selectedOrder.source?.replace(/_/g, " ") || "—"],
                [
                  "Date",
                  selectedOrder.created_at
                    ? new Date(selectedOrder.created_at).toLocaleString()
                    : "—",
                ],
              ].map(([label, value, node]) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#718096",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  {node || (
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1a202c",
                      }}
                    >
                      {value}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fffaf0",
                  border: "1px solid #feebc8",
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#744210",
                }}
              >
                📝 {selectedOrder.notes}
              </div>
            )}

            {/* Order Items */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1a202c",
                marginBottom: 12,
              }}
            >
              Order Items
            </div>
            {loadingModalItems ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "#718096",
                }}
              >
                ⏳ Loading items...
              </div>
            ) : orderItemsForModal.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "#a0aec0",
                  fontSize: 14,
                }}
              >
                No items found for this order
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {orderItemsForModal.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px 16px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#1a202c",
                            marginBottom: 4,
                          }}
                        >
                          {item.record_title || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#718096" }}>
                          Type: <strong>{item.record_type}</strong> · Qty:{" "}
                          <strong>{item.quantity}</strong>
                        </div>
                      </div>
                      <StatusBadge s={item.status} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {[
                        [
                          "Unit Price",
                          Number(item.unit_price || 0).toLocaleString(),
                          "#475569",
                        ],
                        [
                          "Subtotal",
                          Number(item.subtotal || 0).toLocaleString(),
                          "#1a202c",
                        ],
                        [
                          "Platform Fee",
                          `-${Number(item.platform_fee || 0).toLocaleString()}`,
                          "#e53e3e",
                        ],
                        [
                          "Your Earning",
                          Number(item.owner_earning || 0).toLocaleString(),
                          "#38a169",
                        ],
                      ].map(([k, v, color]) => (
                        <div key={k}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#718096",
                              fontWeight: 700,
                            }}
                          >
                            {k}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color }}>
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 24,
              }}
            >
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItemsForModal([]);
                }}
                style={{
                  padding: "10px 24px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 10,
                  color: "#4a5568",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
}

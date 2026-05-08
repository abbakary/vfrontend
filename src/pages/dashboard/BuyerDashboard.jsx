import { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import {
  ShoppingCart,
  Heart,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useThemeColors } from "../../utils/useThemeColors";
import { useChartColors } from "../../utils/useChartColors";
import {
  orderService,
  publicDatasetService,
  downloadService,
  walletService,
  customRequestService,
} from "../../utils/apiService";

const Badge = ({ children, style }) => (
  <span
    style={{
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);
const COLORS = ["#FF8C00", "#20B2AA"];

export default function BuyerDashboard() {
  const themeColors = useThemeColors();
  const chartColors = useChartColors();

  const [orders, setOrders] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    walletBalance: 0,
    downloadsCount: 0,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, datasetsRes, walletRes, downloadsRes, customRes] =
          await Promise.allSettled([
            orderService.mine({ limit: 20 }),
            publicDatasetService.list({ limit: 20 }),
            walletService.get(),
            downloadService.history({ limit: 10 }),
            customRequestService.mine({ limit: 10 }),
          ]);

        if (ordersRes.status === "fulfilled") {
          const data = ordersRes.value.data;
          const list = data?.items || data?.data || data || [];
          const arr = Array.isArray(list) ? list : [];
          setOrders(arr);
          const totalSpent = arr.reduce(
            (sum, o) => sum + (o.total_amount || o.amount || 0),
            0,
          );
          setStats((prev) => ({
            ...prev,
            totalPurchases: data?.total || arr.length,
            totalSpent,
          }));
        }

        if (datasetsRes.status === "fulfilled") {
          const data = datasetsRes.value.data;
          const list = data?.items || data?.data || data || [];
          setDatasets(Array.isArray(list) ? list : []);
        }

        if (walletRes.status === "fulfilled") {
          const data = walletRes.value.data;
          setWallet(data);
          setStats((prev) => ({ ...prev, walletBalance: data?.balance || 0 }));
        }

        if (downloadsRes.status === "fulfilled") {
          const data = downloadsRes.value.data;
          const list = data?.items || data?.data || data || [];
          const arr = Array.isArray(list) ? list : [];
          setDownloads(arr);
          setStats((prev) => ({
            ...prev,
            downloadsCount: data?.total || arr.length,
          }));
        }

        if (customRes.status === "fulfilled") {
          const data = customRes.value.data;
          const list = data?.items || data?.data || data || [];
          setCustomRequests(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Buyer dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const walletBalance = Number(stats.walletBalance);
  const totalSpent = Number(stats.totalSpent);
  const budgetData = [
    { name: "Spent", value: totalSpent },
    { name: "Balance", value: walletBalance },
  ];

  const statusStyle = (s) =>
    s === "completed"
      ? {
          background: "rgba(16,185,129,0.15)",
          color: "#10B981",
          border: `1px solid ${themeColors.border}`,
        }
      : s === "pending"
        ? {
            background: "rgba(245,158,11,0.15)",
            color: "#F59E0B",
            border: `1px solid ${themeColors.border}`,
          }
        : {
            background: "rgba(239,68,68,0.15)",
            color: "#EF4444",
            border: `1px solid ${themeColors.border}`,
          };

  return (
    <DashboardLayout role="buyer">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Welcome Banner */}
        <div
          style={{
            borderRadius: 24,
            backgroundColor: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            padding: 40,
            color: themeColors.text,
            boxShadow: themeColors.isDarkMode
              ? "0 20px 25px -5px rgba(0,0,0,0.3)"
              : "0 20px 25px -5px rgba(0,0,0,0.05)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.02em",
                color: themeColors.text,
              }}
            >
              Welcome back, <span style={{ color: "#FF8C00" }}>Buyer!</span>
            </h2>
            <p
              style={{
                color: themeColors.textMuted,
                marginTop: 8,
                marginBottom: 0,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {loading
                ? "Loading your dashboard..."
                : "Find the perfect data for your next project."}
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background:
                "linear-gradient(135deg, #FF8C00 0%, transparent 70%)",
              opacity: 0.1,
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 24,
          }}
        >
          <StatCard
            title="Total Orders"
            value={loading ? "..." : stats.totalPurchases}
            change={8}
            icon={<ShoppingCart size={24} />}
          />
          <StatCard
            title="Total Spent"
            value={loading ? "..." : `$${totalSpent.toLocaleString()}`}
            change={15}
            icon={<DollarSign size={24} />}
          />
          <StatCard
            title="Wallet Balance"
            value={loading ? "..." : `$${walletBalance.toLocaleString()}`}
            icon={<Heart size={24} />}
          />
          <StatCard
            title="Downloads"
            value={loading ? "..." : stats.downloadsCount}
            change={5}
            icon={<TrendingUp size={24} />}
          />
        </div>

        {/* Recommended Datasets */}
        <ChartCard
          title="Available Datasets"
          action={
            <a
              href="/datasets"
              style={{
                fontSize: 14,
                color: "#20B2AA",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse All
            </a>
          }
        >
          {loading ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              Loading datasets...
            </p>
          ) : datasets.length === 0 ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              No datasets available
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{ borderBottom: `1px solid ${themeColors.border}` }}
                  >
                    {["Title", "Category", "Country", "Views", "Downloads"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 13,
                            fontWeight: 700,
                            color: themeColors.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {datasets.slice(0, 6).map((d) => (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: themeColors.text,
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.title}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.category?.name || d.category || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.country || d.country_code || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.total_views || 0}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          color: themeColors.textMuted,
                        }}
                      >
                        {d.total_downloads || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* Wallet + Orders */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}
        >
          <ChartCard title="Wallet Overview">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        budgetData[0].value + budgetData[1].value > 0
                          ? budgetData
                          : [{ name: "No Data", value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {(budgetData[0].value + budgetData[1].value > 0
                        ? budgetData
                        : [{ name: "No Data", value: 1 }]
                      ).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartColors.tooltipStyle}
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{ color: themeColors.textMuted, fontWeight: 600 }}
                  >
                    Total Spent
                  </span>
                  <span style={{ color: themeColors.text, fontWeight: 800 }}>
                    ${totalSpent.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{ color: themeColors.textMuted, fontWeight: 600 }}
                  >
                    Balance
                  </span>
                  <span style={{ color: "#20B2AA", fontWeight: 800 }}>
                    ${walletBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="My Orders">
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 16,
              }}
            >
              <a
                href="/dashboard/buyer/purchases"
                style={{
                  fontSize: 14,
                  color: "#20B2AA",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View All
              </a>
            </div>
            {orders.length === 0 ? (
              <p
                style={{
                  color: themeColors.textMuted,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                {loading ? "Loading..." : "No orders yet"}
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                      }}
                    >
                      {["Order ID", "Amount", "Status", "Date", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: h === "Actions" ? "right" : "left",
                              fontSize: 13,
                              fontWeight: 700,
                              color: themeColors.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr
                        key={o.id}
                        style={{
                          borderBottom: `1px solid ${themeColors.border}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: themeColors.textMuted,
                          }}
                        >
                          #{o.id}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#20B2AA",
                          }}
                        >
                          $
                          {Number(
                            o.total_amount || o.amount || 0,
                          ).toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <Badge
                            style={{
                              ...statusStyle(o.status),
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: 8,
                            }}
                          >
                            {o.status}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: themeColors.textMuted,
                          }}
                        >
                          {o.created_at
                            ? new Date(o.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td
                          style={{ padding: "14px 16px", textAlign: "right" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              style={{
                                padding: "6px 12px",
                                background: themeColors.hoverBg,
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                color: themeColors.textMuted,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <Download size={14} /> Download
                            </button>
                            <button
                              style={{
                                padding: "6px 8px",
                                background: themeColors.hoverBg,
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                color: themeColors.textMuted,
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Custom Requests */}
        <ChartCard
          title="My Custom Requests"
          action={
            <a
              href="/dashboard/buyer/requests"
              style={{
                fontSize: 14,
                color: "#20B2AA",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View All
            </a>
          }
        >
          {customRequests.length === 0 ? (
            <p
              style={{
                color: themeColors.textMuted,
                textAlign: "center",
                padding: 32,
              }}
            >
              {loading ? "Loading..." : "No custom requests yet"}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 16,
              }}
            >
              {customRequests.slice(0, 4).map((cr) => (
                <div
                  key={cr.id}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    background: themeColors.hoverBg,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: themeColors.text,
                        margin: 0,
                        flex: 1,
                      }}
                    >
                      {cr.title || cr.subject || `Request #${cr.id}`}
                    </p>
                    <Badge
                      style={{
                        background:
                          cr.status === "approved"
                            ? "rgba(16,185,129,0.15)"
                            : cr.status === "pending"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(239,68,68,0.15)",
                        color:
                          cr.status === "approved"
                            ? "#10B981"
                            : cr.status === "pending"
                              ? "#F59E0B"
                              : "#EF4444",
                        marginLeft: 8,
                      }}
                    >
                      {cr.status}
                    </Badge>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: themeColors.textMuted,
                      margin: 0,
                    }}
                  >
                    {cr.created_at
                      ? new Date(cr.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Download History */}
        {downloads.length > 0 && (
          <ChartCard
            title="Recent Downloads"
            action={
              <a
                href="/dashboard/buyer/purchases"
                style={{
                  fontSize: 14,
                  color: "#20B2AA",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View All
              </a>
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 16,
              }}
            >
              {downloads.slice(0, 4).map((dl) => (
                <div
                  key={dl.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    borderRadius: 16,
                    background: themeColors.hoverBg,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: themeColors.isDarkMode
                        ? "#1e3a1e"
                        : "#f0fff4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#38a169",
                    }}
                  >
                    <Download size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: themeColors.text,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dl.record?.title ||
                        dl.dataset?.title ||
                        `Download #${dl.id}`}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: themeColors.textMuted,
                        margin: "2px 0 0",
                        fontWeight: 600,
                      }}
                    >
                      {dl.created_at
                        ? new Date(dl.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </DashboardLayout>
  );
}

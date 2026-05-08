import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { DollarSign, TrendingUp, Eye, BarChart3, Package } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
// TOOLTIP STYLE
// -------------------
const tt = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  color: "#1a202c",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

// -------------------
// FALLBACK DATA
// -------------------
const FALLBACK_TREND = [
  { month: "Jan", sales: 0, views: 0, revenue: 0 },
  { month: "Feb", sales: 0, views: 0, revenue: 0 },
  { month: "Mar", sales: 0, views: 0, revenue: 0 },
  { month: "Apr", sales: 0, views: 0, revenue: 0 },
  { month: "May", sales: 0, views: 0, revenue: 0 },
  { month: "Jun", sales: 0, views: 0, revenue: 0 },
];

const COLORS = ["#FF8C00", "#20B2AA", "#ED8936", "#4FD1C5", "#CBD5E0"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// -------------------
// STAT CARD
// -------------------
const StatCard = ({ title, value, icon, color, sub }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #edf2f7",
      padding: 20,
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
  >
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: `${color}15`,
        color,
        flexShrink: 0,
      }}
    >
      {icon}
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
        {title}
      </p>
      <p
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#1a202c",
          margin: "2px 0 0",
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "#a0aec0", margin: "2px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  </div>
);

// -------------------
// CHART CARD
// -------------------
const ChartCard = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      padding: 24,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
  >
    {title && (
      <h3
        style={{
          fontWeight: 800,
          fontSize: 17,
          color: "#1a202c",
          margin: "0 0 20px",
        }}
      >
        {title}
      </h3>
    )}
    {children}
  </div>
);

export default function SalesAnalyticsPage() {
  const [datasets, setDatasets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(FALLBACK_TREND);
  const [categoryData, setCategoryData] = useState([]);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalViews: 0,
    totalDownloads: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch all datasets
      let allDatasets = [];
      let page = 1;
      let totalPages = 1;
      do {
        const d = await api.get(`/datasets/mine?page=${page}&page_size=100`);
        allDatasets = [...allDatasets, ...(d?.items || [])];
        totalPages = d?.total_pages || 1;
        page++;
      } while (page <= totalPages);
      setDatasets(allDatasets);

      // Fetch all seller orders
      let allOrders = [];
      page = 1;
      totalPages = 1;
      do {
        const d = await api.get(`/orders/seller?page=${page}&page_size=100`);
        allOrders = [...allOrders, ...(d?.data || [])];
        totalPages = d?.total_pages || 1;
        page++;
      } while (page <= totalPages);
      setOrders(allOrders);

      // Fetch seller order items
      const itemsData = await api.get("/order-items/seller/items");
      const allItems = Array.isArray(itemsData) ? itemsData : [];
      setOrderItems(allItems);

      // -------------------
      // CALCULATE STATS
      // -------------------
      const totalRevenue = allItems.reduce(
        (sum, i) => sum + (parseFloat(i.owner_earning) || 0),
        0,
      );
      const totalSales = allOrders.filter((o) => o.status === "paid").length;
      const totalViews = allDatasets.reduce(
        (sum, d) => sum + (d.total_views || 0),
        0,
      );
      const totalDownloads = allDatasets.reduce(
        (sum, d) => sum + (d.total_downloads || 0),
        0,
      );
      const conversionRate =
        totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

      setStats({
        totalRevenue: Math.round(totalRevenue),
        totalSales,
        totalViews,
        totalDownloads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      });

      // -------------------
      // TREND DATA (last 6 months from orders)
      // -------------------
      const monthMap = {};
      allOrders.forEach((o) => {
        const d = new Date(o.created_at || new Date());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { sales: 0, revenue: 0, views: 0 };
        monthMap[key].sales += 1;
        monthMap[key].revenue += parseFloat(o.total_amount || 0);
      });

      // Add views from datasets grouped by month
      allDatasets.forEach((d) => {
        const created = new Date(d.created_at || new Date());
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { sales: 0, revenue: 0, views: 0 };
        monthMap[key].views += d.total_views || 0;
      });

      const trend = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, data]) => {
          const month = parseInt(key.split("-")[1]) - 1;
          return {
            month: MONTH_NAMES[month],
            sales: data.sales,
            revenue: Math.round(data.revenue),
            views: data.views,
          };
        });

      setTrendData(trend.length > 0 ? trend : FALLBACK_TREND);

      // -------------------
      // CATEGORY DATA — use category_name from API response
      // -------------------
      const catMap = {};
      allDatasets.forEach((d) => {
        // Use category_name returned by backend, fall back to Uncategorized
        const cat = d.category_name || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + (d.total_downloads || 0);
      });

      const cats = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value], i) => ({ name, value, color: COLORS[i] }));

      setCategoryData(
        cats.length > 0
          ? cats
          : [{ name: "No data", value: 1, color: "#CBD5E0" }],
      );
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="seller">
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
            Sales Analytics
          </h2>
          <p
            style={{
              color: "#718096",
              margin: "4px 0 0",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Track your dataset sales performance and revenue
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 16,
          }}
        >
          <StatCard
            title="Total Revenue"
            value={`TZS ${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            color="#38a169"
            sub="From paid orders"
          />
          <StatCard
            title="Total Sales"
            value={stats.totalSales.toLocaleString()}
            icon={<TrendingUp size={24} />}
            color="#FF8C00"
            sub="Paid orders only"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={<Eye size={24} />}
            color="#3182ce"
            sub="Across all datasets"
          />
          <StatCard
            title="Downloads"
            value={stats.totalDownloads.toLocaleString()}
            icon={<Package size={24} />}
            color="#805ad5"
            sub="Across all datasets"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={<BarChart3 size={24} />}
            color="#20B2AA"
            sub="Sales / Views"
          />
        </div>

        {/* Sales Trend */}
        <ChartCard title="Sales & Revenue Trend">
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#718096",
              }}
            >
              ⏳ Loading chart data...
            </div>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#20B2AA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#20B2AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip contentStyle={tt} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#FF8C00"
                    fill="url(#salesGrad)"
                    strokeWidth={3}
                    dot={{ fill: "#FF8C00", r: 4 }}
                    activeDot={{ r: 7 }}
                    name="Sales"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#20B2AA"
                    fill="url(#revGrad)"
                    strokeWidth={3}
                    dot={{ fill: "#20B2AA", r: 4 }}
                    activeDot={{ r: 7 }}
                    name="Revenue (TZS)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Category + Views vs Sales */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24,
          }}
        >
          <ChartCard title="Downloads by Category">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {categoryData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tt} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Views vs Sales by Month">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis
                    dataKey="month"
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#718096"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    fontWeight={600}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip contentStyle={tt} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
                  <Bar
                    dataKey="views"
                    name="Views"
                    fill="#FF8C00"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="#20B2AA"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Dataset Performance Table */}
        <ChartCard title="Dataset Performance">
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#718096",
              }}
            >
              ⏳ Loading...
            </div>
          ) : datasets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#a0aec0",
              }}
            >
              <p style={{ fontSize: 40, margin: "0 0 8px" }}>📦</p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>No datasets found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #edf2f7" }}>
                    {[
                      "Dataset",
                      "Category",
                      "Country",
                      "Visibility",
                      "Views",
                      "Downloads",
                      "Sales",
                      "Conversion",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#718096",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d, i) => {
                    const views = d.total_views || 0;
                    const downloads = d.total_downloads || 0;
                    const sales = d.total_sales || 0;
                    const conversion =
                      views > 0 ? ((sales / views) * 100).toFixed(1) : "0.0";
                    return (
                      <tr
                        key={d.id}
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
                        {/* Dataset title + summary */}
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#1a202c",
                              fontSize: 14,
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {d.title || "Untitled"}
                          </div>
                          {d.summary && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#718096",
                                marginTop: 2,
                                maxWidth: 220,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.summary}
                            </div>
                          )}
                        </td>

                        {/* Category name from backend */}
                        <td style={{ padding: "14px 16px" }}>
                          {d.category_name ? (
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                background: "#f0f4ff",
                                color: "#4c6ef5",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.category_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: "#a0aec0" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Country */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#475569",
                          }}
                        >
                          {d.country || d.country_code || "—"}
                        </td>

                        {/* Visibility badge */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background:
                                d.visibility === "public"
                                  ? "#ebf8ff"
                                  : "#fffaf0",
                              color:
                                d.visibility === "public"
                                  ? "#3182ce"
                                  : "#dd6b20",
                            }}
                          >
                            {d.visibility || "public"}
                          </span>
                        </td>

                        {/* Views */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {views.toLocaleString()}
                        </td>

                        {/* Downloads */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {downloads.toLocaleString()}
                        </td>

                        {/* Sales */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {sales.toLocaleString()}
                        </td>

                        {/* Conversion */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              background:
                                parseFloat(conversion) > 0
                                  ? "#f0fff4"
                                  : "#f7fafc",
                              color:
                                parseFloat(conversion) > 0
                                  ? "#38a169"
                                  : "#718096",
                            }}
                          >
                            {conversion}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}

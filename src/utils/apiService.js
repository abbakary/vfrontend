import api from "./api";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  me: () => api.get("/auth/me"),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  register: (data) => api.post("/auth/register", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  changePassword: (data) => api.post("/auth/change-password", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerification: (data) => api.post("/auth/resend-verification", data),
  refresh: (data) => api.post("/auth/refresh", data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userService = {
  list: (params) => api.get("/users", { params }),
  create: (data) => api.post("/users", data),
  getMyProfile: () => api.get("/users/me/profile"),
  updateMyProfile: (data) => api.put("/users/me/profile", data),
  updateMyAccount: (data) => api.put("/users/me/account", data),
  updateMyPassword: (data) => api.put("/users/me/password", data),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  updateRole: (id, data) => api.put(`/users/${id}/role`, data),
};

// ── Datasets ──────────────────────────────────────────────────────────────────
export const datasetService = {
  list: (params) => api.get("/datasets/", { params }),
  create: (data) => api.post("/datasets/", data),
  search: (params) => api.get("/datasets/search", { params }),
  featured: (params) => api.get("/datasets/featured", { params }),
  mine: (params) => api.get("/datasets/mine", { params }),
  byUser: (userId, params) => api.get(`/datasets/user/${userId}`, { params }),
  get: (id) => api.get(`/datasets/${id}`),
  update: (id, data) => api.put(`/datasets/${id}`, data),
  delete: (id) => api.delete(`/datasets/${id}`),
};

// ── Public Datasets ───────────────────────────────────────────────────────────
export const publicDatasetService = {
  list: (params) => api.get("/public-datasets/", { params }),
  get: (id) => api.get(`/public-datasets/${id}`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectService = {
  list: (params) => api.get("/projects/", { params }),
  create: (data) => api.post("/projects/", data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportService = {
  list: (params) => api.get("/reports/", { params }),
  create: (data) => api.post("/reports/", data),
  search: (params) => api.get("/reports/search", { params }),
  featured: (params) => api.get("/reports/featured", { params }),
  mine: (params) => api.get("/reports/mine", { params }),
  get: (id) => api.get(`/reports/${id}`),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ── Trades ────────────────────────────────────────────────────────────────────
export const tradeService = {
  list: (params) => api.get("/trades/", { params }),
  create: (data) => api.post("/trades/", data),
  get: (id) => api.get(`/trades/${id}`),
  update: (id, data) => api.put(`/trades/${id}`, data),
  delete: (id) => api.delete(`/trades/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderService = {
  create: (data) => api.post("/orders/", data),
  list: (params) => api.get("/orders/", { params }),
  mine: (params) => api.get("/orders/mine", { params }),
  seller: (params) => api.get("/orders/seller", { params }),
  admin: (params) => api.get("/orders/admin", { params }),
  byUser: (userId, params) => api.get(`/orders/user/${userId}`, { params }),
  get: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  items: (id) => api.get(`/orders/${id}/items`),
  invoice: (id) => api.get(`/orders/${id}/invoice`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentService = {
  initiate: (data) => api.post("/payments/initiate", data),
  mine: (params) => api.get("/payments/mine", { params }),
  admin: (params) => api.get("/payments/admin", { params }),
  byUser: (userId, params) => api.get(`/payments/user/${userId}`, { params }),
  list: (params) => api.get("/payments/", { params }),
  get: (id) => api.get(`/payments/${id}`),
  status: (id) => api.get(`/payments/${id}/status`),
  verify: (id) => api.post(`/payments/${id}/verify`),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletService = {
  get: () => api.get("/wallet"),
  balance: () => api.get("/wallet/balance"),
  summary: () => api.get("/wallet/summary"),
  adminList: (params) => api.get("/wallets/admin", { params }),
  byUser: (userId) => api.get(`/wallets/user/${userId}`),
  adminGet: (userId) => api.get(`/wallets/${userId}`),
};

// ── Wallet Transactions ───────────────────────────────────────────────────────
export const walletTransactionService = {
  list: (params) => api.get("/wallet-transactions", { params }),
  byUser: (userId, params) => api.get(`/wallet-transactions/user/${userId}`, { params }),
  get: (id) => api.get(`/wallet-transactions/${id}`),
};

// ── Platform Revenue ──────────────────────────────────────────────────────────
export const revenueService = {
  summary: () => api.get("/platform-revenue/summary"),
  sellerSummary: () => api.get("/platform-revenue/seller/summary"),
  sellerEarnings: (params) => api.get("/platform-revenue/seller/earnings", { params }),
  list: (params) => api.get("/platform-revenue/", { params }),
  get: (id) => api.get(`/platform-revenue/${id}`),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionService = {
  create: (data) => api.post("/subscriptions/", data),
  mine: (params) => api.get("/subscriptions/mine", { params }),
  admin: (params) => api.get("/subscriptions/admin", { params }),
  byUser: (userId, params) => api.get(`/subscriptions/user/${userId}`, { params }),
  get: (id) => api.get(`/subscriptions/${id}`),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  review: (id, data) => api.put(`/subscriptions/${id}/review`, data),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

// ── Subscription Plans ────────────────────────────────────────────────────────
export const subscriptionPlanService = {
  public: (params) => api.get("/subscription-plans/public", { params }),
  admin: (params) => api.get("/subscription-plans/admin", { params }),
  get: (id) => api.get(`/subscription-plans/${id}`),
  create: (data) => api.post("/subscription-plans/", data),
  update: (id, data) => api.put(`/subscription-plans/${id}`, data),
  delete: (id) => api.delete(`/subscription-plans/${id}`),
};

// ── Record Requests ───────────────────────────────────────────────────────────
export const recordRequestService = {
  list: (params) => api.get("/record-requests/", { params }),
  create: (data) => api.post("/record-requests/", data),
  byUser: (userId, params) => api.get(`/record-requests/user/${userId}`, { params }),
  byRecord: (type, id, params) => api.get(`/record-requests/${type}/${id}`, { params }),
  get: (id) => api.get(`/record-requests/item/${id}`),
  update: (id, data) => api.put(`/record-requests/item/${id}`, data),
  approve: (id) => api.post(`/record-requests/item/${id}/approve`),
  reject: (id) => api.post(`/record-requests/item/${id}/reject`),
  cancel: (id) => api.post(`/record-requests/item/${id}/cancel`),
};

// ── Custom Requests ───────────────────────────────────────────────────────────
export const customRequestService = {
  create: (data) => api.post("/custom-requests/", data),
  mine: (params) => api.get("/custom-requests/mine", { params }),
  admin: (params) => api.get("/custom-requests/admin", { params }),
  get: (id) => api.get(`/custom-requests/${id}`),
  update: (id, data) => api.put(`/custom-requests/${id}`, data),
  delete: (id) => api.delete(`/custom-requests/${id}`),
  review: (id, data) => api.put(`/custom-requests/${id}/review`, data),
  cancel: (id) => api.post(`/custom-requests/${id}/cancel`),
};

// ── Downloads ─────────────────────────────────────────────────────────────────
export const downloadService = {
  create: (data) => api.post("/records/downloads", data),
  history: (params) => api.get("/downloads/history", { params }),
  admin: (params) => api.get("/downloads/admin", { params }),
  byUser: (userId, params) => api.get(`/downloads/user/${userId}`, { params }),
  byRecord: (type, id, params) => api.get(`/records/${type}/${id}/downloads`, { params }),
  get: (id) => api.get(`/downloads/${id}`),
  delete: (id) => api.delete(`/downloads/${id}`),
};

// ── Download Access ───────────────────────────────────────────────────────────
export const accessService = {
  myAccess: (params) => api.get("/my-access", { params }),
  get: (id) => api.get(`/access/${id}`),
  update: (id, data) => api.put(`/access/${id}`, data),
  byRecord: (type, id) => api.get(`/records/${type}/${id}/access`),
  grant: (data) => api.post("/access/grant", data),
  revoke: (id) => api.post(`/access/${id}/revoke`),
  extend: (id, data) => api.post(`/access/${id}/extend`, data),
};

// ── Refunds ───────────────────────────────────────────────────────────────────
export const refundService = {
  request: (data) => api.post("/refunds/request", data),
  mine: (params) => api.get("/refunds/mine", { params }),
  admin: (params) => api.get("/refunds/admin", { params }),
  list: (params) => api.get("/refunds/", { params }),
  byUser: (userId, params) => api.get(`/refunds/user/${userId}`, { params }),
  get: (id) => api.get(`/refunds/${id}`),
  approve: (id) => api.post(`/refunds/${id}/approve`),
  reject: (id) => api.post(`/refunds/${id}/reject`),
  process: (id) => api.post(`/refunds/${id}/process`),
};

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const withdrawalService = {
  list: (params) => api.get("/withdrawals", { params }),
  byUser: (userId, params) => api.get(`/withdrawals/user/${userId}`, { params }),
  get: (id) => api.get(`/withdrawals/${id}`),
  request: (data) => api.post("/withdrawals/request", data),
  approve: (id) => api.post(`/withdrawals/${id}/approve`),
  reject: (id) => api.post(`/withdrawals/${id}/reject`),
  processing: (id) => api.post(`/withdrawals/${id}/processing`),
  paid: (id) => api.post(`/withdrawals/${id}/paid`),
  cancel: (id) => api.post(`/withdrawals/${id}/cancel`),
};

// ── Payouts ───────────────────────────────────────────────────────────────────
export const payoutService = {
  process: (data) => api.post("/payouts/process", data),
  mine: (params) => api.get("/payouts/mine", { params }),
  admin: (params) => api.get("/payouts/admin", { params }),
  list: (params) => api.get("/payouts/", { params }),
  get: (id) => api.get(`/payouts/${id}`),
  complete: (id) => api.post(`/payouts/${id}/complete`),
  fail: (id) => api.post(`/payouts/${id}/fail`),
};

// ── Seller Profiles ───────────────────────────────────────────────────────────
export const sellerProfileService = {
  list: (params) => api.get("/seller-profiles/", { params }),
  create: (data) => api.post("/seller-profiles/", data),
  get: (id) => api.get(`/seller-profiles/${id}`),
  update: (id, data) => api.put(`/seller-profiles/${id}`, data),
  delete: (id) => api.delete(`/seller-profiles/${id}`),
  me: () => api.get("/seller-profiles/me"),
  updateMe: (data) => api.put("/seller-profiles/me", data),
  verify: (id) => api.post(`/seller-profiles/${id}/verify`),
  reject: (id) => api.post(`/seller-profiles/${id}/reject`),
  updateStatus: (id, data) => api.put(`/seller-profiles/${id}/status`, data),
  datasets: (id) => api.get(`/seller-profiles/${id}/datasets`),
};

// ── Organizations ─────────────────────────────────────────────────────────────
export const organizationService = {
  create: (data) => api.post("/organizations/", data),
  list: (params) => api.get("/organizations/", { params }),
  adminList: (params) => api.get("/organizations/admin/all", { params }),
  get: (id) => api.get(`/organizations/${id}`),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
  restore: (id) => api.post(`/organizations/${id}/restore`),
};

// ── Record Views ──────────────────────────────────────────────────────────────
export const viewService = {
  add: (type, id) => api.post(`/views/${type}/${id}`),
  get: (type, id, params) => api.get(`/views/${type}/${id}`, { params }),
  byUser: (userId, params) => api.get(`/views/user/${userId}`, { params }),
  count: (type, id) => api.get(`/views/${type}/${id}/count`),
};

// ── Record Pricing ────────────────────────────────────────────────────────────
export const pricingService = {
  byRecord: (type, id) => api.get(`/pricing/${type}/${id}`),
  create: (data) => api.post("/pricing/", data),
  get: (id) => api.get(`/pricing/item/${id}`),
  update: (id, data) => api.put(`/pricing/item/${id}`, data),
  delete: (id) => api.delete(`/pricing/item/${id}`),
  activate: (id) => api.post(`/pricing/item/${id}/activate`),
  deactivate: (id) => api.post(`/pricing/item/${id}/deactivate`),
};

// ── Record Versions ───────────────────────────────────────────────────────────
export const versionService = {
  byRecord: (type, id) => api.get(`/versions/${type}/${id}`),
  create: (data) => api.post("/versions/", data),
  get: (id) => api.get(`/versions/item/${id}`),
  update: (id, data) => api.put(`/versions/item/${id}`, data),
  delete: (id) => api.delete(`/versions/item/${id}`),
  publish: (id) => api.post(`/versions/item/${id}/publish`),
};

// ── Advertisements ────────────────────────────────────────────────────────────
export const adService = {
  list: (params) => api.get("/advertisements", { params }),
  create: (data) => api.post("/advertisements", data),
  get: (id) => api.get(`/advertisements/${id}`),
  update: (id, data) => api.put(`/advertisements/${id}`, data),
  delete: (id) => api.delete(`/advertisements/${id}`),
  activate: (id) => api.post(`/advertisements/${id}/activate`),
  deactivate: (id) => api.post(`/advertisements/${id}/deactivate`),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartService = {
  get: () => api.get("/cart/"),
  create: () => api.post("/cart/"),
  clear: () => api.delete("/cart/clear"),
  checkout: (data) => api.post("/cart/checkout", data),
  adminAll: (params) => api.get("/cart/admin/all", { params }),
  addItem: (data) => api.post("/cart-items/", data),
  getItems: (cartId) => api.get(`/cart-items/cart/${cartId}`),
  getItem: (id) => api.get(`/cart-items/${id}`),
  updateItem: (id, data) => api.put(`/cart-items/${id}`, data),
  removeItem: (id) => api.delete(`/cart-items/${id}`),
};

// ── System Settings ───────────────────────────────────────────────────────────
export const settingsService = {
  list: (params) => api.get("/settings", { params }),
  create: (data) => api.post("/settings", data),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  delete: (key) => api.delete(`/settings/${key}`),
};

// ── Commission Settings ───────────────────────────────────────────────────────
export const commissionService = {
  list: (params) => api.get("/commission-settings", { params }),
  create: (data) => api.post("/commission-settings", data),
  get: (id) => api.get(`/commission-settings/${id}`),
  update: (id, data) => api.put(`/commission-settings/${id}`, data),
  delete: (id) => api.delete(`/commission-settings/${id}`),
};

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const activityLogService = {
  list: (params) => api.get("/activity-logs", { params }),
  get: (id) => api.get(`/activity-logs/${id}`),
};

// ── API Keys ──────────────────────────────────────────────────────────────────
export const apiKeyService = {
  list: (params) => api.get("/api-keys", { params }),
  create: (data) => api.post("/api-keys", data),
  get: (id) => api.get(`/api-keys/${id}`),
  update: (id, data) => api.put(`/api-keys/${id}`, data),
  delete: (id) => api.delete(`/api-keys/${id}`),
  revoke: (id) => api.post(`/api-keys/${id}/revoke`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryService = {
  list: (params) => api.get("/categories/", { params }),
  tree: () => api.get("/categories/tree"),
  active: () => api.get("/categories/active/list"),
  withDatasetCategories: () => api.get("/categories/with-dataset-categories"),
  get: (id) => api.get(`/categories/${id}`),
  datasets: (id) => api.get(`/categories/${id}/datasets`),
};

// ── Tags ─────────────────────────────────────────────────────────────────────
export const tagService = {
  list: (params) => api.get("/tags/", { params }),
  create: (data) => api.post("/tags/", data),
  get: (id) => api.get(`/tags/${id}`),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
};

// ── Africa Countries ──────────────────────────────────────────────────────────
export const countryService = {
  list: (params) => api.get("/africa-countries/", { params }),
  create: (data) => api.post("/africa-countries/", data),
  get: (id) => api.get(`/africa-countries/${id}`),
  update: (id, data) => api.put(`/africa-countries/${id}`, data),
  delete: (id) => api.delete(`/africa-countries/${id}`),
  restore: (id) => api.post(`/africa-countries/${id}/restore`),
};

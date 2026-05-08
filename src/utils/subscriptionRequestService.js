/**
 * Subscription Request Service
 * Stores subscription requests in sessionStorage and approved subscriptions in localStorage.
 * Ready for backend API integration.
 */

const REQUESTS_KEY = "subscriptionRequests";
const SUBSCRIPTION_PREFIX = "dali-subscription:"; // per-user record

function safeParseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readRequests() {
  const raw = sessionStorage.getItem(REQUESTS_KEY);
  return safeParseJSON(raw, []);
}

function saveRequests(requests) {
  sessionStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function subscriptionKeyForUser(userId) {
  return `${SUBSCRIPTION_PREFIX}${userId}`;
}

function readSubscription(userId) {
  if (!userId) return null;
  const raw = localStorage.getItem(subscriptionKeyForUser(userId));
  return safeParseJSON(raw, null);
}

function saveSubscription(userId, subscription) {
  localStorage.setItem(subscriptionKeyForUser(userId), JSON.stringify(subscription));
}

export const subscriptionRequestService = {
  getAllRequests: (filters = {}) => {
    let requests = readRequests();

    if (filters.status) requests = requests.filter((r) => r.status === filters.status);
    if (filters.userId) requests = requests.filter((r) => r.userId === filters.userId);
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      requests = requests.filter(
        (r) =>
          String(r.userName || "").toLowerCase().includes(q) ||
          String(r.userEmail || "").toLowerCase().includes(q) ||
          String(r.company || "").toLowerCase().includes(q) ||
          String(r.planName || "").toLowerCase().includes(q)
      );
    }

    return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getRequestById: (id) => {
    const requests = readRequests();
    return requests.find((r) => r.id === id) || null;
  },

  getRequestsByUser: (userId) => {
    return subscriptionRequestService.getAllRequests({ userId });
  },

  getLatestRequestByUser: (userId) => {
    const items = subscriptionRequestService.getAllRequests({ userId });
    return items[0] || null;
  },

  createRequest: (requestData) => {
    const newRequest = {
      id: `sr_${Date.now()}`,
      ...requestData,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewNotes: "",
      reviewedByRole: null,
    };
    const requests = readRequests();
    requests.push(newRequest);
    saveRequests(requests);
    return newRequest;
  },

  updateRequest: (requestId, patch) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");

    const current = requests[idx];
    if (current.status !== "PENDING") throw new Error("Only pending requests can be edited");

    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    requests[idx] = next;
    saveRequests(requests);
    return next;
  },

  cancelRequest: (requestId, { reviewedByRole = null } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");
    const current = requests[idx];
    const next = {
      ...current,
      status: "CANCELLED",
      reviewedByRole,
      updatedAt: new Date().toISOString(),
    };
    requests[idx] = next;
    saveRequests(requests);
    return next;
  },

  approveRequest: (requestId, { reviewerRole, reviewNotes = "" } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");

    const current = requests[idx];
    const approved = {
      ...current,
      status: "APPROVED",
      reviewNotes,
      reviewedByRole: reviewerRole || "admin",
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
    requests[idx] = approved;
    saveRequests(requests);

    // Materialize an active subscription for the user
    const subscription = {
      userId: approved.userId,
      planKey: approved.planKey,
      planName: approved.planName,
      billingCycle: approved.billingCycle,
      seats: approved.seats,
      company: approved.company,
      status: "active",
      startedAt: new Date().toISOString(),
      sourceRequestId: approved.id,
    };
    saveSubscription(approved.userId, subscription);

    return approved;
  },

  rejectRequest: (requestId, { reviewerRole, reviewNotes = "" } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");

    const current = requests[idx];
    const rejected = {
      ...current,
      status: "REJECTED",
      reviewNotes,
      reviewedByRole: reviewerRole || "admin",
      updatedAt: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
    };
    requests[idx] = rejected;
    saveRequests(requests);
    return rejected;
  },

  getUserSubscription: (userId) => readSubscription(userId),
};

export default subscriptionRequestService;


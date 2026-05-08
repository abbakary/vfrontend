/**
 * Fund Request Service
 * Manages funding requests submitted from the public Funds page.
 * Uses sessionStorage for requests. Ready for backend API integration.
 */

const STORAGE_KEY = "fundRequests";

function safeParseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readRequests() {
  return safeParseJSON(sessionStorage.getItem(STORAGE_KEY), []);
}

function saveRequests(requests) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export const fundRequestService = {
  getAllRequests: (filters = {}) => {
    let items = readRequests();

    if (filters.status) items = items.filter((r) => r.status === filters.status);
    if (filters.userId) items = items.filter((r) => r.userId === filters.userId);
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      items = items.filter(
        (r) =>
          String(r.title || "").toLowerCase().includes(q) ||
          String(r.company || "").toLowerCase().includes(q) ||
          String(r.userName || "").toLowerCase().includes(q) ||
          String(r.userEmail || "").toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getLatestRequestByUser: (userId) => {
    const items = fundRequestService.getAllRequests({ userId });
    return items[0] || null;
  },

  createRequest: (requestData) => {
    const newRequest = {
      id: `fr_${Date.now()}`,
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

  cancelRequest: (requestId, { reviewedByRole = null } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");
    const next = { ...requests[idx], status: "CANCELLED", reviewedByRole, updatedAt: new Date().toISOString() };
    requests[idx] = next;
    saveRequests(requests);
    return next;
  },

  approveRequest: (requestId, { reviewerRole, reviewNotes = "" } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");
    const next = {
      ...requests[idx],
      status: "APPROVED",
      reviewedByRole: reviewerRole || "admin",
      reviewNotes,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requests[idx] = next;
    saveRequests(requests);
    return next;
  },

  rejectRequest: (requestId, { reviewerRole, reviewNotes = "" } = {}) => {
    const requests = readRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error("Request not found");
    const next = {
      ...requests[idx],
      status: "REJECTED",
      reviewedByRole: reviewerRole || "admin",
      reviewNotes,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requests[idx] = next;
    saveRequests(requests);
    return next;
  },
};

export default fundRequestService;


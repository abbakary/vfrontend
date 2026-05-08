import { mockProjectRequests, mockCollaborators, mockUsers } from '../pages/dashboard/lib/mockData';

/**
 * Project Request Service
 * Manages project requests, bids, and collaborator matching
 * Ready for backend API integration
 */

// In-memory cache for requests (using sessionStorage + mockData)
const STORAGE_KEY = 'projectRequests';

export const projectRequestService = {
  
  /**
   * Get all project requests with optional filtering
   */
  getAllRequests: (filters = {}) => {
    let requests = getStoredRequests();
    
    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    
    if (filters.category) {
      requests = requests.filter(r => r.category === filters.category);
    }
    
    if (filters.buyerId) {
      requests = requests.filter(r => r.buyerId === filters.buyerId);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      requests = requests.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }
    
    return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Get a single project request by ID
   */
  getRequestById: (id) => {
    const requests = getStoredRequests();
    return requests.find(r => r.id === id);
  },

  /**
   * Get requests for a specific buyer
   */
  getRequestsByBuyer: (buyerId) => {
    return projectRequestService.getAllRequests({ buyerId });
  },

  /**
   * Get matching requests for a collaborator based on their skills and preferences
   */
  getMatchingRequests: (collaboratorId) => {
    const requests = projectRequestService.getAllRequests({
      status: 'PENDING'
    });
    
    const collaborator = mockCollaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return [];
    
    // Match requests to collaborator based on category
    return requests.filter(r => {
      const openToAll = r.openToSuggestions === undefined || r.openToSuggestions === true;
      const directAssignment = r.preferredCollaborator === collaboratorId;
      const categoryMatch = r.category === collaborator.category;
      
      return categoryMatch && (openToAll || directAssignment);
    });
  },

  /**
   * Create a new project request
   */
  createRequest: (requestData) => {
    const newRequest = {
      id: `pr_${Date.now()}`,
      ...requestData,
      status: 'PENDING',
      createdAt: new Date(),
      bids: [],
    };
    
    const requests = getStoredRequests();
    requests.push(newRequest);
    saveRequests(requests);
    
    return newRequest;
  },

  /**
   * Submit a bid on a project request
   */
  submitBid: (requestId, bidData) => {
    const requests = getStoredRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) throw new Error('Request not found');
    
    const newBid = {
      id: `b_${Date.now()}`,
      ...bidData,
      status: 'PENDING',
      submittedAt: new Date(),
    };
    
    request.bids.push(newBid);
    
    // Update status to BIDDING if not already
    if (request.status === 'PENDING') {
      request.status = 'BIDDING';
    }
    
    saveRequests(requests);
    return newBid;
  },

  /**
   * Accept a bid on a project request
   */
  acceptBid: (requestId, bidId) => {
    const requests = getStoredRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) throw new Error('Request not found');
    
    // Update all bids status
    request.bids = request.bids.map(b => ({
      ...b,
      status: b.id === bidId ? 'ACCEPTED' : 'REJECTED'
    }));
    
    request.status = 'ACCEPTED';
    request.acceptedBidId = bidId;
    
    saveRequests(requests);
    return request;
  },

  /**
   * Reject a bid on a project request
   */
  rejectBid: (requestId, bidId) => {
    const requests = getStoredRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) throw new Error('Request not found');
    
    const bid = request.bids.find(b => b.id === bidId);
    if (!bid) throw new Error('Bid not found');
    
    bid.status = 'REJECTED';
    saveRequests(requests);
    
    return bid;
  },

  /**
   * Update request status
   */
  updateRequestStatus: (requestId, newStatus) => {
    const requests = getStoredRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) throw new Error('Request not found');
    
    request.status = newStatus;
    request.updatedAt = new Date();
    
    saveRequests(requests);
    return request;
  },

  /**
   * Get collaborator details
   */
  getCollaborator: (collaboratorId) => {
    return mockCollaborators.find(c => c.id === collaboratorId);
  },

  /**
   * Get all collaborators
   */
  getAllCollaborators: () => {
    return [...mockCollaborators];
  },

  /**
   * Get user details
   */
  getUser: (userId) => {
    return mockUsers.find(u => u.id === userId);
  },

  /**
   * Get stats for dashboard
   */
  getRequestStats: (buyerId) => {
    const requests = projectRequestService.getRequestsByBuyer(buyerId);
    
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      bidding: requests.filter(r => r.status === 'BIDDING').length,
      accepted: requests.filter(r => r.status === 'ACCEPTED').length,
      inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
      completed: requests.filter(r => r.status === 'COMPLETED').length,
      totalBids: requests.reduce((sum, r) => sum + r.bids.length, 0),
      totalBudget: requests.reduce((sum, r) => sum + (r.budgetMax || 0), 0),
    };
  },

  /**
   * Get collaborator stats
   */
  getCollaboratorStats: (collaboratorId) => {
    const allRequests = projectRequestService.getAllRequests();
    const collaboratorBids = [];
    
    allRequests.forEach(r => {
      r.bids.forEach(b => {
        if (b.collaboratorId === collaboratorId) {
          collaboratorBids.push({ ...b, requestId: r.id, requestTitle: r.title });
        }
      });
    });
    
    return {
      totalBids: collaboratorBids.length,
      pendingBids: collaboratorBids.filter(b => b.status === 'PENDING').length,
      acceptedBids: collaboratorBids.filter(b => b.status === 'ACCEPTED').length,
      rejectedBids: collaboratorBids.filter(b => b.status === 'REJECTED').length,
      totalEarnings: collaboratorBids
        .filter(b => b.status === 'ACCEPTED')
        .reduce((sum, b) => sum + (b.price || 0), 0),
    };
  },
};

/**
 * Helper functions for storage
 */
function getStoredRequests() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.error('Error reading stored requests:', error);
  }
  
  // Return mock data as default
  return JSON.parse(JSON.stringify(mockProjectRequests));
}

function saveRequests(requests) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Error saving requests:', error);
  }
}

export default projectRequestService;

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip, Tab, Tabs,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton,
} from '@mui/material';
import {
  FileText, DollarSign, Calendar, Users, Eye, X, CheckCircle, Clock,
  AlertCircle, TrendingUp, Star, Send, Award,
} from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import DashboardLayout from '../components/DashboardLayout';
import projectRequestService from '../../../utils/projectRequestService';

const PRIMARY = '#FF8C00';
const SECONDARY = '#20B2AA';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

export default function RequestsPage() {
  const themeColors = useThemeColors();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isBidDetailsOpen, setIsBidDetailsOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    bidding: 0,
    accepted: 0,
    totalBids: 0,
    totalBudget: 0,
  });

  // Get current user (demo: buyer)
  const currentBuyerId = '4'; // Demo: Jane Buyer

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      // Get buyer's requests
      const buyerRequests = projectRequestService.getRequestsByBuyer(currentBuyerId);
      setRequests(buyerRequests);

      // Get stats
      const requestStats = projectRequestService.getRequestStats(currentBuyerId);
      setStats(requestStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = (bid) => {
    setSelectedBid(bid);
    setAcceptDialogOpen(true);
  };

  const confirmAcceptBid = () => {
    try {
      projectRequestService.acceptBid(selectedRequest.id, selectedBid.id);
      alert('Bid accepted! This collaboration is now active.');
      loadData();
      setIsBidDetailsOpen(false);
      setAcceptDialogOpen(false);
    } catch (error) {
      alert('Error accepting bid: ' + error.message);
    }
  };

  const handleRejectBid = (bid) => {
    try {
      projectRequestService.rejectBid(selectedRequest.id, bid.id);
      alert('Bid rejected.');
      loadData();
      setIsBidDetailsOpen(false);
    } catch (error) {
      alert('Error rejecting bid: ' + error.message);
    }
  };

  const stats_cards = [
    { label: 'Total Requests', value: stats.total, icon: <FileText size={20} color={PRIMARY} /> },
    { label: 'Pending', value: stats.pending, icon: <Clock size={20} color={WARNING} /> },
    { label: 'With Bids', value: stats.bidding, icon: <TrendingUp size={20} color={PRIMARY} /> },
    { label: 'Active Projects', value: stats.accepted, icon: <CheckCircle size={20} color={SUCCESS} /> },
  ];

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status.toLowerCase() === filter);

  return (
    <DashboardLayout role="buyer">
      <Box sx={{ backgroundColor: themeColors.bg, transition: 'background-color 0.3s ease' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5, transition: 'color 0.3s ease' }}>
            My Project Requests
          </Typography>
          <Typography sx={{ color: themeColors.textMuted, fontSize: '1rem', transition: 'color 0.3s ease' }}>
            Track your project requests and manage collaborator requests
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          {stats_cards.map((stat, idx) => (
            <Card key={idx} sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card, transition: 'all 0.3s ease' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', color: themeColors.textMuted, mb: 0.5, transition: 'color 0.3s ease' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: themeColors.text, transition: 'color 0.3s ease' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, backgroundColor: `${SECONDARY}20`, borderRadius: 2, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Tabs */}
        <Box sx={{ mb: 3, borderBottom: `1px solid ${themeColors.border}`, transition: 'border-color 0.3s ease' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 'none' }} textColor="inherit">
            <Tab label="All Requests" sx={{ textTransform: 'none', fontSize: '0.95rem', fontWeight: 600, color: themeColors.textMuted, '&.Mui-selected': { color: themeColors.text } }} />
            <Tab label="Active" sx={{ textTransform: 'none', fontSize: '0.95rem', fontWeight: 600, color: themeColors.textMuted, '&.Mui-selected': { color: themeColors.text } }} />
            <Tab label="Completed" sx={{ textTransform: 'none', fontSize: '0.95rem', fontWeight: 600, color: themeColors.textMuted, '&.Mui-selected': { color: themeColors.text } }} />
          </Tabs>
        </Box>

        {/* Filter Chips */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filter === 'all' ? PRIMARY : themeColors.card,
              color: filter === 'all' ? '#fff' : themeColors.text,
              borderColor: themeColors.border,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
          />
          <Chip
            label="Pending"
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filter === 'pending' ? WARNING : themeColors.card,
              color: filter === 'pending' ? '#fff' : themeColors.text,
              borderColor: themeColors.border,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
          />
          <Chip
            label="Requesting"
            onClick={() => setFilter('bidding')}
            variant={filter === 'bidding' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filter === 'bidding' ? SECONDARY : themeColors.card,
              color: filter === 'bidding' ? '#fff' : themeColors.text,
              borderColor: themeColors.border,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
          />
        </Box>

        {/* Requests List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: themeColors.textMuted }}>Loading requests...</Typography>
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', p: 4, textAlign: 'center', backgroundColor: themeColors.card, transition: 'all 0.3s ease' }}>
            <AlertCircle size={48} color={themeColors.textMuted} style={{ margin: '0 auto 16px' }} />
            <Typography sx={{ color: themeColors.textMuted }}>
              No requests found. Create one to get started!
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr' }, gap: 2.5 }}>
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onViewBids={() => {
                  setSelectedRequest(request);
                  setIsBidDetailsOpen(true);
                }}
              />
            ))}
          </Box>
        )}

        {/* Request Details Dialog */}
        <Dialog
          open={isBidDetailsOpen}
          onClose={() => setIsBidDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { backgroundColor: themeColors.card, transition: 'background-color 0.3s ease' } }}
        >
          {selectedRequest && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: themeColors.text, transition: 'color 0.3s ease' }}>
                Requests for: {selectedRequest.title}
              </DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                {selectedRequest.bids?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Clock size={40} color={themeColors.textMuted} style={{ margin: '0 auto 16px' }} />
                    <Typography sx={{ color: themeColors.textMuted }}>
                      No requests yet. Check back soon!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gap: 2.5 }}>
                    {selectedRequest.bids?.map((bid) => (
                      <BidItemDialog
                        key={bid.id}
                        bid={bid}
                        requestBudget={[selectedRequest.budgetMin, selectedRequest.budgetMax]}
                        onAccept={() => handleAcceptBid(bid)}
                        onReject={() => handleRejectBid(bid)}
                      />
                    ))}
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Accept Request Confirmation Dialog */}
        <Dialog
          open={acceptDialogOpen}
          onClose={() => setAcceptDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { backgroundColor: themeColors.card, transition: 'background-color 0.3s ease' } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: themeColors.text, transition: 'color 0.3s ease' }}>
            Accept This Request?
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            {selectedBid && (
              <Box>
                <Typography sx={{ mb: 2, color: themeColors.text, transition: 'color 0.3s ease' }}>
                  You are about to accept a request from <strong>{selectedBid.collaboratorName}</strong>
                </Typography>
                <Box sx={{ p: 2, backgroundColor: themeColors.bgSecondary, borderRadius: 2, mb: 2, transition: 'background-color 0.3s ease' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>
                        Amount
                      </Typography>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: PRIMARY }}>
                        ${selectedBid.price}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>
                        Delivery Time
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
                        {selectedBid.deliveryTime}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.9rem', color: themeColors.textMuted, lineHeight: 1.5, transition: 'color 0.3s ease' }}>
                  Proposal: {selectedBid.proposal}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAcceptDialogOpen(false)} sx={{ color: themeColors.textMuted, fontWeight: 700, transition: 'color 0.3s ease' }}>
              Cancel
            </Button>
            <Button
              onClick={confirmAcceptBid}
              variant="contained"
              sx={{
                backgroundColor: SUCCESS, fontWeight: 700, '&:hover': { backgroundColor: '#15803d' }
              }}
            >
              Accept Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

/**
 * Request Card Component
 */
function RequestCard({ request, onViewBids }) {
  const themeColors = useThemeColors();

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fffbeb', color: WARNING, label: 'Awaiting Requests' };
      case 'BIDDING':
        return { bg: '#e6f7f6', color: SECONDARY, label: 'Requesting in Progress' };
      case 'ACCEPTED':
        return { bg: '#f0fdf4', color: SUCCESS, label: 'Active' };
      case 'IN_PROGRESS':
        return { bg: '#e6f0ff', color: '#2563eb', label: 'In Progress' };
      case 'COMPLETED':
        return { bg: '#f0fdf4', color: SUCCESS, label: 'Completed' };
      case 'REJECTED':
        return { bg: '#fef2f2', color: DANGER, label: 'Rejected' };
      default:
        return { bg: '#f9fafb', color: '#6b7280', label: status };
    }
  };

  const statusColor = getStatusColor(request.status);

  return (
    <Card sx={{
      borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card,
      transition: 'all 0.3s ease', '&:hover': {
        transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(97,197,195,0.12)',
        borderColor: PRIMARY
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: themeColors.text, mb: 0.5, transition: 'color 0.3s ease' }}>
              {request.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted, transition: 'color 0.3s ease' }}>
                {request.category}
              </Typography>
              <Box sx={{ width: 4, height: 4, backgroundColor: themeColors.border, borderRadius: '50%' }} />
              <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted, transition: 'color 0.3s ease' }}>
                {request.dataType}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={statusColor.label}
            size="small"
            sx={{
              backgroundColor: statusColor.bg,
              color: statusColor.color,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          />
        </Box>

        <Typography sx={{ fontSize: '0.9rem', color: themeColors.textMuted, mb: 2, lineHeight: 1.5, transition: 'color 0.3s ease' }}>
          {request.description.substring(0, 120)}...
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3, p: 2, backgroundColor: themeColors.bgSecondary, borderRadius: 2, transition: 'background-color 0.3s ease' }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Budget</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: PRIMARY }}>
              ${request.budgetMin} - ${request.budgetMax}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Deadline</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
              {new Date(request.deadline).toLocaleDateString()}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Data Size</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
              {request.datasetSize}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Requests</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: SECONDARY }}>
              {request.bids?.length || 0}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: themeColors.textMuted, mb: 0.5, transition: 'color 0.3s ease' }}>Priority</Typography>
            <Chip
              label={request.priorityLevel}
              size="small"
              variant="outlined"
              sx={{
                borderColor: themeColors.border,
                fontSize: '0.75rem',
                color: themeColors.text,
              }}
            />
          </Box>
          <Button
            onClick={onViewBids}
            variant="contained"
            endIcon={<Eye size={16} />}
            disabled={!request.bids?.length}
            sx={{
              backgroundColor: request.bids?.length ? PRIMARY : themeColors.border,
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 1.5,
              '&:hover': { backgroundColor: request.bids?.length ? '#e67e00' : themeColors.border }
            }}
          >
            View Requests ({request.bids?.length || 0})
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Request Item Dialog Component
 */
function BidItemDialog({ bid, requestBudget, onAccept, onReject }) {
  const themeColors = useThemeColors();
  const withinBudget = bid.price >= requestBudget[0] && bid.price <= requestBudget[1];

  return (
    <Card sx={{
      borderRadius: 2,
      border: withinBudget ? `2px solid ${SUCCESS}` : `1px solid ${themeColors.border}`,
      boxShadow: 'none',
      backgroundColor: withinBudget ? `${SUCCESS}10` : themeColors.bgSecondary,
      transition: 'all 0.3s ease'
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              src={bid.collaboratorAvatar}
              sx={{ width: 40, height: 40 }}
            />
            <Box>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
                {bid.collaboratorName}
              </Typography>
              <Chip
                label={bid.status === 'PENDING' ? 'Awaiting Review' : bid.status === 'ACCEPTED' ? 'Won' : 'Rejected'}
                size="small"
                sx={{
                  backgroundColor: bid.status === 'PENDING' ? '#fffbeb' : bid.status === 'ACCEPTED' ? '#f0fdf4' : '#fef2f2',
                  color: bid.status === 'PENDING' ? WARNING : bid.status === 'ACCEPTED' ? SUCCESS : DANGER,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  mt: 0.5,
                }}
              />
            </Box>
          </Box>
          {withinBudget && (
            <Box sx={{ px: 1.5, py: 0.5, backgroundColor: `${SUCCESS}20`, borderRadius: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <CheckCircle size={14} color={SUCCESS} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SUCCESS }}>
                Within Budget
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5, p: 1.5, backgroundColor: themeColors.card, borderRadius: 1.5, transition: 'background-color 0.3s ease' }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Amount</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: PRIMARY }}>
              ${bid.price}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Delivery</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
              {bid.deliveryTime}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: themeColors.card, borderRadius: 1.5, transition: 'background-color 0.3s ease' }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: themeColors.text, mb: 0.5, transition: 'color 0.3s ease' }}>
            Proposal
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted, lineHeight: 1.5, transition: 'color 0.3s ease' }}>
            {bid.proposal}
          </Typography>
        </Box>

        {bid.status === 'PENDING' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Button
              onClick={onReject}
              variant="outlined"
              sx={{
                borderColor: DANGER, color: DANGER, fontWeight: 700, textTransform: 'none',
                '&:hover': { backgroundColor: `${DANGER}10` }
              }}
            >
              Reject
            </Button>
            <Button
              onClick={onAccept}
              variant="contained"
              startIcon={<Award size={16} />}
              sx={{
                backgroundColor: SUCCESS, color: '#fff', fontWeight: 700, textTransform: 'none',
                '&:hover': { backgroundColor: '#15803d' }
              }}
            >
              Accept
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

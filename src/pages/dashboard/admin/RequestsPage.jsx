import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import {
  FileText, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, Trash2,
} from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import DashboardLayout from '../components/DashboardLayout';
import projectRequestService from '../../../utils/projectRequestService';

const PRIMARY = '#FF8C00';
const SECONDARY = '#20B2AA';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

export default function AdminRequestsPage({ role = 'admin' }) {
  const themeColors = useThemeColors();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    bidding: 0,
    accepted: 0,
    totalBudget: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const allRequests = projectRequestService.getAllRequests();
      setRequests(allRequests);

      // Calculate stats
      const stats_obj = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'PENDING').length,
        bidding: allRequests.filter(r => r.status === 'BIDDING').length,
        accepted: allRequests.filter(r => r.status === 'ACCEPTED').length,
        totalBudget: allRequests.reduce((sum, r) => sum + ((r.budgetMin + r.budgetMax) / 2), 0),
      };
      setStats(stats_obj);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (requestId) => {
    if (confirm('Are you sure you want to delete this request?')) {
      // This would normally call a delete API
      alert('Request deleted successfully');
      loadData();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fffbeb', color: WARNING, label: 'Pending' };
      case 'BIDDING':
        return { bg: '#e6f7f6', color: SECONDARY, label: 'Requesting' };
      case 'ACCEPTED':
        return { bg: '#f0fdf4', color: SUCCESS, label: 'Active' };
      default:
        return { bg: '#f9fafb', color: '#6b7280', label: status };
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status.toLowerCase() === filter.toLowerCase());

  const stats_cards = [
    { label: 'Total Requests', value: stats.total, icon: <FileText size={20} color={PRIMARY} /> },
    { label: 'Pending', value: stats.pending, icon: <Clock size={20} color={WARNING} /> },
    { label: 'With Requests', value: stats.bidding, icon: <TrendingUp size={20} color={PRIMARY} /> },
    { label: 'Active', value: stats.accepted, icon: <CheckCircle size={20} color={SUCCESS} /> },
  ];

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg, transition: 'background-color 0.3s ease' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5, transition: 'color 0.3s ease' }}>
            All Project Requests
          </Typography>
          <Typography sx={{ color: themeColors.textMuted, fontSize: '1rem', transition: 'color 0.3s ease' }}>
            Manage and monitor all project requests from buyers
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
          <Chip
            label="Active"
            onClick={() => setFilter('accepted')}
            variant={filter === 'accepted' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filter === 'accepted' ? SUCCESS : themeColors.card,
              color: filter === 'accepted' ? '#fff' : themeColors.text,
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
              No requests found
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr' }, gap: 2.5 }}>
            {filteredRequests.map((request) => (
              <AdminRequestCard
                key={request.id}
                request={request}
                themeColors={themeColors}
                onView={() => {
                  setSelectedRequest(request);
                  setDetailsOpen(true);
                }}
                onDelete={() => handleDeleteRequest(request.id)}
              />
            ))}
          </Box>
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { backgroundColor: themeColors.card, transition: 'background-color 0.3s ease' } }}
        >
          {selectedRequest && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: themeColors.text, transition: 'color 0.3s ease' }}>
                Request Details
              </DialogTitle>
              <DialogContent sx={{ py: 3, color: themeColors.text, transition: 'color 0.3s ease' }}>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Title</Typography>
                    <Typography sx={{ fontSize: '1rem', color: themeColors.text }}>{selectedRequest.title}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Description</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: themeColors.text }}>{selectedRequest.description}</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Budget</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: PRIMARY }}>${selectedRequest.budgetMin} - ${selectedRequest.budgetMax}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Deadline</Typography>
                      <Typography sx={{ fontSize: '1rem', color: themeColors.text }}>{new Date(selectedRequest.deadline).toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Requests Submitted</Typography>
                    <Typography sx={{ fontSize: '1rem', color: themeColors.text }}>{selectedRequest.bids?.length || 0}</Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={() => setDetailsOpen(false)} sx={{ color: themeColors.textMuted, fontWeight: 700 }}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

/**
 * Admin Request Card Component
 */
function AdminRequestCard({ request, themeColors, onView, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fffbeb', color: '#f59e0b', label: 'Pending' };
      case 'BIDDING':
        return { bg: '#e6f7f6', color: '#20B2AA', label: 'Requesting' };
      case 'ACCEPTED':
        return { bg: '#f0fdf4', color: '#16a34a', label: 'Active' };
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
        borderColor: '#FF8C00'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: themeColors.text, mb: 0.5, transition: 'color 0.3s ease' }}>
              {request.title}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted, transition: 'color 0.3s ease' }}>
              From {request.buyerName}
            </Typography>
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
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#FF8C00' }}>
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
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Data Type</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text, transition: 'color 0.3s ease' }}>
              {request.dataType}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3, transition: 'color 0.3s ease' }}>Requests</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#20B2AA' }}>
              {request.bids?.length || 0}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={onView}
            variant="contained"
            startIcon={<Eye size={16} />}
            sx={{
              backgroundColor: '#FF8C00', color: '#fff', fontWeight: 700, textTransform: 'none',
              borderRadius: 1.5, flex: 1, '&:hover': { backgroundColor: '#e67e00' }
            }}
          >
            View Details
          </Button>
          <IconButton
            onClick={onDelete}
            sx={{
              color: '#dc2626', borderRadius: 1.5,
              '&:hover': { backgroundColor: '#fef2f2' }
            }}
          >
            <Trash2 size={18} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

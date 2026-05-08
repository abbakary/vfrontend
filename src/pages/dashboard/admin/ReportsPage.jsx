import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { FileText, Eye, AlertCircle, TrendingUp, Trash2, Download } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import DashboardLayout from '../components/DashboardLayout';
import projectRequestService from '../../../utils/projectRequestService';

const PRIMARY = '#FF8C00';
const SECONDARY = '#20B2AA';
const SUCCESS = '#16a34a';

export default function AdminReportsPage({ role = 'admin' }) {
  const themeColors = useThemeColors();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Build reports from completed/accepted project requests
    const allRequests = projectRequestService.getAllRequests();
    const reportItems = allRequests
      .filter(r => r.status === 'ACCEPTED' || r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
      .map(r => {
        const acceptedBid = r.bids?.find(b => b.status === 'ACCEPTED');
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          createdAt: new Date(r.createdAt),
          requestedBy: r.buyerName,
          status: r.status === 'COMPLETED' ? 'Completed' : 'Active',
          budget: acceptedBid ? acceptedBid.price : ((r.budgetMin + r.budgetMax) / 2),
          collaborator: acceptedBid?.collaboratorName || 'Unassigned',
          bidsCount: r.bids?.length || 0,
        };
      });
    setReports(reportItems);
  }, []);

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status.toLowerCase() === filter.toLowerCase());

  const stats = {
    total: reports.length,
    active: reports.filter(r => r.status === 'Active').length,
    completed: reports.filter(r => r.status === 'Completed').length,
    totalBudget: reports.reduce((sum, r) => sum + r.budget, 0),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#f0fdf4', color: SUCCESS };
      case 'Completed': return { bg: '#e6f7f6', color: SECONDARY };
      default: return { bg: '#f9fafb', color: '#6b7280' };
    }
  };

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg, transition: 'background-color 0.3s ease' }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5 }}>
            Custom Reports
          </Typography>
          <Typography sx={{ color: themeColors.textMuted, fontSize: '1rem' }}>
            Monitor all active and completed custom data projects
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          {[
            { label: 'Total Reports', value: stats.total, icon: <FileText size={20} color={PRIMARY} /> },
            { label: 'Active', value: stats.active, icon: <TrendingUp size={20} color={SUCCESS} /> },
            { label: 'Completed', value: stats.completed, icon: <Eye size={20} color={SECONDARY} /> },
            { label: 'Total Budget', value: `$${stats.totalBudget.toLocaleString()}`, icon: <Download size={20} color={PRIMARY} /> },
          ].map((stat, idx) => (
            <Card key={idx} sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', color: themeColors.textMuted, mb: 0.5 }}>{stat.label}</Typography>
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: themeColors.text }}>{stat.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, backgroundColor: `${SECONDARY}20`, borderRadius: 2, display: 'flex' }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'active', 'completed'].map(f => (
            <Chip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: filter === f ? (f === 'all' ? PRIMARY : f === 'active' ? SUCCESS : SECONDARY) : themeColors.card,
                color: filter === f ? '#fff' : themeColors.text,
                borderColor: themeColors.border,
                fontSize: '0.9rem',
              }}
            />
          ))}
        </Box>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', p: 4, textAlign: 'center', backgroundColor: themeColors.card }}>
            <AlertCircle size={48} color={themeColors.textMuted} style={{ margin: '0 auto 16px' }} />
            <Typography sx={{ color: themeColors.textMuted }}>No reports found</Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            {filteredReports.map((report) => {
              const sc = getStatusColor(report.status);
              return (
                <Card key={report.id} sx={{
                  borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card,
                  transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(97,197,195,0.12)', borderColor: PRIMARY }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: themeColors.text, mb: 0.5 }}>{report.title}</Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted }}>{report.category} • By {report.requestedBy}</Typography>
                      </Box>
                      <Chip label={report.status} size="small" sx={{ backgroundColor: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 600 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.9rem', color: themeColors.textMuted, mb: 2, lineHeight: 1.5 }}>
                      {report.description.substring(0, 120)}...
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3, p: 2, backgroundColor: themeColors.bgSecondary, borderRadius: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Category</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text }}>{report.category}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Budget</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: PRIMARY }}>${report.budget.toLocaleString()}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Collaborator</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text }}>{report.collaborator}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Created</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text }}>{report.createdAt.toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        onClick={() => { setSelectedReport(report); setDetailsOpen(true); }}
                        variant="contained"
                        startIcon={<Eye size={16} />}
                        sx={{ backgroundColor: PRIMARY, color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, flex: 1, '&:hover': { backgroundColor: '#e67e00' } }}
                      >
                        View Details
                      </Button>
                      <IconButton sx={{ color: '#dc2626', borderRadius: 1.5, '&:hover': { backgroundColor: '#fef2f2' } }}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { backgroundColor: themeColors.card } }}>
          {selectedReport && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: themeColors.text }}>Report Details</DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Title</Typography>
                    <Typography sx={{ color: themeColors.text }}>{selectedReport.title}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Description</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: themeColors.text }}>{selectedReport.description}</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Budget</Typography>
                      <Typography sx={{ fontWeight: 700, color: PRIMARY }}>${selectedReport.budget.toLocaleString()}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Collaborator</Typography>
                      <Typography sx={{ color: themeColors.text }}>{selectedReport.collaborator}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Requested By</Typography>
                    <Typography sx={{ color: themeColors.text }}>{selectedReport.requestedBy}</Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={() => setDetailsOpen(false)} sx={{ color: themeColors.textMuted, fontWeight: 700 }}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

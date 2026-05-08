import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { Folder, Eye, AlertCircle, TrendingUp, Trash2, Users, DollarSign } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import DashboardLayout from '../components/DashboardLayout';
import { projectService, customRequestService } from '../../../utils/apiService';

const PRIMARY = '#FF8C00';
const SECONDARY = '#20B2AA';
const SUCCESS = '#16a34a';
const WARNING = '#f59e0b';
const DANGER = '#dc2626';

const STATUS_MAP = {
  PENDING: { label: 'Pending', bg: '#fffbeb', color: WARNING },
  BIDDING: { label: 'Requesting', bg: '#e6f7f6', color: SECONDARY },
  ACCEPTED: { label: 'Active', bg: '#f0fdf4', color: SUCCESS },
  IN_PROGRESS: { label: 'In Progress', bg: '#e6f0ff', color: '#2563eb' },
  COMPLETED: { label: 'Completed', bg: '#f0fdf4', color: SUCCESS },
  REJECTED: { label: 'Rejected', bg: '#fef2f2', color: DANGER },
};

export default function AdminProjectsPage({ role = 'admin' }) {
  const themeColors = useThemeColors();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState('projects');

  useEffect(() => {
    loadProjects();
  }, []);

  const normalizeStatus = (rawStatus) => {
    const value = (rawStatus || '').toString().toUpperCase();
    if (value === 'ACTIVE') return 'ACCEPTED';
    if (value === 'REQUESTING') return 'BIDDING';
    return value || 'PENDING';
  };

  const mapProject = (record) => {
    const owner = record.owner_name || record.owner?.full_name || record.owner?.name || record.owner_user_name || 'Unknown';
    const category = record.category_name || record.category?.name || record.category || 'Uncategorized';
    const budgetMin = Number(record.budget_min ?? record.budgetMin ?? record.min_budget ?? 0);
    const budgetMax = Number(record.budget_max ?? record.budgetMax ?? record.max_budget ?? 0);
    const bids = Array.isArray(record.bids) ? record.bids : [];
    const deadlineRaw = record.deadline || record.due_date || record.end_date || record.updated_at || record.created_at;

    return {
      id: record.id,
      title: record.title || `Project #${record.id}`,
      description: record.description || record.summary || 'No description provided.',
      category,
      owner,
      createdAt: new Date(record.created_at || record.createdAt || Date.now()),
      deadline: new Date(deadlineRaw || Date.now()),
      status: normalizeStatus(record.status),
      collaborators: Number(record.collaborators_count ?? record.collaborators ?? 0),
      totalBids: Number(record.bids_count ?? record.total_bids ?? bids.length),
      budgetMin,
      budgetMax: budgetMax || budgetMin,
      priorityLevel: record.priority_level || record.priority || 'N/A',
      dataType: record.data_type || record.project_type || 'N/A',
      bids,
    };
  };

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    return [];
  };

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await projectService.list();
      const list = extractList(response.data);
      setProjects(list.map(mapProject));
      setSource('projects');
    } catch (err) {
      // Fallback for environments where /projects fails (method mismatch,
      // backend error, or CORS-blocked response causing Axios "Network Error").
      try {
        const fallbackResponse = await customRequestService.admin();
        const fallbackList = extractList(fallbackResponse.data);
        setProjects(fallbackList.map(mapProject));
        setSource('custom-requests');
        return;
      } catch (fallbackErr) {
        console.error('Failed to load project requests:', fallbackErr);
        setProjects([]);
        setError(fallbackErr?.response?.data?.message || fallbackErr?.message || 'Failed to load project requests');
        return;
      }

      console.error('Failed to load projects:', err);
      setProjects([]);
      setError(err?.response?.data?.message || err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status.toLowerCase() === filter.toLowerCase());

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS').length,
    pending: projects.filter(p => p.status === 'PENDING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this project?')) {
      setDeleteLoadingId(id);
      try {
        if (source === 'custom-requests') {
          await customRequestService.delete(id);
        } else {
          await projectService.delete(id);
        }
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete project:', err);
        alert(err?.response?.data?.message || 'Failed to delete project');
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };

  const handleViewDetails = async (project) => {
    setSelectedProject(project);
    setDetailsOpen(true);

    try {
      const response = source === 'custom-requests'
        ? await customRequestService.get(project.id)
        : await projectService.get(project.id);
      const payload = response.data?.data || response.data;
      if (payload && payload.id != null) {
        setSelectedProject(mapProject(payload));
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  return (
    <DashboardLayout role={role}>
      <Box sx={{ backgroundColor: themeColors.bg, transition: 'background-color 0.3s ease' }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: themeColors.text, mb: 0.5 }}>
            Project Management
          </Typography>
          <Typography sx={{ color: themeColors.textMuted, fontSize: '1rem' }}>
            Monitor and manage all custom data projects
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          {[
            { label: 'Total Projects', value: stats.total, icon: <Folder size={20} color={PRIMARY} /> },
            { label: 'Active', value: stats.active, icon: <TrendingUp size={20} color={SUCCESS} /> },
            { label: 'Pending', value: stats.pending, icon: <Users size={20} color={WARNING} /> },
            { label: 'Completed', value: stats.completed, icon: <DollarSign size={20} color={SECONDARY} /> },
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
          {[
            { key: 'all', label: 'All', color: PRIMARY },
            { key: 'PENDING', label: 'Pending', color: WARNING },
            { key: 'BIDDING', label: 'Requesting', color: SECONDARY },
            { key: 'ACCEPTED', label: 'Active', color: SUCCESS },
            { key: 'COMPLETED', label: 'Completed', color: '#2563eb' },
          ].map(f => (
            <Chip
              key={f.key}
              label={f.label}
              onClick={() => setFilter(f.key)}
              variant={filter === f.key ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: filter === f.key ? f.color : themeColors.card,
                color: filter === f.key ? '#fff' : themeColors.text,
                borderColor: themeColors.border,
                fontSize: '0.9rem',
              }}
            />
          ))}
        </Box>

        {error && (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', p: 2, mb: 2, backgroundColor: '#fff7ed' }}>
            <Typography sx={{ color: DANGER, fontWeight: 600, fontSize: '0.9rem' }}>{error}</Typography>
          </Card>
        )}

        {/* Projects List */}
        {loading ? (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', p: 4, textAlign: 'center', backgroundColor: themeColors.card }}>
            <Typography sx={{ color: themeColors.textMuted }}>Loading projects...</Typography>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', p: 4, textAlign: 'center', backgroundColor: themeColors.card }}>
            <AlertCircle size={48} color={themeColors.textMuted} style={{ margin: '0 auto 16px' }} />
            <Typography sx={{ color: themeColors.textMuted }}>No projects found</Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            {filteredProjects.map((project) => {
              const sc = STATUS_MAP[project.status] || { label: project.status, bg: '#f9fafb', color: '#6b7280' };
              return (
                <Card key={project.id} sx={{
                  borderRadius: 2, border: `1px solid ${themeColors.border}`, boxShadow: 'none', backgroundColor: themeColors.card,
                  transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(97,197,195,0.12)', borderColor: PRIMARY }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: themeColors.text, mb: 0.5 }}>{project.title}</Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: themeColors.textMuted }}>By {project.owner} • {project.category}</Typography>
                      </Box>
                      <Chip label={sc.label} size="small" sx={{ backgroundColor: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 600 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.9rem', color: themeColors.textMuted, mb: 2, lineHeight: 1.5 }}>
                      {project.description.substring(0, 120)}{project.description.length > 120 ? '...' : ''}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3, p: 2, backgroundColor: themeColors.bgSecondary, borderRadius: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Budget</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: PRIMARY }}>${project.budgetMin}–${project.budgetMax}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Deadline</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text }}>{project.deadline.toLocaleDateString()}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Bids</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: SECONDARY }}>{project.totalBids}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: themeColors.textMuted, mb: 0.3 }}>Priority</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: themeColors.text }}>{project.priorityLevel}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        onClick={() => handleViewDetails(project)}
                        variant="contained"
                        startIcon={<Eye size={16} />}
                        sx={{ backgroundColor: PRIMARY, color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, flex: 1, '&:hover': { backgroundColor: '#e67e00' } }}
                      >
                        View Details
                      </Button>
                      <IconButton
                        onClick={() => handleDelete(project.id)}
                        disabled={deleteLoadingId === project.id}
                        sx={{ color: DANGER, borderRadius: 1.5, '&:hover': { backgroundColor: '#fef2f2' } }}
                      >
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
          {selectedProject && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: themeColors.text }}>Project Details</DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Title</Typography>
                    <Typography sx={{ color: themeColors.text }}>{selectedProject.title}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Description</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: themeColors.text }}>{selectedProject.description}</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Owner</Typography>
                      <Typography sx={{ color: themeColors.text }}>{selectedProject.owner}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Budget</Typography>
                      <Typography sx={{ fontWeight: 700, color: PRIMARY }}>${selectedProject.budgetMin} – ${selectedProject.budgetMax}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Deadline</Typography>
                      <Typography sx={{ color: themeColors.text }}>{selectedProject.deadline.toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 0.5 }}>Data Type</Typography>
                      <Typography sx={{ color: themeColors.text }}>{selectedProject.dataType}</Typography>
                    </Box>
                  </Box>
                  {selectedProject.bids.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textMuted, mb: 1 }}>Bids ({selectedProject.bids.length})</Typography>
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {selectedProject.bids.map(bid => (
                          <Box key={bid.id} sx={{ p: 1.5, backgroundColor: themeColors.bgSecondary, borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: themeColors.text }}>
                              {bid.collaboratorName || bid.collaborator_name || bid.collaborator?.name || 'Collaborator'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: PRIMARY }}>${bid.price || bid.amount || 0}</Typography>
                              <Chip label={bid.status} size="small" sx={{
                                backgroundColor: bid.status === 'ACCEPTED' ? '#f0fdf4' : bid.status === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                                color: bid.status === 'ACCEPTED' ? SUCCESS : bid.status === 'REJECTED' ? DANGER : WARNING,
                                fontSize: '0.7rem', fontWeight: 600,
                              }} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
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

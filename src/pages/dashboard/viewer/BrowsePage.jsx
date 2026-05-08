import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { Search, X, Eye, Download, MapPin, Tag } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';
import { publicDatasetService, categoryService, viewService } from '../../../utils/apiService';

export default function BrowsePage() {
  const themeColors = useThemeColors();

  const [datasets, setDatasets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, skip: (page - 1) * limit };
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category_id = categoryFilter;

      const res = await publicDatasetService.list(params);
      const data = res.data;
      const list = data?.items || data?.data || data || [];
      const arr = Array.isArray(list) ? list : [];

      // Client-side sort
      const sorted = [...arr].sort((a, b) => {
        if (sortBy === 'popular') return (b.total_views || 0) - (a.total_views || 0);
        if (sortBy === 'downloads') return (b.total_downloads || 0) - (a.total_downloads || 0);
        if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        return 0;
      });

      setDatasets(sorted);
      setTotal(data?.total || arr.length);
    } catch (err) {
      console.error('Browse datasets error:', err);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, sortBy, page]);

  useEffect(() => {
    categoryService.active()
      .then(res => {
        const data = res.data;
        const list = data?.items || data?.data || data || [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDatasets(), searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchDatasets]);

  const handleViewDataset = async (dataset) => {
    setSelected(dataset);
    try {
      await viewService.add('dataset', dataset.id);
    } catch {}
  };

  const inputStyle = {
    background: themeColors.bg,
    border: `1px solid ${themeColors.border}`,
    borderRadius: 12,
    padding: '10px 14px',
    color: themeColors.text,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout role="viewer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: themeColors.text, margin: 0 }}>Browse Datasets</h2>
          <p style={{ color: themeColors.textMuted, margin: '4px 0 0', fontSize: 15, fontWeight: 500 }}>
            Discover and explore public datasets
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
            <input
              placeholder="Search by title or keyword..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ ...inputStyle, width: '100%', paddingLeft: 44, boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, minWidth: 180, cursor: 'pointer', appearance: 'none' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
            style={{ ...inputStyle, minWidth: 160, cursor: 'pointer', appearance: 'none' }}
          >
            <option value="popular">Most Viewed</option>
            <option value="downloads">Most Downloaded</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          {(searchQuery || categoryFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter(''); setPage(1); }}
              style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 12, color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p style={{ fontSize: 14, color: themeColors.textMuted, margin: 0, fontWeight: 600 }}>
          {loading ? 'Searching...' : <>Found <span style={{ color: '#FF8C00', fontWeight: 800 }}>{total}</span> dataset{total !== 1 ? 's' : ''}</>}
        </p>

        {/* Dataset Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 200, borderRadius: 20, background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div style={{ background: themeColors.card, border: `1px solid ${themeColors.border}`, borderRadius: 24, padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: themeColors.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid ${themeColors.border}` }}>
              <Search size={36} color={themeColors.textMuted} />
            </div>
            <p style={{ color: themeColors.textMuted, margin: '0 0 20px', fontSize: 17, fontWeight: 600 }}>No datasets found</p>
            {(searchQuery || categoryFilter) && (
              <button onClick={() => { setSearchQuery(''); setCategoryFilter(''); }} style={{ padding: '12px 24px', background: '#FF8C00', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {datasets.map(d => (
              <DatasetCard
                key={d.id}
                dataset={d}
                themeColors={themeColors}
                onView={() => handleViewDataset(d)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid ${themeColors.border}`, background: themeColors.hoverBg, color: themeColors.text, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${p === page ? '#FF8C00' : themeColors.border}`, background: p === page ? '#FF8C00' : themeColors.hoverBg, color: p === page ? '#fff' : themeColors.text, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid ${themeColors.border}`, background: themeColors.hoverBg, color: themeColors.text, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: page === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Dataset Detail Modal */}
      {selected && (
        <DatasetModal
          dataset={selected}
          themeColors={themeColors}
          onClose={() => setSelected(null)}
        />
      )}
    </DashboardLayout>
  );
}

function DatasetCard({ dataset: d, themeColors, onView }) {
  const tags = Array.isArray(d.tags) ? d.tags.slice(0, 3) : [];

  return (
    <div
      style={{
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = themeColors.isDarkMode ? '0 12px 30px rgba(0,0,0,0.4)' : '0 12px 30px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Color header */}
      <div style={{ height: 8, background: 'linear-gradient(90deg, #FF8C00, #20B2AA)' }} />

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 800, color: themeColors.text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {d.title}
        </h3>

        {/* Summary */}
        {(d.summary || d.description) && (
          <p style={{ fontSize: 13, color: themeColors.textMuted, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {d.summary || d.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(d.country || d.region) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: themeColors.textMuted }}>
              <MapPin size={13} />
              <span>{[d.country, d.region].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {(d.category?.name || d.category) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: themeColors.textMuted }}>
              <Tag size={13} />
              <span>{d.category?.name || d.category}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: themeColors.isDarkMode ? 'rgba(255,140,0,0.15)' : 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.2)' }}>
                {typeof tag === 'string' ? tag : tag.name || tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${themeColors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: themeColors.textMuted }}>
            <Eye size={13} />
            <span>{(d.total_views || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: themeColors.textMuted }}>
            <Download size={13} />
            <span>{(d.total_downloads || 0).toLocaleString()}</span>
          </div>
          {d.created_at && (
            <span style={{ fontSize: 11, color: themeColors.textMuted, marginLeft: 'auto' }}>
              {new Date(d.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          onClick={onView}
          style={{ width: '100%', padding: '10px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a9a98'}
          onMouseLeave={e => e.currentTarget.style.background = '#20B2AA'}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function DatasetModal({ dataset: d, themeColors, onClose }) {
  const [fullData, setFullData] = useState(d);
  const [categoryName, setCategoryName] = useState(
    // seed from list item if already resolved
    d.category?.name || (typeof d.category === 'string' ? d.category : null)
  );
  const [loadingFull, setLoadingFull] = useState(true);

  useEffect(() => {
    setLoadingFull(true);

    publicDatasetService.get(d.id)
      .then(res => {
        // Exhaustively unwrap: axios wraps in res.data, backend may wrap in { data: {...} } or { message, data: {...} }
        let raw = res?.data ?? res;
        // If it has a 'data' key that is a plain object (not array), drill in
        if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
          raw = raw.data;
        }
        // Some backends double-wrap: { data: { data: { ...fields } } }
        if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
          raw = raw.data;
        }
        if (raw && raw.id) {
          setFullData(raw);

          // Resolve category name from the detail response
          const catRaw = raw.category;
          if (catRaw?.name) {
            setCategoryName(catRaw.name);
          } else if (typeof catRaw === 'string' && catRaw) {
            setCategoryName(catRaw);
          } else {
            // category_id only — fetch the category name
            const catId = raw.category_id ?? d.category_id;
            if (catId) {
              import('../../../utils/apiService').then(({ categoryService }) => {
                categoryService.get(catId)
                  .then(cr => {
                    const cn = cr?.data?.data?.name || cr?.data?.name || cr?.data?.data?.title || cr?.data?.title;
                    if (cn) setCategoryName(cn);
                  })
                  .catch(() => {});
              });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFull(false));
  }, [d.id]);

  // Helper: pick first non-null/empty value across sources
  const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== '') ?? null;

  const title       = pick(fullData.title, d.title) || '—';
  const description = pick(fullData.description, fullData.summary, d.description, d.summary);
  const country     = pick(fullData.country, fullData.country_name, d.country, d.country_name);
  const countryCode = pick(fullData.country_code, d.country_code);
  const region      = pick(fullData.region, d.region);
  const visibility  = pick(fullData.visibility, d.visibility);
  const createdAt   = pick(fullData.created_at, d.created_at);
  const updatedAt   = pick(fullData.updated_at, d.updated_at);
  const slug        = pick(fullData.slug, d.slug);
  const isFeatured  = fullData.is_featured ?? d.is_featured ?? false;

  const totalViews     = fullData.total_views     ?? d.total_views     ?? 0;
  const totalDownloads = fullData.total_downloads ?? d.total_downloads ?? 0;
  const totalSales     = fullData.total_sales     ?? d.total_sales     ?? 0;

  // Owner — detail endpoint may return nested owner object
  const owner     = fullData.owner ?? fullData.seller ?? fullData.owner_user ?? d.owner ?? d.seller;
  const ownerName = pick(owner?.full_name, owner?.name, owner?.email);
  const ownerUserId = fullData.owner_user_id ?? d.owner_user_id;

  // Organization
  const org    = fullData.organization ?? d.organization;
  const orgName = pick(org?.name, org?.title);

  // Tags — may be array of strings or array of {name} objects
  const rawTags = fullData.tags ?? d.tags ?? [];
  const tags = Array.isArray(rawTags) ? rawTags : [];

  // Versions / pricing / metadata
  const versions      = Array.isArray(fullData.versions) ? fullData.versions : [];
  const pricing       = Array.isArray(fullData.pricing)  ? fullData.pricing  : [];
  const metadata      = fullData.metadata ?? null;
  const latestVersion = versions[0] ?? null;
  const activePricing = pricing.find(p => p.is_active) ?? pricing[0] ?? null;

  const locationStr = [country, region].filter(Boolean).join(', ');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: themeColors.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 680, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: `1px solid ${themeColors.border}`, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Loading overlay */}
        {loadingFull && (
          <div style={{ position: 'absolute', top: 16, right: 60, fontSize: 12, color: themeColors.textMuted, fontWeight: 600 }}>Loading full details...</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h3 style={{ color: themeColors.text, margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {locationStr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: themeColors.textMuted }}>
                  <MapPin size={14} />
                  <span>{locationStr}{countryCode ? ` (${countryCode})` : ''}</span>
                </div>
              )}
              {categoryName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: themeColors.textMuted }}>
                  <Tag size={14} />
                  <span>{categoryName}</span>
                </div>
              )}
              {visibility && (
                <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: visibility === 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: visibility === 'public' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                  {visibility}
                </span>
              )}
              {isFeatured && (
                <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'rgba(255,140,0,0.15)', color: '#FF8C00' }}>⭐ Featured</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, color: themeColors.textMuted, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        {description && (
          <div style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Description</p>
            <p style={{ color: themeColors.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{description}</p>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Views', value: Number(totalViews).toLocaleString(), color: '#20B2AA', icon: <Eye size={18} /> },
            { label: 'Downloads', value: Number(totalDownloads).toLocaleString(), color: '#FF8C00', icon: <Download size={18} /> },
            { label: 'Total Sales', value: Number(totalSales).toLocaleString(), color: '#8b5cf6', icon: <Tag size={18} /> },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: themeColors.hoverBg, borderRadius: 12, border: `1px solid ${themeColors.border}`, textAlign: 'center' }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: themeColors.textMuted, margin: '4px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            ['Category', categoryName || '—'],
            ['Visibility', visibility || '—'],
            ['Country', country || (countryCode ? `(${countryCode})` : '—')],
            ['Region', region || '—'],
            ['Owner', ownerName || (ownerUserId ? `User #${ownerUserId}` : '—')],
            ['Organization', orgName || '—'],
            ['Slug', slug || '—'],
            ['Published', createdAt ? new Date(createdAt).toLocaleDateString() : '—'],
            ['Last Updated', updatedAt ? new Date(updatedAt).toLocaleDateString() : '—'],
            ['Featured', isFeatured ? 'Yes' : 'No'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '12px 14px', background: themeColors.hoverBg, borderRadius: 10, border: `1px solid ${themeColors.border}` }}>
              <p style={{ fontSize: 10, color: themeColors.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: themeColors.text, margin: '3px 0 0', wordBreak: 'break-word' }}>{String(v)}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        {activePricing && (
          <div style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: '#FF8C00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Pricing</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#FF8C00' }}>
                {activePricing.currency || 'USD'} {Number(activePricing.price || activePricing.amount || 0).toLocaleString()}
              </span>
              {activePricing.pricing_type && (
                <span style={{ fontSize: 13, color: themeColors.textMuted, alignSelf: 'center', textTransform: 'capitalize' }}>{activePricing.pricing_type}</span>
              )}
            </div>
          </div>
        )}

        {/* Latest Version */}
        {latestVersion && (
          <div style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Latest Version</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {latestVersion.version_number && <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.text }}>v{latestVersion.version_number}</span>}
              {latestVersion.status && <span style={{ fontSize: 12, fontWeight: 600, color: themeColors.textMuted, textTransform: 'capitalize' }}>{latestVersion.status}</span>}
              {latestVersion.file_size && <span style={{ fontSize: 12, color: themeColors.textMuted }}>{latestVersion.file_size}</span>}
              {latestVersion.file_format && <span style={{ fontSize: 12, color: themeColors.textMuted }}>{latestVersion.file_format}</span>}
            </div>
          </div>
        )}

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div style={{ background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Metadata</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {Object.entries(metadata).slice(0, 8).map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: 11, color: themeColors.textMuted, fontWeight: 700, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>
                  <span style={{ fontSize: 12, color: themeColors.text, fontWeight: 600 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: themeColors.isDarkMode ? 'rgba(255,140,0,0.15)' : 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.25)' }}>
                  {typeof tag === 'string' ? tag : tag.name || String(tag)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: `1px solid ${themeColors.border}` }}>
          <button onClick={onClose} style={{ padding: '11px 24px', background: themeColors.hoverBg, border: `1px solid ${themeColors.border}`, borderRadius: 12, color: themeColors.textMuted, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Close
          </button>
          <button style={{ padding: '11px 24px', background: '#20B2AA', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Request Access
          </button>
        </div>
      </div>
    </div>
  );
}

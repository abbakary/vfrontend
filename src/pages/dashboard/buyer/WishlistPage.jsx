import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import DatasetCard from '../lib/DatasetCard';
import { Search, Heart, ShoppingCart, X } from 'lucide-react';
import { publicDatasetService } from '../../../utils/apiService';
import { getCurrentUserId, readWishlistIdsForUser, writeWishlistIdsForUser } from '../../../utils/session';

const Input = ({ style, ...p }) => <input style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', color: '#1a202c', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', ...style }} {...p} />;

export default function WishlistPage() {
  const [wishlistUserId, setWishlistUserId] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToRemove, setItemToRemove] = useState(null);
  const [toast, setToast] = useState('');
  const [allDatasets, setAllDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const userId = await getCurrentUserId();
        setWishlistUserId(userId);
        setWishlistIds(readWishlistIdsForUser(userId));
        const { data } = await publicDatasetService.list({ limit: 200 });
        const datasetsArray = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAllDatasets(datasetsArray);
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
        setAllDatasets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const wishlistDatasets = allDatasets.filter((d) => wishlistIds.includes(String(d.id)));
  const filtered = wishlistDatasets.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalValue = wishlistDatasets.reduce((s, d) => s + parseFloat(d.price || 0), 0);

  const handleRemove = async () => {
    if (!itemToRemove) return;
    try {
      const userId = wishlistUserId ?? (await getCurrentUserId());
      setWishlistIds((prev) => {
        const next = prev.filter((id) => String(id) !== String(itemToRemove));
        writeWishlistIdsForUser(userId, next);
        return next;
      });
      showToast('Removed from wishlist');
    } catch {
      showToast('Could not update wishlist');
    }
    setItemToRemove(null);
  };

  return (
    <DashboardLayout role="buyer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>My Wishlist</h2>
            <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 16, fontWeight: 500 }}>Datasets you are interested in purchasing later</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14, background: '#fff', padding: '10px 20px', borderRadius: 12, border: '1px solid #edf2f7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e53e3e', fontWeight: 700 }}>
              <Heart size={18} fill="#e53e3e" />
              <span>{wishlistIds.length} items</span>
            </div>
            <div style={{ width: 1, height: 16, background: '#edf2f7' }} />
            <div style={{ fontWeight: 700, color: '#718096' }}>
              Total Value: <span style={{ color: '#20B2AA' }}>${totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
          <Input placeholder="Search saved datasets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', paddingLeft: 44, boxSizing: 'border-box' }} />
        </div>

        {/* Dataset Cards using DatasetCard */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading datasets...</div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {filtered.map(d => (
              <div key={d.id} style={{ position: 'relative' }}>
                <DatasetCard dataset={d}
                  onAction={() => showToast(`Added ${d.title} to your cart`)}
                  actionLabel="Buy Now"
                  actionStyle={{ background: '#20B2AA', color: '#fff' }}
                />
                <button onClick={() => setItemToRemove(d.id)}
                  style={{ position: 'absolute', top: 12, left: 12, padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#e53e3e', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <X size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '80px 0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #edf2f7' }}>
              <Heart size={40} color="#cbd5e0" />
            </div>
            <p style={{ color: '#718096', margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>Your wishlist is looking a bit empty</p>
            <a href="/dashboard/buyer/recommendations" style={{ padding: '14px 28px', background: '#FF8C00', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 10px rgba(255,140,0,0.3)', transition: 'all 0.2s', display: 'inline-block' }}>Browse Recommended Datasets</a>
          </div>
        )}
      </div>

      {/* Remove Confirm */}
      {itemToRemove && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 24px', color: '#e53e3e' }}>
              <Heart size={32} />
            </div>
            <h3 style={{ color: '#1a202c', margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Remove from Wishlist?</h3>
            <p style={{ color: '#718096', margin: '0 0 32px', fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>Are you sure you want to remove this dataset? You can always find it again in the recommendations page.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setItemToRemove(null)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#4a5568', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>Keep it</button>
              <button onClick={handleRemove} style={{ padding: '12px 24px', background: '#e53e3e', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 800, boxShadow: '0 4px 10px rgba(229,62,62,0.3)' }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1a202c', color: '#fff', borderRadius: 12, padding: '16px 24px', fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>{toast}</div>}
    </DashboardLayout>
  );
}

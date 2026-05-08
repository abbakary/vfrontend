import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import DatasetCard from '../lib/DatasetCard';
import { Heart, ShoppingCart, Sparkles, X } from 'lucide-react';
import { publicDatasetService } from '../../../utils/apiService';
import { getCurrentUserId, readWishlistIdsForUser, writeWishlistIdsForUser } from '../../../utils/session';

const categories = ['All', 'Computer Science', 'Finance and Investment', 'Social Services', 'Agriculture and Environment', 'ICT and Digital Economy', 'Natural Resources and Energy'];

export default function RecommendationsPage() {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [allDatasets, setAllDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const userId = await getCurrentUserId();
        setWishlist(readWishlistIdsForUser(userId));
        const { data } = await publicDatasetService.list({ limit: 100 });
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

  const approved = allDatasets.filter(d => d.status === 'approved' || d.visibility === 'public' || d.visibility == null);
  const filtered = selectedCategory === 'All' ? approved : approved.filter(d => d.category?.name === selectedCategory || d.category === selectedCategory);

  const toggleWishlist = async (id) => {
    const sid = String(id);
    try {
      const userId = await getCurrentUserId();
      setWishlist((prev) => {
        const wasIn = prev.includes(sid);
        const next = wasIn ? prev.filter((i) => i !== sid) : [...prev, sid];
        writeWishlistIdsForUser(userId, next);
        setTimeout(() => showToast(wasIn ? 'Removed from wishlist' : 'Added to wishlist'), 0);
        return next;
      });
    } catch {
      showToast('Sign in to use wishlist');
    }
  };
  const addToCart = id => { if (!cart.includes(id)) { setCart(prev => [...prev, id]); showToast('Added to cart'); } else showToast('Already in cart'); };

  return (
    <DashboardLayout role="buyer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.02em' }}>Recommendations</h2>
            <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 16, fontWeight: 500 }}>Datasets curated based on your interests</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ padding: '10px 18px', background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#1a202c', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <Heart size={16} color="#e53e3e" fill="#e53e3e" /> {wishlist.length} Saved
            </div>
            <div style={{ padding: '10px 18px', background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#20B2AA', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <ShoppingCart size={16} /> {cart.length} in Cart
            </div>
          </div>
        </div>

        {/* Featured Banner */}
        <div style={{ borderRadius: 24, background: '#fff', border: '1px solid #e2e8f0', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: 16, borderRadius: 16, background: '#FF8C0015', color: '#FF8C00' }}>
            <Sparkles size={32} />
          </div>
          <div>
            <p style={{ color: '#1a202c', fontWeight: 800, margin: 0, fontSize: 18 }}>Personalized for You</p>
            <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 15, fontWeight: 500 }}>Based on your patterns, we found <strong style={{ color: '#20B2AA' }}>{filtered.length} datasets</strong> you might love.</p>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: selectedCategory === cat ? '#20B2AA' : '#fff', borderColor: selectedCategory === cat ? '#20B2AA' : '#e2e8f0', color: selectedCategory === cat ? '#fff' : '#718096', transition: 'all 0.2s', boxShadow: selectedCategory === cat ? '0 4px 6px rgba(32,178,170,0.2)' : 'none' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Dataset Cards using DatasetCard */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading recommendations...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontSize: 16, fontWeight: 600 }}>No datasets found for this category.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {filtered.map(d => (
              <div key={d.id} style={{ position: 'relative' }}>
                <DatasetCard dataset={d}
                  onAction={() => setSelected(d)}
                  actionLabel="View Details"
                  actionStyle={{ background: '#20B2AA', color: '#fff' }}
                />
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleWishlist(d.id)} style={{ padding: '8px', background: wishlist.includes(d.id) ? '#e53e3e' : '#fff', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                    <Heart size={14} color={wishlist.includes(d.id) ? '#fff' : '#e53e3e'} fill={wishlist.includes(d.id) ? '#fff' : 'none'} />
                  </button>
                  <button onClick={() => addToCart(d.id)} style={{ padding: '8px', background: cart.includes(d.id) ? '#20B2AA' : '#fff', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                    <ShoppingCart size={14} color={cart.includes(d.id) ? '#fff' : '#20B2AA'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: 28, padding: 32, width: '100%', maxWidth: 580, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ color: '#1a202c', margin: 0, fontSize: 24, fontWeight: 800 }}>{selected.title}</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
              </div>
              <p style={{ color: '#4a5568', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6, fontWeight: 500 }}>{selected.description || selected.summary || 'No description available.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
                {[
                  ['Category', selected.category?.name || selected.category || '—'],
                  ['Country', selected.country || '—'],
                  ['Region', selected.region || '—'],
                  ['Visibility', selected.visibility || '—'],
                  ['Views', (selected.total_views || 0).toLocaleString()],
                  ['Downloads', (selected.total_downloads || 0).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                    <p style={{ fontSize: 10, color: '#a0aec0', margin: '0 0 4px', fontWeight: 800, textTransform: 'uppercase' }}>{k}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a202c', margin: 0 }}>{String(v)}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 24, borderTop: '1px solid #edf2f7' }}>
                <button onClick={() => toggleWishlist(selected.id)} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, color: '#e53e3e', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={16} fill={wishlist.includes(selected.id) ? '#e53e3e' : 'none'} /> {wishlist.includes(selected.id) ? 'Saved' : 'Save'}
                </button>
                <button onClick={() => { addToCart(selected.id); setSelected(null); }} style={{ padding: '12px 24px', background: '#FF8C00', border: 'none', borderRadius: 14, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(255,140,0,0.3)' }}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1a202c', color: '#fff', borderRadius: 12, padding: '16px 24px', fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {toast}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

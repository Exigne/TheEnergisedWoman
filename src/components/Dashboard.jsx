import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageCircle, User, LogOut, Search, X, ThumbsUp, 
  MessageSquare, Send, Trash2, Shield, ChevronLeft, Flag, 
  Loader2, Sparkles, Upload, FileText, Music, Crown, Zap,
  ExternalLink, Filter, Plus
} from 'lucide-react';

// --- Constants ---
const CATEGORIES = ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

// --- Sub-Components (Internal for Cleanliness) ---
const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
    borderRadius: '10px', cursor: 'pointer', border: 'none', transition: 'all 0.2s'
  };
  
  const variants = {
    primary: { background: '#ec4899', color: 'white' },
    secondary: { background: '#fce7f3', color: '#be185d' },
    outline: { background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b' },
    ghost: { background: 'transparent', color: '#64748b', padding: '4px' }
  };
  
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '15px' },
    icon: { padding: '8px', borderRadius: '8px' }
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant], ...sizes[size] }} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, style, ...props }) => (
  <div style={{ 
    background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
    padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', ...style 
  }} {...props}>
    {children}
  </div>
);

// --- Main Dashboard Component ---
const Dashboard = () => {
  // Global States
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState({ auth: false, discussions: false, resources: false });
  const [toast, setToast] = useState(null);

  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [resources, setResources] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('community'); // 'community' or 'resources'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modals, setModals] = useState({ post: false, resource: false, profile: false, delete: null, detail: null });
  
  // Form States
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [commentText, setCommentText] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- API Handlers ---
  const api = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/.netlify/functions/database${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!response.ok) throw new Error('Request failed');
      return await response.json();
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email.includes('admin'));
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    setLoading(prev => ({ ...prev, discussions: true }));
    const discData = await api('?type=discussions');
    const resData = await api('?type=resources');
    if (discData) setDiscussions(discData);
    if (resData) setResources(resData);
    setLoading(prev => ({ ...prev, discussions: false }));
  };

  // --- Actions ---
  const handleLike = async (post) => {
    if (!user) return;
    const hasLiked = post.liked_by?.includes(user.email);
    const updatedPost = {
      ...post,
      likes: hasLiked ? post.likes - 1 : (post.likes || 0) + 1,
      liked_by: hasLiked ? post.liked_by.filter(e => e !== user.email) : [...(post.liked_by || []), user.email]
    };

    setDiscussions(prev => prev.map(p => p.id === post.id ? updatedPost : p));
    if (modals.detail?.id === post.id) setModals(m => ({ ...m, detail: updatedPost }));
    
    await api(`?id=${post.id}&type=discussion`, {
      method: 'PUT',
      body: JSON.stringify({ likes: updatedPost.likes, likedBy: updatedPost.liked_by })
    });
  };

  const filteredDiscussions = useMemo(() => {
    return discussions.filter(post => 
      (selectedCategory === 'All' || post.category === selectedCategory) &&
      (post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [discussions, selectedCategory, searchQuery]);

  // --- Auth View ---
  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.authLogo}>
            <Zap size={40} color="#ec4899" fill="#ec4899" />
            <h1 style={styles.authTitle}>The Energised Woman</h1>
            <p>Empowering your wellness journey</p>
          </div>
          <input style={styles.input} placeholder="Email" />
          <input style={styles.input} type="password" placeholder="Password" />
          <Button style={{ width: '100%' }} onClick={() => {
            const mockUser = { email: 'hello@user.com', display_name: 'Friend' };
            setUser(mockUser);
            localStorage.setItem('wellnessUser', JSON.stringify(mockUser));
          }}>Enter Community</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Zap size={28} color="#ec4899" fill="#ec4899" />
          <span style={styles.brandText}>Energised</span>
        </div>
        
        <nav style={styles.navLinks}>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'community' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('community')}
          >
            Community
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'resources' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
        </nav>

        <div style={styles.headerActions}>
          <Button variant="ghost" size="icon" onClick={() => setModals(m => ({...m, profile: true}))}>
            <User size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setUser(null); localStorage.removeItem('wellnessUser'); }}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' ? (
          <>
            <section style={styles.hero}>
              <div>
                <h1 style={styles.pageTitle}>Welcome back, {user.display_name}!</h1>
                <p style={styles.pageSubtitle}>What's on your mind today?</p>
              </div>
              <Button onClick={() => setModals(m => ({ ...m, post: true }))}>
                <Plus size={18} /> New Post
              </Button>
            </section>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <div style={styles.searchWrapper}>
                <Search size={18} style={styles.searchIcon} />
                <input 
                  style={styles.searchInput} 
                  placeholder="Search discussions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={styles.categoryScroll}>
                {['All', ...CATEGORIES].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ ...styles.pill, ...(selectedCategory === cat ? styles.pillActive : {}) }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussion List */}
            <div style={styles.grid}>
              {loading.discussions ? (
                [1,2,3].map(i => <div key={i} style={styles.skeleton} />)
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(post => (
                  <Card key={post.id} style={styles.postCard} onClick={() => setModals(m => ({...m, detail: post}))}>
                    <div style={styles.cardHeader}>
                      <span style={styles.tag}>{post.category}</span>
                      <span style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 style={styles.cardTitle}>{post.title}</h3>
                    <p style={styles.cardExcerpt}>{post.content.substring(0, 120)}...</p>
                    <div style={styles.cardFooter}>
                      <div style={styles.author}>
                        <div style={styles.avatar}>{post.author?.[0]}</div>
                        <span>{post.author}</span>
                      </div>
                      <div style={styles.stats}>
                        <span onClick={(e) => { e.stopPropagation(); handleLike(post); }} style={styles.statItem}>
                          <ThumbsUp size={14} fill={post.liked_by?.includes(user.email) ? "#ec4899" : "none"} />
                          {post.likes || 0}
                        </span>
                        <span style={styles.statItem}><MessageSquare size={14} /> {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <Sparkles size={48} color="#e2e8f0" />
                  <p>No discussions found in this category.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.resourceGrid}>
            <div style={styles.resourceHero}>
              <h2>Resource Library</h2>
              <p>Hand-picked tools for your growth.</p>
              {isAdmin && <Button variant="secondary" onClick={() => setModals(m => ({...m, resource: true}))}>Upload Resource</Button>}
            </div>
            {resources.map(res => (
              <Card key={res.id} style={styles.resCard}>
                <div style={styles.resIcon}><FileText size={24} color="#ec4899" /></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0' }}>{res.title}</h4>
                  <p style={styles.resDesc}>{res.description}</p>
                </div>
                <a href={res.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink size={14} /> View</Button>
                </a>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal Component */}
      {modals.detail && (
        <div style={styles.modalOverlay} onClick={() => setModals(m => ({...m, detail: null}))}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
             <div style={styles.modalHeader}>
                <Button variant="ghost" size="icon" onClick={() => setModals(m => ({...m, detail: null}))}>
                  <X size={20} />
                </Button>
                <span style={styles.tag}>{modals.detail.category}</span>
             </div>
             <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>{modals.detail.title}</h2>
             <div style={{ color: '#475569', lineHeight: '1.6', marginBottom: '32px' }}>
                {modals.detail.content}
             </div>
             <div style={styles.commentSection}>
                <h4>Comments</h4>
                <div style={styles.inputGroup}>
                  <input style={styles.input} placeholder="Write a supportive comment..." />
                  <Button size="sm"><Send size={16} /></Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// --- Enhanced Styles Object ---
const styles = {
  container: { minHeight: '100vh', background: '#fdfcfd', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { 
    position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '70px' 
  },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '20px', fontWeight: '800', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navLinks: { display: 'flex', gap: '8px' },
  tab: { padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '500', color: '#64748b' },
  tabActive: { background: '#fce7f3', color: '#be185d' },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', margin: 0, color: '#1e293b' },
  pageSubtitle: { margin: '4px 0 0 0', color: '#64748b' },
  filterBar: { marginBottom: '32px' },
  searchWrapper: { position: 'relative', marginBottom: '16px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px' },
  categoryScroll: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' },
  pill: { whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  pillActive: { background: '#1e293b', color: 'white', borderColor: '#1e293b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  postCard: { cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  tag: { padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569' },
  cardTitle: { fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#1e293b' },
  cardExcerpt: { fontSize: '14px', color: '#64748b', lineHeight: '1.5' },
  cardFooter: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  author: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' },
  avatar: { width: '24px', height: '24px', borderRadius: '50%', background: '#ec4899', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' },
  stats: { display: 'flex', gap: '12px', color: '#94a3b8' },
  statItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px', color: 'white', borderRadius: '12px', fontWeight: '600', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000 },
  authContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfcfd' },
  authCard: { background: 'white', padding: '48px', borderRadius: '24px', width: '400px', textAlign: 'center', border: '1px solid #f1f5f9' },
  authLogo: { marginBottom: '32px' },
  authTitle: { fontSize: '24px', fontWeight: '800', marginTop: '16px', marginBottom: '4px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', boxSizing: 'border-box' },
  emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#94a3b8' },
  resourceGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  resCard: { display: 'flex', gap: '20px', alignItems: 'center' },
  resDesc: { fontSize: '14px', color: '#64748b', margin: 0 }
};

export default Dashboard;

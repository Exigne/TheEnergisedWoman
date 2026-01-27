import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageCircle, User, LogOut, Search, X, ThumbsUp, 
  MessageSquare, Send, Trash2, Shield, ChevronLeft, Flag, 
  Loader2, Sparkles, Upload, FileText, Music, Crown, Zap,
  ExternalLink, Play, Pause, Volume2, Plus
} from 'lucide-react';

// --- Constants ---
const CATEGORIES = ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

// --- Dashboard Component ---
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({ auth: false, data: false });

  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [resources, setResources] = useState([]);
  const [audios, setAudios] = useState([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(null); // 'post', 'audio', 'resource', 'detail'
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Form States
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [commentText, setCommentText] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
    setLoading(prev => ({ ...prev, data: true }));
    try {
      const [dRes, rRes, aRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=resources'),
        fetch('/.netlify/functions/database?type=audio')
      ]);
      
      if (dRes.ok) setDiscussions(await dRes.json());
      if (rRes.ok) setResources(await rRes.json());
      if (aRes.ok) setAudios(await aRes.json());
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  // --- Handlers ---
  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) return;

    const postData = {
      ...postForm,
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      created_at: new Date().toISOString(),
      likes: 0,
      liked_by: [],
      comments: []
    };

    try {
      const response = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      if (response.ok) {
        const savedPost = await response.json();
        setDiscussions([savedPost, ...discussions]);
        setShowModal(null);
        setPostForm({ title: '', content: '', category: 'General' });
        showToast('Shared with the community!');
      }
    } catch (err) { showToast('Post failed', 'error'); }
  };

  const handleAudioUpload = async () => {
    // Admin function to save audio link to DB
    try {
      const response = await fetch('/.netlify/functions/database?type=audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...audioForm, created_at: new Date().toISOString() })
      });
      if (response.ok) {
        const savedAudio = await response.json();
        setAudios([savedAudio, ...audios]);
        setShowModal(null);
        setAudioForm({ title: '', url: '', description: '' });
        showToast('Audio added!');
      }
    } catch (err) { showToast('Upload failed', 'error'); }
  };

  const handleLike = async (postId) => {
    const post = discussions.find(p => p.id === postId);
    const hasLiked = post.liked_by?.includes(user.email);
    const updatedPost = {
      ...post,
      likes: hasLiked ? post.likes - 1 : post.likes + 1,
      liked_by: hasLiked ? post.liked_by.filter(id => id !== user.email) : [...(post.liked_by || []), user.email]
    };

    setDiscussions(discussions.map(p => p.id === postId ? updatedPost : p));
    await fetch(`/.netlify/functions/database?id=${postId}&type=discussion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likes: updatedPost.likes, likedBy: updatedPost.liked_by })
    });
  };

  const filteredDiscussions = discussions.filter(post => 
    (selectedCategory === 'All' || post.category === selectedCategory) &&
    (post.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- UI Components ---
  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Zap size={48} color="#ec4899" fill="#ec4899" />
          <h1 style={{ margin: '16px 0 8px' }}>The Energised Woman</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Sign in to your dashboard</p>
          <input style={styles.input} placeholder="Email" id="login-email" />
          <input style={styles.input} type="password" placeholder="Password" id="login-pass" />
          <button style={styles.primaryButton} onClick={() => {
            const email = document.getElementById('login-email').value;
            if(!email) return alert("Enter email");
            const userData = { email, display_name: email.split('@')[0], isAdmin: email.includes('admin') };
            setUser(userData);
            setIsAdmin(userData.isAdmin);
            localStorage.setItem('wellnessUser', JSON.stringify(userData));
            loadAllData();
          }}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Crown size={24} color="#ec4899" />
          <h1 style={styles.brandText}>The Energised Woman</h1>
        </div>
        <div style={styles.nav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('audio')} style={{...styles.navBtn, ...(activeTab === 'audio' && styles.navBtnActive)}}>Audio Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Library</button>
        </div>
        <div style={styles.userSection}>
          {isAdmin && <span style={styles.adminBadge}>Admin</span>}
          <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <>
            <div style={styles.sectionHeader}>
              <h2>Community Discussions</h2>
              <button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button>
            </div>
            
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input style={styles.searchInput} placeholder="Search discussions..." onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div style={styles.grid}>
              {filteredDiscussions.map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={styles.cardMeta}><span style={styles.tag}>{post.category}</span></div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content.substring(0, 100)}...</p>
                  <div style={styles.cardFooter}>
                    <span>By {post.author}</span>
                    <div style={styles.cardStats}>
                       <button onClick={(e) => {e.stopPropagation(); handleLike(post.id)}} style={styles.statBtn}>
                        <ThumbsUp size={14} fill={post.liked_by?.includes(user.email) ? "#ec4899" : "none"} /> {post.likes}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'audio' && (
          <div style={styles.audioContainer}>
            <div style={styles.sectionHeader}>
              <h2>Audio Hub</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}
            </div>
            <p style={{color: '#64748b', marginBottom: '24px'}}>Meditations, affirmations, and podcasts to fuel your day.</p>
            
            <div style={styles.audioList}>
              {audios.map(track => (
                <div key={track.id} style={styles.audioRow}>
                  <div style={styles.audioIcon}><Music color="#ec4899" /></div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: 0}}>{track.title}</h4>
                    <p style={{margin: '4px 0', fontSize: '13px', color: '#64748b'}}>{track.description}</p>
                    <audio controls style={styles.player}>
                      <source src={track.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ))}
              {audios.length === 0 && <div style={styles.empty}>No audio tracks uploaded yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Resource Library</h2>
            </div>
            {resources.map(res => (
              <div key={res.id} style={styles.resourceCard}>
                <FileText color="#ec4899" />
                <div style={{flex: 1}}>
                  <h4 style={{margin: 0}}>{res.title}</h4>
                  <p style={{margin: 0, fontSize: '13px'}}>{res.type}</p>
                </div>
                <a href={res.url} target="_blank" rel="noreferrer" style={styles.downloadBtn}>View Resource</a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* New Post Modal */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Start a Discussion</h3>
              <button onClick={() => setShowModal(null)} style={styles.iconBtn}><X/></button>
            </div>
            <select style={styles.input} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Headline" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <textarea style={{...styles.input, height: '150px'}} placeholder="What's on your mind?" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost}>Post to Community</button>
          </div>
        </div>
      )}

      {/* New Audio Modal */}
      {showModal === 'audio' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Add New Audio</h3>
              <button onClick={() => setShowModal(null)} style={styles.iconBtn}><X/></button>
            </div>
            <p style={{fontSize: '12px', color: '#be185d', background: '#fff1f2', padding: '8px', borderRadius: '4px'}}>
              Admin: Use audio files from your <a href="https://drive.google.com/drive/folders/1DZLiRrYLWW1irLp6pqP9RuRlG9ZAcq5W?usp=drive_link" target="_blank" rel="noreferrer">Google Drive Folder</a>. Make sure they are shared as "Anyone with link".
            </p>
            <input style={styles.input} placeholder="Track Title" value={audioForm.title} onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="Direct Audio URL (.mp3)" value={audioForm.url} onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={audioForm.description} onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleAudioUpload}>Save Audio</button>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast.message}</div>}
    </div>
  );
};

// --- Styles ---
const styles = {
  container: { minHeight: '100vh', background: '#fdfaff', fontFamily: 'system-ui, sans-serif' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandText: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b' },
  nav: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' },
  navBtn: { padding: '8px 16px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  main: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer' },
  tag: { fontSize: '11px', background: '#fdf2f8', color: '#db2777', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' },
  cardTitle: { margin: '12px 0 8px', fontSize: '18px' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.4' },
  cardFooter: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfaff' },
  authCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '350px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', boxSizing: 'border-box' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', padding: '32px', borderRadius: '20px', width: '500px', maxWidth: '90%' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  audioRow: { display: 'flex', gap: '20px', background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', alignItems: 'center', border: '1px solid #f1f5f9' },
  player: { width: '100%', marginTop: '12px', height: '32px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '10px' },
  downloadBtn: { fontSize: '13px', color: '#ec4899', textDecoration: 'none', fontWeight: '600' },
  adminBadge: { background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  toast: { position: 'fixed', bottom: '20px', right: '20px', background: '#1e293b', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000 },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 },
  searchInput: { border: 'none', outline: 'none', width: '100%' },
  filterBar: { marginBottom: '24px', display: 'flex' }
};

export default Dashboard;

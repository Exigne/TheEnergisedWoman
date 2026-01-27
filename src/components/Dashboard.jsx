import React, { useState, useEffect } from 'react';
import { 
  Search, X, ThumbsUp, MessageSquare, LogOut, 
  Crown, Zap, Plus, Music, Upload, FileText, 
  Play, Pause, ExternalLink, Clock, User, ChevronRight,
  Filter, MoreHorizontal
} from 'lucide-react';

const CATEGORIES = ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  // --- Auth & Navigation State ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [showModal, setShowModal] = useState(null); // 'post', 'audio', 'detail'
  const [selectedPost, setSelectedPost] = useState(null);
  
  // --- Data States ---
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Form States ---
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });

  // --- Initialization ---
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
    setLoading(true);
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
      setLoading(false);
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
      }
    } catch (err) { alert('Failed to post'); }
  };

  const handleAudioUpload = async () => {
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
      }
    } catch (err) { alert('Upload failed'); }
  };

  // --- UI Components ---
  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Crown size={48} color="#ec4899" />
          <h1 style={{ margin: '16px 0 8px' }}>The Energised Woman</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Welcome back, beautiful.</p>
          <input style={styles.input} placeholder="Enter Email" id="login-email" />
          <button style={styles.primaryButton} onClick={() => {
            const email = document.getElementById('login-email').value;
            if(!email) return alert("Email required");
            const userData = { email, display_name: email.split('@')[0], isAdmin: email.includes('admin') };
            setUser(userData);
            setIsAdmin(userData.isAdmin);
            localStorage.setItem('wellnessUser', JSON.stringify(userData));
            loadAllData();
          }}>Enter Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Centered Nav */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Crown size={22} color="#ec4899" />
          <h1 style={styles.brandText}>The Energised Woman</h1>
        </div>

        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('audio')} style={{...styles.navBtn, ...(activeTab === 'audio' && styles.navBtnActive)}}>Audio Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Library</button>
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userBadge}>
            <User size={14} />
            <span>{user.display_name}</span>
          </div>
          <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* --- COMMUNITY TAB --- */}
        {activeTab === 'community' && (
          <>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={{margin: 0, fontSize: '24px'}}>Community Feed</h2>
                <p style={{color: '#64748b', margin: '4px 0 0'}}>Insights and connection from the sisterhood.</p>
              </div>
              <button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button>
            </div>

            <div style={styles.grid}>
              {discussions.map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <span style={styles.tag}>{post.category}</span>
                    <Clock size={14} color="#94a3b8" />
                  </div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content.substring(0, 120)}...</p>
                  <div style={styles.cardFooter}>
                    <span style={styles.author}><User size={12}/> {post.author}</span>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <span style={styles.stat}><ThumbsUp size={12}/> {post.likes || 0}</span>
                      <span style={styles.stat}><MessageSquare size={12}/> {post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- AUDIO HUB TAB --- */}
        {activeTab === 'audio' && (
          <div style={styles.audioWrapper}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={{margin: 0, fontSize: '24px'}}>Audio Hub</h2>
                <p style={{color: '#64748b', margin: '4px 0 0'}}>Guided meditations and empowerment talks.</p>
              </div>
              {isAdmin && (
                <button style={styles.primaryButton} onClick={() => setShowModal('audio')}>
                  <Upload size={18}/> Add Audio
                </button>
              )}
            </div>
            
            <div style={styles.audioList}>
              {audios.length > 0 ? audios.map(audio => (
                <div key={audio.id} style={styles.audioCard}>
                  <div style={styles.audioIcon}><Music size={24} color="#ec4899" /></div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: 0, fontSize: '18px'}}>{audio.title}</h4>
                    <p style={{margin: '4px 0 12px', fontSize: '14px', color: '#64748b'}}>{audio.description}</p>
                    <audio controls style={styles.player}>
                      <source src={audio.url} type="audio/mpeg" />
                    </audio>
                  </div>
                </div>
              )) : (
                <div style={styles.emptyState}>No audio tracks yet. Check back soon!</div>
              )}
            </div>
          </div>
        )}

        {/* --- LIBRARY TAB --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={{margin: 0, fontSize: '24px'}}>Resource Library</h2>
                <p style={{color: '#64748b', margin: '4px 0 0'}}>PDFs, guides, and workbooks for your journey.</p>
              </div>
            </div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <div style={styles.resIcon}><FileText size={24} color="#ec4899" /></div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: 0}}>{res.title}</h4>
                    <p style={{margin: '2px 0', fontSize: '12px', color: '#64748b'}}>{res.type || 'PDF Document'}</p>
                  </div>
                  <a href={res.url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: POST DETAIL (POP-OUT) --- */}
      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <div style={styles.popOutHeader}>
              <span style={styles.tag}>{selectedPost.category}</span>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X/></button>
            </div>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutMeta}>
               <User size={16} /> <strong>{selectedPost.author}</strong> • <Clock size={16}/> {new Date(selectedPost.created_at).toLocaleDateString()}
            </div>
            <div style={styles.popOutBody}>
              {selectedPost.content}
            </div>
            <div style={styles.popOutActions}>
              <button style={styles.actionBtn}><ThumbsUp size={18}/> {selectedPost.likes} Likes</button>
              <button style={styles.actionBtn}><MessageSquare size={18}/> Comments ({selectedPost.comments?.length || 0})</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW POST --- */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Share with the community</h3>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X/></button>
            </div>
            <input style={styles.input} placeholder="Headline" onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea style={{...styles.input, height: '150px'}} placeholder="What's on your mind?" onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost}>Post to Community</button>
          </div>
        </div>
      )}

      {/* --- MODAL: ADMIN AUDIO UPLOAD --- */}
      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Add New Audio</h3>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X/></button>
            </div>
            <div style={styles.driveHint}>
              <strong>Admin Tip:</strong> Grab the link from your <a href="https://drive.google.com/drive/folders/1DZLiRrYLWW1irLp6pqP9RuRlG9ZAcq5W?usp=drive_link" target="_blank" rel="noreferrer" style={{color: '#ec4899', fontWeight: 'bold'}}>Google Drive Folder</a>. Use a direct link for the player to work.
            </div>
            <input style={styles.input} placeholder="Audio Title" onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="Direct MP3 URL" onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Short Description" onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleAudioUpload}>Save Audio</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { background: 'white', padding: '0 40px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px', width: '280px' },
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '14px' },
  navBtn: { padding: '10px 24px', border: 'none', background: 'transparent', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  userSection: { width: '280px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#64748b', border: '1px solid #e2e8f0' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  card: { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.2s' },
  cardTitle: { margin: '16px 0 8px', fontSize: '20px', color: '#1e293b', lineHeight: '1.3' },
  cardExcerpt: { color: '#64748b', fontSize: '15px', lineHeight: '1.6' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' },
  cardFooter: { marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' },
  popOutContent: { background: 'white', width: '100%', maxWidth: '750px', borderRadius: '32px', padding: '48px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' },
  popOutTitle: { fontSize: '32px', margin: '20px 0', color: '#1e293b', fontWeight: '800' },
  popOutMeta: { display: 'flex', alignItems: 'center', gap: '15px', color: '#64748b', marginBottom: '32px', fontSize: '14px' },
  popOutBody: { fontSize: '18px', lineHeight: '1.8', color: '#334155', maxHeight: '400px', overflowY: 'auto' },
  popOutActions: { display: 'flex', gap: '24px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' },
  actionBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  audioCard: { display: 'flex', gap: '24px', background: 'white', padding: '24px', borderRadius: '24px', marginBottom: '16px', border: '1px solid #e2e8f0', alignItems: 'center' },
  player: { width: '100%', height: '36px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  viewBtn: { padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#ec4899', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' },
  driveHint: { background: '#fdf2f8', padding: '15px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px', border: '1px solid #fce7f3' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '15px' },
  modal: { background: 'white', padding: '32px', borderRadius: '28px', width: '550px' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfaff' },
  authCard: { background: 'white', padding: '48px', borderRadius: '32px', width: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }
};

export default Dashboard;

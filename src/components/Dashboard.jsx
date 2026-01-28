import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, PlayCircle, BookOpen, Utensils, LayoutGrid 
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [dRes, vRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=video')
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (vRes.ok) setVideos(await vRes.json());
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const type = isRegistering ? 'register' : 'login';
    const res = await fetch(`/.netlify/functions/database?type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('wellnessUser', JSON.stringify(data));
      setUser(data);
      setIsAdmin(data.isAdmin);
      loadAllData();
    } else alert(data.message);
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) return alert("Please fill in all fields");
    
    try {
      const res = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          author: user.firstName ? `${user.firstName} ${user.lastName}` : (user.displayName || user.email.split('@')[0])
        })
      });

      if (res.ok) {
        setPostForm({ title: '', content: '', category: 'General' });
        setShowModal(null);
        await loadAllData(); // Refresh feed after success
      }
    } catch (err) { alert("Failed to post"); }
  };

  const getVideoEmbedUrl = (url) => {
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}><Crown size={40} color="#ec4899" /><h2>{isRegistering ? 'Join Us' : 'Welcome Back'}</h2></div>
          <input style={styles.input} placeholder="Email" onChange={e => setLoginEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} />
          <button style={styles.primaryButtonFull} onClick={handleAuth}>{isRegistering ? 'Register' : 'Login'}</button>
          <button style={styles.ghostButtonFull} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown color="#ec4899" /> <span>The Collective</span></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={activeTab === 'community' ? styles.navBtnActive : styles.navBtn}>Community</button>
          <button onClick={() => setActiveTab('video')} style={activeTab === 'video' ? styles.navBtnActive : styles.navBtn}>Video Hub</button>
        </nav>
        <div onClick={() => setShowModal('profile')} style={styles.avatarMini}>
          {user.profilePic ? <img src={user.profilePic} style={styles.avatarImg} alt="P" /> : <User size={16} />}
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={activeGroup === g ? styles.sidebarBtnActive : styles.sidebarBtn}>
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card}>
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span></div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content}</p>
                  <div style={styles.cardMeta}><span><User size={12}/> {post.author}</span></div>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'video' && (
          <div style={styles.videoGrid}>
            {videos.map(v => (
              <div key={v.id} style={styles.videoCard}>
                <div style={styles.videoFrameWrapper}><iframe src={getVideoEmbedUrl(v.url)} style={styles.videoIframe} frameBorder="0" allowFullScreen></iframe></div>
                <div style={{padding: '15px'}}><h4>{v.title}</h4><p>{v.description}</p></div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>New Discussion</h3>
            <input style={styles.input} placeholder="Title" onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea style={{...styles.input, height: '100px'}} placeholder="What's on your mind?" onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>Post to Community</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc' },
  header: { background: 'white', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' },
  centerNav: { display: 'flex', gap: '10px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b' },
  navBtnActive: { padding: '8px 20px', border: 'none', background: 'white', borderRadius: '8px', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 'bold' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { textAlign: 'left', padding: '10px', background: '#fdf2f8', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' },
  cardTitle: { margin: '10px 0', color: '#1e293b' },
  cardExcerpt: { color: '#64748b', fontSize: '14px' },
  cardMeta: { marginTop: '15px', fontSize: '12px', color: '#94a3b8' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', width: '100%', fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '400px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  videoCard: { background: 'white', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  avatarMini: { width: '35px', height: '35px', borderRadius: '50%', background: '#f1f5f9', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '20px', width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  ghostButtonFull: { background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', width: '100%', marginTop: '10px' }
};

export default Dashboard;

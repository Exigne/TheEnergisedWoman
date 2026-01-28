 import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, PlayCircle, BookOpen, 
  Utensils, LayoutGrid, Settings, ExternalLink, ChevronRight
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club'];

const Dashboard = () => {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');
  const [showModal, setShowModal] = useState(null); 
  
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });
  const [commentText, setCommentText] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    document.title = "The Energised Woman Collective";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profilePic: userData.profilePic || ''
      });
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [dRes, vRes, rRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=video'),
        fetch('/.netlify/functions/database?type=resources')
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (vRes.ok) setVideos(await vRes.json());
      if (rRes.ok) setResources(await rRes.json());
    } catch (err) { console.error("Load Error:", err); }
  };

  // --- AUTH HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const type = isRegistering ? 'register' : 'login';
    try {
      const res = await fetch(`/.netlify/functions/database?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('wellnessUser', JSON.stringify(data));
        setUser(data);
        setIsAdmin(data.isAdmin);
        window.location.reload(); // Refresh to clear states
      } else {
        alert(data.message || "Auth failed");
      }
    } catch (err) { alert("Server error"); }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/.netlify/functions/database?type=updateProfile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, ...profileForm })
      });
      if (res.ok) {
        const updated = { ...user, ...profileForm };
        setUser(updated);
        localStorage.setItem('wellnessUser', JSON.stringify(updated));
        setShowModal(null);
      }
    } catch (err) { alert("Failed to update profile"); }
  };

  // --- CRUD HANDLERS ---
  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) return;
    const res = await fetch('/.netlify/functions/database?type=discussion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...postForm,
        author: profileForm.firstName ? `${profileForm.firstName} ${profileForm.lastName}` : user.email.split('@')[0]
      })
    });
    if (res.ok) {
      setPostForm({ title: '', content: '', category: 'General' });
      setShowModal(null);
      loadAllData();
    }
  };

  const handleAddVideo = async () => {
    const res = await fetch('/.netlify/functions/database?type=video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoForm)
    });
    if (res.ok) {
      setVideoForm({ title: '', url: '', description: '' });
      setShowModal(null);
      loadAllData();
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this item?")) return;
    await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
    loadAllData();
  };

  // --- UTILS ---
  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // --- RENDER LOGIN ---
  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <Crown size={40} color="#ec4899" style={{marginBottom: '10px'}}/>
            <h2 style={{margin: 0}}>{isRegistering ? 'Create Account' : 'Member Login'}</h2>
            <p style={{color: '#64748b', fontSize: '14px'}}>The Energised Woman Collective</p>
          </div>
          <form onSubmit={handleAuth}>
            <input style={styles.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
            <button type="submit" style={styles.primaryButtonFull}>{isRegistering ? 'Register' : 'Sign In'}</button>
          </form>
          <button style={styles.ghostButtonFull} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already a member? Login' : 'New here? Register your account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* --- HEADER --- */}
      <header style={styles.header}>
        <div style={styles.brand}><Crown color="#ec4899" size={24} /> <span>The Collective</span></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={activeTab === 'community' ? styles.navBtnActive : styles.navBtn}>Community</button>
          <button onClick={() => setActiveTab('video')} style={activeTab === 'video' ? styles.navBtnActive : styles.navBtn}>Video Hub</button>
          <button onClick={() => setActiveTab('resources')} style={activeTab === 'resources' ? styles.navBtnActive : styles.navBtn}>Resources</button>
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={styles.avatarMini}>
            {profileForm.profilePic ? <img src={profileForm.profilePic} style={styles.avatarImg} alt="P" /> : <User size={18} />}
          </div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconBtn}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* --- COMMUNITY TAB --- */}
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
              <div style={styles.sectionHeader}>
                <h2>{activeGroup}</h2>
                <button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button>
              </div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={styles.cardHeader}>
                    <span style={styles.tag}>{post.category}</span>
                    {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion')}} style={styles.delBtn}><Trash2 size={14}/></button>}
                  </div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content?.substring(0, 150)}...</p>
                  <div style={styles.cardMeta}>
                    <span><User size={12}/> {post.author}</span>
                    <span><MessageCircle size={12}/> {post.comments?.length || 0} Comments</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- VIDEO HUB TAB --- */}
        {activeTab === 'video' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Masterclasses & Workouts</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}
            </div>
            <div style={styles.videoGrid}>
              {videos.map(v => (
                <div key={v.id} style={styles.videoCard}>
                  <div style={styles.videoFrameWrapper}>
                    <iframe src={getVideoEmbedUrl(v.url)} style={styles.videoIframe} frameBorder="0" allowFullScreen></iframe>
                  </div>
                  <div style={{padding: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <h4 style={{margin: '0 0 10px 0'}}>{v.title}</h4>
                      {isAdmin && <button onClick={() => handleDelete(v.id, 'video')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                    <p style={styles.cardExcerpt}>{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RESOURCES TAB --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Resource Library</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}
            </div>
            <div style={styles.subNavContainer}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveResourceCategory(cat)} style={activeResourceCategory === cat ? styles.subNavBtnActive : styles.subNavBtn}>
                  {cat === 'Recipes' ? <Utensils size={14} /> : cat === 'Book Club' ? <BookOpen size={14} /> : <LayoutGrid size={14} />} {cat}
                </button>
              ))}
            </div>
            <div style={styles.resourceGrid}>
              {resources.filter(r => (r.category || 'General') === activeResourceCategory).map(r => (
                <div key={r.id} style={styles.resourceCard}>
                  <div style={styles.resIcon}><FileText size={20} /></div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: 0}}>{r.title}</h4>
                    <span style={{fontSize: '11px', color: '#94a3b8'}}>{r.category}</span>
                  </div>
                  <button onClick={() => {setViewingDoc(r); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                  {isAdmin && <button onClick={() => handleDelete(r.id, 'resource')} style={styles.delBtn}><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Profile Modal */}
      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <div style={styles.avatarLarge}>
                {profileForm.profilePic ? <img src={profileForm.profilePic} style={styles.avatarImg} alt="P" /> : <User size={40} color="#cbd5e1" />}
              </div>
              <h3>Member Profile</h3>
            </div>
            <label style={styles.label}>First Name</label>
            <input style={styles.input} value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
            <label style={styles.label}>Last Name</label>
            <input style={styles.input} value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
            <label style={styles.label}>Profile GIF or Image URL</label>
            <input style={styles.input} value={profileForm.profilePic} onChange={e => setProfileForm({...profileForm, profilePic: e.target.value})} placeholder="https://..." />
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>Save Changes</button>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h3>New Discussion</h3>
              <button onClick={() => setShowModal(null)} style={styles.iconBtn}><X/></button>
            </div>
            <input style={styles.input} placeholder="Title" onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea style={{...styles.input, height: '150px'}} placeholder="Start typing..." onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>Post to Community</button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add New Video</h3>
            <input style={styles.input} placeholder="Video Title" onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
            <input style={styles.input} placeholder="YouTube URL" onChange={e => setVideoForm({...videoForm, url: e.target.value})} />
            <textarea style={{...styles.input, height: '100px'}} placeholder="Description" onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAddVideo}>Upload to Hub</button>
          </div>
        </div>
      )}

      {/* Doc Viewer */}
      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}>
              <h3>{viewingDoc.title}</h3>
              <div style={{display: 'flex', gap: '10px'}}>
                <a href={viewingDoc.url} target="_blank" rel="noreferrer" style={styles.iconBtn}><ExternalLink size={18}/></a>
                <button onClick={() => setShowModal(null)} style={styles.iconBtn}><X size={18}/></button>
              </div>
            </div>
            <iframe src={viewingDoc.url.includes('docs.google.com') ? viewingDoc.url.replace('/edit', '/preview') : viewingDoc.url} style={{flex: 1, border: 'none'}} title="Resource"></iframe>
          </div>
        </div>
      )}

    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', color: '#1e293b' },
  header: { background: 'white', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '18px' },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '15px' },
  navBtn: { padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '10px', color: '#64748b', fontWeight: '600' },
  navBtnActive: { padding: '10px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '10px', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' },
  sidebarBtnActive: { textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ec4899', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  card: { background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer', transition: 'transform 0.2s' },
  tag: { fontSize: '11px', background: '#fdf2f8', color: '#ec4899', padding: '5px 12px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: { fontSize: '22px', margin: '15px 0 10px 0', color: '#0f172a' },
  cardExcerpt: { color: '#64748b', fontSize: '15px', lineHeight: '1.6' },
  cardMeta: { marginTop: '20px', display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '15px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'white', padding: '35px', borderRadius: '28px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  avatarMini: { width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' },
  avatarLarge: { width: '100px', height: '100px', borderRadius: '30px', background: '#f1f5f9', margin: '0 auto 15px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fdf2f8' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' },
  videoCard: { background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%', background: '#000' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  subNavContainer: { display: 'flex', gap: '10px', marginBottom: '30px' },
  subNavBtn: { padding: '10px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
  subNavBtnActive: { padding: '10px 20px', borderRadius: '20px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  resourceCard: { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  resIcon: { padding: '12px', borderRadius: '15px', background: '#fdf2f8', color: '#ec4899' },
  viewBtnInternal: { background: '#f1f5f9', color: '#1e293b', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  docViewerContent: { background: 'white', width: '100%', height: '90vh', maxWidth: '1200px', borderRadius: '30px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '5px' },
  delBtn: { background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' },
  loginCard: { background: 'white', padding: '50px', borderRadius: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  ghostButtonFull: { background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', width: '100%', marginTop: '20px', fontWeight: '600', fontSize: '14px' }
};

export default Dashboard;

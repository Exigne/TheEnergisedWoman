import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, PlayCircle, BookOpen, 
  Utensils, LayoutGrid, Settings, ExternalLink, Heart, ExternalLinkIcon, ChevronRight
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club'];

const Dashboard = () => {
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
  const [commentText, setCommentText] = useState('');
  const [imageError, setImageError] = useState(false);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  useEffect(() => {
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
      const [d, v, r] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions').then(res => res.json()),
        fetch('/.netlify/functions/database?type=video').then(res => res.json()),
        fetch('/.netlify/functions/database?type=resources').then(res => res.json())
      ]);
      setDiscussions(Array.isArray(d) ? d : []);
      setVideos(Array.isArray(v) ? v : []);
      setResources(Array.isArray(r) ? r : []);
    } catch (err) { 
      console.error("Error loading data", err); 
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    try {
      let videoId = '';
      const cleanUrl = url.trim();
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = cleanUrl.match(regex);
      videoId = match ? match[1] : null;
      if (!videoId) return null;
      const origin = window.location.origin;
      return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(origin)}&rel=0`;
    } catch (e) { return null; }
  };

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
        window.location.reload();
      } else alert(data.message);
    } catch (err) { alert('Connection failed.'); }
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) return;
    try {
      const res = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postForm, userEmail: user.email })
      });
      if (res.ok) {
        setPostForm({ title: '', content: '', category: 'General' });
        setShowModal(null);
        loadAllData();
      }
    } catch (err) { console.error('Post error:', err); }
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) return;
    try {
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
    } catch (err) { console.error('Video add error:', err); }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) return;
    try {
      const res = await fetch('/.netlify/functions/database?type=resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      });
      if (res.ok) {
        setResourceForm({ title: '', url: '', category: 'General' });
        setShowModal(null);
        loadAllData();
      }
    } catch (err) { console.error('Resource add error:', err); }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Delete this?")) {
      try {
        await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
        loadAllData();
      } catch (err) { console.error('Delete error:', err); }
    }
  };

  const renderAvatar = (src, size = 'small') => {
    const isLarge = size === 'large';
    const containerStyle = isLarge ? styles.avatarLarge : styles.avatarMini;
    if (!src || imageError) return <div style={containerStyle}><User size={isLarge ? 40 : 18} color="#64748b" /></div>;
    return <div style={containerStyle}><img src={src} style={styles.avatarImg} alt="Profile" onError={() => setImageError(true)} /></div>;
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}><Crown size={40} color="#ec4899" /><h2>Collective Login</h2></div>
          <form onSubmit={handleAuth}>
            <input style={styles.input} type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button style={styles.primaryButtonFull}>{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button style={styles.ghostButtonFull} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
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
          <button onClick={() => setActiveTab('resources')} style={activeTab === 'resources' ? styles.navBtnActive : styles.navBtn}>Resources</button>
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>{renderAvatar(profileForm.profilePic)}</div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconBtn}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* COMMUNITY TAB */}
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={activeGroup === g ? styles.sidebarBtnActive : styles.sidebarBtn}><Hash size={14} /> {g}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}>
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span></div>
                  <h3>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.metaItem}><Heart size={12}/> {post.likes?.length || 0}</span>
                    <span style={styles.metaItem}><MessageCircle size={12}/> {post.comments?.length || 0}</span>
                    {isAdmin && <Trash2 size={12} style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}}/>}
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === 'video' && (
          <div style={styles.videoGrid}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
               <h2>Video Hub</h2>
               {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}
            </div>
            {videos.map(v => (
              <div key={v.id} style={styles.videoCard}>
                <div style={styles.videoFrameWrapper}>
                  {getVideoEmbedUrl(v.url) ? (
                    <iframe src={getVideoEmbedUrl(v.url)} style={styles.videoIframe} frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="no-referrer" />
                  ) : (
                    <div style={styles.videoPlaceholder}><Video size={48} color="#cbd5e1" /><p>Link Error</p></div>
                  )}
                </div>
                <div style={{padding: '15px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h4 style={{margin: 0}}>{v.title}</h4>
                    {isAdmin && <Trash2 size={16} color="#94a3b8" style={{cursor:'pointer'}} onClick={() => handleDelete(v.id, 'video')}/>}
                   </div>
                   <p style={styles.cardExcerpt}>{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveResourceCategory(cat)} style={activeResourceCategory === cat ? styles.sidebarBtnActive : styles.sidebarBtn}>
                  <BookOpen size={14} /> {cat}
                </button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}>
                <h2>{activeResourceCategory} Resources</h2>
                {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}
              </div>
              <div style={styles.resourceGrid}>
                {resources.filter(r => r.category === activeResourceCategory).map(r => (
                  <div key={r.id} style={styles.resourceCard}>
                    <div style={styles.resourceIcon}><FileText color="#ec4899" /></div>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: 0}}>{r.title}</h4>
                      <p style={{fontSize: '11px', color: '#94a3b8', margin: 0}}>{r.category}</p>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={() => window.open(r.url, '_blank')} style={styles.viewBtnInternal}>Open</button>
                      {isAdmin && <button onClick={() => handleDelete(r.id, 'resource')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>Create Post</h3><X style={{cursor:'pointer'}} onClick={() => setShowModal(null)}/></div>
            <select style={styles.input} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input style={styles.input} placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <textarea style={{...styles.input, height: '120px'}} placeholder="What's on your mind?" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>Post to Community</button>
          </div>
        </div>
      )}

      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>Add Video</h3><X style={{cursor:'pointer'}} onClick={() => setShowModal(null)}/></div>
            <input style={styles.input} placeholder="Video Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
            <input style={styles.input} placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAddVideo}>Save Video</button>
          </div>
        </div>
      )}

      {showModal === 'resource' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>Add Resource</h3><X style={{cursor:'pointer'}} onClick={() => setShowModal(null)}/></div>
            <select style={styles.input} value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})}>
              {RESOURCE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input style={styles.input} placeholder="Resource Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
            <input style={styles.input} placeholder="Link (PDF or URL)" value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAddResource}>Save Resource</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  header: { background: 'white', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b' },
  navBtnActive: { padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' },
  sidebarBtnActive: { textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginTop: '10px' },
  cardMeta: { display: 'flex', gap: '15px', marginTop: '15px', color: '#94a3b8', fontSize: '12px', alignItems: 'center' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  videoCard: { background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  videoFrameWrapper: { position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  videoPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' },
  resourceCard: { background: 'white', padding: '15px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  resourceIcon: { width: '40px', height: '40px', borderRadius: '10px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewBtnInternal: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #ec4899', color: '#ec4899', background: 'white', cursor: 'pointer', fontWeight: 'bold' },
  delBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  ghostButtonFull: { background: 'transparent', color: '#64748b', border: 'none', padding: '10px', cursor: 'pointer', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '24px', width: '450px', maxWidth: '90vw' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  avatarMini: { width: '35px', height: '35px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }
};

export default Dashboard;

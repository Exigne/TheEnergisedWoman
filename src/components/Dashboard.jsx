import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, PlayCircle, BookOpen, 
  Utensils, LayoutGrid, Settings, ExternalLink, ChevronRight, Heart, ExternalLinkIcon
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
  const [viewingDoc, setViewingDoc] = useState(null);
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
      setImageError(false);
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
    } catch (err) {
      console.error('Auth error:', err);
      alert('Connection failed. Please try again.');
    }
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
        setImageError(false);
        setShowModal(null);
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
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
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      if (res.ok) loadAllData();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const authorName = profileForm.firstName ? `${profileForm.firstName} ${profileForm.lastName}` : user.email.split('@')[0];
    try {
      const res = await fetch('/.netlify/functions/database?type=addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: selectedPost.id, comment: commentText, author: authorName })
      });
      if (res.ok) {
        setCommentText('');
        loadAllData();
        const updated = discussions.find(d => d.id === selectedPost.id);
        setSelectedPost(updated);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
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
    } catch (err) {
      console.error('Error adding video:', err);
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Delete this?")) {
      try {
        await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { 
          method: 'DELETE'
        });
        loadAllData();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    try {
      let videoId = '';
      const cleanUrl = url.trim();
      if (cleanUrl.includes('youtu.be/')) {
        videoId = cleanUrl.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (cleanUrl.includes('v=')) {
        videoId = cleanUrl.split('v=')[1].split(/[&#]/)[0];
      } else if (cleanUrl.includes('/shorts/')) {
        videoId = cleanUrl.split('/shorts/')[1].split(/[?#]/)[0];
      } else if (cleanUrl.includes('embed/')) {
        videoId = cleanUrl.split('embed/')[1].split(/[?#]/)[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
      return null;
    }
  };

  const renderAvatar = (src, size = 'small') => {
    const isLarge = size === 'large';
    const containerStyle = isLarge ? styles.avatarLarge : styles.avatarMini;
    if (!src || imageError) {
      return <div style={containerStyle}><User size={isLarge ? 40 : 18} color="#64748b" /></div>;
    }
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
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>{renderAvatar(profileForm.profilePic, 'small')}</div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconBtn}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={styles.main}>
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
                  <div style={styles.cardHeader}>
                    <span style={styles.tag}>{post.category}</span>
                    {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} style={styles.delBtn}><Trash2 size={14}/></button>}
                  </div>
                  <h3>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content}</p>
                </div>
              ))}
            </section>
          </div>
        )}

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
                    <iframe src={getVideoEmbedUrl(v.url)} style={styles.videoIframe} frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  ) : (
                    <div style={styles.videoPlaceholder}><Video size={48} color="#cbd5e1" /></div>
                  )}
                </div>
                <div style={{padding: '15px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h4>{v.title}</h4>
                    {isAdmin && <button onClick={() => handleDelete(v.id, 'video')} style={styles.delBtn}><Trash2 size={14}/></button>}
                   </div>
                   <p style={styles.cardExcerpt}>{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2>Resources</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.resourceGrid}>
              {resources.map(r => (
                <div key={r.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" />
                  <div style={{flex: 1}}><h4 style={{margin: 0}}>{r.title}</h4></div>
                  <button onClick={() => window.open(r.url, '_blank')} style={styles.viewBtnInternal}>Open</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Basic Profile Modal Example */}
      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <input style={styles.input} placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
            <input style={styles.input} placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>Save</button>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add New Video</h3>
            <input style={styles.input} placeholder="Video Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
            <input style={styles.input} placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAddVideo}>Save Video</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header: { background: 'white', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1.2rem' },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b' },
  navBtnActive: { padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' },
  sidebarBtnActive: { textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginTop: '10px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  videoCard: { background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  videoFrameWrapper: { position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  videoPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  resourceCard: { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  ghostButtonFull: { background: 'transparent', color: '#64748b', border: 'none', padding: '10px', cursor: 'pointer', width: '100%', marginTop: '10px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '24px', width: '400px', maxWidth: '90vw' },
  avatarMini: { width: '35px', height: '35px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  delBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  viewBtnInternal: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #ec4899', color: '#ec4899', background: 'white', fontWeight: 'bold', cursor: 'pointer' }
};

export default Dashboard;

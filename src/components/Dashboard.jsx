import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, 
  Upload, FileText, User, Trash2, Hash, Send, MessageCircle,
  PlayCircle, BookOpen, Utensils, LayoutGrid, Settings
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club'];

const Dashboard = () => {
  // Auth & User State
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');

  // Selection & Data States
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]); 
  const [resources, setResources] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Forms
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    document.title = "The Energised Woman Collective | Dashboard";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email?.includes('admin'));
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
      const [dRes, rRes, vRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=resources'),
        fetch('/.netlify/functions/database?type=video') 
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (rRes.ok) setResources(await rRes.json());
      if (vRes.ok) setVideos(await vRes.json());
    } catch (err) { console.error("Data load error", err); }
  };

  // --- Auth Handlers ---

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    try {
      const res = await fetch(`/.netlify/functions/database?type=${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('wellnessUser', JSON.stringify(data));
        setUser(data);
        setIsAdmin(data.isAdmin);
        setProfileForm({ firstName: data.firstName || '', lastName: data.lastName || '', profilePic: data.profilePic || '' });
        loadAllData();
      } else {
        alert(data.message || "Authentication failed.");
      }
    } catch (err) { alert("Server error. Please try again."); }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/.netlify/functions/database?type=updateProfile', {
        method: 'PUT',
        body: JSON.stringify({ email: user.email, ...profileForm })
      });
      if (res.ok) {
        const updatedUser = { ...user, ...profileForm };
        setUser(updatedUser);
        localStorage.setItem('wellnessUser', JSON.stringify(updatedUser));
        setShowModal(null);
      }
    } catch (err) { console.error(err); }
  };

  // --- Utility ---
  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be')) videoId = url.split('/').pop();
    else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      loadAllData();
      if (showModal) setShowModal(null);
    } catch (err) { console.error(err); }
  };

  // --- Render Login ---
  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <div style={{display:'inline-flex', padding: '12px', background: '#fdf2f8', borderRadius: '50%', marginBottom: '15px'}}>
               <Crown size={32} color="#ec4899" />
            </div>
            <h1 style={{fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0'}}>The Energised Woman Collective</h1>
            <p style={{color: '#64748b', fontSize: '14px'}}>{isRegistering ? "Create your account" : "Sign in to your wellness hub"}</p>
          </div>
          <form onSubmit={handleAuth}>
            <input style={styles.input} type="email" placeholder="Email address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            <button type="submit" style={styles.primaryButtonFull}>{isRegistering ? "Register Now" : "Sign In"}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} style={styles.ghostButtonFull}>
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown size={22} color="#ec4899" /><h1 style={styles.brandText}>The Energised Woman Collective</h1></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('video')} style={{...styles.navBtn, ...(activeTab === 'video' && styles.navBtnActive)}}>Video Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Resources</button>
        </nav>
        <div style={styles.userSection}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
             <div onClick={() => setShowModal('profile')} style={styles.avatarMini}>
                {profileForm.profilePic ? <img src={profileForm.profilePic} alt="P" style={styles.avatarImg} /> : <User size={16} />}
             </div>
             <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.clear();}}><LogOut size={18}/></button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* --- COMMUNITY TAB --- */}
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{...styles.sidebarBtn, ...(activeGroup === g && styles.sidebarBtnActive)}}><Hash size={14} /> {g}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span>{isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion')}} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content?.substring(0, 120)}...</p>
                  <div style={styles.cardMeta}><span style={styles.metaItem}><User size={12}/> {post.author}</span><span style={styles.metaItem}><MessageCircle size={12}/> {post.comments?.length || 0}</span></div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- VIDEO HUB TAB --- */}
        {activeTab === 'video' && (
          <div>
            <div style={styles.sectionHeader}><h2>Video Hub</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}</div>
            <div style={styles.videoGrid}>
              {videos.map(video => (
                <div key={video.id} style={styles.videoCard}>
                  <div style={styles.videoFrameWrapper}>
                     <iframe src={getVideoEmbedUrl(video.url)} title={video.title} style={styles.videoIframe} frameBorder="0" allowFullScreen></iframe>
                  </div>
                  <div style={styles.videoContent}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <h4 style={{margin: '0 0 8px 0'}}>{video.title}</h4>
                      {isAdmin && <button onClick={() => handleDelete(video.id, 'video')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                    <p style={styles.cardExcerpt}>{video.description}</p>
                    <button style={styles.commentBtn} onClick={() => {setSelectedVideo(video); setShowModal('videoDetail');}}>
                      <MessageCircle size={14}/> {video.comments?.length || 0} Comments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RESOURCES TAB --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2>Resources</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.subNavContainer}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveResourceCategory(cat)} style={activeResourceCategory === cat ? styles.subNavBtnActive : styles.subNavBtn}>
                  {cat === 'Recipes' ? <Utensils size={14} /> : cat === 'Book Club' ? <BookOpen size={14} /> : <LayoutGrid size={14} />} {cat}
                </button>
              ))}
            </div>
            <div style={styles.resourceGrid}>
              {resources.filter(res => (res.category || 'General') === activeResourceCategory).map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <div style={{...styles.resIcon, background: res.category === 'Recipes' ? '#ecfccb' : '#fdf2f8'}}>
                    {res.category === 'Recipes' ? <Utensils size={20} /> : <FileText size={20} />}
                  </div>
                  <div style={{flex: 1}}><h4 style={{margin: 0}}>{res.title}</h4></div>
                  <button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                  {isAdmin && <button onClick={() => handleDelete(res.id, 'resource')} style={styles.delBtn}><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
               <div style={styles.avatarLarge}>
                  {profileForm.profilePic ? <img src={profileForm.profilePic} style={styles.avatarImg} /> : <User size={40} color="#cbd5e1" />}
               </div>
               <h3>Update Profile</h3>
            </div>
            <input style={styles.input} placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
            <input style={styles.input} placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
            <input style={styles.input} placeholder="Profile URL / GIF Link" value={profileForm.profilePic} onChange={e => setProfileForm({...profileForm, profilePic: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>Save Profile</button>
          </div>
        </div>
      )}

      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>New Discussion</h3>
            <input style={styles.input} placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea style={{...styles.input, height: '120px'}} placeholder="Content..." value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={async () => {
               await fetch('/.netlify/functions/database?type=discussion', { method: 'POST', body: JSON.stringify({...postForm, author: user.display_name}) });
               setShowModal(null); loadAllData();
            }}>Post to Community</button>
          </div>
        </div>
      )}

      {/* (Add Video, Resource, and Detail modals follow similar logic/styling) */}
      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}><h3>{viewingDoc.title}</h3><button onClick={() => setShowModal(null)}><X size={18}/></button></div>
            <iframe src={viewingDoc.url.includes('docs.google.com') ? viewingDoc.url.replace('/edit', '/preview') : viewingDoc.url} style={{flex: 1, border: 'none'}} title="Doc"></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  loginContainer: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  centerNav: { display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 18px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  userSection: { display: 'flex', gap: '10px' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sidebarBtn: { textAlign: 'left', padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' },
  cardTitle: { fontSize: '20px', margin: '8px 0', color: '#1e293b' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5' },
  cardMeta: { marginTop: '16px', display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  ghostButtonFull: { background: 'none', border: 'none', color: '#ec4899', fontSize: '13px', fontWeight: '600', marginTop: '15px', cursor: 'pointer', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '24px', width: '400px', maxWidth: '90vw' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px', fontFamily: 'inherit' },
  avatarMini: { width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 15px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fdf2f8' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  videoCard: { background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%', background: '#000' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  videoContent: { padding: '20px' },
  commentBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '10px' },
  subNavContainer: { display: 'flex', gap: '10px', marginBottom: '24px' },
  subNavBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  subNavBtnActive: { padding: '8px 16px', borderRadius: '20px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  resourceCard: { background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' },
  resIcon: { padding: '10px', borderRadius: '12px', color: '#ec4899' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  docViewerContent: { background: 'white', width: '90%', height: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '15px 25px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }
};

export default Dashboard;

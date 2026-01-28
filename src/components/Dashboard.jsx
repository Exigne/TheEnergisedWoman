import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, 
  Upload, FileText, User, Trash2, Hash, Send, MessageCircle,
  PlayCircle, BookOpen, Utensils, LayoutGrid, Settings
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  
  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Profile State
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]); 
  const [resources, setResources] = useState([]);
  
  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    document.title = "The Energised Woman Collective | Dashboard";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setProfileForm({ 
        firstName: userData.firstName || '', 
        lastName: userData.lastName || '', 
        profilePic: userData.profilePic || '' 
      });
      setIsAdmin(userData.isAdmin || userData.email?.includes('admin'));
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
    } catch (err) { 
      console.error("Data load error", err);
    }
  };

  // --- Auth Handlers ---

  const handleAuth = async (e) => {
    e.preventDefault();
    const type = isRegistering ? 'register' : 'login';
    
    try {
      const res = await fetch(`/.netlify/functions/database?type=${type}`, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const userData = {
          ...data,
          display_name: data.firstName ? `${data.firstName}` : loginEmail.split('@')[0],
          isAdmin: loginEmail.toLowerCase().includes('admin')
        };
        localStorage.setItem('wellnessUser', JSON.stringify(userData));
        setUser(userData);
        setIsAdmin(userData.isAdmin);
        loadAllData();
      } else {
        alert(data.message || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      alert("Error connecting to server. Please try again.");
    }
  };

  const handleUpdateProfile = async () => {
    const updatedUser = { ...user, ...profileForm, display_name: profileForm.firstName || user.email.split('@')[0] };
    setUser(updatedUser);
    localStorage.setItem('wellnessUser', JSON.stringify(updatedUser));
    setShowModal(null);
    
    // Optional: Sync with Neon.tech
    try {
      await fetch('/.netlify/functions/database?type=updateProfile', {
        method: 'PUT',
        body: JSON.stringify({ email: user.email, ...profileForm })
      });
    } catch (err) { console.error("Profile sync error", err); }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be')) { videoId = url.split('/').pop(); } 
      else if (url.includes('v=')) { videoId = url.split('v=')[1].split('&')[0]; }
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // --- Render Logic ---

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <div style={{display:'inline-flex', padding: '12px', background: '#fdf2f8', borderRadius: '50%', marginBottom: '15px'}}>
               <Crown size={32} color="#ec4899" />
            </div>
            <h1 style={{fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0'}}>The Energised Woman Collective</h1>
            <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>
                {isRegistering ? "Create your account" : "Sign in to access your wellness hub"}
            </p>
          </div>
          <form onSubmit={handleAuth}>
            <input style={styles.input} type="email" placeholder="Email address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            <button type="submit" style={styles.primaryButtonFull}>{isRegistering ? "Register" : "Sign In"}</button>
          </form>
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{...styles.iconBtn, width: '100%', marginTop: '15px', color: '#ec4899', fontSize: '13px', fontWeight: '600'}}
          >
            {isRegistering ? "Already have an account? Sign In" : "New here? Register an account"}
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
            {user.profilePic && <img src={user.profilePic} alt="Profile" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />}
            <button style={styles.iconBtn} onClick={() => setShowModal('profile')}><Settings size={18}/></button>
            <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.clear();}}><LogOut size={18}/></button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
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
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>{video.title}</h4>
                    <p style={{margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4'}}>{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ... (Keep your Community and Resource tabs logic same as before) */}
        {activeTab === 'community' && <p style={{textAlign: 'center', color: '#64748b'}}>Community Feed Loaded...</p>}
      </main>

      {/* --- MODALS --- */}
      
      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h3 style={{margin: 0}}>Your Profile</h3>
                <button onClick={() => setShowModal(null)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {profileForm.profilePic ? <img src={profileForm.profilePic} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <User size={40} color="#cbd5e1" />}
                </div>
            </div>
            <label style={styles.label}>First Name</label>
            <input style={styles.input} value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} placeholder="Jane" />
            
            <label style={styles.label}>Last Name</label>
            <input style={styles.input} value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} placeholder="Doe" />
            
            <label style={styles.label}>Profile Image / GIF URL</label>
            <input style={styles.input} value={profileForm.profilePic} onChange={e => setProfileForm({...profileForm, profilePic: e.target.value})} placeholder="https://..." />
            
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>Save Changes</button>
          </div>
        </div>
      )}

      {/* ... (Keep your post, addVideo, and resource modals) */}
    </div>
  );
};

const styles = {
  // ... (Keep existing styles)
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  loginContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  centerNav: { display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 18px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  userSection: { display: 'flex', justifyContent: 'flex-end' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '400px', maxWidth: '90vw' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  
  // FIX: Aspect Ratio Iframe Styles
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  videoCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%', background: 'black', width: '100%' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  videoContent: { padding: '16px' }
};

export default Dashboard;

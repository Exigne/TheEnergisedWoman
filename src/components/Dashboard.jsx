import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  Link2, BookOpen, FileText, Loader
} from 'lucide-react';

// CLOUDINARY CONFIG
const CLOUDINARY_CLOUD_NAME = 'dyitrwe5h';
const CLOUDINARY_UPLOAD_PRESET = 'wellness_profile_pics';

// COLOR PALETTE
const COLORS = {
  transparent: 'rgba(0, 0, 0, 0)',
  sageLight: 'rgb(179, 197, 151)',
  sage: 'rgb(162, 189, 145)',
  mauve: 'rgb(180, 169, 172)',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray800: '#1e293b',
  red: '#ef4444'
};

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club', 'Worksheets'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');
  
  // Data
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  
  // Selection / Modals
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hoveredPost, setHoveredPost] = useState(null);
  
  // Loading States
  const [imageError, setImageError] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '', thumbnail: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
        setIsAdmin(userData.isAdmin || false);
        setProfileForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profilePic: userData.profilePic || ''
        });
        loadAllData();
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem('wellnessUser');
      }
    }
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      console.log('Fetching data from Netlify functions...');
      
      // Fetch discussions
      const dRes = await fetch('/.netlify/functions/database?type=discussions');
      const dData = await dRes.json();
      console.log('Discussions loaded:', dData?.length || 0);
      setDiscussions(Array.isArray(dData) ? dData : []);
      
      // Fetch videos - with explicit error handling
      try {
        const vRes = await fetch('/.netlify/functions/database?type=videos');
        if (!vRes.ok) throw new Error(`Videos fetch failed: ${vRes.status}`);
        const vData = await vRes.json();
        console.log('Videos loaded:', vData?.length || 0, vData);
        setVideos(Array.isArray(vData) ? vData : []);
      } catch (vErr) {
        console.error('Error loading videos:', vErr);
        setVideos([]);
      }
      
      // Fetch resources
      const rRes = await fetch('/.netlify/functions/database?type=resources');
      const rData = await rRes.json();
      console.log('Resources loaded:', rData?.length || 0);
      setResources(Array.isArray(rData) ? rData : []);
      
    } catch (err) { 
      console.error("Error loading data", err); 
    } finally {
      setLoadingData(false);
    }
  };

  // --- UTILS ---

  const getVideoId = (url) => {
    if (!url) return null;
    try {
      // Handle various YouTube URL formats
      if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
      if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
      if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
      if (url.includes('youtube.com/shorts/')) return url.split('shorts/')[1].split('?')[0];
      return null;
    } catch (e) { 
      console.error('Error parsing video ID:', e);
      return null; 
    }
  };

  // --- SMART RESOURCE OPENER ---
  const handleOpenResource = (resource) => {
    if (!resource.url) return;
    
    // Check if it is a Word Doc
    const isDoc = resource.url.toLowerCase().includes('.doc') || resource.url.toLowerCase().includes('.docx');
    
    if (isDoc) {
      // Use Google Docs Viewer for Word files - FIXED: removed space in URL
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`;
      window.open(viewerUrl, '_blank');
    } else {
      // PDFs and Images open natively
      window.open(resource.url, '_blank');
    }
  };

  // --- UPLOAD LOGIC ---
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const resourceType = file.type.includes('image') ? 'image' : 'raw';

    // FIXED: Removed space in URL after v1_1/
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    console.log('Uploading to:', uploadUrl);
    
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      
      const data = await res.json();
      console.log('Upload successful:', data.secure_url);
      return data.secure_url;
    } catch (err) {
      console.error('Upload fetch error:', err);
      throw err;
    }
  };

  const handleFileUpload = async (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check size (limit to 5MB for docs)
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be smaller than 5MB');
      return;
    }

    setUploadingFile(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      
      if (field === 'profilePic') {
        setProfileForm(prev => ({...prev, profilePic: fileUrl}));
      } else if (field === 'thumbnail') {
        if (formSetter === setVideoForm) setVideoForm(prev => ({...prev, thumbnail: fileUrl}));
        if (formSetter === setResourceForm) setResourceForm(prev => ({...prev, thumbnail: fileUrl}));
      } else if (field === 'resourceFile') {
        setResourceForm(prev => ({
          ...prev, 
          url: fileUrl,
          fileName: file.name
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file: ' + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // --- DATA HANDLERS ---

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
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (err) { alert('Connection failed.'); }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/.netlify/functions/database?type=updateProfile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          profilePic: profileForm.profilePic 
        })
      });
      if (res.ok) {
        const updatedUser = { ...user, ...profileForm };
        setUser(updatedUser);
        localStorage.setItem('wellnessUser', JSON.stringify(updatedUser));
        setShowModal(null);
      } else { alert('Failed to update'); }
    } catch (err) { alert('Failed to update'); }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) return alert("Fill all fields");
    
    const authorName = profileForm.firstName ? `${profileForm.firstName} ${profileForm.lastName}` : (user.displayName || 'Anonymous');
    const optimisticPost = {
      id: 'temp-' + Date.now(),
      title: postForm.title,
      content: postForm.content,
      category: postForm.category,
      author: authorName,
      author_profile_pic: profileForm.profilePic,
      likes: [],
      comments: [],
      created_at: new Date().toISOString()
    };
    
    setDiscussions(prev => [optimisticPost, ...prev]);
    setShowModal(null);
    setPostForm({ title: '', content: '', category: 'General' });
    
    try {
      const res = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: postForm.title,
          content: postForm.content,
          category: postForm.category,
          userEmail: user.email,
          authorProfilePic: profileForm.profilePic
        })
      });
      if (res.ok) {
        const newPost = await res.json();
        setDiscussions(prev => prev.map(p => p.id === optimisticPost.id ? newPost : p));
      }
    } catch (err) { loadAllData(); }
  };

  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    const targetPost = discussions.find(d => d.id === postId);
    if (!targetPost) return;

    const newLikes = (targetPost.likes || []).includes(user.id)
      ? (targetPost.likes || []).filter(id => id !== user.id)
      : [...(targetPost.likes || []), user.id];
    
    const updatedPost = { ...targetPost, likes: newLikes };
    
    if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    setDiscussions(prev => prev.map(d => d.id === postId ? updatedPost : d));
    
    fetch('/.netlify/functions/database?type=likePost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, userId: user.id })
    }).catch(() => loadAllData());
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    const authorName = profileForm.firstName ? `${profileForm.firstName} ${profileForm.lastName}` : 'Anonymous';
    
    const newComment = {
      text: commentText,
      author: authorName,
      authorProfilePic: profileForm.profilePic,
      timestamp: new Date().toISOString()
    };
    
    const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), newComment] };
    setSelectedPost(updatedPost);
    setDiscussions(prev => prev.map(d => d.id === selectedPost.id ? updatedPost : d));
    setCommentText('');
    
    fetch('/.netlify/functions/database?type=addComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: selectedPost.id, comment: commentText, author: authorName, authorProfilePic: profileForm.profilePic })
    });
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) return alert("Title and URL required");
    const videoId = getVideoId(videoForm.url);
    if (!videoId) return alert("Invalid YouTube URL. Please use a standard YouTube link.");
    
    try {
      const res = await fetch('/.netlify/functions/database?type=video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm)
      });
      if (res.ok) {
        setVideoForm({ title: '', url: '', description: '', thumbnail: '' });
        setShowModal(null);
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add video");
      }
    } catch (err) { 
      alert("Failed to add video: " + err.message); 
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) return alert("Title and Document/URL required");
    
    try {
      const res = await fetch('/.netlify/functions/database?type=resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: resourceForm.title,
          url: resourceForm.url,
          category: resourceForm.category,
          thumbnail: resourceForm.thumbnail
        })
      });
      if (res.ok) {
        setResourceForm({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
        setShowModal(null);
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add resource");
      }
    } catch (err) { 
      alert("Failed to add resource: " + err.message); 
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'discussion') setDiscussions(prev => prev.filter(d => d.id !== id));
        if (type === 'video') setVideos(prev => prev.filter(v => v.id !== id));
        if (type === 'resource') setResources(prev => prev.filter(r => r.id !== id));
        setShowModal(null);
      }
    } catch (err) { alert('Failed to delete'); }
  };

  const renderAvatar = (src, size = 'small') => {
    const sizePx = size === 'large' ? '80px' : size === 'medium' ? '40px' : '35px';
    const iconSize = size === 'large' ? 40 : 20;
    
    return (
      <div style={{
        width: sizePx, height: sizePx, borderRadius: '50%', background: COLORS.gray100, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', 
        border: `2px solid ${src ? COLORS.sage : COLORS.gray200}`, flexShrink: 0
      }}>
        {src && !imageError ? (
          <img src={src} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={() => setImageError(true)} />
        ) : <User size={iconSize} color={COLORS.gray500} />}
      </div>
    );
  };

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.gray50}}>
        <div style={{background: COLORS.white, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color={COLORS.sage} />
            <h2 style={{color: COLORS.gray800}}>The Energised Woman Collective</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            <button type="submit" style={{width: '100%', background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button style={{width: '100%', marginTop: '15px', background: 'none', border: 'none', color: COLORS.gray500, cursor: 'pointer'}} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div style={{minHeight: '100vh', background: COLORS.gray50, fontFamily: 'system-ui, sans-serif'}}>
      <header style={{background: COLORS.white, height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: `1px solid ${COLORS.gray200}`, position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px', color: COLORS.gray800}}>
          <Crown color={COLORS.sage} /> <span>The Energised Woman</span>
        </div>
        <nav style={{display: 'flex', gap: '8px', background: COLORS.gray100, padding: '5px', borderRadius: '12px'}}>
          {['community', 'video', 'resources'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === tab ? COLORS.white : 'transparent',
              color: activeTab === tab ? COLORS.sage : COLORS.gray500,
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'video' && 'Hub'}
            </button>
          ))}
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>{renderAvatar(profileForm.profilePic)}</div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        
        {/* VIDEOS */}
        {activeTab === 'video' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px'}}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
               <h2 style={{color: COLORS.gray800}}>Video Hub</h2>
               {isAdmin && <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}
            </div>
            
            {loadingData && <div style={{gridColumn: '1/-1', textAlign: 'center', color: COLORS.gray500}}>Loading videos...</div>}
            
            {!loadingData && videos.length === 0 && (
              <div style={{gridColumn: '1/-1', textAlign: 'center', color: COLORS.gray500, padding: '40px'}}>
                No videos yet. {isAdmin && 'Click "Add Video" to add one!'}
              </div>
            )}
            
            {videos.map(v => {
              const videoId = getVideoId(v.url);
              const thumbnailUrl = v.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              
              return (
                <div key={v.id} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`}}>
                  <div style={{position: 'relative', width: '100%', height: '200px', background: '#000', cursor: 'pointer'}} onClick={() => {setSelectedVideo(v); setShowModal('playVideo');}}>
                    <img src={thumbnailUrl} alt={v.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)'}}>
                      <div style={{background: 'rgba(162, 189, 145, 0.9)', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <PlayCircle size={30} color="white" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div style={{padding: '15px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <h4 style={{margin: 0, color: COLORS.gray800}}>{v.title}</h4>
                        {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(v.id, 'video');}} style={{border: 'none', background: 'none', color: COLORS.gray400}}><Trash2 size={16}/></button>}
                      </div>
                      <p style={{color: COLORS.gray500, fontSize: '14px', marginTop: '8px'}}>{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMMUNITY */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeGroup === g ? 'rgba(179, 197, 151, 0.2)' : 'transparent', color: activeGroup === g ? COLORS.sage : COLORS.gray500, fontWeight: activeGroup === g ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2 style={{color: COLORS.gray800}}>{activeGroup}</h2>
                <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                    <div key={post.id} 
                      style={{background: COLORS.white, padding: '28px', borderRadius: '16px', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer', transition: 'all 0.3s', transform: hoveredPost === post.id ? 'translateY(-2px)' : 'none', boxShadow: hoveredPost === post.id ? '0 10px 20px rgba(0,0,0,0.05)' : 'none'}}
                      onMouseEnter={() => setHoveredPost(post.id)} onMouseLeave={() => setHoveredPost(null)} onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px'}}>
                        {renderAvatar(post.author_profile_pic || post.authorProfilePic, 'medium')}
                        <div><span style={{fontWeight: 'bold', display: 'block'}}>{post.author}</span><span style={{fontSize: '12px', color: COLORS.gray400}}>{new Date(post.created_at).toLocaleDateString()}</span></div>
                      </div>
                      <h3 style={{margin: '0 0 10px 0', color: COLORS.gray800}}>{post.title}</h3>
                      <p style={{color: COLORS.gray500, lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{post.content}</p>
                      <div style={{display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.gray100}`}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: (post.likes || []).includes(user?.id) ? COLORS.red : COLORS.gray400}}><Heart size={18} fill={(post.likes || []).includes(user?.id) ? COLORS.red : "none"} /> {(post.likes || []).length}</div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.gray400}}><MessageCircle size={18} /> {(post.comments || []).length}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* RESOURCES */}
        {activeTab === 'resources' && (
           <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
             <aside>
               {RESOURCE_CATEGORIES.map(c => (
                 <button key={c} onClick={() => setActiveResourceCategory(c)} style={{
                     width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                     background: activeResourceCategory === c ? COLORS.sageLight : 'transparent', color: activeResourceCategory === c ? COLORS.white : COLORS.gray500, fontWeight: activeResourceCategory === c ? 'bold' : 'normal'
                   }}>{c}</button>
               ))}
               {isAdmin && <button style={{marginTop: '20px', width: '100%', padding: '12px', background: COLORS.sage, color: COLORS.white, border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px'}} onClick={() => setShowModal('addResource')}><Plus size={16}/> Add Resource</button>}
             </aside>
             <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
               {resources.filter(r => r.category === activeResourceCategory).map(r => (
                   <div key={r.id} onClick={() => handleOpenResource(r)} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer', transition: 'transform 0.2s'}}>
                     <div style={{height: '140px', background: COLORS.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        ) : (
                          <div style={{flexDirection: 'column', display: 'flex', alignItems: 'center', gap: '10px'}}>
                             <FileText size={40} color={COLORS.gray400} />
                             <span style={{fontSize: '12px', color: COLORS.gray500}}>Document</span>
                          </div>
                        )}
                     </div>
                     <div style={{padding: '16px'}}>
                       <h4 style={{margin: '0 0 8px 0', color: COLORS.gray800}}>{r.title}</h4>
                       <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                         <span style={{fontSize: '12px', color: COLORS.sage, display: 'flex', alignItems: 'center', gap: '4px'}}><BookOpen size={12}/> View</span>
                         {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(r.id, 'resource');}} style={{border: 'none', background: 'none', color: COLORS.gray400}}><Trash2 size={14}/></button>}
                       </div>
                     </div>
                   </div>
                 ))}
             </div>
           </div>
        )}
      </main>

      {/* MODALS */}
      {showModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: showModal === 'playVideo' ? '#000' : COLORS.white, width: '90%', maxWidth: showModal === 'playVideo' ? '900px' : '600px', borderRadius: '20px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <div style={{padding: '20px', borderBottom: showModal === 'playVideo' ? 'none' : `1px solid ${COLORS.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0, color: showModal === 'playVideo' ? '#fff' : COLORS.gray800}}>
                {showModal === 'addResource' ? 'Add Document / Resource' : showModal === 'addVideo' ? 'Add Video' : showModal === 'post' ? 'New Discussion' : ''}
              </h3>
              <button onClick={() => {setShowModal(null); setSelectedPost(null); setSelectedVideo(null);}} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={24} color={showModal === 'playVideo' ? '#fff' : COLORS.gray500} /></button>
            </div>
            
            <div style={{padding: showModal === 'playVideo' ? '0' : '20px', overflowY: 'auto'}}>
              
              {/* ADD RESOURCE (UPDATED WITH FILE UPLOAD) */}
              {showModal === 'addResource' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input placeholder="Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <select value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}>
                     {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   
                   {/* File Upload Section */}
                   <div style={{border: `2px dashed ${COLORS.gray200}`, padding: '25px', borderRadius: '12px', textAlign: 'center', backgroundColor: COLORS.gray50}}>
                     {resourceForm.url ? (
                       <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: COLORS.sage}}>
                          <FileText size={24} />
                          <span style={{fontWeight: 'bold'}}>File Ready: {resourceForm.fileName || 'Document Uploaded'}</span>
                          <button onClick={() => setResourceForm(prev => ({...prev, url: '', fileName: ''}))} style={{marginLeft: '10px', color: COLORS.red, border: 'none', background: 'none'}}>Remove</button>
                       </div>
                     ) : (
                       <>
                         <input type="file" id="res-file" style={{display: 'none'}} onChange={(e) => handleFileUpload(e, setResourceForm, 'resourceFile')} accept=".pdf,.doc,.docx,.jpg,.png" />
                         <label htmlFor="res-file" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                           {uploadingFile ? <Loader className="spin" /> : <Upload size={32} color={COLORS.gray400} />}
                           <span style={{color: COLORS.gray500, fontWeight: '500'}}>{uploadingFile ? 'Uploading...' : 'Click to upload PDF, Word Doc, or Image'}</span>
                         </label>
                       </>
                     )}
                   </div>

                   {/* Optional Thumbnail */}
                   <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'}}>
                     <span>Optional Cover Image:</span>
                     <input type="file" onChange={(e) => handleFileUpload(e, setResourceForm, 'thumbnail')} accept="image/*" />
                   </div>

                   <button onClick={handleAddResource} disabled={uploadingFile || !resourceForm.url} style={{background: (uploadingFile || !resourceForm.url) ? COLORS.gray400 : COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>
                     {uploadingFile ? 'Please Wait...' : 'Add Resource'}
                   </button>
                </div>
              )}

              {/* POST FORM */}
              {showModal === 'post' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <select value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}>
                     {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                   <textarea placeholder="Content..." value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, minHeight: '150px'}} />
                   <button onClick={handleCreatePost} style={{background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Post</button>
                </div>
              )}

              {/* VIDEO FORM */}
              {showModal === 'addVideo' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input placeholder="Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <input placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <textarea placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, height: '80px'}} />
                   <button onClick={handleAddVideo} style={{background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Add Video</button>
                </div>
              )}

              {/* POST DETAIL */}
              {showModal === 'postDetail' && selectedPost && (
                <div>
                   <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                      {renderAvatar(selectedPost.author_profile_pic || selectedPost.authorProfilePic, 'medium')}
                      <div><h4 style={{margin: 0}}>{selectedPost.author}</h4><span style={{color: COLORS.gray400, fontSize: '12px'}}>{new Date(selectedPost.created_at).toLocaleString()}</span></div>
                   </div>
                   <h2 style={{marginTop: 0}}>{selectedPost.title}</h2>
                   <p style={{lineHeight: '1.6', color: COLORS.gray600, whiteSpace: 'pre-wrap'}}>{selectedPost.content}</p>
                   <div style={{marginTop: '20px'}}>
                     <h4 style={{marginBottom: '15px'}}>Comments</h4>
                     <div style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        {(selectedPost.comments || []).map((c, i) => (
                           <div key={i} style={{background: COLORS.gray50, padding: '15px', borderRadius: '10px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                                 {renderAvatar(c.authorProfilePic, 'small')}
                                 <span style={{fontWeight: 'bold', fontSize: '14px'}}>{c.author}</span>
                              </div>
                              <p style={{margin: 0, fontSize: '14px', paddingLeft: '45px'}}>{c.text}</p>
                           </div>
                        ))}
                     </div>
                     <div style={{display: 'flex', gap: '10px'}}>
                        <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." style={{flex: 1, padding: '12px', borderRadius: '20px', border: `1px solid ${COLORS.gray200}`}} />
                        <button onClick={handleAddComment} style={{background: COLORS.sage, color: COLORS.white, border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}><Send size={18} /></button>
                     </div>
                   </div>
                </div>
              )}

              {/* VIDEO PLAYER */}
              {showModal === 'playVideo' && selectedVideo && (
                <div style={{width: '100%', height: '500px'}}>
                   <iframe 
                     width="100%" 
                     height="100%" 
                     src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}?autoplay=1`} 
                     title={selectedVideo.title} 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                   ></iframe>
                </div>
              )}

              {/* PROFILE */}
              {showModal === 'profile' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'}}>
                   <div style={{position: 'relative'}}>
                      {renderAvatar(profileForm.profilePic, 'large')}
                      <label htmlFor="p-upload" style={{position: 'absolute', bottom: 0, right: 0, background: COLORS.sage, color: COLORS.white, padding: '6px', borderRadius: '50%', cursor: 'pointer'}}><ImageIcon size={16} /></label>
                      <input id="p-upload" type="file" style={{display: 'none'}} onChange={(e) => handleFileUpload(e, setProfileForm, 'profilePic')} accept="image/*" />
                   </div>
                   <input placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <input placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <button onClick={handleUpdateProfile} style={{width: '100%', background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Save Changes</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

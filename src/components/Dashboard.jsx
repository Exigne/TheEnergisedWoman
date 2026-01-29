import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon
} from 'lucide-react';

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
  const [uploadingImage, setUploadingImage] = useState(false);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '', thumbnail: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
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
        setImageError(false);
        loadAllData();
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem('wellnessUser');
      }
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

  const getVideoId = (url) => {
    if (!url) return null;
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        return id.length === 11 ? id : null;
      }
      if (url.includes('v=')) {
        const id = url.split('v=')[1].split('&')[0].split('?')[0];
        return id.length === 11 ? id : null;
      }
      if (url.includes('embed/')) {
        const id = url.split('embed/')[1].split('?')[0].split('&')[0];
        return id.length === 11 ? id : null;
      }
      return null;
    } catch (e) { 
      return null; 
    }
  };

  const openVideoPopup = (url) => {
    const videoId = getVideoId(url);
    if (!videoId) {
      window.open(url, '_blank');
      return;
    }
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1`;
    const width = 800;
    const height = 450;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      embedUrl, 
      'videoPlayer', 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
    );
  };

  const handleImageUpload = (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (field === 'profilePic') {
        setProfileForm(prev => ({...prev, profilePic: e.target.result}));
      } else if (field === 'thumbnail') {
        setVideoForm(prev => ({...prev, thumbnail: e.target.result}));
      }
      setImageError(false);
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to read image');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
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
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (err) { 
      alert('Connection failed. Please try again.'); 
    }
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
        const updatedUser = { 
          ...user, 
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          profilePic: profileForm.profilePic 
        };
        setUser(updatedUser);
        localStorage.setItem('wellnessUser', JSON.stringify(updatedUser));
        setImageError(false);
        setShowModal(null);
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  // OPTIMISTIC: Create new post - shows instantly
  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert("Please fill in both title and content");
      return;
    }
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user?.displayName || user?.email?.split('@')[0] || 'Anonymous');
    
    // Optimistic post - shows immediately
    const optimisticPost = {
      id: 'temp-' + Date.now(),
      title: postForm.title,
      content: postForm.content,
      category: postForm.category,
      author: authorName,
      author_profile_pic: profileForm.profilePic,
      likes: [],
      comments: [],
      created_at: new Date().toISOString(),
      _optimistic: true
    };
    
    // Add to top of list immediately (instant feedback)
    setDiscussions(prev => [optimisticPost, ...prev]);
    setPostForm({ title: '', content: '', category: 'General' });
    
    // If creating from modal, close it
    if (showModal === 'post') {
      setShowModal(null);
    }
    
    // Background API sync
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
        // Replace optimistic with real post (preserves ID)
        setDiscussions(prev => prev.map(p => 
          p.id === optimisticPost.id ? newPost : p
        ));
      } else {
        throw new Error('Failed to create post');
      }
    } catch (err) { 
      alert('Failed to save post - it will disappear on refresh');
      // Remove optimistic post on error
      setDiscussions(prev => prev.filter(p => p.id !== optimisticPost.id));
    }
  };

  // OPTIMISTIC: Like post - shows instantly
  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    
    // Get current state
    const targetPost = selectedPost?.id === postId ? selectedPost : discussions.find(d => d.id === postId);
    const isCurrentlyLiked = targetPost?.likes?.includes(user.id);
    
    // Optimistic update - calculate new likes immediately
    const newLikes = isCurrentlyLiked 
      ? (targetPost.likes || []).filter(id => id !== user.id)
      : [...(targetPost.likes || []), user.id];
    
    // Update selectedPost if viewing it
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({...selectedPost, likes: newLikes});
    }
    
    // Update discussions list
    setDiscussions(prev => prev.map(d => 
      d.id === postId ? {...d, likes: newLikes} : d
    ));
    
    // Background API sync (silent)
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      
      if (!res.ok) throw new Error('Failed to like');
      
      // Optional: sync with server response to ensure consistency
      const updatedPost = await res.json();
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(updatedPost);
      }
      setDiscussions(prev => prev.map(d => 
        d.id === postId ? updatedPost : d
      ));
    } catch (err) { 
      console.error('Like error:', err);
      // Revert on error
      loadAllData();
    }
  };

  // OPTIMISTIC: Add comment - shows instantly
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user.displayName || user.email.split('@')[0]);
    
    // Create optimistic comment
    const optimisticComment = {
      text: commentText,
      author: authorName,
      authorProfilePic: profileForm.profilePic,
      timestamp: new Date().toISOString(),
      _optimistic: true // Flag for styling if needed
    };
    
    // Update selected post immediately (instant feedback)
    const updatedPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), optimisticComment]
    };
    
    setSelectedPost(updatedPost);
    setDiscussions(prev => prev.map(d => 
      d.id === selectedPost.id ? updatedPost : d
    ));
    
    // Clear input immediately
    setCommentText('');
    
    // Background API sync
    try {
      const res = await fetch('/.netlify/functions/database?type=addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          comment: commentText,
          author: authorName,
          authorProfilePic: profileForm.profilePic
        })
      });
      
      if (res.ok) {
        const serverPost = await res.json();
        setSelectedPost(serverPost);
        setDiscussions(prev => prev.map(d => 
          d.id === selectedPost.id ? serverPost : d
        ));
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error('Comment error:', err);
      alert('Failed to save comment. It may disappear on refresh.');
      // Remove optimistic comment on error
      setSelectedPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => !c._optimistic)
      }));
    }
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) {
      alert("Title and URL required");
      return;
    }
    
    if (!getVideoId(videoForm.url)) {
      alert("Invalid YouTube URL");
      return;
    }
    
    try {
      const res = await fetch('/.netlify/functions/database?type=video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoForm.title,
          url: videoForm.url,
          description: videoForm.description,
          thumbnail: videoForm.thumbnail
        })
      });
      
      if (res.ok) {
        setVideoForm({ title: '', url: '', description: '', thumbnail: '' });
        setShowModal(null);
        loadAllData();
      } else {
        alert("Failed to add video");
      }
    } catch (err) { 
      alert("Failed to add video"); 
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) {
      alert("Title and URL required");
      return;
    }
    
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
      } else {
        alert("Failed to add resource");
      }
    } catch (err) { 
      alert("Failed to add resource"); 
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Delete this?")) {
      try {
        await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        loadAllData();
      } catch (err) { console.error('Delete error:', err); }
    }
  };

  const renderAvatar = (src, size = 'small') => {
    const isLarge = size === 'large';
    const isMedium = size === 'medium';
    const sizePx = isLarge ? '80px' : isMedium ? '40px' : '35px';
    const iconSize = isLarge ? 40 : isMedium ? 20 : 18;
    
    const baseStyle = {
      width: sizePx,
      height: sizePx,
      borderRadius: '50%',
      background: COLORS.gray100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      cursor: 'pointer',
      border: `2px solid ${src ? COLORS.sage : COLORS.gray200}`,
      flexShrink: 0
    };
    
    const isValidSrc = src && (src.startsWith('http') || src.startsWith('data:image'));
    
    if (!isValidSrc || imageError) {
      return (
        <div style={baseStyle}>
          <User size={iconSize} color={COLORS.gray500} />
        </div>
      );
    }
    
    return (
      <div style={baseStyle}>
        <img 
          src={src} 
          alt="Profile" 
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  if (!user) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.gray50}}>
        <div style={{background: COLORS.white, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color={COLORS.sage} />
            <h2 style={{color: COLORS.gray800}}>The Energised Woman Collective Login</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px', fontSize: '14px'}} 
              type="email" 
              placeholder="Email" 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)} 
              required
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px', fontSize: '14px'}} 
              type="password" 
              placeholder="Password" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              required
            />
            <button type="submit" style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '16px'}}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button 
            style={{background: 'none', border: 'none', color: COLORS.gray500, cursor: 'pointer', width: '100%', marginTop: '10px'}} 
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: COLORS.gray50, fontFamily: 'system-ui, sans-serif'}}>
      <header style={{background: COLORS.white, height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: `1px solid ${COLORS.gray200}`, position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px', color: COLORS.gray800}}>
          <Crown color={COLORS.sage} /> 
          <span>The Energised Woman Collective</span>
        </div>
        <nav style={{display: 'flex', gap: '8px', background: COLORS.gray100, padding: '5px', borderRadius: '12px'}}>
          <button 
            onClick={() => setActiveTab('community')} 
            style={activeTab === 'community' ? 
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'} : 
              {padding: '8px 20px', border: 'none', background: COLORS.transparent, cursor: 'pointer', borderRadius: '8px', color: COLORS.gray500}
            }
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('video')} 
            style={activeTab === 'video' ? 
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'} : 
              {padding: '8px 20px', border: 'none', background: COLORS.transparent, cursor: 'pointer', borderRadius: '8px', color: COLORS.gray500}
            }
          >
            Video Hub
          </button>
          <button 
            onClick={() => setActiveTab('resources')} 
            style={activeTab === 'resources' ? 
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'} : 
              {padding: '8px 20px', border: 'none', background: COLORS.transparent, cursor: 'pointer', borderRadius: '8px', color: COLORS.gray500}
            }
          >
            Resources
          </button>
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>
            {renderAvatar(profileForm.profilePic, 'small')}
          </div>
          <button 
            onClick={() => {localStorage.clear(); window.location.reload();}} 
            style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}
          >
            <LogOut size={20}/>
          </button>
        </div>
      </header>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        {/* Video Hub Tab */}
        {activeTab === 'video' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px'}}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
               <h2 style={{color: COLORS.gray800}}>Video Hub</h2>
               {isAdmin && (
                 <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('addVideo')}>
                   <Upload size={18}/> Add Video
                 </button>
               )}
            </div>
            
            {videos.length === 0 && (
              <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: COLORS.gray500}}>
                No videos yet. {isAdmin && "Add one!"}
              </div>
            )}

            {videos.map(v => {
              const videoId = getVideoId(v.url);
              const thumbnailUrl = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
              
              return (
                <div key={v.id} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`}}>
                  <div 
                    style={{
                      position: 'relative', 
                      width: '100%',
                      height: '200px',
                      background: '#000', 
                      cursor: 'pointer', 
                      overflow: 'hidden'
                    }}
                    onClick={() => openVideoPopup(v.url)}
                  >
                    {thumbnailUrl ? (
                      <>
                        <img 
                          src={thumbnailUrl}
                          alt={v.title}
                          style={{
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            if (v.thumbnail && videoId) {
                              e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            } else {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.fallback-placeholder').style.display = 'flex';
                            }
                          }}
                        />
                        <div className="fallback-placeholder" style={{
                          display: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(135deg, ${COLORS.sage} 0%, ${COLORS.mauve} 100%)`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Video size={48} color="white" />
                          <span style={{color: 'white', marginTop: '10px', fontSize: '14px'}}>Click to Play</span>
                        </div>
                        
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            background: 'rgba(162, 189, 145, 0.95)',
                            borderRadius: '50%',
                            width: '70px',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                          }}>
                            <PlayCircle size={40} color="white" fill="white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: COLORS.gray100
                      }}>
                        <Video size={48} color={COLORS.gray200} />
                        <p style={{color: COLORS.gray500, marginTop: '10px', fontSize: '14px'}}>Invalid URL</p>
                      </div>
                    )}
                  </div>
                  <div style={{padding: '15px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <h4 style={{margin: 0, flex: 1, fontSize: '16px', color: COLORS.gray800}}>{v.title}</h4>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(v.id, 'video');}} 
                          style={{background: 'none', border: 'none', color: COLORS.gray400, cursor: 'pointer', padding: '4px'}}
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                     </div>
                     <p style={{color: COLORS.gray500, fontSize: '14px', lineHeight: '1.5', marginTop: '8px'}}>{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              {GROUPS.map(g => (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)} 
                  style={activeGroup === g ? 
                    {textAlign: 'left', padding: '12px', background: 'rgba(179, 197, 151, 0.2)', border: 'none', borderRadius: '10px', color: COLORS.sage, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'} : 
                    {textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '10px'}
                  }
                >
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2 style={{color: COLORS.gray800}}>{activeGroup}</h2>
                <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('post')}>
                  <Plus size={18}/> New Post
                </button>
              </div>
              {discussions
                .filter(d => activeGroup === 'All Discussions' || d.category === activeGroup)
                .map(post => (
                  <div 
                    key={post.id} 
                    style={{background: COLORS.white, padding: '25px', borderRadius: '16px', border: `1px solid ${COLORS.gray200}`, marginBottom: '20px', cursor: 'pointer'}} 
                    onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                      <span style={{fontSize: '11px', background: 'rgba(179, 197, 151, 0.2)', color: COLORS.sage, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'}}>{post.category}</span>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} 
                          style={{background: 'none', border: 'none', color: COLORS.gray200, cursor: 'pointer'}}
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                    
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                      {renderAvatar(post.author_profile_pic, 'small')}
                      <div>
                        <div style={{fontWeight: '600', color: COLORS.gray800, fontSize: '14px'}}>{post.author}</div>
                        <div style={{fontSize: '12px', color: COLORS.gray400}}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <h3 style={{color: COLORS.gray800, marginTop: 0}}>{post.title}</h3>
                    <p style={{color: COLORS.gray500, fontSize: '14px', lineHeight: '1.5', marginTop: '8px'}}>{post.content}</p>
                    
                    <div style={{marginTop: '15px', display: 'flex', gap: '20px', fontSize: '13px', color: COLORS.gray400, alignItems: 'center'}}>
                      <button 
                        style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: post.likes?.includes(user.id) ? COLORS.sage : COLORS.gray400, padding: 0}} 
                        onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                      >
                        <Heart 
                          size={12} 
                          fill={post.likes?.includes(user.id) ? COLORS.sage : "none"} 
                        /> 
                        {post.likes?.length || 0}
                      </button>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <MessageCircle size={12}/> {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </section>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveResourceCategory(cat)} 
                  style={activeResourceCategory === cat ? 
                    {textAlign: 'left', padding: '12px', background: 'rgba(179, 197, 151, 0.2)', border: 'none', borderRadius: '10px', color: COLORS.sage, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'} : 
                    {textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '10px'}
                  }
                >
                  <Hash size={14} /> {cat}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2 style={{color: COLORS.gray800}}>{activeResourceCategory} Resources</h2>
                {isAdmin && (
                  <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('resource')}>
                    <Plus size={18}/> Add Resource
                  </button>
                )}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {resources
                  .filter(r => r.category === activeResourceCategory)
                  .map(r => (
                    <div key={r.id} style={{background: COLORS.white, padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.gray200}`, display: 'flex', alignItems: 'center', gap: '15px'}}>
                      <FileText color={COLORS.sage} />
                      <div style={{flex: 1}}>
                        <h4 style={{margin: 0, color: COLORS.gray800}}>{r.title}</h4>
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button 
                          onClick={() => window.open(r.url, '_blank')} 
                          style={{background: 'rgba(179, 197, 151, 0.2)', color: COLORS.sage, border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'}}
                        >
                          Open
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(r.id, 'resources')} 
                            style={{background: 'none', border: 'none', color: COLORS.gray400, cursor: 'pointer'}}
                          >
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === 'post' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3 style={{color: COLORS.gray800}}>New Discussion</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                <X size={24}/>
              </button>
            </div>
            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              value={postForm.category} 
              onChange={e => setPostForm({...postForm, category: e.target.value})}
            >
              {GROUPS.filter(g => g !== 'All Discussions').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Title" 
              value={postForm.title}
              onChange={e => setPostForm({...postForm, title: e.target.value})} 
            />
            <textarea 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px', height: '100px'}} 
              placeholder="Content" 
              value={postForm.content}
              onChange={e => setPostForm({...postForm, content: e.target.value})} 
            />
            <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleCreatePost}>
              Post Now
            </button>
          </div>
        </div>
      )}

      {showModal === 'postDetail' && selectedPost && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => {setShowModal(null); setSelectedPost(null);}}>
          <div style={{background: COLORS.white, borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
            <div style={{padding: '30px', borderBottom: `1px solid ${COLORS.gray200}`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <span style={{fontSize: '11px', background: 'rgba(179, 197, 151, 0.2)', color: COLORS.sage, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'}}>{selectedPost.category}</span>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                    {renderAvatar(selectedPost.author_profile_pic, 'medium')}
                    <div>
                      <h2 style={{margin: 0, color: COLORS.gray800, fontSize: '20px'}}>{selectedPost.title}</h2>
                      <div style={{fontSize: '13px', color: COLORS.gray400, display: 'flex', alignItems: 'center', gap: '6px'}}>
                        {selectedPost.author} • {new Date(selectedPost.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                </div>
                <button onClick={() => {setShowModal(null); setSelectedPost(null);}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                  <X size={24}/>
                </button>
              </div>
            </div>
            
            <div style={{padding: '30px', overflowY: 'auto', flex: 1}}>
              <p style={{fontSize: '16px', lineHeight: '1.6', color: COLORS.gray600}}>
                {selectedPost.content}
              </p>
              
              <div style={{marginTop: '30px', paddingTop: '20px', borderTop: `1px solid ${COLORS.gray200}`}}>
                <button 
                  onClick={() => handleLikePost(selectedPost.id)} 
                  style={selectedPost.likes?.includes(user.id) ? 
                    {background: 'rgba(179, 197, 151, 0.2)', border: `1px solid ${COLORS.sage}`, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.sage} : 
                    {background: COLORS.white, border: `1px solid ${COLORS.gray200}`, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.gray500}
                  }
                >
                  <Heart 
                    size={18} 
                    fill={selectedPost.likes?.includes(user.id) ? COLORS.sage : "none"} 
                  /> 
                  {selectedPost.likes?.length || 0} likes
                </button>
              </div>

              <div style={{marginTop: '30px'}}>
                <h3 style={{marginBottom: '20px', color: COLORS.gray800}}>
                  Comments ({selectedPost.comments?.length || 0})
                </h3>
                
                <div style={{display: 'flex', gap: '10px', marginBottom: '30px'}}>
                  {renderAvatar(profileForm.profilePic, 'small')}
                  <textarea 
                    style={{flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, minHeight: '80px'}}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', alignSelf: 'flex-end'}} onClick={handleAddComment}>
                    <Send size={18}/>
                  </button>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {selectedPost.comments && selectedPost.comments.map((comment, idx) => (
                    <div key={idx} style={{background: COLORS.gray50, padding: '15px', borderRadius: '12px', display: 'flex', gap: '12px', opacity: comment._optimistic ? 0.7 : 1}}>
                      {renderAvatar(comment.authorProfilePic, 'small')}
                      <div style={{flex: 1}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center'}}>
                          <span style={{fontWeight: 'bold', color: COLORS.gray800, fontSize: '14px'}}>{comment.author}</span>
                          <span style={{fontSize: '12px', color: COLORS.gray400}}>
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{color: COLORS.gray600, fontSize: '14px', lineHeight: '1.5', margin: 0}}>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'profile' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              {renderAvatar(profileForm.profilePic, 'large')}
              <p style={{fontSize: '12px', color: COLORS.gray500, marginTop: '10px'}}>
                Preview
              </p>
            </div>
            
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="First Name" 
              value={profileForm.firstName} 
              onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Last Name" 
              value={profileForm.lastName} 
              onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} 
            />
            
            <div style={{marginBottom: '15px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '5px', display: 'block'}}>
                Upload Profile Picture
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: COLORS.gray100, border: `2px dashed ${COLORS.gray200}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: COLORS.gray500}}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, setProfileForm, 'profilePic')}
                    style={{display: 'none'}}
                  />
                  <ImageIcon size={18} />
                  {uploadingImage ? 'Processing...' : 'Choose File'}
                </label>
                {profileForm.profilePic && (
                  <button 
                    onClick={() => {
                      setProfileForm({...profileForm, profilePic: ''});
                      setImageError(false);
                    }}
                    style={{background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: '13px'}}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p style={{fontSize: '11px', color: COLORS.gray400, marginTop: '5px'}}>
                Max 2MB. Stores in database.
              </p>
            </div>

            <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
              <div style={{flex: 1, height: '1px', background: COLORS.gray200}} />
              <span style={{padding: '0 10px', color: COLORS.gray400, fontSize: '12px'}}>OR</span>
              <div style={{flex: 1, height: '1px', background: COLORS.gray200}} />
            </div>

            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Paste Image URL" 
              value={profileForm.profilePic && profileForm.profilePic.startsWith('data:') ? '' : profileForm.profilePic}
              onChange={e => {
                setProfileForm({...profileForm, profilePic: e.target.value});
                setImageError(false);
              }} 
            />
            {imageError && (
              <p style={{color: COLORS.red, fontSize: '12px', marginBottom: '10px'}}>
                Failed to load image
              </p>
            )}
            <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleUpdateProfile}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {showModal === 'addVideo' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3 style={{color: COLORS.gray800}}>Add Video</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Title" 
              value={videoForm.title}
              onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="YouTube URL" 
              value={videoForm.url}
              onChange={e => setVideoForm({...videoForm, url: e.target.value})} 
            />
            <textarea 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Description" 
              value={videoForm.description}
              onChange={e => setVideoForm({...videoForm, description: e.target.value})} 
            />
            
            <div style={{marginBottom: '20px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: '500'}}>
                Thumbnail Image
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: COLORS.gray100, border: `2px dashed ${COLORS.gray200}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: COLORS.gray500, flex: 1}}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, setVideoForm, 'thumbnail')}
                    style={{display: 'none'}}
                  />
                  <Upload size={18} />
                  {videoForm.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </label>
                {videoForm.thumbnail && (
                  <button 
                    onClick={() => setVideoForm({...videoForm, thumbnail: ''})}
                    style={{background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: '13px', padding: '8px'}}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {videoForm.thumbnail && (
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                  <img 
                    src={videoForm.thumbnail} 
                    alt="Thumbnail preview" 
                    style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${COLORS.gray200}`}} 
                  />
                </div>
              )}
              
              <p style={{fontSize: '12px', color: COLORS.gray400, margin: 0}}>
                Optional: Upload a custom thumbnail (Max 2MB). If left empty, YouTube thumbnail will be used.
              </p>
            </div>

            <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleAddVideo}>
              Add to Hub
            </button>
          </div>
        </div>
      )}

      {showModal === 'resource' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3 style={{color: COLORS.gray800}}>Add Resource</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Title" 
              value={resourceForm.title}
              onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="URL" 
              value={resourceForm.url}
              onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
            />
            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              value={resourceForm.category}
              onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
            >
              {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleAddResource}>
              Save Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

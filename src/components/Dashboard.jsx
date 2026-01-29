import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  ExternalLink, Link2, BookOpen
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
  const [selectedResource, setSelectedResource] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(null);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '', thumbnail: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General', thumbnail: '' });
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

  // --- FIX 1: UPDATED VIDEO POPUP LOGIC ---
  const openVideoPopup = (url) => {
    const videoId = getVideoId(url);
    if (!videoId) {
      alert('Invalid video URL');
      return;
    }
    
    // Create embed URL with minimal controls
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    
    // 16:9 Aspect Ratio dimensions
    const width = 1024;
    const height = 576;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popupWindow = window.open(
      '', 
      'videoWindow', 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`
    );
    
    if (popupWindow) {
      popupWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Video Player</title>
          <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; width: 100%; height: 100%; }
            .video-container { position: relative; width: 100%; height: 100%; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="${embedUrl}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        </body>
        </html>
      `);
      popupWindow.document.close();
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageUpload = async (event, formSetter, field) => {
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
    try {
      const imageUrl = await uploadToCloudinary(file);
      
      if (field === 'profilePic') {
        setProfileForm(prev => ({...prev, profilePic: imageUrl}));
      } else if (field === 'thumbnail') {
        if (formSetter === setVideoForm) {
          setVideoForm(prev => ({...prev, thumbnail: imageUrl}));
        } else if (formSetter === setResourceForm) {
          setResourceForm(prev => ({...prev, thumbnail: imageUrl}));
        }
      }
      setImageError(false);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
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

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert("Please fill in both title and content");
      return;
    }
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user?.displayName || user?.email?.split('@')[0] || 'Anonymous');
    
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
    
    setDiscussions(prev => [optimisticPost, ...prev]);
    setPostForm({ title: '', content: '', category: 'General' });
    
    if (showModal === 'post') {
      setShowModal(null);
    }
    
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
        setDiscussions(prev => prev.map(p => 
          p.id === optimisticPost.id ? newPost : p
        ));
      } else {
        throw new Error('Failed to create post');
      }
    } catch (err) { 
      alert('Failed to save post - it will disappear on refresh');
      setDiscussions(prev => prev.filter(p => p.id !== optimisticPost.id));
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    
    const targetPost = selectedPost?.id === postId ? selectedPost : discussions.find(d => d.id === postId);
    const isCurrentlyLiked = targetPost?.likes?.includes(user.id);
    
    const newLikes = isCurrentlyLiked 
      ? (targetPost.likes || []).filter(id => id !== user.id)
      : [...(targetPost.likes || []), user.id];
    
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({...selectedPost, likes: newLikes});
    }
    
    setDiscussions(prev => prev.map(d => 
      d.id === postId ? {...d, likes: newLikes} : d
    ));
    
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      
      if (!res.ok) throw new Error('Failed to like');
      
      const updatedPost = await res.json();
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(updatedPost);
      }
      setDiscussions(prev => prev.map(d => 
        d.id === postId ? updatedPost : d
      ));
    } catch (err) { 
      console.error('Like error:', err);
      loadAllData();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user.displayName || user.email.split('@')[0]);
    
    const optimisticComment = {
      text: commentText,
      author: authorName,
      authorProfilePic: profileForm.profilePic,
      timestamp: new Date().toISOString(),
      _optimistic: true
    };
    
    const updatedPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), optimisticComment]
    };
    
    setSelectedPost(updatedPost);
    setDiscussions(prev => prev.map(d => 
      d.id === selectedPost.id ? updatedPost : d
    ));
    
    setCommentText('');
    
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
        body: JSON.stringify({
          title: resourceForm.title,
          url: resourceForm.url,
          category: resourceForm.category,
          thumbnail: resourceForm.thumbnail
        })
      });
      
      if (res.ok) {
        setResourceForm({ title: '', url: '', category: 'General', thumbnail: '' });
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
    if (window.confirm("Are you sure you want to delete this?")) {
      try {
        const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          // Immediately update local state
          if (type === 'discussion') {
            setDiscussions(prev => prev.filter(d => d.id !== id));
          } else if (type === 'video') {
            setVideos(prev => prev.filter(v => v.id !== id));
          } else if (type === 'resource') {
            setResources(prev => prev.filter(r => r.id !== id));
          }
          
          // Close modal if viewing deleted item
          if (selectedPost?.id === id || selectedResource?.id === id) {
            setShowModal(null);
            setSelectedPost(null);
            setSelectedResource(null);
          }
        } else {
          alert('Failed to delete. Please try again.');
        }
      } catch (err) { 
        console.error('Delete error:', err);
        alert('Failed to delete. Please try again.');
      }
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
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {discussions
                  .filter(d => activeGroup === 'All Discussions' || d.category === activeGroup)
                  .map(post => (
                    <div 
                      key={post.id} 
                      style={{
                        background: COLORS.white, 
                        padding: '28px', 
                        borderRadius: '16px', 
                        border: `1px solid ${hoveredPost === post.id ? COLORS.sage : COLORS.gray200}`, 
                        cursor: 'pointer',
                        boxShadow: hoveredPost === post.id ? '0 12px 24px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transform: hoveredPost === post.id ? 'translateY(-4px)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={() => setHoveredPost(post.id)}
                      onMouseLeave={() => setHoveredPost(null)}
                      onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          {renderAvatar(post.author_profile_pic || post.authorProfilePic, 'medium')}
                          <div>
                            <span style={{fontWeight: 'bold', color: COLORS.gray800, display: 'block'}}>{post.author}</span>
                            <span style={{fontSize: '12px', color: COLORS.gray400}}>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span style={{background: COLORS.gray100, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: COLORS.gray600, fontWeight: '500'}}>
                          {post.category}
                        </span>
                      </div>
                      
                      <h3 style={{margin: '0 0 10px 0', color: COLORS.gray800}}>{post.title}</h3>
                      <p style={{color: COLORS.gray500, lineHeight: '1.6', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                        {post.content}
                      </p>
                      
                      <div style={{display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.gray100}`}}>
                        <button style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: (post.likes || []).includes(user?.id) ? COLORS.red : COLORS.gray400, cursor: 'pointer'}}>
                          <Heart size={18} fill={(post.likes || []).includes(user?.id) ? COLORS.red : "none"} />
                          <span>{(post.likes || []).length}</span>
                        </button>
                        <button style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: COLORS.gray400}}>
                          <MessageCircle size={18} />
                          <span>{(post.comments || []).length}</span>
                        </button>
                        {isAdmin && (
                           <button 
                             onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}}
                             style={{marginLeft: 'auto', background: 'none', border: 'none', color: COLORS.gray400, cursor: 'pointer'}}
                           >
                             <Trash2 size={18} />
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
           <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
             <aside>
               {RESOURCE_CATEGORIES.map(c => (
                 <button
                   key={c}
                   onClick={() => setActiveResourceCategory(c)}
                   style={{
                     display: 'block',
                     width: '100%',
                     textAlign: 'left',
                     padding: '12px',
                     marginBottom: '5px',
                     borderRadius: '10px',
                     border: 'none',
                     background: activeResourceCategory === c ? COLORS.sageLight : 'transparent',
                     color: activeResourceCategory === c ? COLORS.white : COLORS.gray500,
                     fontWeight: activeResourceCategory === c ? 'bold' : 'normal',
                     cursor: 'pointer'
                   }}
                 >
                   {c}
                 </button>
               ))}
               {isAdmin && (
                 <button 
                   style={{marginTop: '20px', width: '100%', padding: '12px', background: COLORS.sage, color: COLORS.white, border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
                   onClick={() => setShowModal('addResource')}
                 >
                   <Plus size={16}/> Add Resource
                 </button>
               )}
             </aside>
             <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
               {resources
                 .filter(r => r.category === activeResourceCategory)
                 .map(r => (
                   <div 
                     key={r.id} 
                     onClick={() => {setSelectedResource(r); setShowModal('resourceDetail');}}
                     style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer', transition: 'transform 0.2s', ':hover': {transform: 'translateY(-4px)'}}}
                   >
                     <div style={{height: '140px', background: COLORS.gray100, position: 'relative'}}>
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        ) : (
                          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <BookOpen size={40} color={COLORS.gray400} />
                          </div>
                        )}
                        <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', color: COLORS.gray600}}>
                          {r.category}
                        </div>
                     </div>
                     <div style={{padding: '16px'}}>
                       <h4 style={{margin: '0 0 8px 0', color: COLORS.gray800}}>{r.title}</h4>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                         <span style={{fontSize: '12px', color: COLORS.sage, display: 'flex', alignItems: 'center', gap: '4px'}}>
                           <Link2 size={12}/> View Resource
                         </span>
                         {isAdmin && (
                           <button onClick={(e) => {e.stopPropagation(); handleDelete(r.id, 'resource');}} style={{border: 'none', background: 'none', color: COLORS.gray400, cursor: 'pointer'}}>
                             <Trash2 size={14}/>
                           </button>
                         )}
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
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: COLORS.white, width: '90%', maxWidth: '600px', borderRadius: '20px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <div style={{padding: '20px', borderBottom: `1px solid ${COLORS.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>
                {showModal === 'post' && 'New Discussion'}
                {showModal === 'addVideo' && 'Add Video'}
                {showModal === 'addResource' && 'Add Resource'}
                {showModal === 'profile' && 'Edit Profile'}
                {showModal === 'postDetail' && 'Discussion'}
                {showModal === 'resourceDetail' && 'Resource'}
              </h3>
              <button onClick={() => {setShowModal(null); setSelectedPost(null); setSelectedResource(null);}} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color={COLORS.gray500} />
              </button>
            </div>
            
            <div style={{padding: '20px', overflowY: 'auto'}}>
              {/* NEW POST FORM */}
              {showModal === 'post' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input 
                     placeholder="Title"
                     value={postForm.title}
                     onChange={e => setPostForm({...postForm, title: e.target.value})}
                     style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}
                   />
                   <select
                     value={postForm.category}
                     onChange={e => setPostForm({...postForm, category: e.target.value})}
                     style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}
                   >
                     {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                   <textarea
                     placeholder="What's on your mind?"
                     value={postForm.content}
                     onChange={e => setPostForm({...postForm, content: e.target.value})}
                     style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, minHeight: '150px'}}
                   />
                   <button onClick={handleCreatePost} style={{background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>
                     Post
                   </button>
                </div>
              )}

              {/* ADD VIDEO FORM */}
              {showModal === 'addVideo' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input placeholder="Video Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <input placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <textarea placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, height: '80px'}} />
                   <button onClick={handleAddVideo} style={{background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Add Video</button>
                </div>
              )}

              {/* ADD RESOURCE FORM */}
              {showModal === 'addResource' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                   <input placeholder="Resource Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <input placeholder="URL" value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   <select value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}>
                     {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <div style={{border: `1px dashed ${COLORS.gray200}`, padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                     {resourceForm.thumbnail ? (
                       <img src={resourceForm.thumbnail} style={{maxHeight: '100px', marginBottom: '10px'}} alt="Thumbnail" />
                     ) : <p style={{color: COLORS.gray400}}>No Thumbnail</p>}
                     <input type="file" onChange={(e) => handleImageUpload(e, setResourceForm, 'thumbnail')} style={{display: 'none'}} id="res-thumb-upload" />
                     <label htmlFor="res-thumb-upload" style={{color: COLORS.sage, cursor: 'pointer', fontWeight: 'bold'}}>{uploadingImage ? 'Uploading...' : 'Upload Thumbnail'}</label>
                   </div>
                   <button onClick={handleAddResource} style={{background: COLORS.sage, color: COLORS.white, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Add Resource</button>
                </div>
              )}

              {/* POST DETAIL VIEW */}
              {showModal === 'postDetail' && selectedPost && (
                <div>
                   <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                      {renderAvatar(selectedPost.author_profile_pic || selectedPost.authorProfilePic, 'medium')}
                      <div>
                        <h4 style={{margin: 0}}>{selectedPost.author}</h4>
                        <span style={{color: COLORS.gray400, fontSize: '12px'}}>{new Date(selectedPost.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                   <h2 style={{marginTop: 0}}>{selectedPost.title}</h2>
                   <p style={{lineHeight: '1.6', color: COLORS.gray600, whiteSpace: 'pre-wrap'}}>{selectedPost.content}</p>
                   
                   <div style={{display: 'flex', gap: '20px', padding: '20px 0', borderBottom: `1px solid ${COLORS.gray200}`}}>
                      <button onClick={() => handleLikePost(selectedPost.id)} style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: (selectedPost.likes || []).includes(user.id) ? COLORS.red : COLORS.gray500}}>
                         <Heart fill={(selectedPost.likes || []).includes(user.id) ? COLORS.red : 'none'} size={20}/> {(selectedPost.likes || []).length} Likes
                      </button>
                   </div>
                   
                   <div style={{marginTop: '20px'}}>
                     <h4 style={{marginBottom: '15px'}}>Comments</h4>
                     <div style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        {(selectedPost.comments || []).length === 0 && <p style={{color: COLORS.gray400, fontStyle: 'italic'}}>No comments yet. Be the first!</p>}
                        {(selectedPost.comments || []).map((c, i) => (
                           <div key={i} style={{background: COLORS.gray50, padding: '15px', borderRadius: '10px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                                 {renderAvatar(c.authorProfilePic, 'small')}
                                 <span style={{fontWeight: 'bold', fontSize: '14px'}}>{c.author}</span>
                                 <span style={{fontSize: '11px', color: COLORS.gray400}}>{new Date(c.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p style={{margin: 0, fontSize: '14px', paddingLeft: '45px'}}>{c.text}</p>
                           </div>
                        ))}
                     </div>
                     <div style={{display: 'flex', gap: '10px'}}>
                        <input 
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          style={{flex: 1, padding: '12px', borderRadius: '20px', border: `1px solid ${COLORS.gray200}`}}
                        />
                        <button onClick={handleAddComment} style={{background: COLORS.sage, color: COLORS.white, border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                           <Send size={18} />
                        </button>
                     </div>
                   </div>
                </div>
              )}

              {/* --- FIX 2: RESOURCE DETAIL MODAL (No Iframe) --- */}
              {showModal === 'resourceDetail' && selectedResource && (
                <div style={{textAlign: 'center', padding: '20px 0'}}>
                   <h2 style={{marginBottom: '10px'}}>{selectedResource.title}</h2>
                   <div style={{background: COLORS.gray50, padding: '40px', borderRadius: '16px', border: `2px dashed ${COLORS.gray200}`, margin: '20px 0'}}>
                      <ExternalLink size={48} color={COLORS.sage} style={{marginBottom: '15px'}}/>
                      <h3 style={{color: COLORS.gray600, margin: '0 0 10px 0'}}>Open Resource</h3>
                      <p style={{color: COLORS.gray500, marginBottom: '25px'}}>
                        This content opens in a new secure window to ensure the best viewing experience.
                      </p>
                      <a 
                        href={selectedResource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          background: COLORS.sage, 
                          color: COLORS.white, 
                          padding: '12px 30px', 
                          borderRadius: '12px', 
                          textDecoration: 'none', 
                          fontWeight: 'bold',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        Open Resource Now
                      </a>
                   </div>
                   <p style={{color: COLORS.gray400, fontSize: '12px', wordBreak: 'break-all'}}>{selectedResource.url}</p>
                </div>
              )}

              {/* PROFILE EDIT */}
              {showModal === 'profile' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'}}>
                   <div style={{position: 'relative'}}>
                      {renderAvatar(profileForm.profilePic, 'large')}
                      <label htmlFor="profile-upload" style={{position: 'absolute', bottom: 0, right: 0, background: COLORS.sage, color: COLORS.white, padding: '6px', borderRadius: '50%', cursor: 'pointer'}}>
                         <ImageIcon size={16} />
                      </label>
                      <input id="profile-upload" type="file" style={{display: 'none'}} onChange={(e) => handleImageUpload(e, setProfileForm, 'profilePic')} />
                   </div>
                   {uploadingImage && <span style={{color: COLORS.sage, fontSize: '12px'}}>Uploading...</span>}
                   
                   <div style={{width: '100%', display: 'flex', gap: '10px'}}>
                      <input placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} style={{flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                      <input placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} style={{flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                   </div>
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

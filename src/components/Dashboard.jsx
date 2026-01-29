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
  const [selectedResource, setSelectedResource] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hoveredPost, setHoveredPost] = useState(null);
  
  // Loading States
  const [imageError, setImageError] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
      const dRes = await fetch('/.netlify/functions/database?type=discussions');
      const dData = await dRes.json();
      
      console.log('=== DISCUSSIONS DATA ===');
      console.log('Raw data:', dData);
      console.log('Is array?', Array.isArray(dData));
      if (Array.isArray(dData) && dData.length > 0) {
        console.log('First post structure:', dData[0]);
        console.log('First post comments:', dData[0].comments);
      }
      
      setDiscussions(Array.isArray(dData) ? dData : []);
      
      try {
        const vRes = await fetch('/.netlify/functions/database?type=videos');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVideos(Array.isArray(vData) ? vData : vData.data || []);
        }
      } catch (vErr) { console.error('Videos error', vErr); }
      
      try {
        const rRes = await fetch('/.netlify/functions/database?type=resources');
        if (rRes.ok) {
          const rData = await rRes.json();
          setResources(Array.isArray(rData) ? rData : rData.data || []);
        }
      } catch (rErr) { console.error('Resources error', rErr); }
      
    } catch (err) { 
      console.error("Error loading data", err); 
    } finally { 
      setLoadingData(false); 
    }
  };

  const getVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
      url = url.trim();
      if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
      if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
      if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
      if (url.includes('youtube.com/shorts/')) return url.split('shorts/')[1].split('?')[0];
      return null;
    } catch (e) { return null; }
  };

  const uploadToCloudinary = async (file) => {
    console.group('🔵 Cloudinary Upload');
    console.log('File:', file.name);
    console.log('Type:', file.type);
    console.log('Size:', (file.size / 1024).toFixed(2), 'KB');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    console.log('Uploading to:', uploadUrl);
    console.log('Resource type:', resourceType);
    
    try {
      const res = await fetch(uploadUrl, { 
        method: 'POST', 
        body: formData 
      });
      
      console.log('Status:', res.status, res.statusText);
      console.log('Headers:', [...res.headers.entries()]);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response text:', errorText);
        
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error?.message || errorMsg;
          console.error('Parsed error:', errorData);
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        
        console.error('❌ Upload failed:', errorMsg);
        console.groupEnd();
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      console.log('✅ Success! URL:', data.secure_url);
      console.groupEnd();
      return data.secure_url;
      
    } catch (err) {
      console.error('❌ Exception:', err.message);
      console.error('Full error:', err);
      console.groupEnd();
      throw err;
    }
  };

  const handleFileUpload = async (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('File upload initiated:', field, file.name);
    
    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max is 10MB.`);
      return;
    }
    
    setUploadingFile(true);
    setUploadError('');
    
    try {
      const fileUrl = await uploadToCloudinary(file);
      
      // Update appropriate form
      if (field === 'profilePic') {
        setProfileForm(prev => ({...prev, profilePic: fileUrl}));
      } else if (field === 'thumbnail') {
        if (formSetter === setVideoForm) {
          setVideoForm(prev => ({...prev, thumbnail: fileUrl}));
        } else if (formSetter === setResourceForm) {
          setResourceForm(prev => ({...prev, thumbnail: fileUrl}));
        }
      } else if (field === 'resourceFile') {
        setResourceForm(prev => ({ 
          ...prev, 
          url: fileUrl, 
          fileName: file.name 
        }));
      }
      
      alert('✅ File uploaded successfully!');
      
    } catch (err) {
      const errorMsg = err.message || 'Upload failed';
      setUploadError(errorMsg);
      alert(`❌ Upload failed: ${errorMsg}\n\nCheck browser console for details.`);
      console.error('Upload error:', err);
    } finally {
      setUploadingFile(false);
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
      alert('Connection failed.'); 
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
        const updatedUser = { ...user, ...profileForm };
        setUser(updatedUser);
        localStorage.setItem('wellnessUser', JSON.stringify(updatedUser));
        setShowModal(null);
        alert('Profile updated successfully!');
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
      : (user?.email?.split('@')[0] || 'Anonymous');
    
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
        setPostForm({ title: '', content: '', category: 'General' });
        setShowModal(null);
        loadAllData();
        alert('Post created successfully!');
      } else {
        alert('Failed to create post');
      }
    } catch (err) { 
      alert('Failed to create post');
      console.error('Post creation error:', err);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    
    // Optimistic update
    const updateLikes = (post) => {
      if (post.id !== postId) return post;
      const currentLikes = post.likes || [];
      const isLiked = currentLikes.includes(user.id);
      const newLikes = isLiked 
        ? currentLikes.filter(id => id !== user.id)
        : [...currentLikes, user.id];
      return { ...post, likes: newLikes };
    };
    
    setDiscussions(prev => prev.map(updateLikes));
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => updateLikes(prev));
    }
    
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      
      if (!res.ok) {
        // Revert on failure
        loadAllData();
      }
    } catch (err) {
      console.error('Like error:', err);
      loadAllData();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim()
      : (user?.email?.split('@')[0] || 'Anonymous');
    
    const tempComment = {
      text: commentText,
      author: authorName,
      authorProfilePic: profileForm.profilePic,
      timestamp: new Date().toISOString()
    };
    
    // Optimistic update
    const updatedPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), tempComment]
    };
    setSelectedPost(updatedPost);
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
        // Refresh to get server version
        const updatedRes = await fetch('/.netlify/functions/database?type=discussions');
        const updatedData = await updatedRes.json();
        const serverPost = Array.isArray(updatedData) 
          ? updatedData.find(d => d.id === selectedPost.id)
          : null;
        
        if (serverPost) {
          setSelectedPost(serverPost);
          setDiscussions(prev => prev.map(d => d.id === selectedPost.id ? serverPost : d));
        }
      } else {
        // Revert on failure
        setSelectedPost(selectedPost);
        alert('Failed to add comment');
      }
    } catch (err) {
      console.error('Comment error:', err);
      setSelectedPost(selectedPost);
      alert('Failed to add comment');
    }
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) {
      alert("Title and URL are required");
      return;
    }
    
    if (!getVideoId(videoForm.url)) {
      alert("Please enter a valid YouTube URL");
      return;
    }
    
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
        alert('Video added successfully!');
      } else {
        alert('Failed to add video');
      }
    } catch (err) { 
      alert("Failed to add video"); 
      console.error('Video add error:', err);
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) {
      alert("Title and Document/URL are required");
      return;
    }
    
    try {
      const res = await fetch('/.netlify/functions/database?type=resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      });
      
      if (res.ok) {
        setResourceForm({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
        setShowModal(null);
        loadAllData();
        alert('Resource added successfully!');
      } else {
        alert('Failed to add resource');
      }
    } catch (err) { 
      alert("Failed to add resource"); 
      console.error('Resource add error:', err);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        loadAllData();
        setShowModal(null);
        alert('Item deleted successfully');
      } else {
        alert('Failed to delete item');
      }
    } catch (err) { 
      alert('Failed to delete'); 
      console.error('Delete error:', err);
    }
  };

  const renderAvatar = (src, size = 'small') => {
    const sizePx = size === 'large' ? '80px' : size === 'medium' ? '40px' : '35px';
    const iconSize = size === 'large' ? 40 : size === 'medium' ? 20 : 18;
    
    return (
      <div style={{
        width: sizePx, 
        height: sizePx, 
        borderRadius: '50%', 
        background: COLORS.gray100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        border: `2px solid ${src ? COLORS.sage : COLORS.gray200}`, 
        flexShrink: 0
      }}>
        {src && !imageError ? (
          <img 
            src={src} 
            alt="Avatar" 
            style={{width: '100%', height: '100%', objectFit: 'cover'}} 
            onError={() => setImageError(true)} 
          />
        ) : (
          <User size={iconSize} color={COLORS.gray500} />
        )}
      </div>
    );
  };

  const Modal = ({ title, children, onClose }) => (
    <div 
      style={{
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: COLORS.white, 
          borderRadius: '20px', 
          width: '100%', 
          maxWidth: '600px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '25px', 
          borderBottom: `1px solid ${COLORS.gray100}`, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'sticky', 
          top: 0, 
          background: 'white', 
          zIndex: 10
        }}>
          <h3 style={{margin: 0, color: COLORS.gray800}}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: COLORS.gray400,
              padding: '5px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>
        <div style={{padding: '25px'}}>
          {children}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div style={{
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: COLORS.gray50
      }}>
        <div style={{
          background: COLORS.white, 
          padding: '40px', 
          borderRadius: '20px', 
          width: '100%', 
          maxWidth: '400px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color={COLORS.sage} />
            <h2 style={{color: COLORS.gray800}}>The Energised Woman Collective</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input 
              style={{
                width: '100%', 
                padding: '12px', 
                borderRadius: '10px', 
                border: `1px solid ${COLORS.gray200}`, 
                marginBottom: '15px'
              }} 
              type="email" 
              placeholder="Email" 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)} 
              required 
            />
            <input 
              style={{
                width: '100%', 
                padding: '12px', 
                borderRadius: '10px', 
                border: `1px solid ${COLORS.gray200}`, 
                marginBottom: '15px'
              }} 
              type="password" 
              placeholder="Password" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              required 
            />
            <button 
              type="submit" 
              style={{
                width: '100%', 
                background: COLORS.sage, 
                color: COLORS.white, 
                border: 'none', 
                padding: '14px', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                cursor: 'pointer'
              }}
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button 
            style={{
              width: '100%', 
              marginTop: '15px', 
              background: 'none', 
              border: 'none', 
              color: COLORS.gray500, 
              cursor: 'pointer'
            }} 
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
      {/* HEADER */}
      <header style={{
        background: COLORS.white, 
        height: '70px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 40px', 
        borderBottom: `1px solid ${COLORS.gray200}`, 
        position: 'sticky', 
        top: 0, 
        zIndex: 100
      }}>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          fontWeight: 'bold', 
          fontSize: '20px', 
          color: COLORS.gray800
        }}>
          <Crown color={COLORS.sage} /> 
          <span>The Energised Woman</span>
        </div>
        
        <nav style={{
          display: 'flex', 
          gap: '8px', 
          background: COLORS.gray100, 
          padding: '5px', 
          borderRadius: '12px'
        }}>
          {['community', 'video', 'resources'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              style={{
                padding: '8px 20px', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: activeTab === tab ? COLORS.white : 'transparent',
                color: activeTab === tab ? COLORS.sage : COLORS.gray500,
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'video' ? 'Video Hub' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>
            {renderAvatar(profileForm.profilePic)}
          </div>
          <button 
            onClick={() => {localStorage.clear(); window.location.reload();}} 
            style={{
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: COLORS.gray400
            }}
          >
            <LogOut size={20}/>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        
        {/* VIDEO HUB TAB */}
        {activeTab === 'video' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px'}}>
            <div style={{
              gridColumn: '1/-1', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px'
            }}>
              <h2 style={{color: COLORS.gray800}}>Video Hub</h2>
              {isAdmin && (
                <button 
                  style={{
                    background: COLORS.sage, 
                    color: COLORS.white, 
                    padding: '10px 20px', 
                    borderRadius: '10px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    border: 'none', 
                    display: 'flex', 
                    gap: '8px',
                    alignItems: 'center'
                  }} 
                  onClick={() => setShowModal('addVideo')}
                >
                  <Upload size={18}/> Add Video
                </button>
              )}
            </div>
            
            {videos.map(v => {
              const videoId = getVideoId(v.url);
              const thumbnailUrl = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
              
              return (
                <div 
                  key={v.id} 
                  style={{
                    background: COLORS.white, 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    border: `1px solid ${COLORS.gray200}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }} 
                  onClick={() => {setSelectedVideo(v); setShowModal('playVideo');}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    height: '200px', 
                    background: '#000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    position: 'relative'
                  }}>
                    {thumbnailUrl ? (
                      <img 
                        src={thumbnailUrl} 
                        alt={v.title}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                      />
                    ) : (
                      <Video size={48} color={COLORS.gray400} />
                    )}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)'
                    }}>
                      <PlayCircle size={60} color="white" fill="rgba(255,255,255,0.9)" />
                    </div>
                  </div>
                  <div style={{padding: '15px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <h4 style={{margin: 0, color: COLORS.gray800, flex: 1}}>{v.title}</h4>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(v.id, 'video');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: COLORS.gray400
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside>
              {GROUPS.map(g => (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)} 
                  style={{
                    width: '100%', 
                    textAlign: 'left', 
                    padding: '12px', 
                    marginBottom: '5px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    cursor: 'pointer',
                    background: activeGroup === g ? 'rgba(179, 197, 151, 0.2)' : 'transparent', 
                    color: activeGroup === g ? COLORS.sage : COLORS.gray500,
                    fontWeight: activeGroup === g ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            
            <section>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '30px'
              }}>
                <h2 style={{color: COLORS.gray800}}>{activeGroup}</h2>
                <button 
                  style={{
                    background: COLORS.sage, 
                    color: COLORS.white, 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '10px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px'
                  }} 
                  onClick={() => setShowModal('post')}
                >
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
                        border: `1px solid ${COLORS.gray200}`, 
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '16px'
                      }}>
                        <span style={{
                          fontSize: '12px', 
                          background: 'rgba(179, 197, 151, 0.15)', 
                          color: COLORS.sage, 
                          padding: '6px 14px', 
                          borderRadius: '20px', 
                          fontWeight: 'bold'
                        }}>
                          {post.category}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(post.id, 'discussion');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: COLORS.gray400,
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '14px', 
                        marginBottom: '16px'
                      }}>
                        {renderAvatar(post.author_profile_pic || post.authorProfilePic, 'medium')}
                        <div>
                          <span style={{fontWeight: '600', color: COLORS.gray800}}>
                            {post.author}
                          </span>
                          <span style={{
                            fontSize: '13px', 
                            color: COLORS.gray400, 
                            marginLeft: '10px'
                          }}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <h3 style={{margin: '0 0 12px 0', color: COLORS.gray800}}>
                        {post.title}
                      </h3>
                      <p style={{
                        color: COLORS.gray600, 
                        lineHeight: '1.6',
                        margin: '0 0 16px 0'
                      }}>
                        {post.content.substring(0, 200)}
                        {post.content.length > 200 ? '...' : ''}
                      </p>
                      
                      <div style={{
                        display: 'flex', 
                        gap: '24px', 
                        paddingTop: '16px', 
                        borderTop: `1px solid ${COLORS.gray100}`
                      }}>
                        <div style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: COLORS.gray500,
                          fontSize: '14px'
                        }}>
                          <Heart size={18} /> 
                          {(post.likes || []).length}
                        </div>
                        <div style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: COLORS.gray500,
                          fontSize: '14px'
                        }}>
                          <MessageCircle size={18} /> 
                          {(post.comments || []).length}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
            <aside>
              {RESOURCE_CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveResourceCategory(cat)} 
                  style={{
                    width: '100%', 
                    textAlign: 'left', 
                    padding: '12px', 
                    marginBottom: '5px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    cursor: 'pointer',
                    background: activeResourceCategory === cat ? COLORS.sageLight : 'transparent', 
                    color: activeResourceCategory === cat ? COLORS.white : COLORS.gray500,
                    fontWeight: activeResourceCategory === cat ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
              {isAdmin && (
                <button 
                  style={{
                    marginTop: '20px', 
                    width: '100%', 
                    padding: '12px', 
                    background: COLORS.sage, 
                    color: COLORS.white, 
                    border: 'none', 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '8px',
                    fontWeight: 'bold'
                  }} 
                  onClick={() => setShowModal('addResource')}
                >
                  <Plus size={16}/> Add Resource
                </button>
              )}
            </aside>
            
            <section style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '20px'
            }}>
              {resources
                .filter(r => activeResourceCategory === 'General' || r.category === activeResourceCategory)
                .map(res => (
                  <div 
                    key={res.id} 
                    style={{
                      background: COLORS.white, 
                      borderRadius: '15px', 
                      padding: '15px', 
                      border: `1px solid ${COLORS.gray200}`, 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }} 
                    onClick={() => {setSelectedResource(res); setShowModal('resourceDetail');}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      height: '140px', 
                      background: res.thumbnail ? '#000' : COLORS.gray50, 
                      borderRadius: '10px', 
                      marginBottom: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden'
                    }}>
                      {res.thumbnail ? (
                        <img 
                          src={res.thumbnail} 
                          alt={res.title}
                          style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                        />
                      ) : (
                        <FileText size={40} color={COLORS.sage} />
                      )}
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <div style={{flex: 1}}>
                        <h4 style={{margin: '0 0 5px 0', color: COLORS.gray800}}>
                          {res.title}
                        </h4>
                        <span style={{fontSize: '12px', color: COLORS.gray400}}>
                          {res.category}
                        </span>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(res.id, 'resource');
                          }} 
                          style={{
                            border: 'none', 
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: COLORS.gray400
                          }}
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </section>
          </div>
        )}
      </main>

      {/* MODALS - Continuing with Profile Modal... */}
      
      {showModal === 'profile' && (
        <Modal title="My Profile" onClose={() => setShowModal(null)}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <div style={{position: 'relative', display: 'inline-block'}}>
              {renderAvatar(profileForm.profilePic, 'large')}
              <label style={{
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                background: COLORS.sage, 
                color: 'white', 
                padding: '8px', 
                borderRadius: '50%', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${COLORS.white}`
              }}>
                <ImageIcon size={16} />
                <input 
                  type="file" 
                  style={{display: 'none'}} 
                  onChange={(e) => handleFileUpload(e, null, 'profilePic')} 
                  accept="image/*" 
                  disabled={uploadingFile}
                />
              </label>
            </div>
          </div>
          
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="First Name" 
            value={profileForm.firstName} 
            onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} 
          />
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="Last Name" 
            value={profileForm.lastName} 
            onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} 
          />
          
          <button 
            onClick={handleUpdateProfile} 
            disabled={uploadingFile}
            style={{
              width: '100%', 
              padding: '14px', 
              background: COLORS.sage, 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold',
              cursor: uploadingFile ? 'not-allowed' : 'pointer',
              opacity: uploadingFile ? 0.6 : 1
            }}
          >
            {uploadingFile ? 'Uploading...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {showModal === 'post' && (
        <Modal title="Create New Post" onClose={() => setShowModal(null)}>
          <select 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            value={postForm.category} 
            onChange={e => setPostForm({...postForm, category: e.target.value})}
          >
            {GROUPS.filter(g => g !== 'All Discussions').map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="Post Title" 
            value={postForm.title} 
            onChange={e => setPostForm({...postForm, title: e.target.value})} 
          />
          
          <textarea 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`, 
              height: '150px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }} 
            placeholder="What's on your mind?" 
            value={postForm.content} 
            onChange={e => setPostForm({...postForm, content: e.target.value})} 
          />
          
          <button 
            onClick={handleCreatePost} 
            style={{
              width: '100%', 
              padding: '14px', 
              background: COLORS.sage, 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Post to Community
          </button>
        </Modal>
      )}

      {showModal === 'postDetail' && selectedPost && (
        <Modal title={selectedPost.title} onClose={() => setShowModal(null)}>
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: `1px solid ${COLORS.gray100}`
          }}>
            {renderAvatar(selectedPost.author_profile_pic || selectedPost.authorProfilePic, 'medium')}
            <div>
              <div style={{fontWeight: 'bold', color: COLORS.gray800}}>
                {selectedPost.author}
              </div>
              <div style={{fontSize: '12px', color: COLORS.gray400}}>
                {new Date(selectedPost.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <p style={{
            lineHeight: '1.6', 
            whiteSpace: 'pre-wrap',
            color: COLORS.gray700,
            marginBottom: '20px'
          }}>
            {selectedPost.content}
          </p>
          
          <div style={{
            display: 'flex', 
            gap: '15px', 
            borderTop: `1px solid ${COLORS.gray100}`, 
            borderBottom: `1px solid ${COLORS.gray100}`,
            paddingTop: '20px',
            paddingBottom: '20px',
            marginBottom: '30px'
          }}>
            <button 
              onClick={() => handleLikePost(selectedPost.id)} 
              style={{
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: (selectedPost.likes || []).includes(user.id) ? COLORS.red : COLORS.gray500,
                fontSize: '15px',
                fontWeight: '500',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.gray50;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Heart 
                size={20} 
                fill={(selectedPost.likes || []).includes(user.id) ? COLORS.red : 'none'}
                stroke={(selectedPost.likes || []).includes(user.id) ? COLORS.red : 'currentColor'}
              />
              {(selectedPost.likes || []).length} {(selectedPost.likes || []).length === 1 ? 'Like' : 'Likes'}
            </button>
          </div>
          
          <div>
            <h4 style={{marginBottom: '20px', color: COLORS.gray800}}>
              Comments ({(selectedPost.comments || []).length})
            </h4>
            
            {(selectedPost.comments || []).length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: COLORS.gray400,
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              (selectedPost.comments || []).map((c, i) => (
                <div 
                  key={i} 
                  style={{
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '15px', 
                    background: COLORS.gray50, 
                    padding: '14px', 
                    borderRadius: '12px'
                  }}
                >
                  {renderAvatar(c.authorProfilePic)}
                  <div style={{flex: 1}}>
                    <div style={{
                      fontWeight: 'bold', 
                      fontSize: '13px',
                      color: COLORS.gray800,
                      marginBottom: '4px'
                    }}>
                      {c.author}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: COLORS.gray700,
                      lineHeight: '1.5',
                      marginBottom: '6px'
                    }}>
                      {c.text}
                    </div>
                    {c.timestamp && (
                      <div style={{
                        fontSize: '11px',
                        color: COLORS.gray400
                      }}>
                        {new Date(c.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <input 
                style={{
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: `1px solid ${COLORS.gray200}`,
                  fontSize: '14px'
                }} 
                placeholder="Add a comment..." 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button 
                onClick={handleAddComment} 
                disabled={!commentText.trim()}
                style={{
                  background: COLORS.sage, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  padding: '0 20px',
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  opacity: commentText.trim() ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={18}/>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModal === 'playVideo' && selectedVideo && (
        <Modal title={selectedVideo.title} onClose={() => setShowModal(null)}>
          <div style={{marginBottom: '20px'}}>
            <iframe 
              width="100%" 
              height="315" 
              src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}`}
              frameBorder="0" 
              allowFullScreen 
              style={{borderRadius: '12px'}}
              title={selectedVideo.title}
            />
          </div>
          {selectedVideo.description && (
            <p style={{
              marginTop: '20px', 
              color: COLORS.gray600,
              lineHeight: '1.6'
            }}>
              {selectedVideo.description}
            </p>
          )}
        </Modal>
      )}

      {showModal === 'addVideo' && (
        <Modal title="Add Video to Hub" onClose={() => setShowModal(null)}>
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="Video Title" 
            value={videoForm.title} 
            onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
          />
          
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...)" 
            value={videoForm.url} 
            onChange={e => setVideoForm({...videoForm, url: e.target.value})} 
          />
          
          <textarea 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`, 
              height: '100px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }} 
            placeholder="Description (optional)" 
            value={videoForm.description} 
            onChange={e => setVideoForm({...videoForm, description: e.target.value})} 
          />
          
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: COLORS.gray700
            }}>
              Custom Thumbnail (Optional)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileUpload(e, setVideoForm, 'thumbnail')}
              disabled={uploadingFile}
              style={{width: '100%'}}
            />
            {videoForm.thumbnail && (
              <img 
                src={videoForm.thumbnail} 
                alt="Thumbnail preview" 
                style={{
                  width: '100%', 
                  height: '120px', 
                  objectFit: 'cover', 
                  marginTop: '10px', 
                  borderRadius: '8px'
                }} 
              />
            )}
          </div>
          
          <button 
            onClick={handleAddVideo} 
            disabled={uploadingFile}
            style={{
              width: '100%', 
              padding: '14px', 
              background: COLORS.sage, 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold',
              cursor: uploadingFile ? 'not-allowed' : 'pointer',
              opacity: uploadingFile ? 0.6 : 1
            }}
          >
            {uploadingFile ? 'Uploading...' : 'Add to Video Hub'}
          </button>
        </Modal>
      )}

      {showModal === 'addResource' && (
        <Modal title="Upload Resource" onClose={() => setShowModal(null)}>
          <input 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '15px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            placeholder="Resource Title" 
            value={resourceForm.title} 
            onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
          />
          
          <select 
            style={{
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px', 
              borderRadius: '10px', 
              border: `1px solid ${COLORS.gray200}`
            }} 
            value={resourceForm.category} 
            onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
          >
            {RESOURCE_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 'bold',
              color: COLORS.gray700
            }}>
              Upload File or Document
            </label>
            <input 
              type="file" 
              onChange={(e) => handleFileUpload(e, setResourceForm, 'resourceFile')}
              disabled={uploadingFile}
              style={{width: '100%', marginBottom: '10px'}} 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
            />
            {resourceForm.fileName && (
              <div style={{
                padding: '10px',
                background: COLORS.gray50,
                borderRadius: '8px',
                fontSize: '13px',
                color: COLORS.gray600
              }}>
                ✓ File uploaded: {resourceForm.fileName}
              </div>
            )}
          </div>
          
          <div style={{
            padding: '15px',
            background: COLORS.gray50,
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: COLORS.gray600
          }}>
            <strong>OR</strong> paste a URL instead:
            <input 
              type="text"
              style={{
                width: '100%', 
                padding: '10px', 
                marginTop: '8px',
                borderRadius: '8px', 
                border: `1px solid ${COLORS.gray200}`
              }} 
              placeholder="https://..." 
              value={resourceForm.url}
              onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
              disabled={uploadingFile}
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: COLORS.gray700
            }}>
              Cover Image (Optional)
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, setResourceForm, 'thumbnail')}
              disabled={uploadingFile}
              style={{width: '100%'}}
            />
            {resourceForm.thumbnail && (
              <div style={{position: 'relative', marginTop: '10px'}}>
                <img 
                  src={resourceForm.thumbnail} 
                  alt="Cover preview" 
                  style={{
                    width: '100%', 
                    height: '120px', 
                    objectFit: 'cover', 
                    borderRadius: '10px'
                  }} 
                />
                <button 
                  onClick={() => setResourceForm(prev => ({...prev, thumbnail: ''}))}
                  style={{
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    background: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    padding: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAddResource} 
            disabled={uploadingFile || (!resourceForm.url && !resourceForm.fileName)}
            style={{
              width: '100%', 
              padding: '14px', 
              background: (uploadingFile || (!resourceForm.url && !resourceForm.fileName)) ? COLORS.gray200 : COLORS.sage, 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: (uploadingFile || (!resourceForm.url && !resourceForm.fileName)) ? 'not-allowed' : 'pointer'
            }}
          >
            {uploadingFile ? 'Uploading...' : 'Publish Resource'}
          </button>
        </Modal>
      )}

      {showModal === 'resourceDetail' && selectedResource && (
        <Modal title={selectedResource.title} onClose={() => setShowModal(null)}>
          {selectedResource.thumbnail && (
            <img 
              src={selectedResource.thumbnail} 
              alt={selectedResource.title}
              style={{
                width: '100%', 
                height: '200px', 
                objectFit: 'cover', 
                borderRadius: '12px',
                marginBottom: '20px'
              }} 
            />
          )}
          
          <div style={{
            display: 'inline-block',
            fontSize: '12px', 
            background: 'rgba(179, 197, 151, 0.15)', 
            color: COLORS.sage, 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {selectedResource.category}
          </div>
          
          {selectedResource.fileName && (
            <p style={{
              color: COLORS.gray500, 
              fontSize: '14px', 
              marginBottom: '24px'
            }}>
              📄 {selectedResource.fileName}
            </p>
          )}
          
          <button 
            onClick={() => window.open(selectedResource.url, '_blank')}
            style={{
              width: '100%',
              background: COLORS.sage, 
              color: COLORS.white, 
              border: 'none', 
              padding: '16px 32px', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Link2 size={20} />
            Open Resource
          </button>
        </Modal>
      )}

      {uploadingFile && (
        <div style={{
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: COLORS.white, 
          padding: '15px 25px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          zIndex: 2000
        }}>
          <Loader className="animate-spin" color={COLORS.sage} size={20} />
          <span style={{fontWeight: '500', color: COLORS.gray800}}>
            Uploading file to Cloudinary...
          </span>
        </div>
      )}
      
      {uploadError && (
        <div style={{
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: COLORS.red, 
          color: COLORS.white,
          padding: '15px 25px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          zIndex: 2000,
          maxWidth: '400px'
        }}>
          <X 
            size={20} 
            style={{cursor: 'pointer'}} 
            onClick={() => setUploadError('')}
          />
          <span style={{fontWeight: '500'}}>
            {uploadError}
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

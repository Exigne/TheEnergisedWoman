import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  ExternalLink, Link2
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
  const [selectedVideo, setSelectedVideo] = useState(null);
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
          if (type === 'discussion') {
            setDiscussions(prev => prev.filter(d => d.id !== id));
          } else if (type === 'video') {
            setVideos(prev => prev.filter(v => v.id !== id));
          } else if (type === 'resource') {
            setResources(prev => prev.filter(r => r.id !== id));
          }
          
          if (selectedPost?.id === id || selectedResource?.id === id || selectedVideo?.id === id) {
            setShowModal(null);
            setSelectedPost(null);
            setSelectedResource(null);
            setSelectedVideo(null);
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
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer'} : 
              {padding: '8px 20px', border: 'none', background: COLORS.transparent, cursor: 'pointer', borderRadius: '8px', color: COLORS.gray500}
            }
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('video')} 
            style={activeTab === 'video' ? 
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer'} : 
              {padding: '8px 20px', border: 'none', background: COLORS.transparent, cursor: 'pointer', borderRadius: '8px', color: COLORS.gray500}
            }
          >
            Video Hub
          </button>
          <button 
            onClick={() => setActiveTab('resources')} 
            style={activeTab === 'resources' ? 
              {padding: '8px 20px', border: 'none', background: COLORS.white, color: COLORS.sage, borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer'} : 
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
                    onClick={() => {setSelectedVideo(v); setShowModal('videoDetail');}}
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

        {/* Community Tab with Card Styling */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              {GROUPS.map(g => (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)} 
                  style={activeGroup === g ? 
                    {textAlign: 'left', padding: '12px', background: 'rgba(179, 197, 151, 0.2)', border: 'none', borderRadius: '10px', color: COLORS.sage, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'} : 
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
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
                        <span style={{
                          fontSize: '12px', 
                          background: 'rgba(179, 197, 151, 0.15)', 
                          color: COLORS.sage, 
                          padding: '6px 14px', 
                          borderRadius: '20px', 
                          fontWeight: 'bold',
                          letterSpacing: '0.3px'
                        }}>
                          {post.category}
                        </span>
                        {isAdmin && (
                          <button 
                            onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} 
                            style={{background: 'none', border: 'none', color: COLORS.gray200, cursor: 'pointer'}}
                          >
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px'}}>
                        {renderAvatar(post.author_profile_pic, 'small')}
                        <div>
                          <div style={{fontWeight: '600', color: COLORS.gray800, fontSize: '15px'}}>{post.author}</div>
                          <div style={{fontSize: '13px', color: COLORS.gray400, marginTop: '2px'}}>
                            {new Date(post.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <h3 style={{color: COLORS.gray800, margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold', lineHeight: '1.3'}}>
                        {post.title}
                      </h3>
                      
                      <p style={{
                        color: COLORS.gray600, 
                        fontSize: '15px', 
                        lineHeight: '1.6', 
                        margin: '0 0 20px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {post.content}
                      </p>
                      
                      <div style={{
                        marginTop: 'auto', 
                        display: 'flex', 
                        gap: '24px', 
                        fontSize: '14px', 
                        color: COLORS.gray500, 
                        alignItems: 'center',
                        paddingTop: '16px',
                        borderTop: `1px solid ${COLORS.gray100}`
                      }}>
                        <button 
                          style={{
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            color: post.likes?.includes(user.id) ? COLORS.sage : COLORS.gray500, 
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }} 
                          onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                        >
                          <Heart 
                            size={16} 
                            fill={post.likes?.includes(user.id) ? COLORS.sage : "none"} 
                          /> 
                          {post.likes?.length || 0}
                        </button>
                        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <MessageCircle size={16}/> {post.comments?.length || 0} comments
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '25px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
               <h2 style={{color: COLORS.gray800}}>{activeResourceCategory} Resources</h2>
               {isAdmin && (
                 <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('resource')}>
                   <Plus size={18}/> Add Resource
                 </button>
               )}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
              <aside style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                {RESOURCE_CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveResourceCategory(cat)} 
                    style={activeResourceCategory === cat ? 
                      {textAlign: 'left', padding: '12px', background: 'rgba(179, 197, 151, 0.2)', border: 'none', borderRadius: '10px', color: COLORS.sage, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'} : 
                      {textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: '10px'}
                    }
                  >
                    <Hash size={14} /> {cat}
                  </button>
                ))}
              </aside>
              
              <section>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px'}}>
                  {resources
                    .filter(r => r.category === activeResourceCategory)
                    .map(r => (
                      <div 
                        key={r.id} 
                        style={{
                          background: COLORS.white, 
                          borderRadius: '16px', 
                          overflow: 'hidden', 
                          border: `1px solid ${COLORS.gray200}`, 
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {setSelectedResource(r); setShowModal('resourceDetail');}}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                        }}
                      >
                        <div style={{
                          position: 'relative', 
                          width: '100%',
                          height: '180px',
                          background: r.thumbnail ? '#000' : `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.mauve} 100%)`, 
                          overflow: 'hidden'
                        }}>
                          {r.thumbnail ? (
                            <img 
                              src={r.thumbnail}
                              alt={r.title}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                          ) : (
                            <div style={{
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexDirection: 'column'
                            }}>
                              <FileText size={48} color="white" />
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(255,255,255,0.9)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: COLORS.sage,
                            textTransform: 'uppercase'
                          }}>
                            {r.category}
                          </div>
                        </div>
                        <div style={{padding: '20px'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                            <h4 style={{margin: 0, flex: 1, fontSize: '16px', color: COLORS.gray800, fontWeight: 'bold'}}>{r.title}</h4>
                            {isAdmin && (
                              <button 
                                onClick={(e) => {e.stopPropagation(); handleDelete(r.id, 'resource');}} 
                                style={{background: 'none', border: 'none', color: COLORS.gray400, cursor: 'pointer', padding: '4px'}}
                              >
                                <Trash2 size={16}/>
                              </button>
                            )}
                          </div>
                          <p style={{color: COLORS.gray500, fontSize: '13px', margin: '0', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <Link2 size={12} /> Click to view
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                
                {resources.filter(r => r.category === activeResourceCategory).length === 0 && (
                  <div style={{textAlign: 'center', padding: '60px', color: COLORS.gray500, background: COLORS.white, borderRadius: '16px', border: `1px solid ${COLORS.gray200}`}}>
                    <FileText size={48} color={COLORS.gray200} style={{marginBottom: '16px'}} />
                    <p>No resources in this category yet.</p>
                    {isAdmin && <p style={{fontSize: '14px', marginTop: '8px'}}>Add one!</p>}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Post Modal */}
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

      {/* Post Detail Modal */}
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

      {/* Video Detail Modal */}
      {showModal === 'videoDetail' && selectedVideo && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => {setShowModal(null); setSelectedVideo(null);}}>
          <div style={{background: COLORS.white, borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'}} onClick={e => e.stopPropagation()}>
            <div style={{padding: '20px', borderBottom: `1px solid ${COLORS.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0, color: COLORS.gray800}}>{selectedVideo.title}</h3>
              <button onClick={() => {setShowModal(null); setSelectedVideo(null);}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                <X size={24}/>
              </button>
            </div>
            
            <div style={{position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000'}}>
              <iframe 
                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {selectedVideo.description && (
              <div style={{padding: '20px'}}>
                <p style={{color: COLORS.gray600, lineHeight: '1.6', margin: 0}}>{selectedVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Detail Modal - In app with iframe */}
      {showModal === 'resourceDetail' && selectedResource && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => {setShowModal(null); setSelectedResource(null);}}>
          <div style={{background: COLORS.white, borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'}} onClick={e => e.stopPropagation()}>
            {selectedResource.thumbnail && (
              <div style={{
                width: '100%',
                height: '200px',
                background: '#000',
                position: 'relative'
              }}>
                <img 
                  src={selectedResource.thumbnail} 
                  alt={selectedResource.title}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'rgba(255,255,255,0.95)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: COLORS.sage,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {selectedResource.category}
                </div>
              </div>
            )}
            
            <div style={{padding: '30px', borderBottom: `1px solid ${COLORS.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{flex: 1}}>
                <h2 style={{margin: '0 0 8px 0', color: COLORS.gray800, fontSize: '24px', fontWeight: 'bold'}}>{selectedResource.title}</h2>
                <p style={{margin: 0, color: COLORS.gray500, fontSize: '14px'}}>External Resource • {selectedResource.category}</p>
              </div>
              <button onClick={() => {setShowModal(null); setSelectedResource(null);}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400, padding: '8px'}}>
                <X size={28}/>
              </button>
            </div>

            <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
              <div style={{flex: 1, overflow: 'hidden', background: COLORS.white}}>
                <iframe 
                  src={selectedResource.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  title={selectedResource.title}
                />
              </div>
              
              <div style={{padding: '20px', borderTop: `1px solid ${COLORS.gray200}`, background: COLORS.gray50, display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center'}}>
                <button 
                  onClick={() => window.open(selectedResource.url, '_blank')}
                  style={{
                    background: COLORS.sage, 
                    color: COLORS.white, 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    fontSize: '14px'
                  }}
                >
                  <ExternalLink size={18} />
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
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

      {/* Add Video Modal */}
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

      {/* Add Resource Modal */}
      {showModal === 'resource' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
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
            
            <div style={{marginBottom: '20px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: '500'}}>
                Thumbnail Image
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: COLORS.gray100, border: `2px dashed ${COLORS.gray200}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: COLORS.gray500, flex: 1}}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, setResourceForm, 'thumbnail')}
                    style={{display: 'none'}}
                  />
                  <Upload size={18} />
                  {resourceForm.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </label>
                {resourceForm.thumbnail && (
                  <button 
                    onClick={() => setResourceForm({...resourceForm, thumbnail: ''})}
                    style={{background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: '13px', padding: '8px'}}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {resourceForm.thumbnail && (
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                  <img 
                    src={resourceForm.thumbnail} 
                    alt="Thumbnail preview" 
                    style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${COLORS.gray200}`}} 
                  />
                </div>
              )}
              
              <p style={{fontSize: '12px', color: COLORS.gray400, margin: 0}}>
                Optional: Upload a thumbnail image (Max 2MB). If left empty, a default icon will be shown.
              </p>
            </div>

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

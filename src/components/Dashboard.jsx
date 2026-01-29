import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  ExternalLink, Link2, BookOpen
} from 'lucide-react';

const CLOUDINARY_CLOUD_NAME = 'dyitrwe5h';
const CLOUDINARY_UPLOAD_PRESET = 'wellness_profile_pics';

const COLORS = {
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(null);

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

  // FIXED: Removed space in URL template literal
  const uploadToCloudinary = async (file, type = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const resourceType = type === 'image' || file.type.startsWith('image/') ? 'image' : 'raw';
    
    // FIXED: Removed space after v1_1/
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  };

  const handleImageUpload = async (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadToCloudinary(file, 'image');
      
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
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File must be smaller than 10MB');
      return;
    }

    setUploadingFile(true);
    try {
      const fileUrl = await uploadToCloudinary(file, 'raw');
      setResourceForm(prev => ({
        ...prev, 
        url: fileUrl,
        fileName: file.name
      }));
      alert('File uploaded successfully!');
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
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
      alert('Connection failed'); 
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
        setImageError(false);
        setShowModal(null);
      }
    } catch (err) {
      alert('Failed to update');
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
    
    if (showModal === 'post') setShowModal(null);
    
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
    } catch (err) { 
      setDiscussions(prev => prev.filter(p => p.id !== optimisticPost.id));
      alert('Failed to save post');
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    const targetPost = selectedPost?.id === postId ? selectedPost : discussions.find(d => d.id === postId);
    const isCurrentlyLiked = targetPost?.likes?.includes(user.id);
    const newLikes = isCurrentlyLiked 
      ? (targetPost.likes || []).filter(id => id !== user.id)
      : [...(targetPost.likes || []), user.id];
    
    if (selectedPost && selectedPost.id === postId) setSelectedPost({...selectedPost, likes: newLikes});
    setDiscussions(prev => prev.map(d => d.id === postId ? {...d, likes: newLikes} : d));
    
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      if (!res.ok) throw new Error('Failed');
    } catch (err) { 
      loadAllData();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user.email.split('@')[0]);
    
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
    setDiscussions(prev => prev.map(d => d.id === selectedPost.id ? updatedPost : d));
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
        setDiscussions(prev => prev.map(d => d.id === selectedPost.id ? serverPost : d));
      }
    } catch (err) {
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
        body: JSON.stringify(videoForm)
      });
      if (res.ok) {
        setVideoForm({ title: '', url: '', description: '', thumbnail: '' });
        setShowModal(null);
        loadAllData();
      }
    } catch (err) { 
      alert("Failed to add video"); 
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) {
      alert("Title and Document required");
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
          thumbnail: resourceForm.thumbnail,
          fileName: resourceForm.fileName
        })
      });
      
      if (res.ok) {
        setResourceForm({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
        setShowModal(null);
        loadAllData();
      }
    } catch (err) { 
      alert("Failed to add resource"); 
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Delete this item?")) {
      try {
        const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          if (type === 'discussion') setDiscussions(prev => prev.filter(d => d.id !== id));
          if (type === 'video') setVideos(prev => prev.filter(v => v.id !== id));
          if (type === 'resource') setResources(prev => prev.filter(r => r.id !== id));
          setShowModal(null);
        }
      } catch (err) { 
        alert('Failed to delete');
      }
    }
  };

  const renderAvatar = (src, size = 'small') => {
    const sizePx = size === 'large' ? '80px' : size === 'medium' ? '40px' : '35px';
    const iconSize = size === 'large' ? 40 : size === 'medium' ? 20 : 18;
    
    const baseStyle = {
      width: sizePx, height: sizePx, borderRadius: '50%', background: COLORS.gray100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      border: `2px solid ${src ? COLORS.sage : COLORS.gray200}`, flexShrink: 0
    };
    
    if (!src || imageError) {
      return (
        <div style={baseStyle}>
          <User size={iconSize} color={COLORS.gray500} />
        </div>
      );
    }
    
    return (
      <div style={baseStyle}>
        <img src={src} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={() => setImageError(true)} />
      </div>
    );
  };

  if (!user) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.gray50}}>
        <div style={{background: COLORS.white, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color={COLORS.sage} />
            <h2 style={{color: COLORS.gray800}}>The Energised Woman Collective</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            <button type="submit" style={{width: '100%', background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button style={{width: '100%', marginTop: '15px', background: 'none', border: 'none', color: COLORS.gray500, cursor: 'pointer'}} onClick={() => setIsRegistering(!isRegistering)}>
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
          <span>The Energised Woman</span>
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
              {tab === 'video' ? 'Video Hub' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>
            {renderAvatar(profileForm.profilePic)}
          </div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
            <LogOut size={20}/>
          </button>
        </div>
      </header>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        {/* Video Hub */}
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
            
            {videos.map(v => {
              const videoId = getVideoId(v.url);
              // FIXED: Removed space in template literal
              const thumbnailUrl = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
              
              return (
                <div key={v.id} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`}}>
                  <div style={{position: 'relative', width: '100%', height: '200px', background: '#000', cursor: 'pointer'}} onClick={() => {setSelectedVideo(v); setShowModal('videoPlayer');}}>
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Video size={48} color={COLORS.gray200} />
                      </div>
                    )}
                    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)'}}>
                      <PlayCircle size={50} color="white" fill="white" />
                    </div>
                  </div>
                  <div style={{padding: '15px'}}>
                    <h4 style={{margin: 0, color: COLORS.gray800}}>{v.title}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Community */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeGroup === g ? 'rgba(179, 197, 151, 0.2)' : 'transparent', 
                  color: activeGroup === g ? COLORS.sage : COLORS.gray500
                }}>
                  {g}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2 style={{color: COLORS.gray800}}>{activeGroup}</h2>
                <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => setShowModal('post')}>
                  New Post
                </button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                  <div key={post.id} onClick={() => {setSelectedPost(post); setShowModal('postDetail');}} style={{
                    background: COLORS.white, padding: '20px', borderRadius: '16px', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer'
                  }}>
                    <h3>{post.title}</h3>
                    <p>{post.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Resources - Grid Layout */}
        {activeTab === 'resources' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
               <h2 style={{color: COLORS.gray800}}>{activeResourceCategory} Resources</h2>
               {isAdmin && (
                 <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => setShowModal('addResource')}>
                   <Plus size={18}/> Add Resource
                 </button>
               )}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
              <aside>
                {RESOURCE_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveResourceCategory(cat)} style={{
                    width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: activeResourceCategory === cat ? COLORS.sageLight : 'transparent', 
                    color: activeResourceCategory === cat ? COLORS.white : COLORS.gray500
                  }}>
                    {cat}
                  </button>
                ))}
              </aside>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px'}}>
                {resources.filter(r => r.category === activeResourceCategory).map(r => (
                  <div key={r.id} onClick={() => {setSelectedResource(r); setShowModal('resourceDetail');}} style={{
                    background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer'
                  }}>
                    <div style={{
                      height: '180px', 
                      background: r.thumbnail ? '#000' : `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.mauve} 100%)`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {r.thumbnail ? (
                        <img src={r.thumbnail} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <FileText size={48} color="white" />
                      )}
                    </div>
                    <div style={{padding: '20px'}}>
                      <h4 style={{margin: '0 0 8px 0', color: COLORS.gray800}}>{r.title}</h4>
                      <span style={{fontSize: '13px', color: COLORS.sage, display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <BookOpen size={14}/> View Details
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Post Modal */}
      {showModal === 'post' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <h3>New Discussion</h3>
            <select style={{width: '100%', padding: '12px', marginBottom: '15px'}} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input style={{width: '100%', padding: '12px', marginBottom: '15px'}} placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <textarea style={{width: '100%', padding: '12px', marginBottom: '15px', height: '100px'}} placeholder="Content" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={{width: '100%', padding: '12px', background: COLORS.sage, color: 'white', border: 'none', borderRadius: '10px'}} onClick={handleCreatePost}>Post</button>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {showModal === 'postDetail' && selectedPost && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: '30px'}} onClick={e => e.stopPropagation()}>
            <h2>{selectedPost.title}</h2>
            <p>{selectedPost.content}</p>
            <button onClick={() => handleLikePost(selectedPost.id)}>
              <Heart fill={selectedPost.likes?.includes(user.id) ? COLORS.sage : "none"} /> 
              {selectedPost.likes?.length || 0}
            </button>
            
            <div style={{marginTop: '20px'}}>
              <h4>Comments</h4>
              {selectedPost.comments?.map((c, i) => (
                <div key={i} style={{padding: '10px', background: COLORS.gray50, marginBottom: '10px', borderRadius: '8px'}}>
                  <strong>{c.author}</strong>: {c.text}
                </div>
              ))}
              <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <input style={{flex: 1, padding: '10px'}} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." />
                <button style={{padding: '10px 20px', background: COLORS.sage, color: 'white', border: 'none', borderRadius: '8px'}} onClick={handleAddComment}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showModal === 'videoPlayer' && selectedVideo && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{width: '90%', maxWidth: '900px'}} onClick={e => e.stopPropagation()}>
            <iframe 
              width="100%" 
              height="500" 
              // FIXED: Removed space in template literal
              src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}?autoplay=1`}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      {showModal === 'resourceDetail' && selectedResource && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'}} onClick={e => e.stopPropagation()}>
            
            {selectedResource.thumbnail ? (
              <img src={selectedResource.thumbnail} alt="" style={{width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', marginBottom: '20px'}} />
            ) : (
              <div style={{width: '120px', height: '120px', borderRadius: '16px', background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.mauve} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
                <FileText size={48} color="white" />
              </div>
            )}
            
            <span style={{
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
            </span>
            
            <h2 style={{margin: '0 0 10px 0', color: COLORS.gray800, fontSize: '24px'}}>
              {selectedResource.title}
            </h2>
            
            {selectedResource.fileName && (
              <p style={{color: COLORS.gray500, fontSize: '14px', marginBottom: '24px'}}>
                File: {selectedResource.fileName}
              </p>
            )}
            
            <button 
              onClick={() => window.open(selectedResource.url, '_blank')}
              style={{
                background: COLORS.sage, 
                color: COLORS.white, 
                border: 'none', 
                padding: '16px 32px', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                fontSize: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <ExternalLink size={20} />
              Open Document
            </button>
            
            <button 
              onClick={() => setShowModal(null)}
              style={{
                background: 'transparent',
                color: COLORS.gray500,
                border: 'none',
                padding: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showModal === 'profile' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              {renderAvatar(profileForm.profilePic, 'large')}
            </div>
            <input style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: `1px solid ${COLORS.gray200}`}} placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
            <input style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: `1px solid ${COLORS.gray200}`}} placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
            
            <div style={{marginBottom: '15px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500}}>Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, setProfileForm, 'profilePic')}
                style={{display: 'block', marginTop: '5px'}}
              />
              {uploadingImage && <span style={{fontSize: '12px', color: COLORS.gray500}}>Uploading...</span>}
            </div>
            
            <button style={{width: '100%', padding: '12px', background: COLORS.sage, color: 'white', border: 'none', borderRadius: '8px'}} onClick={handleUpdateProfile}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showModal === 'addVideo' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <h3>Add Video</h3>
            <input style={{width: '100%', padding: '12px', marginBottom: '15px'}} placeholder="Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
            <input style={{width: '100%', padding: '12px', marginBottom: '15px'}} placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} />
            <textarea style={{width: '100%', padding: '12px', marginBottom: '15px'}} placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
            
            <div style={{marginBottom: '15px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500}}>Thumbnail (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, setVideoForm, 'thumbnail')}
                style={{display: 'block', marginTop: '5px'}}
              />
              {videoForm.thumbnail && (
                <img src={videoForm.thumbnail} alt="Preview" style={{width: '100%', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px'}} />
              )}
            </div>
            
            <button style={{width: '100%', padding: '12px', background: COLORS.sage, color: 'white', border: 'none', borderRadius: '8px'}} onClick={handleAddVideo}>
              Add Video
            </button>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal === 'addResource' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3 style={{color: COLORS.gray800, margin: 0}}>Add Resource</h3>
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

            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              value={resourceForm.category}
              onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
            >
              {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* File Upload Section */}
            <div style={{marginBottom: '20px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: 'bold'}}>
                Document File
              </label>
              
              {resourceForm.url ? (
                <div style={{
                  padding: '15px', 
                  background: 'rgba(162, 189, 145, 0.1)', 
                  borderRadius: '10px', 
                  border: `1px solid ${COLORS.sage}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <FileText size={24} color={COLORS.sage} />
                    <div>
                      <p style={{margin: 0, fontWeight: 'bold', color: COLORS.gray800, fontSize: '14px'}}>
                        {resourceForm.fileName || 'Document uploaded'}
                      </p>
                      <p style={{margin: 0, fontSize: '12px', color: COLORS.gray500}}>Ready to save</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setResourceForm(prev => ({...prev, url: '', fileName: ''}))}
                    style={{background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer'}}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div style={{
                  border: `2px dashed ${COLORS.gray200}`, 
                  padding: '30px', 
                  borderRadius: '12px', 
                  textAlign: 'center',
                  background: COLORS.gray50,
                  marginBottom: '10px'
                }}>
                  <input 
                    type="file" 
                    id="resource-file-upload"
                    style={{display: 'none'}} 
                    onChange={handleDocumentUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" 
                  />
                  <label htmlFor="resource-file-upload" style={{cursor: 'pointer', display: 'block'}}>
                    {uploadingFile ? (
                      <div style={{color: COLORS.gray500}}>Uploading to Cloudinary...</div>
                    ) : (
                      <>
                        <Upload size={32} color={COLORS.gray400} style={{marginBottom: '8px'}} />
                        <div style={{color: COLORS.gray500, fontWeight: '500', marginBottom: '4px'}}>
                          Click to upload file
                        </div>
                        <div style={{fontSize: '12px', color: COLORS.gray400'}}>
                          PDF, Word, or Image (Max 10MB)
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: 'bold'}}>
                OR Paste URL
              </label>
              <input 
                style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} 
                placeholder="https://..." 
                value={resourceForm.url}
                onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
              />
            </div>

            {/* Thumbnail Upload */}
            <div style={{marginBottom: '25px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: 'bold'}}>
                Cover Image (Optional)
              </label>
              
              {resourceForm.thumbnail ? (
                <div style={{position: 'relative', marginBottom: '10px'}}>
                  <img 
                    src={resourceForm.thumbnail} 
                    alt="Thumbnail" 
                    style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px'}} 
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
                      padding: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <input 
                    type="file" 
                    id="resource-thumbnail-upload"
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={(e) => handleImageUpload(e, setResourceForm, 'thumbnail')}
                  />
                  <label 
                    htmlFor="resource-thumbnail-upload" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 15px',
                      background: COLORS.gray50,
                      border: `2px dashed ${COLORS.gray200}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: COLORS.gray500,
                      width: 'fit-content'
                    }}
                  >
                    <ImageIcon size={18} />
                    {uploadingImage ? 'Uploading...' : 'Add Cover Image'}
                  </label>
                </div>
              )}
            </div>

            <button 
              style={{
                width: '100%', 
                padding: '14px', 
                background: resourceForm.title && resourceForm.url ? COLORS.sage : COLORS.gray200, 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: resourceForm.title && resourceForm.url ? 'pointer' : 'not-allowed',
                fontSize: '16px'
              }} 
              onClick={handleAddResource}
              disabled={!resourceForm.title || !resourceForm.url}
            >
              Save Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

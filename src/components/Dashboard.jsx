import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon
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
  const [uploadingImage, setUploadingImage] = useState(false);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
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
      console.log("Videos loaded:", v); // Debug log
      setDiscussions(Array.isArray(d) ? d : []);
      setVideos(Array.isArray(v) ? v : []);
      setResources(Array.isArray(r) ? r : []);
    } catch (err) { 
      console.error("Error loading data", err); 
    }
  };

  // FIXED: More robust video ID extraction
  const getVideoId = (url) => {
    if (!url) {
      console.log("No URL provided");
      return null;
    }
    try {
      // Handle youtu.be format
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        console.log("Extracted ID from youtu.be:", id);
        return id.length === 11 ? id : null;
      }
      // Handle youtube.com/watch?v= format
      if (url.includes('v=')) {
        const id = url.split('v=')[1].split('&')[0].split('?')[0];
        console.log("Extracted ID from watch?v=:", id);
        return id.length === 11 ? id : null;
      }
      // Handle youtube.com/embed/ format
      if (url.includes('embed/')) {
        const id = url.split('embed/')[1].split('?')[0].split('&')[0];
        console.log("Extracted ID from embed:", id);
        return id.length === 11 ? id : null;
      }
      console.log("Could not extract ID from URL:", url);
      return null;
    } catch (e) { 
      console.error("Error extracting video ID:", e);
      return null; 
    }
  };

  // Video player popup - shows only video, minimal UI
  const openVideoPopup = (url) => {
    const videoId = getVideoId(url);
    if (!videoId) {
      window.open(url, '_blank');
      return;
    }
    
    // Clean embed URL - shows video only
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

  // File upload handler - converts to base64
  const handleImageUpload = (event) => {
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
      setProfileForm({...profileForm, profilePic: e.target.result});
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

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert("Please fill in both title and content");
      return;
    }
    
    try {
      const res = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: postForm.title,
          content: postForm.content,
          category: postForm.category,
          userEmail: user.email
        })
      });
      
      if (res.ok) {
        setPostForm({ title: '', content: '', category: 'General' });
        setShowModal(null);
        await loadAllData();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create post");
      }
    } catch (err) { 
      alert('Failed to create post'); 
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      if (res.ok) {
        await loadAllData();
        if (selectedPost && selectedPost.id === postId) {
          const updated = discussions.find(d => d.id === postId);
          if (updated) setSelectedPost(updated);
        }
      }
    } catch (err) { console.error('Error liking:', err); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    const authorName = profileForm.firstName 
      ? `${profileForm.firstName} ${profileForm.lastName}`.trim() 
      : (user.displayName || user.email.split('@')[0]);
    
    try {
      const res = await fetch('/.netlify/functions/database?type=addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          comment: commentText,
          author: authorName
        })
      });
      
      if (res.ok) {
        setCommentText('');
        await loadAllData();
        const updated = discussions.find(d => d.id === selectedPost.id);
        if (updated) setSelectedPost(updated);
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) {
      alert("Title and URL required");
      return;
    }
    
    if (!getVideoId(videoForm.url)) {
      alert("Invalid YouTube URL. Must be youtube.com/watch?v=XXX or youtu.be/XXX");
      return;
    }
    
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
    const baseStyle = {
      width: isLarge ? '80px' : '35px',
      height: isLarge ? '80px' : '35px',
      borderRadius: '50%',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      cursor: 'pointer'
    };
    
    const isValidSrc = src && (src.startsWith('http') || src.startsWith('data:image'));
    
    if (!isValidSrc || imageError) {
      return (
        <div style={{...baseStyle, border: '2px solid #e2e8f0'}}>
          <User size={isLarge ? 40 : 18} color="#64748b" />
        </div>
      );
    }
    
    return (
      <div style={{...baseStyle, border: '2px solid #ec4899'}}>
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
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
        <div style={{background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color="#ec4899" />
            <h2>Collective Login</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '14px'}} 
              type="email" 
              placeholder="Email" 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)} 
              required
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '14px'}} 
              type="password" 
              placeholder="Password" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              required
            />
            <button type="submit" style={{background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '16px'}}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button 
            style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', width: '100%', marginTop: '10px'}} 
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif'}}>
      <header style={{background: 'white', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px'}}>
          <Crown color="#ec4899" /> 
          <span>The Collective</span>
        </div>
        <nav style={{display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px'}}>
          <button 
            onClick={() => setActiveTab('community')} 
            style={activeTab === 'community' ? 
              {padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold'} : 
              {padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b'}
            }
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('video')} 
            style={activeTab === 'video' ? 
              {padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold'} : 
              {padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b'}
            }
          >
            Video Hub
          </button>
          <button 
            onClick={() => setActiveTab('resources')} 
            style={activeTab === 'resources' ? 
              {padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold'} : 
              {padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b'}
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
            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}
          >
            <LogOut size={20}/>
          </button>
        </div>
      </header>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        {/* Video Hub Tab */}
        {activeTab === 'video' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px'}}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
               <h2>Video Hub</h2>
               {isAdmin && (
                 <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('addVideo')}>
                   <Upload size={18}/> Add Video
                 </button>
               )}
            </div>
            
            {videos.length === 0 && (
              <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b'}}>
                No videos yet. {isAdmin && "Add one!"}
              </div>
            )}

            {videos.map(v => {
              const videoId = getVideoId(v.url);
              // YouTube thumbnail URLs - try hqdefault first for better quality
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
              
              return (
                <div key={v.id} style={{background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
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
                    {videoId ? (
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
                            console.error("Thumbnail failed to load:", thumbnailUrl);
                            // Fallback to default quality
                            e.target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                            // If that also fails, hide image and show placeholder div
                            e.target.onerror = () => {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.fallback-placeholder').style.display = 'flex';
                            };
                          }}
                        />
                        {/* Fallback placeholder - hidden by default */}
                        <div className="fallback-placeholder" style={{
                          display: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Video size={48} color="white" />
                          <span style={{color: 'white', marginTop: '10px', fontSize: '14px'}}>Click to Play</span>
                        </div>
                        
                        {/* Play button overlay */}
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
                            background: 'rgba(236, 72, 153, 0.95)',
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
                        background: '#f1f5f9'
                      }}>
                        <Video size={48} color="#cbd5e1" />
                        <p style={{color: '#64748b', marginTop: '10px', fontSize: '14px'}}>Invalid URL</p>
                      </div>
                    )}
                  </div>
                  <div style={{padding: '15px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <h4 style={{margin: 0, flex: 1, fontSize: '16px'}}>{v.title}</h4>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(v.id, 'video');}} 
                          style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px'}}
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                     </div>
                     <p style={{color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginTop: '8px'}}>{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Other tabs remain same... */}
        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              {GROUPS.map(g => (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)} 
                  style={activeGroup === g ? 
                    {textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'} : 
                    {textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px'}
                  }
                >
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2>{activeGroup}</h2>
                <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('post')}>
                  <Plus size={18}/> New Post
                </button>
              </div>
              {discussions
                .filter(d => activeGroup === 'All Discussions' || d.category === activeGroup)
                .map(post => (
                  <div 
                    key={post.id} 
                    style={{background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer'}} 
                    onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                      <span style={{fontSize: '11px', background: '#fdf2f8', color: '#ec4899', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'}}>{post.category}</span>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} 
                          style={{background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer'}}
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                    <h3>{post.title}</h3>
                    <p style={{color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginTop: '8px'}}>{post.content}</p>
                    <div style={{marginTop: '15px', display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8', alignItems: 'center'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <User size={12}/> {post.author}
                      </span>
                      <button 
                        style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', padding: 0}} 
                        onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                      >
                        <Heart 
                          size={12} 
                          fill={post.likes?.includes(user.id) ? "#ec4899" : "none"} 
                          color={post.likes?.includes(user.id) ? "#ec4899" : "#94a3b8"}
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
                    {textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'} : 
                    {textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px'}
                  }
                >
                  <Hash size={14} /> {cat}
                </button>
              ))}
            </aside>
            <section>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h2>{activeResourceCategory} Resources</h2>
                {isAdmin && (
                  <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('resource')}>
                    <Plus size={18}/> Add Resource
                  </button>
                )}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {resources
                  .filter(r => r.category === activeResourceCategory)
                  .map(r => (
                    <div key={r.id} style={{background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px'}}>
                      <FileText color="#ec4899" />
                      <div style={{flex: 1}}>
                        <h4 style={{margin: 0}}>{r.title}</h4>
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button 
                          onClick={() => window.open(r.url, '_blank')} 
                          style={{background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'}}
                        >
                          Open
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(r.id, 'resources')} 
                            style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}
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
          <div style={{background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3>New Discussion</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}>
                <X size={24}/>
              </button>
            </div>
            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              value={postForm.category} 
              onChange={e => setPostForm({...postForm, category: e.target.value})}
            >
              {GROUPS.filter(g => g !== 'All Discussions').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Title" 
              value={postForm.title}
              onChange={e => setPostForm({...postForm, title: e.target.value})} 
            />
            <textarea 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', height: '100px'}} 
              placeholder="Content" 
              value={postForm.content}
              onChange={e => setPostForm({...postForm, content: e.target.value})} 
            />
            <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleCreatePost}>
              Post Now
            </button>
          </div>
        </div>
      )}

      {showModal === 'postDetail' && selectedPost && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}} onClick={() => {setShowModal(null); setSelectedPost(null);}}>
          <div style={{background: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
            <div style={{padding: '30px', borderBottom: '1px solid #e2e8f0'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <span style={{fontSize: '11px', background: '#fdf2f8', color: '#ec4899', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'}}>{selectedPost.category}</span>
                  <h2 style={{margin: '10px 0'}}>{selectedPost.title}</h2>
                  <div style={{fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <User size={12}/> {selectedPost.author}
                  </div>
                </div>
                <button onClick={() => {setShowModal(null); setSelectedPost(null);}} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}>
                  <X size={24}/>
                </button>
              </div>
            </div>
            
            <div style={{padding: '30px', overflowY: 'auto', flex: 1}}>
              <p style={{fontSize: '16px', lineHeight: '1.6', color: '#334155'}}>
                {selectedPost.content}
              </p>
              
              <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
                <button 
                  onClick={() => handleLikePost(selectedPost.id)} 
                  style={selectedPost.likes?.includes(user.id) ? 
                    {background: '#fdf2f8', border: '1px solid #ec4899', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899'} : 
                    {background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b'}
                  }
                >
                  <Heart 
                    size={18} 
                    fill={selectedPost.likes?.includes(user.id) ? "#ec4899" : "none"} 
                  /> 
                  {selectedPost.likes?.length || 0} likes
                </button>
              </div>

              <div style={{marginTop: '30px'}}>
                <h3 style={{marginBottom: '20px'}}>
                  Comments ({selectedPost.comments?.length || 0})
                </h3>
                
                <div style={{display: 'flex', gap: '10px', marginBottom: '30px'}}>
                  <textarea 
                    style={{flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px'}}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer'}} onClick={handleAddComment}>
                    <Send size={18}/>
                  </button>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {selectedPost.comments && selectedPost.comments.map((comment, idx) => (
                    <div key={idx} style={{background: '#f8fafc', padding: '15px', borderRadius: '12px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <span style={{fontWeight: 'bold', color: '#1e293b', fontSize: '14px'}}>{comment.author}</span>
                        <span style={{fontSize: '12px', color: '#94a3b8'}}>
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: 0}}>{comment.text}</p>
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
          <div style={{background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              {renderAvatar(profileForm.profilePic, 'large')}
              <p style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>
                Preview
              </p>
            </div>
            
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="First Name" 
              value={profileForm.firstName} 
              onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Last Name" 
              value={profileForm.lastName} 
              onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} 
            />
            
            {/* File Upload */}
            <div style={{marginBottom: '15px'}}>
              <label style={{fontSize: '14px', color: '#64748b', marginBottom: '5px', display: 'block'}}>
                Upload Profile Picture
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b'}}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
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
                    style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px'}}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p style={{fontSize: '11px', color: '#94a3b8', marginTop: '5px'}}>
                Max 2MB. Stores in database.
              </p>
            </div>

            <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
              <div style={{flex: 1, height: '1px', background: '#e2e8f0'}} />
              <span style={{padding: '0 10px', color: '#94a3b8', fontSize: '12px'}}>OR</span>
              <div style={{flex: 1, height: '1px', background: '#e2e8f0'}} />
            </div>

            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Paste Image URL" 
              value={profileForm.profilePic && profileForm.profilePic.startsWith('data:') ? '' : profileForm.profilePic}
              onChange={e => {
                setProfileForm({...profileForm, profilePic: e.target.value});
                setImageError(false);
              }} 
            />
            {imageError && (
              <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '10px'}}>
                Failed to load image
              </p>
            )}
            <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleUpdateProfile}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {showModal === 'addVideo' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3>Add Video</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Title" 
              value={videoForm.title}
              onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="YouTube URL" 
              value={videoForm.url}
              onChange={e => setVideoForm({...videoForm, url: e.target.value})} 
            />
            <textarea 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Description" 
              value={videoForm.description}
              onChange={e => setVideoForm({...videoForm, description: e.target.value})} 
            />
            <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleAddVideo}>
              Add to Hub
            </button>
          </div>
        </div>
      )}

      {showModal === 'resource' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3>Add Resource</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="Title" 
              value={resourceForm.title}
              onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              placeholder="URL" 
              value={resourceForm.url}
              onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
            />
            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px'}} 
              value={resourceForm.category}
              onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
            >
              {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={{background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleAddResource}>
              Save Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

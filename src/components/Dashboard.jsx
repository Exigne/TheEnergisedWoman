import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  Link2, BookOpen, FileText, Loader
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

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hoveredPost, setHoveredPost] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
      setDiscussions(Array.isArray(dData) ? dData : []);

      try {
        const vRes = await fetch('/.netlify/functions/database?type=videos');
        if (!vRes.ok) throw new Error('fail');
        const vData = await vRes.json();
        let videoArray = [];
        if (Array.isArray(vData)) videoArray = vData;
        else if (vData && Array.isArray(vData.data)) videoArray = vData.data;
        setVideos(videoArray);
      } catch (e) {
        setVideos([]);
      }
      
      try {
        const rRes = await fetch('/.netlify/functions/database?type=resources');
        if (!rRes.ok) throw new Error('fail');
        const rData = await rRes.json();
        let resourceArray = [];
        if (Array.isArray(rData)) resourceArray = rData;
        else if (rData && Array.isArray(rData.data)) resourceArray = rData.data;
        setResources(resourceArray);
      } catch (e) {
        setResources([]);
      }
    } catch (err) { 
      console.error(err); 
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
    } catch (e) { 
      return null; 
    }
  };

  const uploadToCloudinary = async (file) => {
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    try {
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('Network/CORS error');
      }
      throw err;
    }
  };

  const handleFileUpload = async (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be smaller than 10MB');
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
        setResourceForm(prev => ({...prev, url: fileUrl, fileName: file.name}));
      }
    } catch (err) {
      setUploadError(err.message);
      alert('Failed: ' + err.message);
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
        alert(data.message || 'Auth failed');
      }
    } catch (err) { alert('Connection failed'); }
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
      }
    } catch (err) { alert('Failed'); }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) return alert("Fill all fields");
    const authorName = profileForm.firstName ? `${profileForm.firstName} ${profileForm.lastName}` : 'Anonymous';
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
    setDiscussions(prev => prev.map(d => d.id === selectedPost.id ? updatedPost : p));
    setCommentText('');
    fetch('/.netlify/functions/database?type=addComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: selectedPost.id, comment: commentText, author: authorName, authorProfilePic: profileForm.profilePic })
    });
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) return alert("Title and URL required");
    if (!getVideoId(videoForm.url)) return alert("Invalid YouTube URL");
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
        alert(err.message || "Failed");
      }
    } catch (err) { alert("Failed: " + err.message); }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) return alert("Title and File required");
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
      }
    } catch (err) { alert("Failed: " + err.message); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete?")) return;
    try {
      const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'discussion') setDiscussions(prev => prev.filter(d => d.id !== id));
        if (type === 'video') setVideos(prev => prev.filter(v => v.id !== id));
        if (type === 'resource') setResources(prev => prev.filter(r => r.id !== id));
        setShowModal(null);
      }
    } catch (err) { alert('Failed'); }
  };

  const handleOpenResource = (resource) => {
    setSelectedResource(resource);
    setShowModal('resourceDetail');
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
        {activeTab === 'video' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{color: COLORS.gray800}}>Video Hub</h2>
              {isAdmin && (
                <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => setShowModal('addVideo')}>
                  <Upload size={18}/> Add Video
                </button>
              )}
            </div>
            
            {loadingData && <div>Loading videos...</div>}
            
            {!loadingData && videos.length === 0 && (
              <div style={{textAlign: 'center', padding: '40px'}}>
                No videos yet.
              </div>
            )}
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px'}}>
              {videos.map((v) => {
                if (!v || !v.url) return null;
                const videoId = getVideoId(v.url);
                const thumbnailUrl = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');
                
                return (
                  <div key={v.id} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`}}>
                    <div style={{position: 'relative', width: '100%', height: '200px', background: '#000', cursor: 'pointer'}} onClick={() => {setSelectedVideo(v); setShowModal('playVideo');}}>
                      {thumbnailUrl && (
                        <img src={thumbnailUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      )}
                      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)'}}>
                        <PlayCircle size={50} color="white" fill="white" />
                      </div>
                    </div>
                    <div style={{padding: '15px'}}>
                      <h4 style={{margin: 0, color: COLORS.gray800}}>{v.title}</h4>
                      {isAdmin && (
                        <button onClick={() => handleDelete(v.id, 'video')} style={{marginTop: '10px', color: 'red', border: 'none', background: 'none'}}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px'}}>
            <aside>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeGroup === g ? 'rgba(179,197,151,0.2)' : 'transparent', 
                  color: activeGroup === g ? COLORS.sage : COLORS.gray500, 
                  fontWeight: activeGroup === g ? 'bold' : 'normal'
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

        {activeTab === 'resources' && (
          <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
            <aside>
              {RESOURCE_CATEGORIES.map(c => (
                <button key={c} onClick={() => setActiveResourceCategory(c)} style={{
                  width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeResourceCategory === c ? COLORS.sageLight : 'transparent', 
                  color: activeResourceCategory === c ? COLORS.white : COLORS.gray500
                }}>
                  {c}
                </button>
              ))}
              {isAdmin && (
                <button style={{marginTop: '20px', width: '100%', padding: '12px', background: COLORS.sage, color: COLORS.white, border: 'none', borderRadius: '10px', cursor: 'pointer'}} onClick={() => setShowModal('addResource')}>
                  Add Resource
                </button>
              )}
            </aside>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px'}}>
              {resources.filter(r => r.category === activeResourceCategory).map(r => (
                <div key={r.id} onClick={() => handleOpenResource(r)} style={{
                  background: COLORS.white, borderRadius: '16px', padding: '20px', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer'
                }}>
                  <h4>{r.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '20px', borderRadius: '20px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto'}} onClick={e => e.stopPropagation()}>
            
            {showModal === 'addResource' && (
              <div>
                <h3>Add Resource</h3>
                {uploadError && <div style={{color: 'red'}}>{uploadError}</div>}
                <input placeholder="Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <div style={{border: '2px dashed gray', padding: '20px', textAlign: 'center'}}>
                  <input type="file" onChange={(e) => handleFileUpload(e, setResourceForm, 'resourceFile')} />
                </div>
                <button onClick={handleAddResource} disabled={uploadingFile} style={{marginTop: '10px', padding: '10px', width: '100%'}}>
                  {uploadingFile ? 'Uploading...' : 'Add'}
                </button>
              </div>
            )}

            {showModal === 'post' && (
              <div>
                <h3>New Post</h3>
                <input placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <textarea placeholder="Content" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} style={{width: '100%', padding: '10px', height: '100px'}} />
                <button onClick={handleCreatePost} style={{padding: '10px', width: '100%'}}>Post</button>
              </div>
            )}

            {showModal === 'addVideo' && (
              <div>
                <h3>Add Video</h3>
                <input placeholder="Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <input placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <button onClick={handleAddVideo} style={{padding: '10px', width: '100%'}}>Add</button>
              </div>
            )}

            {showModal === 'postDetail' && selectedPost && (
              <div>
                <h3>{selectedPost.title}</h3>
                <p>{selectedPost.content}</p>
              </div>
            )}

            {showModal === 'playVideo' && selectedVideo && (
              <div>
                <iframe 
                  width="100%" 
                  height="400" 
                  src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}`} 
                  frameBorder="0" 
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {showModal === 'resourceDetail' && selectedResource && (
              <div>
                <h3>{selectedResource.title}</h3>
                <button onClick={() => window.open(selectedResource.url, '_blank')}>Open</button>
              </div>
            )}

            {showModal === 'profile' && (
              <div>
                <h3>Profile</h3>
                <input placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <input placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '10px'}} />
                <input type="file" onChange={(e) => handleFileUpload(e, setProfileForm, 'profilePic')} />
                <button onClick={handleUpdateProfile} style={{padding: '10px', width: '100%', marginTop: '10px'}}>Save</button>
              </div>
            )}

            <button onClick={() => setShowModal(null)} style={{marginTop: '10px', padding: '10px', width: '100%'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

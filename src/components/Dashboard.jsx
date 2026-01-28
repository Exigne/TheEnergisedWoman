import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle
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
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (e) { 
      return null; 
    }
  };

  const openVideoPopup = (url) => {
    const width = Math.min(1200, window.screen.width - 100);
    const height = Math.min(800, window.screen.height - 100);
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      url, 
      'videoPlayer', 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
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
      alert("Invalid YouTube URL. Example: https://youtube.com/watch?v=dQw4w9WgXcQ");
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
    
    if (!src || imageError) {
      return (
        <div style={baseStyle}>
          <User size={isLarge ? 40 : 18} color="#64748b" />
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
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Crown size={40} color="#ec4899" />
            <h2>Collective Login</h2>
          </div>
          <form onSubmit={handleAuth}>
            <input 
              style={styles.input} 
              type="email" 
              placeholder="Email" 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)} 
              required
            />
            <input 
              style={styles.input} 
              type="password" 
              placeholder="Password" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              required
            />
            <button type="submit" style={styles.primaryButtonFull}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button 
            style={styles.ghostButtonFull} 
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <Crown color="#ec4899" /> 
          <span>The Collective</span>
        </div>
        <nav style={styles.centerNav}>
          <button 
            onClick={() => setActiveTab('community')} 
            style={activeTab === 'community' ? styles.navBtnActive : styles.navBtn}
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('video')} 
            style={activeTab === 'video' ? styles.navBtnActive : styles.navBtn}
          >
            Video Hub
          </button>
          <button 
            onClick={() => setActiveTab('resources')} 
            style={activeTab === 'resources' ? styles.navBtnActive : styles.navBtn}
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
            style={styles.iconBtn}
          >
            <LogOut size={20}/>
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Community Tab */}
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)} 
                  style={activeGroup === g ? styles.sidebarBtnActive : styles.sidebarBtn}
                >
                  <Hash size={14} /> {g}
                </button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}>
                <h2>{activeGroup}</h2>
                <button style={styles.primaryButton} onClick={() => setShowModal('post')}>
                  <Plus size={18}/> New Post
                </button>
              </div>
              {discussions
                .filter(d => activeGroup === 'All Discussions' || d.category === activeGroup)
                .map(post => (
                  <div 
                    key={post.id} 
                    style={styles.card} 
                    onClick={() => {setSelectedPost(post); setShowModal('postDetail');}}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.tag}>{post.category}</span>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} 
                          style={styles.delBtn}
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                    <h3>{post.title}</h3>
                    <p style={styles.cardExcerpt}>{post.content}</p>
                    <div style={styles.cardMeta}>
                      <span style={styles.metaItem}>
                        <User size={12}/> {post.author}
                      </span>
                      <button 
                        style={styles.metaBtn} 
                        onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                      >
                        <Heart 
                          size={12} 
                          fill={post.likes?.includes(user.id) ? "#ec4899" : "none"} 
                          color={post.likes?.includes(user.id) ? "#ec4899" : "#94a3b8"}
                        /> 
                        {post.likes?.length || 0}
                      </button>
                      <span style={styles.metaItem}>
                        <MessageCircle size={12}/> {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </section>
          </div>
        )}

        {/* Video Hub Tab with Thumbnails */}
        {activeTab === 'video' && (
          <div style={styles.videoGrid}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
               <h2>Video Hub</h2>
               {isAdmin && (
                 <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}>
                   <Upload size={18}/> Add Video
                 </button>
               )}
            </div>
            {videos.map(v => {
              const videoId = getVideoId(v.url);
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
              
              return (
                <div key={v.id} style={styles.videoCard}>
                  <div 
                    style={styles.videoThumbnailWrapper}
                    onClick={() => openVideoPopup(v.url)}
                  >
                    {videoId && thumbnailUrl ? (
                      <>
                        <img 
                          src={thumbnailUrl}
                          alt={v.title}
                          style={styles.videoThumbnail}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div style={styles.fallbackThumbnail} className="fallback">
                          <Video size={48} color="#cbd5e1" />
                        </div>
                        <div style={styles.playButtonOverlay}>
                          <div style={styles.playCircle}>
                            <PlayCircle size={40} color="white" fill="rgba(236, 72, 153, 0.9)" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={styles.videoPlaceholder}>
                        <Video size={48} color="#cbd5e1" />
                        <p style={{color: '#64748b', marginTop: '10px', fontSize: '14px'}}>Invalid YouTube URL</p>
                      </div>
                    )}
                  </div>
                  <div style={{padding: '15px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <h4 style={{margin: 0, flex: 1, fontSize: '16px'}}>{v.title}</h4>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {e.stopPropagation(); handleDelete(v.id, 'video');}} 
                          style={styles.delBtn}
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                     </div>
                     <p style={styles.cardExcerpt}>{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveResourceCategory(cat)} 
                  style={activeResourceCategory === cat ? styles.sidebarBtnActive : styles.sidebarBtn}
                >
                  <Hash size={14} /> {cat}
                </button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}>
                <h2>{activeResourceCategory} Resources</h2>
                {isAdmin && (
                  <button style={styles.primaryButton} onClick={() => setShowModal('resource')}>
                    <Plus size={18}/> Add Resource
                  </button>
                )}
              </div>
              <div style={styles.resourceList}>
                {resources
                  .filter(r => r.category === activeResourceCategory)
                  .map(r => (
                    <div key={r.id} style={styles.resourceCard}>
                      <FileText color="#ec4899" />
                      <div style={{flex: 1}}>
                        <h4 style={{margin: 0}}>{r.title}</h4>
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button 
                          onClick={() => window.open(r.url, '_blank')} 
                          style={styles.viewBtnInternal}
                        >
                          Open
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(r.id, 'resources')} 
                            style={styles.delBtn}
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

      {/* Post Modal */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>New Discussion</h3>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}>
                <X size={24}/>
              </button>
            </div>
            <select 
              style={styles.input} 
              value={postForm.category} 
              onChange={e => setPostForm({...postForm, category: e.target.value})}
            >
              {GROUPS.filter(g => g !== 'All Discussions').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input 
              style={styles.input} 
              placeholder="Title" 
              value={postForm.title}
              onChange={e => setPostForm({...postForm, title: e.target.value})} 
            />
            <textarea 
              style={{...styles.input, height: '100px'}} 
              placeholder="Content" 
              value={postForm.content}
              onChange={e => setPostForm({...postForm, content: e.target.value})} 
            />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>
              Post Now
            </button>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {showModal === 'postDetail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => {setShowModal(null); setSelectedPost(null);}}>
          <div style={styles.postDetailModal} onClick={e => e.stopPropagation()}>
            <div style={styles.postDetailHeader}>
              <div>
                <span style={styles.tag}>{selectedPost.category}</span>
                <h2 style={{margin: '10px 0'}}>{selectedPost.title}</h2>
                <div style={styles.cardMeta}>
                  <span><User size={12}/> {selectedPost.author}</span>
                </div>
              </div>
              <button 
                onClick={() => {setShowModal(null); setSelectedPost(null);}} 
                style={styles.closeBtn}
              >
                <X size={24}/>
              </button>
            </div>
            
            <div style={styles.postDetailContent}>
              <p style={{fontSize: '16px', lineHeight: '1.6', color: '#334155'}}>
                {selectedPost.content}
              </p>
              
              <div style={styles.postActions}>
                <button 
                  onClick={() => handleLikePost(selectedPost.id)} 
                  style={selectedPost.likes?.includes(user.id) ? styles.likeButtonActive : styles.likeButton}
                >
                  <Heart 
                    size={18} 
                    fill={selectedPost.likes?.includes(user.id) ? "#ec4899" : "none"} 
                  /> 
                  {selectedPost.likes?.length || 0} likes
                </button>
              </div>

              <div style={styles.commentsSection}>
                <h3 style={{marginBottom: '20px'}}>
                  Comments ({selectedPost.comments?.length || 0})
                </h3>
                
                <div style={styles.commentInputContainer}>
                  <textarea 
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button style={styles.commentButton} onClick={handleAddComment}>
                    <Send size={18}/>
                  </button>
                </div>

                <div style={styles.commentsList}>
                  {selectedPost.comments && selectedPost.comments.map((comment, idx) => (
                    <div key={idx} style={styles.commentItem}>
                      <div style={styles.commentHeader}>
                        <span style={styles.commentAuthor}>{comment.author}</span>
                        <span style={styles.commentDate}>
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={styles.commentText}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              {renderAvatar(profileForm.profilePic, 'large')}
              <p style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>
                Update your profile
              </p>
            </div>
            
            <input 
              style={styles.input} 
              placeholder="First Name" 
              value={profileForm.firstName} 
              onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} 
            />
            <input 
              style={styles.input} 
              placeholder="Last Name" 
              value={profileForm.lastName} 
              onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} 
            />
            <input 
              style={styles.input} 
              placeholder="Profile Image URL (direct link)" 
              value={profileForm.profilePic} 
              onChange={e => {
                setProfileForm({...profileForm, profilePic: e.target.value});
                setImageError(false);
              }} 
            />
            {imageError && (
              <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '10px'}}>
                Failed to load image. Try a different URL.
              </p>
            )}
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Add Video</h3>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={styles.input} 
              placeholder="Title" 
              value={videoForm.title}
              onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
            />
            <input 
              style={styles.input} 
              placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)" 
              value={videoForm.url}
              onChange={e => setVideoForm({...videoForm, url: e.target.value})} 
            />
            <textarea 
              style={styles.input} 
              placeholder="Description" 
              value={videoForm.description}
              onChange={e => setVideoForm({...videoForm, description: e.target.value})} 
            />
            <button style={styles.primaryButtonFull} onClick={handleAddVideo}>
              Add to Hub
            </button>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal === 'resource' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Add Resource</h3>
              <button onClick={() => setShowModal(null)} style={styles.closeBtn}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={styles.input} 
              placeholder="Title" 
              value={resourceForm.title}
              onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
            />
            <input 
              style={styles.input} 
              placeholder="URL" 
              value={resourceForm.url}
              onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
            />
            <select 
              style={styles.input} 
              value={resourceForm.category}
              onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
            >
              {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={styles.primaryButtonFull} onClick={handleAddResource}>
              Save Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { 
    background: 'white', 
    height: '70px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '0 40px', 
    borderBottom: '1px solid #e2e8f0', 
    position: 'sticky', 
    top: 0, 
    zIndex: 100 
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px' },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b', fontWeight: '500' },
  navBtnActive: { padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
  sidebarBtnActive: { textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  card: { background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  tag: { fontSize: '11px', background: '#fdf2f8', color: '#ec4899', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardMeta: { marginTop: '15px', display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8', alignItems: 'center' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  metaBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', padding: 0 },
  
  // Video styles with proper thumbnail display
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' },
  videoCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoThumbnailWrapper: { 
    position: 'relative', 
    paddingTop: '56.25%', 
    background: '#000', 
    cursor: 'pointer', 
    overflow: 'hidden'
  },
  videoThumbnail: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    display: 'block'
  },
  fallbackThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#f1f5f9',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playButtonOverlay: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.1)',
    transition: 'background 0.2s'
  },
  playCircle: {
    background: 'rgba(236, 72, 153, 0.9)',
    borderRadius: '50%',
    width: '70px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  videoPlaceholder: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#f1f5f9' 
  },
  
  resourceList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  resourceCard: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '14px', boxSizing: 'border-box' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', width: '100%', fontSize: '16px' },
  ghostButtonFull: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '14px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  postDetailModal: { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  postDetailHeader: { padding: '30px', borderBottom: '1px solid #e2e8f0' },
  postDetailContent: { padding: '30px', overflowY: 'auto', flex: 1 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  postActions: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
  likeButton: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '500' },
  likeButtonActive: { background: '#fdf2f8', border: '1px solid #ec4899', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: '500' },
  commentsSection: { marginTop: '30px' },
  commentInputContainer: { display: 'flex', gap: '10px', marginBottom: '30px' },
  commentInput: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' },
  commentButton: { background: '#ec4899', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  commentItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  commentAuthor: { fontWeight: '600', color: '#1e293b', fontSize: '14px' },
  commentDate: { fontSize: '12px', color: '#94a3b8' },
  commentText: { color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }
};

export default Dashboard;

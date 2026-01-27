import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, BookOpen, Music, Heart, Sparkles, User, LogOut, 
  Search, Upload, Play, Pause, Download, X, ThumbsUp, MessageSquare, 
  Share2, Clock, Send, Trash2, Shield, ChevronLeft, Flag, Headphones, 
  FileText, Loader2, AlertCircle, CheckCircle2, MoreHorizontal
} from 'lucide-react';

const CATEGORIES = {
  discussion: ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood'],
  audio: ['Meditations', 'Affirmations', 'Sleep Stories', 'Podcasts', 'Soundscapes']
};

const SAMPLE_RESOURCES = [
  { id: 1, title: "30-Day Self-Care Challenge", type: "Guide", category: "Self Care", author: "Dr. Rachel Kim", downloads: 1240, description: "Comprehensive guide to building sustainable habits", fileSize: "2.4 MB", format: "PDF" },
  { id: 2, title: "Sleep Hygiene Checklist", type: "Template", category: "Wellness", author: "Sleep Foundation", downloads: 856, description: "Essential steps for better sleep quality", fileSize: "850 KB", format: "PDF" },
  { id: 3, title: "Setting Boundaries Workbook", type: "E-book", category: "Mental Health", author: "Therapy Center", downloads: 2103, description: "Interactive worksheets for healthy relationships", fileSize: "5.1 MB", format: "PDF" }
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState('community');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [resources] = useState(SAMPLE_RESOURCES);
  const [audioLibrary, setAudioLibrary] = useState([
    { id: 1, title: "Morning Affirmations for Confidence", type: "Affirmations", duration: "5:30", author: "Wellness Team", plays: 3420, description: "Start your day with positivity", thumbnail: "pink" },
    { id: 2, title: "Deep Sleep Meditation", type: "Meditation", duration: "20:00", author: "Sarah Chen", plays: 8901, description: "Fall into restful sleep", thumbnail: "purple" },
    { id: 3, title: "Rainy Day Ambience", type: "Soundscapes", duration: "60:00", author: "Nature Sounds", plays: 1205, description: "Gentle rain for focus", thumbnail: "blue" }
  ]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadAudio, setShowUploadAudio] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', type: 'Meditation', duration: '', description: '', fileUrl: '' });
  
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' });
  const audioRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || false);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        bio: userData.bio || ''
      });
      loadDiscussions();
    }
  }, []);

  const loadDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/database', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data);
      }
    } catch (err) {
      console.error('Failed to load discussions');
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setAuthLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auth',
          email: email.trim().toLowerCase(),
          password: password,
          isRegistering: false
        })
      });

      const data = await response.json();
      
      if (response.status === 401 && data.error === 'User not found') {
        const registerResponse = await fetch('/.netlify/functions/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auth',
            email: email.trim().toLowerCase(),
            password: password,
            isRegistering: true
          })
        });
        
        const newUser = await registerResponse.json();
        if (registerResponse.ok) {
          const userData = { ...newUser, isAdmin: newUser.is_admin || email.includes('admin') };
          setUser(userData);
          setIsAdmin(userData.isAdmin);
          localStorage.setItem('wellnessUser', JSON.stringify(userData));
          showToast('Account created!', 'success');
          loadDiscussions();
          return;
        }
      }
      
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      const userData = { ...data, isAdmin: data.is_admin || email.includes('admin') };
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      localStorage.setItem('wellnessUser', JSON.stringify(userData));
      showToast('Welcome back!', 'success');
      loadDiscussions();
      
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    const post = discussions.find(p => p.id === postId);
    const hasLiked = post.liked_by?.includes(user.email);
    
    const updatedPost = {
      ...post,
      likes: hasLiked ? post.likes - 1 : post.likes + 1,
      liked_by: hasLiked ? post.liked_by.filter(id => id !== user.email) : [...(post.liked_by || []), user.email]
    };
    
    setDiscussions(prev => prev.map(p => p.id === postId ? updatedPost : p));
    
    try {
      await fetch(`/.netlify/functions/database?id=${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likes: updatedPost.likes, likedBy: updatedPost.liked_by })
      });
    } catch (err) {}
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    const newComment = {
      id: Date.now(),
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      content: commentText,
      created_at: new Date().toISOString(),
      likes: 0
    };

    const updatedComments = [...(selectedPost.comments || []), newComment];
    setDiscussions(prev => prev.map(p => p.id === selectedPost.id ? {...p, comments: updatedComments} : p));
    setSelectedPost(prev => ({...prev, comments: updatedComments}));
    
    try {
      await fetch(`/.netlify/functions/database?id=${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
    } catch (err) {}
    
    setCommentText('');
  };

  const handleDeletePost = async (postId) => {
    if (!isAdmin) return;
    try {
      await fetch(`/.netlify/functions/database?id=${postId}`, { method: 'DELETE' });
      setDiscussions(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
      setShowDeleteConfirm(null);
      showToast('Post deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!isAdmin) return;
    const post = discussions.find(p => p.id === postId);
    const updatedComments = post.comments.filter(c => c.id !== commentId);
    
    try {
      await fetch(`/.netlify/functions/database?id=${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
      setDiscussions(prev => prev.map(p => p.id === postId ? {...p, comments: updatedComments} : p));
      setSelectedPost(prev => ({...prev, comments: updatedComments}));
    } catch {}
  };

  const handleNewPost = async () => {
    if (!newPostData.title.trim() || !newPostData.content.trim()) return;
    
    const post = {
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      title: newPostData.title,
      content: newPostData.content,
      category: newPostData.category,
      likes: 0,
      liked_by: [],
      comments: []
    };

    try {
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const saved = await response.json();
      setDiscussions(prev => [saved, ...prev]);
      setNewPostData({ title: '', content: '', category: 'General' });
      setShowNewPost(false);
      showToast('Posted!', 'success');
    } catch {
      showToast('Failed to post', 'error');
    }
  };

  const togglePlay = (audio) => {
    if (currentlyPlaying?.id === audio.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(audio);
      setIsPlaying(true);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredDiscussions = discussions.filter(post => 
    (selectedCategory === 'All' || post.category === selectedCategory) &&
    (searchQuery === '' || post.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Heart size={48} color="#ec4899" fill="#fce7f3" />
            <h1 style={styles.loginTitle}>Serenity Space</h1>
            <p style={styles.loginSubtitle}>Your wellness sanctuary</p>
          </div>
          
          {error && <div style={styles.errorBanner}>{error}</div>}
          
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" style={styles.authInput} value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" style={styles.authInput} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" style={styles.authButton} disabled={authLoading}>
              {authLoading ? 'Loading...' : 'Sign In / Create Account'}
            </button>
          </form>
          
          <p style={styles.loginHint}>Any email works. Include "admin" for admin access.</p>
        </div>
        
        {toast && <div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}>{toast.message}</div>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <audio ref={audioRef} />
      {toast && <div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}>{toast.message}</div>}
      
      <header style={styles.header}>
        <div style={styles.brand}>
          <Heart size={28} color="#ec4899" fill="#fce7f3" />
          <h1 style={styles.brandText}>Serenity Space</h1>
          {isAdmin && <span style={styles.adminBadge}><Shield size={14} /> Admin</span>}
        </div>
        
        <nav style={styles.nav}>
          {['community', 'resources', 'audio'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{...styles.navButton, ...(activeTab === tab ? styles.navButtonActive : {})}}>
              {tab === 'community' && <MessageCircle size={18} />}
              {tab === 'resources' && <BookOpen size={18} />}
              {tab === 'audio' && <Headphones size={18} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        
        <div style={styles.userActions}>
          <button onClick={() => setShowProfile(true)} style={styles.iconButton}><User size={20} color="#64748b" /></button>
          <button onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}} style={styles.iconButton}><LogOut size={20} color="#64748b" /></button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Community Discussions</h2>
                <p style={styles.sectionSubtitle}>Connect, share, and grow together</p>
              </div>
              <button style={styles.primaryButton} onClick={() => setShowNewPost(true)}>
                <MessageSquare size={16} /> New Discussion
              </button>
            </div>

            <div style={styles.controlsBar}>
              <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Search..." style={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select style={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <div style={styles.categoryPills}>
              {['All', ...CATEGORIES.discussion].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{...styles.pill, ...(selectedCategory === cat ? styles.pillActive : {})}}>
                  {cat}
                </button>
              ))}
            </div>

            {discussionsLoading ? (
              <div style={styles.skeletonList}>
                {[1,2,3].map(i => <div key={i} style={styles.skeletonCard} />)}
              </div>
            ) : (
              <div style={styles.cardList}>
                {filteredDiscussions.map(post => (
                  <article key={post.id} style={{...styles.discussionCard, ...(post.isPinned ? styles.pinnedCard : {})}} onClick={() => setSelectedPost(post)}>
                    {post.isPinned && <div style={styles.pinnedBadge}><Sparkles size={12} /> Featured</div>}
                    <div style={styles.cardMeta}>
                      <span style={styles.categoryTag}>{post.category}</span>
                      <span style={styles.timestamp}>{formatTime(post.created_at)}</span>
                    </div>
                    <h3 style={styles.cardTitle}>{post.title}</h3>
                    <p style={styles.cardContent}>{post.content}</p>
                    <div style={styles.cardFooter}>
                      <div style={styles.authorInfo}>
                        <div style={styles.avatarSmall}><User size={16} color="#94a3b8" /></div>
                        <span style={styles.authorName}>{post.author}</span>
                      </div>
                      <div style={styles.cardStats}>
                        <button style={{...styles.statButton, ...(post.liked_by?.includes(user.email) ? styles.statButtonActive : {})}} onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>
                          <ThumbsUp size={16} fill={post.liked_by?.includes(user.email) ? "#ec4899" : "none"} />
                          {post.likes || 0}
                        </button>
                        <span style={styles.statButton}><MessageSquare size={16} /> {post.comments?.length || 0}</span>
                        {isAdmin && (
                          <button style={styles.deleteButtonSmall} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(post.id); }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Resource Library</h2>
              <p style={styles.sectionSubtitle}>Curated guides and tools</p>
            </div>
            <div style={styles.resourceGrid}>
              {resources.map(resource => (
                <div key={resource.id} style={styles.resourceCard}>
                  <div style={styles.resourceIcon}><FileText size={32} color="#ec4899" /></div>
                  <div style={styles.resourceContent}>
                    <span style={styles.resourceType}>{resource.type}</span>
                    <h3 style={styles.resourceTitle}>{resource.title}</h3>
                    <p style={styles.resourceDesc}>{resource.description}</p>
                    <button style={styles.downloadButton}><Download size={16} /> Download {resource.format}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Audio Wellness</h2>
                <p style={styles.sectionSubtitle}>Meditations and calming sounds</p>
              </div>
              <button style={styles.primaryButton} onClick={() => setShowUploadAudio(true)}>
                <Upload size={16} /> Upload Audio
              </button>
            </div>

            {currentlyPlaying && (
              <div style={styles.playerBar}>
                <button style={styles.playButton} onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
                </button>
                <div style={styles.playerInfo}>
                  <div style={styles.playerTitle}>{currentlyPlaying.title}</div>
                  <div style={styles.playerMeta}>{currentlyPlaying.type} • {currentlyPlaying.author}</div>
                </div>
                <div style={styles.progressBar}><div style={styles.progressFill} /></div>
              </div>
            )}

            <div style={styles.audioGrid}>
              {audioLibrary.map(audio => (
                <div key={audio.id} style={styles.audioCard} onClick={() => togglePlay(audio)}>
                  <div style={{...styles.audioThumbnail, background: audio.thumbnail === 'pink' ? '#fce7f3' : audio.thumbnail === 'purple' ? '#e0e7ff' : '#dbeafe'}}>
                    <button style={styles.audioPlayOverlay}>
                      {currentlyPlaying?.id === audio.id && isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                    </button>
                  </div>
                  <div style={styles.audioInfo}>
                    <span style={styles.audioType}>{audio.type}</span>
                    <h3 style={styles.audioTitle}>{audio.title}</h3>
                    <div style={styles.audioMeta}><Clock size={14} /> {audio.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
          <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div style={styles.detailHeader}>
              <button style={styles.backButton} onClick={() => setSelectedPost(null)}><ChevronLeft size={20} /> Back</button>
              <span style={styles.detailCategory}>{selectedPost.category}</span>
              {isAdmin && <button style={styles.adminDeleteBtn} onClick={() => setShowDeleteConfirm(selectedPost.id)}><Trash2 size={18} /> Delete</button>}
            </div>

            <div style={styles.detailContent}>
              <h2 style={styles.detailTitle}>{selectedPost.title}</h2>
              <div style={styles.detailAuthor}>
                <div style={styles.avatarLarge}><User size={24} /></div>
                <div>
                  <div style={styles.detailAuthorName}>{selectedPost.author}</div>
                  <div style={styles.detailTime}>{formatTime(selectedPost.created_at)}</div>
                </div>
              </div>
              <div style={styles.detailBody}>{selectedPost.content}</div>
              
              <div style={styles.detailActions}>
                <button style={{...styles.actionButton, ...(selectedPost.liked_by?.includes(user.email) ? styles.actionButtonActive : {})}} onClick={() => handleLike(selectedPost.id)}>
                  <ThumbsUp fill={selectedPost.liked_by?.includes(user.email) ? "#ec4899" : "none"} />
                  {selectedPost.likes || 0} likes
                </button>
                <button style={styles.actionButton}><Share2 size={20} /> Share</button>
                <button style={styles.actionButton}><Flag size={20} /> Report</button>
              </div>
            </div>

            <div style={styles.commentsSection}>
              <h3 style={styles.commentsTitle}>Discussion ({selectedPost.comments?.length || 0})</h3>
              <div style={styles.commentInputArea}>
                <div style={styles.avatarSmall}><User size={16} /></div>
                <div style={styles.commentInputWrapper}>
                  <input type="text" placeholder="Add a comment..." style={styles.commentInput} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
                  <button style={styles.sendButton} onClick={handleAddComment} disabled={!commentText.trim()}><Send size={18} /></button>
                </div>
              </div>

              <div style={styles.commentsList}>
                {selectedPost.comments?.map(comment => (
                  <div key={comment.id} style={styles.comment}>
                    <div style={styles.avatarSmall}><User size={16} /></div>
                    <div style={styles.commentContent}>
                      <div style={styles.commentHeader}>
                        <span style={styles.commentAuthor}>{comment.author} {comment.isAdmin && <span style={styles.adminLabel}><Shield size={12} /> Admin</span>}</span>
                        <span style={styles.commentTime}>{formatTime(comment.created_at)}</span>
                      </div>
                      <p style={styles.commentText}>{comment.content}</p>
                      <div style={styles.commentActions}>
                        <button style={styles.commentActionBtn}><ThumbsUp size={12} /> {comment.likes}</button>
                        {isAdmin && <button style={styles.commentDeleteBtn} onClick={() => handleDeleteComment(selectedPost.id, comment.id)}>Delete</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmBox}>
            <Trash2 size={32} color="#ef4444" />
            <h3>Delete this post?</h3>
            <p>This cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button style={styles.cancelButton} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button style={styles.confirmDeleteBtn} onClick={() => handleDeletePost(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div style={styles.modalOverlay} onClick={() => setShowNewPost(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Start a Discussion</h3>
              <button style={styles.closeButton} onClick={() => setShowNewPost(false)}><X size={20} /></button>
            </div>
            <select style={styles.input} value={newPostData.category} onChange={e => setNewPostData({...newPostData, category: e.target.value})}>
              {CATEGORIES.discussion.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input style={styles.input} placeholder="Title" value={newPostData.title} onChange={e => setNewPostData({...newPostData, title: e.target.value})} />
            <textarea style={styles.textarea} placeholder="What's on your mind?" rows={5} value={newPostData.content} onChange={e => setNewPostData({...newPostData, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost} disabled={!newPostData.title.trim() || !newPostData.content.trim()}>Post Discussion</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Profile Settings</h3>
              <button style={styles.closeButton} onClick={() => setShowProfile(false)}><X size={20} /></button>
            </div>
            <div style={{textAlign: 'center', padding: 24}}>
              <div style={styles.avatarLarge}><User size={40} /></div>
              <button style={styles.changePhotoBtn}>Change Photo</button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
              <input style={styles.input} value={profileForm.displayName} onChange={e => setProfileForm({...profileForm, displayName: e.target.value})} />
            </div>
            <button style={styles.primaryButton} onClick={() => { const updated = {...user, display_name: profileForm.displayName}; setUser(updated); localStorage.setItem('wellnessUser', JSON.stringify(updated)); setShowProfile(false); showToast('Profile updated'); }}>Save Changes</button>
          </div>
        </div>
      )}

      {/* Upload Audio Modal */}
      {showUploadAudio && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadAudio(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Upload Audio</h3>
              <button style={styles.closeButton} onClick={() => setShowUploadAudio(false)}><X size={20} /></button>
            </div>
            <div style={styles.uploadZone}>
              <Upload size={48} color="#cbd5e1" />
              <p>Drag and drop or click to browse</p>
            </div>
            <input style={styles.input} placeholder="Audio URL" value={uploadData.fileUrl} onChange={e => setUploadData({...uploadData, fileUrl: e.target.value})} />
            <input style={styles.input} placeholder="Title" value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 24px'}}>
              <select style={styles.input} value={uploadData.type} onChange={e => setUploadData({...uploadData, type: e.target.value})}>
                {CATEGORIES.audio.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input style={styles.input} placeholder="Duration (5:30)" value={uploadData.duration} onChange={e => setUploadData({...uploadData, duration: e.target.value})} />
            </div>
            <button style={styles.primaryButton} onClick={() => { /* handle upload */ setShowUploadAudio(false); }} disabled={!uploadData.title || !uploadData.fileUrl}>Upload Audio</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#fafaf9', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif' },
  
  // Auth
  loginBox: { maxWidth: 420, margin: '80px auto', padding: 48, background: 'white', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' },
  loginTitle: { fontSize: 28, fontWeight: 700, margin: '16px 0 4px' },
  loginSubtitle: { color: '#64748b', fontSize: 16 },
  authInput: { width: '100%', padding: 14, marginBottom: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, boxSizing: 'border-box' },
  authButton: { width: '100%', padding: 14, background: '#ec4899', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  errorBanner: { background: '#fef2f2', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' },
  loginHint: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 16 },
  
  // Toast
  toast: { position: 'fixed', top: 20, right: 20, padding: '16px 20px', borderRadius: 12, color: 'white', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8 },
  toastSuccess: { background: '#10b981' },
  toastError: { background: '#ef4444' },
  
  // Header
  header: { position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f5f9', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandText: { fontSize: 20, fontWeight: 700 },
  adminBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, borderRadius: 20 },
  nav: { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10 },
  navButton: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  navButtonActive: { background: 'white', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  userActions: { display: 'flex', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' },
  
  // Main
  main: { maxWidth: 800, margin: '0 auto', padding: '32px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  sectionTitle: { fontSize: 28, fontWeight: 700, margin: 0 },
  sectionSubtitle: { color: '#64748b', margin: '4px 0 0 0' },
  primaryButton: { padding: '10px 20px', background: '#ec4899', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  
  // Controls
  controlsBar: { display: 'flex', gap: 12, marginBottom: 20 },
  searchBox: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '10px 16px 10px 40px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 },
  sortSelect: { padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white' },
  
  // Categories
  categoryPills: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24 },
  pill: { padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  pillActive: { background: '#fce7f3', color: '#ec4899', borderColor: '#fce7f3' },
  
  // Cards
  cardList: { display: 'flex', flexDirection: 'column', gap: 16 },
  discussionCard: { background: 'white', padding: 24, borderRadius: 16, border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative' },
  pinnedCard: { background: '#fffbeb', borderColor: '#fef3c7' },
  pinnedBadge: { position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, borderRadius: 20 },
  cardMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  categoryTag: { fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' },
  timestamp: { fontSize: 13, color: '#94a3b8' },
  cardTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' },
  cardContent: { color: '#475569', fontSize: 15, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f8fafc' },
  authorInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  avatarSmall: { width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: 600, color: '#475569' },
  cardStats: { display: 'flex', gap: 12, alignItems: 'center' },
  statButton: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: 'none', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  statButtonActive: { background: '#fce7f3', color: '#ec4899' },
  deleteButtonSmall: { padding: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' },
  
  // Skeleton
  skeletonList: { display: 'flex', flexDirection: 'column', gap: 16 },
  skeletonCard: { height: 140, background: '#f1f5f9', borderRadius: 16, animation: 'pulse 2s infinite' },
  
  // Modals
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 },
  modal: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' },
  detailModal: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  closeButton: { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f8fafc', cursor: 'pointer' },
  input: { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, minHeight: 100, resize: 'vertical' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 },
  formGroup: { marginBottom: 16 },
  uploadZone: { margin: '0 24px', padding: 40, border: '2px dashed #e2e8f0', borderRadius: 12, textAlign: 'center', color: '#64748b' },
  changePhotoBtn: { background: 'none', border: 'none', color: '#ec4899', fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  
  // Detail View
  detailHeader: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #f1f5f9' },
  backButton: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer' },
  detailCategory: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#059669' },
  adminDeleteBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  detailContent: { padding: 24 },
  detailTitle: { fontSize: 24, fontWeight: 700, margin: '0 0 20px 0' },
  detailAuthor: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  avatarLarge: { width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detailAuthorName: { fontWeight: 700 },
  detailTime: { fontSize: 13, color: '#94a3b8' },
  detailBody: { fontSize: 16, lineHeight: 1.8, color: '#475569', marginBottom: 24 },
  detailActions: { display: 'flex', gap: 12, padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
  actionButton: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer' },
  actionButtonActive: { background: '#fce7f3', color: '#ec4899' },
  
  // Comments
  commentsSection: { padding: 24, background: '#fafaf9' },
  commentsTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 20px 0' },
  commentInputArea: { display: 'flex', gap: 12, marginBottom: 24 },
  commentInputWrapper: { flex: 1, display: 'flex', gap: 8, background: 'white', padding: 4, borderRadius: 24, border: '1px solid #e2e8f0' },
  commentInput: { flex: 1, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 14 },
  sendButton: { width: 36, height: 36, borderRadius: '50%', background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 16 },
  comment: { display: 'flex', gap: 12 },
  commentContent: { flex: 1, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  adminLabel: { fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' },
  commentTime: { fontSize: 12, color: '#94a3b8' },
  commentText: { margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.5 },
  commentActions: { display: 'flex', gap: 12, marginTop: 8 },
  commentActionBtn: { fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' },
  commentDeleteBtn: { fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 },
  
  // Confirm
  confirmBox: { background: 'white', padding: 32, borderRadius: 20, textAlign: 'center', maxWidth: 360 },
  confirmActions: { display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' },
  cancelButton: { padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 },
  confirmDeleteBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 },
  
  // Resources
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  resourceCard: { background: 'white', padding: 24, borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', gap: 16 },
  resourceIcon: { width: 48, height: 48, borderRadius: 12, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resourceContent: { flex: 1 },
  resourceType: { fontSize: 12, fontWeight: 600, color: '#ec4899', textTransform: 'uppercase' },
  resourceTitle: { fontSize: 16, fontWeight: 700, margin: '4px 0 8px 0' },
  resourceDesc: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  downloadButton: { padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  
  // Audio
  playerBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 50 },
  playButton: { width: 40, height: 40, borderRadius: '50%', background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playerInfo: { flex: 1 },
  playerTitle: { fontWeight: 600 },
  playerMeta: { fontSize: 13, color: '#64748b' },
  progressBar: { width: 200, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  progressFill: { width: '40%', height: '100%', background: '#ec4899' },
  audioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 },
  audioCard: { background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', cursor: 'pointer' },
  audioThumbnail: { height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  audioPlayOverlay: { width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  audioInfo: { padding: 16 },
  audioType: { fontSize: 12, fontWeight: 700, color: '#ec4899', textTransform: 'uppercase' },
  audioTitle: { fontSize: 15, fontWeight: 700, margin: '4px 0 0 0' },
  audioMeta: { fontSize: 13, color: '#64748b', marginTop: 8 }
};

export default Dashboard;

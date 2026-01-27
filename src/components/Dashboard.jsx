import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, BookOpen, Music, Heart, Sparkles, User, LogOut, 
  Search, Upload, Play, Pause, Download, X, ThumbsUp, MessageSquare, 
  Share2, Clock, Send, Trash2, Shield, ChevronLeft, Flag, Headphones, 
  FileText, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';

// Categories
const CATEGORIES = {
  discussion: ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'],
  audio: ['Meditations', 'Affirmations', 'Sleep Stories', 'Podcasts', 'Soundscapes']
};

// API Helper for Netlify Functions + Neon
const api = {
  request: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/.netlify/functions/${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  // Discussions
  fetchDiscussions: () => api.request('discussions'),
  createDiscussion: (data) => api.request('discussions', { method: 'POST', body: JSON.stringify(data) }),
  updateDiscussion: (id, data) => api.request(`discussions?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDiscussion: (id) => api.request(`discussions?id=${id}`, { method: 'DELETE' }),
  
  // Auth/Profile
  fetchProfile: (email) => api.request(`profile?email=${email}`),
  updateProfile: (data) => api.request('profile', { method: 'PUT', body: JSON.stringify(data) }),
};

const SAMPLE_RESOURCES = [
  { id: 1, title: "30-Day Self-Care Challenge", type: "Guide", category: "Self Care", downloads: 1240, description: "Comprehensive guide to sustainable habits", fileSize: "2.4 MB" },
  { id: 2, title: "Sleep Hygiene Checklist", type: "Template", category: "Wellness", downloads: 856, description: "Essential steps for better sleep", fileSize: "850 KB" }
];

const WellnessPortal = () => {
  // Auth State
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('community');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Community State
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Resources
  const [resources] = useState(SAMPLE_RESOURCES);

  // Audio State
  const [audioLibrary, setAudioLibrary] = useState([
    { id: 1, title: "Morning Confidence", type: "Affirmations", duration: "5:30", author: "Wellness Team", audioUrl: "https://example.com/audio1.mp3", thumbnail: "pink" },
    { id: 2, title: "Deep Sleep", type: "Meditation", duration: "20:00", author: "Sarah Chen", audioUrl: "https://example.com/audio2.mp3", thumbnail: "purple" }
  ]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadAudio, setShowUploadAudio] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', type: 'Meditation', duration: '', description: '', fileUrl: '' });
  const audioRef = useRef(null);

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' });

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check auth on load
  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      checkAdminStatus(userData.email);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        bio: userData.bio || ''
      });
    }
    setLoading(false);
  }, []);

  // Load discussions when user logs in
  useEffect(() => {
    if (user) {
      loadDiscussions();
    }
  }, [user, sortBy]);

  const checkAdminStatus = async (email) => {
    // In production, fetch this from your database
    // For now, check if email is in admin list or has admin flag
    const adminEmails = ['admin@serenityspace.com', 'admin@example.com'];
    setIsAdmin(adminEmails.includes(email) || email.endsWith('@admin.com'));
  };

  const loadDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      const data = await api.fetchDiscussions();
      // Sort based on preference
      const sorted = sortBy === 'popular' 
        ? data.sort((a, b) => b.likes - a.likes)
        : data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDiscussions(sorted);
    } catch (err) {
      setError('Failed to load discussions');
      // Fallback to empty array
      setDiscussions([]);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  // Auth Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setAuthLoading(true);
    setError(null);
    
    try {
      // Call Netlify auth function
      const result = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        body: JSON.stringify({ email, password, action: 'login' })
      });
      
      if (!result.ok) throw new Error('Authentication failed');
      
      const userData = await result.json();
      setUser(userData);
      setIsAdmin(userData.isAdmin || false);
      localStorage.setItem('wellnessUser', JSON.stringify(userData));
      showToast('Welcome back!', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Like Handler with Optimistic Update
  const handleLike = async (postId) => {
    if (!user) {
      showToast('Please sign in to like posts', 'error');
      return;
    }

    const post = discussions.find(p => p.id === postId);
    const hasLiked = post.likedBy?.includes(user.email);
    
    // Optimistic update
    const updatedPost = {
      ...post,
      likes: hasLiked ? post.likes - 1 : post.likes + 1,
      likedBy: hasLiked 
        ? post.likedBy.filter(id => id !== user.email)
        : [...(post.likedBy || []), user.email]
    };
    
    setDiscussions(prev => prev.map(p => p.id === postId ? updatedPost : p));
    if (selectedPost?.id === postId) setSelectedPost(updatedPost);

    try {
      await api.updateDiscussion(postId, { likedBy: updatedPost.likedBy, likes: updatedPost.likes });
    } catch (err) {
      // Revert on error
      setDiscussions(prev => prev.map(p => p.id === postId ? post : p));
      showToast('Failed to update like', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    
    const newComment = {
      id: Date.now(),
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      content: commentText,
      created_at: new Date().toISOString(),
      likes: 0
    };

    const updatedComments = [...(selectedPost.comments || []), newComment];
    const updatedPost = { ...selectedPost, comments: updatedComments };

    // Optimistic update
    setDiscussions(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
    setCommentText('');

    try {
      await api.updateDiscussion(selectedPost.id, { comments: updatedComments });
    } catch (err) {
      showToast('Failed to post comment', 'error');
    }
  };

  // Delete Post (Admin only)
  const handleDeletePost = async (postId) => {
    if (!isAdmin) return;
    
    try {
      await api.deleteDiscussion(postId);
      setDiscussions(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
      setShowDeleteConfirm(null);
      showToast('Post deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!isAdmin) return;
    
    const post = discussions.find(p => p.id === postId);
    const updatedComments = post.comments.filter(c => c.id !== commentId);
    
    try {
      await api.updateDiscussion(postId, { comments: updatedComments });
      const updatedPost = { ...post, comments: updatedComments };
      setDiscussions(prev => prev.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
      showToast('Comment deleted', 'success');
    } catch (err) {
      showToast('Failed to delete comment', 'error');
    }
  };

  // Create New Post
  const handleNewPost = async () => {
    if (!newPostData.title.trim() || !newPostData.content.trim()) return;
    
    const post = {
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      category: newPostData.category,
      title: newPostData.title,
      content: newPostData.content,
      likes: 0,
      likedBy: [],
      comments: [],
      created_at: new Date().toISOString(),
      isPinned: false
    };

    try {
      const saved = await api.createDiscussion(post);
      setDiscussions(prev => [saved, ...prev]);
      setNewPostData({ title: '', content: '', category: 'General' });
      setShowNewPost(false);
      showToast('Post created successfully!', 'success');
    } catch (err) {
      showToast('Failed to create post', 'error');
    }
  };

  // Audio Player Logic
  const togglePlay = (audio) => {
    if (currentlyPlaying?.id === audio.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(audio);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = audio.audioUrl;
        audioRef.current.load();
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentlyPlaying]);

  // Filter & Sort Discussions
  const filteredDiscussions = discussions
    .filter(post => selectedCategory === 'All' || post.category === selectedCategory)
    .filter(post => 
      searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div style={styles.loadingScreen}><Loader2 size={48} color="#ec4899" className="spin" /></div>;
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginContainer}>
          <div style={styles.loginBox}>
            <div style={styles.loginHeader}>
              <Heart size={48} color="#ec4899" fill="#fce7f3" />
              <h1 style={styles.loginTitle}>Serenity Space</h1>
              <p style={styles.loginSubtitle}>Your wellness sanctuary</p>
            </div>
            
            {error && (
              <div style={styles.errorBanner}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <form onSubmit={handleAuth} style={styles.loginForm}>
              <input 
                type="email"
                style={styles.authInput}
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input 
                type="password"
                style={styles.authInput}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="submit"
                style={styles.authButton}
                disabled={authLoading}
              >
                {authLoading ? <Loader2 size={20} className="spin" /> : 'Sign In'}
              </button>
            </form>
            
            <p style={styles.demoHint}>
              Demo: Use "admin@example.com" for admin access
            </p>
          </div>
        </div>
        
        {/* Toast Notification */}
        {toast && (
          <div style={{
            ...styles.toast,
            ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      
      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Heart size={28} color="#ec4899" fill="#fce7f3" />
          <h1 style={styles.brandText}>Serenity Space</h1>
          {isAdmin && (
            <span style={styles.adminBadge}>
              <Shield size={14} /> Admin
            </span>
          )}
        </div>
        
        <nav style={styles.nav}>
          {['community', 'resources', 'audio'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.navButton,
                ...(activeTab === tab ? styles.navButtonActive : {})
              }}
            >
              {tab === 'community' && <MessageCircle size={18} />}
              {tab === 'resources' && <BookOpen size={18} />}
              {tab === 'audio' && <Headphones size={18} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        
        <div style={styles.userActions}>
          <button onClick={() => setShowProfile(true)} style={styles.iconButton}>
            <User size={20} color="#64748b" />
          </button>
          <button 
            onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}
            style={styles.iconButton}
          >
            <LogOut size={20} color="#64748b" />
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Community Tab */}
        {activeTab === 'community' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Community</h2>
                <p style={styles.sectionSubtitle}>Join the conversation</p>
              </div>
              <button style={styles.primaryButton} onClick={() => setShowNewPost(true)}>
                <MessageSquare size={16} /> New Post
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div style={styles.controlsBar}>
              <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search discussions..."
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={styles.clearSearch}>
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <select 
                style={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Category Pills */}
            <div style={styles.categoryPills}>
              <button 
                style={{...styles.pill, ...(selectedCategory === 'All' ? styles.pillActive : {})}}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {CATEGORIES.discussion.map(cat => (
                <button 
                  key={cat}
                  style={{...styles.pill, ...(selectedCategory === cat ? styles.pillActive : {})}}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Discussions List */}
            {discussionsLoading ? (
              <div style={styles.skeletonList}>
                {[1,2,3].map(i => <div key={i} style={styles.skeletonCard} />)}
              </div>
            ) : (
              <div style={styles.cardList}>
                {filteredDiscussions.length === 0 ? (
                  <div style={styles.emptyState}>
                    <MessageCircle size={48} color="#cbd5e1" />
                    <p>No discussions found</p>
                    {searchQuery && <button onClick={() => setSearchQuery('')} style={styles.link}>Clear search</button>}
                  </div>
                ) : (
                  filteredDiscussions.map(post => (
                    <article 
                      key={post.id} 
                      style={{...styles.card, ...(post.isPinned ? styles.pinnedCard : {})}}
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.isPinned && (
                        <div style={styles.pinnedBadge}>
                          <Sparkles size={12} /> Featured
                        </div>
                      )}
                      
                      <div style={styles.cardHeader}>
                        <span style={styles.categoryTag}>{post.category}</span>
                        <span style={styles.timeStamp}>{formatTime(post.created_at)}</span>
                      </div>
                      
                      <h3 style={styles.cardTitle}>{post.title}</h3>
                      <p style={styles.cardExcerpt}>{post.content}</p>
                      
                      <div style={styles.cardFooter}>
                        <div style={styles.author}>
                          <div style={styles.avatarSmall}><User size={14} /></div>
                          <span>{post.author}</span>
                        </div>
                        
                        <div style={styles.stats} onClick={e => e.stopPropagation()}>
                          <button 
                            style={{...styles.statBtn, ...(post.likedBy?.includes(user.email) ? styles.statBtnActive : {})}}
                            onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                          >
                            <ThumbsUp size={16} fill={post.likedBy?.includes(user.email) ? "#ec4899" : "none"} />
                            {post.likes || 0}
                          </button>
                          <span style={styles.statBtn}>
                            <MessageSquare size={16} />
                            {post.comments?.length || 0}
                          </span>
                          {isAdmin && (
                            <button 
                              style={styles.deleteBtn}
                              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(post.id); }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Resources & Audio tabs remain similar but improved... */}
        {activeTab === 'resources' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Resources</h2>
            <div style={styles.resourceGrid}>
              {resources.map(r => (
                <div key={r.id} style={styles.resourceCard}>
                  <FileText size={32} color="#ec4899" />
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <button style={styles.downloadBtn}><Download size={16} /> Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Audio Library</h2>
              <button style={styles.primaryButton} onClick={() => setShowUploadAudio(true)}>
                <Upload size={16} /> Upload
              </button>
            </div>
            
            {/* Audio Player Bar */}
            {currentlyPlaying && (
              <div style={styles.audioBar}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={styles.audioBarPlay}>
                  {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
                </button>
                <div style={styles.audioBarInfo}>
                  <div style={styles.audioBarTitle}>{currentlyPlaying.title}</div>
                  <div style={styles.audioBarMeta}>{currentlyPlaying.type} • {currentlyPlaying.author}</div>
                </div>
                <div style={styles.audioProgress}>
                  <div style={styles.audioProgressFill} />
                </div>
              </div>
            )}

            <div style={styles.audioGrid}>
              {audioLibrary.map(audio => (
                <div key={audio.id} style={styles.audioCard}>
                  <div style={{...styles.audioThumb, background: audio.thumbnail === 'pink' ? '#fce7f3' : '#e0e7ff'}}>
                    <button 
                      style={styles.audioPlayBtn}
                      onClick={() => togglePlay(audio)}
                    >
                      {currentlyPlaying?.id === audio.id && isPlaying ? (
                        <Pause size={24} fill="white" />
                      ) : (
                        <Play size={24} fill="white" />
                      )}
                    </button>
                  </div>
                  <div style={styles.audioInfo}>
                    <div style={styles.audioType}>{audio.type}</div>
                    <h4 style={styles.audioTitle}>{audio.title}</h4>
                    <div style={styles.audioMeta}>
                      <Clock size={14} /> {audio.duration}
                    </div>
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
              <button style={styles.backBtn} onClick={() => setSelectedPost(null)}>
                <ChevronLeft size={20} /> Back
              </button>
              <span style={styles.detailCategory}>{selectedPost.category}</span>
              {isAdmin && (
                <button 
                  style={styles.adminDelete}
                  onClick={() => setShowDeleteConfirm(selectedPost.id)}
                >
                  <Trash2 size={18} /> Delete
                </button>
              )}
            </div>

            <div style={styles.detailContent}>
              <h2 style={styles.detailTitle}>{selectedPost.title}</h2>
              
              <div style={styles.detailAuthor}>
                <div style={styles.avatar}><User size={24} /></div>
                <div>
                  <div style={styles.detailAuthorName}>{selectedPost.author}</div>
                  <div style={styles.detailTime}>{formatTime(selectedPost.created_at)}</div>
                </div>
              </div>

              <div style={styles.detailBody}>{selectedPost.content}</div>

              <div style={styles.detailActions}>
                <button 
                  style={{...styles.actionBtn, ...(selectedPost.likedBy?.includes(user.email) ? styles.actionBtnActive : {})}}
                  onClick={() => handleLike(selectedPost.id)}
                >
                  <ThumbsUp fill={selectedPost.likedBy?.includes(user.email) ? "#ec4899" : "none"} />
                  {selectedPost.likes || 0} likes
                </button>
                <button style={styles.actionBtn}><Share2 size={20} /> Share</button>
                <button style={styles.actionBtn}><Flag size={20} /> Report</button>
              </div>
            </div>

            {/* Comments */}
            <div style={styles.commentsSection}>
              <h4 style={styles.commentsTitle}>Comments ({selectedPost.comments?.length || 0})</h4>
              
              <div style={styles.commentInputBox}>
                <div style={styles.avatarSmall}><User size={16} /></div>
                <input
                  type="text"
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                />
                <button 
                  style={styles.sendBtn}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send size={18} />
                </button>
              </div>

              <div style={styles.commentsList}>
                {selectedPost.comments?.map(comment => (
                  <div key={comment.id} style={styles.comment}>
                    <div style={styles.avatarSmall}><User size={16} /></div>
                    <div style={styles.commentContent}>
                      <div style={styles.commentHeader}>
                        <span style={styles.commentAuthor}>
                          {comment.author}
                          {comment.authorId?.includes('admin') && (
                            <span style={styles.adminTag}>Admin</span>
                          )}
                        </span>
                        <span style={styles.commentTime}>{formatTime(comment.created_at)}</span>
                      </div>
                      <p style={styles.commentText}>{comment.content}</p>
                      <div style={styles.commentActions}>
                        <button style={styles.commentAction}><ThumbsUp size={14} /> {comment.likes}</button>
                        {isAdmin && (
                          <button 
                            style={styles.commentActionDelete}
                            onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmBox}>
            <Trash2 size={32} color="#ef4444" />
            <h3>Delete this post?</h3>
            <p>This action cannot be undone.</p>
            <div style={styles.confirmButtons}>
              <button onClick={() => setShowDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => handleDeletePost(showDeleteConfirm)} style={styles.deleteConfirmBtn}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div style={styles.modalOverlay} onClick={() => setShowNewPost(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Create Discussion</h3>
              <button onClick={() => setShowNewPost(false)}><X size={20} /></button>
            </div>
            <select 
              style={styles.input}
              value={newPostData.category}
              onChange={e => setNewPostData({...newPostData, category: e.target.value})}
            >
              {CATEGORIES.discussion.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input 
              style={styles.input}
              placeholder="Title"
              value={newPostData.title}
              onChange={e => setNewPostData({...newPostData, title: e.target.value})}
            />
            <textarea 
              style={styles.textarea}
              placeholder="What's on your mind?"
              rows={5}
              value={newPostData.content}
              onChange={e => setNewPostData({...newPostData, content: e.target.value})}
            />
            <button 
              style={styles.primaryButton}
              onClick={handleNewPost}
              disabled={!newPostData.title.trim() || !newPostData.content.trim()}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Upload Audio Modal */}
      {showUploadAudio && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadAudio(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Upload Audio</h3>
              <button onClick={() => setShowUploadAudio(false)}><X size={20} /></button>
            </div>
            <div style={styles.formGroup}>
              <label>Audio File URL (Google Drive, etc.)</label>
              <input 
                style={styles.input}
                placeholder="https://..."
                value={uploadData.fileUrl}
                onChange={e => setUploadData({...uploadData, fileUrl: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Title</label>
              <input 
                style={styles.input}
                value={uploadData.title}
                onChange={e => setUploadData({...uploadData, title: e.target.value})}
              />
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Type</label>
                <select 
                  style={styles.input}
                  value={uploadData.type}
                  onChange={e => setUploadData({...uploadData, type: e.target.value})}
                >
                  {CATEGORIES.audio.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Duration</label>
                <input 
                  style={styles.input}
                  placeholder="5:30"
                  value={uploadData.duration}
                  onChange={e => setUploadData({...uploadData, duration: e.target.value})}
                />
              </div>
            </div>
            <button style={styles.primaryButton} onClick={handleAudioUpload}>Upload</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Profile</h3>
              <button onClick={() => setShowProfile(false)}><X size={20} /></button>
            </div>
            <div style={styles.formGroup}>
              <label>Display Name</label>
              <input 
                style={styles.input}
                value={profileForm.displayName}
                onChange={e => setProfileForm({...profileForm, displayName: e.target.value})}
              />
            </div>
            <button 
              style={styles.primaryButton}
              onClick={() => {
                const updated = {...user, display_name: profileForm.displayName};
                setUser(updated);
                localStorage.setItem('wellnessUser', JSON.stringify(updated));
                setShowProfile(false);
                showToast('Profile updated');
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#fafaf9', color: '#1e293b', fontFamily: 'system-ui, sans-serif' },
  loadingScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  
  // Auth
  loginContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginBox: { background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' },
  loginHeader: { textAlign: 'center', marginBottom: '32px' },
  loginTitle: { fontSize: '28px', fontWeight: '700', margin: '16px 0 4px' },
  loginSubtitle: { color: '#64748b' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  authInput: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' },
  authButton: { width: '100%', padding: '12px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBanner: { background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  demoHint: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '16px' },
  
  // Toast
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease' },
  toastSuccess: { background: '#10b981', color: 'white' },
  toastError: { background: '#ef4444', color: 'white' },
  
  // Header
  header: { position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f5f9', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandText: { fontSize: '20px', fontWeight: '700' },
  adminBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '700', borderRadius: '20px', textTransform: 'uppercase' },
  nav: { display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' },
  navButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
  navButtonActive: { background: 'white', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  userActions: { display: 'flex', gap: '8px' },
  iconButton: { width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // Main
  main: { maxWidth: '800px', margin: '0 auto', padding: '32px 20px' },
  section: { marginBottom: '40px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', margin: 0 },
  sectionSubtitle: { color: '#64748b', margin: '4px 0 0 0', fontSize: '15px' },
  primaryButton: { padding: '10px 20px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  
  // Controls
  controlsBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchBox: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' },
  clearSearch: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  sortSelect: { padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' },
  
  // Categories
  categoryPills: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '8px' },
  pill: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  pillActive: { background: '#fce7f3', color: '#ec4899', borderColor: '#fce7f3' },
  
  // Cards
  cardList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  cardHover: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  pinnedCard: { background: '#fffbeb', borderColor: '#fef3c7' },
  pinnedBadge: { position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  categoryTag: { fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timeStamp: { fontSize: '13px', color: '#94a3b8' },
  cardTitle: { fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', lineHeight: 1.3 },
  cardExcerpt: { color: '#475569', fontSize: '15px', lineHeight: 1.6', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc' },
  author: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' },
  avatarSmall: { width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  stats: { display: 'flex', gap: '12px', alignItems: 'center' },
  statBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  statBtnActive: { background: '#fce7f3', color: '#ec4899' },
  deleteBtn: { padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', borderRadius: '6px' },
  
  // Empty/Skeleton
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
  link: { color: '#ec4899', cursor: 'pointer', textDecoration: 'underline' },
  skeletonList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  skeletonCard: { height: '140px', background: '#f1f5f9', borderRadius: '16px', animation: 'pulse 2s infinite' },
  
  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' },
  modal: { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' },
  detailModal: { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '120px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  formGroup: { marginBottom: '16px', padding: '0 24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '0 24px' },
  
  // Detail View
  detailHeader: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: '600', cursor: 'pointer' },
  detailCategory: { flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#059669', textTransform: 'uppercase' },
  adminDelete: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  detailContent: { padding: '24px' },
  detailTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 20px 0', lineHeight: 1.3 },
  detailAuthor: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detailAuthorName: { fontWeight: '700' },
  detailTime: { fontSize: '13px', color: '#94a3b8' },
  detailBody: { fontSize: '16px', lineHeight: 1.8, color: '#475569', marginBottom: '24px' },
  detailActions: { display: 'flex', gap: '12px', padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: '600', cursor: 'pointer' },
  actionBtnActive: { background: '#fce7f3', color: '#ec4899' },
  
  // Comments
  commentsSection: { padding: '24px', background: '#fafaf9' },
  commentsTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' },
  commentInputBox: { display: 'flex', gap: '12px', marginBottom: '24px' },
  commentInput: { flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px' },
  sendBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  comment: { display: 'flex', gap: '12px' },
  commentContent: { flex: 1 },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  commentAuthor: { fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' },
  adminTag: { fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' },
  commentTime: { fontSize: '12px', color: '#94a3b8' },
  commentText: { margin: 0, color: '#475569', lineHeight: 1.5, fontSize: '14px' },
  commentActions: { display: 'flex', gap: '12px', marginTop: '8px' },
  commentAction: { fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  commentActionDelete: { fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' },
  
  // Confirmation
  confirmBox: { background: 'white', padding: '32px', borderRadius: '20px', textAlign: 'center', maxWidth: '360px' },
  confirmButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600' },
  deleteConfirmBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' },
  
  // Audio
  audioBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 50 },
  audioBarPlay: { width: '40px', height: '40px', borderRadius: '50%', background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  audioBarInfo: { flex: 1 },
  audioBarTitle: { fontWeight: '700' },
  audioBarMeta: { fontSize: '13px', color: '#64748b' },
  audioProgress: { width: '200px', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' },
  audioProgressFill: { width: '40%', height: '100%', background: '#ec4899', borderRadius: '2px' },
  audioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  audioCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', cursor: 'pointer' },
  audioThumb: { height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  audioPlayBtn: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  audioInfo: { padding: '16px' },
  audioType: { fontSize: '12px', fontWeight: '700', color: '#ec4899', textTransform: 'uppercase' },
  audioTitle: { margin: '4px 0', fontSize: '15px', fontWeight: '700' },
  audioMeta: { fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' },
  
  // Resources
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  resourceCard: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '16px' },
  downloadBtn: { padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' },
};

export default WellnessPortal;

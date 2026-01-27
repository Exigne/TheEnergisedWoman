import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  BookOpen, 
  Music, 
  Heart, 
  Sparkles, 
  User, 
  LogOut, 
  Settings, 
  Search, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  X, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Filter,
  Clock,
  Send,
  Trash2,
  Shield,
  MoreHorizontal,
  ChevronLeft,
  Flag,
  Headphones,
  FileText
} from 'lucide-react';

// Categories for organization
const CATEGORIES = {
  discussion: ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood'],
  resources: ['Articles', 'Guides', 'Templates', 'E-books', 'External Links'],
  audio: ['Meditations', 'Affirmations', 'Sleep Stories', 'Podcasts', 'Soundscapes']
};

// Enhanced sample data with comments
const SAMPLE_DISCUSSIONS = [];

// Neon Database API URL - Replace with your actual Neon API endpoint
const NEON_API_URL = 'YOUR_NEON_API_ENDPOINT_HERE';

// Database API functions
const api = {
  // Fetch all discussions
  fetchDiscussions: async () => {
    try {
      const response = await fetch(`${NEON_API_URL}/discussions`);
      if (!response.ok) throw new Error('Failed to fetch discussions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching discussions:', error);
      return [];
    }
  },

  // Create new discussion
  createDiscussion: async (discussion) => {
    try {
      const response = await fetch(`${NEON_API_URL}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discussion)
      });
      if (!response.ok) throw new Error('Failed to create discussion');
      return await response.json();
    } catch (error) {
      console.error('Error creating discussion:', error);
      return null;
    }
  },

  // Update discussion (for likes, comments)
  updateDiscussion: async (id, updates) => {
    try {
      const response = await fetch(`${NEON_API_URL}/discussions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update discussion');
      return await response.json();
    } catch (error) {
      console.error('Error updating discussion:', error);
      return null;
    }
  },

  // Delete discussion
  deleteDiscussion: async (id) => {
    try {
      const response = await fetch(`${NEON_API_URL}/discussions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete discussion');
      return true;
    } catch (error) {
      console.error('Error deleting discussion:', error);
      return false;
    }
  }
};

const SAMPLE_RESOURCES = [
  {
    id: 1,
    title: "30-Day Self-Care Challenge",
    type: "Guide",
    category: "Self Care",
    author: "Dr. Rachel Kim",
    downloads: 1240,
    description: "A comprehensive guide to building sustainable self-care habits",
    fileSize: "2.4 MB",
    format: "PDF"
  },
  {
    id: 2,
    title: "Sleep Hygiene Checklist",
    type: "Template",
    category: "Wellness",
    author: "Sleep Foundation",
    downloads: 856,
    description: "Essential steps for improving sleep quality naturally",
    fileSize: "850 KB",
    format: "PDF"
  }
];

const SAMPLE_AUDIO = [
  {
    id: 1,
    title: "Morning Affirmations for Confidence",
    type: "Affirmations",
    duration: "5:30",
    author: "Wellness Team",
    plays: 3420,
    description: "Start your day with positive affirmations for self-confidence",
    thumbnail: "pink"
  },
  {
    id: 2,
    title: "Deep Sleep Meditation",
    type: "Meditation",
    duration: "20:00",
    author: "Sarah Chen",
    plays: 8901,
    description: "Guided meditation to help you fall into deep, restful sleep",
    thumbnail: "purple"
  }
];

const WellnessPortal = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('community');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Admin check - in real app, this would come from backend
  const isAdmin = user?.email?.includes('admin') || false;
  
  // Community state
  const [discussions, setDiscussions] = useState(SAMPLE_DISCUSSIONS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General' });
  
  // Post detail modal state
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Resources state
  const [resources, setResources] = useState(SAMPLE_RESOURCES);
  const [resourceFilter, setResourceFilter] = useState('All');
  
  // Audio state
  const [audioLibrary, setAudioLibrary] = useState(SAMPLE_AUDIO);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadAudio, setShowUploadAudio] = useState(false);
  const [uploadData, setUploadData] = useState({ 
    title: '', 
    type: 'Meditation', 
    duration: '', 
    description: '',
    fileUrl: ''
  });
  
  // Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' });
  
  // Audio player ref
  const audioRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        bio: userData.bio || ''
      });
    }
  }, []);
  
  // Load discussions from database
  useEffect(() => {
    if (user) {
      loadDiscussions();
    }
  }, [user]);
  
  const loadDiscussions = async () => {
    const data = await api.fetchDiscussions();
    if (data && data.length > 0) {
      setDiscussions(data);
    }
  };
  
  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Playback error:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentlyPlaying]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userData = { 
        email, 
        display_name: email.split('@')[0],
        bio: '',
        joined: new Date().toISOString()
      };
      setUser(userData);
      localStorage.setItem('wellnessUser', JSON.stringify(userData));
      setError(null);
    } catch (e) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Like functionality
  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    
    const post = discussions.find(p => p.id === postId);
    const hasLiked = post.likedBy.includes(user.email);
    
    const updatedPost = {
      ...post,
      likes: hasLiked ? post.likes - 1 : post.likes + 1,
      likedBy: hasLiked 
        ? post.likedBy.filter(id => id !== user.email)
        : [...post.likedBy, user.email]
    };
    
    // Update in database
    await api.updateDiscussion(postId, updatedPost);
    
    // Update local state
    setDiscussions(prev => prev.map(p => p.id === postId ? updatedPost : p));
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    
    const newComment = {
      id: Date.now(),
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      content: commentText,
      timestamp: "Just now",
      likes: 0
    };
    
    const updatedPost = {
      ...selectedPost,
      comments: [...selectedPost.comments, newComment]
    };
    
    // Update in database
    await api.updateDiscussion(selectedPost.id, updatedPost);
    
    // Update local state
    setDiscussions(prev => prev.map(post => 
      post.id === selectedPost.id ? updatedPost : post
    ));
    
    setSelectedPost(updatedPost);
    setCommentText('');
  };

  // Delete post (admin only)
  const handleDeletePost = async (postId) => {
    if (!isAdmin) return;
    
    // Delete from database
    const success = await api.deleteDiscussion(postId);
    
    if (success) {
      // Update local state
      setDiscussions(prev => prev.filter(post => post.id !== postId));
      setSelectedPost(null);
      setShowDeleteConfirm(null);
    }
  };

  // Delete comment (admin only)
  const handleDeleteComment = async (postId, commentId) => {
    if (!isAdmin) return;
    
    const post = discussions.find(p => p.id === postId);
    const updatedPost = {
      ...post,
      comments: post.comments.filter(c => c.id !== commentId)
    };
    
    // Update in database
    await api.updateDiscussion(postId, updatedPost);
    
    // Update local state
    setDiscussions(prev => prev.map(p => 
      p.id === postId ? updatedPost : p
    ));
    
    if (selectedPost) {
      setSelectedPost(updatedPost);
    }
  };

  const handleNewPost = async () => {
    if (!newPostData.title || !newPostData.content) return;
    
    const post = {
      id: Date.now(),
      author: user.display_name || user.email.split('@')[0],
      authorId: user.email,
      avatar: "",
      category: newPostData.category,
      title: newPostData.title,
      content: newPostData.content,
      likes: 0,
      likedBy: [],
      comments: [],
      timestamp: new Date().toISOString(),
      tags: [],
      isPinned: false
    };
    
    // Save to database
    const savedPost = await api.createDiscussion(post);
    
    if (savedPost) {
      // Update local state
      setDiscussions([savedPost, ...discussions]);
      setNewPostData({ title: '', content: '', category: 'General' });
      setShowNewPost(false);
    }
  };

  const handleAudioUpload = () => {
    if (!uploadData.title || !uploadData.fileUrl) return;
    
    // Convert Google Drive link to direct playable URL
    let audioUrl = uploadData.fileUrl;
    if (audioUrl.includes('drive.google.com')) {
      const fileIdMatch = audioUrl.match(/\/d\/([^\/]+)/);
      if (fileIdMatch) {
        audioUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }
    
    const newAudio = {
      id: Date.now(),
      title: uploadData.title,
      type: uploadData.type,
      duration: uploadData.duration || "5:00",
      author: user.display_name || "You",
      plays: 0,
      description: uploadData.description,
      thumbnail: "pink",
      audioUrl: audioUrl
    };
    
    setAudioLibrary([newAudio, ...audioLibrary]);
    setUploadData({ title: '', type: 'Meditation', duration: '', description: '', fileUrl: '' });
    setShowUploadAudio(false);
  };

  const togglePlay = (id) => {
    const audio = audioLibrary.find(a => a.id === id);
    
    if (currentlyPlaying === id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(id);
      setIsPlaying(true);
      
      // Load new audio source
      if (audioRef.current && audio?.audioUrl) {
        audioRef.current.src = audio.audioUrl;
        audioRef.current.load();
      }
    }
  };

  const filteredDiscussions = selectedCategory === 'All' 
    ? discussions 
    : discussions.filter(d => d.category === selectedCategory);

  // If no user is logged in, show login screen
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginContainer}>
          <div style={styles.loginBox}>
            <div style={styles.loginHeader}>
              <Heart size={48} color="#ec4899" fill="#fce7f3" />
              <h1 style={styles.loginTitle}>Serenity Space</h1>
              <p style={styles.loginSubtitle}>Your wellness community awaits</p>
            </div>
            
            {error && (
              <div style={styles.errorMessage}>{error}</div>
            )}
            
            <div style={styles.loginForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input 
                  type="email"
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input 
                  type="password"
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              
              <button 
                style={styles.loginButton}
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              
              <p style={styles.loginHint}>
                Use any email (try "admin@example.com" for admin access)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hidden Audio Player */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Heart size={28} color="#ec4899" fill="#fce7f3" />
          <h1 style={styles.brandText}>Serenity Space</h1>
          {isAdmin && (
            <span style={styles.adminBadge}>
              <Shield size={14} />
              Admin
            </span>
          )}
        </div>
        
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('community')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'community' ? styles.navButtonActive : {})
            }}
          >
            <MessageCircle size={18} />
            Community
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'resources' ? styles.navButtonActive : {})
            }}
          >
            <BookOpen size={18} />
            Resources
          </button>
          <button 
            onClick={() => setActiveTab('audio')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'audio' ? styles.navButtonActive : {})
            }}
          >
            <Headphones size={18} />
            Audio
          </button>
        </nav>
        
        <div style={styles.userActions}>
          <button 
            onClick={() => setShowProfile(true)}
            style={styles.iconButton}
          >
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

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Community Discussions</h2>
                <p style={styles.sectionSubtitle}>Connect, share, and grow together</p>
              </div>
              <button 
                style={styles.primaryButtonSmall}
                onClick={() => setShowNewPost(true)}
              >
                <MessageSquare size={16} />
                New Discussion
              </button>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
              <div style={styles.filterTabs}>
                <button 
                  style={{
                    ...styles.filterTab,
                    ...(selectedCategory === 'All' ? styles.filterTabActive : {})
                  }}
                  onClick={() => setSelectedCategory('All')}
                >
                  All Topics
                </button>
                {CATEGORIES.discussion.map(cat => (
                  <button 
                    key={cat}
                    style={{
                      ...styles.filterTab,
                      ...(selectedCategory === cat ? styles.filterTabActive : {})
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussion List */}
            <div style={styles.cardList}>
              {filteredDiscussions.map(post => (
                <article 
                  key={post.id} 
                  style={{
                    ...styles.discussionCard,
                    ...(post.isPinned ? styles.pinnedCard : {})
                  }}
                  onClick={() => setSelectedPost(post)}
                >
                  {post.isPinned && (
                    <div style={styles.pinnedBadge}>
                      <Sparkles size={12} />
                      Featured
                    </div>
                  )}
                  <div style={styles.cardMeta}>
                    <span style={styles.categoryTag}>{post.category}</span>
                    <span style={styles.timestamp}>{post.timestamp}</span>
                  </div>
                  
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardContent}>{post.content}</p>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.authorInfo}>
                      <div style={styles.avatarPlaceholder}>
                        <User size={16} color="#94a3b8" />
                      </div>
                      <span style={styles.authorName}>{post.author}</span>
                    </div>
                    
                    <div style={styles.cardStats} onClick={e => e.stopPropagation()}>
                      <button 
                        style={{
                          ...styles.statButton,
                          ...(post.likedBy.includes(user?.email) ? styles.statButtonActive : {})
                        }}
                        onClick={(e) => handleLike(post.id, e)}
                      >
                        <ThumbsUp size={16} fill={post.likedBy.includes(user?.email) ? "#ec4899" : "none"} />
                        {post.likes}
                      </button>
                      <button style={styles.statButton}>
                        <MessageSquare size={16} />
                        {post.comments.length}
                      </button>
                      <button style={styles.iconButtonGhost}>
                        <Share2 size={16} />
                      </button>
                      {isAdmin && (
                        <button 
                          style={styles.deleteButtonSmall}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(post.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Resource Library</h2>
                <p style={styles.sectionSubtitle}>Curated guides and tools for your journey</p>
              </div>
            </div>
            <div style={styles.resourceGrid}>
              {resources.map(resource => (
                <div key={resource.id} style={styles.resourceCard}>
                  <div style={styles.resourceIcon}>
                    <FileText size={32} color="#ec4899" />
                  </div>
                  <div style={styles.resourceContent}>
                    <span style={styles.resourceType}>{resource.type}</span>
                    <h3 style={styles.resourceTitle}>{resource.title}</h3>
                    <p style={styles.resourceDesc}>{resource.description}</p>
                    <button style={styles.downloadButton}>
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Audio Wellness</h2>
                <p style={styles.sectionSubtitle}>Meditations, affirmations, and calming sounds</p>
              </div>
              <button 
                style={styles.primaryButtonSmall}
                onClick={() => setShowUploadAudio(true)}
              >
                <Upload size={16} />
                Upload Audio
              </button>
            </div>

            {currentlyPlaying && (
              <div style={styles.playerBar}>
                <div style={styles.playerInfo}>
                  <button style={styles.playButton} onClick={() => togglePlay(currentlyPlaying)}>
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                  </button>
                  <div>
                    <div style={styles.playerTitle}>
                      {audioLibrary.find(a => a.id === currentlyPlaying)?.title}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.audioGrid}>
              {audioLibrary.map(audio => (
                <div key={audio.id} style={styles.audioCard} onClick={() => togglePlay(audio.id)}>
                  <div style={styles.audioThumbnail}>
                    <Headphones size={32} color="#ec4899" />
                  </div>
                  <div style={styles.audioInfo}>
                    <span style={styles.audioType}>{audio.type}</span>
                    <h3 style={styles.audioTitle}>{audio.title}</h3>
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
            {/* Post Header */}
            <div style={styles.detailHeader}>
              <button 
                style={styles.backButton}
                onClick={() => setSelectedPost(null)}
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <div style={styles.detailMeta}>
                <span style={styles.categoryTagLarge}>{selectedPost.category}</span>
                <span style={styles.timestamp}>{selectedPost.timestamp}</span>
              </div>
              {isAdmin && (
                <button 
                  style={styles.adminDeleteBtn}
                  onClick={() => setShowDeleteConfirm(selectedPost.id)}
                >
                  <Trash2 size={18} />
                  Delete Post
                </button>
              )}
            </div>

            {/* Post Content */}
            <div style={styles.detailContent}>
              <h2 style={styles.detailTitle}>{selectedPost.title}</h2>
              
              <div style={styles.detailAuthor}>
                <div style={styles.avatarLarge}>
                  <User size={24} color="#94a3b8" />
                </div>
                <div>
                  <div style={styles.detailAuthorName}>{selectedPost.author}</div>
                  <div style={styles.detailAuthorMeta}>Community Member</div>
                </div>
              </div>

              <div style={styles.detailBody}>
                {selectedPost.content}
              </div>

              {/* Tags */}
              {selectedPost.tags.length > 0 && (
                <div style={styles.tagsContainer}>
                  {selectedPost.tags.map(tag => (
                    <span key={tag} style={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div style={styles.detailActions}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...(selectedPost.likedBy.includes(user?.email) ? styles.actionButtonActive : {})
                  }}
                  onClick={() => handleLike(selectedPost.id)}
                >
                  <ThumbsUp size={20} fill={selectedPost.likedBy.includes(user?.email) ? "#ec4899" : "none"} />
                  {selectedPost.likes} likes
                </button>
                <button style={styles.actionButton}>
                  <MessageSquare size={20} />
                  {selectedPost.comments.length} comments
                </button>
                <button style={styles.actionButton}>
                  <Share2 size={20} />
                  Share
                </button>
                <button style={styles.actionButton}>
                  <Flag size={20} />
                  Report
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div style={styles.commentsSection}>
              <h3 style={styles.commentsTitle}>
                Discussion ({selectedPost.comments.length})
              </h3>

              {/* Comment Input */}
              <div style={styles.commentInputArea}>
                <div style={styles.avatarSmall}>
                  <User size={16} color="#94a3b8" />
                </div>
                <div style={styles.commentInputWrapper}>
                  <input
                    type="text"
                    placeholder="Add to the discussion..."
                    style={styles.commentInput}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button 
                    style={styles.sendButton}
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div style={styles.commentsList}>
                {selectedPost.comments.map(comment => (
                  <div key={comment.id} style={styles.commentItem}>
                    <div style={styles.avatarSmall}>
                      <User size={16} color="#94a3b8" />
                    </div>
                    <div style={styles.commentContent}>
                      <div style={styles.commentHeader}>
                        <span style={styles.commentAuthor}>
                          {comment.author}
                          {comment.isAdmin && (
                            <span style={styles.adminLabel}>
                              <Shield size={12} />
                              Admin
                            </span>
                          )}
                        </span>
                        <span style={styles.commentTime}>{comment.timestamp}</span>
                      </div>
                      <p style={styles.commentText}>{comment.content}</p>
                      <div style={styles.commentActions}>
                        <button style={styles.commentLikeBtn}>
                          <ThumbsUp size={12} />
                          {comment.likes}
                        </button>
                        <button style={styles.commentReplyBtn}>Reply</button>
                        {isAdmin && (
                          <button 
                            style={styles.commentDeleteBtn}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <div style={styles.confirmIcon}>
              <Trash2 size={32} color="#ef4444" />
            </div>
            <h3 style={styles.confirmTitle}>Delete this post?</h3>
            <p style={styles.confirmText}>
              This action cannot be undone. The post and all its comments will be permanently removed.
            </p>
            <div style={styles.confirmActions}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmDeleteButton}
                onClick={() => handleDeletePost(showDeleteConfirm)}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div style={styles.modalOverlay} onClick={() => setShowNewPost(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Start a Discussion</h3>
              <button style={styles.closeButton} onClick={() => setShowNewPost(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select 
                style={styles.select}
                value={newPostData.category}
                onChange={e => setNewPostData({...newPostData, category: e.target.value})}
              >
                {CATEGORIES.discussion.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input 
                style={styles.input}
                placeholder="What's on your mind?"
                value={newPostData.title}
                onChange={e => setNewPostData({...newPostData, title: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Message</label>
              <textarea 
                style={styles.textarea}
                placeholder="Share your thoughts..."
                value={newPostData.content}
                onChange={e => setNewPostData({...newPostData, content: e.target.value})}
                rows={5}
              />
            </div>
            <button 
              style={styles.primaryButton}
              onClick={handleNewPost}
              disabled={!newPostData.title || !newPostData.content}
            >
              Post Discussion
            </button>
          </div>
        </div>
      )}

      {/* Upload Audio Modal */}
      {showUploadAudio && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadAudio(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Upload Audio</h3>
              <button style={styles.closeButton} onClick={() => setShowUploadAudio(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select 
                style={styles.select}
                value={uploadData.type}
                onChange={e => setUploadData({...uploadData, type: e.target.value})}
              >
                {CATEGORIES.audio.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input 
                style={styles.input}
                placeholder="Audio title"
                value={uploadData.title}
                onChange={e => setUploadData({...uploadData, title: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Google Drive File URL</label>
              <input 
                style={styles.input}
                placeholder="Paste Google Drive share link here"
                value={uploadData.fileUrl}
                onChange={e => setUploadData({...uploadData, fileUrl: e.target.value})}
              />
              <p style={styles.helpText}>
                Right-click your audio file in Google Drive → Get link → Make sure it's set to "Anyone with the link"
              </p>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (e.g., 5:30)</label>
              <input 
                style={styles.input}
                placeholder="5:30"
                value={uploadData.duration}
                onChange={e => setUploadData({...uploadData, duration: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea 
                style={styles.textarea}
                placeholder="Describe your audio..."
                value={uploadData.description}
                onChange={e => setUploadData({...uploadData, description: e.target.value})}
                rows={3}
              />
            </div>
            <button 
              style={styles.primaryButton}
              onClick={handleAudioUpload}
              disabled={!uploadData.title || !uploadData.fileUrl}
            >
              Upload Audio
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Profile Settings</h3>
              <button style={styles.closeButton} onClick={() => setShowProfile(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.profileSection}>
              <div style={styles.avatarLarge}>
                <User size={40} color="#94a3b8" />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
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
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafaf9',
    color: '#1e293b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  loginBox: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  loginTitle: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '16px 0 8px 0',
    color: '#1e293b'
  },
  loginSubtitle: {
    color: '#64748b',
    fontSize: '16px',
    margin: 0
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  loginButton: {
    width: '100%',
    padding: '14px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  loginHint: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    margin: '8px 0 0 0'
  },
  errorMessage: {
    background: '#fef2f2',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  brandText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  adminBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: '#fef3c7',
    color: '#d97706',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  nav: {
    display: 'flex',
    gap: '8px',
    background: '#f8fafc',
    padding: '6px',
    borderRadius: '12px'
  },
  navButton: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navButtonActive: {
    background: '#ffffff',
    color: '#1e293b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  userActions: {
    display: 'flex',
    gap: '12px'
  },
  iconButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 40px'
  },
  section: {
    animation: 'fadeIn 0.3s ease'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '28px'
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: '16px',
    margin: 0
  },
  primaryButtonSmall: {
    padding: '10px 20px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterBar: {
    marginBottom: '24px',
    overflowX: 'auto'
  },
  filterTabs: {
    display: 'flex',
    gap: '8px',
    paddingBottom: '8px'
  },
  filterTab: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '20px',
    whiteSpace: 'nowrap'
  },
  filterTabActive: {
    background: '#fce7f3',
    color: '#ec4899',
    borderColor: '#fce7f3',
    fontWeight: '600'
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  discussionCard: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  pinnedCard: {
    border: '1px solid #fef3c7',
    background: '#fffbeb'
  },
  pinnedBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: '#fef3c7',
    color: '#d97706',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  categoryTag: {
    padding: '4px 12px',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  categoryTagLarge: {
    padding: '6px 16px',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  timestamp: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#1e293b'
  },
  cardContent: {
    color: '#475569',
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f8fafc'
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  authorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },
  cardStats: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  statButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  statButtonActive: {
    color: '#ec4899',
    background: '#fce7f3'
  },
  iconButtonGhost: {
    padding: '6px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  deleteButtonSmall: {
    padding: '6px',
    border: 'none',
    background: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  
  // Detail Modal Styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  detailModal: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    gap: '16px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: '#f8fafc',
    border: 'none',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    justifyContent: 'center'
  },
  adminDeleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#fef2f2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  detailContent: {
    padding: '24px'
  },
  detailTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 20px 0',
    lineHeight: 1.3
  },
  detailAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f1f5f9'
  },
  avatarLarge: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  detailAuthorName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b'
  },
  detailAuthorMeta: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  detailBody: {
    fontSize: '16px',
    lineHeight: 1.8,
    color: '#475569',
    marginBottom: '24px'
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px'
  },
  tag: {
    padding: '6px 12px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '13px',
    borderRadius: '20px',
    fontWeight: '500'
  },
  detailActions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9'
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: '#f8fafc',
    border: 'none',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  actionButtonActive: {
    background: '#fce7f3',
    color: '#ec4899'
  },
  
  // Comments Section
  commentsSection: {
    padding: '24px',
    background: '#fafaf9'
  },
  commentsTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 20px 0',
    color: '#1e293b'
  },
  commentInputArea: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  commentInputWrapper: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    background: '#ffffff',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  commentInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '8px 12px',
    fontSize: '14px',
    background: 'transparent'
  },
  sendButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  commentItem: {
    display: 'flex',
    gap: '12px'
  },
  commentContent: {
    flex: 1,
    background: '#ffffff',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #f1f5f9'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  commentAuthor: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  adminLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#d97706',
    fontSize: '10px',
    fontWeight: '800',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  commentTime: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  commentText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.5,
    margin: 0
  },
  commentActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  commentLikeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#64748b',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  commentReplyBtn: {
    fontSize: '12px',
    color: '#ec4899',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0
  },
  commentDeleteBtn: {
    fontSize: '12px',
    color: '#ef4444',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0
  },

  // Delete Confirmation
  confirmModal: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  confirmIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  confirmTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  confirmText: {
    color: '#64748b',
    fontSize: '14px',
    margin: '0 0 24px 0',
    lineHeight: 1.5
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '10px 24px',
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  confirmDeleteButton: {
    padding: '10px 24px',
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Other existing styles...
  modal: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: '#f8fafc',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formGroup: {
    padding: '16px 24px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    padding: '0 24px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  primaryButton: {
    width: 'calc(100% - 48px)',
    margin: '0 24px 24px',
    padding: '12px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  profileSection: {
    textAlign: 'center',
    padding: '24px'
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  resourceCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    padding: '24px',
    display: 'flex',
    gap: '16px'
  },
  resourceIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#fdf2f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resourceContent: {
    flex: 1
  },
  resourceType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ec4899'
  },
  resourceTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '4px 0 8px 0'
  },
  resourceDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '12px'
  },
  downloadButton: {
    padding: '8px 16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  audioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  },
  audioCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  audioThumbnail: {
    height: '140px',
    background: '#fce7f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  audioInfo: {
    padding: '16px'
  },
  audioType: {
    fontSize: '12px',
    color: '#ec4899',
    fontWeight: '600'
  },
  audioTitle: {
    fontSize: '15px',
    fontWeight: '700',
    margin: '4px 0 0 0'
  },
  playerBar: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    background: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    padding: '12px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  playButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#ec4899',
    border: 'none',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  playerTitle: {
    fontWeight: '600'
  },
  helpText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '6px',
    lineHeight: 1.4
  }
};

export default WellnessPortal;

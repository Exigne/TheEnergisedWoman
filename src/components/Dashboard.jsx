import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, User, LogOut, Search, X, ThumbsUp, 
  MessageSquare, Send, Trash2, Shield, ChevronLeft, Flag, 
  Loader2, Sparkles, Upload, FileText, Music, Crown, Female
} from 'lucide-react';

const CATEGORIES = {
  discussion: ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition']
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Community State
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Resources stored in state (from Neon) but managed by admin only - currently hidden from main view
  const [resources, setResources] = useState([]);
  const [showResourcesPanel, setShowResourcesPanel] = useState(false);
  const [showUploadResource, setShowUploadResource] = useState(false);
  const [resourceData, setResourceData] = useState({ title: '', type: 'Guide', description: '', url: '' });

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' });

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
      if (userData.isAdmin) loadResources();
    }
  }, []);

  const loadDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/database?type=discussions', { method: 'GET' });
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

  // Load resources (admin only view)
  const loadResources = async () => {
    try {
      const response = await fetch('/.netlify/functions/database?type=resources', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (err) {
      console.error('Failed to load resources');
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
          setUser({...newUser, isAdmin: newUser.is_admin || email.includes('admin')});
          setIsAdmin(newUser.is_admin || email.includes('admin'));
          localStorage.setItem('wellnessUser', JSON.stringify(newUser));
          showToast('Account created!', 'success');
          loadDiscussions();
          if (newUser.is_admin || email.includes('admin')) loadResources();
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
      if (userData.isAdmin) loadResources();
      
    } catch (err) {
      setError('Cannot connect. Please try again.');
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
      await fetch(`/.netlify/functions/database?id=${postId}&type=discussion`, {
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
    
    try {
      await fetch(`/.netlify/functions/database?id=${selectedPost.id}&type=discussion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
      
      setDiscussions(prev => prev.map(p => p.id === selectedPost.id ? {...p, comments: updatedComments} : p));
      setSelectedPost(prev => ({...prev, comments: updatedComments}));
      setCommentText('');
    } catch (err) {}
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
      const response = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const saved = await response.json();
      setDiscussions(prev => [saved, ...prev]);
      setNewPostData({ title: '', content: '', category: 'General' });
      setShowNewPost(false);
      showToast('Posted!', 'success');
    } catch (err) {
      showToast('Failed to post', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!isAdmin) return;
    try {
      await fetch(`/.netlify/functions/database?id=${postId}&type=discussion`, { method: 'DELETE' });
      setDiscussions(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
      setShowDeleteConfirm(null);
      showToast('Deleted', 'success');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!isAdmin) return;
    const post = discussions.find(p => p.id === postId);
    const updatedComments = post.comments.filter(c => c.id !== commentId);
    
    try {
      await fetch(`/.netlify/functions/database?id=${postId}&type=discussion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
      setDiscussions(prev => prev.map(p => p.id === postId ? {...p, comments: updatedComments} : p));
      setSelectedPost(prev => ({...prev, comments: updatedComments}));
    } catch (err) {}
  };

  // Admin only: Handle resource upload
  const handleResourceUpload = async () => {
    if (!resourceData.title || !resourceData.url) return;
    
    try {
      const response = await fetch('/.netlify/functions/database?type=resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resourceData,
          author: user.display_name || user.email,
          downloads: 0
        })
      });
      
      if (response.ok) {
        showToast('Resource uploaded!', 'success');
        setResourceData({ title: '', type: 'Guide', description: '', url: '' });
        setShowUploadResource(false);
        loadResources();
      }
    } catch (err) {
      showToast('Upload failed', 'error');
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
            {/* Changed from Heart to Sparkles/Crown motif */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Crown size={40} color="#ec4899" />
              <Female size={48} color="#ec4899" />
            </div>
            <h1 style={styles.loginTitle}>The Energised Woman</h1>
            <p style={styles.loginSubtitle}>Empowerment, wellness & community</p>
          </div>
          
          {error && <div style={styles.errorBanner}>{error}</div>}
          
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" style={styles.authInput} value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" style={styles.authInput} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" style={styles.authButton} disabled={authLoading}>
              {authLoading ? 'Loading...' : 'Enter'}
            </button>
          </form>
          
          <p style={styles.loginHint}>Welcome to your wellness journey</p>
        </div>
        
        {toast && <div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}>{toast.message}</div>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toast && <div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}>{toast.message}</div>}
      
      <header style={styles.header}>
        <div style={styles.brand}>
          {/* Woman motif instead of heart */}
          <Female size={32} color="#ec4899" />
          <h1 style={styles.brandText}>The Energised Woman</h1>
          {isAdmin && <span style={styles.adminBadge}><Shield size={14} /> Admin</span>}
        </div>
        
        {/* Admin only: Resource Management Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && (
            <button 
              onClick={() => setShowResourcesPanel(true)} 
              style={styles.adminPanelBtn}
            >
              <FileText size={18} />
              Resources
            </button>
          )}
          
          <div style={styles.nav}>
            <button style={{...styles.navButton, ...styles.navButtonActive}}>
              <MessageCircle size={18} />
              Community
            </button>
          </div>
        </div>
        
        <div style={styles.userActions}>
          <button onClick={() => setShowProfile(true)} style={styles.iconButton}><User size={20} color="#64748b" /></button>
          <button onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}} style={styles.iconButton}><LogOut size={20} color="#64748b" /></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Community Only - Resources and Audio removed from main view */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Community</h2>
              <p style={styles.sectionSubtitle}>Connect and share with other energised women</p>
            </div>
            <button style={styles.primaryButton} onClick={() => setShowNewPost(true)}>
              <MessageSquare size={16} /> New Discussion
            </button>
          </div>

          <div style={styles.controlsBar}>
            <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input type="text" placeholder="Search discussions..." style={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
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
                <button style={styles.actionButton}><Flag size={20} /> Report</button>
              </div>
            </div>

            <div style={styles.commentsSection}>
              <h3 style={styles.commentsTitle}>Comments ({selectedPost.comments?.length || 0})</h3>
              <div style={styles.commentInputArea}>
                <div style={styles.avatarSmall}><User size={16} /></div>
                <div style={styles.commentInputWrapper}>
                  <input type="text" placeholder="Add to the discussion..." style={styles.commentInput} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
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
                      {isAdmin && <button style={styles.commentDeleteBtn} onClick={() => handleDeleteComment(selectedPost.id, comment.id)}>Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Only: Resources Panel */}
      {isAdmin && showResourcesPanel && (
        <div style={styles.modalOverlay} onClick={() => setShowResourcesPanel(false)}>
          <div style={{...styles.detailModal, maxWidth: 800}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Resource Management (Admin Only)</h3>
              <button onClick={() => setShowResourcesPanel(false)}><X size={20} /></button>
            </div>
            <div style={{padding: 24}}>
              <p style={{marginBottom: 16, color: '#64748b'}}>Resources are stored in Neon.tech database but hidden from public view.</p>
              
              <button style={styles.primaryButton} onClick={() => setShowUploadResource(true)}>
                <Upload size={16} /> Upload New Resource
              </button>

              <div style={{marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12}}>
                {resources.map(resource => (
                  <div key={resource.id} style={{padding: 16, background: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontWeight: 700}}>{resource.title}</div>
                      <div style={{fontSize: 13, color: '#64748b'}}>{resource.type} • {resource.downloads} downloads</div>
                    </div>
                    <FileText size={20} color="#ec4899" />
                  </div>
                ))}
                {resources.length === 0 && <p style={{color: '#94a3b8'}}>No resources uploaded yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Only: Upload Resource Modal */}
      {isAdmin && showUploadResource && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadResource(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Upload Resource (Admin Only)</h3>
              <button onClick={() => setShowUploadResource(false)}><X size={20} /></button>
            </div>
            <input style={styles.input} placeholder="Resource Title" value={resourceData.title} onChange={e => setResourceData({...resourceData, title: e.target.value})} />
            <select style={styles.input} value={resourceData.type} onChange={e => setResourceData({...resourceData, type: e.target.value})}>
              <option>Guide</option>
              <option>Template</option>
              <option>E-book</option>
              <option>Article</option>
            </select>
            <textarea style={styles.textarea} placeholder="Description" rows={3} value={resourceData.description} onChange={e => setResourceData({...resourceData, description: e.target.value})} />
            <input style={styles.input} placeholder="File URL" value={resourceData.url} onChange={e => setResourceData({...resourceData, url: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleResourceUpload} disabled={!resourceData.title || !resourceData.url}>Upload to Database</button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmBox}>
            <Trash2 size={32} color="#ef4444" />
            <h3>Delete this post?</h3>
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
              {CATEGORIES.discussion.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Title" value={newPostData.title} onChange={e => setNewPostData({...newPostData, title: e.target.value})} />
            <textarea style={styles.textarea} placeholder="Share your thoughts..." rows={5} value={newPostData.content} onChange={e => setNewPostData({...newPostData, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost} disabled={!newPostData.title.trim() || !newPostData.content.trim()}>Post</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Profile</h3>
              <button style={styles.closeButton} onClick={() => setShowProfile(false)}><X size={20} /></button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
              <input style={styles.input} value={profileForm.displayName} onChange={e => setProfileForm({...profileForm, displayName: e.target.value})} />
            </div>
            <button style={styles.primaryButton} onClick={() => { const updated = {...user, display_name: profileForm.displayName}; setUser(updated); localStorage.setItem('wellnessUser', JSON.stringify(updated)); setShowProfile(false); showToast('Profile updated'); }}>Save</button>
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
  toast: { position: 'fixed', top: 20, right: 20, padding: '16px 20px', borderRadius: 12, color: 'white', zIndex: 1000 },
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
  iconButton: { width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminPanelBtn: { padding: '8px 16px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  
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
  
  // Categories
  categoryPills: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 8 },
  pill: { padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  pillActive: { background: '#fce7f3', color: '#ec4899', borderColor: '#fce7f3' },
  
  // Cards
  cardList: { display: 'flex', flexDirection: 'column', gap: 16 },
  discussionCard: { background: 'white', padding: 24, borderRadius: 16, border: '1px solid #f1f5f9', cursor: 'pointer', position: 'relative' },
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
  modalHeader: { display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  closeButton: { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f8fafc', cursor: 'pointer' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 100, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 },
  formGroup: { padding: '0 24px', marginBottom: 16 },
  
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
  commentInput: { flex: 1, border: 'none', outline: 'none', padding: '8px 16px', fontSize: 14 },
  sendButton: { width: 36, height: 36, borderRadius: '50%', background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 16 },
  comment: { display: 'flex', gap: 12 },
  commentContent: { flex: 1, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  adminLabel: { fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 800 },
  commentTime: { fontSize: 12, color: '#94a3b8' },
  commentText: { margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.5 },
  commentDeleteBtn: { fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 },
  
  // Confirm
  confirmBox: { background: 'white', padding: 32, borderRadius: 20, textAlign: 'center', maxWidth: 360 },
  confirmActions: { display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' },
  cancelButton: { padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 },
  confirmDeleteBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 }
};

export default Dashboard;

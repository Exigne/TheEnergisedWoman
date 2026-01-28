import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, FileText, User, 
  Trash2, Hash, Send, MessageCircle, PlayCircle, BookOpen, 
  Utensils, LayoutGrid, Settings, ExternalLink, ChevronRight, Heart
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
  const [viewingDoc, setViewingDoc] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profilePic: userData.profilePic || ''
      });
      loadAllData();
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

  const handleAuth = async (e) => {
    e.preventDefault();
    const type = isRegistering ? 'register' : 'login';
    const res = await fetch(`/.netlify/functions/database?type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('wellnessUser', JSON.stringify(data));
      window.location.reload();
    } else alert(data.message);
  };

  const handleUpdateProfile = async () => {
    const res = await fetch('/.netlify/functions/database?type=updateProfile', {
      method: 'PUT',
      body: JSON.stringify({ email: user.email, ...profileForm })
    });
    if (res.ok) {
      const updated = { ...user, ...profileForm };
      setUser(updated);
      localStorage.setItem('wellnessUser', JSON.stringify(updated));
      setShowModal(null);
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) {
      alert("Fill in title and content");
      return;
    }
    
    const payload = { 
      ...postForm, 
      userEmail: user.email
    };
    
    try {
      const res = await fetch('/.netlify/functions/database?type=discussion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPostForm({ title: '', content: '', category: 'General' });
        setShowModal(null);
        await loadAllData();
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch('/.netlify/functions/database?type=likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id })
      });
      
      if (res.ok) {
        await loadAllData();
        // Update selectedPost if viewing
        if (selectedPost && selectedPost.id === postId) {
          const updated = discussions.find(d => d.id === postId);
          setSelectedPost(updated);
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
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
        // Refresh the selected post
        const updated = discussions.find(d => d.id === selectedPost.id);
        setSelectedPost(updated);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleAddVideo = async () => {
    const res = await fetch('/.netlify/functions/database?type=video', {
      method: 'POST',
      body: JSON.stringify(videoForm)
    });
    if (res.ok) { 
      setVideoForm({ title: '', url: '', description: '' });
      setShowModal(null); 
      loadAllData(); 
    }
  };

  const handleAddResource = async () => {
    const res = await fetch('/.netlify/functions/database?type=resource', {
      method: 'POST',
      body: JSON.stringify(resourceForm)
    });
    if (res.ok) { 
      setResourceForm({ title: '', url: '', category: 'General' });
      setShowModal(null); 
      loadAllData(); 
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Delete this?")) {
      await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      loadAllData();
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    return `https://www.youtube.com/embed/${id}`;
  };

  const openPostDetail = (post) => {
    setSelectedPost(post);
    setShowModal('postDetail');
  };

  const hasUserLiked = (post) => {
    if (!post.likes || !user) return false;
    return post.likes.includes(user.id);
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}><Crown size={40} color="#ec4899" /><h2>The Energised Woman Collective Login</h2></div>
          <form onSubmit={handleAuth}>
            <input style={styles.input} type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button style={styles.primaryButtonFull}>{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button style={styles.ghostButtonFull} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already a member? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown color="#ec4899" /> <span>The Energised Woman Collective</span></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={activeTab === 'community' ? styles.navBtnActive : styles.navBtn}>Community</button>
          <button onClick={() => setActiveTab('video')} style={activeTab === 'video' ? styles.navBtnActive : styles.navBtn}>Video Hub</button>
          <button onClick={() => setActiveTab('resources')} style={activeTab === 'resources' ? styles.navBtnActive : styles.navBtn}>Resources</button>
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={styles.avatarMini}>
            {profileForm.profilePic ? <img src={profileForm.profilePic} style={styles.avatarImg} alt="P" /> : <User size={18} />}
          </div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconBtn}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={activeGroup === g ? styles.sidebarBtnActive : styles.sidebarBtn}><Hash size={14} /> {g}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card} onClick={() => openPostDetail(post)}>
                  <div style={styles.cardHeader}>
                    <span style={styles.tag}>{post.category}</span>
                    {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion');}} style={styles.delBtn}><Trash2 size={14}/></button>}
                  </div>
                  <h3>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content}</p>
                  <div style={styles.cardMeta}>
                    <span><User size={12}/> {post.author}</span>
                    <span style={styles.metaItem}><Heart size={12}/> {post.likes ? post.likes.length : 0} likes</span>
                    <span style={styles.metaItem}><MessageCircle size={12}/> {post.comments ? post.comments.length : 0} comments</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'video' && (
          <div style={styles.videoGrid}>
            <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <h2>Video Hub</h2>
               {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}
            </div>
            {videos.map(v => (
              <div key={v.id} style={styles.videoCard}>
                <div style={styles.videoFrameWrapper}><iframe src={getVideoEmbedUrl(v.url)} style={styles.videoIframe} frameBorder="0" allowFullScreen></iframe></div>
                <div style={{padding: '15px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}><h4>{v.title}</h4>{isAdmin && <button onClick={() => handleDelete(v.id, 'video')} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                   <p style={styles.cardExcerpt}>{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2>Resources</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.subNavContainer}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveResourceCategory(cat)} style={activeResourceCategory === cat ? styles.subNavBtnActive : styles.subNavBtn}>{cat}</button>
              ))}
            </div>
            <div style={styles.resourceGrid}>
              {resources.filter(r => (r.category || 'General') === activeResourceCategory).map(r => (
                <div key={r.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" />
                  <div style={{flex: 1}}><h4 style={{margin: 0}}>{r.title}</h4></div>
                  <button onClick={() => {setViewingDoc(r); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                  {isAdmin && <button onClick={() => handleDelete(r.id, 'resource')} style={styles.delBtn}><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>New Discussion</h3>
            <input 
              style={styles.input} 
              placeholder="Title" 
              value={postForm.title}
              onChange={e => setPostForm({...postForm, title: e.target.value})} 
            />
            <select 
              style={styles.input} 
              value={postForm.category}
              onChange={e => setPostForm({...postForm, category: e.target.value})}
            >
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea 
              style={{...styles.input, height: '100px'}} 
              placeholder="Content" 
              value={postForm.content}
              onChange={e => setPostForm({...postForm, content: e.target.value})} 
            />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>Post Now</button>
          </div>
        </div>
      )}

      {showModal === 'postDetail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => {setShowModal(null); setSelectedPost(null); setCommentText('');}}>
          <div style={styles.postDetailModal} onClick={e => e.stopPropagation()}>
            <div style={styles.postDetailHeader}>
              <div>
                <span style={styles.tag}>{selectedPost.category}</span>
                <h2 style={{margin: '10px 0'}}>{selectedPost.title}</h2>
                <div style={styles.cardMeta}>
                  <span><User size={12}/> {selectedPost.author}</span>
                </div>
              </div>
              <button onClick={() => {setShowModal(null); setSelectedPost(null); setCommentText('');}} style={styles.closeBtn}>
                <X size={24}/>
              </button>
            </div>
            
            <div style={styles.postDetailContent}>
              <p style={{fontSize: '16px', lineHeight: '1.6', color: '#334155'}}>{selectedPost.content}</p>
              
              <div style={styles.postActions}>
                <button 
                  onClick={() => handleLikePost(selectedPost.id)} 
                  style={hasUserLiked(selectedPost) ? styles.likeButtonActive : styles.likeButton}
                >
                  <Heart size={18} fill={hasUserLiked(selectedPost) ? "#ec4899" : "none"} /> 
                  {selectedPost.likes ? selectedPost.likes.length : 0} likes
                </button>
              </div>

              <div style={styles.commentsSection}>
                <h3 style={{marginBottom: '20px'}}>Comments ({selectedPost.comments ? selectedPost.comments.length : 0})</h3>
                
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
                        <span style={styles.commentDate}>{new Date(comment.timestamp).toLocaleDateString()}</span>
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

      {showModal === 'profile' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.avatarLarge}>
               {profileForm.profilePic ? <img src={profileForm.profilePic} style={styles.avatarImg} alt="P" /> : <User size={40} />}
            </div>
            <input style={styles.input} placeholder="First Name" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
            <input style={styles.input} placeholder="Last Name" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
            <input style={styles.input} placeholder="Profile GIF URL" value={profileForm.profilePic} onChange={e => setProfileForm({...profileForm, profilePic: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleUpdateProfile}>Save Profile</button>
          </div>
        </div>
      )}

      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Video</h3>
            <input 
              style={styles.input} 
              placeholder="Title" 
              value={videoForm.title}
              onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
            />
            <input 
              style={styles.input} 
              placeholder="YouTube URL" 
              value={videoForm.url}
              onChange={e => setVideoForm({...videoForm, url: e.target.value})} 
            />
            <textarea 
              style={styles.input} 
              placeholder="Description" 
              value={videoForm.description}
              onChange={e => setVideoForm({...videoForm, description: e.target.value})} 
            />
            <button style={styles.primaryButtonFull} onClick={handleAddVideo}>Add to Hub</button>
          </div>
        </div>
      )}

      {showModal === 'resource' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Resource</h3>
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
            <button style={styles.primaryButtonFull} onClick={handleAddResource}>Save Resource</button>
          </div>
        </div>
      )}

      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}><h3>{viewingDoc.title}</h3><button onClick={() => setShowModal(null)}><X/></button></div>
            <iframe src={viewingDoc.url.replace('/edit', '/preview')} style={{flex: 1, border: 'none'}}></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  header: { background: 'white', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' },
  centerNav: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', color: '#64748b' },
  navBtnActive: { padding: '8px 20px', border: 'none', background: 'white', color: '#ec4899', borderRadius: '8px', fontWeight: 'bold' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' },
  sidebarBtnActive: { textAlign: 'left', padding: '12px', background: '#fdf2f8', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s', ':hover': {boxShadow: '0 4px 6px rgba(0,0,0,0.1)'} },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5' },
  cardMeta: { marginTop: '15px', display: 'flex', gap: '15px', fontSize: '12px', color: '#94a3b8', alignItems: 'center' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '400px', maxHeight: '90vh', overflowY: 'auto' },
  postDetailModal: { background: 'white', borderRadius: '20px', width: '700px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  postDetailHeader: { padding: '30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  postDetailContent: { padding: '30px', overflowY: 'auto', flex: 1 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  postActions: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
  likeButton: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '500' },
  likeButtonActive: { background: '#fdf2f8', border: '1px solid #ec4899', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: '500' },
  commentsSection: { marginTop: '30px' },
  commentInputContainer: { display: 'flex', gap: '10px', marginBottom: '30px' },
  commentInput: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px', resize: 'vertical' },
  commentButton: { background: '#ec4899', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  commentItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  commentAuthor: { fontWeight: 'bold', color: '#1e293b', fontSize: '14px' },
  commentDate: { fontSize: '12px', color: '#94a3b8' },
  commentText: { color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: 0 },
  avatarMini: { width: '35px', height: '35px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  videoCard: { background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%' },
  videoIframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  subNavContainer: { display: 'flex', gap: '10px', marginBottom: '30px' },
  subNavBtn: { padding: '10px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' },
  subNavBtnActive: { padding: '10px 20px', borderRadius: '20px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  resourceCard: { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  docViewerContent: { background: 'white', width: '90%', height: '90vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '20px', width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  ghostButtonFull: { background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', width: '100%', marginTop: '10px' },
  feed: { flex: 1 }
};

export default Dashboard;

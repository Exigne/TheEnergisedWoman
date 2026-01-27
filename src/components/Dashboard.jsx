import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, 
  Upload, FileText, User, Trash2, Hash, Send, MessageCircle,
  PlayCircle, BookOpen, Utensils, LayoutGrid
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  
  // Resources Tab State
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');

  // Selection States
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]); 
  const [resources, setResources] = useState([]);
  
  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General' });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    document.title = "The Energised Woman Collective | Dashboard";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email?.includes('admin'));
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [dRes, rRes, vRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=resources'),
        fetch('/.netlify/functions/database?type=video') 
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (rRes.ok) setResources(await rRes.json());
      if (vRes.ok) setVideos(await vRes.json());
    } catch (err) { 
      console.error("Data load error", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const userData = {
      email: loginEmail,
      display_name: loginEmail.split('@')[0],
      isAdmin: loginEmail.toLowerCase().includes('admin'),
      token: 'mock-token-' + Date.now()
    };
    localStorage.setItem('wellnessUser', JSON.stringify(userData));
    setUser(userData);
    setIsAdmin(userData.isAdmin);
    loadAllData();
  };

  // --- Handlers ---

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) return alert("Please fill in title and content");
    const newPost = { id: Date.now(), author: user.display_name, ...postForm, comments: [], created_at: new Date().toISOString() };
    setDiscussions([newPost, ...discussions]);
    setShowModal(null);
    setPostForm({ title: '', content: '', category: 'General' });
    try { await fetch('/.netlify/functions/database?type=discussion', { method: 'POST', body: JSON.stringify(newPost) }); } catch (err) { console.error(err); }
  };

  const handleVideoUpload = async () => {
    if (!videoForm.title || !videoForm.url) return alert("Title and URL required");
    const newVideo = { id: Date.now(), ...videoForm, comments: [] };
    setVideos([newVideo, ...videos]);
    setShowModal(null); 
    setVideoForm({title:'', url:'', description:''});
    try { await fetch('/.netlify/functions/database?type=video', { method: 'POST', body: JSON.stringify(newVideo) }); } catch (err) { console.error(err); }
  };

  const handleResourceUpload = async () => {
    if (!resourceForm.title || !resourceForm.url) return alert("Title and URL required");
    const newResource = { id: Date.now(), ...resourceForm };
    setResources([newResource, ...resources]);
    setShowModal(null);
    setResourceForm({ title: '', url: '', category: 'General' });
    try { await fetch('/.netlify/functions/database?type=resources', { method: 'POST', body: JSON.stringify(newResource) }); } catch (err) { console.error(err); }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be')) { videoId = url.split('/').pop(); } 
      else if (url.includes('v=')) { videoId = url.split('v=')[1].split('&')[0]; }
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
    const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), newComment] };
    setSelectedPost(updatedPost);
    setCommentText('');
    setDiscussions(discussions.map(d => d.id === selectedPost.id ? updatedPost : d));
    try { await fetch(`/.netlify/functions/database?id=${selectedPost.id}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedPost) }); } catch (err) { console.error(err); }
  };

  const handleAddVideoComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
    const updatedVideo = { ...selectedVideo, comments: [...(selectedVideo.comments || []), newComment] };
    setSelectedVideo(updatedVideo);
    setCommentText('');
    setVideos(videos.map(v => v.id === selectedVideo.id ? updatedVideo : v));
    try { await fetch(`/.netlify/functions/database?id=${selectedVideo.id}&type=video`, { method: 'PUT', body: JSON.stringify(updatedVideo) }); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    if (type === 'discussion') setDiscussions(discussions.filter(i => i.id !== id));
    if (type === 'video') setVideos(videos.filter(i => i.id !== id));
    if (type === 'resource') setResources(resources.filter(i => i.id !== id));
    setShowModal(null);
    try { await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' }); } catch (err) { console.error(err); }
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <div style={{display:'inline-flex', padding: '12px', background: '#fdf2f8', borderRadius: '50%', marginBottom: '15px'}}>
               <Crown size={32} color="#ec4899" />
            </div>
            <h1 style={{fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0'}}>The Energised Woman Collective</h1>
            <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>Sign in to access your wellness hub</p>
          </div>
          <form onSubmit={handleLogin}>
            <input style={styles.input} type="email" placeholder="Email address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            <button type="submit" style={styles.primaryButtonFull}>Sign In</button>
          </form>
          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8'}}>Remember, don't forget your password.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown size={22} color="#ec4899" /><h1 style={styles.brandText}>The Energised Woman Collective</h1></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('video')} style={{...styles.navBtn, ...(activeTab === 'video' && styles.navBtnActive)}}>Video Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Resources</button>
        </nav>
        <div style={styles.userSection}><button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.clear();}}><LogOut size={18}/></button></div>
      </header>

      <main style={styles.main}>
        {/* --- COMMUNITY TAB --- */}
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{...styles.sidebarBtn, ...(activeGroup === g && styles.sidebarBtnActive)}}><Hash size={14} /> {g}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span>{isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion')}} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content?.substring(0, 100)}...</p>
                  <div style={styles.cardMeta}><span style={styles.metaItem}><User size={12}/> {post.author}</span><span style={styles.metaItem}><MessageCircle size={12}/> {post.comments?.length || 0}</span></div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- VIDEO HUB TAB --- */}
        {activeTab === 'video' && (
          <div>
            <div style={styles.sectionHeader}><h2>Video Hub</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('addVideo')}><Upload size={18}/> Add Video</button>}</div>
            <div style={styles.videoGrid}>
              {videos.map(video => (
                <div key={video.id} style={styles.videoCard}>
                  <div style={styles.videoFrameWrapper}>
                     <iframe src={getVideoEmbedUrl(video.url)} title={video.title} style={styles.iframe} frameBorder="0" allowFullScreen></iframe>
                  </div>
                  <div style={styles.videoContent}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>{video.title}</h4>
                      {isAdmin && <button onClick={() => handleDelete(video.id, 'video')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                    <p style={{margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4'}}>{video.description}</p>
                    <button style={styles.commentBtn} onClick={() => {setSelectedVideo(video); setShowModal('videoDetail');}}>
                      <MessageCircle size={14}/> {video.comments?.length || 0} Comments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RESOURCES TAB (Updated) --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Resources</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('resource')}><Plus size={18}/> Add Resource</button>}
            </div>
            
            {/* Sub-Navigation for Resources */}
            <div style={styles.subNavContainer}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveResourceCategory(cat)}
                  style={activeResourceCategory === cat ? styles.subNavBtnActive : styles.subNavBtn}
                >
                  {cat === 'Recipes' ? <Utensils size={14} /> : cat === 'Book Club' ? <BookOpen size={14} /> : <LayoutGrid size={14} />}
                  {cat}
                </button>
              ))}
            </div>

            <div style={styles.resourceGrid}>
              {resources.filter(res => (res.category || 'General') === activeResourceCategory).map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <div style={{
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: res.category === 'Recipes' ? '#ecfccb' : res.category === 'Book Club' ? '#e0f2fe' : '#fdf2f8',
                    color: res.category === 'Recipes' ? '#65a30d' : res.category === 'Book Club' ? '#0ea5e9' : '#ec4899'
                  }}>
                    {res.category === 'Recipes' ? <Utensils size={20} /> : res.category === 'Book Club' ? <BookOpen size={20} /> : <FileText size={20} />}
                  </div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 4px 0'}}>{res.title}</h4>
                    <span style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{res.category || 'General'}</span>
                  </div>
                  <button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                  {isAdmin && <button onClick={() => handleDelete(res.id, 'resource')} style={{...styles.delBtn, marginLeft: '8px'}}><Trash2 size={16}/></button>}
                </div>
              ))}
              {resources.filter(res => (res.category || 'General') === activeResourceCategory).length === 0 && (
                <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                  No resources in this section yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      
      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Create New Post</h3>
            <input style={styles.input} placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>
              {GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea style={{...styles.input, height: '150px'}} placeholder="What's on your mind?" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleCreatePost}>Post to Community</button>
          </div>
        </div>
      )}

      {showModal === 'addVideo' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Video</h3>
            <input style={styles.input} placeholder="Video Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
            <input style={styles.input} placeholder="YouTube URL or Video Link" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleVideoUpload}>Save Video</button>
          </div>
        </div>
      )}

      {/* NEW: Resource Modal */}
      {showModal === 'resource' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Resource</h3>
            <input style={styles.input} placeholder="Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
            <label style={{display:'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#64748b'}}>Category</label>
            <select style={styles.input} value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})}>
              {RESOURCE_CATEGORIES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input style={styles.input} placeholder="URL (Google Doc, PDF, Drive Link)" value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleResourceUpload}>Add Resource</button>
          </div>
        </div>
      )}

      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutBody}>{selectedPost.content}</div>
            <hr style={styles.divider} />
            <div style={styles.commentSection}>
              <h4>Comments ({selectedPost.comments?.length || 0})</h4>
              <div style={styles.commentList}>
                {(selectedPost.comments || []).map(c => <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>)}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
                <button style={styles.sendBtn} onClick={handleAddComment}><Send size={18}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'videoDetail' && selectedVideo && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <h2 style={styles.popOutTitle}>{selectedVideo.title}</h2>
            <div style={{...styles.videoFrameWrapper, marginBottom: '20px'}}>
               <iframe src={getVideoEmbedUrl(selectedVideo.url)} style={styles.iframe} frameBorder="0" allowFullScreen></iframe>
            </div>
            <div style={styles.popOutBody}>{selectedVideo.description}</div>
            <hr style={styles.divider} />
            <div style={styles.commentSection}>
              <h4>Comments ({selectedVideo.comments?.length || 0})</h4>
              <div style={styles.commentList}>
                {(selectedVideo.comments || []).map(c => <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>)}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddVideoComment()} />
                <button style={styles.sendBtn} onClick={handleAddVideoComment}><Send size={18}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}><h3>{viewingDoc.title}</h3><button onClick={() => setShowModal(null)}><X size={18}/></button></div>
            <iframe src={viewingDoc.url.includes('docs.google.com') ? viewingDoc.url.replace('/edit', '/preview') : viewingDoc.url} style={styles.iframe} frameBorder="0"></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  loginContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  centerNav: { display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 18px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  userSection: { display: 'flex', justifyContent: 'flex-end' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sidebarBtn: { textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' },
  cardTitle: { fontSize: '20px', margin: '8px 0', color: '#1e293b' },
  cardExcerpt: { color: '#64748b', fontSize: '14px' },
  cardMeta: { marginTop: '16px', display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popOutContent: { background: 'white', width: '600px', borderRadius: '28px', padding: '30px', position: 'relative', maxHeight: '80vh', overflowY: 'auto' },
  popOutTitle: { fontSize: '24px', margin: '16px 0' },
  popOutBody: { fontSize: '15px', lineHeight: '1.7', color: '#334155' },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' },
  commentSection: { marginTop: '10px' },
  commentList: { maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' },
  commentItem: { fontSize: '14px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  commentInputWrap: { display: 'flex', gap: '10px' },
  commentInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  sendBtn: { background: '#ec4899', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', cursor: 'pointer' },
  docViewerContent: { background: 'white', width: '90%', height: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  iframe: { flex: 1, width: '100%', height: '100%' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  videoCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  videoFrameWrapper: { position: 'relative', paddingTop: '56.25%', background: 'black' },
  videoContent: { padding: '16px', flex: 1 },
  commentBtn: { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '400px', maxWidth: '90vw' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' },
  // New Styles for Resource Tabs
  subNavContainer: { display: 'flex', gap: '10px', marginBottom: '24px' },
  subNavBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
  subNavBtnActive: { padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }
};

export default Dashboard;

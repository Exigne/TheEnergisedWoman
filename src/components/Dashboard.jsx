import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, LogOut, Crown, Plus, Music, 
  Upload, FileText, ExternalLink, Clock, User, 
  Trash2, Lock, Mail, Hash, Send, Heart, Zap, MessageCircle,
  Play, Pause
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  
  // Login State (New)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [libraryForm, setLibraryForm] = useState({ title: '', url: '', type: 'PDF' });
  const [commentText, setCommentText] = useState('');
  
  // Audio player state
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    document.title = "The Energised Woman | Dashboard";
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
      const [dRes, rRes, aRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=resources'),
        fetch('/.netlify/functions/database?type=audio')
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (rRes.ok) setResources(await rRes.json());
      if (aRes.ok) setAudios(await aRes.json());
    } catch (err) { 
      console.error("Data load error", err);
    }
  };

  // --- NEW LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login - in a real app, send to backend here
    const userData = {
      email: loginEmail,
      display_name: loginEmail.split('@')[0],
      isAdmin: loginEmail.toLowerCase().includes('admin'), // Simple check for admin
      token: 'mock-token-' + Date.now()
    };
    
    localStorage.setItem('wellnessUser', JSON.stringify(userData));
    setUser(userData);
    setIsAdmin(userData.isAdmin);
    loadAllData();
  };

  // Audio player functions
  const handlePlayAudio = (audio) => {
    if (currentAudio?.id === audio.id && isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
    } else {
      if (currentAudio?.id !== audio.id) {
        audioElement?.pause();
        const newAudio = new Audio(getDirectAudioUrl(audio.url));
        newAudio.addEventListener('timeupdate', () => setCurrentTime(newAudio.currentTime));
        newAudio.addEventListener('loadedmetadata', () => setDuration(newAudio.duration));
        newAudio.addEventListener('ended', () => setIsPlaying(false));
        setAudioElement(newAudio);
        setCurrentAudio(audio);
        newAudio.play();
        setIsPlaying(true);
      } else {
        audioElement?.play();
        setIsPlaying(true);
      }
    }
  };

  const getDirectAudioUrl = (url) => {
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }
    // Handle Proton Drive URLs
    if (url.includes('proton.me') || url.includes('drive.proton')) {
      return url;
    }
    return url;
  };

  const handleSeek = (e) => {
    if (audioElement && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
    const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), newComment] };
    setSelectedPost(updatedPost);
    setCommentText('');
    setDiscussions(discussions.map(d => d.id === selectedPost.id ? updatedPost : d));
    try {
      await fetch(`/.netlify/functions/database?id=${selectedPost.id}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedPost) });
    } catch (err) {
      console.error("Comment save error", err);
    }
  };

  const handleAddAudioComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
    const updatedAudio = { ...selectedAudio, comments: [...(selectedAudio.comments || []), newComment] };
    setSelectedAudio(updatedAudio);
    setCommentText('');
    setAudios(audios.map(a => a.id === selectedAudio.id ? updatedAudio : a));
    try {
      await fetch(`/.netlify/functions/database?id=${selectedAudio.id}&type=audio`, { method: 'PUT', body: JSON.stringify(updatedAudio) });
    } catch (err) {
      console.error("Comment save error", err);
    }
  };

  const handleAudioUpload = async () => {
    if (!audioForm.title || !audioForm.url) return alert("Title and URL required");
    const newAudio = {
      id: Date.now(),
      ...audioForm,
      comments: []
    };
    
    try {
      const res = await fetch('/.netlify/functions/database?type=audio', { method: 'POST', body: JSON.stringify(newAudio) });
      if (res.ok) {
        const savedAudio = await res.json();
        setAudios([savedAudio, ...audios]);
      } else {
        setAudios([newAudio, ...audios]);
      }
    } catch (err) {
      setAudios([newAudio, ...audios]);
    }
    
    setShowModal(null); 
    setAudioForm({title:'', url:'', description:''});
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      if (res.ok || true) {
        if (type === 'discussion') setDiscussions(discussions.filter(i => i.id !== id));
        if (type === 'audio') setAudios(audios.filter(i => i.id !== id));
        if (type === 'resource') setResources(resources.filter(i => i.id !== id));
        setShowModal(null);
      }
    } catch (err) {
      if (type === 'discussion') setDiscussions(discussions.filter(i => i.id !== id));
      if (type === 'audio') setAudios(audios.filter(i => i.id !== id));
      if (type === 'resource') setResources(resources.filter(i => i.id !== id));
      setShowModal(null);
    }
  };

  // --- REPLACED: Login View ---
  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <div style={{display:'inline-flex', padding: '12px', background: '#fdf2f8', borderRadius: '50%', marginBottom: '15px'}}>
               <Crown size={32} color="#ec4899" />
            </div>
            <h1 style={{fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0'}}>The Energised Woman</h1>
            <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>Sign in to access your wellness hub</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div style={{marginBottom: '15px'}}>
               <input 
                 style={styles.input} 
                 type="email" 
                 placeholder="Email address" 
                 value={loginEmail}
                 onChange={(e) => setLoginEmail(e.target.value)}
                 required
               />
            </div>
            <div style={{marginBottom: '25px'}}>
               <input 
                 style={styles.input} 
                 type="password" 
                 placeholder="Password" 
                 value={loginPassword}
                 onChange={(e) => setLoginPassword(e.target.value)}
                 required
               />
            </div>
            <button type="submit" style={styles.primaryButtonFull}>Sign In</button>
          </form>
          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8'}}>
            Use any email to test. Use 'admin@...' for admin features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown size={22} color="#ec4899" /><h1 style={styles.brandText}>The Energised Woman</h1></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('audio')} style={{...styles.navBtn, ...(activeTab === 'audio' && styles.navBtnActive)}}>Audio Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Library</button>
        </nav>
        <div style={styles.userSection}><button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.clear();}}><LogOut size={18}/></button></div>
      </header>

      <main style={styles.main}>
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

        {activeTab === 'audio' && (
          <div>
            <div style={styles.sectionHeader}><h2>Audio Hub</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}</div>
            {audios.map(audio => (
              <div key={audio.id} style={styles.audioCard}>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                    <h4 style={{margin: 0}}>{audio.title}</h4>
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                      <button 
                        style={styles.commentBtn}
                        onClick={() => {setSelectedAudio(audio); setShowModal('audioDetail');}}
                      >
                        <MessageCircle size={14}/> {audio.comments?.length || 0}
                      </button>
                      {isAdmin && <button onClick={() => handleDelete(audio.id, 'audio')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                  </div>
                  <p style={{margin: '4px 0 12px 0', fontSize: '13px', color: '#64748b'}}>{audio.description}</p>
                  
                  <div style={styles.audioPlayerWrapper}>
                    <button 
                      style={styles.playBtn}
                      onClick={() => handlePlayAudio(audio)}
                    >
                      {currentAudio?.id === audio.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    
                    {currentAudio?.id === audio.id && (
                      <>
                        <span style={styles.timeText}>{formatTime(currentTime)}</span>
                        <div 
                          style={styles.progressBar}
                          onClick={handleSeek}
                        >
                          <div 
                            style={{
                              ...styles.progressFill,
                              width: `${(currentTime / duration) * 100}%`
                            }}
                          />
                        </div>
                        <span style={styles.timeText}>{formatTime(duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2>Library</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" />
                  <div style={{flex: 1}}><h4 style={{margin: 0}}>{res.title}</h4></div>
                  <button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
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
                {(selectedPost.comments || []).map(c => (
                  <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>
                ))}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
                <button style={styles.sendBtn} onClick={handleAddComment}><Send size={18}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === 'audioDetail' && selectedAudio && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <h2 style={styles.popOutTitle}>{selectedAudio.title}</h2>
            <div style={styles.popOutBody}>{selectedAudio.description}</div>
            <hr style={styles.divider} />
            <div style={styles.commentSection}>
              <h4>Comments ({selectedAudio.comments?.length || 0})</h4>
              <div style={styles.commentList}>
                {(selectedAudio.comments || []).map(c => (
                  <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>
                ))}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddAudioComment()} />
                <button style={styles.sendBtn} onClick={handleAddAudioComment}><Send size={18}/></button>
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

      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Audio</h3>
            <input style={styles.input} placeholder="Title" value={audioForm.title} onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="URL (Google Drive or direct link)" value={audioForm.url} onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={audioForm.description} onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAudioUpload}>Save Track</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  // --- NEW LOGIN STYLES ---
  loginContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  // ------------------------
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
  iframe: { flex: 1, width: '100%' },
  audioCard: { background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0', display: 'flex' },
  audioPlayerWrapper: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' },
  playBtn: { background: '#ec4899', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  progressBar: { flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '10px', cursor: 'pointer', position: 'relative' },
  progressFill: { height: '100%', background: '#ec4899', borderRadius: '10px' },
  timeText: { fontSize: '12px', color: '#64748b', minWidth: '35px', textAlign: 'center' },
  commentBtn: { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', fontFamily: 'inherit' },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '400px' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' },
  feed: {}
};

export default Dashboard;

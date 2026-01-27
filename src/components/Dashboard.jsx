import React, { useState, useEffect } from 'react';
import { 
  Search, X, ThumbsUp, MessageSquare, LogOut, 
  Crown, Zap, Plus, Music, Upload, FileText, 
  Play, Pause, ExternalLink, Clock, User, Trash2,
  Lock, Mail, ChevronRight, Hash, Send, Heart
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  
  // Form States
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [libraryForm, setLibraryForm] = useState({ title: '', url: '', type: 'PDF' });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email.includes('admin'));
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
    } catch (err) { console.error("Error loading data", err); }
  };

  // --- Fixed Upload Handlers ---
  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) return alert("Please fill in all fields");
    
    const postData = { 
      ...postForm, 
      author: user.display_name, 
      authorId: user.email, 
      created_at: new Date().toISOString(), 
      likes: 0,
      likedBy: [],
      comments: []
    };

    const res = await fetch('/.netlify/functions/database?type=discussion', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData) 
    });
    
    if (res.ok) { 
      const newPost = await res.json();
      setDiscussions([newPost, ...discussions]); 
      setShowModal(null); 
      setPostForm({ title: '', content: '', category: 'General' });
    }
  };

  const handleAudioUpload = async () => {
    if (!audioForm.title || !audioForm.url) return alert("Title and URL are required");
    
    const res = await fetch('/.netlify/functions/database?type=audio', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioForm) 
    });
    
    if (res.ok) { 
      const newTrack = await res.json();
      setAudios([newTrack, ...audios]); 
      setShowModal(null); 
      setAudioForm({ title: '', url: '', description: '' });
    } else {
      alert("Failed to save audio. Check your connection.");
    }
  };

  const handleLibraryUpload = async () => {
    if (!libraryForm.title || !libraryForm.url) return alert("Title and URL required");
    
    const res = await fetch('/.netlify/functions/database?type=resource', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(libraryForm) 
    });
    
    if (res.ok) { 
      const newResource = await res.json();
      setResources([newResource, ...resources]); 
      setShowModal(null); 
      setLibraryForm({ title: '', url: '', type: 'PDF' });
    }
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    const post = discussions.find(p => p.id === postId);
    if (!post) return;
    const hasLiked = post.likedBy?.includes(user.email);
    const updatedPost = {
      ...post,
      likes: hasLiked ? (post.likes || 1) - 1 : (post.likes || 0) + 1,
      likedBy: hasLiked ? post.likedBy.filter(em => em !== user.email) : [...(post.likedBy || []), user.email]
    };
    setDiscussions(discussions.map(d => d.id === postId ? updatedPost : d));
    if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    await fetch(`/.netlify/functions/database?id=${postId}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedPost) });
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    const response = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
    if (response.ok) {
      if (type === 'discussion') setDiscussions(discussions.filter(item => item.id !== id));
      if (type === 'audio') setAudios(audios.filter(item => item.id !== id));
      if (type === 'resource') setResources(resources.filter(item => item.id !== id));
      if (showModal === 'detail') setShowModal(null);
    }
  };

  const filteredDiscussions = discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup);

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Crown size={42} color="#ec4899" />
          <h1 style={{ margin: '16px 0 8px', fontSize: '24px' }}>The Energised Woman</h1>
          <div style={styles.inputWrap}><Mail size={16}/><input style={styles.ghostInput} placeholder="Email" id="login-email" /></div>
          <div style={styles.inputWrap}><Lock size={16}/><input style={styles.ghostInput} type="password" placeholder="Password" id="login-pass" /></div>
          <button style={styles.primaryButton} onClick={() => {
            const email = document.getElementById('login-email').value;
            const userData = { email, display_name: email.split('@')[0], isAdmin: email.includes('admin') };
            setUser(userData); setIsAdmin(userData.isAdmin);
            localStorage.setItem('wellnessUser', JSON.stringify(userData));
            loadAllData();
          }}>Sign In</button>
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
        <div style={styles.userSection}>
          <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              <h4 style={{paddingLeft: '12px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase'}}>Groups</h4>
              {GROUPS.map(group => (
                <button key={group} onClick={() => setActiveGroup(group)} style={{...styles.sidebarBtn, ...(activeGroup === group && styles.sidebarBtnActive)}}><Hash size={14} /> {group}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2 style={{margin: 0}}>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              <div style={styles.postList}>
                {filteredDiscussions.map(post => (
                  <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                    <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span>{isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion')}} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                    <h3 style={styles.cardTitle}>{post.title}</h3>
                    <p style={styles.cardExcerpt}>{post.content?.substring(0, 120)}...</p>
                    <div style={styles.cardMeta}>
                       <span style={styles.metaItem}><User size={12}/> {post.author}</span>
                       <button style={styles.metaBtn} onClick={(e) => handleLike(e, post.id)}>
                          <Heart size={14} fill={post.likedBy?.includes(user.email) ? "#ec4899" : "none"} color={post.likedBy?.includes(user.email) ? "#ec4899" : "#94a3b8"} /> {post.likes || 0}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'audio' && (
          <div>
            <div style={styles.sectionHeader}><h2 style={{margin: 0}}>Audio Hub</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}</div>
            {audios.map(audio => (
              <div key={audio.id} style={styles.audioCard}>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}><h4 style={{margin: 0}}>{audio.title}</h4>{isAdmin && <button onClick={() => handleDelete(audio.id, 'audio')} style={styles.delBtn}><Trash2 size={16}/></button>}</div>
                  <p style={{margin: '4px 0', fontSize: '13px', color: '#64748b'}}>{audio.description}</p>
                  <audio controls style={styles.player}><source src={audio.url} /></audio>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2 style={{margin: 0}}>Resource Library</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" /><div style={{flex: 1}}><h4 style={{margin: 0}}>{res.title}</h4><span style={{fontSize: '11px', color: '#94a3b8'}}>{res.type}</span></div>
                  <div style={{display: 'flex', gap: '8px'}}><a href={res.url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View</a>{isAdmin && <button onClick={() => handleDelete(res.id, 'resource')} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS (ALL FIXED) --- */}
      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X/></button>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span style={styles.tag}>{selectedPost.category}</span><button style={styles.likeBtnLarge} onClick={(e) => handleLike(e, selectedPost.id)}><Heart size={20} fill={selectedPost.likedBy?.includes(user.email) ? "#ec4899" : "none"} color={selectedPost.likedBy?.includes(user.email) ? "#ec4899" : "#64748b"} /><span>{selectedPost.likes || 0} Likes</span></button></div>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutBody}>{selectedPost.content}</div>
          </div>
        </div>
      )}

      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>New Discussion</h3><button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button></div>
            <input style={styles.input} placeholder="Headline" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <select style={styles.input} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})}>{GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}</select>
            <textarea style={{...styles.input, height: '150px'}} placeholder="What's on your mind?" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost}>Share Post</button>
          </div>
        </div>
      )}

      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>Add New Audio</h3><button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button></div>
            <input style={styles.input} placeholder="Track Title" value={audioForm.title} onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="Direct MP3 URL" value={audioForm.url} onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" value={audioForm.description} onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleAudioUpload}>Save Track</button>
          </div>
        </div>
      )}

      {showModal === 'library' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3>Add Library Resource</h3><button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button></div>
            <input style={styles.input} placeholder="Resource Name" value={libraryForm.title} onChange={e => setLibraryForm({...libraryForm, title: e.target.value})} />
            <input style={styles.input} placeholder="URL (PDF/Link)" value={libraryForm.url} onChange={e => setLibraryForm({...libraryForm, url: e.target.value})} />
            <select style={styles.input} value={libraryForm.type} onChange={e => setLibraryForm({...libraryForm, type: e.target.value})}><option value="PDF">PDF Guide</option><option value="Workbook">Workbook</option><option value="Link">External Link</option></select>
            <button style={styles.primaryButton} onClick={handleLibraryUpload}>Add to Library</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px', width: '250px' },
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  centerNav: { display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 18px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  userSection: { width: '250px', display: 'flex', justifyContent: 'flex-end' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sidebarBtn: { textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  postList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: { fontSize: '20px', margin: '0 0 8px 0', color: '#1e293b' },
  cardExcerpt: { color: '#64748b', fontSize: '15px', lineHeight: '1.6' },
  cardMeta: { marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  metaBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#94a3b8' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  popOutContent: { background: 'white', width: '100%', maxWidth: '700px', borderRadius: '28px', padding: '40px', position: 'relative' },
  popOutTitle: { fontSize: '28px', margin: '16px 0', fontWeight: '800' },
  popOutBody: { fontSize: '16px', lineHeight: '1.8', color: '#334155' },
  likeBtnLarge: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  audioCard: { background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0' },
  player: { width: '100%', marginTop: '10px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  viewBtn: { fontSize: '12px', fontWeight: 'bold', color: '#ec4899', textDecoration: 'none' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfaff' },
  authCard: { background: 'white', padding: '40px', borderRadius: '32px', width: '350px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '14px', borderRadius: '14px', marginBottom: '12px' },
  ghostInput: { background: 'none', border: 'none', outline: 'none', width: '100%' },
  delBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', outlineColor: '#ec4899' },
  modal: { background: 'white', padding: '35px', borderRadius: '28px', width: '500px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }
};

export default Dashboard;

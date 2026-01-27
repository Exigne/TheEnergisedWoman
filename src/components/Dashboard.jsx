import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, LogOut, Crown, Plus, Music, 
  Upload, FileText, ExternalLink, Clock, User, 
  Trash2, Lock, Mail, Hash, Send, Heart, Zap
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  // --- Auth & State ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // --- Data States ---
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  
  // --- Form States ---
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [libraryForm, setLibraryForm] = useState({ title: '', url: '', type: 'PDF' });

  useEffect(() => {
    document.title = "The Energised Woman | Dashboard";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email.includes('admin'));
      
      const hasSeenWelcome = localStorage.getItem('seenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
      
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
    } catch (err) { console.error("Data load error", err); }
  };

  // --- Logic Handlers ---
  const closeWelcome = () => {
    localStorage.setItem('seenWelcome', 'true');
    setShowWelcome(false);
  };

  const handleNewPost = async () => {
    if (!postForm.title || !postForm.content) return alert("Fields required");
    const postData = { ...postForm, author: user.display_name, authorId: user.email, created_at: new Date().toISOString(), likes: 0, likedBy: [], comments: [] };
    const res = await fetch('/.netlify/functions/database?type=discussion', { method: 'POST', body: JSON.stringify(postData) });
    if (res.ok) { setDiscussions([await res.json(), ...discussions]); setShowModal(null); setPostForm({title:'', content:'', category:'General'}); }
  };

  const handleAudioUpload = async () => {
    if (!audioForm.title || !audioForm.url) return alert("Title and URL required");
    const res = await fetch('/.netlify/functions/database?type=audio', { method: 'POST', body: JSON.stringify(audioForm) });
    if (res.ok) { setAudios([await res.json(), ...audios]); setShowModal(null); setAudioForm({title:'', url:'', description:''}); }
  };

  const handleLibraryUpload = async () => {
    if (!libraryForm.title || !libraryForm.url) return alert("Title and URL required");
    const res = await fetch('/.netlify/functions/database?type=resource', { method: 'POST', body: JSON.stringify(libraryForm) });
    if (res.ok) { setResources([await res.json(), ...resources]); setShowModal(null); setLibraryForm({title:'', url:'', type:'PDF'}); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
    if (res.ok) {
      if (type === 'discussion') setDiscussions(discussions.filter(i => i.id !== id));
      if (type === 'audio') setAudios(audios.filter(i => i.id !== id));
      if (type === 'resource') setResources(resources.filter(i => i.id !== id));
      setShowModal(null);
    }
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    const post = discussions.find(p => p.id === postId);
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

  const filteredDiscussions = discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup);

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Crown size={42} color="#ec4899" />
          <h1 style={{ margin: '16px 0 8px', fontSize: '24px' }}>The Energised Woman</h1>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>Member Portal</p>
          <div style={styles.inputWrap}><Mail size={16} color="#94a3b8"/><input style={styles.ghostInput} placeholder="Email" id="log-email" /></div>
          <div style={styles.inputWrap}><Lock size={16} color="#94a3b8"/><input style={styles.ghostInput} type="password" placeholder="Password" id="log-pass" /></div>
          <button style={styles.primaryButtonFull} onClick={() => {
            const email = document.getElementById('log-email').value;
            const userData = { email, display_name: email.split('@')[0], isAdmin: email.includes('admin') };
            setUser(userData); setIsAdmin(userData.isAdmin);
            localStorage.setItem('wellnessUser', JSON.stringify(userData));
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
        <div style={styles.userSection}><button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.removeItem('wellnessUser'); localStorage.removeItem('seenWelcome');}}><LogOut size={18}/></button></div>
      </header>

      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              <h4 style={styles.sideLabel}>Groups</h4>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} style={{...styles.sidebarBtn, ...(activeGroup === g && styles.sidebarBtnActive)}}><Hash size={14} /> {g}</button>
              ))}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
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
            <div style={styles.sectionHeader}><h2>Audio Hub</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}</div>
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
            <div style={styles.sectionHeader}><h2>Resource Library</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" /><div style={{flex: 1}}><h4 style={{margin: 0}}>{res.title}</h4><span style={{fontSize: '11px', color: '#94a3b8'}}>{res.type}</span></div>
                  <div style={{display: 'flex', gap: '8px'}}><button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>{isAdmin && <button onClick={() => handleDelete(res.id, 'resource')} style={styles.delBtn}><Trash2 size={14}/></button>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: DOC VIEWER (UPDATED WITH SMART LINK LOGIC) --- */}
      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}>
              <h3>{viewingDoc.title}</h3>
              <div style={{display: 'flex', gap: '10px'}}>
                <a href={viewingDoc.url} target="_blank" rel="noreferrer" style={styles.externalBtn} title="Open in new tab">
                  <ExternalLink size={16}/>
                </a>
                <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
              </div>
            </div>
            <div style={styles.iframeContainer}>
              <iframe 
                src={viewingDoc.url.includes('docs.google.com') 
                  ? viewingDoc.url.split('?')[0].replace('/edit', '/preview').replace('/view', '/preview')
                  : `https://docs.google.com/viewer?url=${encodeURIComponent(viewingDoc.url)}&embedded=true`
                }
                style={styles.iframe} 
                title="Viewer" 
                frameBorder="0"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={styles.tag}>{selectedPost.category}</span><button style={styles.likeBtnLarge} onClick={(e) => handleLike(e, selectedPost.id)}><Heart size={20} fill={selectedPost.likedBy?.includes(user.email) ? "#ec4899" : "none"} color={selectedPost.likedBy?.includes(user.email) ? "#ec4899" : "#64748b"} /><span>{selectedPost.likes || 0} Likes</span></button></div>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutBody}>{selectedPost.content}</div>
          </div>
        </div>
      )}

      {showWelcome && (
        <div style={styles.modalOverlay}>
          <div style={styles.welcomeCard}>
            <div style={styles.welcomeIcon}><Zap size={32} color="white" /></div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Welcome, {user.display_name}!</h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px' }}>
              We are so glad to have you in **The Energised Woman** community. 
              Dive into the Audio Hub for your daily mindfulness, explore the Library guides, 
              or say hello in the General discussion group!
            </p>
            <button style={styles.primaryButtonFull} onClick={closeWelcome}>
              Let's Get Started
            </button>
          </div>
        </div>
      )}

      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}><h3>New Discussion</h3><input style={styles.input} placeholder="Headline" onChange={e => setPostForm({...postForm, title: e.target.value})} /><select style={styles.input} onChange={e => setPostForm({...postForm, category: e.target.value})}>{GROUPS.filter(g => g !== 'All Discussions').map(g => <option key={g} value={g}>{g}</option>)}</select><textarea style={{...styles.input, height: '150px'}} placeholder="Content..." onChange={e => setPostForm({...postForm, content: e.target.value})} /><button style={styles.primaryButtonFull} onClick={handleNewPost}>Share Post</button></div>
        </div>
      )}

      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}><h3>Add Audio</h3><input style={styles.input} placeholder="Track Title" onChange={e => setAudioForm({...audioForm, title: e.target.value})} /><input style={styles.input} placeholder="Direct MP3 URL" onChange={e => setAudioForm({...audioForm, url: e.target.value})} /><textarea style={styles.input} placeholder="Description" onChange={e => setAudioForm({...audioForm, description: e.target.value})} /><button style={styles.primaryButtonFull} onClick={handleAudioUpload}>Save Track</button></div>
        </div>
      )}

      {showModal === 'library' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}><h3>Add Resource</h3><input style={styles.input} placeholder="Name" onChange={e => setLibraryForm({...libraryForm, title: e.target.value})} /><input style={styles.input} placeholder="URL" onChange={e => setLibraryForm({...libraryForm, url: e.target.value})} /><select style={styles.input} onChange={e => setLibraryForm({...libraryForm, type: e.target.value})}><option value="PDF">PDF</option><option value="Link">Link</option></select><button style={styles.primaryButtonFull} onClick={handleLibraryUpload}>Add to Library</button></div>
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
  sideLabel: { paddingLeft: '12px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' },
  sidebarBtn: { textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  postList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' },
  cardTitle: { fontSize: '20px', margin: '0 0 8px 0', color: '#1e293b' },
  cardExcerpt: { color: '#64748b', fontSize: '15px', lineHeight: '1.6' },
  cardMeta: { marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  metaBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#94a3b8' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  popOutContent: { background: 'white', width: '100%', maxWidth: '700px', borderRadius: '28px', padding: '40px', position: 'relative' },
  popOutTitle: { fontSize: '28px', margin: '16px 0', fontWeight: '800' },
  popOutBody: { fontSize: '16px', lineHeight: '1.8', color: '#334155' },
  docViewerContent: { background: 'white', width: '95%', maxWidth: '1100px', height: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  viewerHeader: { padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
  iframeContainer: { flex: 1, width: '100%', background: '#f1f5f9' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  externalBtn: { background: '#f1f5f9', color: '#64748b', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', textDecoration: 'none' },
  audioCard: { background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0' },
  player: { width: '100%', marginTop: '10px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfaff' },
  authCard: { background: 'white', padding: '40px', borderRadius: '32px', width: '350px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '14px', borderRadius: '14px', marginBottom: '12px' },
  ghostInput: { background: 'none', border: 'none', outline: 'none', width: '100%' },
  delBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  modal: { background: 'white', padding: '35px', borderRadius: '28px', width: '500px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  likeBtnLarge: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  welcomeCard: { background: 'white', padding: '40px', borderRadius: '32px', width: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', position: 'relative' },
  welcomeIcon: { background: '#ec4899', width: '70px', height: '70px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)' }
};

export default Dashboard;

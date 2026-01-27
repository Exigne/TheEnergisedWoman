import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, LogOut, Crown, Plus, Music, 
  Upload, FileText, ExternalLink, Clock, User, 
  Trash2, Lock, Mail, Hash, Send, Heart, Zap, MessageCircle, Play
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
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [libraryForm, setLibraryForm] = useState({ title: '', url: '', type: 'PDF' });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    document.title = "The Energised Woman | Dashboard";
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
    } catch (err) { console.error("Data load error", err); }
  };

  // --- HANDLERS ---
  const handleAudioUpload = async () => {
    if (!audioForm.title || !audioForm.url) return alert("Title and URL required");
    // Auto-fix Dropbox links if the user forgets
    let finalUrl = audioForm.url;
    if (finalUrl.includes('dropbox.com') && finalUrl.endsWith('dl=0')) {
        finalUrl = finalUrl.replace('dl=0', 'raw=1');
    }

    const res = await fetch('/.netlify/functions/database?type=audio', { 
        method: 'POST', 
        body: JSON.stringify({...audioForm, url: finalUrl}) 
    });
    if (res.ok) { 
        const newTrack = await res.json();
        setAudios([newTrack, ...audios]); 
        setShowModal(null); 
        setAudioForm({title:'', url:'', description:''}); 
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
    const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), newComment] };
    setSelectedPost(updatedPost);
    setCommentText('');
    setDiscussions(discussions.map(d => d.id === selectedPost.id ? updatedPost : d));
    await fetch(`/.netlify/functions/database?id=${selectedPost.id}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedPost) });
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

  // --- HELPERS ---
  const isDirectAudio = (url) => {
    return url.includes('raw=1') || url.match(/\.(mp3|wav|ogg)$/) || url.includes('cloudinary');
  };

  if (!user) return <div style={styles.authPage}>Please Sign In</div>;

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
        {/* --- AUDIO HUB TAB --- */}
        {activeTab === 'audio' && (
          <div>
            <div style={styles.sectionHeader}>
                <h2>Audio Hub</h2>
                {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}
            </div>
            <div style={styles.audioGrid}>
                {audios.map(audio => (
                <div key={audio.id} style={styles.audioCard}>
                    <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <h4 style={{margin: 0}}>{audio.title}</h4>
                        {isAdmin && <button onClick={() => handleDelete(audio.id, 'audio')} style={styles.delBtn}><Trash2 size={16}/></button>}
                    </div>
                    <p style={{margin: '8px 0', fontSize: '13px', color: '#64748b'}}>{audio.description}</p>
                    
                    {isDirectAudio(audio.url) ? (
                        <audio controls style={styles.player}><source src={audio.url} /></audio>
                    ) : (
                        <div style={styles.linkFallback}>
                            <p style={{fontSize: '11px', color: '#f59e0b', marginBottom: '8px'}}>Note: Cloud-hosted file requires external player.</p>
                            <a href={audio.url} target="_blank" rel="noreferrer" style={styles.viewBtnInternal}>
                                <Play size={14} fill="currentColor" /> Open in {audio.url.includes('proton') ? 'Proton' : 'New Tab'}
                            </a>
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
          </div>
        )}

        {/* --- COMMUNITY TAB --- */}
        {activeTab === 'community' && (
           <div style={styles.communityLayout}>
             <aside style={styles.sidebar}>
               {GROUPS.map(g => <button key={g} onClick={() => setActiveGroup(g)} style={{...styles.sidebarBtn, ...(activeGroup === g && styles.sidebarBtnActive)}}><Hash size={14} /> {g}</button>)}
             </aside>
             <section style={styles.feed}>
               <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
               {discussions.filter(d => activeGroup === 'All Discussions' || d.category === activeGroup).map(post => (
                 <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                   <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span></div>
                   <h3 style={styles.cardTitle}>{post.title}</h3>
                   <div style={styles.cardMeta}>
                     <span><User size={12}/> {post.author}</span>
                     <span><MessageCircle size={12}/> {post.comments?.length || 0}</span>
                   </div>
                 </div>
               ))}
             </section>
           </div>
        )}

        {/* --- LIBRARY TAB --- */}
        {activeTab === 'resources' && (
           <div>
             <div style={styles.sectionHeader}><h2>Library</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}</div>
             <div style={styles.resourceGrid}>
               {resources.map(res => (
                 <div key={res.id} style={styles.resourceCard}>
                   <FileText color="#ec4899" />
                   <div style={{flex: 1}}><strong>{res.title}</strong></div>
                   <button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                 </div>
               ))}
             </div>
           </div>
        )}
      </main>

      {/* --- MODAL: POST DETAIL --- */}
      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <h2>{selectedPost.title}</h2>
            <p style={styles.popOutBody}>{selectedPost.content}</p>
            <div style={styles.commentSection}>
                <h4>Comments</h4>
                <div style={styles.commentList}>
                    {(selectedPost.comments || []).map(c => (
                        <div key={c.id} style={styles.commentItem}><strong>{c.author}:</strong> {c.text}</div>
                    ))}
                </div>
                <div style={styles.commentInputWrap}>
                    <input style={styles.commentInput} placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                    <button style={styles.sendBtn} onClick={handleAddComment}><Send size={16}/></button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: DOC VIEWER --- */}
      {showModal === 'docViewer' && viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.docViewerContent} onClick={e => e.stopPropagation()}>
             <div style={styles.viewerHeader}><h3>{viewingDoc.title}</h3><button onClick={() => setShowModal(null)}><X size={18}/></button></div>
             <iframe 
                src={viewingDoc.url.includes('docs.google.com') ? viewingDoc.url.replace('/edit', '/preview') : viewingDoc.url} 
                style={styles.iframe} 
                frameBorder="0"
             ></iframe>
          </div>
        </div>
      )}

      {/* --- ADMIN MODAL: ADD AUDIO --- */}
      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Audio Hub Track</h3>
            <input style={styles.input} placeholder="Track Title" onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="URL (Dropbox raw=1 or Proton Link)" onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButtonFull} onClick={handleAudioUpload}>Save Track</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  header: { background: 'white', padding: '0 40px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '18px', fontWeight: '800' },
  centerNav: { display: 'flex', gap: '5px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 15px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  audioGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  audioCard: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex' },
  player: { width: '100%', marginTop: '10px' },
  linkFallback: { marginTop: '10px', padding: '15px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButtonFull: { background: '#ec4899', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  viewBtnInternal: { background: '#ec4899', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '450px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  communityLayout: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '30px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarBtn: { textAlign: 'left', padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: 'bold' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '15px', cursor: 'pointer' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' },
  popOutContent: { background: 'white', width: '600px', padding: '30px', borderRadius: '25px', position: 'relative' },
  commentList: { maxHeight: '150px', overflowY: 'auto', margin: '15px 0' },
  commentItem: { fontSize: '13px', padding: '8px', borderBottom: '1px solid #f1f5f9' },
  commentInputWrap: { display: 'flex', gap: '10px' },
  commentInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  docViewerContent: { background: 'white', width: '90%', height: '90vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '15px 25px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  iframe: { flex: 1, width: '100%' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }
};

export default Dashboard;

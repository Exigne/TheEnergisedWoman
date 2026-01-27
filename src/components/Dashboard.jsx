import React, { useState, useEffect } from 'react';
import { 
  Search, X, ThumbsUp, MessageSquare, LogOut, 
  Crown, Zap, Plus, Music, Upload, FileText, 
  Play, Pause, ExternalLink, Clock, User, Trash2,
  Lock, Mail, ChevronRight
} from 'lucide-react';

const CATEGORIES = ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];

const Dashboard = () => {
  // --- Auth & Navigation State ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  
  // --- Data States ---
  const [discussions, setDiscussions] = useState([]);
  const [audios, setAudios] = useState([]);
  const [resources, setResources] = useState([]);
  
  // --- Form States ---
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [audioForm, setAudioForm] = useState({ title: '', url: '', description: '' });
  const [libraryForm, setLibraryForm] = useState({ title: '', url: '', type: 'PDF' });

  // --- Initialization ---
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

  // --- Global Delete Handler ---
  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const response = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
      if (response.ok) {
        if (type === 'discussion') setDiscussions(discussions.filter(item => item.id !== id));
        if (type === 'audio') setAudios(audios.filter(item => item.id !== id));
        if (type === 'resource') setResources(resources.filter(item => item.id !== id));
      }
    } catch (err) { alert('Delete failed'); }
  };

  // --- Upload Handlers ---
  const handleNewPost = async (e) => {
    e.preventDefault();
    const postData = { ...postForm, author: user.display_name, authorId: user.email, created_at: new Date().toISOString(), likes: 0 };
    const res = await fetch('/.netlify/functions/database?type=discussion', { method: 'POST', body: JSON.stringify(postData) });
    if (res.ok) { setDiscussions([await res.json(), ...discussions]); setShowModal(null); }
  };

  const handleAudioUpload = async () => {
    const res = await fetch('/.netlify/functions/database?type=audio', { method: 'POST', body: JSON.stringify(audioForm) });
    if (res.ok) { setAudios([await res.json(), ...audios]); setShowModal(null); }
  };

  const handleLibraryUpload = async () => {
    const res = await fetch('/.netlify/functions/database?type=resource', { method: 'POST', body: JSON.stringify(libraryForm) });
    if (res.ok) { setResources([await res.json(), ...resources]); setShowModal(null); }
  };

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Crown size={42} color="#ec4899" />
          <h1 style={{ margin: '16px 0 8px', fontSize: '24px' }}>The Energised Woman</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Member Portal</p>
          <div style={styles.inputWrap}><Mail size={16}/><input style={styles.ghostInput} placeholder="Email" id="login-email" /></div>
          <div style={styles.inputWrap}><Lock size={16}/><input style={styles.ghostInput} type="password" placeholder="Password" id="login-pass" /></div>
          <button style={styles.primaryButton} onClick={() => {
            const email = document.getElementById('login-email').value;
            if(!email) return alert("Email required");
            const userData = { email, display_name: email.split('@')[0], isAdmin: email.includes('admin') };
            setUser(userData);
            setIsAdmin(userData.isAdmin);
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
        <div style={styles.userSection}>
          <button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* --- COMMUNITY --- */}
        {activeTab === 'community' && (
          <>
            <div style={styles.sectionHeader}>
              <h2 style={{margin: 0}}>Community Feed</h2>
              <button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button>
            </div>
            <div style={styles.grid}>
              {discussions.map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedPost(post); setShowModal('detail');}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={styles.tag}>{post.category}</span>
                    {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(post.id, 'discussion')}} style={styles.delBtn}><Trash2 size={14}/></button>}
                  </div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardExcerpt}>{post.content.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- AUDIO --- */}
        {activeTab === 'audio' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={{margin: 0}}>Audio Hub</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('audio')}><Upload size={18}/> Add Audio</button>}
            </div>
            {audios.map(audio => (
              <div key={audio.id} style={styles.audioCard}>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h4 style={{margin: 0}}>{audio.title}</h4>
                    {isAdmin && <button onClick={() => handleDelete(audio.id, 'audio')} style={styles.delBtn}><Trash2 size={16}/></button>}
                  </div>
                  <p style={{margin: '4px 0', fontSize: '13px', color: '#64748b'}}>{audio.description}</p>
                  <audio controls style={styles.player}><source src={audio.url} /></audio>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- LIBRARY --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={{margin: 0}}>Resource Library</h2>
              {isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}
            </div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" />
                  <div style={{flex: 1}}>
                    <h4 style={{margin: 0}}>{res.title}</h4>
                    <span style={{fontSize: '11px', color: '#94a3b8'}}>{res.type}</span>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <a href={res.url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View</a>
                    {isAdmin && <button onClick={() => handleDelete(res.id, 'resource')} style={styles.delBtn}><Trash2 size={14}/></button>}
                  </div>
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
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X/></button>
            <span style={styles.tag}>{selectedPost.category}</span>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutBody}>{selectedPost.content}</div>
          </div>
        </div>
      )}

      {showModal === 'post' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>New Discussion</h3>
            <input style={styles.input} placeholder="Post Title" onChange={e => setPostForm({...postForm, title: e.target.value})} />
            <textarea style={{...styles.input, height: '120px'}} placeholder="Content..." onChange={e => setPostForm({...postForm, content: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleNewPost}>Share</button>
          </div>
        </div>
      )}

      {showModal === 'audio' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Audio</h3>
            <input style={styles.input} placeholder="Track Title" onChange={e => setAudioForm({...audioForm, title: e.target.value})} />
            <input style={styles.input} placeholder="Direct MP3 URL" onChange={e => setAudioForm({...audioForm, url: e.target.value})} />
            <textarea style={styles.input} placeholder="Description" onChange={e => setAudioForm({...audioForm, description: e.target.value})} />
            <button style={styles.primaryButton} onClick={handleAudioUpload}>Save Track</button>
          </div>
        </div>
      )}

      {showModal === 'library' && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Add Library Resource</h3>
            <input style={styles.input} placeholder="Resource Name" onChange={e => setLibraryForm({...libraryForm, title: e.target.value})} />
            <input style={styles.input} placeholder="URL (PDF/Link)" onChange={e => setLibraryForm({...libraryForm, url: e.target.value})} />
            <select style={styles.input} onChange={e => setLibraryForm({...libraryForm, type: e.target.value})}>
              <option value="PDF">PDF Guide</option>
              <option value="Workbook">Workbook</option>
              <option value="Link">External Link</option>
            </select>
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
  main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 8px', borderRadius: '10px', fontWeight: '800' },
  cardTitle: { margin: '12px 0 8px', fontSize: '18px' },
  cardExcerpt: { color: '#64748b', fontSize: '14px', lineHeight: '1.5' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfaff' },
  authCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '340px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '12px', borderRadius: '12px', marginBottom: '12px' },
  ghostInput: { background: 'none', border: 'none', outline: 'none', width: '100%' },
  delBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  audioCard: { background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0' },
  player: { width: '100%', marginTop: '10px' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #e2e8f0' },
  viewBtn: { fontSize: '12px', fontWeight: 'bold', color: '#ec4899', textDecoration: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '450px' },
  popOutContent: { background: 'white', width: '90%', maxWidth: '650px', padding: '40px', borderRadius: '24px', position: 'relative' },
  popOutTitle: { fontSize: '28px', margin: '20px 0' },
  popOutBody: { fontSize: '16px', lineHeight: '1.7', color: '#475569' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }
};

export default Dashboard;

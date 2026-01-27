import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, LogOut, Crown, Plus, Music, 
  FileText, User, Hash, Send, Heart, MessageCircle, Play, Mic
} from 'lucide-react';

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
// Amazon/Spotify don't give raw RSS easily, so we use a public RSS converter for your Amazon link
const PODCAST_RSS = "https://anchor.fm/s/e88b839c/podcast/rss"; // This is the standard RSS for "The Energised Woman"

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [discussions, setDiscussions] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [resources, setResources] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    document.title = "The Energised Woman | Dashboard";
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setIsAdmin(userData.isAdmin || userData.email.includes('admin'));
      loadAllData();
      fetchPodcast();
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [dRes, rRes] = await Promise.all([
        fetch('/.netlify/functions/database?type=discussions'),
        fetch('/.netlify/functions/database?type=resources')
      ]);
      if (dRes.ok) setDiscussions(await dRes.json());
      if (rRes.ok) setResources(await rRes.json());
    } catch (err) { console.error("Data load error", err); }
  };

  const fetchPodcast = async () => {
    try {
      // We use a public RSS-to-JSON converter to avoid CORS issues
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PODCAST_RSS)}`);
      const data = await res.json();
      if (data.items) setEpisodes(data.items);
    } catch (err) { console.error("Podcast fetch error", err); }
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

  if (!user) return <div style={{padding: '50px', textAlign: 'center'}}>Please Sign In</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown size={22} color="#ec4899" /><h1 style={styles.brandText}>The Energised Woman</h1></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('podcast')} style={{...styles.navBtn, ...(activeTab === 'podcast' && styles.navBtnActive)}}>Podcast Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Library</button>
        </nav>
        <div style={styles.userSection}><button style={styles.iconBtn} onClick={() => {setUser(null); localStorage.clear();}}><LogOut size={18}/></button></div>
      </header>

      <main style={styles.main}>
        {/* --- PODCAST HUB --- */}
        {activeTab === 'podcast' && (
          <div>
            <div style={styles.sectionHeader}>
                <h2>The Energised Woman Podcast</h2>
                <a href="https://music.amazon.co.uk/podcasts/64be2800-40bd-4822-9f5a-1941f0b30eef" target="_blank" rel="noreferrer" style={styles.amazonLink}>Listen on Amazon Music</a>
            </div>
            <div style={styles.episodeGrid}>
              {episodes.map((ep, idx) => (
                <div key={idx} style={styles.podcastCard}>
                  <img src={ep.thumbnail || ep.enclosure.thumbnail} alt="Podcast Cover" style={styles.episodeThumb} />
                  <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 5px 0', fontSize: '18px'}}>{ep.title}</h4>
                    <p style={styles.episodeDesc}>{ep.description.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
                    <audio controls style={styles.player}><source src={ep.enclosure.link} type="audio/mpeg" /></audio>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- COMMUNITY --- */}
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
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span></div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <div style={styles.cardMeta}><span style={styles.metaItem}><User size={12}/> {post.author}</span><span style={styles.metaItem}><MessageCircle size={12}/> {post.comments?.length || 0}</span></div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* --- LIBRARY --- */}
        {activeTab === 'resources' && (
          <div>
            <div style={styles.sectionHeader}><h2>Library</h2>{isAdmin && <button style={styles.primaryButton} onClick={() => setShowModal('library')}><Plus size={18}/> Add Resource</button>}</div>
            <div style={styles.resourceGrid}>
              {resources.map(res => (
                <div key={res.id} style={styles.resourceCard}>
                  <FileText color="#ec4899" /><div style={{flex: 1}}><h4 style={{margin: 0}}>{res.title}</h4></div>
                  <button onClick={() => {setViewingDoc(res); setShowModal('docViewer');}} style={styles.viewBtnInternal}>Open</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: POST DETAIL & COMMENTS --- */}
      {showModal === 'detail' && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            <h2 style={styles.popOutTitle}>{selectedPost.title}</h2>
            <div style={styles.popOutBody}>{selectedPost.content}</div>
            <hr style={styles.divider} />
            <div style={styles.commentSection}>
              <div style={styles.commentList}>
                {(selectedPost.comments || []).map(c => (
                  <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>
                ))}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                <button style={styles.sendBtn} onClick={handleAddComment}><Send size={18}/></button>
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
            <iframe src={viewingDoc.url.includes('docs.google.com') ? viewingDoc.url.replace('/edit', '/preview') : viewingDoc.url} style={styles.iframe} frameBorder="0"></iframe>
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
  brandText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  centerNav: { display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  navBtn: { padding: '8px 18px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  navBtnActive: { background: 'white', color: '#ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  userSection: { display: 'flex', justifyContent: 'flex-end' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  episodeGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  podcastCard: { display: 'flex', gap: '20px', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', alignItems: 'center' },
  episodeThumb: { width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' },
  episodeDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '10px' },
  player: { width: '100%' },
  amazonLink: { color: '#ec4899', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sidebarBtn: { textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '16px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' },
  cardTitle: { fontSize: '20px', margin: '8px 0', color: '#1e293b' },
  cardMeta: { marginTop: '16px', display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popOutContent: { background: 'white', width: '600px', borderRadius: '28px', padding: '30px', position: 'relative' },
  popOutTitle: { fontSize: '24px', margin: '16px 0' },
  popOutBody: { fontSize: '15px', lineHeight: '1.7', color: '#334155' },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' },
  commentSection: { marginTop: '10px' },
  commentList: { maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' },
  commentItem: { fontSize: '14px', padding: '5px 0' },
  commentInputWrap: { display: 'flex', gap: '10px' },
  commentInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  sendBtn: { background: '#ec4899', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px' },
  docViewerContent: { background: 'white', width: '90%', height: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  iframe: { flex: 1, width: '100%' },
  resourceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  resourceCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  viewBtnInternal: { background: '#fdf2f8', color: '#ec4899', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }
};

export default Dashboard;

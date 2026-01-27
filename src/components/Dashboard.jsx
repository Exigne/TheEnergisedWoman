import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, LogOut, Crown, Plus, Music, 
  FileText, User, Hash, Send, Heart, MessageCircle, Play, Mic, Headphones
} from 'lucide-react';

const PODCAST_RSS = "https://anchor.fm/s/e88b839c/podcast/rss";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [showModal, setShowModal] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [discussions, setDiscussions] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [resources, setResources] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
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
    } catch (err) { console.error(err); }
  };

  const fetchPodcast = async () => {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PODCAST_RSS)}`);
      const data = await res.json();
      if (data.items) setEpisodes(data.items);
    } catch (err) { console.error(err); }
  };

  // This finds comments in your DB that match the podcast episode URL
  const getCommentsForItem = (itemLink) => {
    const match = discussions.find(d => d.author_id === 'PODCAST_SYSTEM' && d.content === itemLink);
    return match ? match.comments : [];
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const isPodcast = !!selectedItem.enclosure;
    const identifier = isPodcast ? selectedItem.link : selectedItem.id;
    
    // Logic for Podcast Comments
    if (isPodcast) {
        let existingThread = discussions.find(d => d.content === identifier);
        const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
        
        let updatedThread;
        if (existingThread) {
            updatedThread = { ...existingThread, comments: [...(existingThread.comments || []), newComment] };
            await fetch(`/.netlify/functions/database?id=${existingThread.id}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedThread) });
        } else {
            // First time someone comments on this episode, create a "shadow post" in DB
            const newThread = { 
                author: 'System', authorId: 'PODCAST_SYSTEM', title: selectedItem.title, 
                content: identifier, category: 'Podcast', comments: [newComment] 
            };
            const res = await fetch('/.netlify/functions/database?type=discussion', { method: 'POST', body: JSON.stringify(newThread) });
            updatedThread = await res.json();
        }
        setDiscussions([...discussions.filter(d => d.content !== identifier), updatedThread]);
        setSelectedItem({ ...selectedItem, dbData: updatedThread });
    } else {
        // Standard Community Post Logic
        const newComment = { id: Date.now(), author: user.display_name, text: commentText, created_at: new Date().toISOString() };
        const updatedPost = { ...selectedItem, comments: [...(selectedItem.comments || []), newComment] };
        setSelectedItem(updatedPost);
        setDiscussions(discussions.map(d => d.id === selectedItem.id ? updatedPost : d));
        await fetch(`/.netlify/functions/database?id=${selectedItem.id}&type=discussion`, { method: 'PUT', body: JSON.stringify(updatedPost) });
    }
    setCommentText('');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}><Crown size={22} color="#ec4899" /><h1 style={styles.brandText}>The Energised Woman</h1></div>
        <nav style={styles.centerNav}>
          <button onClick={() => setActiveTab('community')} style={{...styles.navBtn, ...(activeTab === 'community' && styles.navBtnActive)}}>Community</button>
          <button onClick={() => setActiveTab('podcast')} style={{...styles.navBtn, ...(activeTab === 'podcast' && styles.navBtnActive)}}>Podcast Hub</button>
          <button onClick={() => setActiveTab('resources')} style={{...styles.navBtn, ...(activeTab === 'resources' && styles.navBtnActive)}}>Library</button>
        </nav>
        <div style={styles.userSection}><button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconBtn}><LogOut size={18}/></button></div>
      </header>

      <main style={styles.main}>
        {activeTab === 'podcast' && (
          <div style={styles.episodeGrid}>
            <div style={styles.sectionHeader}><h2>Recent Episodes</h2></div>
            {episodes.map((ep, idx) => (
              <div key={idx} style={styles.podcastCard} onClick={() => { setSelectedItem(ep); setShowModal('detail'); }}>
                <div style={styles.playIconCircle}><Play size={20} fill="white" /></div>
                <div style={{flex: 1}}>
                  <h4 style={{margin: 0}}>{ep.title}</h4>
                  <div style={styles.cardMeta}>
                    <span><Clock size={12}/> {new Date(ep.pubDate).toLocaleDateString()}</span>
                    <span><MessageCircle size={12}/> {getCommentsForItem(ep.link).length} Comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- COMMUNITY & LIBRARY REMAIN SAME --- */}
        {activeTab === 'community' && (
          <div style={styles.communityLayout}>
            <aside style={styles.sidebar}>
              {GROUPS.map(g => <button key={g} onClick={() => setActiveGroup(g)} style={{...styles.sidebarBtn, ...(activeGroup === g && styles.sidebarBtnActive)}}><Hash size={14} /> {g}</button>)}
            </aside>
            <section style={styles.feed}>
              <div style={styles.sectionHeader}><h2>{activeGroup}</h2><button style={styles.primaryButton} onClick={() => setShowModal('post')}><Plus size={18}/> New Post</button></div>
              {discussions.filter(d => (activeGroup === 'All Discussions' || d.category === activeGroup) && d.author_id !== 'PODCAST_SYSTEM').map(post => (
                <div key={post.id} style={styles.card} onClick={() => {setSelectedItem(post); setShowModal('detail');}}>
                  <div style={styles.cardHeader}><span style={styles.tag}>{post.category}</span></div>
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <div style={styles.cardMeta}><span><User size={12}/> {post.author}</span><span><MessageCircle size={12}/> {post.comments?.length || 0}</span></div>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>

      {/* --- MASTER DETAIL MODAL (Handles Post or Podcast) --- */}
      {showModal === 'detail' && selectedItem && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <div style={styles.popOutContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(null)} style={styles.closeBtn}><X size={18}/></button>
            
            {selectedItem.enclosure ? ( // PODCAST VIEW
               <>
                 <div style={styles.podcastHeader}>
                    <Headphones size={40} color="#ec4899" />
                    <div>
                        <h2 style={{margin: 0}}>{selectedItem.title}</h2>
                        <small style={{color: '#64748b'}}>{new Date(selectedItem.pubDate).toLocaleDateString()}</small>
                    </div>
                 </div>
                 <audio controls style={styles.player} autoPlay><source src={selectedItem.enclosure.link} type="audio/mpeg" /></audio>
                 <div style={{...styles.popOutBody, marginTop: '20px'}} dangerouslySetInnerHTML={{__html: selectedItem.description}}></div>
               </>
            ) : ( // STANDARD POST VIEW
               <>
                 <h2 style={styles.popOutTitle}>{selectedItem.title}</h2>
                 <div style={styles.popOutBody}>{selectedItem.content}</div>
               </>
            )}

            <hr style={styles.divider} />
            <div style={styles.commentSection}>
              <h4>Discussion</h4>
              <div style={styles.commentList}>
                {(selectedItem.enclosure ? getCommentsForItem(selectedItem.link) : (selectedItem.comments || [])).map(c => (
                  <div key={c.id} style={styles.commentItem}><strong>{c.author}</strong>: {c.text}</div>
                ))}
              </div>
              <div style={styles.commentInputWrap}>
                <input style={styles.commentInput} placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment()} />
                <button style={styles.sendBtn} onClick={handleAddComment}><Send size={18}/></button>
              </div>
            </div>
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
  main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  sectionHeader: { marginBottom: '24px' },
  episodeGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  podcastCard: { background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: '0.2s' },
  playIconCircle: { width: '40px', height: '40px', borderRadius: '50%', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '3px' },
  podcastHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  player: { width: '100%', height: '40px' },
  cardMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '12px', marginTop: '4px' },
  communityLayout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sidebarBtn: { textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarBtnActive: { background: '#fdf2f8', color: '#ec4899', fontWeight: '700' },
  card: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '16px' },
  tag: { fontSize: '10px', background: '#fdf2f8', color: '#ec4899', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' },
  cardTitle: { fontSize: '18px', margin: '8px 0', color: '#1e293b' },
  primaryButton: { background: '#ec4899', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popOutContent: { background: 'white', width: '650px', borderRadius: '28px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  popOutBody: { fontSize: '15px', lineHeight: '1.7', color: '#334155' },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' },
  commentSection: { marginTop: '10px' },
  commentList: { maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' },
  commentItem: { fontSize: '14px', padding: '10px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px' },
  commentInputWrap: { display: 'flex', gap: '10px' },
  commentInput: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  sendBtn: { background: '#ec4899', color: 'white', border: 'none', borderRadius: '12px', padding: '0 15px', cursor: 'pointer' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }
};

export default Dashboard;

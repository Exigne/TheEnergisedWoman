import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Crown, Plus, Video, Upload, User, 
  Trash2, Hash, Send, MessageCircle, Heart, PlayCircle, Image as ImageIcon,
  Link2, BookOpen, FileText, Loader
} from 'lucide-react';

// CLOUDINARY CONFIG
const CLOUDINARY_CLOUD_NAME = 'dyitrwe5h';
const CLOUDINARY_UPLOAD_PRESET = 'wellness_profile_pics';

// COLOR PALETTE
const COLORS = {
  transparent: 'rgba(0, 0, 0, 0)',
  sageLight: 'rgb(179, 197, 151)',
  sage: 'rgb(162, 189, 145)',
  mauve: 'rgb(180, 169, 172)',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray800: '#1e293b',
  red: '#ef4444'
};

const GROUPS = ['All Discussions', 'General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood', 'Fitness', 'Nutrition'];
const RESOURCE_CATEGORIES = ['General', 'Recipes', 'Book Club', 'Worksheets'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('community'); 
  const [activeGroup, setActiveGroup] = useState('All Discussions');
  const [activeResourceCategory, setActiveResourceCategory] = useState('General');
  
  const [discussions, setDiscussions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [showModal, setShowModal] = useState(null); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hoveredPost, setHoveredPost] = useState(null);
  
  const [imageError, setImageError] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '', thumbnail: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', profilePic: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
        setIsAdmin(userData.isAdmin || false);
        setProfileForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profilePic: userData.profilePic || ''
        });
        loadAllData();
      } catch (e) {
        localStorage.removeItem('wellnessUser');
      }
    }
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const dRes = await fetch('/.netlify/functions/database?type=discussions');
      const dData = await dRes.json();
      setDiscussions(Array.isArray(dData) ? dData : []);
      
      const vRes = await fetch('/.netlify/functions/database?type=videos');
      const vData = await vRes.json();
      setVideos(Array.isArray(vData) ? vData : []);
      
      const rRes = await fetch('/.netlify/functions/database?type=resources');
      const rData = await rRes.json();
      setResources(Array.isArray(rData) ? rData : []);
    } catch (err) { 
      console.error("Error loading data", err); 
    } finally {
      setLoadingData(false);
    }
  };

  // ROBUST VIDEO ID PARSER
  const getVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleOpenResource = (resource) => {
    if (!resource.url) return;
    const isDoc = resource.url.toLowerCase().includes('.doc') || resource.url.toLowerCase().includes('.docx');
    if (isDoc) {
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`;
      window.open(viewerUrl, '_blank');
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Cloudinary needs 'raw' for docs/pdfs and 'image' for thumbnails
    const resourceType = file.type.includes('image') ? 'image' : 'raw';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    try {
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      throw err;
    }
  };

  const handleFileUpload = async (event, formSetter, field) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert('File must be smaller than 10MB');

    setUploadingFile(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      if (field === 'profilePic') setProfileForm(prev => ({...prev, profilePic: fileUrl}));
      else if (field === 'thumbnail') formSetter(prev => ({...prev, thumbnail: fileUrl}));
      else if (field === 'resourceFile') setResourceForm(prev => ({...prev, url: fileUrl, fileName: file.name}));
    } catch (err) {
      alert('Upload failed. Check your Cloudinary preset settings.');
    } finally {
      setUploadingFile(false);
    }
  };

  // --- ACTIONS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const type = isRegistering ? 'register' : 'login';
    const res = await fetch(`/.netlify/functions/database?type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('wellnessUser', JSON.stringify(data));
      window.location.reload();
    } else alert(data.message);
  };

  const handleAddVideo = async () => {
    if (!videoForm.title || !videoForm.url) return alert("Required fields missing");
    const vId = getVideoId(videoForm.url);
    if (!vId) return alert("Invalid YouTube URL");

    const res = await fetch('/.netlify/functions/database?type=video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoForm)
    });
    if (res.ok) {
      setVideoForm({ title: '', url: '', description: '', thumbnail: '' });
      setShowModal(null);
      loadAllData();
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url) return alert("Please upload a file and add a title");
    const res = await fetch('/.netlify/functions/database?type=resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resourceForm)
    });
    if (res.ok) {
      setResourceForm({ title: '', url: '', category: 'General', thumbnail: '', fileName: '' });
      setShowModal(null);
      loadAllData();
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this item?")) return;
    const res = await fetch(`/.netlify/functions/database?id=${id}&type=${type}`, { method: 'DELETE' });
    if (res.ok) loadAllData();
  };

  const renderAvatar = (src, size = 'small') => {
    const sizePx = size === 'large' ? '80px' : size === 'medium' ? '40px' : '35px';
    return (
      <div style={{width: sizePx, height: sizePx, borderRadius: '50%', background: COLORS.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2px solid ${src ? COLORS.sage : COLORS.gray200}`}}>
        {src ? <img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={20} color={COLORS.gray400} />}
      </div>
    );
  };

  if (!user) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.gray50}}>
        <div style={{background: COLORS.white, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center'}}>
          <Crown size={40} color={COLORS.sage} style={{marginBottom: '10px'}} />
          <h2>{isRegistering ? 'Join the Collective' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuth} style={{marginTop: '20px'}}>
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '10px'}} type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            <button type="submit" style={{width: '100%', background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button style={{marginTop: '15px', background: 'none', border: 'none', color: COLORS.gray500, cursor: 'pointer'}} onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Already a member? Login' : 'Need an account? Register'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: COLORS.gray50, fontFamily: 'system-ui, sans-serif'}}>
      <header style={{background: COLORS.white, height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: `1px solid ${COLORS.gray200}`, position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px'}}><Crown color={COLORS.sage} /> <span>The Energised Woman</span></div>
        <nav style={{display: 'flex', gap: '8px', background: COLORS.gray100, padding: '5px', borderRadius: '12px'}}>
          {['community', 'video', 'resources'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === tab ? COLORS.white : 'transparent', color: activeTab === tab ? COLORS.sage : COLORS.gray500, fontWeight: 'bold'}}>
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div onClick={() => setShowModal('profile')} style={{cursor: 'pointer'}}>{renderAvatar(profileForm.profilePic)}</div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}><LogOut size={20}/></button>
        </div>
      </header>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        {/* VIDEO HUB */}
        {activeTab === 'video' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
              <h2>Video Hub</h2>
              {isAdmin && <button onClick={() => setShowModal('addVideo')} style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer'}}><Plus size={18}/> Add Video</button>}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px'}}>
              {videos.map(v => (
                <div key={v.id} style={{background: COLORS.white, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${COLORS.gray200}`}}>
                  <div style={{position: 'relative', height: '180px', cursor: 'pointer'}} onClick={() => {setSelectedVideo(v); setShowModal('playVideo');}}>
                    <img src={v.thumbnail || `https://img.youtube.com/vi/${getVideoId(v.url)}/hqdefault.jpg`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)'}}>
                      <PlayCircle size={48} color="white" fill="rgba(162, 189, 145, 0.8)" />
                    </div>
                  </div>
                  <div style={{padding: '15px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <h4 style={{margin: 0}}>{v.title}</h4>
                      {isAdmin && <Trash2 size={16} color={COLORS.gray400} onClick={() => handleDelete(v.id, 'video')} style={{cursor: 'pointer'}} />}
                    </div>
                    <p style={{fontSize: '13px', color: COLORS.gray500, marginTop: '5px'}}>{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESOURCES */}
        {activeTab === 'resources' && (
          <div style={{display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px'}}>
            <aside>
              {RESOURCE_CATEGORIES.map(c => (
                <button key={c} onClick={() => setActiveResourceCategory(c)} style={{width: '100%', textAlign: 'left', padding: '12px', marginBottom: '5px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: activeResourceCategory === c ? COLORS.sage : 'transparent', color: activeResourceCategory === c ? COLORS.white : COLORS.gray500}}>
                  {c}
                </button>
              ))}
              {isAdmin && <button onClick={() => setShowModal('addResource')} style={{marginTop: '20px', width: '100%', padding: '12px', background: COLORS.white, color: COLORS.sage, border: `1px solid ${COLORS.sage}`, borderRadius: '10px', cursor: 'pointer'}}>+ Add New</button>}
            </aside>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px'}}>
              {resources.filter(r => r.category === activeResourceCategory).map(r => (
                <div key={r.id} onClick={() => handleOpenResource(r)} style={{background: COLORS.white, borderRadius: '16px', border: `1px solid ${COLORS.gray200}`, cursor: 'pointer', overflow: 'hidden'}}>
                  <div style={{height: '120px', background: COLORS.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {r.thumbnail ? <img src={r.thumbnail} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <FileText size={40} color={COLORS.gray400} />}
                  </div>
                  <div style={{padding: '15px'}}>
                    <h4 style={{margin: 0}}>{r.title}</h4>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center'}}>
                      <span style={{fontSize: '12px', color: COLORS.sage, fontWeight: 'bold'}}>VIEW DOCUMENT</span>
                      {isAdmin && <Trash2 size={14} color={COLORS.gray400} onClick={(e) => {e.stopPropagation(); handleDelete(r.id, 'resource');}} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNITY (PLACEHOLDER FOR YOUR EXISTING LOGIC) */}
        {activeTab === 'community' && (
           <div style={{textAlign: 'center', padding: '50px'}}>Community Discussions Loaded: {discussions.length}</div>
        )}
      </main>

      {/* MODALS */}
      {showModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}}>
          <div style={{background: COLORS.white, width: '100%', maxWidth: showModal === 'playVideo' ? '900px' : '500px', borderRadius: '20px', overflow: 'hidden'}}>
            
            <div style={{padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.gray100}`}}>
              <h3 style={{margin: 0}}>{showModal.replace(/([A-Z])/g, ' $1').toUpperCase()}</h3>
              <X onClick={() => setShowModal(null)} style={{cursor: 'pointer'}} />
            </div>

            <div style={{padding: '20px'}}>
              {/* PLAY VIDEO MODAL */}
              {showModal === 'playVideo' && selectedVideo && (
                <div>
                  <div style={{width: '100%', aspectRatio: '16/9', background: '#000'}}>
                    <iframe 
                      width="100%" height="100%" 
                      src={`https://www.youtube.com/embed/${getVideoId(selectedVideo.url)}?autoplay=1`} 
                      frameBorder="0" allowFullScreen 
                    />
                  </div>
                  <div style={{marginTop: '20px'}}>
                    <h2 style={{margin: '0 0 10px 0'}}>{selectedVideo.title}</h2>
                    <p style={{color: COLORS.gray600}}>{selectedVideo.description}</p>
                  </div>
                </div>
              )}

              {/* ADD RESOURCE MODAL */}
              {showModal === 'addResource' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <input placeholder="Resource Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                  <select value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}}>
                    {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <div style={{border: `2px dashed ${COLORS.gray200}`, padding: '20px', borderRadius: '12px', textAlign: 'center'}}>
                    {uploadingFile ? <Loader className="animate-spin" style={{margin: '0 auto'}} /> : (
                      <>
                        <input type="file" id="res-file" hidden onChange={(e) => handleFileUpload(e, setResourceForm, 'resourceFile')} />
                        <label htmlFor="res-file" style={{cursor: 'pointer', color: COLORS.sage, fontWeight: 'bold'}}>
                          {resourceForm.fileName ? `✓ ${resourceForm.fileName}` : 'Upload Document (PDF/Word)'}
                        </label>
                      </>
                    )}
                  </div>

                  <button onClick={handleAddResource} disabled={uploadingFile} style={{background: COLORS.sage, color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>
                    {uploadingFile ? 'Uploading...' : 'Save Resource'}
                  </button>
                </div>
              )}

              {/* ADD VIDEO MODAL */}
              {showModal === 'addVideo' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <input placeholder="Video Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                  <input placeholder="YouTube URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`}} />
                  <textarea placeholder="Description" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} style={{padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, height: '80px'}} />
                  <button onClick={handleAddVideo} style={{background: COLORS.sage, color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>Save Video</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  BookOpen, 
  Music, 
  Heart, 
  Sparkles, 
  User, 
  LogOut, 
  Settings, 
  Search, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  MoreVertical, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Filter,
  Clock,
  Calendar,
  X,
  ChevronRight,
  FileText,
  Headphones,
  Users,
  Bookmark
} from 'lucide-react';

// Categories for organization
const CATEGORIES = {
  discussion: ['General', 'Mental Health', 'Self Care', 'Relationships', 'Career', 'Motherhood'],
  resources: ['Articles', 'Guides', 'Templates', 'E-books', 'External Links'],
  audio: ['Meditations', 'Affirmations', 'Sleep Stories', 'Podcasts', 'Soundscapes']
};

const SAMPLE_DISCUSSIONS = [
  {
    id: 1,
    author: "Sarah M.",
    avatar: "",
    category: "Self Care",
    title: "Morning routine tips for busy moms?",
    content: "I'm struggling to find time for myself in the mornings. Would love to hear what works for you all!",
    likes: 24,
    comments: 8,
    timestamp: "2 hours ago",
    tags: ["routine", "wellness", "morning"]
  },
  {
    id: 2,
    author: "Jessica T.",
    avatar: "",
    category: "Mental Health",
    title: "Dealing with burnout - sharing my journey",
    content: "After 6 months of feeling overwhelmed, I've learned a few things about setting boundaries...",
    likes: 56,
    comments: 12,
    timestamp: "5 hours ago",
    tags: ["burnout", "boundaries", "healing"]
  },
  {
    id: 3,
    author: "Emma L.",
    avatar: "",
    category: "Career",
    title: "Negotiating remote work for better balance",
    content: "Just successfully negotiated 3 days remote! Here's how I approached the conversation...",
    likes: 89,
    comments: 23,
    timestamp: "1 day ago",
    tags: ["career", "work-life-balance", "remote"]
  }
];

const SAMPLE_RESOURCES = [
  {
    id: 1,
    title: "30-Day Self-Care Challenge",
    type: "Guide",
    category: "Self Care",
    author: "Dr. Rachel Kim",
    downloads: 1240,
    description: "A comprehensive guide to building sustainable self-care habits",
    fileSize: "2.4 MB",
    format: "PDF"
  },
  {
    id: 2,
    title: "Sleep Hygiene Checklist",
    type: "Template",
    category: "Wellness",
    author: "Sleep Foundation",
    downloads: 856,
    description: "Essential steps for improving sleep quality naturally",
    fileSize: "850 KB",
    format: "PDF"
  },
  {
    id: 3,
    title: "Setting Boundaries Workbook",
    type: "E-book",
    category: "Mental Health",
    author: "Therapy Center",
    downloads: 2103,
    description: "Interactive worksheets for healthy relationship boundaries",
    fileSize: "5.1 MB",
    format: "PDF"
  }
];

const SAMPLE_AUDIO = [
  {
    id: 1,
    title: "Morning Affirmations for Confidence",
    type: "Affirmations",
    duration: "5:30",
    author: "Wellness Team",
    plays: 3420,
    description: "Start your day with positive affirmations for self-confidence",
    thumbnail: "pink"
  },
  {
    id: 2,
    title: "Deep Sleep Meditation",
    type: "Meditation",
    duration: "20:00",
    author: "Sarah Chen",
    plays: 8901,
    description: "Guided meditation to help you fall into deep, restful sleep",
    thumbnail: "purple"
  },
  {
    id: 3,
    title: "Rainy Day Ambience",
    type: "Soundscapes",
    duration: "60:00",
    author: "Nature Sounds",
    plays: 1205,
    description: "Gentle rain sounds for focus and relaxation",
    thumbnail: "blue"
  }
];

const WellnessPortal = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('community');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Community state
  const [discussions, setDiscussions] = useState(SAMPLE_DISCUSSIONS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General' });
  
  // Resources state
  const [resources, setResources] = useState(SAMPLE_RESOURCES);
  const [resourceFilter, setResourceFilter] = useState('All');
  
  // Audio state
  const [audioLibrary, setAudioLibrary] = useState(SAMPLE_AUDIO);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadAudio, setShowUploadAudio] = useState(false);
  const [uploadData, setUploadData] = useState({ 
    title: '', 
    type: 'Meditation', 
    duration: '', 
    description: '' 
  });
  
  // Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wellnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        bio: userData.bio || ''
      });
    }
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      // Simulated auth
      const userData = { 
        email, 
        display_name: email.split('@')[0],
        bio: '',
        joined: new Date().toISOString()
      };
      setUser(userData);
      localStorage.setItem('wellnessUser', JSON.stringify(userData));
      setError(null);
    } catch (e) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = () => {
    if (!newPostData.title || !newPostData.content) return;
    
    const post = {
      id: Date.now(),
      author: user.display_name || user.email.split('@')[0],
      avatar: "",
      category: newPostData.category,
      title: newPostData.title,
      content: newPostData.content,
      likes: 0,
      comments: 0,
      timestamp: "Just now",
      tags: []
    };
    
    setDiscussions([post, ...discussions]);
    setNewPostData({ title: '', content: '', category: 'General' });
    setShowNewPost(false);
  };

  const handleAudioUpload = () => {
    if (!uploadData.title) return;
    
    const newAudio = {
      id: Date.now(),
      title: uploadData.title,
      type: uploadData.type,
      duration: uploadData.duration || "5:00",
      author: user.display_name || "You",
      plays: 0,
      description: uploadData.description,
      thumbnail: "pink"
    };
    
    setAudioLibrary([newAudio, ...audioLibrary]);
    setUploadData({ title: '', type: 'Meditation', duration: '', description: '' });
    setShowUploadAudio(false);
  };

  const togglePlay = (id) => {
    if (currentlyPlaying === id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(id);
      setIsPlaying(true);
    }
  };

  const filteredDiscussions = selectedCategory === 'All' 
    ? discussions 
    : discussions.filter(d => d.category === selectedCategory);

  const filteredResources = resourceFilter === 'All'
    ? resources
    : resources.filter(r => r.category === resourceFilter);

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <Sparkles size={32} color="#ec4899" />
            <h1 style={styles.authTitle}>Serenity Space</h1>
            <p style={styles.authSubtitle}>A wellness community for women</p>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.inputGroup}>
            <input 
              style={styles.input} 
              placeholder="Email address" 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleAuth()}
            />
            <input 
              style={styles.input} 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
          
          <button 
            style={styles.primaryButton} 
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In or Join'}
          </button>
          
          <p style={styles.authNote}>
            New here? Enter your details above to create your sanctuary
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <Heart size={28} color="#ec4899" fill="#fce7f3" />
          <h1 style={styles.brandText}>Serenity Space</h1>
        </div>
        
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('community')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'community' ? styles.navButtonActive : {})
            }}
          >
            <MessageCircle size={18} />
            Community
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'resources' ? styles.navButtonActive : {})
            }}
          >
            <BookOpen size={18} />
            Resources
          </button>
          <button 
            onClick={() => setActiveTab('audio')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'audio' ? styles.navButtonActive : {})
            }}
          >
            <Headphones size={18} />
            Audio
          </button>
        </nav>
        
        <div style={styles.userActions}>
          <button 
            onClick={() => setShowProfile(true)}
            style={styles.iconButton}
          >
            <User size={20} color="#64748b" />
          </button>
          <button 
            onClick={() => {setUser(null); localStorage.removeItem('wellnessUser');}}
            style={styles.iconButton}
          >
            <LogOut size={20} color="#64748b" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'community' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Community Discussions</h2>
                <p style={styles.sectionSubtitle}>Connect, share, and grow together</p>
              </div>
              <button 
                style={styles.primaryButtonSmall}
                onClick={() => setShowNewPost(true)}
              >
                <MoreVertical size={16} />
                New Discussion
              </button>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
              <div style={styles.filterTabs}>
                <button 
                  style={{
                    ...styles.filterTab,
                    ...(selectedCategory === 'All' ? styles.filterTabActive : {})
                  }}
                  onClick={() => setSelectedCategory('All')}
                >
                  All Topics
                </button>
                {CATEGORIES.discussion.map(cat => (
                  <button 
                    key={cat}
                    style={{
                      ...styles.filterTab,
                      ...(selectedCategory === cat ? styles.filterTabActive : {})
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussion List */}
            <div style={styles.cardList}>
              {filteredDiscussions.map(post => (
                <article key={post.id} style={styles.discussionCard}>
                  <div style={styles.cardMeta}>
                    <span style={styles.categoryTag}>{post.category}</span>
                    <span style={styles.timestamp}>{post.timestamp}</span>
                  </div>
                  
                  <h3 style={styles.cardTitle}>{post.title}</h3>
                  <p style={styles.cardContent}>{post.content}</p>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.authorInfo}>
                      <div style={styles.avatarPlaceholder}>
                        <User size={16} color="#94a3b8" />
                      </div>
                      <span style={styles.authorName}>{post.author}</span>
                    </div>
                    
                    <div style={styles.cardStats}>
                      <button style={styles.statButton}>
                        <ThumbsUp size={16} />
                        {post.likes}
                      </button>
                      <button style={styles.statButton}>
                        <MessageSquare size={16} />
                        {post.comments}
                      </button>
                      <button style={styles.iconButtonGhost}>
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Resource Library</h2>
                <p style={styles.sectionSubtitle}>Curated guides and tools for your journey</p>
              </div>
              <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.resourceGrid}>
              {filteredResources.map(resource => (
                <div key={resource.id} style={styles.resourceCard}>
                  <div style={styles.resourceIcon}>
                    <FileText size={32} color="#ec4899" />
                  </div>
                  <div style={styles.resourceContent}>
                    <span style={styles.resourceType}>{resource.type}</span>
                    <h3 style={styles.resourceTitle}>{resource.title}</h3>
                    <p style={styles.resourceDesc}>{resource.description}</p>
                    <div style={styles.resourceMeta}>
                      <span style={styles.resourceAuthor}>{resource.author}</span>
                      <span style={styles.resourceStats}>{resource.downloads} downloads</span>
                    </div>
                    <button style={styles.downloadButton}>
                      <Download size={16} />
                      Download {resource.format}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Audio Wellness</h2>
                <p style={styles.sectionSubtitle}>Meditations, affirmations, and calming sounds</p>
              </div>
              <button 
                style={styles.primaryButtonSmall}
                onClick={() => setShowUploadAudio(true)}
              >
                <Upload size={16} />
                Upload Audio
              </button>
            </div>

            {/* Currently Playing Bar */}
            {currentlyPlaying && (
              <div style={styles.playerBar}>
                <div style={styles.playerInfo}>
                  <button 
                    style={styles.playButton}
                    onClick={() => togglePlay(currentlyPlaying)}
                  >
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                  </button>
                  <div>
                    <div style={styles.playerTitle}>
                      {audioLibrary.find(a => a.id === currentlyPlaying)?.title}
                    </div>
                    <div style={styles.playerMeta}>
                      {audioLibrary.find(a => a.id === currentlyPlaying)?.author}
                    </div>
                  </div>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill}></div>
                </div>
              </div>
            )}

            <div style={styles.audioGrid}>
              {audioLibrary.map(audio => (
                <div key={audio.id} style={styles.audioCard}>
                  <div style={{
                    ...styles.audioThumbnail,
                    background: audio.thumbnail === 'pink' ? '#fce7f3' : 
                               audio.thumbnail === 'purple' ? '#e0e7ff' : '#dbeafe'
                  }}>
                    <Headphones size={32} color={audio.thumbnail === 'pink' ? '#ec4899' : 
                                                      audio.thumbnail === 'purple' ? '#6366f1' : '#3b82f6'} />
                    <button 
                      style={styles.audioPlayOverlay}
                      onClick={() => togglePlay(audio.id)}
                    >
                      {currentlyPlaying === audio.id && isPlaying ? (
                        <Pause size={24} fill="white" />
                      ) : (
                        <Play size={24} fill="white" />
                      )}
                    </button>
                  </div>
                  <div style={styles.audioInfo}>
                    <span style={styles.audioType}>{audio.type}</span>
                    <h3 style={styles.audioTitle}>{audio.title}</h3>
                    <p style={styles.audioDesc}>{audio.description}</p>
                    <div style={styles.audioMeta}>
                      <span style={styles.audioDuration}>
                        <Clock size={14} />
                        {audio.duration}
                      </span>
                      <span style={styles.audioPlays}>
                        {audio.plays} plays
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Post Modal */}
      {showNewPost && (
        <div style={styles.modalOverlay} onClick={() => setShowNewPost(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Start a Discussion</h3>
              <button style={styles.closeButton} onClick={() => setShowNewPost(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select 
                style={styles.select}
                value={newPostData.category}
                onChange={e => setNewPostData({...newPostData, category: e.target.value})}
              >
                {CATEGORIES.discussion.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input 
                style={styles.input}
                placeholder="What's on your mind?"
                value={newPostData.title}
                onChange={e => setNewPostData({...newPostData, title: e.target.value})}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Message</label>
              <textarea 
                style={styles.textarea}
                placeholder="Share your thoughts with the community..."
                value={newPostData.content}
                onChange={e => setNewPostData({...newPostData, content: e.target.value})}
                rows={5}
              />
            </div>
            
            <button 
              style={styles.primaryButton}
              onClick={handleNewPost}
              disabled={!newPostData.title || !newPostData.content}
            >
              Post Discussion
            </button>
          </div>
        </div>
      )}

      {/* Upload Audio Modal */}
      {showUploadAudio && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadAudio(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Upload Audio</h3>
              <button style={styles.closeButton} onClick={() => setShowUploadAudio(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.uploadZone}>
              <Upload size={48} color="#cbd5e1" />
              <p style={styles.uploadText}>Drag and drop audio file here</p>
              <p style={styles.uploadSubtext}>or click to browse</p>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input 
                style={styles.input}
                placeholder="Guided Meditation for..."
                value={uploadData.title}
                onChange={e => setUploadData({...uploadData, title: e.target.value})}
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type</label>
                <select 
                  style={styles.select}
                  value={uploadData.type}
                  onChange={e => setUploadData({...uploadData, type: e.target.value})}
                >
                  {CATEGORIES.audio.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration</label>
                <input 
                  style={styles.input}
                  placeholder="10:00"
                  value={uploadData.duration}
                  onChange={e => setUploadData({...uploadData, duration: e.target.value})}
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea 
                style={styles.textarea}
                placeholder="Describe this audio..."
                value={uploadData.description}
                onChange={e => setUploadData({...uploadData, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <button 
              style={styles.primaryButton}
              onClick={handleAudioUpload}
              disabled={!uploadData.title}
            >
              Upload Audio
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Profile Settings</h3>
              <button style={styles.closeButton} onClick={() => setShowProfile(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.profileSection}>
              <div style={styles.avatarLarge}>
                <User size={40} color="#94a3b8" />
              </div>
              <button style={styles.changePhoto}>Change Photo</button>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
              <input 
                style={styles.input}
                value={profileForm.displayName}
                onChange={e => setProfileForm({...profileForm, displayName: e.target.value})}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea 
                style={styles.textarea}
                placeholder="Tell us about yourself..."
                value={profileForm.bio}
                onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                rows={3}
              />
            </div>
            
            <button 
              style={styles.primaryButton}
              onClick={() => {
                const updated = {...user, display_name: profileForm.displayName, bio: profileForm.bio};
                setUser(updated);
                localStorage.setItem('wellnessUser', JSON.stringify(updated));
                setShowProfile(false);
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafaf9', // Warm white/gray
    color: '#1e293b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.6
  },
  
  // Auth Styles
  authCard: {
    maxWidth: '420px',
    margin: '80px auto',
    background: '#ffffff',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9'
  },
  authHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  authTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '16px 0 8px',
    letterSpacing: '-0.5px'
  },
  authSubtitle: {
    color: '#64748b',
    fontSize: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    background: '#ffffff',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    background: '#ffffff',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    background: '#ffffff',
    color: '#1e293b',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  primaryButton: {
    width: '100%',
    padding: '14px 24px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  primaryButtonSmall: {
    padding: '10px 20px',
    background: '#ec4899',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  authNote: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    marginTop: '20px'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    padding: '12px',
    background: '#fef2f2',
    borderRadius: '8px'
  },

  // Header Styles
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  brandText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: '-0.5px'
  },
  nav: {
    display: 'flex',
    gap: '8px',
    background: '#f8fafc',
    padding: '6px',
    borderRadius: '12px'
  },
  navButton: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  navButtonActive: {
    background: '#ffffff',
    color: '#1e293b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  userActions: {
    display: 'flex',
    gap: '12px'
  },
  iconButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconButtonGhost: {
    padding: '6px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px'
  },

  // Main Content
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 40px'
  },
  section: {
    animation: 'fadeIn 0.3s ease'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '28px'
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px'
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: '16px',
    margin: 0
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ffffff',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    width: '300px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '14px',
    width: '100%',
    color: '#1e293b'
  },

  // Filter Styles
  filterBar: {
    marginBottom: '24px',
    overflowX: 'auto'
  },
  filterTabs: {
    display: 'flex',
    gap: '8px',
    paddingBottom: '8px'
  },
  filterTab: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
  },
  filterTabActive: {
    background: '#fce7f3',
    color: '#ec4899',
    borderColor: '#fce7f3',
    fontWeight: '600'
  },

  // Card Styles
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  discussionCard: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  categoryTag: {
    padding: '4px 12px',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  timestamp: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    lineHeight: 1.4
  },
  cardContent: {
    color: '#475569',
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f8fafc'
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLarge: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px'
  },
  authorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },
  cardStats: {
    display: 'flex',
    gap: '16px'
  },
  statButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },

  // Resource Styles
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  resourceCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    padding: '24px',
    display: 'flex',
    gap: '16px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  resourceIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: '#fdf2f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  resourceContent: {
    flex: 1
  },
  resourceType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ec4899',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  resourceTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '4px 0 8px 0'
  },
  resourceDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 12px 0',
    lineHeight: 1.5
  },
  resourceMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '12px'
  },
  downloadButton: {
    padding: '8px 16px',
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s'
  },

  // Audio Styles
  audioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  audioCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  audioThumbnail: {
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  audioPlayOverlay: {
    position: 'absolute',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ffffff',
    transition: 'transform 0.2s'
  },
  audioInfo: {
    padding: '20px'
  },
  audioType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  audioTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '4px 0 8px 0'
  },
  audioDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 12px 0',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  audioMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#94a3b8'
  },
  audioDuration: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  playerBar: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    background: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    padding: '16px 40px',
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
    zIndex: 50
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '1200px',
    margin: '0 auto 12px'
  },
  playButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#ec4899',
    border: 'none',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  playerTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '2px'
  },
  playerMeta: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  progressBar: {
    height: '4px',
    background: '#f1f5f9',
    borderRadius: '2px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflow: 'hidden'
  },
  progressFill: {
    width: '30%',
    height: '100%',
    background: '#ec4899',
    borderRadius: '2px'
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  modal: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: '#f8fafc',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formGroup: {
    marginBottom: '20px',
    padding: '0 24px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    padding: '0 24px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  uploadZone: {
    margin: '0 24px 24px',
    padding: '40px',
    border: '2px dashed #e2e8f0',
    borderRadius: '12px',
    textAlign: 'center',
    background: '#f8fafc'
  },
  uploadText: {
    color: '#475569',
    fontWeight: '600',
    margin: '12px 0 4px'
  },
  uploadSubtext: {
    color: '#94a3b8',
    fontSize: '14px'
  },
  changePhoto: {
    display: 'block',
    margin: '0 auto 24px',
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    color: '#ec4899',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  profileSection: {
    textAlign: 'center',
    marginBottom: '24px'
  }
};

export default WellnessPortal;

// ... (all your existing code above) ...

      {/* Add Resource Modal */}
      {showModal === 'resource' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}} onClick={() => setShowModal(null)}>
          <div style={{background: COLORS.white, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h3 style={{color: COLORS.gray800}}>Add Resource</h3>
              <button onClick={() => setShowModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: COLORS.gray400}}>
                <X size={24}/>
              </button>
            </div>
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="Title" 
              value={resourceForm.title}
              onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
            />
            <input 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              placeholder="URL" 
              value={resourceForm.url}
              onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
            />
            <select 
              style={{width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.gray200}`, marginBottom: '15px'}} 
              value={resourceForm.category}
              onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
            >
              {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{fontSize: '14px', color: COLORS.gray500, marginBottom: '8px', display: 'block', fontWeight: '500'}}>
                Thumbnail Image
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: COLORS.gray100, border: `2px dashed ${COLORS.gray200}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: COLORS.gray500, flex: 1}}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, setResourceForm, 'thumbnail')}
                    style={{display: 'none'}}
                  />
                  <Upload size={18} />
                  {resourceForm.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </label>
                {resourceForm.thumbnail && (
                  <button 
                    onClick={() => setResourceForm({...resourceForm, thumbnail: ''})}
                    style={{background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: '13px', padding: '8px'}}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {resourceForm.thumbnail && (
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                  <img 
                    src={resourceForm.thumbnail} 
                    alt="Thumbnail preview" 
                    style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${COLORS.gray200}`}} 
                  />
                </div>
              )}
              
              <p style={{fontSize: '12px', color: COLORS.gray400, margin: 0}}>
                Optional: Upload a thumbnail image (Max 2MB). If left empty, a default icon will be shown.
              </p>
            </div>

            <button style={{background: COLORS.sage, color: COLORS.white, border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%'}} onClick={handleAddResource}>
              Save Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

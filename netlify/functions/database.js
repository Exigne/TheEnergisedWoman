const handleAuth = async (e) => {
  e.preventDefault();
  if (!email || !password) {
    setError('Please enter email and password');
    return;
  }
  
  setAuthLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/.netlify/functions/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'auth',
        email: email.trim().toLowerCase(),
        password: password,
        isRegistering: false
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If login fails, try to register automatically (first time)
      if (response.status === 401) {
        console.log('User not found, creating account...');
        
        const registerResponse = await fetch('/.netlify/functions/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auth',
            email: email.trim().toLowerCase(),
            password: password,
            isRegistering: true
          })
        });
        
        const newUser = await registerResponse.json();
        
        if (registerResponse.ok) {
          setUser({...newUser, isAdmin: newUser.is_admin || false});
          setIsAdmin(newUser.is_admin || false);
          localStorage.setItem('wellnessUser', JSON.stringify(newUser));
          showToast('Account created!', 'success');
          setAuthLoading(false);
          return;
        }
      }
      
      throw new Error(data.error || 'Login failed');
    }
    
    // Login success
    const userData = {
      ...data,
      isAdmin: data.is_admin || false
    };
    
    setUser(userData);
    setIsAdmin(userData.isAdmin);
    localStorage.setItem('wellnessUser', JSON.stringify(userData));
    showToast('Welcome back!', 'success');
    
  } catch (err) {
    console.error('Auth error:', err);
    setError(err.message || 'Cannot connect. Please try again.');
  } finally {
    setAuthLoading(false);
  }
};

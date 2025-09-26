import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('typeaware_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    // Mock authentication - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    // Demo users for testing
    if (email === 'admin@typeaware.com' && password === 'admin123') {
      const adminUser = {
        id: '1',
        email: 'admin@typeaware.com',
        name: 'Admin User',
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('typeaware_user', JSON.stringify(adminUser));
      return true;
    } else if (email === 'user@typeaware.com' && password === 'user123') {
      const regularUser = {
        id: '2',
        email: 'user@typeaware.com',
        name: 'Regular User',
        role: 'user'
      };
      setUser(regularUser);
      localStorage.setItem('typeaware_user', JSON.stringify(regularUser));
      return true;
    }

    return false;
  };

  const signup = async (name, email, password) => {
    // Mock signup - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user'
    };

    setUser(newUser);
    localStorage.setItem('typeaware_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('typeaware_user');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

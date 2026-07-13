import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // Hardcoded Demo User for open access mode
  const [user] = useState({ id: 'demo-user', email: 'demo@nutrimind.app' });
  const [session] = useState({ access_token: 'demo-token' });
  const [loading] = useState(false);

  const signup = async () => {};
  const login = async () => {};
  const logout = async () => {};
  const resetPassword = async () => {};

  const value = {
    session,
    user,
    signup,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

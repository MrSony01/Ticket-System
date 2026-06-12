import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('user')    ?? 'null'));
  const [company, setCompany] = useState(() => JSON.parse(localStorage.getItem('company') ?? 'null'));
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));

  function login(userData, jwt, companyData) {
    localStorage.setItem('user',      JSON.stringify(userData));
    localStorage.setItem('company',   JSON.stringify(companyData));
    localStorage.setItem('token',     jwt);
    setUser(userData);
    setCompany(companyData);
    setToken(jwt);
  }

  function updateCompany(partial) {
    setCompany(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('company', JSON.stringify(next));
      return next;
    });
  }

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, company, token, login, logout, updateCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

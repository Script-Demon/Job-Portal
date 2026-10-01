import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api.js';
import { setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const navigate = useNavigate();

  const logout = useCallback(
    (redirect = true) => {
      tokenStore.clear();
      setUser(null);
      if (redirect) navigate('/login');
    },
    [navigate],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (body) => authApi.login(body).then(handleAuth),
      register: (body) => authApi.register(body).then(handleAuth),
      logout,
      setUser,
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, loading, handleAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) =>
  ({ JOB_SEEKER: '/jobs', EMPLOYER: '/employer', ADMIN: '/admin' })[role] || '/';

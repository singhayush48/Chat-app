import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';
import { getErrorMessage } from '@/utils/errorMessage';
import { subscribeUnauthorized } from '@/utils/authEvents';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // isInitializing = the one-time "does a valid session already exist?"
  // check on app load. Distinct from per-action loading states so the
  // whole app doesn't flash a spinner every time you log in.
  const [isInitializing, setIsInitializing] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // silent401: this call is *expected* to 401 for logged-out visitors,
      // so we don't want the global interceptor firing a toast for it.
      const currentUser = await authApi.getMe({ silent401: true });
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function runInitialCheck() {
      await checkAuth();
      if (isMounted) {
        setIsInitializing(false);
      }
    }

    runInitialCheck();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  // If any other request in the app hits a 401 (session expired mid-use),
  // clear local user state so ProtectedRoute redirects to /login.
  useEffect(() => {
    return subscribeUnauthorized(() => setUser(null));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await authApi.login({ email, password });
    // Login response doesn't include the user object, only a message —
    // fetch it separately so the rest of the app has full user data.
    const currentUser = await authApi.getMe();
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (formValues) => {
    // Registration does not log the user in (no cookie is issued), so we
    // deliberately do not setUser() here — the Register page should
    // redirect to /login on success.
    return authApi.register(formValues);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if the network call fails, clear local state so the user
      // isn't stuck "logged in" on a broken connection.
      toast.error(getErrorMessage(error, 'Could not reach the server to log out.'));
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isInitializing,
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

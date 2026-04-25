import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithGoogle, signOutUser, watchAuthState } from '../services/authService';
import { ensureAuthPersistence } from '../services/firebase';
import { ensureBakeryForUser, ensureUserProfile } from '../services/bakeryService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    ensureAuthPersistence().catch((error) => setAuthError(error.message));

    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser);
          await ensureBakeryForUser(firebaseUser);
        } catch (error) {
          setAuthError(error.message);
        }
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      authError,
      signIn: async () => {
        setAuthError('');
        try {
          await signInWithGoogle();
        } catch (error) {
          setAuthError(error.message);
        }
      },
      signOut: signOutUser
    }),
    [authError, initializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

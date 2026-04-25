import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_BAKERY_ID } from '../utils/constants';
import { mapRole, subscribeToBakery, subscribeToRole, subscribeToUser } from '../services/bakeryService';

const BakeryContext = createContext(null);

export function BakeryProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bakery, setBakery] = useState(null);
  const [roleDoc, setRoleDoc] = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setBakery(null);
      return undefined;
    }

    const unsubscribeUser = subscribeToUser(user.uid, setProfile);
    return unsubscribeUser;
  }, [user]);

  useEffect(() => {
    if (!DEFAULT_BAKERY_ID) {
      setBakery(null);
      return undefined;
    }

    return subscribeToBakery(DEFAULT_BAKERY_ID, setBakery);
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setRoleDoc(null);
      return undefined;
    }

    return subscribeToRole(user.email, setRoleDoc);
  }, [user?.email]);

  const value = useMemo(
    () => ({
      profile,
      bakery,
      role: mapRole(roleDoc?.role, user?.email),
      bakeryId: DEFAULT_BAKERY_ID,
      roleDoc
    }),
    [bakery, profile, roleDoc, user?.email]
  );

  return <BakeryContext.Provider value={value}>{children}</BakeryContext.Provider>;
}

export function useBakery() {
  const context = useContext(BakeryContext);
  if (!context) {
    throw new Error('useBakery must be used within BakeryProvider');
  }
  return context;
}

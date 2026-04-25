import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_BAKERY_ID, OWNER_EMAIL } from '../utils/constants';
import { mapRole, subscribeToBakery, subscribeToRole, subscribeToUser } from '../services/bakeryService';

const BakeryContext = createContext(null);

export function BakeryProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bakery, setBakery] = useState(null);
  const [roleDoc, setRoleDoc] = useState(undefined);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setBakery(null);
      setRoleDoc(undefined);
      return undefined;
    }

    const unsubscribeUser = subscribeToUser(user.uid, setProfile);
    return unsubscribeUser;
  }, [user]);

  useEffect(() => {
    if (!DEFAULT_BAKERY_ID || !user) {
      setBakery(null);
      return undefined;
    }

    if (user.email !== OWNER_EMAIL && roleDoc === undefined) {
      return undefined;
    }

    if (user.email !== OWNER_EMAIL && roleDoc === null) {
      setBakery(null);
      return undefined;
    }

    return subscribeToBakery(DEFAULT_BAKERY_ID, setBakery);
  }, [roleDoc, user]);

  useEffect(() => {
    if (!user?.email) {
      setRoleDoc(undefined);
      return undefined;
    }

    setRoleDoc(undefined);
    return subscribeToRole(user.email, setRoleDoc);
  }, [user?.email]);

  const resolvedRole = mapRole(roleDoc?.role, user?.email);
  const roleLoading = Boolean(user?.email) && user?.email !== OWNER_EMAIL && roleDoc === undefined;
  const hasBusinessAccess = resolvedRole === 'owner' || Boolean(resolvedRole);

  const value = useMemo(
    () => ({
      profile,
      bakery,
      role: resolvedRole,
      roleLoading,
      hasBusinessAccess,
      bakeryId: DEFAULT_BAKERY_ID,
      roleDoc
    }),
    [bakery, hasBusinessAccess, profile, resolvedRole, roleDoc, roleLoading]
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

import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BRAND_NAME, DEFAULT_BAKERY_ID, OWNER_EMAIL } from '../utils/constants';

export function mapRole(role, email) {
  if (email === OWNER_EMAIL) {
    return 'owner';
  }

  if (!role) {
    return null;
  }

  if (role === 'coowner') {
    return 'co-owner';
  }

  if (role === 'admin') {
    return 'co-owner';
  }

  return role;
}

export async function ensureUserProfile(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const payload = {
    displayName: firebaseUser.displayName ?? 'Baker',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL ?? '',
    lastSeenAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      ...payload,
      activeBakeryId: DEFAULT_BAKERY_ID,
      createdAt: serverTimestamp()
    });
  } else {
    await updateDoc(userRef, {
      ...payload,
      activeBakeryId: DEFAULT_BAKERY_ID
    });
  }

  return userRef;
}

export async function ensureBakeryForUser(firebaseUser) {
  if (firebaseUser.email === OWNER_EMAIL) {
    const bakeryRef = doc(collection(db, 'bakeries'), DEFAULT_BAKERY_ID);
    await setDoc(
      bakeryRef,
      {
        name: BRAND_NAME,
        createdBy: OWNER_EMAIL,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  await updateDoc(doc(db, 'users', firebaseUser.uid), {
    activeBakeryId: DEFAULT_BAKERY_ID
  });

  return DEFAULT_BAKERY_ID;
}

export function subscribeToUser(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToBakery(bakeryId, callback) {
  if (!bakeryId) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, 'bakeries', bakeryId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToRole(email, callback) {
  if (!email) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, 'roles', email), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToRoles(callback) {
  return onSnapshot(collection(db, 'roles'), (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function updateBakeryMembers({ userEmail, role }) {
  const normalizedRole = role === 'co-owner' ? 'coowner' : role;
  await setDoc(
    doc(db, 'roles', userEmail),
    {
      role: normalizedRole,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function removeBakeryMember(userEmail) {
  await deleteDoc(doc(db, 'roles', userEmail));
}

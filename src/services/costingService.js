import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

export function subscribeToRecentCostings(bakeryId, callback) {
  if (!bakeryId) {
    callback([]);
    return () => {};
  }

  const costingsQuery = query(collection(db, 'costings'), where('bakeryId', '==', bakeryId));
  return onSnapshot(costingsQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        .slice(0, 8)
    );
  });
}

export async function saveCosting({
  bakeryId,
  recipeId,
  recipeName,
  recipeSource,
  totals,
  extraCosts,
  sellingPrice,
  desiredMargin,
  userId
}) {
  if (!bakeryId || !recipeId) {
    return;
  }

  await setDoc(
    doc(db, 'costings', `${bakeryId}_${recipeId}`),
    {
      bakeryId,
      recipeId,
      recipeName,
      recipeSource,
      totals,
      extraCosts,
      sellingPrice,
      desiredMargin,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

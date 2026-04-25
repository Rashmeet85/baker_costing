import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { makeIngredientKey } from '../utils/recipe';

export function subscribeToIngredientLibrary({ bakeryId, userId }, callback) {
  if (!bakeryId || !userId) {
    callback([]);
    return () => {};
  }

  const ingredientsQuery = query(
    collection(db, 'ingredients'),
    where('bakeryId', '==', bakeryId),
    where('userId', '==', userId)
  );
  return onSnapshot(ingredientsQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  });
}

export async function upsertIngredientPrice({
  bakeryId,
  userId,
  name,
  purchaseUnit,
  purchaseQuantity,
  purchasePrice,
  sourcePrice,
  previousPrice
}) {
  const key = makeIngredientKey(name);
  const ingredientRef = doc(db, 'ingredients', `${userId}_${key}`);
  const nextPrice = Number(purchasePrice || 0);

  await setDoc(
    ingredientRef,
    {
      bakeryId,
      userId,
      key,
      name,
      purchaseUnit,
      purchaseQuantity: Number(purchaseQuantity || 0),
      purchasePrice: nextPrice,
      pricePerBaseUnit:
        Number(purchaseQuantity || 0) > 0 ? nextPrice / Number(purchaseQuantity || 1) : 0,
      previousPrice: Number(previousPrice ?? sourcePrice ?? 0),
      hasPriceChange: sourcePrice != null && Number(sourcePrice) !== nextPrice,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export function getIngredientMemoryByName(ingredients, name) {
  const key = makeIngredientKey(name);
  return ingredients.find((ingredient) => ingredient.key === key || makeIngredientKey(ingredient.name) === key) || null;
}

export async function deleteIngredient(ingredientId) {
  await deleteDoc(doc(db, 'ingredients', ingredientId));
}

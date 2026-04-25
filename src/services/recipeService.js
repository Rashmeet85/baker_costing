import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeRecipe } from '../utils/recipe';

export function subscribeToRecipe(recipeId, callback) {
  if (!recipeId) {
    callback(null);
    return () => {};
  }

  callback(null);
  const unsubscribeImported = onSnapshot(doc(db, 'recipes', recipeId), (snapshot) => {
    if (snapshot.exists()) {
      callback(normalizeRecipe(snapshot.id, { ...snapshot.data(), source: 'recipe-app' }));
    }
  });

  const unsubscribeCustom = onSnapshot(doc(db, 'costingRecipes', recipeId), (snapshot) => {
    if (snapshot.exists()) {
      callback(normalizeRecipe(snapshot.id, snapshot.data()));
    }
  });

  return () => {
    unsubscribeImported();
    unsubscribeCustom();
  };
}

export async function fetchRecipeOptions({ bakeryId, userId }) {
  const recipesRef = collection(db, 'recipes');
  const customRecipesRef = collection(db, 'costingRecipes');
  const queries = [
    bakeryId
      ? query(recipesRef, where('bakeryId', '==', bakeryId), limit(30))
      : null,
    userId
      ? query(recipesRef, where('createdBy', '==', userId), orderBy('updatedAt', 'desc'), limit(30))
      : null,
    bakeryId
      ? query(customRecipesRef, where('bakeryId', '==', bakeryId), limit(30))
      : null
  ].filter(Boolean);

  const maps = new Map();
  for (const q of queries) {
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((item) => {
      maps.set(item.id, normalizeRecipe(item.id, item.data()));
    });
  }

  return [...maps.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function subscribeToRecipeOptions({ bakeryId, userId }, callback) {
  const unsubs = [];
  const recipesMap = new Map();

  function emit() {
    callback([...recipesMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }

  unsubs.push(
    onSnapshot(collection(db, 'recipes'), (snapshot) => {
      snapshot.docs.forEach((item) => {
        recipesMap.set(item.id, normalizeRecipe(item.id, { ...item.data(), source: 'recipe-app' }));
      });
      emit();
    })
  );

  if (bakeryId) {
    unsubs.push(
      onSnapshot(query(collection(db, 'costingRecipes'), where('bakeryId', '==', bakeryId)), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            recipesMap.delete(change.doc.id);
            return;
          }
          recipesMap.set(change.doc.id, normalizeRecipe(change.doc.id, change.doc.data()));
        });
        emit();
      })
    );
  }

  if (userId) {
    unsubs.push(
      onSnapshot(query(collection(db, 'costingRecipes'), where('createdBy', '==', userId)), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            recipesMap.delete(change.doc.id);
            return;
          }
          recipesMap.set(change.doc.id, normalizeRecipe(change.doc.id, change.doc.data()));
        });
        emit();
      })
    );
  }

  return () => {
    unsubs.forEach((unsubscribe) => unsubscribe());
  };
}

export function subscribeToCustomRecipes(bakeryId, callback) {
  if (!bakeryId) {
    callback([]);
    return () => {};
  }

  return onSnapshot(query(collection(db, 'costingRecipes'), where('bakeryId', '==', bakeryId)), (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => normalizeRecipe(item.id, item.data()))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  });
}

export async function saveCustomRecipe({ bakeryId, userId, recipe }) {
  const recipeRef = recipe.id ? doc(db, 'costingRecipes', recipe.id) : doc(collection(db, 'costingRecipes'));
  await setDoc(
    recipeRef,
    {
      bakeryId,
      createdBy: userId,
      source: 'costing-app',
      name: recipe.name,
      yieldQuantity: Number(recipe.yieldQuantity || 1),
      yieldUnit: recipe.yieldUnit || 'unit',
      ingredients: (recipe.ingredients || []).map((ingredient) => ({
        name: ingredient.name,
        quantity: Number(ingredient.quantity || 0),
        unit: ingredient.unit || 'g'
      })),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return recipeRef.id;
}

export async function deleteCustomRecipe(recipeId) {
  return deleteDoc(doc(db, 'costingRecipes', recipeId));
}

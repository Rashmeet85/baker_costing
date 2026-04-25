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
import { formatDateKey } from '../utils/date';

export function subscribeToSalesByDay(bakeryId, selectedDate, callback) {
  if (!bakeryId || !selectedDate) {
    callback([]);
    return () => {};
  }

  const key = formatDateKey(selectedDate);
  const salesQuery = query(collection(db, 'sales'), where('bakeryId', '==', bakeryId), where('dateKey', '==', key));

  return onSnapshot(salesQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
    );
  });
}

export function subscribeToSalesRange(bakeryId, callback) {
  if (!bakeryId) {
    callback([]);
    return () => {};
  }

  const salesQuery = query(collection(db, 'sales'), where('bakeryId', '==', bakeryId));
  return onSnapshot(salesQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function saveSale(sale) {
  const saleRef = sale.id ? doc(db, 'sales', sale.id) : doc(collection(db, 'sales'));
  await setDoc(
    saleRef,
    {
      ...sale,
      quantity: Number(sale.quantity || 0),
      revenue: Number(sale.revenue || 0),
      cost: Number(sale.cost || 0),
      profit: Number(sale.profit || 0),
      dateKey: sale.dateKey,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return saleRef.id;
}

// frontend/src/hooks/useTransactions.js
import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Query the 'transactions' sub-collection, ordered by date
    const q = query(
      collection(db, "users", userId, "transactions"),
      orderBy("date", "desc")
    );

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date
        date: doc.data().date?.toDate() 
      }));
      setTransactions(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { transactions, loading };
}
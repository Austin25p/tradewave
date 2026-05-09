import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Trade, DailySentiment } from './types';
import { onAuthStateChanged } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestore() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [sentiments, setSentiments] = useState<Record<string, DailySentiment>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeTrades: () => void;
    let unsubscribeSentiments: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        const tradesRef = collection(db, `users/${user.uid}/trades`);
        unsubscribeTrades = onSnapshot(query(tradesRef), (snapshot) => {
          const fetchedTrades: Trade[] = [];
          snapshot.forEach((d) => {
            fetchedTrades.push({ id: d.id, ...d.data() } as Trade);
          });
          setTrades(fetchedTrades);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/trades`);
        });

        const sentimentsRef = collection(db, `users/${user.uid}/sentiments`);
        unsubscribeSentiments = onSnapshot(query(sentimentsRef), (snapshot) => {
          const fetchedSentiments: Record<string, DailySentiment> = {};
          snapshot.forEach((d) => {
            const data = d.data() as DailySentiment;
            fetchedSentiments[data.date] = data;
          });
          setSentiments(fetchedSentiments);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/sentiments`);
        });
      } else {
        setTrades([]);
        setSentiments({});
        setLoading(false);
        if (unsubscribeTrades) unsubscribeTrades();
        if (unsubscribeSentiments) unsubscribeSentiments();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTrades) unsubscribeTrades();
      if (unsubscribeSentiments) unsubscribeSentiments();
    };
  }, []);

  const addTrade = async (trade: Trade) => {
    if (!auth.currentUser) return;
    try {
      const tradeRef = doc(db, `users/${auth.currentUser.uid}/trades`, trade.id);
      await setDoc(tradeRef, {
        ...trade,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/trades`);
    }
  };

  const updateTrade = async (trade: Trade) => {
    if (!auth.currentUser) return;
    try {
      const tradeRef = doc(db, `users/${auth.currentUser.uid}/trades`, trade.id);
      const { id, userId, createdAt, ...updateData } = trade as any;
      await updateDoc(tradeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/trades`);
    }
  };

  const deleteTrade = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const tradeRef = doc(db, `users/${auth.currentUser.uid}/trades`, id);
      await deleteDoc(tradeRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/trades`);
    }
  };

  const addSentiment = async (sentiment: DailySentiment) => {
    if (!auth.currentUser) return;
    // Generate an ID for sentiment, e.g. date string
    try {
      const sentimentRef = doc(db, `users/${auth.currentUser.uid}/sentiments`, sentiment.date);
      await setDoc(sentimentRef, {
        ...sentiment,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/sentiments`);
    }
  };

  return {
    trades,
    sentiments,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    addSentiment
  };
}

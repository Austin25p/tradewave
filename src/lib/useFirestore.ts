import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Trade, DailySentiment, Task } from './types';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [smcSettings, setSmcSettings] = useState<{ activeAsset: string, activeTimeframe: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeTrades: () => void;
    let unsubscribeSentiments: () => void;
    let unsubscribeTasks: () => void;
    let unsubscribeSmc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        let fetchesComplete = 0;
        const checkReady = () => {
          fetchesComplete++;
          if (fetchesComplete >= 4) setLoading(false);
        };

        const smcRef = doc(db, `users/${user.uid}/smc_settings/default`);
        unsubscribeSmc = onSnapshot(smcRef, (snapshot) => {
          if (snapshot.exists()) {
            setSmcSettings({
               activeAsset: snapshot.data().activeAsset,
               activeTimeframe: snapshot.data().activeTimeframe
            });
          }
          checkReady();
        }, (error) => {
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/smc_settings/default`);
        });

        const tradesRef = collection(db, `users/${user.uid}/trades`);
        unsubscribeTrades = onSnapshot(query(tradesRef, where('userId', '==', user.uid)), (snapshot) => {
          const fetchedTrades: Trade[] = [];
          snapshot.forEach((d) => {
            fetchedTrades.push({ id: d.id, ...d.data() } as Trade);
          });
          setTrades(fetchedTrades);
          checkReady();
        }, (error) => {
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/trades`);
        });

        const sentimentsRef = collection(db, `users/${user.uid}/sentiments`);
        unsubscribeSentiments = onSnapshot(query(sentimentsRef, where('userId', '==', user.uid)), (snapshot) => {
          const fetchedSentiments: Record<string, DailySentiment> = {};
          snapshot.forEach((d) => {
            const data = d.data() as DailySentiment;
            fetchedSentiments[data.date] = data;
          });
          setSentiments(fetchedSentiments);
          checkReady();
        }, (error) => {
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/sentiments`);
        });
          
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        unsubscribeTasks = onSnapshot(query(tasksRef, where('userId', '==', user.uid)), (taskSnapshot) => {
          const fetchedTasks: Task[] = [];
          taskSnapshot.forEach((d) => {
             fetchedTasks.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate()?.toISOString() } as unknown as Task);
          });
          setTasks(fetchedTasks);
          checkReady();
        }, (error) => {
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/tasks`);
        });

      } else {
        setTrades([]);
        setSentiments({});
        setTasks([]);
        setSmcSettings(null);
        setLoading(false);
        if (unsubscribeTrades) unsubscribeTrades();
        if (unsubscribeSentiments) unsubscribeSentiments();
        if (unsubscribeTasks) unsubscribeTasks();
        if (unsubscribeSmc) unsubscribeSmc();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTrades) unsubscribeTrades();
      if (unsubscribeSentiments) unsubscribeSentiments();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeSmc) unsubscribeSmc();
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
        updatedAt: serverTimestamp(),
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
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/sentiments`);
    }
  };

  const addTask = async (task: Task) => {
    if (!auth.currentUser) return;
    try {
      const { id, createdAt, ...data } = task;
      const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks`, id);
      await setDoc(taskRef, {
        ...data,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/tasks`);
    }
  };

  const updateTask = async (task: Task) => {
    if (!auth.currentUser) return;
    try {
      const { id, userId, createdAt, ...updateData } = task as any;
      const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks`, id);
      await updateDoc(taskRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/tasks`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks`, id);
      await deleteDoc(taskRef);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/tasks`);
    }
  };

  const updateSmcSettings = async (activeAsset: string, activeTimeframe: string) => {
    if (!auth.currentUser) return;
    try {
      const smcRef = doc(db, `users/${auth.currentUser.uid}/smc_settings/default`);
      
      const docSnap = await getDoc(smcRef);
      if (docSnap.exists()) {
        await updateDoc(smcRef, {
          activeAsset,
          activeTimeframe,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(smcRef, {
          userId: auth.currentUser.uid,
          activeAsset,
          activeTimeframe,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/smc_settings/default`);
    }
  };

  return {
    trades,
    sentiments,
    tasks,
    smcSettings,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    addSentiment,
    addTask,
    updateTask,
    deleteTask,
    updateSmcSettings
  };
}

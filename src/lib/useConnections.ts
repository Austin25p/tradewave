import { useState, useEffect, useCallback } from 'react';

export interface BrokerConnection {
  id: string;
  platformId: string;
  serverName: string;
  accountId: string;
  status: 'connected' | 'syncing' | 'error';
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  connectedAt: string;
}

export interface SyncEngine {
  id: string;
  masterAccountId: string;
  slaves: { id: string; name: string; allocation: string }[];
  status: 'active' | 'paused';
}

export function useConnections() {
  const [brokers, setBrokers] = useState<BrokerConnection[]>([]);
  const [syncEngines, setSyncEngines] = useState<SyncEngine[]>([]);

  const loadFromStorage = useCallback(() => {
    const savedBrokers = localStorage.getItem('__tr_brokers');
    const savedEngines = localStorage.getItem('__tr_engines');
    if (savedBrokers) setBrokers(JSON.parse(savedBrokers));
    if (savedEngines) setSyncEngines(JSON.parse(savedEngines));
  }, []);

  useEffect(() => {
    loadFromStorage();
    const handleUpdate = () => loadFromStorage();
    window.addEventListener('__tr_update', handleUpdate);
    return () => window.removeEventListener('__tr_update', handleUpdate);
  }, [loadFromStorage]);

  const addBroker = (b: BrokerConnection) => {
    const saved = localStorage.getItem('__tr_brokers');
    const current = saved ? JSON.parse(saved) : [];
    const next = [...current, b];
    localStorage.setItem('__tr_brokers', JSON.stringify(next));
    window.dispatchEvent(new Event('__tr_update'));
  };
  
  const removeBroker = (id: string) => {
    const saved = localStorage.getItem('__tr_brokers');
    const current = saved ? JSON.parse(saved) : [];
    const next = current.filter((x: BrokerConnection) => x.id !== id);
    localStorage.setItem('__tr_brokers', JSON.stringify(next));
    window.dispatchEvent(new Event('__tr_update'));
  };

  const addSyncEngine = (e: SyncEngine) => {
    const saved = localStorage.getItem('__tr_engines');
    const current = saved ? JSON.parse(saved) : [];
    const next = [...current, e];
    localStorage.setItem('__tr_engines', JSON.stringify(next));
    window.dispatchEvent(new Event('__tr_update'));
  };
  
  const removeSyncEngine = (id: string) => {
    const saved = localStorage.getItem('__tr_engines');
    const current = saved ? JSON.parse(saved) : [];
    const next = current.filter((x: SyncEngine) => x.id !== id);
    localStorage.setItem('__tr_engines', JSON.stringify(next));
    window.dispatchEvent(new Event('__tr_update'));
  };

  const toggleSyncEngine = (id: string) => {
    const saved = localStorage.getItem('__tr_engines');
    const current = saved ? JSON.parse(saved) : [];
    const next = current.map((x: SyncEngine) => x.id === id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' as any } : x);
    localStorage.setItem('__tr_engines', JSON.stringify(next));
    window.dispatchEvent(new Event('__tr_update'));
  }

  return { brokers, addBroker, removeBroker, syncEngines, addSyncEngine, removeSyncEngine, toggleSyncEngine };
}

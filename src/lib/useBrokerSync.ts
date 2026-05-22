import { useEffect, useState } from 'react';

export interface BrokerData {
  balance: number;
  margin: number;
  equity: number;
  timestamp: number;
}

export function useBrokerSync(isConnected: boolean) {
  const [data, setData] = useState<BrokerData | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!isConnected) return;

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When running in dev, port is always 3000
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'live_update') {
          setData(payload.data);
        }
      } catch(e) {}
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };
    
    ws.onerror = () => {
      setStatus('disconnected');
    }

    return () => {
      ws.close();
    };
  }, [isConnected]);

  return { data, status };
}

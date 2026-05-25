import { useEffect, useState, useRef } from 'react';

export interface BrokerData {
  balance: number;
  margin: number;
  equity: number;
  timestamp: number;
}

export function useBrokerSync(isConnected: boolean) {
  const [data, setData] = useState<BrokerData | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setStatus('disconnected');
      return;
    }

    let isMounted = true;
    let ws: WebSocket | null = null;
    let reconnectDelay = 1000;

    const connect = () => {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
      ws = new WebSocket(`${protocol}//${host}`);

      ws.onopen = () => {
        if (!isMounted) return;
        setStatus('connected');
        reconnectDelay = 1000; // Reset delay on successful connection
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'live_update') {
            setData(payload.data);
          }
        } catch(e) {}
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setStatus('disconnected');
        // Auto-reconnect mechanism with exponential backoff
        reconnectTimeoutRef.current = setTimeout(connect, Math.min(reconnectDelay, 15000));
        reconnectDelay *= 1.5;
      };
      
      ws.onerror = () => {
        if (!isMounted) return;
        setStatus('disconnected');
        ws?.close(); // Ensure close event is fired
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [isConnected]);

  return { data, status };
}

import { useState, useMemo, useCallback } from 'react';
import { LoadBalancer, RoundRobinStrategy, ServerConfig, LoadBalancerResponse } from '@pkg/load-balancer';

const SERVERS: ServerConfig[] = [
  { id: 'server1', url: 'http://localhost:4000/server1' },
  { id: 'server2', url: 'http://localhost:4000/server2' },
  { id: 'server3', url: 'http://localhost:4000/server3' }
];

export function useLoadBalancer() {
  const [logs, setLogs] = useState<(LoadBalancerResponse & { id: string })[]>([]);
  const [, setTick] = useState(0);

  const lb = useMemo(() => {
    // 1. Create a "dummy" strategy or just pass the metrics manually
    // We'll create the LB first
    const instance = new LoadBalancer(SERVERS, null as any);
    
    // 2. Now create the strategy, passing the newly created metrics
    const strategy = new RoundRobinStrategy(instance.metrics);
    
    // 3. Inject it back into the instance
    instance.setStrategy(strategy);
    
    return instance;
  }, []);

  const sendRequest = useCallback(async () => {
    try {
      const result = await lb.request();
      // Ensure we use the success status from the response
      setLogs(prev => [{ ...result, id: crypto.randomUUID() }, ...prev].slice(0, 10));
    } catch (err) {
      console.error("LB Request Error:", err);
    } finally {
      setTick(t => t + 1); 
    }
  }, [lb]);

  return { sendRequest, logs, lb };
}
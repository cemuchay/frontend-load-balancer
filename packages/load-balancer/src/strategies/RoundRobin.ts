import { IStrategy, ServerConfig } from '../types';
import { MetricsTracker } from '../Metrics';

export class RoundRobinStrategy implements IStrategy {
  name = 'Round Robin';
  private index = 0;
  private metrics: MetricsTracker;

  constructor(metrics: MetricsTracker) {
    this.metrics = metrics;
  }

  pick(servers: ServerConfig[]): ServerConfig {
    // 1. Filter for healthy servers
    const available = servers.filter(s => this.metrics.isAvailable(s.id));
    
    // 2. Fallback: If everything is "tripped", use all servers 
    // (Prevents the "returns nothing" error)
    const targets = available.length > 0 ? available : servers;

    // 3. Ensure index stays within bounds of the current target list
    const server = targets[this.index % targets.length];
    
    // 4. Increment for next time
    this.index = (this.index + 1) % 1000; // Keep it from growing to infinity
    
    return server;
  }

  onSuccess() {}
  onFailure() {}
}
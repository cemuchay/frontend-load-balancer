import { IStrategy, ServerConfig } from '../types';
import { MetricsTracker } from '../Metrics';

export class LeastLatencyStrategy implements IStrategy {
  name = 'Least Latency';
  private metrics: MetricsTracker; // 1. Define property

  // 2. Accept metrics in constructor
  constructor(metrics: MetricsTracker) {
    this.metrics = metrics;
  }

  pick(servers: ServerConfig[]): ServerConfig {
    const stats = this.metrics.getSnapshot();

    return servers.reduce((best, current) => {
      const bestStat = stats[best.id];
      const currentStat = stats[current.id];

      // Prioritize "cold" servers that haven't been tested yet
      if (!currentStat || currentStat.requests === 0) return current;
      if (!bestStat || bestStat.requests === 0) return best;

      // Pick the one with the lower average latency
      return currentStat.avgLatency < bestStat.avgLatency ? current : best;
    });
  }

  onSuccess() {}
  onFailure() {}
}
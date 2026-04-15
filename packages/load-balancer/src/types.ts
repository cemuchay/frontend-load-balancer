export type ServerId = "server1" | "server2" | "server3";

export interface ServerConfig {
   id: ServerId;
   url: string;
}

export interface HealthMetrics {
   requests: number;
   failures: number;
   avgLatency: number;
   lastActive: number;
   consecutiveFailures: number;
}

export interface LoadBalancerResponse {
   server: ServerId;
   success: boolean;
   delay: number;
   totalTime: number;
}

export interface IStrategy {
  name: string;
  
  /** * The core logic: which server do we hit next? 
   */
  pick: (servers: ServerConfig[]) => ServerConfig;

  /** * Called when a request finishes successfully. 
   * Useful for tracking average latency or success streaks.
   */
  onSuccess: (serverId: string, latency: number) => void;

  /** * Called when a fetch fails or returns a 5xx. 
   * Useful for Circuit Breakers or Failover logic.
   */
  onFailure: (serverId: string) => void;

  /** * Optional: Reset internal counters if the strategy is swapped.
   */
  reset?: () => void;
}

export interface Server {
  id: string;
  url: string;
}



export interface Strategy {
  pick: (servers: Server[]) => Server;
  onSuccess: (server: Server, latency: number) => void;
  onFailure: (server: Server) => void;
}
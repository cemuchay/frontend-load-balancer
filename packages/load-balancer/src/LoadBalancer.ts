import { MetricsTracker } from "./Metrics";
import { ServerConfig, IStrategy, LoadBalancerResponse } from "./types";

export class LoadBalancer {
   private servers: ServerConfig[];
   private strategy: IStrategy;
   public metrics: MetricsTracker;

   constructor(servers: ServerConfig[], strategy: IStrategy) {
      this.servers = servers;
      this.strategy = strategy;
      this.metrics = new MetricsTracker();
   }

   async request(): Promise<LoadBalancerResponse> {
      const server = this.strategy.pick(this.servers);
      const start = performance.now();

      try {
         const response = await fetch(server.url);

         const data = await response.json();
         const totalTime = performance.now() - start;

         // 🛑 Check if the HTTP status is actually 2xx
         const isSuccess = response.ok;

         this.metrics.record(server.id, totalTime, isSuccess);

         if (isSuccess) {
            this.strategy.onSuccess(server.id, totalTime);
         } else {
            this.strategy.onFailure(server.id);
         }

         return { ...data, totalTime, success: isSuccess };
      } catch (error) {
         this.metrics.record(server.id, 0, false);
         this.strategy.onFailure(server.id);
         throw error;
      }
   }

   setStrategy(strategy: IStrategy) {
      this.strategy = strategy;
   }
}

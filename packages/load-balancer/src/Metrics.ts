import { ServerId, HealthMetrics } from "./types";

export class MetricsTracker {
   private stats = new Map<ServerId, HealthMetrics>();

   private getOrCreate(id: ServerId): HealthMetrics {
      if (!this.stats.has(id)) {
         this.stats.set(id, {
            requests: 0,
            failures: 0,
            avgLatency: 0,
            lastActive: Date.now(),
            consecutiveFailures: 0,
         });
      }
      return this.stats.get(id)!;
   }

   record(id: ServerId, latency: number, success: boolean) {
      const s = this.getOrCreate(id);
      s.requests++;

      if (!success) {
         s.consecutiveFailures++;
      } else {
         s.consecutiveFailures = 0; // Reset on success
      }

      if (success) {
         // Only update latency average for successful calls
         const successfulRequests = s.requests - s.failures;
         s.avgLatency =
            (s.avgLatency * (successfulRequests - 1) + latency) /
            successfulRequests;
      } else {
         s.failures++;
      }

      s.lastActive = Date.now();
   }

   isAvailable(id: ServerId): boolean {
      const s = this.getOrCreate(id);

      // If it's healthy, it's available
      if (s.consecutiveFailures < 3) return true;

      // If it's been "dead" for more than 10 seconds, give it a chance (Half-Open)
      const downtime = Date.now() - s.lastActive;
      if (downtime > 10000) {
         // Reset failures partially to allow a trial request
         s.consecutiveFailures = 2;
         return true;
      }

      return false;
   }

   getSnapshot() {
      return Object.fromEntries(this.stats);
   }
}

import express, { Response } from "express";
import cors from "cors";
import { LoadBalancerResponse, ServerId } from "@pkg/load-balancer";

const app = express();
app.use(cors());

/**
 * Helper to simulate network conditions
 */
const simulateServer = async (
   res: Response,
   id: ServerId,
   failRate: number,
   maxDelay: number
) => {
   const delay = Math.floor(Math.random() * maxDelay);
   await new Promise((resolve) => setTimeout(resolve, delay));

   const isFailure = Math.random() < failRate;

   const payload: Partial<LoadBalancerResponse> = {
      server: id,
      success: !isFailure,
      delay: delay,
   };

   if (isFailure) {
      return res.status(500).json(payload);
   }

   res.json(payload);
};

app.head("/server1", (req, res) => res.sendStatus(200));

// Server 1: The Speedster (Fast but flaky)
app.get("/server1", (req, res) => simulateServer(res, "server1", 0.3, 150));

// Server 2: The Tank (Slow but extremely reliable)
app.get("/server2", (req, res) => simulateServer(res, "server2", 0.05, 800));

// Server 3: The Wildcard (Average speed, random failures)
app.get("/server3", (req, res) => simulateServer(res, "server3", 0.15, 400));

const PORT = process.env.PORT || 4000;

app.listen(PORT as number, "0.0.0.0", () => {
   console.log(`Backend simulation running on port ${PORT}`);
});

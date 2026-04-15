# ⚖️ Distributed Load Balancer & Traffic Monitor

A full-stack, TypeScript-powered Load Balancer simulation built within a Monorepo architecture. This project demonstrates core System Design principles including **Strategy Patterns**, **Circuit Breaking**, and **Real-time Observability**.

## 🚀 Overview

This system simulates a Load Balancer distributing traffic across a fleet of backend servers. One server is intentionally "flaky" (Server 1), allowing you to observe how the Load Balancer handles failure and recovers using automated logic.

### Key Features
- **Monorepo Architecture**: Clean separation between the `LoadBalancer` engine, the `Frontend` dashboard, and the `Backend` simulation.
- **Dynamic Strategies**: Switch in real-time between **Round Robin** (fairness) and **Least Latency** (performance).
- **Circuit Breaker Pattern**: Automatically isolates unhealthy servers after 3 consecutive failures to prevent cascading errors.
- **Decision Feed**: A live "System Decisions" log that explains the logic behind every routing choice.
- **Chaos Simulation**: Backend servers simulate varying latencies and failure rates.


## 📸 Screenshots

### 🖥️ Control Plane
![Dashboard Overview](/public/images/screenshot2.png)
*The main dashboard showing real-time success rates, latencies, and the active Circuit Breaker on Server 1.*

### 🧠 System Intelligence
![Dashboard Overview](/public/images/screenshot1.png)
> **"Routing to Server 1 because Servers 2 & 3 are slow (566ms & 362ms avg respectively)"**
*The System Decisions feed provides transparency into the Least Latency algorithm.*

---

## 🏗️ Architecture

### Project Structure

```
├── apps
│   ├── frontend/          # React + Vite (Dashboard UI)
│   └── backend/           # Node + Express (Mock Servers)
├── packages
│   └── load-balancer/     # Core LB Engine (Shared Package)
```


### The Request Flow
1. **Frontend** initiates a request via the `LoadBalancer` package.
2. **Strategy** (Round Robin or Least Latency) picks a server based on current metrics.
3. **Circuit Breaker** checks if the selected server is healthy.
4. **Metrics Engine** records the result (latency/success) to inform future decisions.


## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm (v7+ for workspaces)

### 1. Install Dependencies
Run from the root directory:

`npm install`

### 2. Build the Shared Package

`npm run build -w @pkg/load-balancer`

### 3. Start the Workspace
This will launch the backend servers and the frontend dashboard simultaneously:

`npm run dev`


## 🧠 System Design Deep Dive

### Circuit Breaker Implementation
The system implements a **Tripped State**. If a server fails 3 times in a row, it is marked as `UNAVAILABLE`. The Load Balancer will skip this server for 10 seconds before attempting a "Half-Open" trial request to see if it has recovered.

### Strategy Pattern
By decoupling the routing logic into a `Strategy` interface, the system can be extended with new algorithms (like *Least Connections* or *Weighted Round Robin*) without modifying the core Load Balancer class.

```
interface IStrategy {
  pick(servers: ServerConfig[]): ServerConfig;
  onSuccess(id: string, latency: number): void;
  onFailure(id: string): void;
  }
  ```

---

## 🧪 Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, tsx
- **Shared**: TypeScript (CommonJS/ESM hybrid)
- **Monorepo**: npm Workspaces


### Final Deployment Checklist
1. **GitHub**: Create a new repo and push this entire folder structure.
2. **Environment**: If you deploy, ensure you update the `BASE_URL` in `apps/frontend/src/hooks/useLoadBalancer.ts` to point to your hosted backend.
3. **Demo**: When demoing, start with **Round Robin** to show Server 1 failing, then switch to **Least Latency** to show the system automatically avoiding the slow/failing servers.

**Version 1.0 complete.**
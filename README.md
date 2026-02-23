# High-Scale Task Management System

A robust, scalable backend system for managing tasks, designed to handle high concurrency and throughput using an Event-Driven Architecture.

## 🚀 Tech Stack

- **Runtime:** Node.js v20
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Message Queues:**
  - **Kafka:** High-throughput stream processing (Ingestion -> Processing)
  - **RabbitMQ:** Reliable background task processing (Notifications)
- **Caching & Rate Limiting:** Redis
- **Containerization:** Docker & Docker Compose

## 📂 Project Structure

```
demo-big-proj/
├── app/
│   ├── src/
│   │   ├── consumers/       # Kafka consumers (Ingest, Created)
│   │   ├── middlewares/     # Express middlewares (Auth, RateLimiter)
│   │   ├── modules/         # Feature modules (Auth, Task)
│   │   ├── routes/          # Health/System routes
│   │   ├── workers/         # Background workers (RabbitMQ)
│   │   ├── kafka.ts         # Kafka configuration & Admin init
│   │   └── server.ts        # Application entry point
│   ├── get-token.js         # Helper: Get fresh JWT token
│   ├── load-test.js         # Helper: High-concurrency load test
│   ├── package.json         # Dependencies
│   └── prisma/              # Database schema
├── docker-compose.yml       # Production-ready Full Stack (App + Infra)
└── docker-compose-old.yml   # Infrastructure Only (Redis, Kafka, Postgres, RabbitMQ)
```

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose
- [npm](https://www.npmjs.com/)

---

## 🏃‍♂️ How to Run

You have two ways to run this project: **Full Docker Mode** (easiest) or **Local Development Mode** (best for coding).

### Option A: Full Docker Mode (Recommended)
Runs the entire system (API, Consumers, Workers, Database, Queues) inside Docker containers. **Everything is automated**, including database schema creation and Kafka topic initialization.

1. **Start the System**:
   ```bash
   docker-compose up -d --build
   ```
   *This command:*
   *   Starts Postgres, Redis, Kafka, and RabbitMQ.
   *   Builds the Node.js application images.
   *   **Automatically runs `npx prisma db push`** to sync the database schema.
   *   **Automatically initializes Kafka topics** (`task.ingested`, `task.created`) on startup.
   *   Starts the API Server, Ingest Consumer, Created Consumer, and Notification Worker.

2. **Access the API**:
   The API is available at: `http://localhost:3000`

3. **Stop**:
   ```bash
   docker-compose down
   ```

### Option B: Local Development Mode
Runs the infrastructure (DB, Queues) in Docker, but runs the Node.js application code directly on your machine for hot-reloading.

1. **Start Infrastructure**:
   ```bash
   docker compose -f docker-compose-old.yml up -d
   ```

2. **Setup Environment Variables**:
   Create a `.env` file in the `app` directory:
   ```bash
   cd app
   cp .env.example .env  # Or create one manually
   ```
   **Required `.env` content for local dev:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5434/demo_task_db?schema=public"
   REDIS_URL="redis://localhost:6379"
   KAFKA_BROKERS="localhost:9092"
   RABBITMQ_URL="amqp://guest:guest@localhost:5672"
   JWT_SECRET="your_super_secret_key"
   ```
   npm install
   ```

4. **Generate and Sync Database Schema**:
   Since the app is running locally, you must manually push the schema to the Dockerized Postgres:
   ```bash
   npx prisma generate
   npx prisma db push
   

5. **Run the Application**:
   ```bash
   npm run dev:all
   ```
   *This uses `concurrently` to run the API Server, Kafka Consumers, and RabbitMQ Worker in a single terminal window with colorful logs.*

---

## 🧪 Testing & Validation

### 1. Load Testing
We include a script to simulate high traffic and validation of the event-driven pipelines.

1. **Generate Auth Token**:
   The system is secured. You need a JWT to modify tasks.
   ```bash
   node get-token.js
   ```
   *This script registers a user, logs them in, and saves the token to `token.txt`.*

2. **Run Load Test**:
   ```bash
   node load-test.js
   ```
   *This uses `autocannon` to fire requests at `POST /tasks`. It automatically reads the token from `token.txt`.*

### 2. Database Inspection
View the data created by the tests:
```bash
npx prisma studio
```

### 3. Architecture Flow Verification
1.  **API**: Receives `POST /tasks`.
2.  **Kafka Producer**: Pushes event to `task.ingested`.
3.  **Ingest Consumer**:
    *   Reads from `task.ingested`.
    *   Batches writes to PostgreSQL (`prisma.task.createMany`).
    *   Caches task in Redis.
    *   Pushes event to `task.created`.
4.  **Created Consumer**:
    *   Reads from `task.created`.
    *   Pushes job to RabbitMQ queue `task.notifications`.
5.  **Notification Worker**:
    *   Process job from RabbitMQ.
    *   Simulates sending an email/notification (logs to console).

## ⚠️ Troubleshooting

- **"Table not found" error**:
  - In Docker Mode: This shouldn't happen as we mistakenly fixed it. If it does, run `docker-compose restart api`.
  - In Local Mode: Forgot to run `npx prisma db push`.
- **Kafka Connection Errors**:
  - Ensure the containers are healthy (`docker ps`).
  - If running locally, ensure you are connecting to `localhost:9092`.
- **Prisma Studio**:
  - Run `npx prisma studio` inside the `app` folder locally to view the DB running in Docker (port 5434).

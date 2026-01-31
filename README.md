# Enterprise Task Management System

A robust, scalable backend system for managing tasks, built with Modern Node.js technologies and an Event-Driven Architecture.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Message Queues:**
  - **Kafka:** Stream processing and ingestion consumers
  - **RabbitMQ:** Task notification workers
- **Caching & Rate Limiting:** Redis
- **Containerization:** Docker & Docker Compose

## 📂 Project Structure

```
demo-big-proj/
├── app/
│   ├── src/
│   │   ├── consumers/       # Kafka consumers
│   │   ├── middlewares/     # Express middlewares (Auth, RateLimiter)
│   │   ├── modules/         # Feature modules (Auth, Task)
│   │   ├── routes/          # Health/System routes
│   │   ├── workers/         # Background workers (RabbitMQ)
│   │   ├── kafka.ts         # Kafka configuration
│   │   └── server.ts        # Application entry point
│   ├── load-test.js         # Autocannon load testing script
│   ├── package.json         # Dependencies
│   └── prisma/              # Database schema and migrations
└── docker-compose.yml       # Infrastructure (Redis, Kafka, Postgres, RabbitMQ)
```

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) & Docker Compose
- [npm](https://www.npmjs.com/)

## 🏃‍♂️ Getting Started

### 1. Choose Your Run Mode

**Option A: Local Development (Recommended)**
Run infrastructure in Docker, but run the application code locally for hot-reloading and easy debugging.

1. Start only the infrastructure services (Database, Brokers):
   ```bash
   docker-compose up -d postgres redis kafka rabbitmq
   ```
2. Install dependencies:
   ```bash
   cd app
   npm install
   ```
3. Run the application stack:
   ```bash
   npm run dev:all
   ```
   *This starts the API Server, Kafka Consumers, and RabbitMQ Worker in one terminal.*

**Option B: Full Docker Mode**
Run the entire system (including the app and workers) inside Docker containers.

1. Build and start all services:
   ```bash
   docker-compose up -d --build
   ```
   *The API will be available at http://localhost:3000*

### 2. Environment Configuration
Ensure your environment variables are set up.
*(Note: Create a `.env` file in the `app` directory based on your configuration)*

Example `.env` (for Local Development):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/demo_task_db?schema=public"
REDIS_URL="redis://localhost:6379"
KAFKA_BROKERS="localhost:9092"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
```

### 3. Database Setup
Run the Prisma migrations to create the database schema.

```bash
npx prisma migrate dev
```


## 🧪 Testing

### Load Testing
A load testing script is included to test the performance of the task creation endpoint.

1. Ensure the server is running.
2. Run the load test script:
   ```bash
   node load-test.js
   ```
   *Note: You may need to verify or update the JWT token in `load-test.js` if authentication is required.*

## 📚 API Endpoints

### Auth
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT

### Tasks
- `POST /tasks` - Create a task
- `GET /tasks/:id` - Get task details

### Health
- `GET /health` - Check system health

## 🏗️ Architecture Highlights

- **Rate Limiting:** Protects endpoints using Redis to track request frequency.
- **Event-Driven:** Uses Kafka for high-throughput data ingestion and RabbitMQ for reliable background task processing (e.g., notifications).
- **Type Safety:** Full TypeScript implementation ensures robust code.

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
│   ├── get-token.js         # Script to get fresh JWT token
│   ├── load-test.js         # Autocannon load testing script
│   ├── package.json         # Dependencies
│   └── prisma/              # Database schema and migrations
├── docker-compose.yml       # Full Stack (App + Infra)
└── docker-compose-old.yml   # Infrastructure Only (Redis, Kafka, Postgres, RabbitMQ)
```

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) & Docker Compose
- [npm](https://www.npmjs.com/)

## 🏃‍♂️ Getting Started

### 1. Choose Your Run Mode

### 1. Choose Your Run Mode

**Option A: Local Development (Recommended)**
Use this mode when you want to write code and see changes immediately. You run the infrastructure in Docker, but the Node.js application runs directly on your machine.

1. **Start Infrastructure Only** (using `docker-compose-old.yml`):
   ```bash
   docker-compose -f docker-compose-old.yml up -d
   ```
   *This commands starts Postgres, Redis, Kafka, and RabbitMQ without the application containers.*

2. **Install dependencies**:
   ```bash
   cd app
   npm install
   ```

3. **Run the application stack**:
   ```bash
   npm run dev:all
   ```
   *This starts the API Server, Kafka Consumers, and RabbitMQ Worker in one terminal.*

**Option B: Full Docker Mode**
Use this mode to simulate a production environment. The entire system (application + infrastructure) runs inside Docker containers.

1. **Start Full Stack** (using `docker-compose.yml`):
   ```bash
   docker-compose up -d --build
   ```
   *This builds the app image and starts all services including consumers and workers.*
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

### 4. View Database
You can visualize and edit your data using Prisma Studio:
```bash
npx prisma studio
```


## 🧪 Testing

### Load Testing
A load testing script is included to test the performance of the task creation endpoint.

1. Ensure the server is running.
2. Run the load test script:
   ```bash
   node load-test.js
   ```
   ```bash
   node load-test.js
   ```

3. **Authentication Token**:
   The `load-test.js` script uses a JWT token for authentication. If you encounter `401 Unauthorized` errors, it means the token has expired.
   
   To generate a fresh token:
   ```bash
   node get-token.js
   ```
   This script will:
   1. Register a new test user.
   2. Login to get a fresh JWT.
   3. Save the token to `token.txt`.
   
   *After running this, manually update the `Authorization` header in `load-test.js` with the new token from `token.txt`.*

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

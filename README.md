# TaskForge

A background job processing system built with **NestJS, BullMQ, Redis, PostgreSQL, and Prisma**.

TaskForge allows applications to create jobs, queue them for asynchronous processing, retry failed jobs with exponential backoff, and move permanently failed jobs into a dead-letter queue.

## Tech Stack

* **NestJS** — Backend framework
* **TypeScript** — Programming language
* **PostgreSQL** — Persistent database
* **Prisma** — ORM
* **Redis** — Queue storage
* **BullMQ** — Job queue and worker management

---

## Prerequisites

Before running TaskForge, make sure you have the following installed:

* Node.js 24+
* npm
* PostgreSQL
* Redis
* Git

You can verify your installations:

```bash
node -v
npm -v
psql --version
redis-server --version
```

---

## 1. Clone the Repository

```bash
git clone <repository-url>
```

Navigate into the project:

```bash
cd taskforge
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskforge"

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3000
```

Replace the PostgreSQL credentials with the credentials for your local database.

---

## 4. Create the PostgreSQL Database

Create a database named `taskforge`:

```bash
createdb taskforge
```

Alternatively, using PostgreSQL:

```sql
CREATE DATABASE taskforge;
```

Make sure the database URL in `.env` points to this database.

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskforge"
```

---

## 5. Start Redis

TaskForge uses Redis as the storage layer for BullMQ.

If Redis is installed locally:

```bash
redis-server
```

Verify that Redis is running:

```bash
redis-cli ping
```

You should receive:

```text
PONG
```

### Using Docker

If you prefer Docker:

```bash
docker run --name taskforge-redis \
  -p 6379:6379 \
  -d redis
```

Then verify:

```bash
redis-cli ping
```

---

## 6. Configure Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev
```

If this is a fresh database, Prisma will create the required tables.

---

## 7. Start the Application

For development:

```bash
npm run start:dev
```

The API should start on:

```text
http://localhost:3000
```

---

## 8. Create a Job

Create a job using:

```http
POST /jobs
```

Example request:

```json
{
  "type": "send_email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome to TaskForge"
  }
}
```

The request follows this flow:

```text
API
 ↓
JobsService
 ↓
PostgreSQL
 ↓
BullMQ
 ↓
Redis
 ↓
Worker
```

---

## 9. Worker Processing

TaskForge uses a BullMQ worker to consume jobs from the `jobs` queue.

The worker is registered with:

```typescript
@Processor('jobs')
```

When a job is added to the queue, the worker automatically receives it.

The job lifecycle is:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

If processing fails:

```text
PROCESSING
   ↓
RETRYING
   ↓
PROCESSING
```

After all retry attempts are exhausted:

```text
FAILED
   ↓
DEAD LETTER
```

---

## 10. Automatic Retries

TaskForge uses BullMQ's retry mechanism.

The current configuration allows:

* Maximum attempts: **5**
* Exponential backoff
* Initial backoff delay: **5 seconds**

Example:

```text
Attempt 1 → Failed
      ↓ 5s
Attempt 2 → Failed
      ↓ 10s
Attempt 3 → Failed
      ↓ 20s
Attempt 4 → Failed
      ↓ 40s
Attempt 5 → Failed
      ↓
Dead Letter
```

The worker throws an error when processing fails, allowing BullMQ to automatically handle the retry.

---

## 11. Dead Letter Jobs

Jobs that fail all retry attempts are persisted as dead-letter jobs.

Dead-letter jobs contain information such as:

```text
Job ID
Job type
Payload
Error
Number of attempts
Failure timestamp
```

A dead-lettered job can be manually retried using:

```http
POST /jobs/dead-letters/:id/retry
```

The job is then returned to the normal queue-processing pipeline.

---

## Project Structure

```text
src/
├── jobs/
│   ├── action/
│   │   ├── process-jobs.action.ts
│   ├── ├── create-job.action.ts
│   │   └── move-to-dead-letter.action.ts
│   │
│   ├── dto/
│   │   └── creat-job.dto.ts
│   │
│   ├── jobs.controller.ts
│   ├── jobs.module.ts
│   ├── jobs.processor.ts
│   └── jobs.service.ts
│
├── queue/
│   ├── queue.module.ts
│   └── queue.service.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
│—— app.module.ts
└── main.ts
```

---

## Development Commands

Start the application:

```bash
npm run start
```

Start in development/watch mode:

```bash
npm run start:dev
```

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Architecture

```text
                    Client
                      │
                      ▼
              ┌───────────────┐
              │ JobsController│
              └───────┬───────┘
                      │
                      ▼
               ┌─────────────┐
               │ JobsService │
               └──────┬──────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
       PostgreSQL          QueueService
                               │
                               ▼
                         BullMQ / Redis
                               │
                               ▼
                         ProcessJobs
                               │
                               ▼
                         Job Processing
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                COMPLETED               FAILED
                                          │
                                      RETRYING
                                          │
                                      max attempts
                                          │
                                          ▼
                                    DEAD LETTER
```

---

## Current Features

* Job creation
* PostgreSQL job persistence
* Redis/BullMQ queue
* Background workers
* Job status tracking
* Automatic retries
* Exponential backoff
* Dead-letter jobs
* Manual dead-letter retry

## Roadmap
* Job priorities
* Worker concurrency
* Multiple job processors
* Scheduled jobs
* Job cancellation
* Idempotency
* Rate limiting
* Job history
* Worker health checks
* Metrics and monitoring
* Web dashboard
* Horizontal worker scaling
* Dockerized deployment

---

## License

This project is licensed under the MIT License.

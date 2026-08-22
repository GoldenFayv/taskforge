# TaskForge — Current Architecture

### 1. Overview

TaskForge is a background job processing system built with:

* NestJS
* TypeScript
* PostgreSQL
* Prisma
* Redis
* BullMQ

Its purpose is to accept jobs through an API, persist them, queue them for asynchronous processing, execute them using workers, retry failed jobs using exponential backoff, and move permanently failed jobs into a dead-letter queue.

### 2. Current architecture

```text
                    Client
                      │
                      │ POST /jobs
                      ▼
              ┌───────────────┐
              │ JobsController│
              └───────┬───────┘
                      ▼
               ┌─────────────┐
               │ JobsService │
               └──────┬──────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
       CreateJob Action    QueueService
             │                 │
             ▼                 ▼
        PostgreSQL          BullMQ/Redis
                                │
                                ▼
                         ProcessJobs Worker
                                │
                                ▼
                         Job Processing
```

### 3. Job creation

The API exposes:

```http
POST /jobs
```

The request contains information such as:

```json
{
  "type": "send_email",
  "payload": {
    "to": "user@example.com"
  }
}
```

The flow is:

```text
POST /jobs
   ↓
JobsController
   ↓
JobsService
   ↓
CreateJob
   ↓
PostgreSQL
   ↓
QueueService
   ↓
BullMQ
```

The database record is created before the job is placed on the queue.

### 4. Queue

BullMQ uses Redis as the queue backend.

The application registers a queue named:

```text
jobs
```

`QueueService` is responsible for adding jobs to this queue.

The queued job contains:

```typescript
{
  id: job.id,
  payload: job.payload
}
```

The BullMQ job name corresponds to the application's job type:

```text
job.name → send_email
```

### 5. Worker

`ProcessJobs` is the BullMQ worker.

```typescript
@Processor('jobs')
export class ProcessJobs extends WorkerHost
```

It listens to the same `jobs` queue.

When BullMQ gives it a job:

```typescript
async process(job: Job)
```

is executed.

The worker currently:

1. Receives the job.
2. Gets the PostgreSQL job ID from `job.data.id`.
3. Updates the database status to `PROCESSING`.
4. Performs the job processing.
5. Marks successful jobs as `COMPLETED`.
6. Throws errors when processing fails.

### 6. Job lifecycle

The current lifecycle is:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

Failure:

```text
PROCESSING
   ↓
RETRYING
   ↓
PROCESSING
```

After all retry attempts are exhausted:

```text
PROCESSING
   ↓
FAILED
   ↓
DEAD LETTER
```

### 7. Automatic retries

BullMQ handles retrying jobs.

The current configuration uses:

```text
Maximum attempts: 5
Backoff: exponential
Initial delay: 5 seconds
```

Conceptually:

```text
Attempt 1 → FAIL
              ↓ 5s
Attempt 2 → FAIL
              ↓ 10s
Attempt 3 → FAIL
              ↓ 20s
Attempt 4 → FAIL
              ↓ 40s
Attempt 5 → FAIL
              ↓
           FAILED
```

The application does not manually implement the retry loop.

Instead, the worker throws an error and BullMQ manages the retry.

### 8. Dead Letter Queue

When a job exhausts its retry attempts, it is considered permanently failed.

TaskForge persists information about the failed job in a `DeadLetterJob` table.

The record contains information such as:

```text
jobId
type
payload
error
attempts
failedAt
```

This allows permanently failed jobs to be inspected independently of Redis.

### 9. Manual retry

A dead-lettered job can be manually requeued through:

```http
POST /jobs/dead-letters/:id/retry
```

The retry process is:

```text
DeadLetterJob
     ↓
Find original Job
     ↓
Reset Job → PENDING
     ↓
Add Job back to BullMQ
     ↓
Delete DeadLetterJob
     ↓
Worker processes it again
```

### 10. Current module structure

```text
JobsModule
│
├── JobsController
├── JobsService
├── CreateJob
├── ProcessJobs
├── LoggerService
│
├── PrismaModule
└── QueueModule
       │
       └── QueueService
              │
              └── BullMQ → Redis
```

The separation is intentional:

**JobsModule**

Owns the job domain and worker.

**QueueModule**

Owns communication with BullMQ/Redis.

**CreateJob**

Handles persistence of newly created jobs.

**QueueService**

Handles putting jobs into BullMQ.

**ProcessJobs**

Consumes and processes jobs.

### 11. Features completed

```text
✅ Job creation
✅ Job persistence
✅ Redis/BullMQ queue
✅ Background worker
✅ Job status tracking
✅ Processing status
✅ Completed status
✅ Failed status
✅ Automatic retries
✅ Exponential backoff
✅ Dead-letter persistence
✅ Manual dead-letter retry
```

### 12. What we haven't built yet

The next major features can be:

```text
⬜ Job priorities
⬜ Worker concurrency
⬜ Multiple job types/processors
⬜ Scheduled/delayed jobs
⬜ Job cancellation
⬜ Idempotency
⬜ Job history
⬜ Rate limiting
⬜ Graceful worker shutdown
⬜ Health checks
⬜ Metrics
⬜ Dashboard
⬜ Authentication/authorization
⬜ Docker deployment
⬜ Horizontal worker scaling
```

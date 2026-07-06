# Backend Architecture

## Table of Contents

- [Overview](#overview)
- [Feature-Based Structure](#feature-based-structure)
- [Request Lifecycle](#request-lifecycle)
- [Layer Responsibilities](#layer-responsibilities)
  - [Routes](#routes)
  - [Middleware](#middleware)
  - [Controllers](#controllers)
  - [Services](#services)
  - [Repositories](#repositories)
- [Authentication Flow](#authentication-flow)
- [Validation Flow](#validation-flow)
- [Adding a New Feature](#adding-a-new-feature)

## Overview

The backend follows a **feature‑based architecture**. Instead of grouping files by technical responsibility (MVC style), code is organized around application features. Each feature contains everything required for that domain.

## Overall System Architecture (Subsystem/ component diagram)(some services are missing)

The application is structured to treat distinct features as decoupled microservices logically (even within a monolith, like a modular monolith).

<img src="/docs/diagrams/En_passant_backend_architecture.svg" alt="Backend Architecture Diagram(subsystem/components)" width="100%"/>

## Feature‑Based Structure

```
src/
├─ app.js                # Express app and global middleware
├─ server.js             # Server entry point, initialises workers & schedulers
├─ config/
│   └─ db.js             # MongoDB connection
├─ redis/
│   └─ redis.client.js   # IORedis client (used by BullMQ)
├─ features/
│   ├─ leaderboard/
│   │   ├─ leaderboard.controller.js
│   │   ├─ leaderboard.routes.js
│   │   └─ leaderboard.service.js
│   ├─ payments/
│   │   ├─ gateways/
│   │   │   └─ razorpay.gateway.js        # Razorpay SDK wrapper
│   │   ├─ payment.controller.js          # createCheckoutSession, razorpayWebhook
│   │   └─ payment.routes.js
│   ├─ recruitment/
│   │   ├─ recruitment.constants.js       # Enums + VALID_TRANSITIONS state machine
│   │   ├─ recruitment.controller.js      # createApplication, getMyApplication
│   │   ├─ recruitment.model.js           # Mongoose Recruitment schema
│   │   ├─ recruitment.queue.js           # BullMQ queue definition
│   │   ├─ recruitment.repository.js      # Data access layer
│   │   ├─ recruitment.routes.js          # Express router
│   │   ├─ recruitment.scheduler.js       # Cron: daily expiry dispatcher
│   │   ├─ recruitment.service.js         # Business logic + state transitions
│   │   ├─ recruitment.validation.js      # Zod validation schemas
│   │   └─ recruitment.worker.js          # BullMQ worker: autoRejectExpiredApplications
│   ├─ storage/
│   │   ├─ providers/
│   │   │   └─ cloudinary.provider.js     # Cloudinary SDK init
│   │   └─ storage.service.js             # uploadFile, deleteFile, generateSignedUrl
│   ├─ submissions/
│   │   ├─ submission.controller.js       # uploadTaskSubmission, getTaskSubmission
│   │   ├─ submission.model.js            # Mongoose Submission schema
│   │   └─ submission.routes.js           # Express router
│   ├─ tasks/
│   │   ├─ task.controller.js
│   │   ├─ task.model.js                  # Department + Task schemas
│   │   ├─ task.repository.js
│   │   ├─ task.routes.js
│   │   └─ task.service.js
│   ├─ sync/
│   │   ├─ adapters/                      # Chess.com + Lichess adapters
│   │   ├─ sync.engine.js                 # Core sync + leaderboard update logic
│   │   ├─ sync.queue.js
│   │   ├─ sync.scheduler.js              # Cron: daily sync dispatcher
│   │   └─ sync.worker.js
│   └─ users/
│       ├─ user.model.js
│       ├─ user.repository.js
│       ├─ user.service.js
│       ├─ user.controller.js
│       ├─ user.routes.js
│       └─ user.validation.js
├─ middleware/
│   ├─ auth.middleware.js      # Clerk JWT authentication (userAuth, adminAuth)
│   ├─ upload.middleware.js    # Multer memory storage (10 MB limit)
│   ├─ validate.middleware.js  # Zod schema validation
│   └─ error.middleware.js     # Global error formatting
└─ server.js                   # Entry: starts Express + workers + schedulers
```

### Why Feature‑Based?

- Keeps related code together, improving ownership.
- Easier to add new domains (e.g., tournaments, matches) without touching unrelated files.
- Reduces coupling and navigation overhead.

## Request Lifecycle

A request follows this flow:

<img src="/docs/diagrams/Request_flow.svg" alt="Request Lifecycle Diagram" width="100%"/>

## Layer Responsibilities

### Routes

- Location: `features/*/user.routes.js`
- Define API endpoints, attach middleware, connect controllers.
- **Should not** contain DB queries or business logic.

```js
// Example route
router.get("/me", userAuth, me);
```

---

### Middleware

- Location: `src/middleware/`
- Handles authentication, validation, and error handling.
- **Current middleware**:
  - `auth.middleware` – extracts Clerk user ID (includes `userAuth` and `adminAuth`).
  - `validate.middleware` – validates request bodies with Zod.
  - `error.middleware` – formats errors into consistent responses.

---

### Controllers

- Receive request data, call services, and send responses.
- Keep logic thin; delegate to services.

---

### Services

- Contain business rules and orchestrate multiple repositories when needed.
- Example: checking if a user exists before returning profile data.

---

### Repositories

- Directly interact with MongoDB via Mongoose.
- Provide simple CRUD functions (`findById`, `create`, `update`, `delete`).

---

## Authentication Flow

<img src="/docs/diagrams/Authentication_flow.svg" alt="Authentication Flow Diagram" width="100%"/>

## Validation Flow

<img src="/docs/diagrams/Validation_flow.svg" alt="Validation Flow Diagram" width="100%"/>

## Background Sync Flow (Chess Accounts)

To keep API responses fast, external API synchronization is decoupled using a queue-based system.

<img src="/docs/diagrams/Background_Sync_Flow.svg" alt="Sync Flow Diagram" width="100%"/>

- **Adapters**: Isolated files (`chesscom.adapter.js`, `lichess.adapter.js`) strictly handle fetching and normalizing data from external platforms.
- **Engine**: Coordinates the sync logic and executes a single database update at the end to minimize writes.
- **Queue**: Uses BullMQ + Redis to manage job states, retries, and errors without blocking the user's request lifecycle.

## Leaderboard Flow

The leaderboard relies on Redis Sorted Sets (`ZADD`, `ZREVRANGE`, `ZREVRANK`) to provide fast ranking data without heavy MongoDB aggregation queries.

<img src="/docs/diagrams/Leaderboard_Flow.svg" alt="Leaderboard Flow Diagram" width="100%"/>

- **Update**: Triggered automatically by the `SyncEngine` whenever a user's ratings change.
- **Get Leaderboard**: Pulls the top IDs and their scores from Redis, then hydrates the response by querying MongoDB for those specific User documents.
- **Get My Rank**: Directly queries Redis for the authenticated user's exact rank (0-indexed, shifted to 1-indexed) without hitting MongoDB.

## Recruitment Service Flow

The recruitment pipeline enforces a strict finite state machine.

<img src="/docs/diagrams/recruitment_flow_and_state_machine.svg" alt="Recruitment Flow Diagram" width="100%"/>

- **Apply**: `POST /api/recruitment/apply` — Creates a `DRAFT` application.
- **State Transitions**: All status changes go through `transitionStatus()` in `recruitment.service.js`, which validates against `VALID_TRANSITIONS` before writing.
- **Background Expiry**: A daily cron (via BullMQ + Redis) fires `autoRejectExpiredApplications()` at midnight, deleting any `PAYMENT_PENDING` applications older than 24 hours.

## Payment Flow

The payment flow integrates Razorpay with the recruitment state machine:
<img src="/docs//diagrams//payment_flow.svg" alt="Payment Flow Diagram" width="100%"/>

1. `POST /api/payments/checkout` — Creates a Razorpay order and transitions application `DRAFT → PAYMENT_PENDING`.
2. Razorpay redirects the user through their hosted checkout.
3. `POST /api/payments/webhook` — Receives the `payment.captured` event, verifies the **HMAC-SHA256 signature**, and calls `handleSuccessfulPayment()` which transitions `PAYMENT_PENDING → ACTIVE`.

## Task Service Flow

Tasks are seeded per recruitment year and department. Each task has a `submission` sub-schema that controls what types of responses are accepted:

- `acceptsText` — free-form text answer
- `acceptsLinks` — external URLs (e.g., GitHub repo link)
- `acceptsFiles` — file uploads, governed by `fileCategory`, `maxFiles`, and `maxFileSize`

<img src="/docs/diagrams/task_flow.svg" alt="Task Submission Flow Diagram" width="100%"/>

Endpoints:

- `GET /api/tasks/department?departmentId=&year=` — Tasks for a specific department
- `GET /api/tasks/?year=` — All tasks for a year

## Submission Service Flow

<img src="/docs/diagrams/submission_flow.svg" alt="Submission Flow Diagram" width="100%">

On upload:

1. Validates the caller's application is `ACTIVE` (cross-service check).
2. Fetches the task's `submission` rules (cross-service check).
3. Validates all files against those rules (count, size, MIME type).
4. Streams each file buffer to **Cloudinary** via `upload_stream` into `recruitment/{year}/{DEPT_CODE}/{applicationId}/`.
5. Upserts the `Submission` document in MongoDB (unique index: `applicationId + taskId`).

On fetch (`GET /api/submissions/:appId/:taskId`):

- Generates a **signed Cloudinary URL** (15-minute TTL) per stored file so admins and the applicant can securely view uploaded assets.

## Adding a New Feature

To add a new domain (e.g., tournaments):

1. Create a folder under `features/` (e.g., `features/tournaments/`).
2. Add the typical files:
   - `tournament.model.js`
   - `tournament.repository.js`
   - `tournament.service.js`
   - `tournament.controller.js`
   - `tournament.routes.js`
   - `tournament.validation.js`
3. Register the router in `src/app.js`.

---

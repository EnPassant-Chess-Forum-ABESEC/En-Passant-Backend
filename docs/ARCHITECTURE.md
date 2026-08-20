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
- [Background Sync Flow (Chess Accounts)](#background-sync-flow-chess-accounts)
- [Leaderboard Flow](#leaderboard-flow)
- [Recruitment Service Flow](#recruitment-service-flow)
- [Manual Payment & Receipt Flow](#manual-payment--receipt-flow)
- [Email Notification Flow](#email-notification-flow)
- [Events Management Flow](#events-management-flow)
- [Task Service Flow](#task-service-flow)
- [Submission Service Flow](#submission-service-flow)
- [Admin System Services](#admin-system-services)
- [Adding a New Feature](#adding-a-new-feature)

## Overview

The backend follows a **feature‑based architecture**. Instead of grouping files by technical responsibility (MVC style), code is organized around application features. Each feature contains everything required for that domain.

## Overall System Architecture

The application follows a modular monolith architecture where features are isolated as independent domains with clear boundaries, allowing future extraction into services if needed.

<img src="/docs/diagrams/en_passant_detailed_arch.svg" alt="Backend Architecture Diagram(subsystem/components)" width="100%"/>

## Feature‑Based Structure

```
src/
├─ app.js
├─ server.js
├─ config/
│   └─ db.js
├─ redis/
│   └─ redis.client.js
├─ utils/
│   ├─ AppError.js
│   ├─ googleSheet.util.js
│   ├─ admin.service.js
│   └─ admin.validation.js
├─ features/
│   ├─ admin/
│   │   ├─ admin.controller.js
│   │   ├─ admin.routes.js
│   │   ├─ admin.service.js
│   │   └─ admin.validation.js
│   ├─ contact/
│   │   ├─ contact.controller.js
│   │   ├─ contact.model.js
│   │   └─ contact.routes.js
│   ├─ email/
│   │   ├─ email.service.js
│   │   ├─ email.queue.js
│   │   ├─ email.worker.js
│   │   └─ templates/
│   ├─ events/
│   │   ├─ event.controller.js
│   │   ├─ event.model.js
│   │   ├─ event.repository.js
│   │   ├─ event.routes.js
│   │   └─ event.service.js
│   ├─ leaderboard/
│   │   ├─ leaderboard.controller.js
│   │   ├─ leaderboard.routes.js
│   │   └─ leaderboard.service.js
│   ├─ logs/
│   │   └─ log.model.js
│   ├─ payments/
│   │   ├─ payment.controller.js
│   │   ├─ payment.model.js
│   │   ├─ payment.repository.js
│   │   ├─ payment.routes.js
│   │   ├─ receipt.queue.js
│   │   ├─ receipt.worker.js
│   │   └─ templates/
│   ├─ recruitment/
│   │   ├─ recruitment.constants.js
│   │   ├─ recruitment.controller.js
│   │   ├─ recruitment.model.js
│   │   ├─ recruitment.queue.js
│   │   ├─ recruitment.repository.js
│   │   ├─ recruitment.routes.js
│   │   ├─ recruitment.scheduler.js
│   │   ├─ recruitment.service.js
│   │   ├─ recruitment.validation.js
│   │   └─ recruitment.worker.js
│   ├─ settings/
│   │   ├─ settings.controller.js
│   │   ├─ settings.model.js
│   │   └─ settings.routes.js
│   ├─ storage/
│   │   ├─ providers/
│   │   │   └─ cloudinary.provider.js
│   │   └─ storage.service.js
│   ├─ submissions/
│   │   ├─ submission.controller.js
│   │   ├─ submission.model.js
│   │   ├─ submission.repository.js
│   │   └─ submission.routes.js
│   ├─ sync/
│   │   ├─ adapters/
│   │   ├─ sync.engine.js
│   │   ├─ sync.queue.js
│   │   ├─ sync.scheduler.js
│   │   └─ sync.worker.js
│   ├─ tasks/
│   │   ├─ task.controller.js
│   │   ├─ task.model.js
│   │   ├─ task.repository.js
│   │   ├─ task.routes.js
│   │   └─ task.service.js
│   ├─ users/
│   │   ├─ user.model.js
│   │   ├─ user.repository.js
│   │   ├─ user.service.js
│   │   ├─ user.controller.js
│   │   ├─ user.routes.js
│   │   └─ user.validation.js
│   └─ webhooks/
│       ├─ webhook.controller.js
│       └─ webhook.routes.js
├─ middleware/
│   ├─ auth.middleware.js
│   ├─ upload.middleware.js
│   ├─ validate.middleware.js
│   └─ error.middleware.js
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

<img src="/docs/diagrams/recruitment_process_and_state_machine.svg" alt="Recruitment Flow Diagram" width="100%"/>

- **Apply**: `POST /api/recruitment/apply` — Creates a `DRAFT` application.
- **State Transitions**: All status changes go through `transitionStatus()` in `recruitment.service.js`, which validates against `VALID_TRANSITIONS` before writing.

## Manual Payment & Receipt Flow

The application has switched to a fully manual payment verification process, removing the legacy Razorpay gateway.

<img src="/docs/diagrams/manual_payment_and_receipt_flow.svg" alt="Recruitment Flow Diagram" width="100%"/>

1. **Submission**: `POST /api/payments/manual` - The applicant uploads a screenshot of their transaction along with the UTR number. The screenshot is uploaded to Cloudinary, a `PENDING` record is created in the `Payments` collection, and the application transitions to `PAYMENT_PENDING`. An email is queued notifying them that their payment is under review.
2. **Verification**: `PATCH /api/admin/payments/:id/verify` - An admin reviews the screenshot and UTR.
   - **On Success**: A MongoDB Transaction is used to update the `Payment` ledger to `SUCCESS` and transition the application to `ACTIVE`. A background job is enqueued to generate a receipt.
   - **On Failure**: The ledger is marked `FAILED` with a rejection reason, the application transitions to `PAYMENT_FAILED`, and an email is queued to notify the candidate.
3. **Receipt Generation**: The `receipt-queue` (BullMQ worker) uses Puppeteer to render a PDF receipt from an EJS template, uploads/stores it, and triggers a success email with the receipt attached.

## Email Notification Flow

Email notifications are offloaded to a background worker to ensure fast API responses and decoupled logic.

<img src="/docs/diagrams/email_flow.svg" alt="Recruitment Flow Diagram" width="100%"/>

- **Queue**: Uses BullMQ (`email-queue`) backed by Redis.
- **Worker**: The background worker picks up jobs, hydrates EJS templates located in `src/features/email/templates/` with user data, and dispatches them.
- **Provider**: Uses **Resend** (via `resend` SDK) for reliable email delivery.
- **Use Cases / Job Types**:
  - `send-welcome-email`: Sent when a user registers/onboards.
  - `send-payment-pending-email`: Sent when a user submits a manual payment.
  - `send-payment-success-email`: Sent by admin upon verification (includes receipt URL).
  - `send-payment-failed-email`: Sent by admin upon rejection (includes reason).
  - `send-contact-us-email`: Forwards contact form submissions to the club's email.
  - `send-draft-reminder-email`: Reminds users with applications in draft status, i.e. payment not completed.

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

## Admin System Services

The admin module is highly privileged and handles beyond simple CRUD:

- **`POST /api/admin/redis/clean`**: Clears out stale leaderboard sorted sets.
- **`POST /api/admin/cloud/clean`**: Purges unused or orphaned assets from Cloudinary.
- **`POST /api/admin/users/sync-all`**: Dispatches a global queue job to re-sync all chess ratings from external APIs.
- **`POST /api/admin/applications/remind-drafts`**: Enqueues reminder emails for users sitting on `DRAFT` applications.

## Events Management Flow (In development)

The `events` feature allows the club to host, display, and manage chess tournaments or offline events.

- **Models**: Defines an `Event` with capacities, deadlines, and a `status` (upcoming, ongoing, completed, cancelled).
- **Admin**: Admins create and modify events.
- **Public**: End-users can query the list of active events to participate or view details.

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

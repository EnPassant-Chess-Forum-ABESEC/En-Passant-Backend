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

## Overall System Architecture

The application is structured to treat distinct features as decoupled microservices logically (even within a monolith, like a modular monolith).

<img src="/docs/En passant backend architecture.svg" alt="Backend Architecture Diagram" width="100%"/>

## Feature‑Based Structure

```
src/
├─ app.js                # Express app and global middleware
├─ config/
│   └─ db.js             # MongoDB connection
├─ features/
│   ├─ sync/
│   │   ├─ adapters/             # External API logic
│   │   ├─ sync.engine.js        # Core sync logic
│   │   ├─ sync.queue.js         # BullMQ configuration
│   │   ├─ sync.scheduler.js     # Cron jobs
│   │   └─ sync.worker.js        # Queue worker
│   └─ users/
│       ├─ user.model.js         # Mongoose model
│       ├─ user.repository.js    # Data access layer
│       ├─ user.service.js       # Business logic
│       ├─ user.controller.js    # HTTP handlers
│       ├─ user.routes.js        # Express router
│       └─ user.validation.js    # Zod schemas
├─ middleware/
│   ├─ auth.middleware.js      # Clerk authentication
│   ├─ validate.middleware.js  # Zod validation
│   └─ error.middleware.js     # Global error handling
└─ server.js              # Server entry point
```

### Why Feature‑Based?

- Keeps related code together, improving ownership.
- Easier to add new domains (e.g., tournaments, matches) without touching unrelated files.
- Reduces coupling and navigation overhead.

## Request Lifecycle

A request follows this flow:

```mermaid
flowchart TD
    A[Client Request] --> B[Route Layer]
    B --> C[Middleware Layer]
    C --> D[Controller Layer]
    D --> E[Service Layer]
    E --> F[Repository Layer]
    F --> G[Database]
```

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

```mermaid
flowchart TD
    A[User logs in via Clerk] --> B[Clerk issues JWT]
    B --> C[Client sends request with Authorization header]
    C --> D[auth.middleware validates token]
    D --> E{User in MongoDB?}
    E -- Yes --> F[Attach user to req]
    E -- No --> G[Fetch profile from Clerk API]
    G --> H[Create user in MongoDB]
    H --> F
    F --> I[Proceed to route handler]
```

## Validation Flow

```mermaid
flowchart TD
    A[Incoming request] --> B[validate.middleware]
    B --> C{Zod schema validation}
    C -- Pass --> D[Controller]
    C -- Fail --> E[error.middleware → 400 response]
```

## Background Sync Flow (Chess Accounts)

To keep API responses fast, external API synchronization is decoupled using a queue-based system.

```mermaid
flowchart TD
    A[User Profile Update / Onboard] --> B[Controller enqueues job]
    C[Daily Cron Job] --> D[Scheduler enqueues jobs]
    B --> E[(BullMQ Queue + Redis)]
    D --> E
    E --> F[Sync Worker]
    F --> G[Sync Engine]
    G --> H[Chess.com Adapter]
    G --> I[Lichess Adapter]
    H --> J[(MongoDB)]
    I --> J
```

- **Adapters**: Isolated files (`chesscom.adapter.js`, `lichess.adapter.js`) strictly handle fetching and normalizing data from external platforms.
- **Engine**: Coordinates the sync logic and executes a single database update at the end to minimize writes.
- **Queue**: Uses BullMQ + Redis to manage job states, retries, and errors without blocking the user's request lifecycle.

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

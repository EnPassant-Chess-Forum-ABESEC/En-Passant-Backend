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

## Feature‑Based Structure

```
src/
├─ app.js                # Express app and global middleware
├─ config/
│   └─ db.js             # MongoDB connection
├─ features/
│   └─ users/
│       ├─ user.js               # Mongoose model
│       ├─ userRepository.js     # Data access layer
│       ├─ userService.js        # Business logic
│       ├─ userController.js    # HTTP handlers
│       ├─ userRoutes.js         # Express router
│       └─ userValidation.js    # Zod schemas
├─ middleware/
│   ├─ authMiddleware.js   # Clerk authentication
│   ├─ validateMiddleware.js # Zod validation
│   └─ errorMiddleware.js  # Global error handling
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
- Location: `features/*/userRoutes.js`
- Define API endpoints, attach middleware, connect controllers.
- **Should not** contain DB queries or business logic.

```js
// Example route
router.get('/me', userAuth, me);
```

---
### Middleware
- Location: `src/middleware/`
- Handles authentication, validation, and error handling.
- **Current middleware**:
  - `authMiddleware` – extracts Clerk user ID.
  - `validateMiddleware` – validates request bodies with Zod.
  - `errorMiddleware` – formats errors into consistent responses.

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
    C --> D[authMiddleware extracts token]
    D --> E[Clerk SDK validates token]
    E --> F[req.clerkId set]
    F --> G[Proceed to route handler]
```

## Validation Flow

```mermaid
flowchart TD
    A[Incoming request] --> B[validateMiddleware]
    B --> C{Zod schema validation}
    C -- Pass --> D[Controller]
    C -- Fail --> E[errorMiddleware → 400 response]
```

## Adding a New Feature

To add a new domain (e.g., tournaments):
1. Create a folder under `features/` (e.g., `features/tournaments/`).
2. Add the typical files:
   - `tournament.js`
   - `tournamentRepository.js`
   - `tournamentService.js`
   - `tournamentController.js`
   - `tournamentRoutes.js`
   - `tournamentValidation.js`
3. Register the router in `src/app.js`.

---

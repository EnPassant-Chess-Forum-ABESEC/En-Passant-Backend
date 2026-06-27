# Architecture Decisions

This document records important technical decisions.

---

# Decision 1: Feature-Based Architecture

## Date

June 2026

---

The application is expected to grow with multiple domains:

- Users
- Tournaments
- Matches
- Leaderboards
- Rating synchronization

Traditional MVC structures separate files by type:

```text
controllers/
models/
services/
```

As the project grows, locating related functionality becomes difficult.

---

Hence, using feature-based architecture.

```text
features/
├── users/
├── tournaments/
├── matches/
```

Each feature has its own MVC structure. For example:

- routes
- controllers
- services
- repositories
- models

---

## Benefits

- Easier feature ownership
- Better scalability
- Easier onboarding
- Reduced navigation overhead

---

# Decision 2: Clerk Authentication

---

Authentication is delegated to Clerk.

### Benefits

- Secure authentication flow
- Reduced backend complexity
- Easy frontend integration

---

# Decision 3: Zod Validation

All external input must be validated before reaching business logic.

### Benefits

- Type safety
- Consistent validation
- Cleaner controllers

# Development Guide

This guide explains the project structure and common development tasks.

---

# Feature Structure

The backend follows a feature-based architecture.

Example:

```text
features/
└── tournaments/
    ├── tournament.model.js
    ├── tournament.repository.js
    ├── tournament.service.js
    ├── tournament.controller.js
    ├── tournament.routes.js
    └── tournament.validation.js
```

Each file has a specific responsibility.

---

# Layer Responsibilities

## Controllers

Controllers should:

- Receive requests
- Call services
- Return responses

Avoid:

- Database queries
- Complex business logic

### Bad

```js
const user = await User.findOne(...)
```

### Good

```js
const user = await getCurrentUser();
```

---

## Services

Services contain business logic.

Examples:

- Permission checking
- Data processing
- Coordinating repositories
- Application workflows

---

## Repositories

Repositories communicate with the database only.

Examples:

```js
User.findOne();
User.create();
User.findOneAndUpdate();
```

---

## Validation

All external input must be validated using Zod.

Example:

```text
feature.validation.js
```

Validation should happen through middleware before controllers execute.

---

# Naming Conventions

## Files

```text
user.model.js
user.controller.js
user.service.js
user.repository.js
user.routes.js
user.validation.js
```

---

## Controllers

```js
getUser();
updateUser();
deleteUser();
```

---

## Services

```js
getUserProfile();
updateProfile();
```

---

## Repositories

```js
findUserById();
createUser();
updateUser();
```

---

# Adding a New API

Example: Adding tournament APIs.

## Step 1

Create feature folder:

```text
features/tournaments/
```

---

## Step 2

Create feature files:

```text
tournament.model.js
tournament.repository.js
tournament.service.js
tournament.controller.js
tournament.routes.js
tournament.validation.js
```

---

## Step 3

Create database model

```js
const tournamentSchema = new mongoose.Schema({});
```

---

## Step 4

Create repository methods

```js
findTournament();
createTournament();
```

---

## Step 5

Create service logic

```js
createTournament();
```

---

## Step 6

Create controller

```js
createTournamentController();
```

---

## Step 7

Create routes

```http
POST /api/tournaments
```

---

## Step 8

Register routes

```js
app.use("/api/tournaments", tournamentRoutes);
```

---

# Environment Variables

All environment variables must exist in:

```text
.env.example
```

Never commit:

```text
.env
```

---

# Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Default server:

```text
PORT=8080
```

---

# Debugging Checklist

Before debugging:

- Check server logs
- Check database connection
- Check authentication
- Check validation errors

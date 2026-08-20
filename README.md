# En-Passant Backend

This repository contains the backend API for the En-Passant's official website. Built with Node.js, Express, MongoDB, Redis (BullMQ), Clerk authentication, Cloudinary file storage.

<img src="/docs/diagrams/en_pass_backend_overview.svg"  alt="System Overview Diagram" width="100%">

## Services

| Service         | Routes             | Description                                                       |
| --------------- | ------------------ | ----------------------------------------------------------------- |
| **Users**       | `/api/users`       | Club member profiles, Clerk JIT provisioning                      |
| **Leaderboard** | `/api/leaderboard` | Redis sorted-set rankings by time control                         |
| **Sync**        | _(background)_     | BullMQ workers syncing chess ratings from Chess.com & Lichess     |
| **Recruitment** | `/api/recruitment` | Application lifecycle with strict state machine                   |
| **Payments**    | `/api/payments`    | Manual payment upload + admin verification logic                  |
| **Tasks**       | `/api/tasks`       | Department task definitions per recruitment year                  |
| **Submissions** | `/api/submissions` | File uploads to Cloudinary + signed URL fetch                     |
| **Admin**       | `/api/admin`       | Admin endpoints for managing applications, departments, and tasks |
| **Events**      | `/api/events`      | Club tournament and offline event management                      |
| **Contact**     | `/api/contact`     | Public contact form handling                                      |
| **Settings**    | `/api/settings`    | Dynamic global configurations                                     |
| **Webhooks**    | `/api/webhooks`    | External integrations (Clerk user sync, etc.)                     |
| **Email**       | _(background)_     | BullMQ workers for sending Resend notifications                   |
| **Storage**     | _(internal)_       | Cloudinary SDK wrapper for uploads and signed URLs                |

## Documentation

Dive deeper into our specific subsystems and guides:

- [API Documentation](./docs/API.md)
- [Architecture & Systems](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Error Handling](./docs/ERROR_HANDLING.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- Node.js (v14 or higher recommended)
- MongoDB (running locally or accessible via a remote connection string)
- Redis (running locally or accessible via a remote connection string)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Cache/Queue:** Redis (via BullMQ)
- **Authentication:** Clerk
- **File Storage:** Cloudinary

## Local Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/EnPassant-Chess-Forum-ABESEC/En-Passant-Backend.git
   cd En-Passant-Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the provided `.env.example` file to create your local `.env` file.

   ```bash
   cp .env.example .env
   ```

   Open the `.env` file and populate it with your specific configuration values, such as database connection strings, API keys, and other secrets.

4. **Start the Development Server:**
   This project uses `nodemon` to automatically restart the server upon file changes.
   ```bash
   npm run dev
   ```
   The server should now be running on port 8080 (or the port specified in your `.env` file).

## Using Docker

You can use Docker Compose to spin up Redis or the entire backend stack quickly.

### 1. Start only Redis

If you want to run the backend locally with `npm run dev` but need a local Redis instance for BullMQ queues:

```bash
docker-compose up -d redis
```

This will start Redis on `localhost:6379`. Make sure your `.env` file contains:
`REDIS_URL=redis://localhost:6379` or any other redis connection string such as redis cloud or upstash.

### 2. Start the Full Application

To run the Node.js Express Backend alongside Redis in Docker:

```bash
docker-compose up --build
```

This will build the backend image and start both services. The API will be accessible at `http://localhost:8080`.

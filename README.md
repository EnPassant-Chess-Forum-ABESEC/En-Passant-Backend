# En-Passant Backend

This repository contains the backend API for the En-Passant's official website. Current stack includes Node.js, Express, MongoDB, and Clerk for authentication.

## System Architecture

<img src="/docs/diagrams/High_level_Architecture.svg" alt="High Level System Architecture" width="100%"/>

## Documentation

Dive deeper into our specific subsystems and guides:

- [API Documentation](./docs/API.md)
- [Architecture & Systems](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Error Handling](./docs/ERROR_HANDLING.md)
- [Git Workflow](./docs/GIT_WORKFLOW.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [Architecture Decisions](./docs/DECISIONS.md)

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- Node.js (v14 or higher recommended)
- MongoDB (running locally or accessible via a remote connection string)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Cache/Queue:** Redis (via BullMQ)
- **Authentication:** Clerk

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

   Open the `.env` file and populate the Clerk keys (`CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) with the development credentials from your Clerk dashboard. Update the `MONGO_URI` if your local database uses a different port or name and ensure the `UPSTASH_REDIS_REST_URL` points to your Redis instance and is a TCP url.

4. **Start the Development Server:**
   This project uses `nodemon` to automatically restart the server upon file changes.
   ```bash
   npm run dev
   ```
   The server should now be running on port 8080 (or the port specified in your `.env` file).

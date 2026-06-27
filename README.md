# En-Passant Backend

This repository contains the backend API for the En-Passant's official website. Current stack includes Node.js, Express, MongoDB, and Clerk for authentication.

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- Node.js (v14 or higher recommended)
- MongoDB (running locally or accessible via a remote connection string)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** Clerk

## Folder Structure

```text
En-Passant-Backend/
├── .env.example
├── .gitignore
├── package.json         # Project metadata and dependencies
└── src/
    ├── app.js           # Main Express application setup and middleware
    ├── config/
    │   └── db.js        # MongoDB connection configuration
    └── server.js        # Entry point to start the server
```

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

   Open the `.env` file and populate the Clerk keys (`CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) with the development credentials from your Clerk dashboard. Update the `MONGO_URI` if your local database uses a different port or name.

4. **Start the Development Server:**
   This project uses `nodemon` to automatically restart the server upon file changes.
   ```bash
   npm run dev
   ```
   The server should now be running on port 8080 (or the port specified in your `.env` file).

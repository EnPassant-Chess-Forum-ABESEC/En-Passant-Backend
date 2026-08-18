# API Documentation

**Base URL:** `/api`

All protected routes require a valid Clerk JWT in the `Authorization` header:

```http
Authorization: Bearer <Clerk Token>
```

---

## Table of Contents

- [User APIs](#user-apis)
- [Leaderboard APIs](#leaderboard-apis)
- [Task APIs](#task-apis)
- [Recruitment APIs](#recruitment-apis)
- [Payment APIs](#payment-apis)
- [Submission APIs](#submission-apis)
- [Admin APIs](#admin-apis)
- [Admin System APIs](#admin-system-apis)
- [Events, Settings, and Contact APIs](#events-settings-and-contact-apis)
- [Error Reference](#error-reference)

---

# User APIs

## GET /api/users/me

Get the current authenticated user's profile.

> **Note:** If the user does not exist yet, it is automatically provisioned from Clerk (Just-In-Time).

**Auth:** Required

**Response `200`:**

```json
{
  "success": true,
  "user": {
    "_id": "...",
    "clerkId": "user_abc123",
    "userName": "johndoe",
    "collegeEmail": "john@college.edu",
    "branch": "CSE",
    "year": 2,
    "role": "user",
    "isOnboardingComplete": true,
    "chessAccounts": {
      "chessCom": {
        "username": "johndoe_chess",
        "ratings": { "rapid": 1200, "blitz": 1050, "bullet": 900 }
      },
      "lichess": {
        "username": "johndoe_li",
        "ratings": { "rapid": 1350, "blitz": 1100, "bullet": null }
      }
    },
    "lastSync": "2026-07-06T10:00:00.000Z"
  }
}
```

---

## POST /api/users/onboard

Complete the onboarding process for a new user.

**Auth:** Required  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "branch": "CSE",
  "year": 2,
  "chessAccounts": {
    "chessCom": { "username": "player123" }
  }
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Onboarding complete",
  "updatedUser": {
    "isOnboardingComplete": true
  }
}
```

---

## PUT /api/users/me

Update the authenticated user's profile.

**Auth:** Required  
**Content-Type:** `application/json`

**Request Body:** _(all fields optional)_

```json
{
  "branch": "ECE",
  "year": 3,
  "chessAccounts": {
    "lichess": { "username": "new_li_username" }
  }
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Profile updated"
}
```

---

# Leaderboard APIs

## GET /api/leaderboard

Retrieve the top-ranked players for a given time control.

**Auth:** Not required

**Query Parameters:**

| Parameter     | Type   | Default | Description                     |
| ------------- | ------ | ------- | ------------------------------- |
| `timeControl` | String | `rapid` | `rapid`, `blitz`, or `bullet`   |
| `limit`       | Number | `20`    | Max number of players to return |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "...",
      "username": "johndoe",
      "chessComUsername": "johndoe_chess",
      "branch": "CSE",
      "year": 2,
      "rating": 1500
    }
  ]
}
```

---

## GET /api/leaderboard/my-rank

Retrieve the authenticated user's rank and rating across all time controls.

**Auth:** Required

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "rapid": { "rank": 15, "rating": 1200 },
    "blitz": { "rank": 42, "rating": 1050 },
    "bullet": null
  }
}
```

---

# Task APIs

## GET /api/tasks?year=2026

Retrieve all tasks across all departments for a given year.

**Auth:** Required

**Response `200`:**

```json
{
  "tasks": [
    {
      "_id": "...",
      "departmentId": {
        "_id": "...",
        "name": "Web Development",
        "code": "WEBSITE"
      },
      "year": 2026,
      "title": "JWT Authentication Service",
      "summary": "Build a simple authentication service.",
      "instructions": "Upload to a public GitHub repo and submit the link.",
      "order": 1,
      "isRequired": true,
      "submission": {
        "acceptsText": false,
        "acceptsLinks": true,
        "acceptsFiles": false
      }
    }
  ]
}
```

---

## GET /api/tasks/department?departmentId=...&year=2026

Retrieve tasks for a specific department in a given year, ordered by `order`.

**Auth:** Required

**Response `200`:**

```json
{
  "tasks": [
    {
      /* task object */
    }
  ]
}
```

---

# Recruitment APIs

## POST /api/recruitment/apply

Submit a new application for the current recruitment year.

**Auth:** Required  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "preferredDepartmentId": "60d5ec4b1234567890123457",
  "secondaryDepartmentId": ["60d5ec4b1234567890123458"]
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Application created successfully",
  "newApplication": {
    "status": "DRAFT",
    "paymentStatus": "PENDING",
    /* ... */
  }
}
```

---

## GET /api/recruitment/my-application

Retrieve the authenticated user's application for the current year.

**Auth:** Required

**Response `200`:**

```json
{
  "success": true,
  "myApplication": {
    "status": "ACTIVE",
    "paymentStatus": "SUCCESS"
  }
}
```

---

# Payment APIs

> The platform uses a manual payment system where users upload transaction screenshots.

## POST /api/payments/manual

Submit a screenshot and UTR number for manual admin verification. Transitions the application to `PAYMENT_PENDING`.

**Auth:** Required
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `screenshot`: File (Image containing proof of payment)
- `utr`: String (The Unique Transaction Reference number)

**Response `200`:**

```json
{
  "success": true,
  "message": "Payment submitted manually and is pending verification.",
  "payment": {
    "status": "PENDING",
    "utr": "1234567890",
    /* ... */
  }
}
```

---

## GET /api/payments/:id/receipt

Retrieve the URL of a generated receipt for an approved payment.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "url": "/api/payments/:id/receipt.pdf"
}
```

## GET /api/payments/:id/receipt.pdf

Directly download or view the receipt PDF generated by the backend worker. Returns application/pdf content type.

**Auth:** Required

---

# Submission APIs

## POST /api/submissions/:applicationId/:taskId

Upload a submission for a specific task. Accepts multipart form data.

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**

- `files`: File (multi) - One or more files
- `text`: String - Free-text answer
- `links`: String[] - Array of URLs

**Response `200`:**

```json
{
  "success": true,
  "submission": {
    "text": "My answer here",
    "links": ["https://github.com/user/repo"],
    "files": []
  }
}
```

---

## GET /api/submissions/:applicationId/:taskId

Retrieve a submission and generate short-lived signed Cloudinary URLs for all uploaded files.

**Auth:** Required

---

# Admin APIs

## GET /api/admin/applications

Retrieve all applications, optionally filtered by `status`, `departmentId`, or `year`.

**Auth:** Required (Admin)

---

## PATCH /api/admin/applications/:id/status

Manually transition the status of an application.

**Auth:** Required (Admin)

---

## PATCH /api/admin/payments/:id/verify

Manually verify a user's uploaded payment receipt.

**Auth:** Required (Admin)
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "SUCCESS", 
  "reason": "" 
}
```
*Note: Set status to `SUCCESS` to approve, or `FAILED` to reject (with an optional `reason`).*

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment manually verified as SUCCESS"
}
```

---

## Admin Department, Task, and User Management

Standard CRUD endpoints exist under:
- `/api/admin/departments`
- `/api/admin/tasks`
- `/api/admin/users`

---

# Admin System APIs

Special administrative endpoints for background worker tasks and cleanup.

- **`POST /api/admin/applications/remind-drafts`**: Enqueues reminder emails for users who have a DRAFT application.
- **`POST /api/admin/users/sync-all`**: Queues an immediate sync of chess ratings for all users from external APIs.
- **`POST /api/admin/redis/clean`**: Purges Leaderboard sorted sets in Redis.
- **`POST /api/admin/cloud/clean`**: Purges all files from Cloudinary storage.

---

# Events, Settings, and Contact APIs

The following features have their own API namespaces with standard CRUD controllers:

- **Events (`/api/events`)**: Manage offline events, capacities, and deadlines. Admin required for POST/PATCH/DELETE.
- **Settings (`/api/settings`)**: Fetch global application deadlines (Start/End dates, Reveal dates).
- **Contact (`/api/contact`)**: Submit contact inquiries from the frontend and list/resolve them.
- **Webhooks (`/api/webhooks`)**: Receiver for Clerk authentication events and user provisioning.

---

# Error Reference

All errors are returned by the global error handler in a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `200`  | OK — request succeeded                                     |
| `201`  | Created — resource created                                 |
| `400`  | Bad Request — validation failed or invalid input           |
| `401`  | Unauthorized — missing or invalid JWT                      |
| `403`  | Forbidden — authenticated but not allowed (e.g. non-admin) |
| `404`  | Not Found — resource doesn't exist                         |
| `500`  | Internal Server Error — unexpected server-side error       |

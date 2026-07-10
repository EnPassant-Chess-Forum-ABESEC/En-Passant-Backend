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

------------ | ------ | ------- | -------------------- |
| `pageSize` | Number | 10 | Results per page |
| `pageNumber` | Number | 1 | Page index (1-based) |

**Example:** `GET /api/users/all?pageSize=20&pageNumber=2`

**Response `200`:**

```json
{
  "success": true,
  "users": [
    /* array of user objects */
  ]
}
```

---

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

**Example:** `GET /api/leaderboard?timeControl=blitz&limit=10`

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

**Query Parameters:**

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `year`    | Number | Yes      | Recruitment year e.g. 2026 |

**Response `200`:**

```json
{
  "tasks": [
    {
      "_id": "...",
      "departmentId": {
        "_id": "...",
        "name": "Web Development",
        "code": "WEBSITE",
        "description": "Full-stack development team"
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

**Query Parameters:**

| Parameter      | Type   | Required | Description                        |
| -------------- | ------ | -------- | ---------------------------------- |
| `departmentId` | String | Yes      | MongoDB ObjectId of the department |
| `year`         | Number | Yes      | Recruitment year e.g. 2026         |

**Response `200`:**

```json
{
  "tasks": [
    {
      "_id": "...",
      "departmentId": "...",
      "year": 2026,
      "title": "Redesign the poster",
      "summary": "Take an intentionally poor poster and make it professional.",
      "instructions": "Submit a Figma/Canva link and a PNG export.",
      "order": 1,
      "isRequired": true,
      "submission": {
        "acceptsText": false,
        "acceptsLinks": true,
        "acceptsFiles": true,
        "fileCategory": "image",
        "maxFiles": 2,
        "maxFileSize": 5242880
      }
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

> One application per user per year is enforced. A duplicate will return an error.

**Request Body:**

```json
{
  "preferredDepartmentId": "60d5ec4b1234567890123457",
  "secondaryDepartmentId": ["60d5ec4b1234567890123458"]
}
```

| Field                   | Type            | Required | Description                               |
| ----------------------- | --------------- | -------- | ----------------------------------------- |
| `preferredDepartmentId` | ObjectId String | Yes      | Primary department preference             |
| `secondaryDepartmentId` | ObjectId Array  | No       | Additional department choices (0 or more) |

**Response `201`:**

```json
{
  "success": true,
  "message": "Application created successfully",
  "newApplication": {
    "_id": "...",
    "userId": "...",
    "year": 2026,
    "status": "DRAFT",
    "paymentStatus": "PENDING",
    "preferredDepartmentId": {
      "_id": "...",
      "name": "Web Development",
      "code": "WEBSITE"
    },
    "secondaryDepartmentId": [],
    "createdAt": "2026-07-06T10:00:00.000Z",
    "updatedAt": "2026-07-06T10:00:00.000Z"
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
    "_id": "...",
    "userId": "...",
    "year": 2026,
    "status": "ACTIVE",
    "paymentStatus": "SUCCESS",
    "preferredDepartmentId": {
      "_id": "...",
      "name": "Content Writing",
      "code": "CONTENT"
    },
    "secondaryDepartmentId": [],
    "createdAt": "2026-07-06T10:00:00.000Z",
    "updatedAt": "2026-07-06T11:00:00.000Z"
  }
}
```

**Application Status Values:**

| Status               | Meaning                                      |
| -------------------- | -------------------------------------------- |
| `DRAFT`              | Application created, payment not initiated   |
| `PAYMENT_PENDING`    | Razorpay checkout session created            |
| `PAYMENT_FAILED`     | Payment failed or expired                    |
| `ACTIVE`             | Payment confirmed — task access unlocked     |
| `TASK_SUBMITTED`     | At least one submission received             |
| `TASK_NOT_SUBMITTED` | Submission window closed with no submissions |
| `UNDER_REVIEW`       | Admin is reviewing submissions               |
| `SHORTLISTED`        | Candidate shortlisted for interview          |
| `INTERVIEW`          | Interview round in progress                  |
| `SELECTED`           | Candidate selected                           |
| `REJECTED`           | Application rejected                         |

---

# Payment APIs

## POST /api/payments/checkout

Create a Razorpay order for the current user's application and transition the application to `PAYMENT_PENDING`.

**Auth:** Required

> The application must be in `DRAFT` status. If it's already `ACTIVE` or payment is `SUCCESS`, returns an error.

**Response `200`:**

```json
{
  "success": true,
  "order": {
    "id": "order_ABC123",
    "amount": 5000,
    "currency": "INR",
    "receipt": "recruitment_60d5ec4b1234567890123459",
    "notes": {
      "applicationId": "60d5ec4b1234567890123459"
    }
  }
}
```

Use the returned `order.id` on the client to open the Razorpay checkout modal.

---

## POST /api/payments/webhook

Razorpay webhook receiver. **Do not call this directly** — it is invoked by Razorpay after a payment event.

- Verifies the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`.
- On `payment.captured` event: calls `handleSuccessfulPayment()` to transition the application to `ACTIVE`.

**Response `200`:** `OK`

---

# Submission APIs

## POST /api/submissions/:applicationId/:taskId

Upload a submission for a specific task. Accepts multipart form data.

**Auth:** Required  
**Content-Type:** `multipart/form-data`

> The caller's application must be `ACTIVE` and the `applicationId` must match their own application.

**Route Parameters:**

| Parameter       | Description                             |
| --------------- | --------------------------------------- |
| `applicationId` | The MongoDB ObjectId of the application |
| `taskId`        | The MongoDB ObjectId of the task        |

**Form Fields:**

| Field   | Type         | Description                                      |
| ------- | ------------ | ------------------------------------------------ |
| `files` | File (multi) | One or more files (validated against task rules) |
| `text`  | String       | Free-text answer (if task `acceptsText: true`)   |
| `links` | String[]     | Array of URLs (if task `acceptsLinks: true`)     |

**Validation rules (enforced server-side per task definition):**

- `acceptsFiles` must be `true` to upload files
- `acceptsLinks` must be `true` to submit links
- `acceptsText` must be `true` to submit text
- Number of files must not exceed `maxFiles`
- Each file size must not exceed `maxFileSize` (bytes)
- File MIME type must match the task's `fileCategory` (`image`, `video`, or `raw`)

**Response `200`:**

```json
{
  "success": true,
  "submission": {
    "_id": "...",
    "applicationId": "...",
    "taskId": "...",
    "text": "My answer here",
    "links": ["https://github.com/user/repo"],
    "files": [
      {
        "publicId": "recruitment/2026/WEBSITE/appId/image_abc",
        "resourceType": "image",
        "format": "png",
        "originalName": "screenshot.png",
        "size": 204800
      }
    ]
  }
}
```

> Submitting again to the same `applicationId + taskId` **overwrites** the previous submission (upsert behaviour).

---

## GET /api/submissions/:applicationId/:taskId

Retrieve a submission and generate short-lived signed Cloudinary URLs for all uploaded files.

**Auth:** Required

> Only the owner of the application can view their own submission.

**Route Parameters:**

| Parameter       | Description                             |
| --------------- | --------------------------------------- |
| `applicationId` | The MongoDB ObjectId of the application |
| `taskId`        | The MongoDB ObjectId of the task        |

**Response `200`:**

```json
{
  "success": true,
  "submission": {
    "_id": "...",
    "applicationId": "...",
    "taskId": "...",
    "text": "My answer here",
    "links": ["https://github.com/user/repo"],
    "files": [
      {
        "publicId": "recruitment/2026/WEBSITE/appId/image_abc",
        "resourceType": "image",
        "format": "png",
        "originalName": "screenshot.png",
        "size": 204800,
        "url": "https://res.cloudinary.com/...?signature=...&expires_at=..."
      }
    ]
  }
}
```

> Signed URLs expire after **15 minutes**. Regenerate by calling this endpoint again.

**Response `404`:**

```json
{
  "success": false,
  "message": "submission not found"
}
```

---

# Admin APIs

## GET /api/admin/applications

Retrieve all applications, optionally filtered.

**Auth:** Required (Admin)

**Query Parameters:**

| Parameter      | Type   | Description                               |
| -------------- | ------ | ----------------------------------------- |
| `status`       | String | Filter by application status              |
| `departmentId` | String | Filter by preferred department (ObjectId) |
| `year`         | Number | Filter by year (e.g. 2026)                |

**Response `200`:**

```json
{
  "success": true,
  "message": "Applications fetched successfully",
  "applications": [
    /* array of applications */
  ]
}
```

---

## GET /api/admin/applications/:id

Retrieve a specific application along with all of its submissions and generated Cloudinary signed URLs.

**Auth:** Required (Admin)

**Response `200`:**

```json
{
  "success": true,
  "message": "Application fetched successfully",
  "application": {
    /* application details */
  },
  "submission": [
    /* array of submissions with files.url */
  ]
}
```

---

## PATCH /api/admin/applications/:id/status

Manually transition the status of an application.

**Auth:** Required (Admin)

**Request Body:**

```json
{
  "status": "SHORTLISTED"
}
```

> **Note:** The status must follow the valid state machine transitions (e.g. `TASK_SUBMITTED` -> `UNDER_REVIEW` -> `SHORTLISTED`).

**Response `200`:**

```json
{
  "success": true,
  "message": "Application status updated successfully",
  "updatedApplication": {
    /* updated app doc */
  }
}
```

---

## GET /api/admin/departments

Retrieve all available departments.

**Auth:** Required (Admin)

**Response `200`:**

```json
{
  "success": true,
  "message": "Departments fetched successfully",
  "departments": [
    /* array of department documents */
  ]
}
```

---

## POST /api/admin/departments

Create a new department.

**Auth:** Required (Admin)

**Request Body:**

```json
{
  "name": "Jokes",
  "code": "JOKES",
  "description": "This is the Jokes Department"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Department created successfully",
  "department": {
    "_id": "...",
    "name": "Jokes",
    "code": "JOKES",
    "description": "This is the Jokes Department",
    "__v": 0
  }
}
```

**Response `409`:**

```json
{
  "success": false,
  "message": "Department with this code already exists"
}
```

---

## POST /api/admin/tasks

Create a new task for a specific department.

**Auth:** Required (Admin)

**Request Body:**

```json
{
  "departmentId": "6a51040b29f7dd98626a8641",
  "year": 2026,
  "title": "Create memes related to chess",
  "summary": "You have to create memes that will be posted on the official page of the club as stories. The memes should be funny, chess-related, and must not contain vulgar or offensive content.",
  "instructions": [
    "Create 5 original chess memes.",
    "Keep all memes family-friendly and suitable for the official club page.",
    "Avoid offensive, political, or vulgar content.",
    "Share the final submissions as public links.",
    "Submit all links before the deadline."
  ],
  "order": 1,
  "isRequired": true,
  "submission": {
    "acceptsText": false,
    "acceptsLinks": true,
    "acceptsFiles": false
  }
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    /* new task object */
  }
}
```

---

## GET /api/admin/users

Retrieve a paginated list of all users.

**Auth:** Required (Admin)

**Query Parameters:**

| Parameter  | Type   | Default | Description      |
| ---------- | ------ | ------- | ---------------- |
| pageSize   | Number | 10      | Results per page |
| pageNumber | Number | 1       | Page to retrieve |

**Response 200:**

```json
{
  "success": true,
  "users": [
    /* array of user objects */
  ]
}
```

---

## GET /api/admin/users/:id

Retrieve a specific user by their MongoDB ObjectId.

**Auth:** Required (Admin)

**Response 200:**

```json
{
  "success": true,
  "user": {
    /* user object */
  }
}
```

---

## PATCH /api/admin/users/:id/role

Update a user's role (promote/demote).

**Auth:** Required (Admin)

**Request Body:**

```json
{
  "role": "admin" // or "user"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "updatedUser": {
    /* user object */
  }
}
```

---

## GET /api/admin/payments

Retrieve a paginated list of all transactions (the payment ledger).

**Auth:** Required (Admin)

**Response 200:**

```json
{
  "success": true,
  "payments": [
    /* array of payment objects */
  ],
  "metadata": {
    "pageNumber": 1,
    "pageSize": 10,
    "total": 50
  }
}
```

---

# Error Reference

## Standard Error Format

All errors are returned by the global error handler in a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

## Common HTTP Status Codes

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `200`  | OK — request succeeded                                     |
| `201`  | Created — resource created                                 |
| `400`  | Bad Request — validation failed or invalid input           |
| `401`  | Unauthorized — missing or invalid JWT                      |
| `403`  | Forbidden — authenticated but not allowed (e.g. non-admin) |
| `404`  | Not Found — resource doesn't exist                         |
| `500`  | Internal Server Error — unexpected server-side error       |

## Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "preferredDepartmentId", "message": "Required" }]
}
```

## Unauthorized (401)

```json
{
  "message": "Unauthorized"
}
```

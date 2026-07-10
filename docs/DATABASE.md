# Database Documentation

## Overview

**Database:** MongoDB  
**ODM:** Mongoose  
**Connection:** `src/config/db.js`  
**Environment variable:** `MONGO_URI`

---

## Collections

| Collection     | Model File                                  | Purpose                                     |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| `users`        | `features/users/user.model.js`              | Club member profiles and chess account data |
| `departments`  | `features/tasks/task.model.js`              | Static department/team definitions          |
| `tasks`        | `features/tasks/task.model.js`              | Recruitment task definitions per year       |
| `recruitments` | `features/recruitment/recruitment.model.js` | Candidate applications per year             |
| `submissions`  | `features/submissions/submission.model.js`  | Task submission records and Cloudinary refs |

---

## Users Collection

**Model:** `features/users/user.model.js`  
**Purpose:** Stores En-Passant club member information, linked to Clerk for authentication.

### Schema

| Field                  | Type    | Required | Default  | Notes                                           |
| ---------------------- | ------- | -------- | -------- | ----------------------------------------------- |
| `clerkId`              | String  | Yes      | —        | Clerk auth identifier. Unique, indexed.         |
| `userName`             | String  | No       | —        | Display name.                                   |
| `collegeEmail`         | String  | Yes      | —        | Official college email. Unique.                 |
| `branch`               | String  | No       | —        | Academic branch (e.g. `"CSE"`, `"ECE"`).        |
| `year`                 | Number  | No       | —        | Academic year. Allowed: `1–5` (5 = passed out). |
| `chessAccounts`        | Object  | No       | `{}`     | Nested chess platform data (see below).         |
| `lastSync`             | Date    | No       | —        | Timestamp of last rating sync.                  |
| `profilePictureUrl`    | String  | No       | —        | Avatar URL.                                     |
| `isOnboardingComplete` | Boolean | No       | `false`  | Whether the user finished profile setup.        |
| `role`                 | String  | No       | `"user"` | Permissions. Allowed: `"user"`, `"admin"`.      |

#### `chessAccounts` Sub-Schema

```
chessAccounts: {
  chessCom: {
    username: String,
    ratings: {
      blitz:  Number | null,
      bullet: Number | null,
      rapid:  Number | null,
    }
  },
  lichess: {
    username: String,
    ratings: {
      blitz:  Number | null,
      bullet: Number | null,
      rapid:  Number | null,
    }
  }
}
```

### Indexes

| Index          | Type   | Purpose                       |
| -------------- | ------ | ----------------------------- |
| `clerkId`      | Unique | Fast lookup by Clerk identity |
| `collegeEmail` | Unique | Enforce one account per email |

---

## Departments Collection

**Model:** `features/tasks/task.model.js`  
**Purpose:** Static department/team definitions. Seeded once per recruitment year. Rarely mutated.

### Schema

| Field         | Type   | Required | Notes                                                                                                  |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `name`        | String | Yes      | Full display name. Trimmed.                                                                            |
| `code`        | String | Yes      | Short unique identifier. Examples: `"WEBSITE"`, `"CONTENT"`, `"GRAPHICS"`, `"MEDIA"`. Indexed, unique. |
| `description` | String | No       | Human-readable summary of the department's role.                                                       |

### Indexes

| Index  | Type   | Purpose                          |
| ------ | ------ | -------------------------------- |
| `code` | Unique | One department per code globally |

---

## Tasks Collection

**Model:** `features/tasks/task.model.js`  
**Purpose:** Recruitment task definitions per department per year. Tasks can differ every year without touching code — they are seeded via script.

### Schema

| Field          | Type            | Required | Notes                                                   |
| -------------- | --------------- | -------- | ------------------------------------------------------- |
| `departmentId` | ObjectId        | Yes      | Ref: `Department`. Compound indexed with `year`.        |
| `year`         | Number          | Yes      | Recruitment year. e.g. `2026`.                          |
| `title`        | String          | Yes      | Short task name. Trimmed.                               |
| `summary`      | String          | Yes      | One-line description shown in task cards.               |
| `instructions` | Array of String | Yes      | Full instructions shown to the applicant.               |
| `order`        | Number          | Yes      | Display order within a department (1, 2, 3...).         |
| `isRequired`   | Boolean         | No       | Default `true`. `false` = optional bonus task.          |
| `submission`   | Object          | No       | Rules for what responses this task accepts (see below). |

#### `submission` Sub-Schema

| Field          | Type    | Default | Notes                                                                                                      |
| -------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `acceptsText`  | Boolean | `false` | Whether a free-text response is accepted.                                                                  |
| `acceptsLinks` | Boolean | `false` | Whether a URL/link is accepted (e.g. GitHub, Figma).                                                       |
| `acceptsFiles` | Boolean | `false` | Whether file uploads are accepted.                                                                         |
| `fileCategory` | String  | —       | Required when `acceptsFiles: true`. Allowed: `"image"`, `"video"`, `"raw"`. Controls MIME type validation. |
| `maxFiles`     | Number  | —       | Maximum number of files per submission.                                                                    |
| `maxFileSize`  | Number  | —       | Maximum size in **bytes** per file (e.g. `5242880` = 5 MB).                                                |

### Indexes

| Index                           | Type     | Purpose                              |
| ------------------------------- | -------- | ------------------------------------ |
| `{ departmentId, year, order }` | Compound | Fast ordered task list per dept/year |

---

## Recruitments Collection

**Model:** `features/recruitment/recruitment.model.js`  
**Purpose:** Tracks a candidate's application through the full recruitment lifecycle. One per user per year.

### Schema

| Field                   | Type       | Required | Default   | Notes                                         |
| ----------------------- | ---------- | -------- | --------- | --------------------------------------------- |
| `userId`                | ObjectId   | Yes      | —         | Ref: `User`. Compound unique with `year`.     |
| `year`                  | Number     | Yes      | Current   | Defaults to `new Date().getFullYear()`.       |
| `status`                | String     | Yes      | `DRAFT`   | See state machine below.                      |
| `paymentStatus`         | String     | Yes      | `PENDING` | `PENDING`, `SUCCESS`, or `FAILED`.            |
| `preferredDepartmentId` | ObjectId   | Yes      | —         | Ref: `Department`. Primary department choice. |
| `secondaryDepartmentId` | ObjectId[] | No       | `[]`      | Ref: `Department`. Additional choices.        |

#### Application Status State Machine

All status transitions are validated by `recruitment.service.js` against the `VALID_TRANSITIONS` map:

```
DRAFT
  └─→ PAYMENT_PENDING
        ├─→ ACTIVE             (payment.captured webhook)
        └─→ PAYMENT_FAILED
              └─→ PAYMENT_PENDING  (retry)

ACTIVE
  ├─→ TASK_SUBMITTED
  │     └─→ UNDER_REVIEW
  │           ├─→ SHORTLISTED
  │           │     └─→ INTERVIEW
  │           │           ├─→ SELECTED ✓
  │           │           └─→ REJECTED ✗
  │           └─→ REJECTED ✗
  └─→ TASK_NOT_SUBMITTED
        └─→ REJECTED ✗
```

### Indexes

| Index                       | Type     | Purpose                               |
| --------------------------- | -------- | ------------------------------------- |
| `{ userId, year }`          | Unique   | One application per user per year     |
| `{ status, paymentStatus }` | Compound | Efficient filtering by pipeline stage |

---

## Submissions Collection

**Model:** `features/submissions/submission.model.js`  
**Purpose:** Stores a candidate's response to a single task. Each document can contain text, links, and/or Cloudinary file references.

### Schema

| Field           | Type     | Required | Notes                                              |
| --------------- | -------- | -------- | -------------------------------------------------- |
| `applicationId` | ObjectId | Yes      | Ref: `Recruitment`. Compound unique with `taskId`. |
| `taskId`        | ObjectId | Yes      | Ref: `Task`. Compound unique with `applicationId`. |
| `text`          | String   | No       | Free-text answer.                                  |
| `links`         | String[] | No       | Array of submitted URLs.                           |
| `files`         | Object[] | No       | Array of uploaded file references (see below).     |

#### `files` Array — File Object

| Field          | Type   | Required | Notes                                                                              |
| -------------- | ------ | -------- | ---------------------------------------------------------------------------------- |
| `publicId`     | String | Yes      | Cloudinary `public_id`. Path: `recruitment/{year}/{DEPT_CODE}/{applicationId}/...` |
| `resourceType` | String | Yes      | Cloudinary resource type. Allowed: `"image"`, `"video"`, `"raw"`.                  |
| `format`       | String | Yes      | File format string returned by Cloudinary (e.g. `"png"`, `"mp4"`, `"pdf"`).        |
| `originalName` | String | Yes      | Original filename from the user's device.                                          |
| `size`         | Number | Yes      | File size in bytes.                                                                |

> **Note:** Files are stored on **Cloudinary**, not in MongoDB. Only metadata is saved here. To access a file, call `GET /api/submissions/:appId/:taskId` which generates signed, time-limited URLs.

### Indexes

| Index                       | Type   | Purpose                                                    |
| --------------------------- | ------ | ---------------------------------------------------------- |
| `{ applicationId, taskId }` | Unique | One submission document per application+task (upsert-safe) |

---

## Payments Collection

**Model:** features/payments/payment.model.js  
**Purpose:** Tracks Razorpay orders and their payment status. Used for the admin payment ledger and audit logs.

### Schema

| Field            | Type     | Required | Default  | Notes                                             |
| ---------------- | -------- | -------- | -------- | ------------------------------------------------- |
| userId           | ObjectId | Yes      | —        | Ref: User. The user making the payment.           |
| applicationId    | ObjectId | No       | —        | Ref: Recruitment. The application being paid for. |
| purpose          | String   | No       | —        | purpose for payment, recruitment, event, etc      |
| amount           | Number   | Yes      | —        | The amount in the smallest currency unit (paise). |
| status           | String   | Yes      | PENDING  | PENDING, SUCCESS, or FAILED.                      |
| gateway          | String   | No       | RAZORPAY | gateway selected for payment                      |
| gatewayOrderId   | String   | Yes      | —        | The order ID generated by Razorpay. Unique.       |
| gatewayPaymentId | String   | No       | —        | The payment ID generated upon successful payment. |

### Indexes

| Index              | Type   | Purpose                                       |
| ------------------ | ------ | --------------------------------------------- |
| { gatewayOrderId } | Unique | Lookup by order ID during webhook processing. |

---

## Redis Usage

Redis is used by **BullMQ** for job queue management (not direct data storage). It is **not** a persistence layer.

| Key Pattern / Queue          | Purpose                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `sync-queue` (BullMQ)        | Background jobs: sync a user's chess ratings from external APIs                 |
| `recruitment-queue` (BullMQ) | Background jobs: auto-expire `PAYMENT_PENDING` applications older than 24 hours |
| `leaderboard:{timeControl}`  | Redis Sorted Set: maps `userId → rating` for fast rank queries                  |

### Leaderboard Sorted Sets

The leaderboard service uses three Redis Sorted Sets, one per time control:

```
ZADD leaderboard:rapid  1200 "userId123"
ZADD leaderboard:blitz  1050 "userId123"
ZADD leaderboard:bullet  900 "userId123"
```

- **`ZREVRANGE`** — returns top N user IDs for the leaderboard page
- **`ZREVRANK`** — returns a specific user's rank (0-indexed → shifted to 1-indexed)
- User details are fetched from MongoDB using the returned IDs (hydration step)

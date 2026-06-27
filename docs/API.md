# API Documentation

**Base URL:** `/api`

---

# Authentication

All protected routes require a valid Clerk JWT token.

```http
Authorization: Bearer <Clerk Token>
```

---

# User APIs

## Get Current User Profile

Retrieve the profile information of the currently authenticated user.

> **Note on User Creation:** If the user does not exist in the database yet, this endpoint (like all protected endpoints) will automatically fetch their details from Clerk and create their profile on the fly (Just-In-Time Provisioning).

### Endpoint

```http
GET /api/users/me
```

### Authentication

Required

### Headers

```http
Authorization: Bearer <Clerk Token>
```

### Response

**Status: 200 OK**

```json
{
  "success": true,
  "user": {
    // user object
  }
}
```

---

## Onboard User Profile

Complete the onboarding process for a new user. This requires mandatory fields and marks the user as onboarded.

### Endpoint

```http
POST /api/users/onboard
```

### Authentication

Required

### Headers

```http
Authorization: Bearer <Clerk Token>
Content-Type: application/json
```

### Request Body

```json
{
  "branch": "CSE",
  "year": 2,
  "chessAccounts": {
    "chessCom": {
      "username": "player123"
    }
  }
}
```

### Response

**Status: 200 OK**

```json
{
  "success": true,
  "message": "Onboarding complete",
  "updatedUser": {
    // ...
    "isOnboardingComplete": true
  }
}
```

---

## Update Current User Profile

Update the profile information of the currently authenticated user.

### Endpoint

```http
PUT /api/users/me
```

### Authentication

Required

### Headers

```http
Authorization: Bearer <Clerk Token>
Content-Type: application/json
```

### Request Body

```json
{
  "branch": "CSE",
  "year": 2,
  "chessAccounts": {
    "chessCom": {
      "username": "player123"
    }
  }
}
```

### Response

**Status: 200 OK**

```json
{
  "success": true,
  "message": "Profile updated"
  // updated user object
}
```

---

## Get All Users (Admin)

Retrieve a paginated list of all users.

### Endpoint

```http
GET /api/users/all?pageSize=10&pageNumber=1
```

### Authentication

Required (Admin Role)

### Headers

```http
Authorization: Bearer <Clerk Token>
```

### Response

**Status: 200 OK**

```json
{
  "success": true,
  "users": [
    // array of user objects
  ]
}
```

---

## Get User By ID (Admin)

Retrieve a specific user profile by their MongoDB ObjectId.

### Endpoint

```http
GET /api/users/:id
```

### Authentication

Required (Admin Role)

### Headers

```http
Authorization: Bearer <Clerk Token>
```

### Response

**Status: 200 OK**

```json
{
  "success": true,
  "user": {
    // user object
  }
}
```

---

# Error Responses

## Unauthorized

Returned when the authentication token is missing or invalid.

### Status

```http
401 Unauthorized
```

### Response

```json
{
  "message": "Unauthorized"
}
```

---

## Validation Error

Returned when the request body fails validation.

### Status

```http
400 Bad Request
```

### Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Response Conventions

| Field     | Type      | Description                                  |
| --------- | --------- | -------------------------------------------- |
| `success` | `boolean` | Indicates whether the request was successful |
| `message` | `string`  | Human-readable response message              |
| `user`    | `object`  | User profile object                          |
| `errors`  | `array`   | Validation error details                     |

---

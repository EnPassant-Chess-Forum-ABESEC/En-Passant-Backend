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

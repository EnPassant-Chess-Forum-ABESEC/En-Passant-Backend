# Error Handling

The backend uses centralized error handling.

Location:

```text
src/middleware/errorMiddleware.js
```

---

# Error Flow

```text
Controller
    ↓
throws error
    ↓
next(error)
    ↓
errorMiddleware
    ↓
Response
```

Example:

```js
try {
  // logic
} catch (error) {
  next(error);
}
```

---

# Standard Error Response

All errors should follow:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# Validation Errors

Validation is handled using Zod.

Status:

```http
400 Bad Request
```

Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Authentication Errors

Status:

```http
401 Unauthorized
```

Response:

```json
{
  "message": "Unauthorized"
}
```

---

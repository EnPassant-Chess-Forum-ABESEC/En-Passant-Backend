# Error Handling

The backend uses centralized error handling.

Location:

```text
src/middleware/error.middleware.js
```

---

# Error Flow

```text
Controller / Service
    ↓
throw new AppError("Message", Status)
    ↓
errorMiddleware
    ↓
Response
```

Example using the central `AppError` class (`src/utils/AppError.js`):

```js
import { AppError } from "../utils/AppError.js";

export const someControllerFunction = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
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

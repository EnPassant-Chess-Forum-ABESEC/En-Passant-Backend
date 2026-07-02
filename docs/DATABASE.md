# Database Documentation

## Database

The project uses MongoDB with Mongoose as the ODM.

Connection: src/config/db.js
Environment variable: MONGO_URI

---

# Collections

## Users Collection

Model: features/users/user.model.js
Purpose: Stores En-Passant club member information.

## User Schema

### clerkId

Type: String
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

### userName

Type: String
Purpose: Member display name.

---

### collegeEmail

Type: String
Purpose: Official college email address.
Properties:

- Required
- Unique

---

### branch

Type: String
Purpose: Academic branch of member.

---

### year

Type: Number
Purpose: Current academic year.
Allowed: 1-5 (5 for passed out members)

---

### chessAccounts

Stores external chess platform accounts.

Supported platforms:

## Chess.com

Fields:
username: Chess.com user name
ratings:

- blitz
- bullet
- rapid

## Lichess

Fields:
username: Lichess user name
ratings:

- blitz
- bullet
- rapid

---

### lastSync

Type: Date
Purpose: Stores last chess rating synchronization time.

---

### profilePictureUrl

Type: String
Purpose: Profile image URL.

---

### isOnboardingComplete

Type: Boolean
Purpose: Tracks whether user completed profile setup.

---

### role

Type: String
Allowed values:

- user
- admin

Purpose: Controls permissions.

---

## departmentsCollection

Model: features/tasks/task.model.js
Purpose: Stores En-Passant club member information.

## departmentSchema

### code

Type: String
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

## year

Type: Number
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

## taskCollection

Model: features/tasks/task.model.js
Purpose: Stores En-Passant club member information.

## taskSchema

### departmentId

Type: String
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

### year

Type: Number
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

### order

Type: Number
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

### submissionType

Type: String
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

### isRequired

Type: Boolean
Purpose: Stores Clerk authentication identifier.
Properties:

- Required
- Unique
- Indexed

---

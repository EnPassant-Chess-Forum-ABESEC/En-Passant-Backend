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

## Departments Collection

Model: `features/tasks/task.model.js`
Purpose: Stores static department/team definitions for the club (e.g. Technical, Design, Media). Rarely changes.

### name

Type: String
Purpose: Full display name of the department.
Properties:

- Required
- Trimmed

---

### code

Type: String
Purpose: Short unique identifier for the department. Used for filtering and internal references.
Examples: `"TECH"`, `"DESIGN"`, `"MEDIA"`
Properties:

- Required
- Unique
- Indexed

---

### description

Type: String
Purpose: Optional description of what the department does.

---

## Tasks Collection

Model: `features/tasks/task.model.js`
Purpose: Stores recruitment task definitions per department per year. Tasks change annually and are set by coordinators through the admin panel — no code deployment needed.

### departmentId

Type: ObjectId (ref: Department)
Purpose: Links the task to its owning department.
Properties:

- Required
- Indexed (compound with `year`)

---

### year

Type: Number
Purpose: The recruitment year this task belongs to. Allows tasks to evolve year-to-year without affecting past records.
Example: `2026`
Properties:

- Required
- Indexed (compound with `departmentId`)

---

### title

Type: String
Purpose: Short name of the task shown to applicants.
Properties:

- Required
- Trimmed

---

### description

Type: String
Purpose: Full task description — what the applicant needs to build, design, or submit.
Properties:

- Required

---

### order

Type: Number
Purpose: Display order of tasks within a department (1, 2, 3...). Controls the sequence shown to applicants.
Properties:

- Required

---

### submissionType

Type: String
Allowed values: `"file"`, `"link"`, `"both"`
Purpose: Specifies what kind of submission is accepted for this task. `"file"` for uploads, `"link"` for GitHub/Figma/YouTube links, `"both"` for either.
Properties:

- Required

---

### isRequired

Type: Boolean
Default: `true`
Purpose: Whether the task must be completed for the application to be considered. `false` makes it optional.

---

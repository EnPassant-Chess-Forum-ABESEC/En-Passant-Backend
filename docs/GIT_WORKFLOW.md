# Git Workflow

This project follows a branch-based workflow.

The `main` branch should always contain stable code.

---

# Branch Structure

```text
main
  │
development
  │
feature branches
```

---

# Branch Rules

Never directly push to:

```text
main
```

All changes must go through pull requests.

---

# Branch Naming

## Features

```text
feature/<feature-name>
```

Examples:

```text
feature/user-profile
feature/tournament-system
feature/leaderboard
```

---

## Bug Fixes

```text
fix/<bug-name>
```

Examples:

```text
fix/authentication-error
fix/profile-validation
```

---

## Documentation

```text
docs/<change>
```

Example:

```text
docs/api-documentation
```

---

## Maintenance

```text
chore/<change>
```

Example:

```text
chore/update-dependencies
```

---

# Commit Messages

Use descriptive commits.

Format:

```text
type: description
```

Examples:

```text
feat: add user profile API
fix: resolve clerk middleware issue
docs: update architecture guide
refactor: improve user service
```

---

# Pull Request Rules

Before merging:

- Code compiles
- APIs are tested
- No debugging logs remain
- Documentation is updated if required

At least one reviewer must approve the changes.

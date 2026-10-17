# Solo Event Registration & Event Data API Specification

This documentation details both the **Event Fetching API** (to load event details, divisions, rating brackets, and deadline into the frontend) and the **Solo Event Registration API** (to submit and persist user registrations in the backend database).

---

## 1. Quick Reference & Setup

- **Backend Base URL**: `${NEXT_PUBLIC_API_URL}` (e.g. `http://localhost:8080/api`)
- **Event Fetching (Public)**: No authentication header required.
- **Registration Actions (Protected)**: Requires Clerk authentication header:
  ```http
  Authorization: Bearer <clerk_token>
  Content-Type: application/json
  ```
- **Recommended Frontend Hook**: Use `useApi()` from `@/lib/api` for authenticated registration calls.

---

## 2. API Endpoints Overview

| Action | Method | URL | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch All Events** | `GET` | `/api/events` | No (Public) | Returns all events (used to find active/upcoming event) |
| **Fetch Event by ID** | `GET` | `/api/events/:id` | No (Public) | Returns single event details by its MongoDB `_id` |
| **Register (Solo)** | `POST` | `/api/event-registrations/:eventId/register` | Yes | Saves current user's solo registration in database |
| **Check My Registration** | `GET` | `/api/event-registrations/:eventId/my-registration` | Yes | Checks if current user is already registered |
| **Cancel Registration** | `DELETE` | `/api/event-registrations/:eventId/delete` | Yes | Withdraws registration before deadline |

---

## 3. Fetching Event Data (Public API)

Before showing the registration form, fetch the event data to dynamically populate the sections, rating brackets, time formats, and deadline.

### 3.1 Fetch Single Event by ID
- **Method**: `GET`
- **URL**: `/api/events/:id`
- **Path Parameter**: `:id` — The MongoDB ObjectId of the event.
- **Auth**: Public (no token needed).

#### Frontend Fetch Call:
```javascript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const res = await fetch(`${apiUrl}/events/${eventId}`);
const data = await res.json();
const event = data.event;
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "event": {
    "_id": "6ad20250a2f66658e43ccf6f",
    "title": "ACC",
    "root": "ACC",
    "description": "The ABES Chess Championship (ACC) stands as the institute's premier collegiate chess tournament...",
    "format": "Swiss League & Knockout Finals\n\n• Stage 1 — Swiss League Phase...",
    "timeControl": "10 + 5",
    "participationMode": "solo",
    "status": "upcoming",
    "startDate": "2026-10-18T00:00:00.000Z",
    "endDate": "2026-10-24T00:00:00.000Z",
    "registrationDeadline": "2026-10-19T00:00:00.000Z",
    "sections": [
      {
        "name": "open",
        "title": "Open Championship",
        "description": "Open Section with rating-tiered divisions",
        "timeControl": "10 + 5",
        "brackets": [
          {
            "name": "beginner",
            "minRating": 0,
            "maxRating": 899,
            "range": "< 900 ELO",
            "totalRounds": 5,
            "timeControl": "10 + 5"
          },
          {
            "name": "intermediate",
            "minRating": 900,
            "maxRating": 1500,
            "range": "900 - 1500 ELO",
            "totalRounds": 5,
            "timeControl": "10 + 5"
          },
          {
            "name": "advanced",
            "minRating": 1501,
            "maxRating": 3000,
            "range": "1500+ ELO",
            "totalRounds": 5,
            "timeControl": "15 + 2"
          }
        ]
      },
      {
        "name": "women",
        "title": "Women's Championship",
        "description": "Women Championship Section",
        "timeControl": "10 + 5",
        "brackets": [
          {
            "name": "open",
            "minRating": 0,
            "maxRating": 3000,
            "range": "Open Rating",
            "totalRounds": 5,
            "timeControl": "10 + 5"
          }
        ]
      },
      {
        "name": "interclub",
        "title": "Inter-College Club",
        "description": "Inter-College Club Solo Showdown",
        "timeControl": "10 + 5",
        "brackets": [
          {
            "name": "open",
            "minRating": 0,
            "maxRating": 3000,
            "range": "Open Rating",
            "totalRounds": 5,
            "timeControl": "10 + 5"
          }
        ]
      }
    ],
    "prizes": {
      "label": "Prizes & Accolades",
      "items": []
    },
    "createdAt": "2026-10-16T10:54:08.000Z",
    "updatedAt": "2026-10-16T10:54:08.000Z"
  }
}
```

---

### 3.2 Fetch All Events (To get active / upcoming event)
- **Method**: `GET`
- **URL**: `/api/events`
- **Auth**: Public (no token needed).

#### Frontend Fetch Call:
```javascript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const res = await fetch(`${apiUrl}/events`, { cache: "no-store" });
const data = await res.json();
const events = data.events || [];

const currentEvent =
  events.find(
    (e) =>
      e.status === "active" ||
      e.status === "in_progress" ||
      e.status === "upcoming"
  ) || events[0];
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "events": [
    {
      "_id": "6ad20250a2f66658e43ccf6f",
      "title": "ACC",
      "root": "ACC",
      "participationMode": "solo",
      "status": "upcoming",
      "registrationDeadline": "2026-10-19T00:00:00.000Z",
      "sections": [ ... ]
    }
  ]
}
```

---

## 4. Key Fields Needed by Frontend Registration UI

From the fetched `event` object, extract these fields to drive the registration experience:

| Field Path | Type | How Frontend Uses It |
| :--- | :--- | :--- |
| `event._id` | `String` | Passed as `:eventId` in the registration POST URL |
| `event.title` | `String` | Tournament title displayed in header (e.g. `"ACC"`) |
| `event.participationMode` | `String` | Confirms `"solo"` mode |
| `event.registrationDeadline` | `ISO Date` | Check if registration is open: `new Date() <= new Date(event.registrationDeadline)` |
| `event.sections` | `Array` | List of sections. Map over this to create Section selector buttons/tabs |
| `section.name` | `String` | **Value to send** in registration payload (e.g. `"open"`, `"women"`) |
| `section.title` | `String` | Display label (e.g. `"Open Championship"`, `"Women's Championship"`) |
| `section.brackets` | `Array` | List of rating tiers within the selected section |
| `bracket.name` | `String` | **Value to send** in registration payload (e.g. `"beginner"`, `"advanced"`) |
| `bracket.range` | `String` | Eligibility badge (e.g. `"< 900 ELO"`, `"1500+ ELO"`) |
| `bracket.timeControl` | `String` | Time format badge (e.g. `"10 + 5"`, `"15 + 2"`) |

---

## 5. Register For Event (Solo)

### Endpoint
`POST /api/event-registrations/:eventId/register`

### Request Headers
```http
Authorization: Bearer <clerk_token>
Content-Type: application/json
```

### Request Payload
```json
{
  "section": "open",
  "bracket": "beginner",
  "participation": {
    "participationType": "solo"
  }
}
```

### Field Breakdown:
- `section` *(string, required)*: Matches chosen `section.name` (e.g., `"open"`, `"women"`, `"interclub"`).
- `bracket` *(string, required)*: Matches chosen `bracket.name` (e.g., `"beginner"`, `"intermediate"`, `"advanced"`, `"open"`).
- `participation.participationType` *(string, required)*: Must be `"solo"`.

---

### Backend Logic & Persistence
When called, the backend:
1. Validates event exists and `event.participationMode === "solo"`.
2. Validates `new Date() <= new Date(event.registrationDeadline)` (rejects with `400 Bad Request` if deadline passed).
3. Validates user has not already registered for this event (rejects with `409 Conflict` if duplicate).
4. Creates and saves document to MongoDB `EventRegistration` collection:
   ```json
   {
     "_id": "6ad20250a2f66658e43ccfab",
     "eventId": "6ad20250a2f66658e43ccf6f",
     "registeredBy": "6acbb1094a88052e8266d70a",
     "registrationType": "solo",
     "section": "open",
     "bracket": "beginner",
     "status": "pending",
     "paymentStatus": "pending",
     "createdAt": "2026-10-17T01:30:00.000Z"
   }
   ```
5. Returns `200 OK` with the created registration.

---

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Registration created successfully",
  "registration": {
    "_id": "6ad20250a2f66658e43ccfab",
    "eventId": "6ad20250a2f66658e43ccf6f",
    "registeredBy": "6acbb1094a88052e8266d70a",
    "registrationType": "solo",
    "section": "open",
    "bracket": "beginner",
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2026-10-17T01:30:00.000Z",
    "updatedAt": "2026-10-17T01:30:00.000Z"
  }
}
```

---

## 6. Check Current User Registration Status

Call on page mount to see if user is already registered.

### Endpoint
`GET /api/event-registrations/:eventId/my-registration`

- **If Registered (`200 OK`)**: Returns registration object. Show "You are Registered" card.
- **If Not Registered (`404 Not Found`)**: Returns `{ "success": false, "message": "Registration not found" }`. Show registration form.

---

## 7. Cancel / Withdraw Registration (Optional)

### Endpoint
`DELETE /api/event-registrations/:eventId/delete`

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Registration deleted successfully"
}
```

---

## 8. Error Codes Reference

| HTTP Status | API Message | Frontend Feedback |
| :--- | :--- | :--- |
| `401 Unauthorized` | `"Unauthorized"` | Redirect user to Clerk sign in |
| `409 Conflict` | `"Duplicate registration"` | User already registered; show status card |
| `400 Bad Request` | `"Registration deadline has passed for the event"` | Display registration closed notice |
| `404 Not Found` | `"Event not found"` | Invalid event ID |

---

## 9. Complete Frontend React Implementation

This component demonstrates the full workflow: fetching event data, checking existing registration, and submitting the solo registration:

```jsx
"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export default function SoloEventRegistrationPage({ eventId }) {
  const { fetchApi } = useApi();
  const [event, setEvent] = useState(null);
  const [existingReg, setExistingReg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState("");
  const [selectedBracket, setSelectedBracket] = useState("");

  useEffect(() => {
    async function init() {
      try {
        setPageLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const eventRes = await fetch(`${apiUrl}/events/${eventId}`);
        const eventData = await eventRes.json();
        const ev = eventData?.event;
        setEvent(ev);

        if (ev?.sections?.length > 0) {
          const firstSec = ev.sections[0];
          setSelectedSection(firstSec.name);
          if (firstSec.brackets?.length > 0) {
            setSelectedBracket(firstSec.brackets[0].name);
          }
        }

        try {
          const regRes = await fetchApi(`/event-registrations/${eventId}/my-registration`);
          if (regRes?.registration) {
            setExistingReg(regRes.registration);
          }
        } catch {
        }
      } catch (err) {
        toast.error("Failed to load event details");
      } finally {
        setPageLoading(false);
      }
    }

    if (eventId) init();
  }, [eventId, fetchApi]);

  const currentSectionObj =
    event?.sections?.find((s) => s.name === selectedSection) || event?.sections?.[0];
  const bracketsList = currentSectionObj?.brackets || [];

  const isDeadlinePassed =
    event?.registrationDeadline && new Date() > new Date(event.registrationDeadline);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isDeadlinePassed) {
      toast.error("Registration deadline has passed");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        section: selectedSection,
        bracket: selectedBracket,
        participation: {
          participationType: "solo",
        },
      };

      const res = await fetchApi(`/event-registrations/${eventId}/register`, {
        method: "POST",
        body: payload,
      });

      setExistingReg(res.registration);
      toast.success("Successfully registered for " + event.title + "!");
    } catch (err) {
      toast.error(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your registration?")) return;
    setLoading(true);
    try {
      await fetchApi(`/event-registrations/${eventId}/delete`, {
        method: "DELETE",
      });
      setExistingReg(null);
      toast.success("Registration cancelled");
    } catch (err) {
      toast.error(err.message || "Failed to cancel registration");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center text-rose-400">
        Event not found.
      </div>
    );
  }

  if (existingReg) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-slate-900 border border-emerald-500/40 rounded-3xl text-white">
        <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold mb-3">
          Confirmed Registration
        </div>
        <h2 className="text-2xl font-bold">You are registered for {event.title}!</h2>
        <div className="mt-4 p-4 bg-slate-800/60 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Division</span>
            <span className="font-semibold uppercase">{existingReg.section}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rating Bracket</span>
            <span className="font-semibold uppercase">{existingReg.bracket}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="font-medium text-emerald-400 capitalize">{existingReg.status}</span>
          </div>
        </div>

        {!isDeadlinePassed && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="mt-6 w-full py-2.5 border border-rose-500/40 text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors text-sm font-medium"
          >
            {loading ? "Cancelling..." : "Withdraw Registration"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#0d1117] border border-slate-800 rounded-3xl text-white">
      <h2 className="text-2xl font-bold">Register for {event.title}</h2>
      <p className="text-slate-400 text-sm mt-1">
        Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
      </p>

      {isDeadlinePassed ? (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          Registration for this event has closed.
        </div>
      ) : (
        <form onSubmit={handleRegister} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              1. Choose Section
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {event.sections?.map((sec) => (
                <button
                  type="button"
                  key={sec.name}
                  onClick={() => {
                    setSelectedSection(sec.name);
                    setSelectedBracket(sec.brackets?.[0]?.name || "open");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedSection === sec.name
                      ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-sm">{sec.title || sec.name}</div>
                  {sec.timeControl && (
                    <div className="text-[11px] text-blue-400 mt-1 font-mono">
                      {sec.timeControl}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              2. Choose Rating Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bracketsList.map((brk) => (
                <button
                  type="button"
                  key={brk.name}
                  onClick={() => setSelectedBracket(brk.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedBracket === brk.name
                      ? "border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-sm capitalize">{brk.name}</div>
                  <div className="text-xs text-emerald-400 mt-1 font-medium">
                    {brk.range || (brk.minRating != null ? `${brk.minRating} - ${brk.maxRating} ELO` : "All Ratings")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {brk.timeControl || currentSectionObj?.timeControl || "10 + 5"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Confirm Solo Registration"}
          </button>
        </form>
      )}
    </div>
  );
}
```

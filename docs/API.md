# WrenchWise API Reference

Base URL: `http://localhost:5000/api`

All request and response bodies are JSON. Timestamps are ISO-8601 strings.

## Authentication

`POST /auth/login` returns a JWT signed with `JWT_SECRET` whose payload is
`{ sub: <userId>, role: <role> }` (expiry `JWT_EXPIRES_IN`, default `8h`).

The token is delivered two ways:

- as an `httpOnly`, `SameSite=Strict` cookie named `ww_token` (used by the browser dashboard, so the token is never readable from JavaScript)
- in the response body as `token` (for API clients such as curl/Postman, sent back as `Authorization: Bearer <token>`)

The auth middleware accepts either. A `Bearer` header takes precedence over the cookie.

## Roles

| Role         | Summary                                                                 |
|--------------|-------------------------------------------------------------------------|
| `admin`      | Full access: users, vehicles, assignments, service scheduling, all records |
| `technician` | Sees services assigned to them; updates status and adds notes           |
| `user`       | Sees vehicles assigned to them and those vehicles' services (read-only) |

## Error format

Every error response uses this shape:

```json
{ "error": { "message": "Human readable message", "code": "VALIDATION_ERROR", "details": [ { "path": "email", "message": "Invalid email" } ] } }
```

| Status | `code`                | When                                                  |
|--------|-----------------------|-------------------------------------------------------|
| 400    | `VALIDATION_ERROR`    | Body/query/params fail validation (`details` present) or malformed ObjectId |
| 400    | `INVALID_TRANSITION`  | Illegal service status change                         |
| 401    | `UNAUTHENTICATED`     | Missing, invalid or expired token; bad login credentials |
| 403    | `FORBIDDEN`           | Authenticated but the role or ownership doesn't allow it |
| 404    | `NOT_FOUND`           | Resource doesn't exist (or isn't visible to the caller) |
| 409    | `CONFLICT`            | Duplicate email / registration number, deleting yourself, changing your own role, concurrent status change |
| 413/415 | `BAD_REQUEST`        | Body over 100 kB or unsupported charset |
| 429    | `TOO_MANY_REQUESTS`   | More than 20 login attempts per 15 minutes from one IP |
| 500    | `INTERNAL_ERROR`      | Unexpected failure (no stack trace leaked)            |

Success codes: `200` for reads/updates, `201` for creates, `204` for deletes.

## Data models

### User
```json
{ "id": "6650...", "name": "Asha Rao", "email": "asha@wrenchwise.dev", "role": "technician", "createdAt": "...", "updatedAt": "..." }
```
`passwordHash` is never returned. Passwords are hashed with bcrypt (cost 12).

### Vehicle
```json
{
  "id": "6650...", "registrationNumber": "KA01AB1234", "make": "Tata", "model": "Ace EV",
  "year": 2023, "vin": "MAT123...", "mileage": 18250, "status": "active",
  "assignedUser": { "id": "...", "name": "...", "email": "..." } ,
  "createdAt": "...", "updatedAt": "..."
}
```
- `status`: `active` | `in-service` | `retired`
- `registrationNumber`: unique, stored upper-case
- `assignedUser`: populated `{id,name,email}` or `null`

### Service
```json
{
  "id": "6650...",
  "vehicle": { "id": "...", "registrationNumber": "KA01AB1234", "make": "Tata", "model": "Ace EV" },
  "serviceType": "oil-change",
  "description": "10k km service",
  "scheduledDate": "2026-11-20T00:00:00.000Z",
  "status": "pending",
  "technician": { "id": "...", "name": "...", "email": "..." },
  "notes": [ { "id": "...", "text": "Replaced filter", "author": { "id": "...", "name": "..." }, "createdAt": "..." } ],
  "startedAt": null,
  "completedAt": null,
  "createdAt": "...", "updatedAt": "..."
}
```
- `serviceType`: `oil-change` | `tire-rotation` | `brake-inspection` | `battery-check` | `engine-diagnostics` | `transmission-service` | `general-inspection` | `other`
- `status`: `pending` | `in-progress` | `completed`
- Allowed status transitions: `pending → in-progress`, `in-progress → completed`, `in-progress → pending`. A completed service is locked.

---

## Endpoints

### Auth

| Method | Path            | Access        | Body / Notes |
|--------|-----------------|---------------|--------------|
| POST   | `/auth/login`   | public        | `{ email, password }` → `200 { token, user }` and sets cookie. Wrong credentials → `401` |
| POST   | `/auth/logout`  | public        | Clears the cookie → `204` |
| GET    | `/auth/me`      | authenticated | → `200 { user }` |

### Users (admin only)

| Method | Path          | Body / Query | Response |
|--------|---------------|--------------|----------|
| GET    | `/users`      | `?role=technician` (optional) | `200 { users: User[] }` |
| POST   | `/users`      | `{ name, email, password (min 8), role }` | `201 { user }`; duplicate email → `409` |
| GET    | `/users/:id`  | | `200 { user }` |
| PATCH  | `/users/:id`  | any of `{ name, email, password, role }` | `200 { user }` |
| DELETE | `/users/:id`  | | `204`. Deleting yourself → `409`. Vehicles assigned to the user are unassigned; a technician with non-completed services → `409` |

### Vehicles (admin only)

| Method | Path                    | Body / Query | Response |
|--------|-------------------------|--------------|----------|
| GET    | `/vehicles`             | `?status=active&assignedUser=<id>&q=<search reg/make/model>` | `200 { vehicles: Vehicle[] }` |
| POST   | `/vehicles`             | `{ registrationNumber, make, model, year, vin?, mileage?, status?, assignedUser? }` | `201 { vehicle }`; duplicate reg → `409` |
| GET    | `/vehicles/:id`         | | `200 { vehicle }` |
| PATCH  | `/vehicles/:id`         | any vehicle field | `200 { vehicle }` |
| DELETE | `/vehicles/:id`         | | `204` (also deletes its services) |
| PATCH  | `/vehicles/:id/assign`  | `{ userId: "<id>" \| null }` — target must have role `user` | `200 { vehicle }` |

### Services

| Method | Path                     | Access | Body / Query | Response |
|--------|--------------------------|--------|--------------|----------|
| GET    | `/services`              | all roles (scoped) | `?status=&vehicle=&technician=&from=&to=&sort=scheduledDate\|-scheduledDate` | `200 { services: Service[] }` |
| POST   | `/services`              | admin | `{ vehicle, serviceType, scheduledDate, technician, description? }` — technician must have role `technician` | `201 { service }` |
| GET    | `/services/:id`          | all roles (scoped) | | `200 { service }` |
| PATCH  | `/services/:id`          | admin | any of `{ serviceType, scheduledDate, technician, description }` | `200 { service }`; completed → `400 INVALID_TRANSITION` |
| DELETE | `/services/:id`          | admin | | `204` |
| PATCH  | `/services/:id/status`   | technician (assigned only) | `{ status }` | `200 { service }`; not assigned → `403`; bad transition → `400` |
| POST   | `/services/:id/notes`    | technician (assigned) or admin | `{ text }` (1–1000 chars) | `201 { service }` |

Scoping for `GET /services` and `GET /services/:id`:
- **admin** – every service
- **technician** – only services where `technician == me`
- **user** – only services whose vehicle has `assignedUser == me`

A service outside the caller's scope returns `404`.

### Current user ("me") — user & technician

| Method | Path            | Access | Query | Response |
|--------|-----------------|--------|-------|----------|
| GET    | `/me/vehicles`  | user   | | `200 { vehicles: Vehicle[] }` assigned to me |
| GET    | `/me/services`  | user, technician | `?scope=upcoming\|history\|all` (default `all`) | `200 { services: Service[] }`. `upcoming` = status ≠ completed, sorted by `scheduledDate` asc. `history` = completed, sorted by `completedAt` desc |

### Stats (all roles, scoped like `/services`)

| Method | Path                              | Response |
|--------|-----------------------------------|----------|
| GET    | `/stats/summary`                  | `200 { totals: { vehicles, services, pending, inProgress, completed, overdue }, byType: [{ serviceType, count }], monthly: [{ month: "2026-06", scheduled, completed }] (last 12 months incl. current, plus next 3 months), upcomingVsCompleted: { upcoming, completed } }` |
| GET    | `/stats/vehicles/:id/timeline`    | `200 { vehicle, services: Service[] }` sorted by `scheduledDate` asc. User must own the vehicle, technician must have ≥1 service on it, else `404` |

`overdue` = status ≠ completed and `scheduledDate` < now. `upcoming` = status ≠ completed (overdue included), matching `/me/services?scope=upcoming`. `monthly.scheduled` buckets by `scheduledDate` and `monthly.completed` by `completedAt` (UTC calendar months).

## Implementation notes

- Changing a user's password invalidates every token issued before the change.
- The cookie's `Secure` flag is on when `NODE_ENV=production`, so always set it in HTTPS deployments.
- `authenticate` reloads the user on every request and uses the role stored in the **database**, so role changes and deletions take effect immediately, even with an old token.
- Unknown `vehicle` / `technician` / `userId` ids in a request body → `400 VALIDATION_ERROR` (the id is input, not the addressed resource).
- Notes may still be appended to a completed service (an append-only log). Status and admin edits are locked.
- Status updates are compare-and-set: if the status changed since it was read, the API returns `409`.
- Inputs are normalised: registration numbers are upper-cased with whitespace removed, emails are lower-cased, and an empty `vin` becomes `null`.

### Health

`GET /api/health` → `200 { status: "ok" }` (public)

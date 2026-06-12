# Mishap Incident Platform

Mishap Incident Platform is a backend-heavy incident management and on-call platform inspired by systems such as PagerDuty. The platform is designed to receive alerts from external monitoring systems, normalize them, deduplicate them, create incidents, route incidents to the correct responder, run escalation policies, and preserve a complete operational history.

At the current development checkpoint, the project is focused on authentication and user persistence. GitHub OAuth login is already connected to the NestJS backend, PostgreSQL, and Prisma. Organization ownership, invite flow, team membership, incident routing, escalation, and notification workers will be implemented in later phases.

---

## Project Goal

The goal is not to build a simple ticketing application. The long-term goal is to build an event-driven incident response engine.

Core target flow:

```txt
Monitoring tool sends alert
→ System validates webhook
→ Alert is normalized
→ Deduplication checks existing incidents
→ Incident is created or updated
→ Service ownership is detected
→ Escalation policy is loaded
→ Current on-call responder is calculated
→ Notification is sent
→ If nobody acknowledges, escalation continues
→ Incident is resolved and closed
→ Timeline and audit logs are stored
```

---

## Current Checkpoint

Current completed scope:

```txt
Phase 1: GitHub OAuth Login + User Database
```

Implemented:

- NestJS backend setup
- PostgreSQL connection through Prisma
- Prisma migration successfully creates database tables
- GitHub OAuth login using Passport + passport-github2
- GitHub user profile is returned as JSON from the callback route
- User data can be persisted into PostgreSQL through Prisma
- SPA fallback controller is temporarily disabled during backend development

Not implemented yet:

- JWT/session finalization
- Organization registration
- Owner assignment validation
- Invite flow
- Team membership
- Service registry
- Alert ingestion
- Incident lifecycle
- Escalation policy
- Notification worker

---

## Tech Stack

```txt
Frontend: React
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Authentication: Passport + GitHub OAuth
Future Queue: Redis + BullMQ
Future Deployment: VPS / Docker / Coolify
```

---

## Repository Structure

Expected monorepo structure:

```txt
mishap-incident-platform/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── github.strategy.ts
│   │   │   ├── password.service.ts
│   │   │   └── session.service.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── frontend/
    ├── src/
    └── package.json
```

---

## Backend Setup

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create or update `.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/incident_platform?schema=public"

GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"
```

Make sure the PostgreSQL database exists:

```sql
CREATE DATABASE incident_platform;
```

Run Prisma migration:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

Open Prisma Studio to verify tables:

```bash
npx prisma studio
```

Run the backend:

```bash
npm run start:dev
```

---

## GitHub OAuth Setup

Create a GitHub OAuth App from GitHub Developer Settings.

Use this callback URL for local development:

```txt
http://localhost:3000/auth/github/callback
```

Then copy the generated Client ID and Client Secret into the backend `.env` file.

---

## Auth Routes

### Start GitHub Login

```txt
GET /auth/github
```

Open this route in the browser:

```txt
http://localhost:3000/auth/github
```

The browser should redirect to GitHub authorization.

### GitHub Callback

```txt
GET /auth/github/callback
```

After successful GitHub authorization, the backend receives the GitHub profile and returns a JSON response.

Expected output example:

```json
{
  "id": "user_uuid_from_database",
  "name": "github_username",
  "email": "user@example.com",
  "githubId": "123456789",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "status": "active",
  "createdAt": "2026-06-12T00:00:00.000Z",
  "updatedAt": "2026-06-12T00:00:00.000Z"
}
```

---

## Important Development Note: SPA Controller Disabled

This project originally contains an SPA fallback controller that serves:

```txt
public/index.html
```

During backend-only development, this can cause the following error if the React frontend has not been built yet:

```txt
ENOENT: no such file or directory, stat 'backend/dist/public/index.html'
```

For now, the SPA controller should remain disabled while testing backend authentication, Prisma, and PostgreSQL.

Recommended temporary backend-only `AppModule`:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The SPA controller can be enabled again later after the frontend is built and copied into the backend public directory.

---

## Current Authentication Flow

```txt
User opens /auth/github
→ NestJS uses AuthGuard('github')
→ Passport redirects user to GitHub
→ User authorizes the application
→ GitHub redirects to /auth/github/callback
→ GithubStrategy receives GitHub profile
→ Backend checks or creates user in PostgreSQL through Prisma
→ Callback returns user JSON
```

At this checkpoint, the goal is only to confirm that login works and the user can exist in the database. Role assignment and organization ownership will be added in a later phase.

---

## Planned Multi-Tenant Model

The platform will use a multi-tenant organization model.

Planned core tables:

```txt
users
organizations
organization_members
teams
team_members
services
integrations
api_keys
alerts
incidents
incident_events
incident_participants
on_call_schedules
schedule_rotations
schedule_overrides
escalation_policies
escalation_steps
escalation_runs
notifications
notification_attempts
audit_logs
postmortems
```

Planned organization member roles:

```txt
owner
manager
member
```

Planned team member roles:

```txt
manager
responder
viewer
```

---

## Future Development Phases

### Phase 1 — Auth and User Persistence

Status: In progress / mostly completed.

Scope:

- GitHub OAuth login
- User persistence in PostgreSQL
- Prisma integration
- Auth module structure

### Phase 2 — Organization Registration

Scope:

- Create organization
- Attach authenticated user as organization owner
- Add validation for development vs production owner assignment

### Phase 3 — Invitation Flow

Scope:

- Owner invites user by email
- Pending invitation model
- User joins organization after accepting invitation or logging in with matching email

### Phase 4 — Teams and Service Ownership

Scope:

- Create teams
- Add team members
- Assign services to teams
- Prepare routing logic for incidents

### Phase 5 — Alert and Incident Engine

Scope:

- Webhook ingestion
- Alert normalization
- Deduplication
- Incident creation
- Incident status transitions

### Phase 6 — On-Call and Escalation

Scope:

- On-call schedules
- Escalation policies
- Escalation timers
- Notification retries
- Background worker with Redis + BullMQ

---

## Recommended Development Order

```txt
1. Finish GitHub login and user persistence
2. Add session or JWT handling
3. Add organization registration
4. Add organization membership roles
5. Add invite flow
6. Add teams and team membership
7. Add service registry
8. Add webhook integrations
9. Add alert ingestion and deduplication
10. Add incident lifecycle
11. Add on-call schedules
12. Add escalation and notification workers
```

---

## Testing Checklist

### Database

```bash
npx prisma studio
```

Check that the `users` table exists and contains the logged-in GitHub user.

### GitHub Login

Open:

```txt
http://localhost:3000/auth/github
```

Expected result:

```txt
GitHub authorization page
→ callback route
→ JSON user response
```

### Duplicate User Check

Login with the same GitHub account twice.

Expected result:

```txt
The system should not create duplicate users.
```

### PostgreSQL Manual Check

Using psql:

```bash
psql -U postgres -d incident_platform
```

Then:

```sql
\dt
SELECT * FROM users;
```

---

## Long-Term Product Description

Mishap Incident Platform is a multi-tenant incident management platform that receives alerts, deduplicates them, creates incidents, routes them based on service ownership, calculates the current on-call responder, runs escalation policies, sends notifications, tracks incident lifecycle, and preserves a complete audit trail.

It is designed to demonstrate serious backend engineering concepts, including event-driven architecture, background job processing, state machine design, webhook security, idempotency, multi-tenant authorization, retry handling, and auditability.

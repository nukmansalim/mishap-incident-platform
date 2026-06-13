# Mishap 

Mishap is a backend-heavy incident management and on-call platform inspired by systems such as PagerDuty. The platform is designed to receive alerts from external monitoring systems, normalize them, deduplicate them, create incidents, route incidents to the correct responder, run escalation policies, and preserve a complete operational history.

At the current development checkpoint, the project is focused on authentication, multi-tenant organization modeling, and the first part of the organization invitation flow.

***

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

***

## Current Checkpoint

Current completed scope:

```txt
Phase 1: GitHub OAuth Login + User Persistence + Basic JWT Auth
Phase 2: Organization Registration (core)
Phase 3: Invitation Flow (create invitation endpoint, repository + validation)
```

Implemented:

- JWT access token is issued after successful GitHub callback  
- NestJS backend setup  
- PostgreSQL connection through Prisma  
- Prisma migration successfully creates database tables  
- GitHub OAuth login using Passport + passport-github2  
- GitHub user profile is returned as JSON from the callback route  
- User data is persisted into PostgreSQL through Prisma  
- SPA fallback controller is temporarily disabled during backend development  
- Organization model and organization membership model  
- Create organization endpoint  
- List current user organizations endpoint  
- Owner membership creation on organization create  
- Invitation model (`Invitation`) with:
  - `email`, `organizationId`, `invitedById`, `token`, `status`, `role`, `expiresAt`, `acceptedAt`, timestamps  
  - relations to `Organization`, `invitedBy` user, and optional `user` (who eventually accepts)  
  - composite unique key on `(email, organizationId)` untuk mencegah duplikasi undangan per org  
- Invitation module with controller, service, dan repository terpisah dari organization module  
- `POST /organizations/:orgId/invitations` endpoint dengan:
  - JWT auth guard  
  - repository pattern untuk semua query Prisma  
  - validasi:
    - hanya `owner` / `admin` yang boleh mengundang  
    - user yang bukan member org mendapatkan 404 (“Organization not found or not a member”)  
    - user dengan role `member` mendapatkan 403  
    - jika sudah ada `Invitation` PENDING untuk `(email, organizationId)` → 409  
    - jika user dengan email itu sudah menjadi member organisasi → 409  
  - invitation dibuat atau di-reset menggunakan `upsert` dengan token baru dan expiry date  

Not implemented yet:

- Refresh token flow  
- Logout/token revocation strategy  
- Fully generalized role-aware authorization beyond current checks  
- Organization-scoped access control for all modules  
- Invitation link validation endpoint (`GET /invitations/:token`)  
- Invitation acceptance endpoint (user joins organization after accepting)  
- Team membership  
- Service registry  
- Alert ingestion  
- Incident lifecycle  
- Escalation policy  
- Notification worker  

***

## Tech Stack

```txt
Frontend: React
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Authentication: Passport + GitHub OAuth + JWT
Future Queue: Redis + BullMQ
Future Deployment: VPS / Docker / Coolify
```

***

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
│   │   ├── organization/
│   │   │   ├── organization.controller.ts
│   │   │   ├── organization.module.ts
│   │   │   └── organization.service.ts
│   │   ├── invitation/
│   │   │   ├── invitation.controller.ts
│   │   │   ├── invitation.module.ts
│   │   │   ├── invitation.service.ts
│   │   │   └── invitation.repository.ts
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

***

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

***

## GitHub OAuth Setup

Create a GitHub OAuth App from GitHub Developer Settings.

Use this callback URL for local development:

```txt
http://localhost:3000/auth/github/callback
```

Then copy the generated Client ID and Client Secret into the backend `.env` file.

***

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
  "accessToken": "jwt_access_token_here",
  "user": {
    "id": "user_uuid_from_database",
    "name": "github_username",
    "email": "user@example.com",
    "githubId": "123456789",
    "avatarUrl": "https://avatars.githubusercontent.com/...",
    "status": "active",
    "createdAt": "2026-06-12T00:00:00.000Z",
    "updatedAt": "2026-06-12T00:00:00.000Z"
  }
}
```

***

## Important Development Note: SPA Controller Disabled

This project originally contains an SPA fallback controller that serves:

```txt
public/index.html
```

During backend-only development, this can cause the following error if the React frontend has not been built yet:

```txt
ENOENT: no such file or directory, stat 'backend/dist/public/index.html'
```

For now, the SPA controller should remain disabled while testing backend authentication, Prisma, PostgreSQL, and invitation APIs.

Recommended temporary backend-only `AppModule`:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InvitationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The SPA controller can be enabled again later after the frontend is built and copied into the backend public directory.

***

## Current Authentication Flow

```txt
User opens /auth/github
→ NestJS uses AuthGuard('github')
→ Passport redirects user to GitHub
→ User authorizes the application
→ GitHub redirects to /auth/github/callback
→ GithubStrategy receives GitHub profile
→ Backend checks or creates user in PostgreSQL through Prisma
→ Backend issues JWT access token
→ Callback returns accessToken + user
→ Client uses JWT to access protected endpoints
```

***

## Current Data Model

### Organization

Represents a tenant/account in the system.

### OrganizationMember

Connects users to organizations and stores organization-level roles.

Roles:

- owner  
- admin  
- member  
- viewer  

### Invitation

Represents an email-based invitation to join an organization.

Core fields:

- `email`  
- `organizationId`  
- `invitedById`  
- `token` (unique invitation token)  
- `status` (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`)  
- `role` (organization-level role to assign on accept, currently defaults to `member`)  
- `expiresAt`, `acceptedAt`, timestamps  

Constraints and relations:

- composite unique `@@unique([email, organizationId])` to ensure one active invitation per email per organization  
- foreign keys to:
  - `Organization` (organization being joined)  
  - `invitedBy` (`User` who sent the invitation)  
  - optional `user` (`User` who eventually accepts the invitation)

***

## Invitation API (Phase 3 – Create Invitation)

### Endpoint

```txt
POST /organizations/:orgId/invitations
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Request body

```json
{
  "email": "invitee@example.com",
  "role": "member"  // optional, currently defaults to "member"
}
```

### Successful response

Status:

```txt
201 Created
```

Example body:

```json
{
  "id": "invitation-uuid",
  "email": "invitee@example.com",
  "organizationId": "org-uuid",
  "invitedById": "current-user-uuid",
  "status": "PENDING",
  "expiresAt": "2026-06-20T00:00:00.000Z",
  "createdAt": "2026-06-13T00:00:00.000Z",
  "token": "invitation-token-for-dev-testing"
}
```

In development, the `token` may be returned to simplify manual testing. In production, the token is expected to be delivered only via email.

### Error conditions

- `401 Unauthorized`  
  - no or invalid JWT.  

- `404 Not Found`  
  - the authenticated user is not a member of the organization or the organization is not visible to them.  

- `403 Forbidden`  
  - the authenticated user is a member but does not have `owner` or `admin` role:
  - message: `"Only owner/admin can invite members to this organization"`  

- `409 Conflict`  
  - an active PENDING invitation already exists for the same `(email, organizationId)`:
    - message: `"An active invitation already exists for this email"`  
  - the user associated with this email is already a member of the organization:
    - message: `"User is already a member of this organization"`

All database access for invitations and membership checks is done via an `InvitationRepository` so the service layer remains focused on business rules rather than Prisma queries.

***

## Planned Multi-Tenant Model

The platform will use a multi-tenant organization model.

Planned core tables:

```txt
users
organizations
organization_members
invitations
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

***

## Development Phases

### Phase 1 — Auth and User Persistence

Status: Mostly completed.

Scope:

- GitHub OAuth login  
- User persistence in PostgreSQL  
- Prisma integration  
- Auth module structure  

### Phase 2 — Organization Registration

Status: In progress

Scope:

- Organization model  
- Organization membership model  
- Create organization endpoint  
- List current user organizations endpoint  

### Phase 3 — Invitation Flow

Status: In progress (create invitation implemented)

Scope:

- Owner or admin invites user by email  
- Pending invitation model with expiry and status  
- Server-side validation:
  - only org owners/admins can invite  
  - reject invites for emails with existing PENDING invitation in the same org  
  - reject invites if the target user (by email) is already a member of the org  
- Next steps (not yet implemented):
  - invitation link validation endpoint (`GET /invitations/:token`)  
  - invitation acceptance endpoint (`POST /organizations/:orgId/invitations/accept/:token`)  

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

***

## Recommended Development Order

```txt
1. Finish GitHub login and user persistence
2. Add session or JWT handling
3. Add organization registration
4. Add organization membership roles
5. Add invite flow (create invitation, validate token, accept invitation)
6. Add teams and team membership
7. Add service registry
8. Add webhook integrations
9. Add alert ingestion and deduplication
10. Add incident lifecycle
11. Add on-call schedules
12. Add escalation and notification workers
```

***

## Testing Checklist

### Database

```bash
npx prisma studio
```

Check that the `users`, `organizations`, `organization_members`, and `Invitation` tables exist and contain expected data.

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
SELECT * FROM organizations;
SELECT * FROM organization_members;
SELECT * FROM "Invitation";
```

### JWT Protected Route

Use the access token returned by the callback:

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/auth/me
```

Expected result:

```txt
200 OK with authenticated user payload
```

Without token:

```txt
401 Unauthorized
```

### Manual Test Coverage Phase 2 and 3

Organization and invitation endpoints have been manually tested for:

- unauthorized access returns 401  
- only authenticated users can access organization and invitation endpoints  
- valid organization creation  
- owner membership creation on organization create  
- organization listing for authenticated user  
- invalid payload rejection (empty and overlong names)  
- `POST /organizations/:orgId/invitations`:
  - 201 for owners/admins in happy path  
  - 401 for missing/invalid JWT  
  - 404 for users not belonging to the organization  
  - 403 for members without owner/admin role  
  - 409 when an active invitation already exists for the same email in the same organization  
  - 409 when the invited email already belongs to an existing organization member  

***

## Long-Term Product Description

Mishap Incident Platform is a multi-tenant incident management platform that receives alerts, deduplicates them, creates incidents, routes them based on service ownership, calculates the current on-call responder, runs escalation policies, sends notifications, tracks incident lifecycle, and preserves a complete audit trail.

It is designed to demonstrate serious backend engineering concepts, including event-driven architecture, background job processing, state machine design, webhook security, idempotency, multi-tenant authorization, retry handling, and auditability.

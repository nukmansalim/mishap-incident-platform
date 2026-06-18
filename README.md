# Mishap Incident Platform

Mishap is a client-aware service operations and incident workflow platform designed specifically for software houses, Managed Service Providers (MSPs), and IT teams. Instead of building a complex, heavy PagerDuty-like infrastructure alert router, Mishap focuses on connecting service monitoring, clear incident ownership, simple escalations, and client transparency through Status Pages and reporting.

At the current development checkpoint, the project is structured as a monorepo consisting of a NestJS backend and a React (Vite) frontend. The completed scope covers core authentication, multi-tenant organizations, invitations, team routing, and client/project management.

---

## The MVP Pivot & Scope Strategy
We have repositioned the platform from a generic "on-call/alert-heavy rotation engine" to a **Client-Aware Incident Workflow Tool**. 

### 1. Unified Domain Reframing
Our core focus revolves around the relationship: **Client/Project ◄──► MonitoredService ──► Monitor ──► Incident**.

* **Organization:** The root tenant workspace.
* **Team:** Groups of responders responsible for services.
* **Client/Project:** Represents a customer or internal business unit (mapped to one or many `MonitoredService`s).
* **MonitoredService:** A logical application service (owned by a Team, serving one or many `Client`s).
* **Monitor:** Simple probes (HTTP, SSL, Ping) tied to a `MonitoredService` that perform technical health checks, measure response times, and log telemetry.
* **Incident:** The central operational entity triggered by monitor failures.

### 2. Streamlining Complex Features
To maintain a high-quality, focused MVP, we have deferred or simplified advanced infrastructure-heavy features:
* **Escalations:** Simplified to a static 3-level rule structure (Level 1 Responder $\rightarrow$ Level 2 Team Lead $\rightarrow$ Level 3 Org Owner) instead of complex dynamic graphs.
* **On-call Schedules:** Complex shift schedules and calendar rotations are hidden/deferred.
* **Deduplication:** Simplified to a basic fingerprint check (`service_id + active_status`).
* **Integrations:** Initial notification delivery focuses on Email and Telegram.

---

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Axios
* **Backend:** NestJS, Passport (Local, JWT, GitHub OAuth)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Process Manager:** Concurrently

---

## Current Checkpoint & Progress

### Completed Scope
* **Phase 1: Authentication**
  * Local registration and bcrypt password hashing.
  * GitHub OAuth integration.
  * JWT generation (15-minute access token) and extraction guards.
* **Phase 2: Multi-Tenant Organizations**
  * Creating organizations with automatic `owner` membership assignment.
  * Fetching organization details and tenant context isolation.
* **Phase 3: Organization Invitation Flow**
  * Sending organization invitations to emails.
  * Securing and validating invitation tokens (status, expiry checks).
  * Accepting invitations via transactions that auto-join the user to the organization.
* **Phase 4: Team & Membership Management**
  * CRUD operations for teams within an organization.
  * Team members assignment with team roles (`manager`, `responder`, `viewer`).
  * Custom `OrgRoleGuard` and `@OrgRoles` decorators for authorization checks.
* **Phase 5: Client / Project Management**
  * CRUD endpoints for Clients/Projects mapped to organizations.
  * Custom properties support (metadata JSON, contact details, status, type).
  * Soft-delete/archiving mechanism.

### Upcoming Roadmap (Next Steps)
1. **Services & Monitors:** Implement `Service` modeling (linking Client and Team) and basic `Monitor` checks.
2. **Simple Incidents Lifecycle:** Implement incident creation, state transition, and assignment logic.
3. **Escalations & Alerts Engine:** Create static escalation steps and basic deduplication.
4. **Notifications:** Email & Telegram webhook integrations.
5. **Runbooks:** Simple markdown runbook templates per service/incident type.
6. **Status Pages:** Public-facing status pages for client visibility.
7. **Reports:** Summary reports of uptime and incidents resolved.

---

## Repository Structure

```txt
mishap-incident-platform/
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── auth/            # Auth controllers, services, guards, and passport strategies
│   │   ├── organization/    # Organization controllers, services, and repositories
│   │   ├── invitation/      # Invitation controllers, services, and repositories
│   │   ├── team/            # Team controllers, services, and repositories
│   │   ├── client/          # Client controllers, services, and repositories
│   │   ├── common/          # Custom guards, decorators, and shared DTOs
│   │   ├── prisma/          # Prisma database module and service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/              # Prisma database schema and migrations
│   ├── prisma.config.ts     # Configures Prisma datasource dynamically
│   └── package.json
│
├── ui/                       # React client application (Vite + TS)
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   └── main.tsx
│   └── package.json
│
├── package.json              # Monorepo task configurations
└── README.md
```

---

## Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL running locally

### Monorepo Setup

From the root directory, install all dependencies:

```bash
# Install root, backend, and ui dependencies
npm install
cd backend && npm install
cd ../ui && npm install
cd ..
```

### Configuration (.env)

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/incident_platform?schema=public"

GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"

JWT_SECRET="your_jwt_secret_here"
```

### Database Initialization

Ensure that your PostgreSQL server is active, then run migrations and generate the client:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### Running the Application

From the root directory, run both the backend and frontend concurrently:

```bash
npm run dev
```

* **Backend** runs at: `http://localhost:3000`
* **Frontend (UI)** runs at: `http://localhost:5173`

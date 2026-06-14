# Mishap Incident Platform

Mishap is a backend-heavy incident management and on-call platform inspired by systems such as PagerDuty. The platform is designed to receive alerts from external monitoring systems, normalize them, deduplicate them, create incidents, route incidents to the correct responder, run escalation policies, and preserve a complete operational history.

At the current development checkpoint, the project is structured as a monorepo consisting of a NestJS backend and a React (Vite) frontend. The completed scope covers core authentication (Local and GitHub OAuth), multi-tenant organization modeling, and the organization invitation flow.

***

## Project Goal

The goal is to build an event-driven incident response engine.

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

*   **Phase 1**: Local Authentication (register/login) & GitHub OAuth Login + User Persistence + JWT Auth.
*   **Phase 2**: Multi-tenant Organization Registration (create organization, automatically assigning the creator as `owner`).
*   **Phase 3**: Organization Invitation Flow (create invitation, validate token, accept invitation).

### Implemented Backend Features:
*   **Authentication Modules**:
    *   **Local Auth**: Registers users via `POST /auth/register` (hashing passwords with bcrypt) and authenticates them via `POST /auth/login` (using passport-local).
    *   **GitHub OAuth**: Integrates passport-github2 via `GET /auth/github` and `GET /auth/github/callback` to validate profiles and persist them in PostgreSQL.
    *   **JWT Issuance**: Generates signed JWTs containing user `sub` (ID) and `email` payload after successful Local or GitHub login.
*   **Organization Management**:
    *   `POST /organizations`: Creates a new organization and records membership as `owner`.
    *   `GET /organizations`: Lists all organizations a user is associated with.
*   **Invitation System**:
    *   `POST /organizations/:orgId/invitations`: Allows owners/managers to invite members by email (using `upsert` to create or reset pending invites with a secure unique token).
    *   `GET /organizations/:orgId/invitations/:token`: Public token verification (handles checks for existence, expiration, and status updates).
    *   `POST /organizations/:orgId/invitations/:token/accept`: Connects authenticated users to the invited organization in a database transaction, verifying emails and checking for duplicate memberships.

### Implemented Frontend Features:
*   **React + Vite Single-Page Application (SPA)**:
    *   Scaffolded in the `/ui` directory.
    *   Includes a connection test utility that sends requests to `/api/` (NestJS hello endpoint) to verify CORS and backend integration.

***

## Repository Structure

```txt
mishap-incident-platform/
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── auth/            # Auth controllers, services, guards, and passport strategies
│   │   ├── organization/    # Organization controllers, services, and repositories
│   │   ├── invitation/      # Invitation controllers, services, and repositories
│   │   ├── prisma/          # Prisma database module and service
│   │   ├── dto/             # Data Transfer Objects for validation
│   │   ├── decorators/      # Custom request and user decorators
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

***

## Tech Stack

*   **Frontend**: React, TypeScript, Vite, Axios
*   **Backend**: NestJS, Passport (Local, JWT, GitHub OAuth)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Process Manager**: Concurrently (for monorepo dev runner)

***

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL running locally

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

*   **Backend** runs at: `http://localhost:3000`
*   **Frontend (UI)** runs at: `http://localhost:5173`

***

## API Endpoint Reference

### Authentication
*   `POST /auth/register`: Local registration (expects `email`, `password`, `name`).
*   `POST /auth/login`: Local login (expects `email`, `password`).
*   `GET /auth/github`: Initiates GitHub OAuth handshake.
*   `GET /auth/github/callback`: Receives OAuth callback and returns JWT `accessToken` along with safe user profile.

### Organizations
*   `POST /organizations`: Creates a new organization (JWT required).
*   `GET /organizations`: Returns organizations the user belongs to (JWT required).

### Invitations
*   `POST /organizations/:orgId/invitations`: Invites a user via email (JWT required, restricted to org owner/admin).
*   `GET /organizations/:orgId/invitations/:token`: Publicly checks if invitation token is valid (status is pending and not expired).
*   `POST /organizations/:orgId/invitations/:token/accept`: Accepts invitation and assigns role (JWT required).

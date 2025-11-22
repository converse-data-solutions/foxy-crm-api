# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant CRM API built with NestJS, TypeORM, and PostgreSQL. The application uses a schema-per-tenant architecture with two distinct database contexts:
- **base-app**: Manages tenant metadata, subscriptions, and plans
- **core-app**: Handles tenant-specific CRM data (leads, contacts, deals, etc.)

## Development Commands

### Running the Application
```bash
npm run start:dev          # Development with hot reload
npm run start:debug        # Debug mode with hot reload
npm run build              # Build the application
npm run start:prod         # Production mode
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run e2e tests
npm run test:cov           # Generate coverage report
npm run test:debug         # Debug tests
npm run test -- <file>     # Run specific test file
```

Jest configuration: unit tests match `*.spec.ts` in `src/`, e2e tests match `*.e2e-spec.ts` in `test/`

### Code Quality
```bash
npm run lint               # Lint and auto-fix
npm run format             # Format code with Prettier
```

### Database Migrations

The project uses separate migration commands for each database context:

**Base App (tenant management):**
```bash
npm run migration:generate:base-app    # Generate migration
npm run migration:run:base-app         # Run migrations
npm run migration:revert:base-app      # Revert last migration
```

**Core App (tenant CRM data):**
```bash
npm run migration:generate:core-app    # Generate migration
npm run migration:run:core-app         # Run migrations
npm run migration:revert:core-app      # Revert last migration
```

**Migration Strategy:**
- Base migrations run automatically on application startup (src/main.ts:38)
- Tenant migrations execute dynamically during tenant creation via `tenantSetup()`
- Each tenant has isolated migration history in their PostgreSQL schema
- When a new tenant is created: schema is created → migrations run → admin user seeded

## Architecture

### Multi-Tenancy Model

The application implements schema-per-tenant isolation:

1. **Tenant Registration**: Creates entry in `base-app` database with unique `schemaName` (UUID)
2. **Schema Creation**: Each tenant gets a dedicated PostgreSQL schema
3. **Dynamic Connections**: Runtime schema selection via `getConnection(schemaName)` utility (src/shared/database-connection/get-connection.ts)
4. **Connection Pooling**: Automatic cleanup of idle tenant connections after 10 minutes, max 50 concurrent tenant connections

### Database Architecture

**Two DataSource Configurations:**
- `base-app-data-source.ts`: Manages base-app entities (Tenant, Plan, Subscription, etc.)
- `core-app-data-source.ts`: Extends base-app config, manages core-app entities (User, Lead, Contact, Deal, Task, Ticket, Account, Note, LeadActivity)

**Accessing Tenant Data:**
```typescript
// Get tenant-specific repository
import { getRepo } from 'src/shared/database-connection/get-connection';
const leadRepo = await getRepo(Lead, tenantSchemaName);
```

### Authentication & Authorization

**Global Auth Stack** (applied via APP_GUARD in app.module.ts):
1. `GlobalAuthGuard`: Chains JwtAuthGuard → RolesGuard
2. JWT validation via cookie-based `access_token`
3. Role-based access control via `@Roles()` decorator

**Bypass Auth:**
```typescript
@Public()  // Marks route as public (src/common/decorators/public.decorator.ts)
```

**Get Current User:**
```typescript
@GetUser() user: JwtPayload  // src/common/decorators/current-user.decorator.ts
```

### Core Modules

- **AuthModule**: Authentication, registration, login, logout, token refresh
- **TenantModule**: Tenant management, schema creation
- **SubscriptionModule**: Stripe integration, plan management
- **UserModule**: User CRUD within tenant context
- **LeadModule**: Lead management with activity tracking
- **LeadConversionModule**: Convert leads to contacts/accounts/deals
- **ContactModule, AccountModule, DealModule**: CRM entities
- **TicketModule, TaskModule**: Support and task management
- **MetricModule**: Real-time metrics via WebSocket
- **OtpModule**: Email verification and password reset

### Background Processing

**BullMQ Queues** (Redis-backed):
- Email processor (src/processors/email.processor.ts)
- File processor (src/processors/file.processor.ts)
- Subscription processor (src/processors/subscription.processor.ts)
- Tenant processor (src/processors/tenant.processor.ts)

**Schedulers** (cron-based):
- Deal scheduler (src/schedulers/deal.scheduler.ts)
- Subscription scheduler (src/schedulers/subscription.scheduler.ts)

### WebSocket Gateway

Real-time metric updates via Socket.IO (src/gateway/crm.gateway.ts):
- Authentication via cookie + x-tenant-id header
- Room-based tenant isolation
- Auto-broadcasts metric changes

### API Documentation

- Swagger UI available at `http://localhost:8000/swagger` with cookie-based auth
- All routes automatically prefixed with `/api/v1` (configured in src/main.ts:16)
- Application runs on port 8000 by default

### Logging

Custom Winston-based logger (src/common/logger/logger.service.ts) with file rotation in `logs/` directory.

## Important Conventions

### Tenant Context Requirement

Most services require `tenantSchemaName` to access tenant-specific data. Pass this through:
- HTTP headers: `x-tenant-id`
- WebSocket headers: `x-tenant-id`
- Service method parameters

### Validation & DTOs

- Global validation pipe configured (src/common/pipes/custom-validation.pipe.ts)
- DTOs located in src/dtos/
- Use class-validator and class-transformer decorators

### Entity Serialization

- Global ClassSerializerInterceptor enabled
- Use `@Exclude()` decorator to hide sensitive fields (e.g., passwords, OTPs)

## Environment Configuration

Required environment variables (see .env):
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- JWT: `ACCESS_SECRET_KEY`, `REFRESH_SECRETE_KEY`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- Node: `NODE_ENV` (dev/production)

## Seeding

Subscription plans are automatically seeded on startup via `SeedService` (src/services/seed.service.ts).

## CORS & Security

- CORS enabled for `http://localhost:3000`
- Helmet middleware for security headers
- Cookie-based authentication
- Rate limiting via ThrottlerModule (10 requests per 60s)
- Raw body parser for Stripe webhooks at `/api/v1/stripe/webhook`
- always consider fixing lint issues on file changes
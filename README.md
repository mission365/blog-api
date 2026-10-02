# PulseBlog

PulseBlog is a full-stack blogging application with an ASP.NET Core 9 REST API, React and TypeScript frontend, Entity Framework Core migrations, and SQL Server persistence. The repository is organized as a layered backend and a Vite-powered single-page application.

## Project overview

Users can register, sign in with Firebase email or Google authentication, publish posts, edit or delete posts they own, change their password, and recover access through email verification flows. Administrators can review users, change roles, and pause or resume accounts.

### Screenshots

Add project screenshots here before publishing a portfolio entry:

- `docs/screenshots/home-feed.png` — public article feed
- `docs/screenshots/article-detail.png` — article details
- `docs/screenshots/authentication.png` — sign-in or registration
- `docs/screenshots/post-editor.png` — post editor
- `docs/screenshots/admin-dashboard.png` — administrator user management
- `docs/screenshots/swagger.png` — Swagger UI with the bearer scheme

These are suggested capture locations; no screenshots are generated or committed by this repository.

## Architecture

```text
React/TypeScript frontend
        |
ASP.NET Core REST API
        |
Controller layer
        |
Service and business logic layer
        |
Repository and EF Core data access
        |
SQL Server
```

Authentication uses Firebase ID tokens and API-issued JWTs. Both are validated by the API when configured. User roles are read from the SQL Server user record; a Firebase identity does not grant administrator access by itself.

## Technology stack

- .NET 9 and ASP.NET Core Web API
- Entity Framework Core 9 with the SQL Server provider
- JWT bearer authentication and Firebase Authentication
- BCrypt password hashing for API-managed credentials
- React 19, TypeScript, Vite, Tailwind CSS, and Firebase client SDK
- SQL Server
- Docker for backend container builds
- Swagger/OpenAPI for development API exploration

## Backend flow

Controllers handle HTTP contracts and validation. Services enforce authentication, account state, ownership, and role rules. Repositories query and persist entities through `AppDbContext`. The exception middleware converts expected failures into consistent RFC 7807 responses and hides internal details for unexpected failures.

Posts support:

- Public reads through `GET /api/Posts`
- Page and page-size limits (page size maximum 100)
- Search across title and content
- Sorting by newest, oldest, or title
- Ownership-aware create, update, and delete operations
- Administrator management of any post

Legacy posts without an author remain readable after the ownership migration. They can be managed by an administrator until an ownership policy is applied.

## Authentication and authorization

- Firebase ID tokens are accepted when `Firebase:ProjectId` is configured.
- API-issued JWTs use the configured issuer, audience, and signing key.
- Firebase users are provisioned into the `Users` table on their first authenticated API request.
- Administrator roles come from the database. The initial account is configured through `InitialAdmin` settings and is never hard-coded.
- Post changes require authentication and are checked against the post author or the Admin role.
- Paused users cannot log in through the API, and the frontend checks account state when a Firebase session changes.

## Database and migrations

The SQL Server schema is managed with EF Core migrations. The latest migration adds `Users.IsPaused`, `Posts.AuthorId`, and the nullable foreign key from posts to users. No startup SQL alters tables.

Apply migrations locally:

```bash
dotnet tool install --global dotnet-ef
dotnet ef database update
```

For production, review and apply an idempotent migration script:

```bash
dotnet ef migrations script --idempotent --output artifacts/migrations.sql
```

A production database backup and a review of existing post ownership are required before applying the ownership migration.

## Local development

### Backend

1. Install the .NET 9 SDK and SQL Server.
2. Copy `appsettings.example.json` to `appsettings.Development.json`.
3. Set the required values listed below.
4. Apply migrations.
5. Start the API:

```bash
dotnet restore
dotnet ef database update
dotnet run --launch-profile http
```

Swagger is available at `http://localhost:5231/swagger` in Development.

### Frontend

1. Install Node.js 18 or later.
2. Copy `frontend/.env.example` to `frontend/.env.local`.
3. Set the API and Firebase values.
4. Install and start the Vite app:

```bash
cd frontend
npm ci
npm run dev
```

The development frontend runs at `http://localhost:5173`. Its Vite proxy targets `VITE_API_BASE_URL`.

## Configuration

Backend configuration can come from `appsettings.Development.json`, environment variables, or a deployment secret store.

Required backend settings:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key` — at least 32 bytes
- `Jwt__Issuer`
- `Jwt__Audience`
- `Firebase__ProjectId` for Firebase token validation
- `Cors__AllowedOrigins__0` and additional allowed origins in production
- `Smtp__Host`, `Smtp__Port`, `Smtp__EnableSsl`, `Smtp__SenderEmail`, `Smtp__Username`, and `Smtp__Password` for email delivery
- `InitialAdmin__Email`, `InitialAdmin__Username`, and `InitialAdmin__Password` for one-time administrator provisioning

Frontend settings are documented in `frontend/.env.example`:

- `VITE_API_BASE_URL`
- `VITE_ADMIN_CONTACT_EMAIL`
- Firebase web application values beginning with `VITE_FIREBASE_`

Do not commit real settings, tokens, passwords, connection strings, or Firebase credentials. The example files contain placeholders only.

## API overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/Auth/register` | Public | Create a local API account |
| POST | `/api/Auth/login` | Public | Issue an API JWT |
| POST | `/api/Auth/forgot-password` | Public | Send a reset code |
| POST | `/api/Auth/reset-password` | Public | Reset a password |
| GET | `/api/Auth/check-paused` | Public | Check account state |
| GET | `/api/Auth/users` | Admin | List user summaries |
| PUT | `/api/Auth/users/{id}/role` | Admin | Change a role |
| PUT | `/api/Auth/users/{id}/status` | Admin | Pause or resume a user |
| GET | `/api/Posts?page=1&pageSize=20&search=api&sort=newest` | Public | Searchable, paginated posts |
| GET | `/api/Posts/{id}` | Public | Read one post |
| POST | `/api/Posts` | Authenticated | Create a post |
| PUT | `/api/Posts/{id}` | Owner/Admin | Update a post |
| DELETE | `/api/Posts/{id}` | Owner/Admin | Delete a post |

## Docker

Build and run the backend image from the repository root:

```bash
docker build -t pulseblog-api .
docker run --rm -p 10000:10000 --env-file .env pulseblog-api
```

Supply configuration at runtime. Secrets are not copied into the image. The container listens on the port provided by `ASPNETCORE_URLS` (10000 by default in the Dockerfile).

## Testing and verification

Backend build:

```bash
dotnet build BlogApi.csproj
```

Backend tests:

```bash
dotnet test BlogApi.Tests/BlogApi.Tests.csproj
```

Frontend checks:

```bash
cd frontend
npm run build
npm run lint
```

The test project uses EF Core InMemory and does not connect to the production database.

## Deployment notes

Deploy the API with environment variables, a reachable SQL Server instance, Firebase project configuration, SMTP credentials, and an allowed production frontend origin. Apply reviewed EF Core migrations before starting the new API version. Deploy the frontend with `VITE_API_BASE_URL` set to the deployed API and Firebase web configuration set to the matching project.

Swagger is enabled only in the Development environment.

## Security notes

- Production CORS is allow-list based.
- Administrator privileges are database-backed and configuration-seeded.
- Passwords are hashed with BCrypt and are never logged.
- JWTs and Firebase tokens are not logged or persisted by the API.
- Error responses expose a trace ID and safe details without stack traces.
- Password reset and verification codes are held in process memory and expire after 15 minutes. A multi-instance deployment should replace this with a shared, expiring store.
- Firebase custom claims are not trusted for administrator access; the API reads the role from its database.

## Portfolio suggestion

**Project title:** Full-Stack Blog Platform | ASP.NET Core REST API, React, SQL & JWT

**Summary:** PulseBlog is a full-stack publishing platform built with ASP.NET Core 9, React, TypeScript, and SQL Server. It combines Firebase sign-in with database-backed roles, ownership-aware post management, searchable pagination, account controls, and a documented migration and deployment workflow.

**Technologies:** ASP.NET Core 9, C#, EF Core 9, SQL Server, JWT, Firebase Authentication, React 19, TypeScript, Vite, Tailwind CSS, Docker, Swagger.

**Recommended screenshots:** public feed, article detail, sign-in or registration, post editor, admin dashboard, and Swagger UI.

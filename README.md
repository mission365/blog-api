# 🌐 PulseBlog — Modern Full-Stack Blog & Publishing Platform

[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQL Server](https://img.shields.io/badge/Database-MS_SQL_Server-CC292B?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)

A production-grade, full-stack RESTful blogging and publishing web application engineered with an **ASP.NET Core (.NET 9) Web API** backend and a **React 19 + TypeScript + Tailwind CSS** frontend. Features hybrid authentication (Firebase Google Sign-In + JWT), role-based access control, rich administrative controls (account pausing & role updates), and cloud MS SQL Server persistence.

---

## 🌟 Key Features

### 🔐 Authentication & Security
- **Firebase Authentication:** One-click **Google Sign-In** popup and Email/Password authentication.
- **Automated Password Reset:** Google-backed secure password reset delivery directly to inbox.
- **Account State Governance:** Real-time enforcement of **Paused** user accounts with instant forced logout and reactivation request workflows.
- **Role-Based Authorization:** Distinct permissions for **Admin** and **Author** accounts with JWT tokens and protected routes.

### 📝 Publishing & Content Management
- **Full CRUD Operations:** Create, read, update, and delete blog posts with rich content and cover images.
- **Categorization & Filtering:** Filter articles by technology, category, author, and search terms.
- **Read Time Calculation:** Dynamic read time estimates for articles.
- **Responsive Aesthetics:** State-of-the-art dark glassmorphic user interface built with Tailwind CSS v4 and Lucide React icons.

### 🛡️ Admin Dashboard & Moderation
- **User Governance:** View registered users, post counts, and join dates.
- **Role Assignment:** Elevate authors to Admins or demote to standard Authors.
- **Account Suspension:** Instant **Pause / Resume** switch for rogue accounts with real-time session termination.

---

## 🏗️ Architecture & Tech Stack

```
BlogApi (Full-Stack Solution)
├── Controllers/       # ASP.NET Core API Endpoints (Auth, Posts)
├── Services/          # Business logic & authentication services
├── Repositories/      # Entity Framework Core Data Access Layer
├── Data/              # AppDbContext & EF Core database configuration
├── Models/            # Database Entities (User, Post)
├── DTOs/              # Data Transfer Objects & validation contracts
├── Migrations/        # EF Core Code-First database migrations
└── frontend/          # React 19 + TypeScript + Vite SPA
    ├── src/
    │   ├── components/# Reusable UI elements (Navbar, Footer, Modals)
    │   ├── context/   # AuthContext with Firebase session sync
    │   ├── pages/     # Home, Login, Register, Profile, Admin Dashboard, Post Editor
    │   ├── services/  # API client, postService, firebaseAuthService
    │   └── types/     # TypeScript interfaces & DTO contracts
```

| Component | Technology | Details |
| :--- | :--- | :--- |
| **Backend Framework** | ASP.NET Core 9.0 | Minimal APIs & Controller-based RESTful Web API |
| **ORM / Data Access** | Entity Framework Core 8 | Code-First migrations with Microsoft SQL Server provider |
| **Database** | Microsoft SQL Server | Cloud-hosted MSSQL instance (`databaseasp.net`) |
| **Security** | JWT + Firebase Auth | Hybrid token auth, Google OAuth 2.0, BCrypt password hashing |
| **Frontend Framework**| React 19 + TypeScript | High performance Single Page Application built on Vite |
| **Styling** | Tailwind CSS v4 | Curated dark-mode design system with glassmorphic cards |
| **Deployment** | Vercel & MonsterASP | Frontend on Vercel CDN; Backend on MonsterASP.NET |

---

## 🚀 Getting Started Locally

### Prerequisites
* [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* [Node.js (v18+)](https://nodejs.org/) & `npm`
* [SQL Server](https://www.microsoft.com/sql-server) or access to a cloud connection string

---

### 1. Backend Setup (ASP.NET Core)

1. Clone the repository:
   ```bash
   git clone https://github.com/mission365/blog-api.git
   cd blog-api
   ```

2. Configure your connection string and credentials in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=BlogDb;Trusted_Connection=True;TrustServerCertificate=True;"
     },
     "Jwt": {
       "Key": "YourSuperSecretKeyHereAtLeast32CharactersLong!",
       "Issuer": "BlogApi",
       "Audience": "BlogApiUsers",
       "ExpireHours": 3
     }
   }
   ```

3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

4. Launch the API:
   ```bash
   dotnet run
   ```
   *The backend will be running at `http://localhost:5231` (Swagger UI at `/swagger`).*

---

### 2. Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```env
   VITE_API_BASE_URL=http://localhost:5231

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173`.*

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/Auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/Auth/register` | Register new user account | Public |
| `POST` | `/api/Auth/login` | Authenticate with credentials & receive JWT | Public |
| `GET` | `/api/Auth/check-paused` | Verify if an email/username is paused | Public |
| `POST` | `/api/Auth/forgot-password` | Send password reset verification code | Public |
| `POST` | `/api/Auth/reset-password` | Set new password with verified token | Public |
| `POST` | `/api/Auth/change-password` | Update existing password | Authenticated |
| `GET` | `/api/Auth/users` | List all registered user summaries | Admin Only |
| `PUT` | `/api/Auth/users/{id}/role` | Promote/demote user role | Admin Only |
| `PUT` | `/api/Auth/users/{id}/status` | Pause or resume user account access | Admin Only |

### 📰 Posts (`/api/Posts`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Posts` | Retrieve paginated list of blog articles | Public |
| `GET` | `/api/Posts/{id}` | Retrieve specific post details by ID | Public |
| `POST` | `/api/Posts` | Publish a new blog post | Authenticated |
| `PUT` | `/api/Posts/{id}` | Update an existing blog post | Author / Admin |
| `DELETE`| `/api/Posts/{id}` | Delete a blog post | Author / Admin |

---

## 🚢 Deployment

* **Frontend:** Deployed on [Vercel](https://vercel.com/) with rewrites configured in `vercel.json` for single-page routing.
* **Backend:** Hosted on [MonsterASP.NET](https://www.monsterasp.net/) with native IIS and .NET 9 runtime support.
* **Database:** Managed Microsoft SQL Server 2025 instance.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

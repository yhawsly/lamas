# LAMAS — Lecturer Academic Monitoring & Appraisal System

LAMAS is a comprehensive, enterprise-grade academic management, monitoring, and appraisal platform built with **Next.js 15**, **React 19**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. It streamlines institutional workflows between System Administrators, Heads of Department (HOD), Data Entry Officers (DEO), and Lecturers.

---

## 🌟 Key Features & Role Portals

### 👑 SuperAdmin & Administrator
* **Academic Term & Calendar Management:** Configure active terms, academic years, calculate semester week slots, and enforce deadlines.
* **Department & Course Registry:** Manage academic faculties, departments, courses, sections, and lecturer course assignments.
* **User & Role Administration:** Multi-role user creation, status toggling, password reset enforcement, and role permissions (`ADMIN`, `HOD`, `DEO`, `LECTURER`).
* **Compliance & Audit Logging:** Comprehensive activity logs, KPI tracking, and system performance monitoring.

### 🏛️ Head of Department (HOD)
* **Appraisal Review Center:** Review and approve exam moderations, teaching observations, and course syllabi compliance.
* **Faculty & Course Oversight:** Monitor lecturer workload, assigned sections, and syllabus progress.
* **At-Risk Lecturer Detection:** Identify lagging course syllabi, missed deadlines, and trigger alert notifications.
* **Department Analytics & Reports:** Generate comprehensive compliance reports with Excel and PDF exports.

### 📋 Data Entry Officer (DEO)
* **Appraisal Dispatch Center:** Fast dispatch and assignment of evaluation workflows (Form A, Form B, Form C).
* **Assignments Registry:** Live search, filtering, and assignment tracking with responsive skeleton loaders.

### 🎓 Lecturer Portal
* **Course Workspaces:** Manage course topics, syllabus completion, and learning resource uploads.
* **Appraisal Submissions:** Submit syllabus compliance reports, course files, and appraisal self-evaluations.
* **Peer Reviews & Moderations:** Perform assigned internal exam moderation and teaching observation reviews.
* **Schedule & Calendar:** View upcoming classes and observation dates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **Frontend** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), SWR (Client-side Data Fetching), Recharts |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM 7.5](https://www.prisma.io/) (with `@prisma/adapter-pg` connection pool) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) (Credentials, Google OAuth / Mock OAuth) |
| **File Processing** | `exceljs`, `pdf-parse`, `csv-parser`, `@vercel/blob` |
| **Background Tasks** | `node-cron` (automated deadline audits & notifications via `instrumentation.ts`) |
| **Email Service** | [Resend](https://resend.com/) & [Nodemailer](https://nodemailer.com/) |
| **Observability & Testing** | [Sentry](https://sentry.io/), [Playwright](https://playwright.dev/), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20+` or `v22+` recommended
* **Database**: PostgreSQL (e.g., [Neon](https://neon.tech/), local PostgreSQL instance, or Supabase)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd lamas
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the variables accordingly:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/lamas_db?sslmode=prefer"

# NextAuth Secret & Base URL
AUTH_SECRET="your-generated-auth-secret"
NEXTAUTH_SECRET="your-generated-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (Resend or SMTP)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="LAMAS System <noreply@lamas.edu>"

# Optional: Sentry Error Monitoring
# SENTRY_DSN="https://key@ingest.sentry.io/project"
```

> **Tip:** You can generate an auth secret using `openssl rand -base64 32`.

### 3. Setup the Database

Generate Prisma client artifacts, push schema migrations, and seed initial demo data:

```bash
# Push schema to database
npm run db:push

# Seed default roles, users, departments, and course data
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with hot reload |
| `npm run build` | Builds the production bundle |
| `npm run start` | Runs the production build |
| `npm run lint` | Runs ESLint checks |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm run seed` | Seeds the PostgreSQL database with demo academic data |
| `npm run db:push` | Pushes the Prisma schema to the active database |
| `npm run db:migrate` | Runs database migrations in development |
| `npm run db:studio` | Opens Prisma Studio GUI to inspect and manage database records |
| `npm run test:e2e` | Runs end-to-end tests with Playwright |
| `npm run test:a11y` | Executes automated accessibility tests |
| `npm run analyze` | Builds the application with `@next/bundle-analyzer` |

---

## 📂 Project Architecture

```
├── app/                      # Next.js App Router
│   ├── (auth)/               # Authentication pages (login, reset password)
│   ├── (dashboard)/          # Role-based dashboard layouts & routes
│   │   ├── admin/            # SuperAdmin portal
│   │   ├── hod/              # Head of Department portal
│   │   ├── deo/              # Data Entry Officer portal
│   │   └── lecturer/         # Lecturer portal
│   ├── api/                  # Backend REST API route handlers
│   ├── globals.css           # Design tokens, theme variables, and Tailwind base
│   └── layout.tsx            # Root application layout
├── components/               # Modular UI Components
│   ├── admin/                # Admin views (Academics, Deadlines, At-Risk, Logs)
│   ├── hod/                  # HOD views (Review Center, Observations, Reports)
│   ├── deo/                  # DEO views (Forms dispatch)
│   ├── lecturer/             # Lecturer views (Courses, Appraisals, Submissions)
│   ├── layout/               # Global Header, Sidebar, and Breadcrumbs
│   └── ui/                   # Reusable UI primitives (Buttons, Modals, Skeletons)
├── context/                  # Global React Context providers (Theme, Auth, Terms)
├── lib/                      # Backend utility libraries & shared logic
│   ├── prisma.ts             # PostgreSQL connection pool & Prisma client singleton
│   ├── permissions.ts        # RBAC role permissions
│   ├── cron.ts               # Background schedule & deadline cron worker
│   ├── email.ts              # Transactional email dispatches (Resend/Nodemailer)
│   ├── rate-limit.ts         # In-memory sliding-window API rate limiter
│   └── validation.ts         # Zod schemas for input validation
├── prisma/
│   ├── schema.prisma         # Prisma database schema definition
│   └── seed.ts               # Database seeder script
├── public/                   # Static assets & public uploads directory
└── instrumentation.ts        # Server lifecycle hook (Cron jobs & Sentry init)
```

---

## 🔒 Security & Best Practices

* **Role Guarding & Route Protection:** Implemented in NextAuth callbacks and layout-level checkpoints to prevent unauthorized role escalation.
* **Strict CSP & Security Headers:** Configured in `next.config.ts` with Content Security Policy, HSTS, X-Frame-Options, and no-sniff protections.
* **Password Policy:** Enforces bcrypt hashing and requires password changes upon first login.
* **Sliding Window Rate Limiting:** Prevents API abuse on authentication and submission endpoints.
* **Type Safety:** Full end-to-end TypeScript typing with Zod schema validation on API payloads.

---

## 📄 License

This project is proprietary and intended for institutional academic monitoring and appraisal operations.

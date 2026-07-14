# TRSYP 3.0

Full-stack Modular Monolith platform built with NestJS, Next.js, PostgreSQL, and AI-powered features.

---

## Architecture

- **Backend** — NestJS (TypeScript), Modular Monolith, Clean Architecture
- **Frontend** — Next.js App Router, React, TailwindCSS, shadcn/ui
- **Database** — PostgreSQL (Supabase-ready) via Prisma ORM
- **AI** — SBERT embeddings + Qdrant vector database
- **Communication** — EventEmitter2 for internal domain events

### Domain Modules

| Module             | Responsibility                                 |
| ------------------ | ---------------------------------------------- |
| AuthModule         | Authentication & authorization                 |
| RegistrationModule | User/participant registration                  |
| PaymentModule      | Payment processing                             |
| RoomingModule      | Room allocation & management                   |
| VisaModule         | Visa application & tracking                    |
| ChatbotModule      | AI chatbot with FAQ, embeddings, vector search |
| NotificationModule | In-app notifications                           |
| Supabase Auth      | Account confirmation and password recovery email |
| AdminModule        | Admin panel & management                       |

### Architecture Rules

- No cross-module direct imports
- Modules communicate only via domain events (EventEmitter2)
- Each module owns its domain and data
- Clean Architecture with Dependency Inversion
- Ready for future microservice extraction

---

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- npm or yarn

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd TRSYP3.0
```

### 2. Start infrastructure (PostgreSQL + Qdrant)

```bash
docker-compose up -d postgres qdrant
```

### 3. Backend setup

```bash
cd backend
cp .env.example .env     # Configure your environment variables
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Backend runs on `http://localhost:3001`

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Docker (Full Stack)

Run the entire stack with Docker Compose:

```bash
docker-compose up --build
```

| Service     | Port                  |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| PostgreSQL  | localhost:5432        |
| Qdrant      | http://localhost:6333 |
| Qdrant gRPC | localhost:6334        |

---

## Project Structure

```
TRSYP3.0/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── common/                  # Shared interfaces, base events
│   │   ├── config/                  # App & database configuration
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── chatbot/
│   │   │   │   ├── embeddings/      # SBERT embedding service
│   │   │   │   ├── faq/             # FAQ management
│   │   │   │   └── vector-store/    # Qdrant integration
│   │   │   ├── email/
│   │   │   ├── notification/
│   │   │   ├── payment/
│   │   │   ├── registration/
│   │   │   ├── rooming/
│   │   │   └── visa/
│   │   ├── prisma/                  # Prisma service & module
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Auth route group
│   │   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── payment/
│   │   │   ├── registration/
│   │   │   ├── rooming/
│   │   │   └── visa/
│   │   ├── components/ui/          # shadcn/ui components
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api/                # API abstraction layer
│   │   │   └── utils.ts            # Utility functions (cn)
│   │   └── middleware.ts           # Route protection
│   ├── .env.example
│   ├── components.json            # shadcn/ui config
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

### Backend (`.env`)

| Variable           | Description                    | Default                 |
| ------------------ | ------------------------------ | ----------------------- |
| `NODE_ENV`         | Environment                    | `development`           |
| `PORT`             | Server port                    | `3001`                  |
| `DATABASE_URL`     | PostgreSQL connection (pooled) | —                       |
| `DIRECT_URL`       | PostgreSQL direct connection   | —                       |
| `QDRANT_URL`       | Qdrant vector DB URL           | `http://localhost:6333` |
| `FRONTEND_URL`     | Frontend origin for CORS       | `http://localhost:3000` |
| `SBERT_MODEL_NAME` | SBERT model for embeddings     | `all-MiniLM-L6-v2`      |

### Frontend (`.env.local`)

| Variable              | Description          | Default                     |
| --------------------- | -------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` |

---

## Supabase Setup

To connect to Supabase instead of local PostgreSQL:

1. Create a Supabase project at https://supabase.com
2. Copy connection strings from **Settings > Database**
3. Update `DATABASE_URL` and `DIRECT_URL` in `backend/.env`

---

## License

Private — All rights reserved.

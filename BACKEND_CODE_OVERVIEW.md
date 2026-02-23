# Backend Code Overview (app-backend)

**Root:** `/Users/madhukar/dev/Telemedicine/app-backend`

---

## 1. Stack & entry

| Item | Details |
|------|--------|
| **Framework** | NestJS 11 |
| **Runtime** | Node (TypeScript) |
| **DB** | PostgreSQL via Prisma 6.7 |
| **Cache** | Redis/KeyDB (optional) |
| **API prefix** | `/api/v1` (health at `/health`, `/healthz`) |
| **Docs** | Swagger at `/api/docs` |

**Entry & bootstrap**
- `src/main.ts` – creates app, global prefix, validation pipe, CORS, Helmet, WebSocket adapter, Swagger, shutdown hooks.
- `src/app.module.ts` – root module: imports Config, Database, Cache, Throttler, Health, Auth, then all feature modules.

**Scripts (package.json)**
- `npm run build` → `nest build`
- `npm run start` → `nest start` (or `node dist/src/main` for prod)
- `npm run start:dev` → watch mode
- `prisma:generate`, `prisma:seed`, `openapi:generate`, etc.

---

## 2. Directory structure

```
app-backend/
├── prisma/                    # Schema & migrations
│   ├── schema.prisma          # Generator + datasource only
│   ├── identity.prisma        # Account, Patient, Doctor, Admin, DeviceToken
│   ├── enums.prisma           # AccountRole, AccountStatus, DoctorApprovalStatus, etc.
│   ├── auth.prisma            # Session, OTP, etc.
│   ├── consultation.prisma     # Consultation, Message, etc.
│   ├── financial.prisma       # Wallet, Transaction, Payment
│   ├── reference.prisma       # Specialization, Symptom, Language, MedicalCouncil, etc.
│   ├── junction.prisma        # Many-to-many tables
│   ├── migrations/
│   ├── seed.ts
│   └── seed-data/*.json
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/                # configuration.ts, env.validation.ts
│   ├── common/                # filters, guards, dto, utils
│   ├── docs/                  # swagger.config.ts
│   ├── health/                # health.controller.ts
│   ├── infrastructure/
│   │   ├── database/          # PrismaModule, PrismaService
│   │   ├── cache/             # Redis/KeyDB
│   │   ├── utils/             # UserAgent, RequestUtils
│   │   ├── external/          # OTP (MSG91, Twilio), Razorpay, Zegocloud, S3
│   │   └── websocket/         # RedisIoAdapter
│   └── modules/
│       ├── auth/              # JWT, OTP, sessions, guards (JwtAuthGuard, RolesGuard, DoctorActiveGuard)
│       ├── admin/             # Admin-only API (doctors, patients, bookings, payouts, analytics, reference data, dev)
│       ├── doctors/           # Doctor profile, KYC, onboarding, auth
│       ├── patient/           # Patient profile, search doctors, favorites
│       ├── shared/             # Public reference data (no auth)
│       ├── consultations/     # Request, accept, end, settle, status
│       ├── messages/          # REST + Socket.IO gateway
│       ├── payments/          # Razorpay recharge, webhook, reconciliation
│       ├── wallets/           # Balance, transactions (doctor/patient)
│       ├── upload/            # Presigned S3 URLs
│       ├── calls/             # Zegocloud call token, start/end
│       ├── reviews/           # Consultation reviews
│       ├── availability/      # Doctor online/offline
│       ├── notifications/     # FCM device tokens
│       ├── billing/           # Billing service
│       └── users/             # Users service/repository (internal)
└── test/, scripts/
```

---

## 3. API route map (from app.module and modules)

| Prefix | Auth | Description |
|--------|------|-------------|
| `GET /health`, `GET /healthz` | No | Liveness / readiness |
| **Auth** | | |
| `POST /api/v1/auth/otp/send` | No | Request OTP (patient/doctor) |
| `POST /api/v1/auth/otp/verify` | No | Verify OTP, login |
| `POST /api/v1/auth/otp/send-test` | No | [DEV] Test OTP |
| `POST /api/v1/auth/refresh` | Yes | Refresh token |
| `POST /api/v1/auth/logout` | Yes | Logout |
| `GET /api/v1/auth/me` | Yes | Current user |
| **Admin** | JWT + ADMIN | |
| `POST /api/v1/admin/auth/login` | No | Admin login (email/password) |
| `POST /api/v1/admin/auth/logout` | Yes | Admin logout |
| `GET /api/v1/admin/doctors/pending` | Yes | Pending KYC list |
| `GET /api/v1/admin/doctors` | Yes | All doctors (search, sort, filter) |
| `GET /api/v1/admin/doctors/:id` | Yes | Doctor details |
| `PUT /api/v1/admin/doctors/:id/approve` | Yes | Approve KYC |
| `PUT /api/v1/admin/doctors/:id/reject` | Yes | Reject KYC |
| `PUT /api/v1/admin/doctors/:id/suspend` | Yes | Suspend doctor |
| `PUT /api/v1/admin/doctors/:id/unsuspend` | Yes | Unsuspend doctor |
| `GET /api/v1/admin/patients` | Yes | Patients list |
| `GET /api/v1/admin/patients/:id` | Yes | Patient detail |
| `GET /api/v1/admin/bookings` | Yes | Bookings (consultations) |
| `GET /api/v1/admin/payouts/requests` | Yes | Payout requests (stub) |
| `GET /api/v1/admin/analytics/overview` | Yes | Dashboard overview |
| `GET /api/v1/admin/dashboard/metrics` | Yes | Financial metrics |
| `GET /api/v1/admin/payments` | Yes | Payments list |
| `POST /api/v1/admin/payments/verify-order/:orderId` | Yes | Verify Razorpay order |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/specializations` | Yes | CRUD specializations |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/symptoms` | Yes | CRUD symptoms |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/symptom-categories` | Yes | CRUD symptom categories |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/languages` | Yes | CRUD languages |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/medical-councils` | Yes | CRUD medical councils |
| `GET/POST/PUT/DELETE /api/v1/admin/reference-data/medical-approaches` | Yes | CRUD medical approaches |
| `POST /api/v1/admin/dev/clear-doctors-patients` | Yes | [DEV] Clear doctors & patients |
| `POST /api/v1/admin/dev/add-test-money` | Yes | [DEV] Add test money to patient wallet |
| **Shared** | No | Public reference data |
| `GET /api/v1/shared/specializations` | No | Active specializations |
| `GET /api/v1/shared/symptoms` | No | Active symptoms |
| `GET /api/v1/shared/symptom-categories` | No | Symptom categories |
| `GET /api/v1/shared/languages` | No | Languages |
| `GET /api/v1/shared/medical-councils` | No | Medical councils |
| `GET /api/v1/shared/medical-approaches` | No | Medical approaches |
| **Patient** | JWT + PATIENT | Profile, doctors search, favorites, consultations, payments, wallet |
| **Doctor** | JWT + DOCTOR | Profile, KYC, onboarding, availability, consultations, wallet, earnings |
| **Consultations** | JWT (role per endpoint) | Request, accept, end, settle, status, messages |
| **Messages** | JWT | REST history + Socket.IO `/messages` namespace |
| **Upload** | JWT | Presigned S3 upload/get |
| **Calls** | JWT | Zegocloud token, start/end call |
| **Payments** | Webhook + JWT | Recharge, webhook, history |
| **Wallets** | JWT | Balance, transactions |
| **Notifications** | JWT | Register device token (FCM) |

---

## 4. Key files for “admin panel” features

| Feature | Controller | Service | DTOs (sample) |
|---------|------------|--------|----------------|
| Admin auth | `admin-auth.controller.ts` | (AuthModule) | `admin-login.dto.ts`, `admin-login-response.dto.ts` |
| Doctors (list, detail, approve, reject, suspend, unsuspend) | `admin-doctors.controller.ts` | `admin.service.ts` | `get-doctors.query.dto.ts`, `get-doctor-details-response.dto.ts`, `approve-doctor-kyc.dto.ts`, `reject-doctor-kyc.dto.ts` |
| Patients | `admin-patients.controller.ts` | `admin.service.ts` | `get-patients.query.dto.ts`, `get-patients-response.dto.ts` |
| Bookings | `admin-bookings.controller.ts` | `admin.service.ts` | `get-bookings.query.dto.ts`, `get-bookings-response.dto.ts` |
| Payouts | `admin-payouts.controller.ts` | (stub) | `get-payouts-requests-response.dto.ts` |
| Analytics / dashboard | `admin-analytics.controller.ts` | `admin-dashboard.service.ts` | `admin-analytics-overview.dto.ts`, `admin-dashboard-metrics.dto.ts` |
| Payments | `admin-payments.controller.ts` | Uses PaymentsModule | `get-payments-list.query.dto.ts`, `get-payments-list-response.dto.ts` |
| Reference data | `admin-reference-data.controller.ts` | `admin.service.ts` | create/update DTOs per entity (specializations, symptoms, languages, medical-councils, etc.) |
| Dev | `admin-dev.controller.ts` | `admin.service.ts` | `add-test-money.dto.ts` |

---

## 5. Auth & guards

- **JWT:** `AuthModule` → `JwtAuthGuard` (`auth/guards/jwt-auth.guard.ts`), `JwtStrategy` (`auth/strategies/jwt.strategy.ts`).
- **Roles:** `RolesGuard` (`auth/guards/roles.guard.ts`) + `@Roles('ADMIN' | 'DOCTOR' | 'PATIENT')` decorator (`auth/decorators/roles.decorator.ts`).
- **Doctor active (block suspended):** `DoctorActiveGuard` (`auth/guards/doctor-active.guard.ts`) – use on doctor routes after JWT + Roles; returns 401 if `Account.status !== ACTIVE`.
- **Sessions:** `SessionService` (`auth/services/session.service.ts`) – invalidate on logout / suspend (`InvalidateReason.ACCOUNT_SUSPENDED`).

---

## 6. Data model (Prisma – high level)

- **Account** – id (UUID), phoneNumber, role (PATIENT | DOCTOR | ADMIN), status (ACTIVE | SUSPENDED | …), optional Patient/Doctor/Admin profile.
- **Doctor** – accountId (PK), doctorReferenceToken (token number), name, email, KYC fields, specializationId, medicalCouncilId, ratePerMinute, ratingAvg/ratingCount, etc.
- **Patient** – accountId (PK), name, profile, medical conditions, languages, favorites.
- **Admin** – accountId (PK), email, passwordHash.
- **Consultation** – patient/doctor, status (REQUESTED → ACCEPTED → ENDED → SETTLED), timing, amount.
- **Wallet**, **Transaction**, **Payment** – recharges, consultation debits, doctor earnings, platform commission.
- **Reference** – Specialization, Symptom, SymptomCategory, Language, MedicalCouncil, MedicalApproach, etc.

Enums: `prisma/enums.prisma` (AccountRole, AccountStatus, DoctorApprovalStatus, ConsultationStatus, PaymentStatus, etc.).

---

## 7. Config & env

- **Config source:** `src/config/configuration.ts` (reads `process.env`, builds `database.url`, etc.).
- **Validation:** `src/config/env.validation.ts` (e.g. Joi schema).
- **Env vars (typical):** `APP_PORT`, `NODE_ENV`, `DATABASE_URL` or `DB_*`, `JWT_SECRET`, `CACHE_*`, `OTP_PROVIDER`, `MSG91_*` / `TWILIO_*`, `RAZORPAY_*`, `ZEGOCLOUD_*`, `AWS_*`, `FIREBASE_*`, etc.

---

## 8. How to “check backend code fully”

1. **Entry & app wiring:** `src/main.ts`, `src/app.module.ts`.
2. **Routes:** Each `modules/*/*.controller.ts` – see `@Controller()`, `@Get()`, `@Put()`, etc.
3. **Business logic:** Corresponding `*.service.ts` (e.g. `admin.service.ts` for doctor suspend/unsuspend, KYC, etc.).
4. **Data layer:** Prisma in `infrastructure/database/prisma.service.ts`; models in `prisma/*.prisma`.
5. **Auth:** `modules/auth/` – controllers, guards, strategies, session and token services.
6. **DTOs:** `modules/*/dto/*.dto.ts` – request/response shapes and validation.
7. **Config:** `config/configuration.ts` and `config/env.validation.ts`.
8. **Tests:** `*.spec.ts` and `*.e2e-spec.ts` next to modules or under `test/`.

Use this file as a map; open the listed files in the repo at `/Users/madhukar/dev/Telemedicine/app-backend` to read the actual implementation.

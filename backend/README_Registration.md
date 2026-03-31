# TRSYP 3.0 Backend - Registration Module

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed test data
npx ts-node prisma/seed.ts

# Start server
npm run start
```

Server runs at: http://localhost:3001

---

## Swagger Documentation

Open: **http://localhost:3001/api/docs**

### Authentication

Click **"Authorize"** button and enter one of these tokens:

| Token | Role | Use For |
|-------|------|---------|
| `dev-token` | User | Registration, profile, visa request |
| `admin-token` | Admin | List participants, ban/unban, approve visa |

---

## API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/registration` | Register as local participant |
| POST | `/registration/international` | Register as international participant |
| GET | `/registration/profile` | Get my profile |
| PATCH | `/registration/profile` | Update my profile |
| DELETE | `/registration/profile` | Delete my registration |
| POST | `/registration/visa` | Request visa letter |
| GET | `/registration/visa` | Get my visa application |
| PATCH | `/registration/visa` | Update visa application |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/registration/admin/participants` | List all participants |
| GET | `/registration/admin/participants/:id` | Get participant by ID |
| POST | `/registration/admin/participants/:id/ban` | Ban participant |
| POST | `/registration/admin/participants/:id/unban` | Unban participant |
| POST | `/registration/admin/visa/:id/approve` | Approve visa |
| POST | `/registration/admin/visa/:id/reject` | Reject visa |
| POST | `/registration/admin/visa/:id/mark-sent` | Mark visa letter sent |

---

## Example Requests

### Register Local Participant
```json
POST /registration
Authorization: Bearer dev-token

{
  "phone": "+21612345678",
  "gender": "male",
  "participantType": "Student",
  "sb": "INSAT",
  "country": "Tunisia"
}
```

### Register International Participant
```json
POST /registration/international
Authorization: Bearer dev-token

{
  "phone": "+21312345678",
  "gender": "female",
  "participantType": "YoungProfessional",
  "country": "Algeria",
  "internationalInfo": {
    "dateOfBirth": "1995-06-15",
    "countryOfResidence": "Algeria",
    "cityOfResidence": "Algiers",
    "affiliation": "University of Algiers",
    "expectedArrivalDate": "2026-07-15",
    "expectedDepartureDate": "2026-07-20",
    "requiresVisaLetter": true
  }
}
```

### Request Visa Letter
```json
POST /registration/visa
Authorization: Bearer dev-token

{
  "passportNumber": "AB1234567",
  "passportIssuanceCountry": "Algeria",
  "issuingOffice": "Algiers Central Office",
  "passportIssuanceDate": "2020-01-15",
  "passportExpiryDate": "2030-01-15",
  "embassyAddress": "18 Avenue de la République, Tunis 1000, Tunisia",
  "residenceAddress": "123 Rue Didouche Mourad, Algiers 16000, Algeria"
}
```

---

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:cov
```

---

## Enums

### ParticipantType
- `NonIEEE`
- `Student`
- `YoungProfessional`

### Student Branch (SB)
- `INSAT`, `ESPRIT`, `SUPCOM`, `ENIT`, `ENETCOM`, `ENIS`, `Other`

### Country
- `Tunisia`, `Algeria`, `Morocco`, `Libya`, `Egypt`, `USA`, `UK`, `Canada`, `Germany`, `France`, `Italy`, `Spain`, `UAE`, `SaudiArabia`, `Jordan`, `Lebanon`, `Palestine`, `Syria`, `Iraq`, `Sudan`, `Turkey`, `India`, `Pakistan`, `Bangladesh`, `China`, `Japan`, `SouthKorea`, `Australia`, `Brazil`, `Argentina`, `Mexico`, `Other`

### VisaStatus
- `Pending`
- `Approved`
- `Rejected`
- `LetterSent`

---

## Database

Using PostgreSQL via Supabase. Configure in `.env`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Prisma Commands

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

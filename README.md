# Grameen Udyog — AI Business Advisory

Hyper-local AI business advisor + government-loan scheme calculator for rural India.
**Stack:** React (Vite) frontend · Node.js/Express backend · MongoDB.

## Features
- 4-step advisory wizard → detailed feasibility report
- Precise loan calculator (Monthly / Quarterly EMI, moratorium, amortisation)
- Revenue & cost breakdown, factor-based viability score, nuanced AI recommendation
- Government schemes explorer (PMEGP, MUDRA, Stand-Up India, NSFDC, CGTMSE) + documents & subsidy
- Category-specific nearby vendors (price + contact) and a supply-chain map
- Community: users add local shops and earn points (unlocked after 2 community upvotes) + leaderboard

---

## Run locally (VS Code)
Prereqs: Node 18/20+, Yarn, MongoDB (local or Atlas).

**1) Backend** — create `backend/.env`:
```
MONGO_URL=mongodb://localhost:27017        # or your Atlas SRV string
DB_NAME=grameen_udyog
JWT_SECRET=change_me_to_a_long_random_string
GEMINI_API_KEY=                            # optional; empty = built-in fallback
GEMINI_MODEL=gemini-2.5-flash
PORT=8001
```
```bash
cd backend && npm install && node server.js
```

**2) Frontend** — create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```
```bash
cd frontend && yarn install && yarn start
```
Open http://localhost:3000

---

## Deploy on Render (single web service)
The root `server.js` serves both the API and the built React app, so one service is enough.

**Option A — Blueprint (fastest):** push to GitHub → Render → **New → Blueprint** → pick this repo (`render.yaml` is auto-detected) → in the dashboard paste your **MongoDB Atlas** `MONGO_URL`.

**Option B — Manual:** Render → **New → Web Service** → connect repo →
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables:
  - `MONGO_URL` = your Atlas connection string
  - `DB_NAME` = `grameen_udyog`
  - `JWT_SECRET` = any long random string
  - (`PORT` is provided by Render automatically)

> In MongoDB Atlas → **Network Access**, add `0.0.0.0/0` so Render can connect.
> The frontend calls the API on the same origin (`/api`), so no frontend env var is required on Render.

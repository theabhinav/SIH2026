# Grameen Udyog — AI Business Advisory (PRD)

## Original Problem Statement
Convert an existing project into a React (Vite) frontend + Node/Express backend with no errors.
The project is "Grameen Udyog AI Advisory" — a hyper-local AI business advisor + government-loan
scheme calculator for rural/semi-urban entrepreneurs in India.

## Stack (after conversion)
- Frontend: React 19 + Vite 5 (migrated from CRA/craco), Tailwind, shadcn/ui, recharts, lucide-react.
  Runs via supervisor `frontend` (`yarn start` -> vite) on port 3000.
- Backend: Node.js/Express + MongoDB (mongodb driver). Runs via supervisor `node-backend`
  (`/app/backend/run.sh`) on port 8001. The default python `backend` program is intentionally stopped.
- Auth: JWT (Bearer header) + bcrypt, users persisted in Mongo. Errors returned in `detail`.
- AI: Google Gemini (user's own GEMINI_API_KEY, direct Google API). Empty by default ->
  deterministic narrative fallback. All financial numbers are computed server-side regardless.

## Implemented (2026-06)
- CRA -> Vite migration; production build passes with 0 errors.
- MongoDB persistence for users, reports, and community shops.
- Calculator fixed + made precise: month-by-month amortisation ledger, interest-only moratorium,
  consistent quarterly/yearly rollups, monthly vs quarterly repayment option, input validation (min ₹5,000).
- Revenue & cost model: monthly revenue + 5-part cost breakdown (raw material, worker, inventory,
  operational, other), gross/net profit, net margin, annual ROI, break-even.
- Viability score reworked: factor-based (profitability, demand, purchasing power, competition,
  capital adequacy) — varies per input, no longer always 80+.
- Nuanced AI recommendation: verdict (Recommended / Proceed with Caution / Marginal / Not Recommended),
  suggested capital, rationale, long-term outlook (suggests a suitable amount for long-term benefit).
- Government schemes explorer (PMEGP, MUDRA, Stand-Up India, NSFDC, CGTMSE) with eligibility +
  required documents + subsidy; plus a Government Support block (documents + subsidies + notes).
- Nearby vendors (raw material / machinery / packaging) with price, contact, distance, rating.
- Supply-chain map (Source -> Production -> Storage -> Distribution -> Customer).
- Community feature: signed-in users add nearby shops to earn points (+10 details, +5 photo,
  +3 contact) and +2 per upvote received; upvoting, and a leaderboard. Points badge in NavBar.

## Testing
- iteration_1: backend 100% (17/17), frontend 100%. No critical/blocking issues.

## Backlog / Next
- P1: Enable real Gemini AI (user to paste GEMINI_API_KEY into backend/.env).
- P2: Code-split the frontend bundle (recharts/jspdf) to reduce main chunk size.
- P2: Floor community points at 0 on un-upvote; split server.js into routes/services.
- P2: Multilingual report text for ta/te/bn/mr (currently English fallback).

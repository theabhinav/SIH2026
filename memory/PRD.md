# Grameen Udyog — AI Business Advisory (PRD)

## Original Problem Statement
Convert an existing project into React (Vite) frontend + Node/Express backend with no errors,
plus feature requests. App: hyper-local AI business advisor + govt-loan scheme calculator for rural India.

## Stack
- Frontend: React 19 + Vite 5 (migrated from CRA/craco). Supervisor `frontend` (`yarn start` -> vite) :3000.
- Backend: Node.js/Express + MongoDB. Supervisor `node-backend` (`/app/backend/run.sh`) :8001.
  Python `backend` program intentionally stopped.
- Auth: JWT (Bearer) + bcrypt, users in Mongo. Errors in `detail`.
- AI: Gemini (optional GEMINI_API_KEY) -> deterministic fallback. All numbers computed server-side.
- Deploy: root `server.js` serves API + built React; `render.yaml` blueprint for Render single web service.

## Implemented
- 2026-06 (iter 1): CRA->Vite; MongoDB; precise calculator + monthly/quarterly; revenue/cost model;
  varied viability; nuanced recommendation; govt schemes + docs + subsidy; vendors; supply-chain map;
  Community (add shops, points, upvotes, leaderboard, points badge). Tests 100%.
- 2026-06 (iter 2):
  - BUG FIX: report is now category-specific — CATEGORY_SUPPLY map (all 20 categories) drives
    raw materials / machinery / supply-chain sourcing (no more generic "Primary Raw Material").
  - RULE CHANGE: contributor points unlock ONLY after 2 upvotes (add awards 0 + points_pending;
    credited at 2 upvotes; debited if drops below; self-upvote blocked).
  - MongoDB Atlas wired for deploy; frontend API falls back to relative `/api` (same-origin on Render).
  - Added render.yaml + README; removed CRA/QA leftovers. Tests 100% (14/14 backend + E2E).

## Env notes
- backend/.env and frontend/.env are gitignored -> on Render set env vars in dashboard (MONGO_URL Atlas,
  DB_NAME, JWT_SECRET). Preview pod uses LOCAL MongoDB because Atlas TLS handshake resets from this pod.
- Atlas: whitelist 0.0.0.0/0 in Network Access.

## Backlog / Next
- P1: Real Gemini AI (add GEMINI_API_KEY).
- P2: Personal profile (my shops + points), report share (WhatsApp/link).
- P2: Split server.js into modules; code-split frontend bundle.
- P2: Multilingual report text (ta/te/bn/mr).

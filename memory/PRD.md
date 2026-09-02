# Grameen Udyog — PRD

## Original Problem
Build a hyper-local NLP-powered multilingual AI Business Advisory Assistant + Smart Scheme Calculator for rural/semi-urban entrepreneurs applying for concessional government loans (10% margin, 90% loan). Two modules: (1) Hyper-Local Feasibility Report — Market Reach, Opportunities, SWOT, Threats, Competitors, Pricing; (2) Smart Financial Calculator — Project Cost = Margin/10%, auto-scheme selection (Micro Finance ≤₹1.40L @6.5%/3yr/3mo moratorium OR Term Loan ≤₹50L @8%/7yr/6mo moratorium), EMI + quarterly repayment.

## Personas
- Rural/semi-urban first-time entrepreneur seeking SCA loan (NSFDC/NBCFDC/NSKFDC-style).
- Field officer helping applicants structure a feasibility case.

## Architecture
- Backend: FastAPI + MongoDB, JWT auth, Gemini 3.1 Pro via emergentintegrations for feasibility reports; pure-python financial engine for scheme routing/EMI/amortization.
- Frontend: React + Tailwind + shadcn/ui + recharts + jsPDF/html2canvas; 6-language i18n scaffold; multi-step wizard; ReportView with SWOT bento, charts, quarterly table, PDF export.

## Implemented (2026-02)
- Auth: register / login / me (JWT).
- Endpoints: /api/calculator/compute, /api/feasibility/generate (Gemini), /api/reports CRUD, /api/locations, /api/business-categories.
- Frontend: Landing, Auth pages, 4-step Advisory wizard (Location→Business→Capital→Generate), ReportView (executive summary, viability score, scheme card, capital pie, market reach, opportunities, SWOT, threats detail, competitors, pricing, amortization chart, quarterly table, roadmap, gov support), Reports history with view/delete, PDF download, 6-language switcher (EN/HI/TA/TE/BN/MR).
- Design: earthy palette (deep forest green + terracotta + sand), Manrope + Noto Sans, flat surfaces, sharp borders.

## Backlog
- P1: Login with Google (Emergent Auth) alongside JWT.
- P1: Save/edit report after generation (currently auto-saved when logged in).
- P2: Wider location dataset (all 28 states / all districts).
- P2: Rupee-format speech-to-text for elderly users.
- P2: Share report via WhatsApp / SMS link.

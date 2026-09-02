from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import uuid
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = 'HS256'
JWT_EXP_DAYS = 30

app = FastAPI(title="Grameen Udyog AI Advisory")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- Models ----------
class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class AuthResp(BaseModel):
    token: str
    user: dict

class FeasibilityReq(BaseModel):
    state: str
    district: str
    block: str
    village: str
    business_category: str
    margin_capital: float
    language: str = "en"  # en, hi, ta, te, bn, mr

class CalculatorReq(BaseModel):
    margin_capital: float

class SaveReportReq(BaseModel):
    input_data: dict
    feasibility: dict
    financials: dict

# ---------- Auth helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def optional_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None

# ---------- Financial calculator core ----------
MICRO_LIMIT = 140_000  # ₹1.40 lakh
TERM_LIMIT = 5_000_000  # ₹50 lakh
MICRO_MAX_LOAN = 125_000
TERM_MAX_LOAN = 4_500_000

def compute_scheme(margin_capital: float) -> dict:
    if margin_capital <= 0:
        raise ValueError("Margin capital must be positive")

    # Total project cost derived from 10% margin
    project_cost = round(margin_capital / 0.10, 2)
    loan_needed = round(project_cost - margin_capital, 2)

    if project_cost <= MICRO_LIMIT:
        scheme = "Micro Finance Scheme"
        scheme_code = "MICRO"
        interest = 6.5
        tenure_months = 36
        moratorium_months = 3
        max_loan = MICRO_MAX_LOAN
    else:
        scheme = "Term Loan Scheme"
        scheme_code = "TERM"
        interest = 8.0
        tenure_months = 84
        moratorium_months = 6
        max_loan = TERM_MAX_LOAN

    # Cap loan amount at scheme max
    approved_loan = min(loan_needed, max_loan)

    # Eligibility
    within_limit = project_cost <= TERM_LIMIT
    eligible = within_limit and approved_loan > 0

    # EMI calc after moratorium (interest accrues in moratorium then added to principal)
    r_monthly = (interest / 100) / 12
    principal_after_moratorium = approved_loan * ((1 + r_monthly) ** moratorium_months)
    repayment_months = tenure_months - moratorium_months
    if r_monthly == 0:
        emi = principal_after_moratorium / repayment_months
    else:
        emi = principal_after_moratorium * r_monthly * ((1 + r_monthly) ** repayment_months) / (((1 + r_monthly) ** repayment_months) - 1)
    emi = round(emi, 2)
    total_payable = round(emi * repayment_months, 2)
    total_interest = round(total_payable - approved_loan, 2)

    # Quarterly schedule
    quarterly_schedule = []
    balance = principal_after_moratorium
    for q in range(1, (repayment_months // 3) + 1):
        q_principal = 0
        q_interest = 0
        for _ in range(3):
            interest_pay = balance * r_monthly
            principal_pay = emi - interest_pay
            balance -= principal_pay
            q_principal += principal_pay
            q_interest += interest_pay
        quarterly_schedule.append({
            "quarter": q,
            "principal": round(q_principal, 2),
            "interest": round(q_interest, 2),
            "total": round(q_principal + q_interest, 2),
            "balance": round(max(balance, 0), 2)
        })

    # Yearly amortization for chart
    yearly = []
    balance = principal_after_moratorium
    year_principal = 0
    year_interest = 0
    year = 1
    for m in range(1, repayment_months + 1):
        interest_pay = balance * r_monthly
        principal_pay = emi - interest_pay
        balance -= principal_pay
        year_principal += principal_pay
        year_interest += interest_pay
        if m % 12 == 0 or m == repayment_months:
            yearly.append({
                "year": year,
                "principal": round(year_principal, 2),
                "interest": round(year_interest, 2),
                "balance": round(max(balance, 0), 2)
            })
            year_principal = 0
            year_interest = 0
            year += 1

    return {
        "margin_capital": margin_capital,
        "project_cost": project_cost,
        "loan_needed": loan_needed,
        "approved_loan": approved_loan,
        "scheme_name": scheme,
        "scheme_code": scheme_code,
        "interest_rate": interest,
        "tenure_months": tenure_months,
        "tenure_years": round(tenure_months / 12, 1),
        "moratorium_months": moratorium_months,
        "max_loan_cap": max_loan,
        "emi": emi,
        "repayment_months": repayment_months,
        "total_payable": total_payable,
        "total_interest": total_interest,
        "eligible": eligible,
        "within_scheme_limit": within_limit,
        "capped_by_max": loan_needed > max_loan,
        "quarterly_schedule": quarterly_schedule,
        "yearly_schedule": yearly,
        "working_capital_estimate": round(project_cost * 0.15, 2),
        "operational_cost_monthly": round(project_cost * 0.04, 2),
    }

# ---------- LLM prompt for feasibility ----------
LANG_MAP = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
}

def build_feasibility_prompt(req: FeasibilityReq, financials: dict) -> str:
    lang = LANG_MAP.get(req.language, "English")
    return f"""You are an expert institutional-grade rural business consultant for the Government of India's marginalized community empowerment schemes (NSFDC, NBCFDC, NSKFDC style). Your job is to produce a hyper-local, data-driven business feasibility report.

USER INPUTS:
- Village: {req.village}
- Block: {req.block}
- District: {req.district}
- State: {req.state}
- Proposed Business Category: {req.business_category}
- Available Margin Capital: ₹{req.margin_capital:,.0f}
- Auto-computed Total Project Cost: ₹{financials['project_cost']:,.0f}
- Auto-selected Scheme: {financials['scheme_name']} ({financials['interest_rate']}% p.a., {financials['tenure_months']} months)

Generate a comprehensive feasibility report as STRICT JSON ONLY (no markdown, no code fences, no prose outside JSON). Write ALL narrative text in {lang}. Keep numeric values as numbers.

JSON schema:
{{
  "executive_summary": "2-3 sentence overview tailored to the specific district & business",
  "viability_score": <integer 0-100>,
  "viability_label": "one word rating (e.g. Excellent / Strong / Moderate / Cautious / Weak) in {lang}",
  "market_reach": {{
    "consumer_base_estimate": "estimated consumer count in 5-10km radius with reasoning specific to {req.village}, {req.district}",
    "primary_channels": ["channel 1", "channel 2", "channel 3"],
    "radius_km": 8,
    "target_segments": ["segment 1", "segment 2"]
  }},
  "opportunity_analysis": {{
    "unserved_niches": ["niche 1 with local justification", "niche 2", "niche 3"],
    "seasonal_windows": ["festival/season 1", "festival/season 2"],
    "recommended_positioning": "1-2 sentences on how to differentiate locally"
  }},
  "swot": {{
    "strengths": ["s1", "s2", "s3", "s4"],
    "weaknesses": ["w1", "w2", "w3", "w4"],
    "opportunities": ["o1", "o2", "o3", "o4"],
    "threats": ["t1", "t2", "t3", "t4"]
  }},
  "threats_detailed": [
    {{"threat": "name", "severity": "High/Medium/Low", "mitigation": "specific action"}},
    {{"threat": "name", "severity": "High/Medium/Low", "mitigation": "specific action"}},
    {{"threat": "name", "severity": "High/Medium/Low", "mitigation": "specific action"}}
  ],
  "competitor_mapping": {{
    "estimated_density": "e.g., '4-6 similar units within 10km' with reasoning tied to {req.district} economy",
    "competition_level": "Low/Moderate/High/Saturated",
    "key_competitors_type": ["type 1", "type 2"],
    "differentiation_strategy": "specific tactic"
  }},
  "product_market_value": {{
    "suggested_price_range": "₹X - ₹Y per unit with unit definition",
    "regional_purchasing_power_note": "1-2 sentences on local income levels & willingness to pay",
    "pricing_strategy": "e.g., Penetration / Premium / Value / Bundled",
    "monthly_revenue_potential_low": <number>,
    "monthly_revenue_potential_high": <number>
  }},
  "action_roadmap": [
    "Step 1: specific first action tied to {req.business_category} in {req.village}",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ],
  "government_support": ["scheme name & how it helps", "another scheme"],
  "cultural_local_note": "1 sentence on cultural/regional nuance"
}}

Return ONLY the JSON object."""

def extract_json(text: str) -> dict:
    # Remove markdown fences
    text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'\s*```\s*$', '', text.strip(), flags=re.MULTILINE)
    # Grab first JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in LLM response")
    return json.loads(match.group(0))

# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Grameen Udyog AI Advisory API", "status": "live"}

@api_router.post("/auth/register", response_model=AuthResp)
async def register(req: RegisterReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return {"token": make_token(user_id), "user": {"id": user_id, "email": doc["email"], "name": doc["name"]}}

@api_router.post("/auth/login", response_model=AuthResp)
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": make_token(user['id']), "user": {"id": user['id'], "email": user['email'], "name": user['name']}}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/calculator/compute")
async def calculator(req: CalculatorReq):
    try:
        return compute_scheme(req.margin_capital)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/feasibility/generate")
async def feasibility(req: FeasibilityReq, user: Optional[dict] = Depends(optional_user)):
    try:
        financials = compute_scheme(req.margin_capital)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prompt = build_feasibility_prompt(req, financials)
    session_id = str(uuid.uuid4())

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="You are an institutional-grade rural business consultant. Always respond with strict JSON only."
        ).with_model("gemini", "gemini-3.1-pro-preview")

        response = await chat.send_message(UserMessage(text=prompt))
        report = extract_json(response)
    except Exception as e:
        logger.exception("LLM feasibility error")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    result = {
        "id": str(uuid.uuid4()),
        "input": req.model_dump(),
        "feasibility": report,
        "financials": financials,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Auto-save if user logged in
    if user:
        doc = {**result, "user_id": user['id']}
        await db.reports.insert_one(doc)

    return result

@api_router.get("/reports")
async def list_reports(user: dict = Depends(get_current_user)):
    reports = await db.reports.find({"user_id": user['id']}, {"_id": 0}).sort("generated_at", -1).to_list(100)
    return reports

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id, "user_id": user['id']}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, user: dict = Depends(get_current_user)):
    result = await db.reports.delete_one({"id": report_id, "user_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True}

# ---------- Static location dataset ----------
LOCATIONS = {
    "Maharashtra": {
        "Nashik": {"Sinnar": ["Musalgaon", "Nandurshingote", "Pandhurli"], "Igatpuri": ["Ghoti Budruk", "Wadivarhe"]},
        "Pune": {"Junnar": ["Otur", "Narayangaon"], "Ambegaon": ["Manchar", "Ghodegaon"]},
    },
    "Uttar Pradesh": {
        "Varanasi": {"Sevapuri": ["Mirzamurad", "Kachhwa"], "Pindra": ["Baragaon", "Phulwaria"]},
        "Lucknow": {"Malihabad": ["Malihabad", "Rahimabad"], "Mohanlalganj": ["Mohanlalganj", "Nigohan"]},
    },
    "Tamil Nadu": {
        "Coimbatore": {"Pollachi": ["Anaimalai", "Kinathukadavu"], "Sulur": ["Sulur", "Kannampalayam"]},
        "Madurai": {"Melur": ["Melur", "Kottampatti"], "Vadipatti": ["Vadipatti", "T. Kallupatti"]},
    },
    "West Bengal": {
        "Bardhaman": {"Kalna": ["Kalna", "Baghnapara"], "Katwa": ["Katwa", "Ketugram"]},
        "Hooghly": {"Arambagh": ["Arambagh", "Goghat"], "Chinsurah": ["Bansberia", "Mogra"]},
    },
    "Karnataka": {
        "Mysuru": {"Hunsur": ["Hunsur", "Bilikere"], "Piriyapatna": ["Piriyapatna", "Kittur"]},
        "Belagavi": {"Bailhongal": ["Bailhongal", "Kittur"], "Athani": ["Athani", "Ainapur"]},
    },
    "Telangana": {
        "Warangal": {"Wardhannapet": ["Wardhannapet", "Nekkonda"], "Parkal": ["Parkal", "Atmakur"]},
        "Karimnagar": {"Huzurabad": ["Huzurabad", "Veenavanka"], "Jammikunta": ["Jammikunta", "Mustabad"]},
    },
    "Gujarat": {
        "Anand": {"Anand": ["Anand", "Vallabh Vidyanagar"], "Petlad": ["Petlad", "Sojitra"]},
        "Kutch": {"Bhuj": ["Bhuj", "Madhapar"], "Anjar": ["Anjar", "Bhachau"]},
    },
    "Bihar": {
        "Patna": {"Danapur": ["Danapur", "Maner"], "Barh": ["Barh", "Athmalgola"]},
        "Muzaffarpur": {"Kanti": ["Kanti", "Meenapur"], "Motipur": ["Motipur", "Saraiya"]},
    },
}

BUSINESS_CATEGORIES = [
    "Dairy & Milk Products",
    "Poultry Farming",
    "Goat & Sheep Farming",
    "Retail Kirana Store",
    "Textiles & Handloom",
    "Tailoring & Boutique",
    "Beauty Parlour",
    "Mobile Repair & Recharge Shop",
    "Auto/E-Rickshaw Service",
    "Bakery & Confectionery",
    "Tea Stall / Snacks",
    "Vegetable & Fruit Vending",
    "Agri-Inputs (Seeds, Fertilizer)",
    "Fisheries",
    "Handicrafts",
    "Beekeeping",
    "Flour Mill",
    "Papad / Pickle Making",
    "Photocopy & CSC Centre",
    "Two-Wheeler Repair",
]

@api_router.get("/locations")
async def locations():
    return LOCATIONS

@api_router.get("/business-categories")
async def business_categories():
    return BUSINESS_CATEGORIES

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

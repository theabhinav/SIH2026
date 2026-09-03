"""Backend tests for Grameen Udyog AI Advisory (Node/Express)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for local sanity, but env should be set
    BASE_URL = "http://localhost:8001"

API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


def _rand_email(prefix="tester"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}@grameen.in"


@pytest.fixture(scope="session")
def user_a(s):
    email = _rand_email("a")
    r = s.post(f"{API}/auth/register", json={"name": "Tester A", "email": email, "password": "test1234"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "email": email, "password": "test1234"}


@pytest.fixture(scope="session")
def user_b(s):
    email = _rand_email("b")
    r = s.post(f"{API}/auth/register", json={"name": "Tester B", "email": email, "password": "test1234"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "email": email, "password": "test1234"}


def auth_headers(u):
    return {"Authorization": f"Bearer {u['token']}"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        j = r.json()
        assert j.get("status") == "live"

    def test_categories(self, s):
        r = s.get(f"{API}/business-categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) == 20

    def test_locations(self, s):
        r = s.get(f"{API}/locations")
        assert r.status_code == 200
        loc = r.json()
        assert "Maharashtra" in loc
        assert "Nashik" in loc["Maharashtra"]
        assert "Sinnar" in loc["Maharashtra"]["Nashik"]
        assert "Musalgaon" in loc["Maharashtra"]["Nashik"]["Sinnar"]


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_points_zero(self, user_a):
        assert user_a["token"]
        assert user_a["user"]["points"] == 0

    def test_login(self, s, user_a):
        r = s.post(f"{API}/auth/login", json={"email": user_a["email"], "password": user_a["password"]})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == user_a["email"].lower()

    def test_me(self, s, user_a):
        r = s.get(f"{API}/auth/me", headers=auth_headers(user_a))
        assert r.status_code == 200
        j = r.json()
        assert j["email"] == user_a["email"].lower()
        assert "points" in j

    def test_invalid_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "nobody_xyz@x.com", "password": "wrong"})
        assert r.status_code == 401
        assert "detail" in r.json()


# ---------- Calculator ----------
class TestCalculator:
    def test_precision_quarterly(self, s):
        r = s.post(f"{API}/calculator/compute", json={
            "margin_capital": 100000, "repayment_frequency": "quarterly",
            "business_category": "Retail Kirana Store"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["project_cost"] == 1000000
        assert d["loan_needed"] == 900000
        assert d["emi"] > 0
        assert d["repayment_frequency"] == "quarterly"
        qs = d["quarterly_schedule"]
        assert len(qs) > 0
        # last quarter balance ~0
        assert qs[-1]["balance"] <= 1.0
        # totals consistent: sum principal ~ approved_loan
        total_principal = sum(q["principal"] for q in qs)
        assert abs(total_principal - d["approved_loan"]) < 5.0

    def test_precision_monthly(self, s):
        r = s.post(f"{API}/calculator/compute", json={
            "margin_capital": 50000, "repayment_frequency": "monthly",
            "business_category": "Bakery & Confectionery"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["repayment_frequency"] == "monthly"
        assert d["emi_monthly"] > 0

    def test_too_small_margin(self, s):
        r = s.post(f"{API}/calculator/compute", json={"margin_capital": 1000})
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_negative_margin(self, s):
        r = s.post(f"{API}/calculator/compute", json={"margin_capital": -100})
        assert r.status_code == 400


# ---------- Feasibility ----------
class TestFeasibility:
    def _gen(self, s, headers, cat, margin, village="Musalgaon"):
        payload = {
            "state": "Maharashtra", "district": "Nashik", "block": "Sinnar", "village": village,
            "business_category": cat, "margin_capital": margin, "repayment_frequency": "quarterly"
        }
        return s.post(f"{API}/feasibility/generate", json=payload, headers=headers)

    def test_full_generate(self, s, user_a):
        r = self._gen(s, auth_headers(user_a), "Retail Kirana Store", 100000)
        assert r.status_code == 200, r.text
        d = r.json()
        f = d["feasibility"]
        assert "revenue_model" in f
        cb = f["revenue_model"]["cost_breakdown"]
        labels = [c["label"] for c in cb]
        assert len(cb) == 5
        assert any("Raw Material" in l for l in labels)
        assert any("Worker" in l or "Labour" in l for l in labels)
        assert any("Inventory" in l for l in labels)
        assert any("Operational" in l for l in labels)
        assert any("Other" in l for l in labels)
        rec = f["recommendation"]
        for k in ["verdict", "headline", "rationale", "long_term_outlook"]:
            assert k in rec
        # schemes
        schemes = f["government_schemes"]
        assert isinstance(schemes, list) and len(schemes) >= 3
        assert "required_documents" in schemes[0]
        assert isinstance(schemes[0]["required_documents"], list) and len(schemes[0]["required_documents"]) > 0
        # gov support
        gs = f["government_support"]
        assert "required_documents" in gs and "subsidies" in gs and "notes" in gs
        # vendors
        vendors = f["vendors"]
        assert isinstance(vendors, list) and len(vendors) > 0
        v0 = vendors[0]
        for k in ["price", "contact", "distance_km"]:
            assert k in v0
        # supply chain
        assert "stages" in f["supply_chain"] and len(f["supply_chain"]["stages"]) >= 4

    def test_openai_provider_and_narrative(self, s, user_a):
        r = self._gen(s, auth_headers(user_a), "Retail Kirana Store", 100000)
        assert r.status_code == 200, r.text
        f = r.json()["feasibility"]
        assert f.get("ai_provider") == "openai", f"Expected openai, got {f.get('ai_provider')}"
        assert f.get("ai_used") is True
        for k in ["executive_summary", "market_reach", "opportunity_analysis", "swot",
                  "threats_detailed", "competitor_mapping", "product_market_value",
                  "action_roadmap", "cultural_local_note"]:
            assert k in f and f[k], f"Missing/empty narrative field: {k}"
        assert isinstance(f["executive_summary"], str) and len(f["executive_summary"]) > 40
        assert isinstance(f["action_roadmap"], list) and len(f["action_roadmap"]) >= 3

    def test_multiple_reports_robustness(self, s, user_a):
        combos = [
            ("Bakery & Confectionery", 60000, "Musalgaon"),
            ("Beauty Parlour", 25000, "Pandhurli"),
            ("Flour Mill", 120000, "Nandurshingote"),
        ]
        for cat, margin, v in combos:
            r = self._gen(s, auth_headers(user_a), cat, margin, village=v)
            assert r.status_code == 200, f"{cat} failed: {r.status_code} {r.text[:200]}"
            f = r.json()["feasibility"]
            assert f.get("ai_provider") == "openai"
            # Numbers still owned by deterministic engine
            assert len(f["revenue_model"]["cost_breakdown"]) == 5
            assert "recommendation" in f and "verdict" in f["recommendation"]
            assert len(f["government_schemes"]) >= 3
            assert len(f["vendors"]) > 0
            assert len(f["supply_chain"]["stages"]) >= 4

    def test_viability_varies(self, s, user_a):
        combos = [
            ("Retail Kirana Store", 8000, "Musalgaon"),
            ("Goat & Sheep Farming", 400000, "Nandurshingote"),
            ("Beauty Parlour", 25000, "Pandhurli"),
            ("Handicrafts", 15000, "Otur"),
        ]
        scores = []
        for cat, margin, v in combos:
            r = self._gen(s, auth_headers(user_a), cat, margin, village=v)
            assert r.status_code == 200, r.text
            scores.append(r.json()["feasibility"]["viability_score"])
        # Must vary and not all be >=80
        assert len(set(scores)) >= 2, f"Scores didn't vary: {scores}"
        assert not all(sc >= 80 for sc in scores), f"All scores >=80: {scores}"


# ---------- Reports ----------
class TestReports:
    def test_reports_flow(self, s, user_a):
        # Generate 1 report while authenticated
        payload = {"state": "Maharashtra", "district": "Nashik", "block": "Sinnar", "village": "Musalgaon",
                   "business_category": "Bakery & Confectionery", "margin_capital": 60000,
                   "repayment_frequency": "monthly"}
        r = s.post(f"{API}/feasibility/generate", json=payload, headers=auth_headers(user_a))
        assert r.status_code == 200
        rid = r.json()["id"]
        # List
        lst = s.get(f"{API}/reports", headers=auth_headers(user_a))
        assert lst.status_code == 200
        assert any(x["id"] == rid for x in lst.json())
        # Get
        g = s.get(f"{API}/reports/{rid}", headers=auth_headers(user_a))
        assert g.status_code == 200
        assert g.json()["id"] == rid
        # Delete
        d = s.delete(f"{API}/reports/{rid}", headers=auth_headers(user_a))
        assert d.status_code == 200
        # 404 after delete
        g2 = s.get(f"{API}/reports/{rid}", headers=auth_headers(user_a))
        assert g2.status_code == 404


# ---------- Community Shops ----------
class TestCommunity:
    def test_create_upvote_leaderboard(self, s, user_a, user_b):
        photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        # A creates a shop with contact + photo
        r = s.post(f"{API}/shops", json={
            "shop_name": "TEST_ShopA", "category": "Retail Kirana Store",
            "contact": "+91 9876543210", "photo": photo, "address": "Main Rd",
            "state": "Maharashtra", "district": "Nashik", "block": "Sinnar", "village": "Musalgaon"
        }, headers=auth_headers(user_a))
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["points_earned"] == 10 + 5 + 3
        assert j["total_points"] >= 18
        shop_id = j["shop"]["id"]

        # List shops
        lst = s.get(f"{API}/shops").json()
        assert any(x["id"] == shop_id for x in lst)

        # Own upvote -> 400
        own = s.post(f"{API}/shops/{shop_id}/upvote", headers=auth_headers(user_a))
        assert own.status_code == 400

        # B upvotes
        up = s.post(f"{API}/shops/{shop_id}/upvote", headers=auth_headers(user_b))
        assert up.status_code == 200
        assert up.json()["upvotes"] == 1

        # A's points should have +2
        me = s.get(f"{API}/auth/me", headers=auth_headers(user_a)).json()
        assert me["points"] >= 20  # 18 + 2

        # Leaderboard
        lb = s.get(f"{API}/leaderboard").json()
        assert isinstance(lb, list) and len(lb) >= 1
        names = [u["name"] for u in lb]
        assert "Tester A" in names

    def test_shop_missing_fields(self, s, user_a):
        r = s.post(f"{API}/shops", json={"shop_name": "OnlyName"}, headers=auth_headers(user_a))
        assert r.status_code == 400

    def test_shop_no_auth(self, s):
        r = s.post(f"{API}/shops", json={"shop_name": "x", "category": "y"})
        assert r.status_code == 401

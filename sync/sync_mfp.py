#!/usr/bin/env python3
"""
Stride MFP Sync — Pulls nutrition, weight, steps & exercise data from MyFitnessPal
Runs via GitHub Actions cron at 03:30 UTC (04:30 CET) daily
Outputs: public/data/stride-data.json
"""

import json
import os
import sys
import http.cookiejar
from datetime import date, timedelta, datetime
from pathlib import Path

# --- Configuration ---
MFP_USERNAME = os.environ.get("MFP_USERNAME", "robincheering186")
PROGRAM_START = date(2026, 1, 5)  # Week 1 starts here
START_WEIGHT = 80.5
TARGET_WEIGHT = 63.0

# Phase definitions (25-week program)
PHASES = {
    1: {"label": "Phase 1 – Foundation", "weeks": "1–8",
        "cal": [1300, 1500], "protein": [130, 160], "carbs": [40, 70],
        "fat": [40, 55], "sugar": [0, 20], "fiber": [20, 30], "steps": [8000, 10000]},
    2: {"label": "Phase 2 – Symmetry & Water Flush", "weeks": "9–18",
        "cal": [1600, 1800], "protein": [130, 150], "carbs": [80, 130],
        "fat": [45, 65], "sugar": [0, 30], "fiber": [25, 35], "steps": [8000, 12000]},
    3: {"label": "Phase 3 – Metabolic Rebuild", "weeks": "19–25",
        "cal": [1600, 1850], "protein": [200, 210], "carbs": [110, 165],
        "fat": [40, 45], "sugar": [0, 30], "fiber": [30, 35], "steps": [8000, 10000]},
}


def get_phase(week):
    if week <= 8: return 1
    if week <= 18: return 2
    return 3


def get_week_number(d):
    """Returns 1-indexed week number from program start."""
    delta = (d - PROGRAM_START).days
    return max(1, delta // 7 + 1)


def get_week_start(week_num):
    """Returns the Monday that starts the given week."""
    return PROGRAM_START + timedelta(days=(week_num - 1) * 7)


def compute_compliance_score(cal, protein, carbs, fat, fiber, sugar, phase_num):
    t = PHASES[phase_num]
    score = 0
    weights = {"cal": 25, "protein": 25, "carbs": 10, "fat": 10, "fiber": 15, "sugar": 15}

    def range_score(val, lo, hi, weight):
        if val is None or val == 0:
            return 0
        if lo <= val <= hi:
            return weight
        elif val < lo:
            ratio = val / lo if lo > 0 else 0
            return weight * max(0, ratio)
        else:
            overshoot = (val - hi) / hi if hi > 0 else 1
            return weight * max(0, 1 - overshoot)

    score += range_score(cal, t["cal"][0], t["cal"][1], weights["cal"])
    score += range_score(protein, t["protein"][0], t["protein"][1], weights["protein"])
    score += range_score(carbs, t["carbs"][0], t["carbs"][1], weights["carbs"])
    score += range_score(fat, t["fat"][0], t["fat"][1], weights["fat"])
    score += range_score(fiber, t["fiber"][0], t["fiber"][1], weights["fiber"])
    score += range_score(sugar, t["sugar"][0], t["sugar"][1], weights["sugar"])
    return round(min(100, max(0, score)))


def compute_flat_stomach_score(compliance, fiber, sugar, phase_num):
    t = PHASES[phase_num]
    penalty = 0
    if fiber is not None and fiber < t["fiber"][0]:
        shortfall = (t["fiber"][0] - fiber) / t["fiber"][0]
        penalty += shortfall * 5
    if sugar is not None and sugar > t["sugar"][1]:
        excess = (sugar - t["sugar"][1]) / t["sugar"][1] if t["sugar"][1] > 0 else 1
        penalty += excess * 5
    return round(max(0, compliance - penalty))


def cal_flag(cal, phase_num):
    t = PHASES[phase_num]
    if cal is None or cal == 0:
        return "No data"
    if cal < t["cal"][0]:
        return "Low"
    elif cal > t["cal"][1]:
        return "Over target"
    return "On target"


def fiber_flag(fiber, phase_num):
    t = PHASES[phase_num]
    if fiber is None:
        return "No data"
    if fiber < t["fiber"][0]:
        return "Low"
    return "On target"


def load_cookies_from_env():
    """Build a CookieJar directly from MFP_COOKIES (raw 'name=value; ...' string).
    Bypasses Netscape file parsing entirely to avoid LoadError."""
    cookie_content = os.environ.get("MFP_COOKIES", "")
    if not cookie_content:
        cookie_file = Path(__file__).parent / "cookies.txt"
        if cookie_file.exists():
            cookie_content = cookie_file.read_text()
        else:
            print("ERROR: No MFP_COOKIES env var and no local cookies.txt found")
            sys.exit(1)

    cookie_content = cookie_content.strip()
    cj = http.cookiejar.CookieJar()

    # Accept either a raw "name=value; ..." string OR Netscape file content
    if cookie_content.startswith("# Netscape") or "\t" in cookie_content:
        pairs = []
        for line in cookie_content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 7:
                pairs.append((parts[5], parts[6]))
    else:
        pairs = []
        for chunk in cookie_content.split("; "):
            chunk = chunk.strip()
            if "=" in chunk:
                name, _, value = chunk.partition("=")
                pairs.append((name.strip(), value.strip()))

    for name, value in pairs:
        cj.set_cookie(http.cookiejar.Cookie(
            version=0, name=name, value=value,
            port=None, port_specified=False,
            domain=".myfitnesspal.com", domain_specified=True,
            domain_initial_dot=True,
            path="/", path_specified=True,
            secure=True, expires=None, discard=False,
            comment=None, comment_url=None, rest={}, rfc2109=False,
        ))
    return cj


def get_auth_token_and_userid(cookie_jar):
    """Get the API auth token and numeric user id (for fiber via v2 API)."""
    import urllib.request
    user_id = ""
    for c in cookie_jar:
        if c.name == "known_user" and c.value.isdigit():
            user_id = c.value
            break
        if c.name == "remember_me" and "%3A" in c.value:
            cand = c.value.split("%3A")[0]
            if cand.isdigit():
                user_id = cand
    token = ""
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    opener.addheaders = [("User-Agent", "Mozilla/5.0"), ("Accept", "application/json")]
    try:
        resp = opener.open("https://www.myfitnesspal.com/user/auth_token?refresh=true", timeout=30)
        data = json.loads(resp.read().decode("utf-8"))
        token = data.get("access_token", "")
        if token and not user_id:
            try:
                import base64
                payload = token.split(".")[1]
                payload += "=" * ((4 - len(payload) % 4) % 4)
                decoded = json.loads(base64.urlsafe_b64decode(payload))
                user_id = str(decoded.get("sub") or decoded.get("user_id") or "")
            except Exception:
                pass
    except Exception as e:
        print(f"  Token fetch failed: {e}")
    return token, user_id


def fetch_diary_api(cookie_jar, token, user_id, target_date):
    """Fetch full nutrition incl. fiber via the authenticated v2 API."""
    import urllib.request
    if not token or not user_id:
        return None
    date_str = target_date.strftime("%Y-%m-%d")
    url = (f"https://api.myfitnesspal.com/v2/diary?entry_date={date_str}"
           f"&fields%5B%5D=nutritional_contents&fields%5B%5D=diary_meal")
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("mfp-client-id", "mfp-main-js")
    req.add_header("mfp-user-id", user_id)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    try:
        resp = opener.open(req, timeout=30)
        data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  API diary failed: {e}")
        return None
    items = data.get("items", []) if isinstance(data, dict) else []
    if not items:
        return None
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0, "sugar": 0.0}
    for it in items:
        n = it.get("nutritional_contents", {}) or {}
        energy = n.get("energy", {})
        cal = energy.get("value", 0) if isinstance(energy, dict) else (energy or 0)
        totals["calories"] += cal or n.get("calories", 0) or 0
        totals["protein"] += n.get("protein", 0) or 0
        totals["carbs"] += n.get("carbohydrates", n.get("carbs", 0)) or 0
        totals["fat"] += n.get("fat", 0) or 0
        totals["fiber"] += n.get("fiber", 0) or 0
        totals["sugar"] += n.get("sugar", 0) or 0
    if totals["calories"] <= 0:
        return None
    return {
        "calories": round(totals["calories"]),
        "protein": round(totals["protein"]),
        "carbs": round(totals["carbs"]),
        "fat": round(totals["fat"]),
        "fiber": round(totals["fiber"], 1),
        "sugar": round(totals["sugar"]),
    }


def fetch_steps_api(cookie_jar, token, user_id, target_date):
    """Steps from the authenticated steps API."""
    import urllib.request
    if not token or not user_id:
        return None
    date_str = target_date.strftime("%Y-%m-%d")
    url = f"https://api.myfitnesspal.com/v2/users/{user_id}/steps/{date_str}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("mfp-client-id", "mfp-main-js")
    req.add_header("mfp-user-id", user_id)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    try:
        resp = opener.open(req, timeout=30)
        data = json.loads(resp.read().decode("utf-8"))
        steps = data.get("steps") or data.get("value") or (data.get("data", {}) or {}).get("steps", 0)
        steps = int(steps)
        if steps > 0:
            return steps
    except Exception:
        pass
    return None


def scrape_mfp_web(cookie_jar, username, target_date):
    """HTML scraping fallback for nutrition."""
    import urllib.request
    date_str = target_date.strftime("%Y-%m-%d")
    url = f"https://www.myfitnesspal.com/food/diary/{username}?date={date_str}"
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    opener.addheaders = [
        ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"),
        ("Accept", "text/html,application/xhtml+xml"),
    ]
    try:
        resp = opener.open(url, timeout=30)
        html = resp.read().decode("utf-8", errors="replace")
        return parse_diary_html(html)
    except Exception as e:
        print(f"  Web scrape failed for {date_str}: {e}")
        return None


def parse_diary_html(html):
    """Extract totals row from MFP diary HTML (free column order:
    Calories, Carbs, Fat, Protein, Sodium, Sugar)."""
    import re
    totals = {}
    total_match = re.search(r'class=["\']?total["\']?[^>]*>[\s\S]*?</tr>', html, re.IGNORECASE)
    if total_match:
        cells = re.findall(r'<td[^>]*>([\s\S]*?)</td>', total_match.group(), re.IGNORECASE)
        vals = []
        for cell in cells:
            clean = re.sub(r'<[^>]+>', '', cell).strip()
            numbers = re.findall(r'[\d,]+', clean)
            main = int(numbers[0].replace(',', '')) if numbers else 0
            vals.append(main)
        data_vals = [v for v in vals if v > 0]
        if len(data_vals) >= 6:
            totals["calories"] = data_vals[0]
            totals["carbs"] = data_vals[1]
            totals["fat"] = data_vals[2]
            totals["protein"] = data_vals[3]
            totals["sugar"] = data_vals[5]
        elif len(data_vals) >= 4:
            totals["calories"] = data_vals[0]
            totals["carbs"] = data_vals[1]
            totals["fat"] = data_vals[2]
            totals["protein"] = data_vals[3]
        totals.setdefault("fiber", 0)
        totals.setdefault("sugar", 0)
    return totals if totals.get("calories", 0) > 0 else None


def build_output(all_days, weight_data):
    today = date.today()
    current_week = get_week_number(today)
    current_phase = get_phase(current_week)

    daily = []
    for d_date, data in sorted(all_days.items()):
        week = get_week_number(d_date)
        phase = get_phase(week)
        day_of_week = d_date.strftime("%a")
        cal = data.get("calories", 0) or 0
        protein = data.get("protein", 0) or 0
        carbs = data.get("carbs", 0) or 0
        fat = data.get("fat", 0) or 0
        fiber = data.get("fiber", 0) or 0
        sugar = data.get("sugar", 0) or 0
        steps = data.get("steps")
        sleep = data.get("sleep")
        gym = data.get("gym", False)
        compliance = compute_compliance_score(cal, protein, carbs, fat, fiber, sugar, phase)
        flat_stomach = compute_flat_stomach_score(compliance, fiber, sugar, phase)
        daily.append({
            "date": d_date.isoformat(), "day": day_of_week, "week": week, "phase": phase,
            "calories": cal, "protein": protein, "carbs": carbs, "fat": fat,
            "fiber": fiber, "sugar": sugar, "steps": steps, "sleep": sleep, "gym": gym,
            "compliance": compliance, "flatStomach": flat_stomach,
            "calFlag": cal_flag(cal, phase), "fiberFlag": fiber_flag(fiber, phase),
        })

    weeks = {}
    for d in daily:
        weeks.setdefault(d["week"], []).append(d)
    weekly = []
    for w_num in sorted(weeks.keys()):
        days = weeks[w_num]
        logged_days = [d for d in days if d["calories"] > 0]
        n = len(logged_days) or 1
        avg_cal = sum(d["calories"] for d in logged_days) / n
        avg_protein = sum(d["protein"] for d in logged_days) / n
        avg_carbs = sum(d["carbs"] for d in logged_days) / n
        avg_fat = sum(d["fat"] for d in logged_days) / n
        avg_fiber = sum(d["fiber"] for d in logged_days) / n
        avg_sugar = sum(d["sugar"] for d in logged_days) / n
        step_days = [d for d in days if d["steps"] is not None and d["steps"] > 0]
        avg_steps = sum(d["steps"] for d in step_days) / len(step_days) if step_days else None
        avg_compliance = sum(d["compliance"] for d in logged_days) / n
        avg_flat = sum(d["flatStomach"] for d in logged_days) / n
        phase = get_phase(w_num)
        weekly.append({
            "week": w_num, "phase": phase,
            "cal": round(avg_cal), "protein": round(avg_protein), "carbs": round(avg_carbs),
            "fat": round(avg_fat), "fiber": round(avg_fiber), "sugar": round(avg_sugar),
            "steps": round(avg_steps) if avg_steps else None,
            "compliance": round(avg_compliance), "flatStomach": round(avg_flat),
            "calFlag": cal_flag(avg_cal, phase), "fiberFlag": fiber_flag(avg_fiber, phase),
            "daysLogged": len(logged_days),
        })

    weight_timeline = []
    for w_date, w_val in sorted(weight_data.items()):
        weight_timeline.append({
            "date": w_date.isoformat(), "weight": round(w_val, 1),
            "week": get_week_number(w_date),
        })

    all_logged = [d for d in daily if d["calories"] > 0]
    n_all = len(all_logged) or 1
    running_avgs = {
        "calories": round(sum(d["calories"] for d in all_logged) / n_all),
        "protein": round(sum(d["protein"] for d in all_logged) / n_all),
        "carbs": round(sum(d["carbs"] for d in all_logged) / n_all),
        "fat": round(sum(d["fat"] for d in all_logged) / n_all),
        "fiber": round(sum(d["fiber"] for d in all_logged) / n_all),
        "sugar": round(sum(d["sugar"] for d in all_logged) / n_all),
    }

    latest_weight = weight_timeline[-1] if weight_timeline else {"weight": START_WEIGHT, "week": 0}
    total_lost = round(START_WEIGHT - latest_weight["weight"], 1)
    pct_lost = round((total_lost / START_WEIGHT) * 100, 1)

    return {
        "meta": {
            "lastSync": datetime.utcnow().isoformat() + "Z",
            "programStart": PROGRAM_START.isoformat(),
            "currentWeek": current_week, "currentPhase": current_phase,
            "startWeight": START_WEIGHT, "targetWeight": TARGET_WEIGHT,
        },
        "phases": {str(k): v for k, v in PHASES.items()},
        "weight": {
            "timeline": weight_timeline, "current": latest_weight["weight"],
            "totalLost": total_lost, "pctLost": pct_lost,
        },
        "runningAverages": running_avgs, "weekly": weekly, "daily": daily,
    }


def main():
    print("🏃 Stride MFP Sync starting...")
    print(f"   Program start: {PROGRAM_START}")
    print(f"   Username: {MFP_USERNAME}")

    cookie_jar = load_cookies_from_env()
    print(f"✓ Loaded {len(cookie_jar)} cookies")

    token, user_id = get_auth_token_and_userid(cookie_jar)
    print(f"   Auth token: {'yes' if token else 'NO'} | user_id: {user_id or 'NONE'}")

    today = date.today()
    sync_end = today
    sync_start = PROGRAM_START

    output_path = Path(__file__).parent.parent / "public" / "data" / "stride-data.json"
    existing_daily = {}
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            for d in existing.get("daily", []):
                existing_daily[date.fromisoformat(d["date"])] = d
            if existing_daily:
                sync_start = max(PROGRAM_START, today - timedelta(days=7))
                print(f"   Incremental sync from {sync_start}")
        except Exception:
            pass

    # AUTH GUARD: if we can't pull recent data but store already has data, abort
    auth_ok = False
    for i in range(0, 5):
        probe = fetch_diary_api(cookie_jar, token, user_id, today - timedelta(days=i)) \
                or scrape_mfp_web(cookie_jar, MFP_USERNAME, today - timedelta(days=i))
        if probe and probe.get("calories", 0) > 0:
            auth_ok = True
            break
    if not auth_ok and existing_daily:
        print("=" * 60)
        print("❌ AUTH CHECK FAILED — no diary data for last 5 days, but store")
        print(f"   already has {len(existing_daily)} days. Cookies likely EXPIRED.")
        print("   Aborting WITHOUT saving to protect existing data.")
        print("=" * 60)
        sys.exit(1)

    all_days = {}
    for d_date, d_data in existing_daily.items():
        if d_date < sync_start:
            all_days[d_date] = d_data

    current = sync_start
    while current <= sync_end:
        print(f"  Syncing {current}...", end=" ")
        # API first (has fiber), then HTML fallback
        day_data = fetch_diary_api(cookie_jar, token, user_id, current)
        if day_data is None:
            day_data = scrape_mfp_web(cookie_jar, MFP_USERNAME, current)

        if day_data and day_data.get("calories", 0) > 0:
            steps = fetch_steps_api(cookie_jar, token, user_id, current)
            day_data["steps"] = steps
            if current in existing_daily and existing_daily[current].get("sleep"):
                day_data["sleep"] = existing_daily[current]["sleep"]
            if current in existing_daily and existing_daily[current].get("gym"):
                day_data["gym"] = existing_daily[current]["gym"]
            all_days[current] = day_data
            print(f"✓ {day_data.get('calories', 0)} kcal, {day_data.get('protein', 0)}g pro, "
                  f"{day_data.get('fiber', 0)}g fiber")
        else:
            # DATA PROTECTION: keep existing data, never overwrite with empty
            if current in existing_daily:
                all_days[current] = existing_daily[current]
                print("(kept existing)")
            else:
                print("(no data)")
        current += timedelta(days=1)

    # Weight: restore from existing cache (API weight optional)
    weight_data = {}
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            for w in existing.get("weight", {}).get("timeline", []):
                weight_data[date.fromisoformat(w["date"])] = w["weight"]
        except Exception:
            pass

    output = build_output(all_days, weight_data)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n✅ Wrote {output_path} ({len(output['daily'])} days, {len(output['weekly'])} weeks)")


if __name__ == "__main__":
    main()

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
TARGET_WEIGHT = 68.0

# Phase definitions
PHASES = {
    1: {"label": "Phase 1 – Fat Loss", "weeks": "1–7",
        "cal": [1300, 1500], "protein": [130, 160], "carbs": [40, 70],
        "fat": [40, 55], "sugar": [0, 20], "fiber": [20, 30], "steps": [8000, 10000]},
    2: {"label": "Phase 2 – Lean Out", "weeks": "8–11",
        "cal": [1600, 1800], "protein": [130, 150], "carbs": [80, 130],
        "fat": [45, 65], "sugar": [0, 30], "fiber": [25, 35], "steps": [8000, 12000]},
    3: {"label": "Phase 3 – Abs Reveal", "weeks": "12–14",
        "cal": [1500, 1650], "protein": [140, 160], "carbs": [60, 100],
        "fat": [40, 55], "sugar": [0, 25], "fiber": [25, 35], "steps": [10000, 10000]},
    4: {"label": "Phase 4 – Maintenance", "weeks": "13–14+",
        "cal": [1900, 2200], "protein": [130, 150], "carbs": [150, 220],
        "fat": [55, 75], "sugar": [0, 40], "fiber": [30, 40], "steps": [8000, 10000]},
}


def get_phase(week):
    if week <= 7: return 1
    if week <= 11: return 2
    if week <= 14: return 3
    return 4


def get_week_number(d):
    """Returns 1-indexed week number from program start."""
    delta = (d - PROGRAM_START).days
    return max(1, delta // 7 + 1)


def get_week_start(week_num):
    """Returns the Monday that starts the given week."""
    return PROGRAM_START + timedelta(days=(week_num - 1) * 7)


def compute_compliance_score(cal, protein, carbs, fat, fiber, sugar, phase_num):
    """
    Computes daily compliance score (0-100) based on how well macros hit phase targets.
    Each macro contributes a weighted score based on how close it is to the target range.
    """
    t = PHASES[phase_num]
    score = 0
    weights = {"cal": 25, "protein": 25, "carbs": 10, "fat": 10, "fiber": 15, "sugar": 15}

    def range_score(val, lo, hi, weight):
        if val is None or val == 0:
            return 0
        if lo <= val <= hi:
            return weight  # Perfect
        elif val < lo:
            ratio = val / lo if lo > 0 else 0
            return weight * max(0, ratio)
        else:  # over
            overshoot = (val - hi) / hi if hi > 0 else 1
            return weight * max(0, 1 - overshoot)

    score += range_score(cal, t["cal"][0], t["cal"][1], weights["cal"])
    score += range_score(protein, t["protein"][0], t["protein"][1], weights["protein"])
    score += range_score(carbs, t["carbs"][0], t["carbs"][1], weights["carbs"])
    score += range_score(fat, t["fat"][0], t["fat"][1], weights["fat"])
    score += range_score(fiber, t["fiber"][0], t["fiber"][1], weights["fiber"])
    # Sugar: lower is better, target is 0 to max
    score += range_score(sugar, t["sugar"][0], t["sugar"][1], weights["sugar"])

    return round(min(100, max(0, score)))


def compute_flat_stomach_score(compliance, fiber, sugar, phase_num):
    """
    Flat stomach score = compliance adjusted downward for low fiber and high sugar.
    Fiber and sugar directly impact bloating/digestion.
    """
    t = PHASES[phase_num]
    penalty = 0
    # Penalty for low fiber
    if fiber is not None and fiber < t["fiber"][0]:
        shortfall = (t["fiber"][0] - fiber) / t["fiber"][0]
        penalty += shortfall * 5
    # Penalty for high sugar
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
    """Load Netscape cookie file content from environment variable."""
    cookie_content = os.environ.get("MFP_COOKIES", "")
    if not cookie_content:
        # Try loading from local file for development
        cookie_file = Path(__file__).parent / "cookies.txt"
        if cookie_file.exists():
            cookie_content = cookie_file.read_text()
        else:
            print("ERROR: No MFP_COOKIES env var and no local cookies.txt found")
            sys.exit(1)

    # Write to temp file for cookiejar
    tmp_path = Path("/tmp/mfp_cookies.txt")
    tmp_path.write_text(cookie_content)

    cj = http.cookiejar.MozillaCookieJar(str(tmp_path))
    cj.load(ignore_discard=True, ignore_expires=True)
    return cj


def fetch_mfp_data(cookie_jar):
    """
    Fetch diary data from MFP using the python-myfitnesspal library with cookie auth.
    Falls back to web scraping if the library isn't available.
    """
    try:
        import myfitnesspal
        client = myfitnesspal.Client(cookiejar=cookie_jar)
        print(f"✓ Authenticated as MFP user")
        return client
    except ImportError:
        print("python-myfitnesspal not installed, using web scraping fallback")
        return None
    except Exception as e:
        print(f"MFP client error: {e}")
        return None


def scrape_mfp_web(cookie_jar, username, target_date):
    """
    Direct web scraping fallback — fetches the printable diary page.
    Returns dict with calories, protein, carbs, fat, fiber, sugar or None.
    """
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
    """Extract totals row from MFP diary HTML page."""
    import re
    # Look for the totals row — MFP uses specific CSS classes
    # This is a simplified parser; may need adjustment if MFP changes layout
    totals = {}

    # Try to find total-line values
    total_pattern = r'total["\s].*?(\d[\d,]*)\s*(?:cal|kcal)'
    cal_match = re.search(r'Totals.*?(\d[\d,]*)', html, re.IGNORECASE | re.DOTALL)
    if cal_match:
        totals["calories"] = int(cal_match.group(1).replace(",", ""))

    return totals if totals else None


def pull_day_data_library(client, target_date):
    """Pull a single day's data using the python-myfitnesspal library."""
    try:
        day = client.get_date(target_date.year, target_date.month, target_date.day)

        totals = day.totals
        if not totals:
            return None

        nutrition = {
            "calories": round(totals.get("calories", 0) or 0),
            "protein": round(totals.get("protein", 0) or 0),
            "carbs": round(totals.get("total carbohydrate", 0) or totals.get("carbohydrates", 0) or 0),
            "fat": round(totals.get("total fat", 0) or totals.get("fat", 0) or 0),
            "fiber": round(totals.get("fiber", 0) or 0),
            "sugar": round(totals.get("sugar", 0) or 0),
        }

        # Get exercises
        exercises = []
        gym_session = False
        try:
            for exercise_group in day.exercises:
                for entry in exercise_group.get_as_list():
                    exercises.append({
                        "name": entry.get("name", ""),
                        "calories": entry.get("nutrition_information", {}).get("calories burned", 0),
                        "minutes": entry.get("nutrition_information", {}).get("minutes", 0),
                    })
                    # Detect gym/strength sessions
                    name_lower = entry.get("name", "").lower()
                    if any(kw in name_lower for kw in ["strength", "weight", "press", "squat", "deadlift", "row", "curl", "bench"]):
                        gym_session = True
        except Exception:
            pass

        return {**nutrition, "exercises": exercises, "gym": gym_session}

    except Exception as e:
        print(f"  Library pull failed for {target_date}: {e}")
        return None


def pull_steps_from_report(client, lower, upper):
    """
    Try to get step data from MFP reports.
    Steps synced from iOS appear as exercise entries or in the report.
    """
    steps_by_date = {}
    try:
        # Try the 'Exercise' category report for steps
        report = client.get_report(
            report_name='Net Calories',
            report_category='Nutrition',
            lower_bound=lower,
            upper_bound=upper
        )
        # This gives net calories, not steps directly
    except Exception:
        pass

    # Alternative: parse exercise entries for step-based activities
    # MFP shows steps as a separate exercise line when synced from iOS
    return steps_by_date


def pull_steps_from_exercises(client, target_date):
    """
    Extract step count from exercise entries.
    When iOS Health syncs to MFP, steps often appear as an exercise entry
    like 'Walking' with a calorie value. We can also scrape the Progress page.
    """
    try:
        day = client.get_date(target_date.year, target_date.month, target_date.day)
        total_steps = 0
        for exercise_group in day.exercises:
            for entry in exercise_group.get_as_list():
                name = entry.get("name", "").lower()
                # Steps from iOS typically show as walking entries
                # This is imperfect — we'll also try web scraping the progress page
                if "step" in name or "walking" in name:
                    # Estimate: roughly 1 step per 0.04 cal for walking at moderate pace
                    # This is very rough — better to scrape the progress page
                    pass
        return None  # Return None to signal we should use web approach
    except Exception:
        return None


def scrape_steps_from_progress(cookie_jar, username, target_date):
    """
    Scrape step count from MFP's food diary page or progress page.
    Steps from iOS Health sync show on the exercise diary.
    """
    import urllib.request
    import re

    date_str = target_date.strftime("%Y-%m-%d")

    # Try the exercise diary page which shows step-synced data
    url = f"https://www.myfitnesspal.com/exercise/diary/{username}?date={date_str}"
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    opener.addheaders = [
        ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"),
    ]

    try:
        resp = opener.open(url, timeout=30)
        html = resp.read().decode("utf-8", errors="replace")

        # Look for step count in the page
        step_patterns = [
            r'(\d[\d,]+)\s*steps?',
            r'steps?[:\s]*(\d[\d,]+)',
            r'"steps"\s*:\s*(\d+)',
        ]
        for pattern in step_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return int(match.group(1).replace(",", ""))
    except Exception as e:
        print(f"  Steps scrape failed for {date_str}: {e}")

    return None


def build_output(all_days, weight_data):
    """Build the final JSON structure for the Stride frontend."""
    today = date.today()
    current_week = get_week_number(today)
    current_phase = get_phase(current_week)

    # --- Daily data ---
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
            "date": d_date.isoformat(),
            "day": day_of_week,
            "week": week,
            "phase": phase,
            "calories": cal,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "fiber": fiber,
            "sugar": sugar,
            "steps": steps,
            "sleep": sleep,
            "gym": gym,
            "compliance": compliance,
            "flatStomach": flat_stomach,
            "calFlag": cal_flag(cal, phase),
            "fiberFlag": fiber_flag(fiber, phase),
        })

    # --- Weekly aggregates ---
    weeks = {}
    for d in daily:
        w = d["week"]
        if w not in weeks:
            weeks[w] = []
        weeks[w].append(d)

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
            "week": w_num,
            "phase": phase,
            "cal": round(avg_cal),
            "protein": round(avg_protein),
            "carbs": round(avg_carbs),
            "fat": round(avg_fat),
            "fiber": round(avg_fiber),
            "sugar": round(avg_sugar),
            "steps": round(avg_steps) if avg_steps else None,
            "compliance": round(avg_compliance),
            "flatStomach": round(avg_flat),
            "calFlag": cal_flag(avg_cal, phase),
            "fiberFlag": fiber_flag(avg_fiber, phase),
            "daysLogged": len(logged_days),
        })

    # --- Weight timeline ---
    weight_timeline = []
    for w_date, w_val in sorted(weight_data.items()):
        weight_timeline.append({
            "date": w_date.isoformat(),
            "weight": round(w_val, 1),
            "week": get_week_number(w_date),
        })

    # --- Running averages (all logged days) ---
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

    # --- Latest weight info ---
    latest_weight = weight_timeline[-1] if weight_timeline else {"weight": START_WEIGHT, "week": 0}
    total_lost = round(START_WEIGHT - latest_weight["weight"], 1)
    pct_lost = round((total_lost / START_WEIGHT) * 100, 1)

    return {
        "meta": {
            "lastSync": datetime.utcnow().isoformat() + "Z",
            "programStart": PROGRAM_START.isoformat(),
            "currentWeek": current_week,
            "currentPhase": current_phase,
            "startWeight": START_WEIGHT,
            "targetWeight": TARGET_WEIGHT,
        },
        "phases": {str(k): v for k, v in PHASES.items()},
        "weight": {
            "timeline": weight_timeline,
            "current": latest_weight["weight"],
            "totalLost": total_lost,
            "pctLost": pct_lost,
        },
        "runningAverages": running_avgs,
        "weekly": weekly,
        "daily": daily,
    }


def main():
    print("🏃 Stride MFP Sync starting...")
    print(f"   Program start: {PROGRAM_START}")
    print(f"   Username: {MFP_USERNAME}")

    # Load cookies
    cookie_jar = load_cookies_from_env()
    print(f"✓ Loaded {len(cookie_jar)} cookies")

    # Init MFP client
    client = fetch_mfp_data(cookie_jar)

    # Determine date range to sync
    today = date.today()
    # Sync from program start to yesterday (today may be incomplete)
    sync_end = today - timedelta(days=1)
    sync_start = PROGRAM_START

    # If we have existing data, only sync recent days (last 7) for speed
    output_path = Path(__file__).parent.parent / "public" / "data" / "stride-data.json"
    existing_daily = {}
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            for d in existing.get("daily", []):
                existing_daily[date.fromisoformat(d["date"])] = d
            # Only re-sync last 7 days + any missing days
            if existing_daily:
                sync_start = max(PROGRAM_START, today - timedelta(days=7))
                print(f"   Incremental sync from {sync_start}")
        except Exception:
            pass

    all_days = {}

    # Restore existing data for days we're not re-syncing
    for d_date, d_data in existing_daily.items():
        if d_date < sync_start:
            all_days[d_date] = d_data

    # Fetch new data
    current = sync_start
    while current <= sync_end:
        print(f"  Syncing {current}...", end=" ")

        day_data = None
        if client:
            day_data = pull_day_data_library(client, current)

        if day_data is None:
            day_data = scrape_mfp_web(cookie_jar, MFP_USERNAME, current)

        if day_data and day_data.get("calories", 0) > 0:
            # Try to get steps
            steps = scrape_steps_from_progress(cookie_jar, MFP_USERNAME, current)
            day_data["steps"] = steps

            # Preserve manually entered sleep data from existing records
            if current in existing_daily and existing_daily[current].get("sleep"):
                day_data["sleep"] = existing_daily[current]["sleep"]

            all_days[current] = day_data
            print(f"✓ {day_data.get('calories', 0)} kcal, {day_data.get('protein', 0)}g protein")
        else:
            # Keep existing data if available
            if current in existing_daily:
                all_days[current] = existing_daily[current]
                print("(kept existing)")
            else:
                all_days[current] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}
                print("(no data)")

        current += timedelta(days=1)

    # Fetch weight measurements
    print("\n  Fetching weight data...")
    weight_data = {}
    if client:
        try:
            measurements = client.get_measurements("Weight", lower_bound=PROGRAM_START, upper_bound=today)
            weight_data = {k: v for k, v in measurements.items()}
            print(f"  ✓ Got {len(weight_data)} weight entries")
        except Exception as e:
            print(f"  Weight fetch failed: {e}")

    # If no weight data from API, try to restore from existing
    if not weight_data and output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            for w in existing.get("weight", {}).get("timeline", []):
                weight_data[date.fromisoformat(w["date"])] = w["weight"]
            print(f"  Restored {len(weight_data)} weight entries from cache")
        except Exception:
            pass

    # Build output
    output = build_output(all_days, weight_data)

    # Write JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n✅ Wrote {output_path} ({len(output['daily'])} days, {len(output['weekly'])} weeks)")


if __name__ == "__main__":
    main()

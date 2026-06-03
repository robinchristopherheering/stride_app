#!/usr/bin/env python3
"""
Stride MFP Sync — Fetches diary data from MyFitnessPal using session cookies.
Outputs a JSON file consumed by the Stride frontend.

Usage:
    python mfp_sync.py                    # Sync yesterday's data
    python mfp_sync.py --date 2026-02-19  # Sync specific date
    python mfp_sync.py --backfill 45      # Backfill last 45 days
"""

import json, os, sys, re, time, argparse
from datetime import datetime, timedelta, date
from pathlib import Path
from http.cookiejar import MozillaCookieJar
import urllib.request, urllib.error

# ─── CONFIG ──────────────────────────────────────────────────────────────────
MFP_USERNAME = os.environ.get("MFP_USERNAME", "robincheering186")
COOKIE_FILE = os.environ.get("MFP_COOKIE_FILE", "cookies.txt")
DATA_DIR = Path(os.environ.get("DATA_DIR", "public/data"))
PROGRAM_START = date(2026, 1, 5)  # Week 1 Day 1

# Phase targets: { phase_num: { nutrient: (low, high) } }
PHASE_TARGETS = {
    1: {  # Weeks 1–7
        "cal": (1300, 1500), "protein": (130, 160), "carbs": (40, 70),
        "fat": (40, 55), "sugar": (0, 20), "fiber": (20, 30),
        "steps": (8000, 10000),
    },
    2: {  # Weeks 8–11
        "cal": (1600, 1800), "protein": (130, 150), "carbs": (80, 130),
        "fat": (45, 65), "sugar": (0, 30), "fiber": (25, 35),
        "steps": (8000, 12000),
    },
    3: {  # Weeks 12–14
        "cal": (1500, 1650), "protein": (140, 160), "carbs": (60, 100),
        "fat": (40, 55), "sugar": (0, 25), "fiber": (25, 35),
        "steps": (10000, 10000),
    },
    4: {  # Weeks 13–14+ (maintenance)
        "cal": (1900, 2200), "protein": (130, 150), "carbs": (150, 220),
        "fat": (55, 75), "sugar": (0, 40), "fiber": (30, 40),
        "steps": (8000, 10000),
    },
}

# Scoring weights (empirically fitted to tracker data)
SCORE_WEIGHTS = {
    "cal": 0.25, "protein": 0.30, "carbs": 0.05,
    "fat": 0.10, "sugar": 0.05, "fiber": 0.25,
}


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def get_week_number(d: date) -> int:
    """Week number in the 14-week program (1-indexed)."""
    delta = (d - PROGRAM_START).days
    return max(1, delta // 7 + 1)

def get_phase(week: int) -> int:
    if week <= 7: return 1
    if week <= 11: return 2
    if week <= 14: return 3
    return 4

def get_day_name(d: date) -> str:
    return d.strftime("%a")

def score_nutrient(val: float, lo: float, hi: float) -> float:
    """Score 0–100 based on proximity to target range."""
    if lo <= val <= hi:
        return 100.0
    elif val < lo:
        return max(0.0, val / lo * 100) if lo > 0 else 100.0
    else:
        return max(0.0, 100 - (val - hi) / hi * 100) if hi > 0 else 0.0

def compute_compliance(nutrients: dict, targets: dict) -> float:
    """Weighted compliance score 0–100."""
    total = 0.0
    for key, weight in SCORE_WEIGHTS.items():
        lo, hi = targets.get(key, (0, 0))
        val = nutrients.get(key, 0)
        total += score_nutrient(val, lo, hi) * weight
    return round(min(100, max(0, total)))

def compute_flat_stomach(nutrients: dict, targets: dict) -> float:
    """Flat stomach score: compliance penalized by bloat factors (sugar, carbs, fiber excess)."""
    base = compute_compliance(nutrients, targets)
    sugar = nutrients.get("sugar", 0)
    carbs = nutrients.get("carbs", 0)
    fiber = nutrients.get("fiber", 0)
    sugar_target = targets.get("sugar", (0, 20))[1]
    carbs_target_hi = targets.get("carbs", (40, 70))[1]
    fiber_target_hi = targets.get("fiber", (20, 30))[1]

    # Penalties for bloat-inducing excess
    penalty = 0
    if sugar > sugar_target:
        penalty += min(5, (sugar - sugar_target) / 10)
    if carbs > carbs_target_hi:
        penalty += min(4, (carbs - carbs_target_hi) / 20)
    if fiber > fiber_target_hi * 1.5:
        penalty += min(3, (fiber - fiber_target_hi * 1.5) / 10)

    return round(min(100, max(0, base - penalty)))


# ─── MFP SCRAPER ─────────────────────────────────────────────────────────────

class MFPClient:
    """Fetches data from MyFitnessPal using session cookies."""

    BASE_URL = "https://www.myfitnesspal.com"

    def __init__(self, cookie_file: str):
        self.cookie_jar = MozillaCookieJar(cookie_file)
        self.cookie_jar.load(ignore_discard=True, ignore_expires=True)
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )
        self.opener.addheaders = [
            ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
             "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
            ("Accept", "application/json, text/html, */*"),
            ("Accept-Language", "en-US,en;q=0.9"),
            ("Referer", "https://www.myfitnesspal.com/food/diary"),
        ]

    def _get(self, url: str) -> str:
        """Make authenticated GET request."""
        try:
            req = urllib.request.Request(url)
            with self.opener.open(req, timeout=30) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code} for {url}", file=sys.stderr)
            return ""
        except Exception as e:
            print(f"  Error fetching {url}: {e}", file=sys.stderr)
            return ""

    def get_diary(self, d: date) -> dict:
        """Fetch nutrition diary for a given date. Returns nutrient totals."""
        date_str = d.strftime("%Y-%m-%d")
        url = f"{self.BASE_URL}/food/diary/{MFP_USERNAME}?date={date_str}"
        html = self._get(url)
        if not html:
            return {}

        nutrients = self._parse_diary_html(html)
        return nutrients

    def _parse_diary_html(self, html: str) -> dict:
        """Extract nutrient totals from MFP diary page HTML."""
        result = {}

        # MFP diary page has a totals row with class "total"
        # The columns are: Calories, Fat, Carbs, Protein, (optional more)
        # Try the structured data first (JSON-LD or data attributes)

        # Method 1: Look for the "Totals" row in the food diary table
        # MFP uses a table with id="diary-table" or similar
        totals_pattern = re.compile(
            r'<tr[^>]*class="[^"]*total[^"]*"[^>]*>(.*?)</tr>',
            re.DOTALL | re.IGNORECASE
        )
        totals_match = totals_pattern.search(html)
        if totals_match:
            row_html = totals_match.group(1)
            nums = re.findall(r'>[\s]*([\d,]+)[\s]*<', row_html)
            nums = [int(n.replace(",", "")) for n in nums if n.strip()]
            # Standard MFP order: Calories, Fat, Carbs, Protein
            # But sometimes: Calories, Fat, Carbs, Fiber, Protein
            if len(nums) >= 4:
                result["cal"] = nums[0]
                result["fat"] = nums[1]
                result["carbs"] = nums[2]
                result["protein"] = nums[3]
            if len(nums) >= 7:
                result["sugar"] = nums[4] if len(nums) > 4 else 0
                result["fiber"] = nums[5] if len(nums) > 5 else 0

        # Method 2: Try the API-style JSON in the page (Next.js __NEXT_DATA__)
        next_data_match = re.search(
            r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>',
            html, re.DOTALL
        )
        if next_data_match:
            try:
                page_data = json.loads(next_data_match.group(1))
                diary_data = self._extract_from_next_data(page_data)
                if diary_data:
                    result.update(diary_data)
            except json.JSONDecodeError:
                pass

        # Method 3: Look for nutrient values in inline JSON/script blocks
        if not result:
            # MFP sometimes embeds diary data as JSON
            json_blocks = re.findall(r'\{[^{}]*"calories"[^{}]*\}', html, re.IGNORECASE)
            for block in json_blocks:
                try:
                    obj = json.loads(block)
                    if "calories" in obj:
                        result["cal"] = int(obj.get("calories", 0))
                        result["protein"] = int(obj.get("protein", 0))
                        result["carbs"] = int(obj.get("carbs", obj.get("total_carbohydrates", 0)))
                        result["fat"] = int(obj.get("fat", obj.get("total_fat", 0)))
                        result["fiber"] = int(obj.get("fiber", 0))
                        result["sugar"] = int(obj.get("sugar", 0))
                        break
                except (json.JSONDecodeError, TypeError):
                    continue

        return result

    def _extract_from_next_data(self, data: dict) -> dict:
        """Walk __NEXT_DATA__ to find diary nutrition totals."""
        result = {}
        try:
            # Navigate the nested structure
            props = data.get("props", {}).get("pageProps", {})
            diary_entries = props.get("diaryEntries", props.get("diary", {}))

            if isinstance(diary_entries, dict):
                totals = diary_entries.get("nutritionalTotals",
                         diary_entries.get("totals",
                         diary_entries.get("nutritional_contents", {})))
                if totals:
                    result["cal"] = int(totals.get("calories", totals.get("energy", {}).get("value", 0)))
                    result["protein"] = int(totals.get("protein", 0))
                    result["carbs"] = int(totals.get("carbohydrates", totals.get("carbs", 0)))
                    result["fat"] = int(totals.get("fat", 0))
                    result["fiber"] = int(totals.get("fiber", 0))
                    result["sugar"] = int(totals.get("sugar", 0))

            # Also try to get exercise/steps from the page
            if "exerciseDiary" in props:
                exercises = props["exerciseDiary"]
                if isinstance(exercises, list):
                    for ex in exercises:
                        name = str(ex.get("name", "")).lower()
                        if "step" in name or "walk" in name:
                            result["steps"] = int(ex.get("quantity", ex.get("calories", 0)))
        except (KeyError, TypeError, ValueError):
            pass

        return result

    def get_exercise(self, d: date) -> dict:
        """Fetch exercise data for a given date. Returns steps, exercise info."""
        date_str = d.strftime("%Y-%m-%d")
        url = f"{self.BASE_URL}/exercise/diary/{MFP_USERNAME}?date={date_str}"
        html = self._get(url)
        if not html:
            return {}

        result = {}
        # Look for step count — MFP shows iOS steps as "Walking" exercise
        step_patterns = [
            re.compile(r'(\d[\d,]*)\s*steps?', re.IGNORECASE),
            re.compile(r'Walking.*?(\d[\d,]+)', re.IGNORECASE),
        ]
        for pat in step_patterns:
            m = pat.search(html)
            if m:
                result["steps"] = int(m.group(1).replace(",", ""))
                break

        return result

    def get_weight(self, d: date) -> float | None:
        """Fetch weight measurement for a date. Returns weight in kg or None."""
        # MFP weight is on the progress page
        date_str = d.strftime("%Y-%m-%d")
        url = f"{self.BASE_URL}/account/check-in?date={date_str}"
        html = self._get(url)
        if not html:
            return None

        # Look for weight value
        weight_patterns = [
            re.compile(r'"weight"[:\s]*"?([\d.]+)"?\s*(?:kg)?', re.IGNORECASE),
            re.compile(r'([\d.]+)\s*kg', re.IGNORECASE),
        ]
        for pat in weight_patterns:
            m = pat.search(html)
            if m:
                w = float(m.group(1))
                if 40 < w < 150:  # Sanity check
                    return w
        return None


# ─── ALTERNATIVE: API-based approach ─────────────────────────────────────────

class MFPAPIClient:
    """Uses MFP internal API endpoints (found via network inspection)."""

    API_BASE = "https://www.myfitnesspal.com/api"

    def __init__(self, cookie_file: str):
        self.cookie_jar = MozillaCookieJar(cookie_file)
        self.cookie_jar.load(ignore_discard=True, ignore_expires=True)
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )
        self.opener.addheaders = [
            ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
             "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
            ("Accept", "application/json"),
            ("Accept-Language", "en-US,en;q=0.9"),
            ("Referer", "https://www.myfitnesspal.com/food/diary"),
            ("X-Requested-With", "XMLHttpRequest"),
        ]

    def _get_json(self, url: str) -> dict:
        try:
            req = urllib.request.Request(url)
            with self.opener.open(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  API error: {e}", file=sys.stderr)
            return {}

    def get_diary(self, d: date) -> dict:
        """Fetch food diary via MFP internal API."""
        date_str = d.strftime("%Y-%m-%d")

        # Try the internal food diary API
        endpoints = [
            f"{self.API_BASE}/food/diary/{MFP_USERNAME}.json?date={date_str}",
            f"{self.API_BASE}/nutrition?date={date_str}&username={MFP_USERNAME}",
            f"https://www.myfitnesspal.com/food/diary/{MFP_USERNAME}.json?date={date_str}",
        ]

        for url in endpoints:
            data = self._get_json(url)
            if data:
                return self._parse_api_diary(data)

        return {}

    def _parse_api_diary(self, data: dict) -> dict:
        """Parse JSON response from MFP diary API."""
        result = {}
        try:
            # Different API formats
            if "diary_entries" in data:
                totals = {"cal": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}
                for entry in data["diary_entries"]:
                    nc = entry.get("nutritional_contents", {})
                    totals["cal"] += nc.get("calories", nc.get("energy", {}).get("value", 0))
                    totals["protein"] += nc.get("protein", 0)
                    totals["carbs"] += nc.get("carbohydrates", nc.get("carbs", 0))
                    totals["fat"] += nc.get("fat", 0)
                    totals["fiber"] += nc.get("fiber", 0)
                    totals["sugar"] += nc.get("sugar", 0)
                result = {k: int(v) for k, v in totals.items()}

            elif "food_entries" in data:
                totals = {"cal": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}
                for entry in data["food_entries"]:
                    totals["cal"] += entry.get("calories", 0)
                    totals["protein"] += entry.get("protein", 0)
                    totals["carbs"] += entry.get("carbs", entry.get("total_carbohydrates", 0))
                    totals["fat"] += entry.get("fat", entry.get("total_fat", 0))
                    totals["fiber"] += entry.get("fiber", 0)
                    totals["sugar"] += entry.get("sugar", 0)
                result = {k: int(v) for k, v in totals.items()}

            elif "total" in data:
                t = data["total"]
                result = {
                    "cal": int(t.get("calories", 0)),
                    "protein": int(t.get("protein", 0)),
                    "carbs": int(t.get("carbohydrates", t.get("carbs", 0))),
                    "fat": int(t.get("fat", 0)),
                    "fiber": int(t.get("fiber", 0)),
                    "sugar": int(t.get("sugar", 0)),
                }
        except (KeyError, TypeError, ValueError):
            pass

        return result


# ─── DATA STORE ──────────────────────────────────────────────────────────────

class DataStore:
    """JSON file–based data store for Stride."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.data_file = self.data_dir / "stride-data.json"
        self.data = self._load()

    def _load(self) -> dict:
        if self.data_file.exists():
            with open(self.data_file) as f:
                return json.load(f)
        return {
            "meta": {
                "username": MFP_USERNAME,
                "program_start": PROGRAM_START.isoformat(),
                "last_sync": None,
                "start_weight": 80.5,
                "target_weight": 68.0,
            },
            "daily": {},   # "2026-01-05": { nutrients, scores, activity }
            "weekly": {},  # "1": { averages, scores }
            "weight": {},  # "2026-01-05": 80.5
        }

    def save(self):
        with open(self.data_file, "w") as f:
            json.dump(self.data, f, indent=2, default=str)

    def upsert_day(self, d: date, nutrients: dict, steps: int = 0,
                   weight: float = None, sleep: float = None, gym: bool = None):
        date_str = d.isoformat()
        week = get_week_number(d)
        phase = get_phase(week)
        targets = PHASE_TARGETS[phase]

        # DATA PROTECTION: never overwrite an existing day that has real calorie
        # data with an empty/zero pull (e.g. when cookies expire mid-run)
        existing = self.data["daily"].get(date_str, {})
        existing_cal = existing.get("nutrients", {}).get("cal", 0)
        new_cal = nutrients.get("cal", 0) if nutrients else 0
        if existing_cal > 0 and new_cal == 0:
            print(f"    ⚠️  PROTECTED {date_str}: keeping existing data ({existing_cal} cal), "
                  f"refusing to overwrite with empty pull")
            return

        day_data = self.data["daily"].get(date_str, {})
        day_data.update({
            "date": date_str,
            "week": week,
            "phase": phase,
            "day": get_day_name(d),
            "nutrients": nutrients,
            "steps": steps or day_data.get("steps", 0),
            "sleep": sleep if sleep is not None else day_data.get("sleep"),
            "gym": gym if gym is not None else day_data.get("gym"),
            "compliance": compute_compliance(nutrients, targets) if nutrients.get("cal") else 0,
            "flat_stomach": compute_flat_stomach(nutrients, targets) if nutrients.get("cal") else 0,
            "cal_flag": self._cal_flag(nutrients.get("cal", 0), targets["cal"]),
            "fiber_flag": "On target" if nutrients.get("fiber", 0) >= targets["fiber"][0] else "Low",
        })

        self.data["daily"][date_str] = day_data

        if weight is not None:
            self.data["weight"][date_str] = weight

        # Recompute weekly averages for this week
        self._recompute_weekly(week)

    def _cal_flag(self, cal: int, target: tuple) -> str:
        lo, hi = target
        if cal < lo: return "Low"
        if cal > hi: return "Over target"
        return "On target"

    def _recompute_weekly(self, week: int):
        """Recompute weekly averages from daily data."""
        week_days = [v for v in self.data["daily"].values()
                     if v["week"] == week and v.get("nutrients", {}).get("cal")]
        if not week_days:
            return

        n = len(week_days)
        avgs = {}
        for key in ["cal", "protein", "carbs", "fat", "fiber", "sugar"]:
            vals = [d["nutrients"].get(key, 0) for d in week_days]
            avgs[key] = round(sum(vals) / n, 1)

        step_vals = [d.get("steps", 0) for d in week_days if d.get("steps")]
        avg_steps = round(sum(step_vals) / len(step_vals), 1) if step_vals else 0

        sleep_vals = [d.get("sleep", 0) for d in week_days if d.get("sleep")]
        avg_sleep = round(sum(sleep_vals) / len(sleep_vals), 1) if sleep_vals else 0

        comp_vals = [d.get("compliance", 0) for d in week_days]
        flat_vals = [d.get("flat_stomach", 0) for d in week_days]

        phase = get_phase(week)
        targets = PHASE_TARGETS[phase]

        self.data["weekly"][str(week)] = {
            "week": week,
            "phase": phase,
            "days_logged": n,
            "avg_nutrients": avgs,
            "avg_steps": avg_steps,
            "avg_sleep": avg_sleep,
            "avg_compliance": round(sum(comp_vals) / n, 1),
            "avg_flat_stomach": round(sum(flat_vals) / n, 1),
            "cal_flag": self._cal_flag(avgs["cal"], targets["cal"]),
            "fiber_flag": "On target" if avgs["fiber"] >= targets["fiber"][0] else "Low",
            "gym_days": sum(1 for d in week_days if d.get("gym")),
        }

    def finalize(self):
        """Compute derived data for the frontend."""
        self.data["meta"]["last_sync"] = datetime.now().isoformat()

        # Compute all-time running averages
        all_days = [v for v in self.data["daily"].values()
                    if v.get("nutrients", {}).get("cal")]
        if all_days:
            n = len(all_days)
            self.data["meta"]["running_averages"] = {}
            for key in ["cal", "protein", "carbs", "fat", "fiber", "sugar"]:
                vals = [d["nutrients"].get(key, 0) for d in all_days]
                self.data["meta"]["running_averages"][key] = round(sum(vals) / n, 1)

        # Weight timeline
        weights = sorted(self.data["weight"].items())
        if weights:
            self.data["meta"]["current_weight"] = weights[-1][1]
            self.data["meta"]["total_lost"] = round(
                self.data["meta"]["start_weight"] - weights[-1][1], 1)

        # Current week
        today = date.today()
        self.data["meta"]["current_week"] = get_week_number(today)
        self.data["meta"]["current_phase"] = get_phase(get_week_number(today))


# ─── MAIN SYNC LOGIC ────────────────────────────────────────────────────────

def sync_date(client, store: DataStore, d: date, verbose: bool = True):
    """Sync a single date from MFP to the data store."""
    date_str = d.isoformat()
    if verbose:
        print(f"  Syncing {date_str} (Week {get_week_number(d)}, {get_day_name(d)})...")

    # Fetch nutrition
    nutrients = client.get_diary(d)
    if not nutrients or not nutrients.get("cal"):
        if verbose:
            print(f"    No diary data for {date_str}")
        return False

    # Fetch steps from exercise diary
    exercise = client.get_exercise(d)
    steps = exercise.get("steps", 0)

    # Fetch weight
    weight = client.get_weight(d)

    if verbose:
        cal = nutrients.get("cal", 0)
        prot = nutrients.get("protein", 0)
        print(f"    Cal: {cal} | Protein: {prot}g | Steps: {steps} | Weight: {weight}")

    store.upsert_day(d, nutrients, steps=steps, weight=weight)
    return True


def main():
    parser = argparse.ArgumentParser(description="Stride MFP Data Sync")
    parser.add_argument("--date", type=str, help="Sync specific date (YYYY-MM-DD)")
    parser.add_argument("--backfill", type=int, help="Backfill N days from today")
    parser.add_argument("--cookie-file", type=str, default=COOKIE_FILE,
                        help="Path to Netscape cookie file")
    parser.add_argument("--data-dir", type=str, default=str(DATA_DIR),
                        help="Output directory for JSON data")
    parser.add_argument("--quiet", action="store_true", help="Minimal output")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    verbose = not args.quiet

    if verbose:
        print("═══ Stride MFP Sync ═══")

    # Initialize MFP client — try API first, fall back to HTML scraping
    # If MFP_COOKIES env var contains raw cookie content (from GitHub Actions secret),
    # write it to a temp file so MozillaCookieJar can read it
    import tempfile, os as _os
    raw_cookies = _os.environ.get("MFP_COOKIES", "")
    if raw_cookies and not _os.path.isfile(args.cookie_file):
        if raw_cookies.startswith("# Netscape"):
            # Already in Netscape format — write as-is
            tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
            tmp.write(raw_cookies)
            tmp.close()
            args.cookie_file = tmp.name
        elif "session-token" in raw_cookies or "remember_me" in raw_cookies:
            # Raw cookie string (name=value; name=value) — convert to Netscape format
            tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
            tmp.write("# Netscape HTTP Cookie File\n")
            for pair in raw_cookies.split("; "):
                if "=" in pair:
                    name, _, val = pair.partition("=")
                    tmp.write(f"www.myfitnesspal.com\tFALSE\t/\tTRUE\t1779965063\t{name.strip()}\t{val.strip()}\n")
            tmp.close()
            args.cookie_file = tmp.name
        if verbose:
            print(f"Wrote MFP_COOKIES env var to temp file: {args.cookie_file}")

    if verbose:
        print(f"Loading cookies from: {args.cookie_file}")

    try:
        client = MFPAPIClient(args.cookie_file)
        # Test with a quick request
        test = client.get_diary(date.today() - timedelta(days=1))
        if not test:
            if verbose:
                print("API client returned empty, trying HTML scraper...")
            client = MFPClient(args.cookie_file)
    except Exception:
        client = MFPClient(args.cookie_file)

    store = DataStore(data_dir)

    # AUTH GUARD: verify cookies work before doing anything that could save.
    # Probe a recent date that should have data. If nothing comes back AND the
    # store already has historical data, the cookies are almost certainly expired —
    # abort without saving so we never overwrite good data with empties.
    probe_days = [date.today() - timedelta(days=i) for i in range(1, 6)]
    auth_ok = False
    for pd in probe_days:
        try:
            probe = client.get_diary(pd)
            if probe and probe.get("cal", 0) > 0:
                auth_ok = True
                break
        except Exception:
            continue

    existing_days_with_data = sum(
        1 for v in store.data.get("daily", {}).values()
        if v.get("nutrients", {}).get("cal", 0) > 0
    )

    if not auth_ok and existing_days_with_data > 0:
        print("=" * 60)
        print("❌ AUTH CHECK FAILED — no diary data returned for last 5 days,")
        print(f"   but store already has {existing_days_with_data} days of real data.")
        print("   Cookies are likely EXPIRED. Aborting WITHOUT saving to protect")
        print("   existing data. Refresh MFP_COOKIES and re-run.")
        print("=" * 60)
        sys.exit(1)

    if not auth_ok:
        print("⚠️  Warning: auth probe found no recent data (store is empty, "
              "so proceeding — this may be a fresh setup).")

    if args.date:
        d = date.fromisoformat(args.date)
        sync_date(client, store, d, verbose)
    elif args.backfill:
        today = date.today()
        for i in range(args.backfill, 0, -1):
            d = today - timedelta(days=i)
            if d >= PROGRAM_START:
                sync_date(client, store, d, verbose)
                time.sleep(1.5)  # Rate limiting
    else:
        # Default: sync yesterday
        yesterday = date.today() - timedelta(days=1)
        sync_date(client, store, yesterday, verbose)

    store.finalize()
    store.save()

    if verbose:
        daily_count = len([d for d in store.data["daily"].values()
                          if d.get("nutrients", {}).get("cal")])
        print(f"\n✓ Synced. {daily_count} days with data.")
        print(f"  Data saved to: {store.data_file}")


if __name__ == "__main__":
    main()

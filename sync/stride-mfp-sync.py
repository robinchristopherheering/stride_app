#!/usr/bin/env python3
"""
Stride MFP Sync — Fetches diary data from MyFitnessPal using session cookies.
Outputs a JSON file consumed by the Stride frontend.

Usage:
    python sync_mfp.py                    # Sync yesterday
    python sync_mfp.py --date 2026-06-02  # Sync specific date
    python sync_mfp.py --backfill 6       # Backfill last 6 days
"""

import json, os, sys, time, argparse
from datetime import datetime, timedelta, date
from pathlib import Path
from http.cookiejar import CookieJar, Cookie
import urllib.request, urllib.error

# ─── CONFIG ──────────────────────────────────────────────────────────────────
MFP_USERNAME = os.environ.get("MFP_USERNAME", "robincheering186")
DATA_DIR = Path(os.environ.get("DATA_DIR", "public/data"))
PROGRAM_START = date(2026, 1, 5)  # Week 1 Day 1

# Phase targets: { phase_num: { nutrient: (low, high) } }
# Aligned with the app's 25-week program.
PHASE_TARGETS = {
    1: {  # Weeks 1–8 (Foundation)
        "cal": (1300, 1500), "protein": (130, 160), "carbs": (40, 70),
        "fat": (40, 55), "sugar": (0, 20), "fiber": (20, 30),
        "steps": (8000, 10000),
    },
    2: {  # Weeks 9–18 (Symmetry / Water Flush)
        "cal": (1600, 1800), "protein": (130, 150), "carbs": (80, 130),
        "fat": (45, 65), "sugar": (0, 30), "fiber": (25, 35),
        "steps": (8000, 12000),
    },
    3: {  # Weeks 19–25 (Metabolic Rebuild)
        "cal": (1600, 1850), "protein": (200, 210), "carbs": (110, 165),
        "fat": (40, 45), "sugar": (0, 30), "fiber": (30, 35),
        "steps": (8000, 10000),
    },
}

SCORE_WEIGHTS = {
    "cal": 0.25, "protein": 0.30, "carbs": 0.05,
    "fat": 0.10, "sugar": 0.05, "fiber": 0.25,
}


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def get_week_number(d: date) -> int:
    delta = (d - PROGRAM_START).days
    return max(1, delta // 7 + 1)

def get_phase(week: int) -> int:
    if week <= 8: return 1
    if week <= 18: return 2
    return 3

def get_day_name(d: date) -> str:
    return d.strftime("%a")

def score_nutrient(val: float, lo: float, hi: float) -> float:
    if lo <= val <= hi:
        return 100.0
    elif val < lo:
        return max(0.0, val / lo * 100) if lo > 0 else 100.0
    else:
        return max(0.0, 100 - (val - hi) / hi * 100) if hi > 0 else 0.0

def compute_compliance(nutrients: dict, targets: dict) -> float:
    total = 0.0
    for key, weight in SCORE_WEIGHTS.items():
        lo, hi = targets.get(key, (0, 0))
        val = nutrients.get(key, 0)
        total += score_nutrient(val, lo, hi) * weight
    return round(min(100, max(0, total)))

def compute_flat_stomach(nutrients: dict, targets: dict) -> float:
    base = compute_compliance(nutrients, targets)
    sugar = nutrients.get("sugar", 0)
    carbs = nutrients.get("carbs", 0)
    fiber = nutrients.get("fiber", 0)
    sugar_target = targets.get("sugar", (0, 20))[1]
    carbs_target_hi = targets.get("carbs", (40, 70))[1]
    fiber_target_hi = targets.get("fiber", (20, 30))[1]
    penalty = 0
    if sugar > sugar_target:
        penalty += min(5, (sugar - sugar_target) / 10)
    if carbs > carbs_target_hi:
        penalty += min(4, (carbs - carbs_target_hi) / 20)
    if fiber > fiber_target_hi * 1.5:
        penalty += min(3, (fiber - fiber_target_hi * 1.5) / 10)
    return round(min(100, max(0, base - penalty)))


# ─── COOKIE LOADING (bulletproof — no Netscape file parsing) ─────────────────

def load_cookies_from_env() -> CookieJar:
    """Build a CookieJar directly from the MFP_COOKIES env var
    (raw 'name=value; name=value' string). No file parsing → no LoadError."""
    raw = os.environ.get("MFP_COOKIES", "").strip()
    if not raw:
        raise RuntimeError("MFP_COOKIES env var is empty")

    # If someone pasted a full Netscape file, strip comments and pull name/value pairs
    if raw.startswith("# Netscape") or "\t" in raw:
        pairs = []
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 7:
                pairs.append((parts[5], parts[6]))
    else:
        pairs = []
        for chunk in raw.split("; "):
            chunk = chunk.strip()
            if "=" in chunk:
                name, _, value = chunk.partition("=")
                pairs.append((name.strip(), value.strip()))

    cj = CookieJar()
    for name, value in pairs:
        cj.set_cookie(Cookie(
            version=0, name=name, value=value,
            port=None, port_specified=False,
            domain=".myfitnesspal.com", domain_specified=True,
            domain_initial_dot=True,
            path="/", path_specified=True,
            secure=True, expires=None, discard=False,
            comment=None, comment_url=None, rest={}, rfc2109=False,
        ))
    return cj


def extract_user_id(cookie_jar: CookieJar) -> str:
    """Pull the numeric MFP user id from cookies (known_user or remember_me)."""
    user_id = ""
    for c in cookie_jar:
        if c.name == "known_user" and c.value.isdigit():
            return c.value
        if c.name == "remember_me" and "%3A" in c.value:
            cand = c.value.split("%3A")[0]
            if cand.isdigit():
                user_id = cand
        if c.name == "remember_me" and ":" in c.value:
            cand = c.value.split(":")[0]
            if cand.isdigit():
                user_id = cand
    return user_id


# ─── MFP CLIENT ──────────────────────────────────────────────────────────────

class MFPClient:
    """Fetches data from MyFitnessPal. Uses the authenticated v2 API for full
    nutrition (incl. fiber) and falls back to HTML scraping."""

    BASE_URL = "https://www.myfitnesspal.com"
    API_BASE = "https://api.myfitnesspal.com"
    UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

    def __init__(self, cookie_jar: CookieJar):
        self.cookie_jar = cookie_jar
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )
        self.opener.addheaders = [
            ("User-Agent", self.UA),
            ("Accept", "application/json, text/html, */*"),
            ("Accept-Language", "en-US,en;q=0.9"),
            ("Referer", "https://www.myfitnesspal.com/food/diary"),
        ]
        self.user_id = extract_user_id(cookie_jar)
        self.token = self._get_token()

    def _get_token(self) -> str:
        try:
            req = urllib.request.Request(f"{self.BASE_URL}/user/auth_token?refresh=true")
            with self.opener.open(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                token = data.get("access_token", "")
                # If we didn't have a userId from cookies, try decoding the JWT
                if token and not self.user_id:
                    try:
                        import base64
                        payload = token.split(".")[1]
                        payload += "=" * ((4 - len(payload) % 4) % 4)
                        decoded = json.loads(base64.urlsafe_b64decode(payload))
                        self.user_id = str(decoded.get("sub") or decoded.get("user_id") or "")
                    except Exception:
                        pass
                return token
        except Exception as e:
            print(f"  Token fetch failed: {e}", file=sys.stderr)
            return ""

    def _api_get(self, path: str) -> dict:
        """Authenticated GET against api.myfitnesspal.com."""
        try:
            req = urllib.request.Request(self.API_BASE + path)
            req.add_header("Authorization", f"Bearer {self.token}")
            req.add_header("mfp-client-id", "mfp-main-js")
            req.add_header("mfp-user-id", self.user_id)
            req.add_header("Accept", "application/json")
            req.add_header("User-Agent", self.UA)
            with self.opener.open(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"  API HTTP {e.code} for {path}", file=sys.stderr)
            return {}
        except Exception as e:
            print(f"  API error {path}: {e}", file=sys.stderr)
            return {}

    def _html_get(self, url: str) -> str:
        try:
            req = urllib.request.Request(url)
            with self.opener.open(req, timeout=30) as resp:
                return resp.read().decode("utf-8")
        except Exception as e:
            print(f"  HTML error {url}: {e}", file=sys.stderr)
            return ""

    def get_diary(self, d: date) -> dict:
        """Return nutrient totals incl. fiber for a date. API first, HTML fallback."""
        date_str = d.strftime("%Y-%m-%d")

        # ── Primary: authenticated v2 API (returns per-meal nutritional_contents)
        if self.token and self.user_id:
            path = (f"/v2/diary?entry_date={date_str}"
                    f"&fields%5B%5D=nutritional_contents&fields%5B%5D=diary_meal")
            data = self._api_get(path)
            items = data.get("items", []) if isinstance(data, dict) else []
            if items:
                totals = {"cal": 0.0, "protein": 0.0, "carbs": 0.0,
                          "fat": 0.0, "fiber": 0.0, "sugar": 0.0}
                for it in items:
                    n = it.get("nutritional_contents", {}) or {}
                    energy = n.get("energy", {})
                    cal = energy.get("value", 0) if isinstance(energy, dict) else (energy or 0)
                    totals["cal"] += cal or n.get("calories", 0) or 0
                    totals["protein"] += n.get("protein", 0) or 0
                    totals["carbs"] += n.get("carbohydrates", n.get("carbs", 0)) or 0
                    totals["fat"] += n.get("fat", 0) or 0
                    totals["fiber"] += n.get("fiber", 0) or 0
                    totals["sugar"] += n.get("sugar", 0) or 0
                # Round: macros to whole, fiber to 1 decimal (often < 1)
                return {
                    "cal": round(totals["cal"]),
                    "protein": round(totals["protein"]),
                    "carbs": round(totals["carbs"]),
                    "fat": round(totals["fat"]),
                    "fiber": round(totals["fiber"], 1),
                    "sugar": round(totals["sugar"]),
                }

        # ── Fallback: scrape the diary HTML totals row
        return self._scrape_diary(date_str)

    def _scrape_diary(self, date_str: str) -> dict:
        import re
        html = self._html_get(f"{self.BASE_URL}/food/diary/{MFP_USERNAME}?date={date_str}")
        if not html:
            return {}
        result = {}
        m = re.search(r'<tr[^>]*class="[^"]*total[^"]*"[^>]*>(.*?)</tr>',
                      html, re.DOTALL | re.IGNORECASE)
        if m:
            nums = re.findall(r'>[\s]*([\d,]+)[\s]*<', m.group(1))
            nums = [int(n.replace(",", "")) for n in nums if n.strip()]
            # MFP free column order: [calories, carbs, fat, protein, sodium, sugar]
            if len(nums) >= 4:
                result["cal"] = nums[0]
                result["carbs"] = nums[1]
                result["fat"] = nums[2]
                result["protein"] = nums[3]
            if len(nums) >= 6:
                result["sugar"] = nums[5]
            result["fiber"] = 0  # not in free diary HTML
        return result

    def get_steps(self, d: date) -> int:
        """Steps from the authenticated steps API, else 0."""
        date_str = d.strftime("%Y-%m-%d")
        if self.token and self.user_id:
            data = self._api_get(f"/v2/users/{self.user_id}/steps/{date_str}")
            if isinstance(data, dict):
                steps = data.get("steps") or data.get("value") or \
                        (data.get("data", {}) or {}).get("steps", 0)
                try:
                    steps = int(steps)
                    if steps > 0:
                        return steps
                except (TypeError, ValueError):
                    pass
        return 0

    def get_weight(self, d: date):
        """Latest weight (kg) on or before date, via measurements API, else None."""
        if self.token and self.user_id:
            data = self._api_get(f"/v2/measurements?type=weight&most_recent=true")
            if isinstance(data, dict):
                items = data.get("items", [])
                if items:
                    val = items[0].get("value")
                    try:
                        w = float(val)
                        if 40 < w < 150:
                            return w
                    except (TypeError, ValueError):
                        pass
        return None


# ─── DATA STORE ──────────────────────────────────────────────────────────────

class DataStore:
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
                "target_weight": 63.0,
            },
            "daily": {}, "weekly": {}, "weight": {},
        }

    def save(self):
        with open(self.data_file, "w") as f:
            json.dump(self.data, f, indent=2, default=str)

    def count_days_with_data(self) -> int:
        return sum(1 for v in self.data.get("daily", {}).values()
                   if v.get("nutrients", {}).get("cal", 0) > 0)

    def upsert_day(self, d: date, nutrients: dict, steps: int = 0,
                   weight: float = None, sleep: float = None, gym: bool = None):
        date_str = d.isoformat()

        # DATA PROTECTION: never overwrite a day that has real calorie data
        # with an empty/zero pull (e.g. cookies expired mid-run).
        existing = self.data["daily"].get(date_str, {})
        existing_cal = existing.get("nutrients", {}).get("cal", 0)
        new_cal = nutrients.get("cal", 0) if nutrients else 0
        if existing_cal > 0 and new_cal == 0:
            print(f"    PROTECTED {date_str}: keeping {existing_cal} cal, refusing empty overwrite")
            return

        week = get_week_number(d)
        phase = get_phase(week)
        targets = PHASE_TARGETS[phase]

        day_data = existing if existing else {}
        day_data.update({
            "date": date_str, "week": week, "phase": phase, "day": get_day_name(d),
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

        self._recompute_weekly(week)

    def _cal_flag(self, cal: float, target: tuple) -> str:
        lo, hi = target
        if cal < lo: return "Low"
        if cal > hi: return "Over target"
        return "On target"

    def _recompute_weekly(self, week: int):
        week_days = [v for v in self.data["daily"].values()
                     if v.get("week") == week and v.get("nutrients", {}).get("cal")]
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
            "week": week, "phase": phase, "days_logged": n,
            "avg_nutrients": avgs, "avg_steps": avg_steps, "avg_sleep": avg_sleep,
            "avg_compliance": round(sum(comp_vals) / n, 1),
            "avg_flat_stomach": round(sum(flat_vals) / n, 1),
            "cal_flag": self._cal_flag(avgs["cal"], targets["cal"]),
            "fiber_flag": "On target" if avgs["fiber"] >= targets["fiber"][0] else "Low",
            "gym_days": sum(1 for d in week_days if d.get("gym")),
        }

    def finalize(self):
        self.data["meta"]["last_sync"] = datetime.now().isoformat()
        all_days = [v for v in self.data["daily"].values()
                    if v.get("nutrients", {}).get("cal")]
        if all_days:
            n = len(all_days)
            self.data["meta"]["running_averages"] = {}
            for key in ["cal", "protein", "carbs", "fat", "fiber", "sugar"]:
                vals = [d["nutrients"].get(key, 0) for d in all_days]
                self.data["meta"]["running_averages"][key] = round(sum(vals) / n, 1)
        weights = sorted(self.data["weight"].items())
        if weights:
            self.data["meta"]["current_weight"] = weights[-1][1]
            self.data["meta"]["total_lost"] = round(
                self.data["meta"]["start_weight"] - weights[-1][1], 1)
        today = date.today()
        self.data["meta"]["current_week"] = get_week_number(today)
        self.data["meta"]["current_phase"] = get_phase(get_week_number(today))


# ─── SYNC LOGIC ──────────────────────────────────────────────────────────────

def sync_date(client: MFPClient, store: DataStore, d: date, verbose: bool = True) -> bool:
    date_str = d.isoformat()
    if verbose:
        print(f"  Syncing {date_str} (Week {get_week_number(d)}, {get_day_name(d)})...")
    nutrients = client.get_diary(d)
    if not nutrients or not nutrients.get("cal"):
        if verbose:
            print(f"    No diary data for {date_str}")
        return False
    steps = client.get_steps(d)
    weight = client.get_weight(d)
    if verbose:
        print(f"    Cal {nutrients.get('cal')} | Pro {nutrients.get('protein')}g | "
              f"Fiber {nutrients.get('fiber')}g | Steps {steps} | Weight {weight}")
    store.upsert_day(d, nutrients, steps=steps, weight=weight)
    return True


def main():
    parser = argparse.ArgumentParser(description="Stride MFP Data Sync")
    parser.add_argument("--date", type=str, help="Sync specific date (YYYY-MM-DD)")
    parser.add_argument("--backfill", type=int, help="Backfill N days from today")
    parser.add_argument("--data-dir", type=str, default=str(DATA_DIR))
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    verbose = not args.quiet

    print("🏃 Stride MFP Sync starting...")
    print(f"   Program start: {PROGRAM_START}")
    print(f"   Username: {MFP_USERNAME}")

    cookie_jar = load_cookies_from_env()
    client = MFPClient(cookie_jar)
    print(f"   Auth token: {'yes' if client.token else 'NO'} | user_id: {client.user_id or 'NONE'}")

    store = DataStore(data_dir)

    # AUTH GUARD: probe recent days; if nothing comes back but the store already
    # has data, the cookies are likely expired → abort WITHOUT saving.
    auth_ok = False
    for i in range(1, 6):
        probe = client.get_diary(date.today() - timedelta(days=i))
        if probe and probe.get("cal", 0) > 0:
            auth_ok = True
            break
    existing = store.count_days_with_data()
    if not auth_ok and existing > 0:
        print("=" * 60)
        print("❌ AUTH CHECK FAILED — no diary data for last 5 days, but store")
        print(f"   already has {existing} days. Cookies likely EXPIRED.")
        print("   Aborting WITHOUT saving to protect existing data.")
        print("=" * 60)
        sys.exit(1)

    if args.date:
        sync_date(client, store, date.fromisoformat(args.date), verbose)
    elif args.backfill:
        today = date.today()
        for i in range(args.backfill, 0, -1):
            d = today - timedelta(days=i)
            if d >= PROGRAM_START:
                sync_date(client, store, d, verbose)
                time.sleep(1.5)
    else:
        sync_date(client, store, date.today() - timedelta(days=1), verbose)

    store.finalize()
    store.save()

    daily_count = store.count_days_with_data()
    print(f"\n✓ Synced. {daily_count} days with data.")
    print(f"  Data saved to: {store.data_file}")


if __name__ == "__main__":
    main()

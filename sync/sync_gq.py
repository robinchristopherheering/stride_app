#!/usr/bin/env python3
"""
Fetch GQ Fitness RSS feed and output public/data/lifestyle.json
Run manually: python sync/sync_gq.py
Or automate via GitHub Actions (see .github/workflows/sync-lifestyle.yml)
"""
import json, re, sys, os
from datetime import datetime
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET

RSS_URL = "https://www.gq.com/feed/rss"
FALLBACK_URLS = [
    "https://www.gq.com/feed/wellness/rss",
    "https://www.gq-magazine.co.uk/feed/rss",
]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "lifestyle.json")
MAX_ARTICLES = 12
HEADERS = {"User-Agent": "Mozilla/5.0 (Stride App RSS Sync)"}


def fetch_feed(url):
    """Fetch and parse an RSS feed, return list of article dicts."""
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as resp:
        xml = resp.read()
    root = ET.fromstring(xml)
    articles = []
    ns = {"media": "http://search.yahoo.com/mrss/", "dc": "http://purl.org/dc/elements/1.1/"}
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        desc = (item.findtext("description") or "").strip()
        pub = item.findtext("pubDate") or ""
        category = (item.findtext("category") or "").lower()

        # Filter for fitness/wellness/health content
        fitness_kw = ["fitness", "wellness", "workout", "exercise", "health",
                      "training", "strength", "cardio", "running", "nutrition",
                      "diet", "protein", "sleep", "recovery", "muscle", "gym"]
        combined = f"{title} {desc} {category}".lower()
        if not any(kw in combined for kw in fitness_kw):
            continue

        # Extract image from media:content or enclosure
        image = ""
        media = item.find("media:content", ns) or item.find("media:thumbnail", ns)
        if media is not None:
            image = media.get("url", "")
        if not image:
            enc = item.find("enclosure")
            if enc is not None and "image" in (enc.get("type") or ""):
                image = enc.get("url", "")
        if not image:
            m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
            if m:
                image = m.group(1)

        # Clean description (strip HTML)
        summary = re.sub(r"<[^>]+>", "", desc).strip()[:200]

        # Parse date
        try:
            dt = datetime.strptime(pub.strip(), "%a, %d %b %Y %H:%M:%S %z")
            iso = dt.isoformat()
        except Exception:
            iso = pub.strip()

        articles.append({
            "id": re.sub(r"[^a-z0-9]", "", link.split("/")[-1] or title.lower())[:32],
            "title": title,
            "link": link,
            "summary": summary,
            "date": iso,
            "image": image,
            "source": "GQ Fitness",
            "type": "article",
        })

    return articles[:MAX_ARTICLES]


def main():
    articles = []
    for url in [RSS_URL] + FALLBACK_URLS:
        try:
            articles = fetch_feed(url)
            if articles:
                print(f"Fetched {len(articles)} fitness articles from {url}")
                break
        except Exception as e:
            print(f"Failed {url}: {e}", file=sys.stderr)
            continue

    if not articles:
        print("No articles fetched from any source", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump({"articles": articles, "updated": datetime.now().isoformat()}, f, indent=2)
    print(f"Wrote {len(articles)} articles to {OUT}")


if __name__ == "__main__":
    main()

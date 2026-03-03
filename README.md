# 🏃 Stride — Fitness Transformation Cockpit

A personal fitness dashboard that syncs with MyFitnessPal daily and displays your nutrition, weight, steps, and compliance scores in a beautiful dark-mode cockpit interface.

**Live at:** `https://YOUR_USERNAME.github.io/stride/`

---

## How It Works

```
MyFitnessPal ──► GitHub Actions (4:30 AM CET daily) ──► stride-data.json ──► GitHub Pages
     │               runs sync/sync_mfp.py                    │                    │
     │               using your MFP cookies                    │                    │
     └── your food diary, weight, steps ──────────────────────►└────► React app ───►│
                                                                                    └── your browser
```

1. **Every day at 4:30 AM CET**, a GitHub Action runs the Python sync script
2. The script logs into MyFitnessPal using your cookies and pulls yesterday's data
3. It computes compliance/flat stomach scores and writes `stride-data.json`
4. The JSON is committed to the repo, which triggers a rebuild of the site
5. When you wake up, your Stride dashboard is up to date

---

## 🚀 Setup Guide (First Time)

### Step 1: Create the GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `stride` (or whatever you like)
3. Set it to **Private** (your MFP data will be in the repo)
4. Click **Create repository**

### Step 2: Push the Code

Open your terminal and run:

```bash
cd stride-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stride.git
git push -u origin main
```

> **Don't have git installed?** Download it from [git-scm.com](https://git-scm.com/) or if you're on Mac, just open Terminal and type `git` — it will prompt you to install it.

### Step 3: Add Your MFP Cookies as a Secret

Your cookies are how the sync script authenticates with MyFitnessPal. They need to be stored securely as a GitHub Secret (encrypted, never visible in logs).

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `MFP_COOKIES`
4. Value: Paste the **entire contents** of your `www_myfitnesspal_com_cookies.txt` file
5. Click **Add secret**
6. Add another secret:
   - Name: `MFP_USERNAME`
   - Value: `robincheering186`

### Step 4: Enable GitHub Pages

1. Go to repo **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. That's it — the deploy workflow handles the rest

### Step 5: Run the First Sync

1. Go to the **Actions** tab in your repo
2. Click **Stride MFP Sync** in the left sidebar
3. Click **Run workflow** → **Run workflow**
4. Wait ~2 minutes for it to complete
5. Check that `public/data/stride-data.json` was updated (look at the latest commit)

### Step 6: Install Dependencies & Deploy

After the sync creates data, the deploy workflow should auto-trigger. If not:

1. Go to **Actions** → **Deploy to GitHub Pages**
2. Click **Run workflow** → **Run workflow**
3. Wait ~1 minute
4. Your site is live at: `https://YOUR_USERNAME.github.io/stride/`

---

## 📱 Access on Your Phone

Simply open `https://YOUR_USERNAME.github.io/stride/` in Safari or Chrome on your phone. To add it to your home screen:

**iPhone:**
1. Open the URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. It will appear as an app icon

---

## 🔄 Cookie Refresh

MFP cookies expire after a few weeks. When the sync starts failing:

1. Log into [myfitnesspal.com](https://www.myfitnesspal.com) in Chrome
2. Export your cookies using a cookie export extension (e.g., "Get cookies.txt LOCALLY")
3. Go to GitHub repo → **Settings** → **Secrets** → Edit `MFP_COOKIES`
4. Paste the new cookie file contents
5. Manually run the sync workflow to test

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Edit `src/StrideApp.jsx` to customize the UI.

---

## Project Structure

```
stride/
├── .github/workflows/
│   ├── sync.yml          # Daily MFP data sync (4:30 AM CET)
│   └── deploy.yml        # Auto-deploy to GitHub Pages
├── public/
│   └── data/
│       └── stride-data.json  # Auto-generated MFP data
├── src/
│   ├── main.jsx          # React entry point
│   └── StrideApp.jsx     # The Stride dashboard component
├── sync/
│   ├── sync_mfp.py       # Python MFP sync script
│   └── requirements.txt  # Python dependencies
├── index.html
├── package.json
└── vite.config.js
```

---

## Data Privacy

- Your repo should be **private** — your nutrition data is personal
- Cookies are stored as encrypted GitHub Secrets — never visible in logs
- The sync script only reads your data, never writes to MFP
- No data leaves GitHub — everything stays in your repo and GitHub Pages

# Orion — Creator Studio
### Built for creators who mean it.

---

## Deploy in 5 steps (takes ~10 minutes)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key — it starts with `sk-ant-...`

---

### Step 2 — Put the code on GitHub
1. Go to https://github.com and create a free account
2. Click **New repository** → name it `orion` → click **Create repository**
3. On the next screen click **uploading an existing file**
4. Drag and drop ALL the files from this zip (keep the folder structure)
5. Click **Commit changes**

Your repo should look like:
```
orion/
├── vercel.json
├── package.json
├── api/
│   └── generate.js
└── public/
    └── index.html
```

---

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com
2. Click **Sign up** → choose **Continue with GitHub**
3. Click **Add New Project**
4. Find your `orion` repo and click **Import**
5. Leave all settings as default
6. Click **Deploy**

Vercel builds it automatically. Takes about 60 seconds.

---

### Step 4 — Add your API key (CRITICAL)
Without this step the app won't work.

1. In your Vercel project dashboard, click **Settings**
2. Click **Environment Variables** in the left sidebar
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your key from Step 1)
4. Click **Save**
5. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

---

### Step 5 — You're live!
Vercel gives you a URL like `https://orion-xyz.vercel.app`

Share it with anyone. It's a real, working, AI-powered app.

---

## How it works (why this is secure)

```
User's browser
    ↓  hits /api/generate
Vercel serverless function  (your API key lives here — never touches the browser)
    ↓  calls Anthropic
Claude API
    ↓  returns JSON
Back to browser
```

Your API key is stored as an environment variable on Vercel's servers.
Users can never see it. It never appears in the frontend code.

---

## File guide

| File | What it does |
|---|---|
| `vercel.json` | Tells Vercel how to route requests |
| `package.json` | Lists the Anthropic SDK dependency |
| `api/generate.js` | Your secure backend — runs on Vercel, holds the API key |
| `public/index.html` | The entire Orion frontend |

---

## Pricing tiers (frontend simulation — wire up Stripe later)

| Plan | Ideas | Titles | Thumbnail AI |
|---|---|---|---|
| Free | 1 | 1 | ✗ |
| Basic | Up to 10 | Up to 10 | ✗ |
| Premium | Up to 50 | Up to 20 | ✓ |

---

## Next steps after launch
1. **Add Stripe payments** — wire up real plan gating
2. **Add user accounts** — use Clerk.com (free tier)
3. **Add a database** — use Supabase (free tier) to save user history
4. **Custom domain** — connect `orion.com` or whatever domain you buy in Vercel → Settings → Domains

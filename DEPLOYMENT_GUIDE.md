# 🚀 Nexentra Security Audit Engine — Production Deployment Guide
**Subdomain**: `https://security.nexentra.space`  
**Cost**: **$0.00 / 100% Free Forever** (No credit card or payment info required)

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       USER / VISITOR BROWSER          |
                      +---------------------------------------+
                                          |
                                          | HTTPS: security.nexentra.space
                                          v
                      +---------------------------------------+
                      |         VERCEL (Free Tier)            |
                      |   - React + Vite SPA                  |
                      |   - Global Edge CDN                   |
                      |   - Auto SSL (Let's Encrypt)          |
                      +---------------------------------------+
                                          |
                                          | REST API (CORS enabled)
                                          v
                      +---------------------------------------+
                      |         RENDER (Free Tier)            |
                      |   - Docker Container (Dockerfile)     |
                      |   - Node.js 20 API Server (:5000)     |
                      |   - Python 3.11 Audit Probes Engine   |
                      +---------------------------------------+
                                          |
                                          | MONGODB_URI
                                          v
                      +---------------------------------------+
                      |     MONGODB ATLAS (Free M0 Cluster)   |
                      |   - Database: "nexentra"              |
                      |   - Collections: users, audits        |
                      +---------------------------------------+
```

---

## Step 1: Push Your Code to GitHub

If you haven't already pushed your code to GitHub:
```bash
git add .
git commit -m "feat: configure Vercel frontend and Render backend deployment"
git push origin main
```

---

## Step 2: Deploy Backend to Render (100% Free, No Credit Card)

1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in with GitHub.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your GitHub repository.
4. Render will automatically detect the **`render.yaml`** or **`Dockerfile`**:
   - **Name**: `nexentra-security-api`
   - **Runtime**: `Docker` (or select `Dockerfile`)
   - **Region**: `Oregon (US West)` or closest to you
   - **Instance Type**: `Free`
5. Verify the **Environment Variables**:
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://nexentratechnologies_db_user:mgjq5yP7T8xcIxgO@nexentra.h7bzy6i.mongodb.net/nexentra?retryWrites=true&w=majority`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, for example:
   ```text
   https://nexentra-security-api.onrender.com
   ```
   *(Test it in your browser: `https://nexentra-security-api.onrender.com/api/health` — it should return `{"status":"ok"}`).*

---

## Step 3: Deploy Frontend to Vercel (100% Free, No Credit Card)

1. Go to **[vercel.com](https://vercel.com/)** and sign in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **Project**.
3. Select your GitHub repository and click **Import**.
4. Configure the project:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: Click "Edit" and choose `frontend`
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render URL from Step 2 (e.g. `https://nexentra-security-api.onrender.com`)
6. Click **Deploy**.

---

## Step 4: Add Your Custom Subdomain (`security.nexentra.space`)

1. In your **Vercel Project Dashboard**, go to **Settings** $\rightarrow$ **Domains**.
2. Type:
   ```text
   security.nexentra.space
   ```
3. Click **Add**.
4. Vercel will ask you to add a DNS record at your domain registrar (Hostinger, Cloudflare, or GoDaddy).
5. Open your **Hostinger / DNS Provider Control Panel** $\rightarrow$ **DNS Zone**:
   - **Type**: `CNAME`
   - **Name / Host**: `security`
   - **Target / Value / Points to**: `cname.vercel-dns.com`
   - **TTL**: `Default` or `300` / `14400`
6. Click **Save** / **Add Record**.
7. Within 2 to 5 minutes, Vercel will verify the domain, issue a free SSL certificate, and `https://security.nexentra.space` will be live!

---

## Step 5: Prevent Render from Sleeping (Keep It Awake 24/7)

Render's free tier spins down if no requests arrive for 15 minutes. To keep it awake 24/7 with instant responses:

1. Go to **[uptimerobot.com](https://uptimerobot.com/)** (100% free, no credit card).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Nexentra Security API Health`
   - **URL / IP**: `https://nexentra-security-api.onrender.com/api/health`
   - **Monitoring Interval**: `Every 10 minutes` (or 5 minutes)
3. Click **Create Monitor**.
4. UptimeRobot will ping your `/api/health` endpoint every 10 minutes, keeping your Render backend permanently awake!

---

## Local Development Verification

You can still develop locally without changing anything:
```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
cd frontend
npm run dev
```
*(In local development, `VITE_API_BASE_URL` is empty, so Vite proxies all `/api` calls directly to `http://localhost:5000` just like before).*

# Deploying the backend (FastAPI) to Render — free tier

The frontend is on Vercel; the FastAPI backend + PostgreSQL run on Render.

## Steps

1. Go to <https://render.com>, sign up / log in (GitHub login is easiest).
2. **New → Blueprint**, and select this repo
   (`Adarsh-Chiriyamkandath-Jose/un-aid-intelligence-platform`).
   Render reads [`render.yaml`](render.yaml) and provisions:
   - a free PostgreSQL database (`unaid-db`)
   - a Python web service running `uvicorn main:app`
   - `DATABASE_URL` is wired automatically from the DB.
3. Click **Apply**. The first build installs the ML stack (Prophet/XGBoost) and
   can take several minutes.
4. After it deploys, open the service → **Environment** tab and add the secret:
   - `OPENAI_API_KEY` = your OpenAI key (needed only for the AI chat feature).
   Save — the service redeploys.
5. On first boot the app auto-creates tables and loads `merged_data_small.csv.gz`
   in a background thread. Give it a minute, then check
   `https://<your-service>.onrender.com/api/health` → should return
   `{"status":"healthy"}`.

## Then tell me the backend URL

Send me the live URL (e.g. `https://un-aid-intelligence-platform-api.onrender.com`)
and I'll add an `/api` rewrite to `vercel.json` so the frontend proxies to it, and
redeploy. After that the dashboard, map, forecasting, and chat will all work.

## Caveats (free tier)

- Render free web services **spin down after ~15 min idle**; the first request
  after idle takes ~30–60s to wake.
- Free instances have **512 MB RAM**. Loading 478k rows plus running Prophet/XGBoost
  is memory-heavy; if you hit out-of-memory errors during forecasting, bump the
  instance to a paid plan.
- The free PostgreSQL database expires after 90 days (Render policy).

## Map tiles

The interactive map needs a Mapbox token. In the **Vercel** project settings add an
env var `VITE_MAPBOX_ACCESS_TOKEN`, then redeploy the frontend. Without it the map
container renders empty but the rest of the app works.

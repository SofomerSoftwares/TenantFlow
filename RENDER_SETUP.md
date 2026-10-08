# Render Blueprint Deployment Guide

This repository includes a production-ready Render Blueprint specification (`render.yaml`) for one-click deployment on [Render](https://render.com).

---

## Quick Deploy Steps

### Option 1: Render Blueprints (Recommended - Git Infrastructure as Code)
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your repository.
5. Render automatically discovers `render.yaml` and parses the service configuration:
   - **Service Name**: `tenant-list-updater`
   - **Service Type**: Web Service (Node.js)
   - **Plan**: Free Tier (or Starter/Standard)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Route**: `/api/health`
6. If prompted for `GEMINI_API_KEY`, input your Gemini API key (or leave blank if using client features only).
7. Click **Apply**. Render will build and deploy the application.

---

### Option 2: Manual Web Service Setup on Render
If you prefer configuring the Web Service manually via the Render UI:
- **Environment**: `Node`
- **Region**: `Oregon, USA` (or nearest to your users)
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `GEMINI_API_KEY`: *(Optional secret)*

---

## Production Architecture & Features

- **Express Production Server**: `server.ts` handles graceful SIGTERM/SIGINT shutdowns, strict Content-Type and XSS headers, and 50MB payload limits for large tenant Excel files.
- **Optimized Caching**:
  - `dist/index.html` is served with `Cache-Control: no-cache, no-store, must-revalidate` so users always get the newest app release without hard refreshing.
  - Fingerprinted JS/CSS assets are served with immutable long-term caching (`Cache-Control: public, max-age=31536000, immutable`).
- **Health Check**:
  - `/api/health` and `/healthz` return JSON diagnostics (`status: ok`, `uptime`, `timestamp`) for Render's zero-downtime health monitors and deployment rollouts.
- **Port Binding**: Automatically binds to `process.env.PORT` on `0.0.0.0`.

# Deploying Tenant List Updater to Render

This repository is fully configured for deployment on [Render](https://render.com) as a full-stack Web Service using either **Render Blueprints (`render.yaml`)**, **Native Node.js Web Service**, or **Docker Containers**.

---

## Deployment Options

### Method 1: Render Blueprint (Recommended - 1-Click Infrastructure as Code)

Render Blueprints automatically parse `render.yaml` and configure the web service, build commands, and environment variables.

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top navigation and select **Blueprint**.
4. Connect your repository containing `render.yaml`.
5. Render will automatically detect the configuration:
   - **Service Name**: `tenant-list-updater`
   - **Environment**: Node
   - **Region**: Oregon (or your chosen region)
   - **Plan**: Free (or Starter)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/db/status`
6. Enter any required environment variables (e.g., MySQL database credentials, Gemini API key).
7. Click **Apply** to deploy.

---

### Method 2: Manual Web Service on Render

If you prefer manual setup without blueprints:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `tenant-list-updater`
   - **Language**: `Node`
   - **Branch**: `main` (or your active branch)
   - **Build Command**: `npm install && npm run build` (or `./render-build.sh`)
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/db/status`
4. Under **Environment Variables**, add the variables listed below.
5. Click **Create Web Service**.

---

### Method 3: Docker Deployment on Render

This repository includes a multi-stage production `Dockerfile`:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your repository.
3. Under **Runtime**, select **Docker**.
4. Render will detect `/Dockerfile` and build the container automatically.
5. Set the environment variables in the Render dashboard.
6. Click **Create Web Service**.

---

## Required Environment Variables

Configure these in the Render Dashboard (**Environment** tab):

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Production environment flag | `production` |
| `PORT` | Web server listening port (Render sets this automatically) | `10000` |
| `MYSQL_HOST` | Remote MySQL server host | `your-db-host.aivencloud.com` or `127.0.0.1` |
| `MYSQL_PORT` | MySQL server port | `3306` |
| `MYSQL_USER` | MySQL database username | `avnadmin` or `root` |
| `MYSQL_PASSWORD` | MySQL database password | `your_secret_password` |
| `MYSQL_DATABASE` | MySQL database name | `tenant_updater` |
| `MYSQL_SSL` | Enable TLS/SSL connection for cloud databases | `true` (for Aiven/RDS/PlanetScale) or `false` |
| `DATABASE_URL` | Alternative unified connection URI | `mysql://user:pass@host:3306/db?ssl={"rejectUnauthorized":false}` |
| `GEMINI_API_KEY` | Optional: Gemini API Key for AI features | `AIzaSy...` |
| `APP_URL` | Deployed URL of your web service | `https://tenant-list-updater.onrender.com` |

> **Note on MySQL**: Render provides managed PostgreSQL natively. For MySQL, you can connect to any free/managed MySQL provider such as **Aiven for MySQL**, **PlanetScale**, **Clever Cloud**, **AWS RDS**, or **Google Cloud SQL**. If MySQL credentials are not provided, the application runs seamlessly using its resilient client-side tenant database.

---

## Post-Deployment Verification

1. **Health Check**:
   Visit `https://<your-render-url>/api/db/status` to verify server status.
2. **Schema Initialization**:
   Navigate to the **Settings** view in the application and click **"Run Schema Migration"** to automatically provision MySQL tables (`tenants`, `upload_sessions`, `tenant_history`, `audit_logs`).
3. **Download Schema SQL**:
   Click **"Download Schema DDL"** in Settings to manually review or execute `tenant_updater_mysql.sql` against your database.

# Local Development Setup Guide: Web Server & MySQL Database

This guide walks you through setting up and running both the **full-stack Web Server** and a **local MySQL Database** on your computer.

---

## ⚡ Quick Start (Recommended: With Docker)

The fastest way to run MySQL locally without manual database installation:

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository and navigate into the project
cd tenant-list-updater

# Install Node.js packages
npm install
```

### Step 2: Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

The default `.env` is already configured for local Docker MySQL:
```ini
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="password"
MYSQL_DATABASE="tenant_updater"
MYSQL_SSL="false"
```

### Step 3: Start Local MySQL (with 1 command)
Run the provided Docker Compose service:
```bash
npm run db:up
# or: docker compose up -d
```
This automatically:
- Starts **MySQL 8.0** listening on `localhost:3306`.
- Auto-executes `src/lib/database/mysql_init.sql` to create all tables (`tenants`, `upload_sessions`, `tenant_history`, `audit_logs`, `users`).
- Starts **phpMyAdmin** database GUI at [http://localhost:8081](http://localhost:8081) (Login: User `root`, Password `password`).

### Step 4: Start the Web Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Your local web server and MySQL database are fully operational!

To stop the MySQL database later:
```bash
npm run db:down
```

---

## 🖥️ Alternative Setup: Native MySQL (Without Docker)

If you already have MySQL or prefer running it natively on your operating system:

### 1. Install & Start MySQL

#### macOS (via Homebrew)
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu / Debian Linux
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
```

#### Windows
- Install via [MySQL Community Installer](https://dev.mysql.com/downloads/installer/) or [XAMPP / WampServer](https://www.apachefriends.org/).
- Ensure the MySQL service is started.

### 2. Create Database & Apply Schema
Run the provided SQL initialization script to create the database and tables:
```bash
mysql -u root -p < src/lib/database/mysql_init.sql
```
*(If your root account has no password, you can run `mysql -u root < src/lib/database/mysql_init.sql`)*

### 3. Update `.env` with Your Credentials
Edit `.env` to match your local MySQL configuration:
```ini
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="YOUR_LOCAL_MYSQL_PASSWORD"
MYSQL_DATABASE="tenant_updater"
MYSQL_SSL="false"
```

### 4. Start the Web Server
```bash
npm install
npm run dev
```

---

## ⚙️ How the Web Server Works Locally

The application uses an integrated Express + Vite full-stack server (`server.ts`):

- **Development Mode (`npm run dev`)**:
  - Runs `tsx server.ts`.
  - Express mounts Vite's development middleware with Hot Module Replacement (HMR).
  - Mounts REST API routes under `/api/*` for direct MySQL interaction:
    - `GET  /api/db/status` — Live database engine connection status
    - `POST /api/db/test` — Test credentials and ping MySQL
    - `POST /api/db/init` — Automatic table migrations & DDL execution
    - `GET  /api/tenants` — Fetch master tenants from MySQL
    - `POST /api/reconcile/apply` — Commit approved reconciliations directly to MySQL
  - Listens on `http://localhost:3000`.

- **Production Mode (`npm run build && npm start`)**:
  - `npm run build` compiles the React frontend to `/dist`.
  - `npm start` launches `node server.ts`, serving static production assets and running API endpoints.

---

## 🔍 Verifying Your Local Connection in the Web App

1. Open [http://localhost:3000](http://localhost:3000) and sign in.
2. In the left sidebar, navigate to **Settings** (`/settings`).
3. Under the **MySQL Database Engine** card:
   - Click **"Test Connection"** to verify latency and server connection.
   - If the tables are not yet created, click **"Run Schema Migration"** to initialize all tables directly from the browser.
4. When connected, the engine status badge will display **CONNECTED** with server round-trip latency in milliseconds.

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is not running | Run `npm run db:up` (Docker) or verify your local MySQL service is active (`brew services list` or `systemctl status mysql`). |
| `ER_ACCESS_DENIED_ERROR` | Wrong username or password | Check `MYSQL_USER` and `MYSQL_PASSWORD` in `.env`. For Docker, default is `root` / `password`. |
| `ER_BAD_DB_ERROR` | `tenant_updater` database does not exist | Run `npm run db:init` or execute `src/lib/database/mysql_init.sql`. |
| Port `3306` already in use | Another MySQL or MariaDB instance is running | Stop the existing service, or change the external port mapping in `docker-compose.yml` to `"3307:3306"` and set `MYSQL_PORT=3307` in `.env`. |
| Fallback Cache Active | Database not reachable | The app uses an internal browser cache when MySQL is offline so features still function. Reconnecting MySQL restores server persistence. |

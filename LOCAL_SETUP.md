# Local Development Setup Guide

This guide walks you through running the **Tenant List Updater & FHC Form 01 Reconciliation System** on your computer.

The application operates completely client-side in the browser using browser storage, requiring **no external database servers or Docker containers**.

---

## ⚡ Quick Start

### Step 1: Install Dependencies
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

### Step 3: Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application is fully operational!

---

## 📦 Production Build

To build and preview the optimized production application:
```bash
npm run build
npm start
```
The server will run on port 3000 (or the port specified by the `PORT` environment variable).

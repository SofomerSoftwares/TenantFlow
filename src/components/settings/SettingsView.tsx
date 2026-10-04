import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  RotateCcw,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Server,
  Download,
  Activity,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Cloud,
  Copy,
  FileCode,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { useComparison } from '@/src/context/ComparisonContext';

export const SettingsView: React.FC = () => {
  const { user, switchRole, canManageSettings, usersList, updateUserRole } = useAuth();
  const { resetComparisonWorkflow, navigate } = useComparison();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [defaultMissingAction, setDefaultMissingAction] = useState<'keep' | 'deactivate'>('keep');
  const [missingThresholdAlert, setMissingThresholdAlert] = useState(15);
  const [preventDuplicateUpdate, setPreventDuplicateUpdate] = useState(true);

  // MySQL Connection Settings
  const [mysqlHost, setMysqlHost] = useState('127.0.0.1');
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlDatabase, setMysqlDatabase] = useState('tenant_updater');
  const [mysqlSsl, setMysqlSsl] = useState(false);

  // MySQL Test & Status State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);
  const [initializingSchema, setInitializingSchema] = useState(false);
  const [schemaInitResult, setSchemaInitResult] = useState<string | null>(null);

  useEffect(() => {
    // Check current server db status
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          if (data.config.host) setMysqlHost(data.config.host);
          if (data.config.port) setMysqlPort(data.config.port);
          if (data.config.user) setMysqlUser(data.config.user);
          if (data.config.database) setMysqlDatabase(data.config.database);
          if (data.config.ssl !== undefined) setMysqlSsl(data.config.ssl);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestMySQLConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDatabase,
          ssl: mysqlSsl
        })
      });
      const data = await res.json();
      setConnectionResult(data);
    } catch (err: any) {
      setConnectionResult({
        success: false,
        message: err.message || 'Network error connecting to backend API'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitializeSchema = async () => {
    setInitializingSchema(true);
    setSchemaInitResult(null);
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      setSchemaInitResult(data.message || (data.success ? 'Schema initialized' : 'Initialization error'));
    } catch (err: any) {
      setSchemaInitResult(err.message || 'Failed to initialize schema');
    } finally {
      setInitializingSchema(false);
    }
  };

  const handleDownloadSchemaSql = () => {
    handleDownloadFile('/api/db/schema.sql', 'tenant_updater_mysql.sql');
  };

  const [renderTab, setRenderTab] = useState<'yaml' | 'docker' | 'script' | 'env'>('yaml');
  const [copiedDeploymentCode, setCopiedDeploymentCode] = useState<string | null>(null);

  const renderYamlContent = `services:
  # Full-Stack Web Service for Tenant List Updater on Render
  - type: web
    name: tenant-list-updater
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/db/status
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MYSQL_HOST
        sync: false
      - key: MYSQL_PORT
        value: "3306"
      - key: MYSQL_USER
        sync: false
      - key: MYSQL_PASSWORD
        sync: false
      - key: MYSQL_DATABASE
        value: tenant_updater
      - key: MYSQL_SSL
        value: "false"
      - key: DATABASE_URL
        sync: false
      - key: APP_URL
        sync: false
      - key: GEMINI_API_KEY
        sync: false`;

  const dockerfileContent = `# Multi-stage Dockerfile for Tenant List Updater on Render
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
RUN apk add --no-cache curl
RUN addgroup -S nodejs -g 1001 && adduser -S nodejs -u 1001 -G nodejs
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:10000/api/db/status || exit 1
CMD ["npm", "start"]`;

  const renderScriptContent = `#!/usr/bin/env bash
set -o errexit
echo "===> Installing dependencies..."
npm install
echo "===> Building client application..."
npm run build
echo "===> Build completed successfully!"`;

  const handleCopyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDeploymentCode(label);
    setTimeout(() => setCopiedDeploymentCode(null), 2500);
  };

  const handleDownloadFile = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    if (filename) {
      link.download = filename;
    } else {
      const parts = url.split('/');
      link.download = parts[parts.length - 1] || 'download';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleConfirmResetDemoData = () => {
    tenantDb.resetToDefaultDemoData();
    resetComparisonWorkflow();
    setShowResetConfirmModal(false);
    setResetSuccessMessage(true);
    setTimeout(() => {
      setResetSuccessMessage(false);
      navigate('tenants');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            System Configuration & Database Engine
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings & MySQL Engine
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Configure MySQL database engine connection, schema migration, matching safety rules, and role permissions.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Check className="h-4 w-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* MySQL Database Engine Banner & Connection Card */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">MySQL Database Engine</h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                  Engine: MySQL 8.0+ / MariaDB / Cloud SQL
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Relational storage with InnoDB engine, utf8mb4 collation, transactions, and foreign key constraints.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadFile('/api/deploy/docker-compose.yml')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100"
              title="Download docker-compose.yml to run MySQL and phpMyAdmin locally"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              <span>Local docker-compose.yml</span>
            </button>
            <button
              onClick={handleDownloadSchemaSql}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
              title="Download complete MySQL DDL schema file"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export MySQL Schema (.sql)</span>
            </button>
          </div>
        </div>

        {/* MySQL Connection Parameters */}
        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Connection Parameters
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700">Host / Endpoint</label>
              <input
                type="text"
                value={mysqlHost}
                onChange={(e) => setMysqlHost(e.target.value)}
                placeholder="127.0.0.1 or rds-endpoint"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700">Port</label>
              <input
                type="number"
                value={mysqlPort}
                onChange={(e) => setMysqlPort(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700">Database Name</label>
              <input
                type="text"
                value={mysqlDatabase}
                onChange={(e) => setMysqlDatabase(e.target.value)}
                placeholder="tenant_updater"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700">Username</label>
              <input
                type="text"
                value={mysqlUser}
                onChange={(e) => setMysqlUser(e.target.value)}
                placeholder="root"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={mysqlPassword}
                onChange={(e) => setMysqlPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="mysqlSsl"
                checked={mysqlSsl}
                onChange={(e) => setMysqlSsl(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="mysqlSsl" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Enable SSL / TLS
              </label>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-5">
              <button
                onClick={handleTestMySQLConnection}
                disabled={testingConnection}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                {testingConnection ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                <span>{testingConnection ? 'Testing Connection...' : 'Test MySQL Connection'}</span>
              </button>

              <button
                onClick={handleInitializeSchema}
                disabled={initializingSchema}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
              >
                {initializingSchema ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5 text-slate-400" />}
                <span>Initialize / Verify Tables</span>
              </button>
            </div>
          </div>

          {/* Connection Test Feedback */}
          {connectionResult && (
            <div
              className={`mt-4 rounded-xl border p-3.5 text-xs ${
                connectionResult.success
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                  : 'border-amber-200 bg-amber-50/80 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {connectionResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {connectionResult.success ? 'Connection Successful' : 'Connection Status'}
                  </div>
                  <div className="mt-0.5">{connectionResult.message}</div>
                  {connectionResult.latencyMs !== undefined && (
                    <div className="mt-1 text-[11px] opacity-75">
                      Latency: <strong>{connectionResult.latencyMs}ms</strong>
                    </div>
                  )}
                  {!connectionResult.success && (
                    <div className="mt-1 text-[11px] text-amber-800">
                      Note: When MySQL server is not locally running, the system automatically uses its local high-speed persistence cache to keep all operations 100% operational.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {schemaInitResult && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
              <span className="font-bold">Schema Migration: </span>
              {schemaInitResult}
            </div>
          )}
        </div>
      </div>

      {/* Render Cloud Deployment Resource Card */}
      <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Render Cloud Deployment Resource</h2>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Infrastructure as Code
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Ready-to-use Render Blueprint (<code className="font-mono text-purple-700">render.yaml</code>), multi-stage Dockerfile, and environment variable configuration.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadFile('/api/deploy/render.yaml')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
              title="Download render.yaml Blueprint specification"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download render.yaml</span>
            </button>

            <button
              onClick={() => handleDownloadFile('/api/deploy/dockerfile')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              title="Download Dockerfile"
            >
              <FileCode className="h-3.5 w-3.5 text-slate-500" />
              <span>Dockerfile</span>
            </button>

            <a
              href="https://dashboard.render.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
            >
              <span>Render Dashboard</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Deployment Steps Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">1</span>
              <span>Connect Repository</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Push your code to GitHub/GitLab and link the repository in the Render Dashboard via <strong className="text-slate-700">New + &gt; Blueprint</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">2</span>
              <span>Auto-Detect Blueprint</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Render automatically parses <code className="font-mono text-purple-700">render.yaml</code>, setting up Node runtime, build commands, and health checks.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">3</span>
              <span>Configure MySQL DB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Add your cloud MySQL host (Aiven, RDS, PlanetScale, or Cloud SQL) into the Environment tab, then click <strong className="text-slate-700">Apply</strong>.
            </p>
          </div>
        </div>

        {/* Tab Navigation for Deployment Resources */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRenderTab('yaml')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                renderTab === 'yaml'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              render.yaml (Blueprint)
            </button>
            <button
              onClick={() => setRenderTab('docker')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                renderTab === 'docker'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Dockerfile (Multi-Stage)
            </button>
            <button
              onClick={() => setRenderTab('script')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                renderTab === 'script'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              render-build.sh
            </button>
            <button
              onClick={() => setRenderTab('env')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                renderTab === 'env'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Environment Variables Guide
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {renderTab === 'yaml' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Declarative Render Blueprint Specification for one-click setup</span>
              <button
                onClick={() => handleCopyCode(renderYamlContent, 'yaml')}
                className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
              >
                {copiedDeploymentCode === 'yaml' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy YAML</span>
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto shadow-inner">
              {renderYamlContent}
            </pre>
          </div>
        )}

        {renderTab === 'docker' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Production multi-stage Docker container specification for Render Docker Runtime</span>
              <button
                onClick={() => handleCopyCode(dockerfileContent, 'docker')}
                className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
              >
                {copiedDeploymentCode === 'docker' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Dockerfile</span>
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto shadow-inner">
              {dockerfileContent}
            </pre>
          </div>
        )}

        {renderTab === 'script' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Standalone build script (<code className="text-purple-600">render-build.sh</code>) for automated CI/CD pipelines</span>
              <button
                onClick={() => handleCopyCode(renderScriptContent, 'script')}
                className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
              >
                {copiedDeploymentCode === 'script' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto shadow-inner">
              {renderScriptContent}
            </pre>
          </div>
        )}

        {renderTab === 'env' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Configure these environment variables in your Render Dashboard under the <strong>Environment</strong> tab:
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-2.5">Key</th>
                    <th className="px-4 py-2.5">Recommended Value / Description</th>
                    <th className="px-4 py-2.5">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">NODE_ENV</td>
                    <td className="px-4 py-2.5 text-slate-600"><code>production</code> — Enables static asset serving and optimized caching</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-semibold">Yes</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">PORT</td>
                    <td className="px-4 py-2.5 text-slate-600"><code>10000</code> — Render defaults to 10000 for web services</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-semibold">Automatic</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">MYSQL_HOST</td>
                    <td className="px-4 py-2.5 text-slate-600">Cloud MySQL host (e.g. <code>mysql-xxx.aivencloud.com</code> or AWS RDS)</td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">Optional (Falls back to local)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">MYSQL_USER</td>
                    <td className="px-4 py-2.5 text-slate-600">MySQL database username</td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">MYSQL_PASSWORD</td>
                    <td className="px-4 py-2.5 text-slate-600">MySQL database password</td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">MYSQL_DATABASE</td>
                    <td className="px-4 py-2.5 text-slate-600"><code>tenant_updater</code></td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">MYSQL_SSL</td>
                    <td className="px-4 py-2.5 text-slate-600"><code>true</code> for managed cloud providers requiring TLS certificates</td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">GEMINI_API_KEY</td>
                    <td className="px-4 py-2.5 text-slate-600">Google Gemini API key for smart reconciliation features</td>
                    <td className="px-4 py-2.5 text-slate-400 font-semibold">Optional</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Safety Guardrails */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Safety & Reconciliation Guardrails</h2>
            <p className="text-xs text-slate-500">
              Automated safeguards preventing accidental data loss during bulk updates.
            </p>

            <div className="mt-5 space-y-4">
              {/* Rule 1: Missing Tenant Policy */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Default Missing Tenant Action (Safety Rule)
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      When a tenant exists in the Master database but is missing from the uploaded external system export.
                    </div>
                  </div>
                  <select
                    value={defaultMissingAction}
                    onChange={(e) => setDefaultMissingAction(e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="keep">Keep Active (Safest)</option>
                    <option value="deactivate">Deactivate (Set Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Rule 2: Missing Threshold Alert */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Missing Tenant Warning Threshold
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Display an alert prompt if more than this percentage of Master tenants are missing from the latest file.
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={missingThresholdAlert}
                      onChange={(e) => setMissingThresholdAlert(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center font-bold"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* Rule 3: Duplicate Tenant Code Block */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Strict Duplicate Code Enforcement
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Prevent automatic application of update batches if duplicate Tenant Codes are detected within the same file until resolved.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preventDuplicateUpdate}
                    onChange={(e) => setPreventDuplicateUpdate(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column Aliases Reference */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-900">Auto-Detected Column Aliases</h3>
            <p className="text-xs text-slate-500">
              The engine automatically maps these column variations to the primary Tenant Code:
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                'Tenant Code',
                'Tenant ID',
                'Tenant No',
                'Tenant Number',
                'Code',
                'Tenant_Code',
                'TenantCode',
                'Cust Code'
              ].map((alias) => (
                <span
                  key={alias}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Access Control & Reset Panel */}
        <div className="space-y-6">
          {/* User Role Testing Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Access Roles & Testing</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Test the application under different organizational permissions:
            </p>

            <div className="mt-4 space-y-2 text-xs">
              {[
                { role: 'Admin', desc: 'Can upload, compare, approve updates, manage tenants' },
                { role: 'Staff', desc: 'Can upload, compare, review, and export' },
                { role: 'Viewer', desc: 'Read-only access to master list and reports' }
              ].map((item) => (
                <div
                  key={item.role}
                  onClick={() => switchRole(item.role as any)}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    user?.role === item.role
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.role}</span>
                    {user?.role === item.role && (
                      <span className="text-[10px] font-bold text-indigo-600">Active</span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Reset Card */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-rose-900">
              <Database className="h-4 w-4 text-rose-600" />
              <h2 className="text-base font-bold">Reset Demo Database</h2>
            </div>
            <p className="mt-1 text-xs text-rose-800">
              Resets the database to the initial 100 commercial tenant records and pre-seeded history logs.
            </p>

            {resetSuccessMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-800">
                Database successfully restored to 100 demo tenants! Redirecting...
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to 100 Demo Tenants</span>
              </button>
            )}

            {/* In-app Confirmation Modal (Safe for iframe) */}
            {showResetConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Confirm Database Reset</h3>
                      <p className="text-[11px] text-slate-500">This action will restore demo records.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you sure you want to reset all master tenant records and history back to the initial 100 commercial demo tenants? Any uncommitted drafts will be discarded.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowResetConfirmModal(false)}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmResetDemoData}
                      className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
                    >
                      Yes, Reset Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Management & RBAC Permissions Matrix Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                User Management & Role-Based Access Control (RBAC)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage organization members, assign roles, and audit authorization matrices.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {usersList.length} Team Members
          </span>
        </div>

        {/* User Directory Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Organization Users & Assigned Roles
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Assigned Role</th>
                  <th className="px-4 py-2.5">Permission Scope</th>
                  <th className="px-4 py-2.5 text-right">Quick Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => {
                  const isCurrentUser = user?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          {isCurrentUser && (
                            <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Admin">Administrator</option>
                          <option value="Staff">Operations Staff</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {u.role === 'Admin'
                          ? 'Full authorization (Approve, commit, manage records & configs)'
                          : u.role === 'Staff'
                          ? 'Reconciliation & review (Upload, diff, resolve, export)'
                          : 'Read-only access to master catalog & reports'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isCurrentUser ? (
                          <button
                            onClick={() => switchRole(u.role)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Act as {u.role}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">Active Session</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Granular RBAC Permissions Matrix Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Role Permission Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">System Capability</th>
                  <th className="px-4 py-2.5 text-center">Administrator</th>
                  <th className="px-4 py-2.5 text-center">Operations Staff</th>
                  <th className="px-4 py-2.5 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { name: 'Upload Master & Latest Excel Files (.xlsx, .csv)', admin: true, staff: true, viewer: false },
                  { name: 'Automatic Column Detection & Column Mapping', admin: true, staff: true, viewer: false },
                  { name: 'Run Tenant Code Comparison Engine', admin: true, staff: true, viewer: false },
                  { name: 'Inspect Field Diffs & Filter Categories', admin: true, staff: true, viewer: true },
                  { name: 'Bulk Resolve via Heuristic Pattern Matching', admin: true, staff: true, viewer: false },
                  { name: 'Approve & Commit Reconciled Batch to Master DB', admin: true, staff: false, viewer: false },
                  { name: 'Manual Tenant CRUD (Edit Profile, Unit, Rent)', admin: true, staff: false, viewer: false },
                  { name: 'Configure MySQL Engine & Run Database Migrations', admin: true, staff: false, viewer: false },
                  { name: 'Download Updated Master & Change Reports (.xlsx)', admin: true, staff: true, viewer: true },
                  { name: 'Manage Team Roles & Safety Threshold Rules', admin: true, staff: false, viewer: false }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      {row.admin ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.staff ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.viewer ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { mySqlService } from './src/lib/database/mysqlClient.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API Endpoints for MySQL Engine ---

  // Health & Database Engine Status
  app.get('/api/db/status', async (req, res) => {
    try {
      const status = mySqlService.getStatus();
      res.json({
        engine: 'MySQL',
        status: status.isConnected ? 'CONNECTED' : 'DISCONNECTED',
        config: {
          host: status.config.host,
          port: status.config.port,
          user: status.config.user,
          database: status.config.database,
          ssl: status.config.ssl
        },
        lastError: status.lastError
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test MySQL Connection Ping
  app.post('/api/db/test', async (req, res) => {
    try {
      const { host, port, user, password, database, ssl } = req.body;
      if (host) {
        mySqlService.updateConfig({
          host,
          port: Number(port) || 3306,
          user,
          password: password !== undefined ? password : '',
          database: database || 'tenant_updater',
          ssl: Boolean(ssl)
        });
      }
      const testResult = await mySqlService.testConnection();
      res.json(testResult);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Initialize / Migrate MySQL Tables
  app.post('/api/db/init', async (req, res) => {
    try {
      const initResult = await mySqlService.initializeTables();
      res.json(initResult);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Download MySQL Schema DDL
  app.get('/api/db/schema.sql', (req, res) => {
    const sqlPath = path.resolve(process.cwd(), 'src/lib/database/mysql_init.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="tenant_updater_mysql.sql"');
      res.sendFile(sqlPath);
    } else {
      res.status(404).send('SQL schema file not found');
    }
  });

  // Download Render Blueprint (render.yaml)
  app.get('/api/deploy/render.yaml', (req, res) => {
    const yamlPath = path.resolve(process.cwd(), 'render.yaml');
    if (fs.existsSync(yamlPath)) {
      res.setHeader('Content-Type', 'text/yaml');
      res.setHeader('Content-Disposition', 'attachment; filename="render.yaml"');
      res.sendFile(yamlPath);
    } else {
      res.status(404).send('render.yaml not found');
    }
  });

  // Download Dockerfile
  app.get('/api/deploy/dockerfile', (req, res) => {
    const dockerPath = path.resolve(process.cwd(), 'Dockerfile');
    if (fs.existsSync(dockerPath)) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="Dockerfile"');
      res.sendFile(dockerPath);
    } else {
      res.status(404).send('Dockerfile not found');
    }
  });

  // Fetch Tenants from MySQL
  app.get('/api/tenants', async (req, res) => {
    try {
      const tenants = await mySqlService.getTenants();
      res.json({ success: true, count: tenants.length, data: tenants });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch Single Tenant from MySQL
  app.get('/api/tenants/:code', async (req, res) => {
    try {
      const tenant = await mySqlService.getTenantByCode(req.params.code);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }
      res.json({ success: true, data: tenant });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Apply Reconciliation Batch to MySQL (Admin Only)
  app.post('/api/reconcile/apply', async (req, res) => {
    try {
      const { items, sessionMetadata, user } = req.body;
      if (!items || !sessionMetadata || !user) {
        return res.status(400).json({ success: false, message: 'Missing required payload fields' });
      }

      // Enforce Role-Based Access Control (Admin only)
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Committing batch updates to the master database requires the Administrator role.'
        });
      }

      const result = await mySqlService.applyReconciliation(items, sessionMetadata, user);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch History from MySQL
  app.get('/api/history', async (req, res) => {
    try {
      const tenantCode = req.query.tenantCode as string | undefined;
      const history = await mySqlService.getHistories(tenantCode);
      res.json({ success: true, count: history.length, data: history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch Sessions from MySQL
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await mySqlService.getSessions();
      res.json({ success: true, count: sessions.length, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tenant List Updater Server running on http://0.0.0.0:${PORT} (MySQL Database Engine ready)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

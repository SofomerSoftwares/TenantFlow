import mysql from 'mysql2/promise';
import type {
  TenantRecord,
  TenantComparisonItem,
  TenantHistoryItem,
  UploadSession,
  AuditLog,
  User,
  ComparisonSummary
} from '../../types/tenant.ts';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl?: boolean;
}

export class MySQLService {
  private static instance: MySQLService;
  private pool: mysql.Pool | null = null;
  private config: MySQLConfig;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  public static getInstance(): MySQLService {
    if (!MySQLService.instance) {
      MySQLService.instance = new MySQLService();
    }
    return MySQLService.instance;
  }

  constructor() {
    this.config = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'tenant_updater',
      ssl: process.env.MYSQL_SSL === 'true'
    };
  }

  public getConfig(): MySQLConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MySQLConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.pool) {
      this.pool.end().catch(() => {});
      this.pool = null;
    }
    this.isConnected = false;
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password || '',
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined
      });
    }
    return this.pool;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const pool = this.getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as db');
      connection.release();
      const latencyMs = Date.now() - start;
      this.isConnected = true;
      this.lastError = null;
      const info = (rows as any)?.[0] || {};
      return {
        success: true,
        message: `Successfully connected to MySQL ${info.version || ''} on ${this.config.host}:${this.config.port} (database: ${info.db || this.config.database})`,
        latencyMs
      };
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err.message || 'Failed to connect to MySQL';
      return {
        success: false,
        message: err.message || 'Connection failed'
      };
    }
  }

  public getStatus(): { isConnected: boolean; lastError: string | null; config: MySQLConfig } {
    return {
      isConnected: this.isConnected,
      lastError: this.lastError,
      config: this.getConfig()
    };
  }

  // --- Initialize MySQL Schema & Tables ---
  public async initializeTables(): Promise<{ success: boolean; message: string }> {
    try {
      const pool = this.getPool();

      // Users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          email VARCHAR(191) UNIQUE NOT NULL,
          password VARCHAR(255) NULL,
          role ENUM('ADMIN', 'STAFF', 'VIEWER') DEFAULT 'STAFF',
          avatar VARCHAR(10) NULL,
          created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Tenants table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(36) PRIMARY KEY,
          tenant_code VARCHAR(64) UNIQUE NOT NULL,
          tenant_name VARCHAR(255) NOT NULL,
          unit VARCHAR(64) NOT NULL,
          branch VARCHAR(128) NULL,
          floor VARCHAR(64) NULL,
          phone VARCHAR(64) NULL,
          email VARCHAR(191) NULL,
          status ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'TERMINATED') DEFAULT 'ACTIVE',
          rent DECIMAL(12,2) NULL,
          contract_start DATE NULL,
          contract_end DATE NULL,
          category VARCHAR(128) NULL,
          raw_fields JSON NULL,
          created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_tenants_tenant_code (tenant_code),
          INDEX idx_tenants_status (status),
          INDEX idx_tenants_branch (branch),
          INDEX idx_tenants_updated_at (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Upload Sessions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS upload_sessions (
          id VARCHAR(36) PRIMARY KEY,
          master_file_name VARCHAR(255) NOT NULL,
          new_file_name VARCHAR(255) NOT NULL,
          summary JSON NOT NULL,
          applied_at DATETIME(3) NULL,
          applied_by VARCHAR(128) NULL,
          status ENUM('DRAFT', 'APPLIED', 'DISCARDED') DEFAULT 'DRAFT',
          created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          INDEX idx_sessions_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Tenant Histories table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_histories (
          id VARCHAR(36) PRIMARY KEY,
          tenant_code VARCHAR(64) NOT NULL,
          tenant_name VARCHAR(255) NOT NULL,
          field VARCHAR(128) NOT NULL,
          old_value TEXT NULL,
          new_value TEXT NULL,
          change_type ENUM('NEW', 'UPDATED', 'UNCHANGED', 'MISSING', 'DUPLICATE', 'ERROR', 'DEACTIVATED', 'REMOVED') DEFAULT 'UPDATED',
          updated_by VARCHAR(128) NOT NULL,
          updated_date DATE NOT NULL,
          session_id VARCHAR(64) NULL,
          created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          INDEX idx_hist_code (tenant_code),
          INDEX idx_hist_session (session_id),
          INDEX idx_hist_date (updated_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Audit logs table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(36) PRIMARY KEY,
          action VARCHAR(128) NOT NULL,
          details TEXT NOT NULL,
          user_name VARCHAR(128) NOT NULL,
          user_role VARCHAR(32) NOT NULL,
          timestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          INDEX idx_audit_time (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      return { success: true, message: 'MySQL tables verified and ready' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to initialize MySQL tables' };
    }
  }

  // --- CRUD for Tenants ---
  public async getTenants(): Promise<TenantRecord[]> {
    const pool = this.getPool();
    const [rows] = await pool.query('SELECT * FROM tenants ORDER BY tenant_code ASC');
    return (rows as any[]).map((r) => this.mapRowToTenant(r));
  }

  public async getTenantByCode(code: string): Promise<TenantRecord | null> {
    const pool = this.getPool();
    const [rows] = await pool.query('SELECT * FROM tenants WHERE LOWER(tenant_code) = LOWER(?) LIMIT 1', [code.trim()]);
    const arr = rows as any[];
    if (arr.length === 0) return null;
    return this.mapRowToTenant(arr[0]);
  }

  public async saveTenantsBatch(tenants: TenantRecord[]): Promise<number> {
    const pool = this.getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const t of tenants) {
        const id = `tnt-${t.tenantCode.toLowerCase()}`;
        const rawJson = t.rawFields ? JSON.stringify(t.rawFields) : null;
        const rentVal = t.rent ? Number(t.rent) : null;
        const statusVal = (t.status || 'Active').toUpperCase();

        await connection.query(`
          INSERT INTO tenants (
            id, tenant_code, tenant_name, unit, branch, floor, phone, email, status, rent, contract_start, contract_end, category, raw_fields, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            tenant_name = VALUES(tenant_name),
            unit = VALUES(unit),
            branch = VALUES(branch),
            floor = VALUES(floor),
            phone = VALUES(phone),
            email = VALUES(email),
            status = VALUES(status),
            rent = VALUES(rent),
            contract_start = VALUES(contract_start),
            contract_end = VALUES(contract_end),
            category = VALUES(category),
            raw_fields = VALUES(raw_fields),
            updated_at = NOW()
        `, [
          id,
          t.tenantCode,
          t.tenantName,
          t.unit,
          t.branch || null,
          t.floor || null,
          t.phone || null,
          t.email || null,
          ['ACTIVE', 'INACTIVE', 'PENDING', 'TERMINATED'].includes(statusVal) ? statusVal : 'ACTIVE',
          rentVal,
          t.contractStart || null,
          t.contractEnd || null,
          t.category || null,
          rawJson
        ]);
      }
      await connection.commit();
      return tenants.length;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // --- Apply Reconciliation Session to MySQL ---
  public async applyReconciliation(
    items: TenantComparisonItem[],
    sessionMetadata: { masterFileName: string; newFileName: string; summary: ComparisonSummary },
    user: User
  ): Promise<{ sessionId: string; appliedCount: number }> {
    const pool = this.getPool();
    const connection = await pool.getConnection();
    const sessionId = `sess-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      await connection.beginTransaction();

      // Record session
      await connection.query(`
        INSERT INTO upload_sessions (id, master_file_name, new_file_name, summary, applied_at, applied_by, status)
        VALUES (?, ?, ?, ?, NOW(), ?, 'APPLIED')
      `, [
        sessionId,
        sessionMetadata.masterFileName,
        sessionMetadata.newFileName,
        JSON.stringify(sessionMetadata.summary),
        user.name
      ]);

      let appliedCount = 0;

      for (const item of items) {
        if (item.reviewStatus === 'rejected') continue;

        if (item.changeType === 'NEW' && item.newRecord) {
          const t = item.newRecord;
          const rentVal = t.rent ? Number(t.rent) : null;
          await connection.query(`
            INSERT INTO tenants (id, tenant_code, tenant_name, unit, branch, floor, phone, email, status, rent, contract_start, contract_end, category, raw_fields, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              tenant_name = VALUES(tenant_name),
              unit = VALUES(unit),
              status = VALUES(status),
              updated_at = NOW()
          `, [
            `tnt-${t.tenantCode.toLowerCase()}`,
            t.tenantCode,
            t.tenantName,
            t.unit,
            t.branch || null,
            t.floor || null,
            t.phone || null,
            t.email || null,
            'ACTIVE',
            rentVal,
            t.contractStart || null,
            t.contractEnd || null,
            t.category || null,
            JSON.stringify(t.rawFields || {})
          ]);

          // Insert history
          await connection.query(`
            INSERT INTO tenant_histories (id, tenant_code, tenant_name, field, old_value, new_value, change_type, updated_by, updated_date, session_id)
            VALUES (?, ?, ?, 'ALL', '(None)', 'New Tenant Created', 'NEW', ?, ?, ?)
          `, [`hist-${Date.now()}-${item.tenantCode}`, item.tenantCode, item.tenantName, user.name, dateStr, sessionId]);
          appliedCount++;
        } else if (item.changeType === 'UPDATED' && item.newRecord) {
          const t = item.newRecord;
          const rentVal = t.rent ? Number(t.rent) : null;
          await connection.query(`
            UPDATE tenants SET
              tenant_name = ?,
              unit = ?,
              branch = COALESCE(?, branch),
              floor = COALESCE(?, floor),
              phone = COALESCE(?, phone),
              email = COALESCE(?, email),
              status = ?,
              rent = COALESCE(?, rent),
              contract_start = COALESCE(?, contract_start),
              contract_end = COALESCE(?, contract_end),
              category = COALESCE(?, category),
              raw_fields = COALESCE(?, raw_fields),
              updated_at = NOW()
            WHERE LOWER(tenant_code) = LOWER(?)
          `, [
            t.tenantName,
            t.unit,
            t.branch || null,
            t.floor || null,
            t.phone || null,
            t.email || null,
            (t.status || 'Active').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            rentVal,
            t.contractStart || null,
            t.contractEnd || null,
            t.category || null,
            JSON.stringify(t.rawFields || {}),
            item.tenantCode
          ]);

          for (const diff of item.diffs) {
            await connection.query(`
              INSERT INTO tenant_histories (id, tenant_code, tenant_name, field, old_value, new_value, change_type, updated_by, updated_date, session_id)
              VALUES (?, ?, ?, ?, ?, ?, 'UPDATED', ?, ?, ?)
            `, [
              `hist-${Date.now()}-${item.tenantCode}-${diff.field}`,
              item.tenantCode,
              item.tenantName,
              diff.label,
              String(diff.oldValue ?? ''),
              String(diff.newValue ?? ''),
              user.name,
              dateStr,
              sessionId
            ]);
          }
          appliedCount++;
        } else if (item.changeType === 'MISSING') {
          const action = item.missingAction || 'keep';
          if (action === 'deactivate') {
            await connection.query(`
              UPDATE tenants SET status = 'INACTIVE', updated_at = NOW()
              WHERE LOWER(tenant_code) = LOWER(?)
            `, [item.tenantCode]);

            await connection.query(`
              INSERT INTO tenant_histories (id, tenant_code, tenant_name, field, old_value, new_value, change_type, updated_by, updated_date, session_id)
              VALUES (?, ?, ?, 'Status', 'ACTIVE', 'INACTIVE', 'DEACTIVATED', ?, ?, ?)
            `, [`hist-${Date.now()}-${item.tenantCode}-status`, item.tenantCode, item.tenantName, user.name, dateStr, sessionId]);
            appliedCount++;
          } else if (action === 'remove') {
            await connection.query(`
              DELETE FROM tenants WHERE LOWER(tenant_code) = LOWER(?)
            `, [item.tenantCode]);

            await connection.query(`
              INSERT INTO tenant_histories (id, tenant_code, tenant_name, field, old_value, new_value, change_type, updated_by, updated_date, session_id)
              VALUES (?, ?, ?, 'Record', 'Active Record', 'Removed', 'REMOVED', ?, ?, ?)
            `, [`hist-${Date.now()}-${item.tenantCode}-del`, item.tenantCode, item.tenantName, user.name, dateStr, sessionId]);
            appliedCount++;
          }
        }
      }

      // Record audit log
      await connection.query(`
        INSERT INTO audit_logs (id, action, details, user_name, user_role, timestamp)
        VALUES (?, 'Reconciliation Batch Applied (MySQL)', ?, ?, ?, NOW())
      `, [
        `audit-${Date.now()}`,
        `Applied ${appliedCount} updates from ${sessionMetadata.newFileName} into MySQL database`,
        user.name,
        user.role
      ]);

      await connection.commit();
      return { sessionId, appliedCount };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // --- Fetch Histories ---
  public async getHistories(tenantCode?: string): Promise<TenantHistoryItem[]> {
    const pool = this.getPool();
    let query = 'SELECT * FROM tenant_histories';
    const params: any[] = [];
    if (tenantCode) {
      query += ' WHERE LOWER(tenant_code) = LOWER(?)';
      params.push(tenantCode.trim());
    }
    query += ' ORDER BY created_at DESC LIMIT 500';
    const [rows] = await pool.query(query, params);
    return (rows as any[]).map((r) => ({
      id: r.id,
      tenantCode: r.tenant_code,
      tenantName: r.tenant_name,
      field: r.field,
      oldValue: r.old_value || '',
      newValue: r.new_value || '',
      changeType: r.change_type,
      updatedBy: r.updated_by,
      updatedDate: r.updated_date ? new Date(r.updated_date).toISOString().split('T')[0] : '',
      sessionId: r.session_id || ''
    }));
  }

  // --- Fetch Sessions ---
  public async getSessions(): Promise<UploadSession[]> {
    const pool = this.getPool();
    const [rows] = await pool.query('SELECT * FROM upload_sessions ORDER BY created_at DESC LIMIT 50');
    return (rows as any[]).map((r) => ({
      id: r.id,
      masterFileName: r.master_file_name,
      newFileName: r.new_file_name,
      summary: typeof r.summary === 'string' ? JSON.parse(r.summary) : r.summary,
      appliedAt: r.applied_at ? new Date(r.applied_at).toISOString() : undefined,
      appliedBy: r.applied_by,
      status: (r.status || 'applied').toLowerCase() as any,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  }

  private mapRowToTenant(row: any): TenantRecord {
    let rawFieldsObj = {};
    if (row.raw_fields) {
      try {
        rawFieldsObj = typeof row.raw_fields === 'string' ? JSON.parse(row.raw_fields) : row.raw_fields;
      } catch {}
    }
    return {
      tenantCode: row.tenant_code,
      tenantName: row.tenant_name,
      unit: row.unit,
      branch: row.branch || undefined,
      floor: row.floor || undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      status: row.status === 'ACTIVE' ? 'Active' : row.status === 'INACTIVE' ? 'Inactive' : row.status || 'Active',
      rent: row.rent ? Number(row.rent) : undefined,
      contractStart: row.contract_start ? new Date(row.contract_start).toISOString().split('T')[0] : undefined,
      contractEnd: row.contract_end ? new Date(row.contract_end).toISOString().split('T')[0] : undefined,
      category: row.category || undefined,
      rawFields: rawFieldsObj,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
    };
  }

  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
      } catch (err) {
        console.error('Error closing MySQL pool:', err);
      }
    }
  }
}

export const mySqlService = MySQLService.getInstance();

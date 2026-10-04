import {
  TenantRecord,
  TenantComparisonItem,
  TenantHistoryItem,
  UploadSession,
  AuditLog,
  ComparisonSummary,
  User
} from '@/src/types/tenant';
import { generate100MasterTenants } from '../excel/demoDataGenerator';

const STORAGE_KEYS = {
  TENANTS: 'tlu_tenants_v1',
  HISTORY: 'tlu_history_v1',
  SESSIONS: 'tlu_sessions_v1',
  AUDIT_LOGS: 'tlu_audit_logs_v1',
  SETTINGS: 'tlu_settings_v1',
  LAST_UPDATE: 'tlu_last_update_v1'
};

export class TenantDatabase {
  private static instance: TenantDatabase;

  public static getInstance(): TenantDatabase {
    if (!TenantDatabase.instance) {
      TenantDatabase.instance = new TenantDatabase();
    }
    return TenantDatabase.instance;
  }

  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
    if (typeof window === 'undefined') return;

    const existing = localStorage.getItem(STORAGE_KEYS.TENANTS);
    if (!existing) {
      this.resetToDefaultDemoData();
    }
  }

  public resetToDefaultDemoData() {
    const defaultTenants = generate100MasterTenants();
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(defaultTenants));

    // Seed realistic initial audit log and history
    const initialSession: UploadSession = {
      id: 'sess-demo-initial',
      createdAt: '2026-09-15T09:30:00Z',
      masterFileName: 'tenant_master_v1.xlsx',
      newFileName: 'system_sync_sep2026.xlsx',
      appliedAt: '2026-09-15T10:00:00Z',
      appliedBy: 'Admin User',
      status: 'applied',
      summary: {
        totalMaster: 95,
        totalNew: 100,
        newCount: 5,
        updatedCount: 12,
        unchangedCount: 83,
        missingCount: 0,
        duplicateCount: 0,
        errorCount: 0
      }
    };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([initialSession]));

    const sampleHistory: TenantHistoryItem[] = [
      {
        id: 'hist-1',
        tenantCode: 'T001',
        tenantName: 'Apex Global Logistics',
        field: 'Unit',
        oldValue: 'A-100',
        newValue: 'A-101',
        changeType: 'UPDATED',
        updatedBy: 'Admin User',
        updatedDate: '2026-09-15',
        sessionId: 'sess-demo-initial'
      },
      {
        id: 'hist-2',
        tenantCode: 'T003',
        tenantName: 'Crestview Capital',
        field: 'Rent',
        oldValue: '2860',
        newValue: '3100',
        changeType: 'UPDATED',
        updatedBy: 'Admin User',
        updatedDate: '2026-09-15',
        sessionId: 'sess-demo-initial'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleHistory));

    const initialAudit: AuditLog[] = [
      {
        id: 'audit-1',
        action: 'System Seeded',
        details: 'Initial master database provisioned with 100 commercial tenant records.',
        userName: 'System Administrator',
        userRole: 'Admin',
        timestamp: '2026-09-15T09:00:00Z'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAudit));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, '2026-09-15T10:00:00Z');
  }

  // --- Tenants CRUD ---
  public getTenants(): TenantRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getTenant(code: string): TenantRecord | undefined {
    const list = this.getTenants();
    const cleanCode = code.trim().toLowerCase();
    return list.find((t) => t.tenantCode.trim().toLowerCase() === cleanCode);
  }

  public saveTenants(tenants: TenantRecord[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
  }

  public updateSingleTenant(code: string, updates: Partial<TenantRecord>, user: User): TenantRecord {
    const list = this.getTenants();
    const idx = list.findIndex(t => t.tenantCode.toLowerCase() === code.toLowerCase());
    if (idx === -1) {
      throw new Error(`Tenant with code ${code} not found.`);
    }

    const current = list[idx];
    const updated: TenantRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    this.saveTenants(list);

    this.addAuditLog(
      'Manual Tenant Update',
      `Updated fields for tenant ${code} (${updated.tenantName})`,
      user
    );

    return updated;
  }

  // --- Comparison Application Engine ---
  public applyComparisonUpdate(
    items: TenantComparisonItem[],
    sessionMetadata: {
      masterFileName: string;
      newFileName: string;
      summary: ComparisonSummary;
    },
    user: User
  ): {
    sessionId: string;
    updatedCount: number;
    newCount: number;
    missingCount: number;
    totalActive: number;
  } {
    const currentTenants = this.getTenants();
    const tenantMap = new Map<string, TenantRecord>(
      currentTenants.map((t) => [t.tenantCode.trim().toLowerCase(), { ...t }])
    );

    const sessionId = `sess-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const historyEntries: TenantHistoryItem[] = [];

    let appliedNew = 0;
    let appliedUpdated = 0;
    let appliedMissing = 0;

    for (const item of items) {
      if (item.reviewStatus === 'rejected') {
        continue;
      }

      const codeLower = item.tenantCode.trim().toLowerCase();

      if (item.changeType === 'NEW' && item.newRecord) {
        tenantMap.set(codeLower, {
          ...item.newRecord,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        appliedNew++;

        historyEntries.push({
          id: `hist-${Date.now()}-${codeLower}`,
          tenantCode: item.tenantCode,
          tenantName: item.tenantName,
          field: 'ALL',
          oldValue: '(None)',
          newValue: 'New Record Created',
          changeType: 'NEW',
          updatedBy: user.name,
          updatedDate: dateStr,
          sessionId
        });
      } else if (item.changeType === 'UPDATED' && item.newRecord) {
        const existing = tenantMap.get(codeLower);
        if (existing) {
          // Log each changed field in History
          item.diffs.forEach((diff) => {
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-${diff.field}`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: diff.label,
              oldValue: String(diff.oldValue ?? ''),
              newValue: String(diff.newValue ?? ''),
              changeType: 'UPDATED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
          });

          // Apply updates
          tenantMap.set(codeLower, {
            ...existing,
            ...item.newRecord,
            rawFields: {
              ...(existing.rawFields || {}),
              ...(item.newRecord.rawFields || {})
            },
            updatedAt: new Date().toISOString()
          });
          appliedUpdated++;
        }
      } else if (item.changeType === 'MISSING' && item.masterRecord) {
        const existing = tenantMap.get(codeLower);
        if (existing) {
          const action = item.missingAction || 'keep';
          if (action === 'deactivate') {
            tenantMap.set(codeLower, {
              ...existing,
              status: 'Inactive',
              updatedAt: new Date().toISOString()
            });
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-status`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: 'Status',
              oldValue: existing.status,
              newValue: 'Inactive (Missing File Action)',
              changeType: 'DEACTIVATED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
            appliedMissing++;
          } else if (action === 'remove') {
            tenantMap.delete(codeLower);
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-remove`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: 'Record',
              oldValue: 'Active Record',
              newValue: 'Removed by Admin Decision',
              changeType: 'REMOVED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
            appliedMissing++;
          }
          // if 'keep', do nothing to preserve data safely!
        }
      }
    }

    const updatedList = Array.from(tenantMap.values());
    this.saveTenants(updatedList);

    // Save history entries
    const existingHistory = this.getHistory();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([...historyEntries, ...existingHistory]));

    // Record session
    const newSession: UploadSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      masterFileName: sessionMetadata.masterFileName,
      newFileName: sessionMetadata.newFileName,
      summary: sessionMetadata.summary,
      appliedAt: new Date().toISOString(),
      appliedBy: user.name,
      status: 'applied'
    };
    const existingSessions = this.getSessions();
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([newSession, ...existingSessions]));

    // Record audit log
    this.addAuditLog(
      'Tenant Batch Update Applied',
      `Applied reconciliation session: ${appliedNew} new, ${appliedUpdated} updated, ${appliedMissing} missing processed from ${sessionMetadata.newFileName}`,
      user
    );

    const totalActive = updatedList.filter(t => t.status.toLowerCase() === 'active').length;

    return {
      sessionId,
      updatedCount: appliedUpdated,
      newCount: appliedNew,
      missingCount: appliedMissing,
      totalActive
    };
  }

  // --- History & Audit ---
  public getHistory(tenantCode?: string): TenantHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const list: TenantHistoryItem[] = data ? JSON.parse(data) : [];
      if (tenantCode) {
        return list.filter(h => h.tenantCode.toLowerCase() === tenantCode.toLowerCase());
      }
      return list;
    } catch {
      return [];
    }
  }

  public getSessions(): UploadSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getSessionById(sessionId: string): UploadSession | undefined {
    return this.getSessions().find(s => s.id === sessionId);
  }

  public getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(action: string, details: string, user: User) {
    if (typeof window === 'undefined') return;
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      details,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString()
    };
    const logs = this.getAuditLogs();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([log, ...logs.slice(0, 99)]));
  }

  public getLastUpdateDate(): string {
    if (typeof window === 'undefined') return 'October 2, 2026';
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || new Date().toISOString();
  }
}

export const tenantDb = TenantDatabase.getInstance();

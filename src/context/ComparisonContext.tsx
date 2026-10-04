import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ParsedExcelFile,
  TenantComparisonItem,
  ComparisonSummary,
  TenantRecord,
  MissingTenantAction,
  User
} from '@/src/types/tenant';
import { convertRowsToTenantRecords } from '@/src/lib/excel/excelParser';
import { compareTenantLists } from '@/src/lib/comparison/comparisonEngine';
import { tenantDb } from '@/src/lib/database/tenantStore';
import {
  generate100MasterTenants,
  generateNewSystemTenants
} from '@/src/lib/excel/demoDataGenerator';

export type PageRoute =
  | 'dashboard'
  | 'tenant-lists'
  | 'upload'
  | 'compare'
  | 'review'
  | 'tenants'
  | 'tenant-detail'
  | 'reports'
  | 'history'
  | 'settings'
  | 'login';

interface ComparisonContextType {
  selectedTenantCode: string | null;
  navigate: (page: string, tenantCode?: string) => void;

  masterFile: ParsedExcelFile | null;
  newFile: ParsedExcelFile | null;
  isComparing: boolean;
  comparisonItems: TenantComparisonItem[];
  summary: ComparisonSummary | null;
  appliedSuccessSessionId: string | null;

  setMasterParsedFile: (file: ParsedExcelFile | null) => void;
  setNewParsedFile: (file: ParsedExcelFile | null) => void;
  useLiveMasterFromDatabase: () => void;
  updateMasterMapping: (key: string, col: string) => void;
  updateNewMapping: (key: string, col: string) => void;

  executeComparison: () => boolean;
  loadDemoComparison: () => void;
  setItemStatus: (id: string, status: 'approved' | 'rejected') => void;
  setBulkStatus: (ids: string[], status: 'approved' | 'rejected') => void;
  setMissingAction: (id: string, action: MissingTenantAction) => void;
  setBulkMissingAction: (action: MissingTenantAction) => void;
  applyHeuristicResolutions: (
    resolutions: {
      ruleId: string;
      ruleName: string;
      itemIds: string[];
      action: 'approve' | 'reject' | 'deactivate' | 'keep';
    }[]
  ) => number;
  applyApprovedChanges: (user: User) => boolean;
  resetComparisonWorkflow: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const routerNavigate = useNavigate();
  const [selectedTenantCode, setSelectedTenantCode] = useState<string | null>(null);

  const [masterFile, setMasterFile] = useState<ParsedExcelFile | null>(null);
  const [newFile, setNewFile] = useState<ParsedExcelFile | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<TenantComparisonItem[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [appliedSuccessSessionId, setAppliedSuccessSessionId] = useState<string | null>(null);

  // Unified React Router navigation bridge
  const navigate = (page: string, tenantCode?: string) => {
    if (tenantCode) {
      setSelectedTenantCode(tenantCode);
      routerNavigate(`/tenants/${tenantCode}`);
    } else if (page === 'tenant-detail') {
      routerNavigate('/tenants');
    } else {
      const cleanPath = page.startsWith('/') ? page : `/${page}`;
      routerNavigate(cleanPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setMasterParsedFile = (file: ParsedExcelFile | null) => {
    setMasterFile(file);
  };

  const setNewParsedFile = (file: ParsedExcelFile | null) => {
    setNewFile(file);
  };

  const useLiveMasterFromDatabase = () => {
    const liveTenants = tenantDb.getTenants();
    const headers = [
      'Tenant Code',
      'Tenant Name',
      'Unit',
      'Status',
      'Branch',
      'Floor',
      'Phone',
      'Email',
      'Rent',
      'Contract Start',
      'Contract End',
      'Category'
    ];
    const rows = liveTenants.map((t) => ({
      'Tenant Code': t.tenantCode,
      'Tenant Name': t.tenantName,
      'Unit': t.unit,
      'Status': t.status,
      'Branch': t.branch || '',
      'Floor': t.floor || '',
      'Phone': t.phone || '',
      'Email': t.email || '',
      'Rent': t.rent || '',
      'Contract Start': t.contractStart || '',
      'Contract End': t.contractEnd || '',
      'Category': t.category || '',
      ...(t.rawFields || {})
    }));

    setMasterFile({
      fileName: 'live_master_database.xlsx',
      fileSize: rows.length * 128,
      fileSizeBytes: rows.length * 128,
      headers,
      rows,
      totalRows: rows.length,
      detectedMapping: {
        tenantCode: 'Tenant Code',
        tenantName: 'Tenant Name',
        unit: 'Unit',
        status: 'Status',
        branch: 'Branch',
        floor: 'Floor',
        phone: 'Phone',
        email: 'Email',
        rent: 'Rent',
        contractStart: 'Contract Start',
        contractEnd: 'Contract End',
        category: 'Category'
      },
      isTenantCodeDetected: true
    });
  };

  const updateMasterMapping = (key: string, col: string) => {
    if (!masterFile) return;
    setMasterFile({
      ...masterFile,
      detectedMapping: {
        ...masterFile.detectedMapping,
        [key]: col
      },
      isTenantCodeDetected: key === 'tenantCode' ? Boolean(col) : masterFile.isTenantCodeDetected
    });
  };

  const updateNewMapping = (key: string, col: string) => {
    if (!newFile) return;
    setNewFile({
      ...newFile,
      detectedMapping: {
        ...newFile.detectedMapping,
        [key]: col
      },
      isTenantCodeDetected: key === 'tenantCode' ? Boolean(col) : newFile.isTenantCodeDetected
    });
  };

  const executeComparison = (): boolean => {
    if (!masterFile || !newFile) return false;
    if (!masterFile.detectedMapping.tenantCode || !newFile.detectedMapping.tenantCode) return false;

    setIsComparing(true);
    try {
      const masterTenants = convertRowsToTenantRecords(masterFile.rows, masterFile.detectedMapping);
      const newTenants = convertRowsToTenantRecords(newFile.rows, newFile.detectedMapping);

      const result = compareTenantLists(masterTenants, newTenants);
      setComparisonItems(result.items);
      setSummary(result.summary);
      setAppliedSuccessSessionId(null);
      setIsComparing(false);
      return true;
    } catch (err) {
      console.error('Error during comparison:', err);
      setIsComparing(false);
      return false;
    }
  };

  const loadDemoComparison = () => {
    const demoMaster = generate100MasterTenants();
    const demoNewRows = generateNewSystemTenants(demoMaster);

    const masterHeaders = [
      'Tenant Code',
      'Tenant Name',
      'Unit',
      'Status',
      'Branch',
      'Floor',
      'Phone',
      'Email',
      'Rent',
      'Contract Start',
      'Contract End',
      'Category'
    ];

    const masterRows = demoMaster.map((t) => ({
      'Tenant Code': t.tenantCode,
      'Tenant Name': t.tenantName,
      'Unit': t.unit,
      'Status': t.status,
      'Branch': t.branch || '',
      'Floor': t.floor || '',
      'Phone': t.phone || '',
      'Email': t.email || '',
      'Rent': t.rent || '',
      'Contract Start': t.contractStart || '',
      'Contract End': t.contractEnd || '',
      'Category': t.category || '',
      ...(t.rawFields || {})
    }));

    const mFile: ParsedExcelFile = {
      fileName: 'tenant_master_current.xlsx',
      fileSize: 45200,
      fileSizeBytes: 45200,
      headers: masterHeaders,
      rows: masterRows,
      totalRows: masterRows.length,
      detectedMapping: {
        tenantCode: 'Tenant Code',
        tenantName: 'Tenant Name',
        unit: 'Unit',
        status: 'Status',
        branch: 'Branch',
        floor: 'Floor',
        phone: 'Phone',
        email: 'Email',
        rent: 'Rent',
        contractStart: 'Contract Start',
        contractEnd: 'Contract End',
        category: 'Category'
      },
      isTenantCodeDetected: true
    };

    const nHeaders = Object.keys(demoNewRows[0] || {});
    const nFile: ParsedExcelFile = {
      fileName: `tenant_export_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileSize: 48900,
      fileSizeBytes: 48900,
      headers: nHeaders,
      rows: demoNewRows,
      totalRows: demoNewRows.length,
      detectedMapping: {
        tenantCode: 'Tenant Code',
        tenantName: 'Tenant Name',
        unit: 'Unit',
        status: 'Status',
        branch: 'Branch',
        floor: 'Floor',
        phone: 'Phone',
        email: 'Email',
        rent: 'Rent',
        contractStart: 'Contract Start',
        contractEnd: 'Contract End',
        category: 'Category'
      },
      isTenantCodeDetected: true
    };

    setMasterFile(mFile);
    setNewFile(nFile);

    const masterTenants = convertRowsToTenantRecords(mFile.rows, mFile.detectedMapping);
    const newTenants = convertRowsToTenantRecords(nFile.rows, nFile.detectedMapping);

    const result = compareTenantLists(masterTenants, newTenants);
    setComparisonItems(result.items);
    setSummary(result.summary);
    setAppliedSuccessSessionId(null);
  };

  const setItemStatus = (id: string, status: 'approved' | 'rejected') => {
    setComparisonItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reviewStatus: status } : item))
    );
  };

  const setBulkStatus = (ids: string[], status: 'approved' | 'rejected') => {
    const idSet = new Set(ids);
    setComparisonItems((prev) =>
      prev.map((item) => (idSet.has(item.id) ? { ...item, reviewStatus: status } : item))
    );
  };

  const setMissingAction = (id: string, action: MissingTenantAction) => {
    setComparisonItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, missingAction: action } : item))
    );
  };

  const setBulkMissingAction = (action: MissingTenantAction) => {
    setComparisonItems((prev) =>
      prev.map((item) => (item.changeType === 'MISSING' ? { ...item, missingAction: action } : item))
    );
  };

  const applyHeuristicResolutions = (
    resolutions: {
      ruleId: string;
      ruleName: string;
      itemIds: string[];
      action: 'approve' | 'reject' | 'deactivate' | 'keep';
    }[]
  ): number => {
    let resolvedCount = 0;
    const itemActionMap = new Map<string, { action: string; tag: string }>();

    resolutions.forEach(res => {
      res.itemIds.forEach(id => {
        itemActionMap.set(id, { action: res.action, tag: res.ruleName });
      });
    });

    setComparisonItems(prev =>
      prev.map(item => {
        const resolution = itemActionMap.get(item.id);
        if (!resolution) return item;

        resolvedCount++;
        const next = { ...item, heuristicTag: resolution.tag };

        if (resolution.action === 'approve') {
          next.reviewStatus = 'approved';
        } else if (resolution.action === 'reject') {
          next.reviewStatus = 'rejected';
        } else if (resolution.action === 'deactivate') {
          next.missingAction = 'deactivate';
          next.reviewStatus = 'approved';
        } else if (resolution.action === 'keep') {
          next.missingAction = 'keep';
          next.reviewStatus = 'approved';
        }

        return next;
      })
    );

    return itemActionMap.size;
  };

  const applyApprovedChanges = (user: User): boolean => {
    if (!summary || !masterFile || !newFile) return false;

    const res = tenantDb.applyComparisonUpdate(
      comparisonItems,
      {
        masterFileName: masterFile.fileName,
        newFileName: newFile.fileName,
        summary
      },
      user
    );

    setAppliedSuccessSessionId(res.sessionId);
    return true;
  };

  const resetComparisonWorkflow = () => {
    setMasterFile(null);
    setNewFile(null);
    setComparisonItems([]);
    setSummary(null);
    setAppliedSuccessSessionId(null);
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedTenantCode,
        navigate,
        masterFile,
        newFile,
        isComparing,
        comparisonItems,
        summary,
        appliedSuccessSessionId,
        setMasterParsedFile,
        setNewParsedFile,
        useLiveMasterFromDatabase,
        updateMasterMapping,
        updateNewMapping,
        executeComparison,
        loadDemoComparison,
        setItemStatus,
        setBulkStatus,
        setMissingAction,
        setBulkMissingAction,
        applyHeuristicResolutions,
        applyApprovedChanges,
        resetComparisonWorkflow
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}

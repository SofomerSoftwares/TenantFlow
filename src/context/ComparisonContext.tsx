import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ParsedExcelFile,
  TenantComparisonItem,
  ComparisonSummary,
  TenantRecord,
  MissingTenantAction,
  ColumnMapping,
  User
} from '@/src/types/tenant';
import { convertRowsToTenantRecords } from '@/src/lib/excel/excelParser';
import { compareTenantLists } from '@/src/lib/comparison/comparisonEngine';
import { tenantDb } from '@/src/lib/database/tenantStore';
import {
  generate100MasterTenants,
  generateNewSystemTenants
} from '@/src/lib/excel/demoDataGenerator';
import { PRESETS_DATABASE_STRUCTURE } from '@/src/lib/excel/databaseColumnMapping';

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
  masterColumnMapping: ColumnMapping;
  isComparing: boolean;
  comparisonItems: TenantComparisonItem[];
  summary: ComparisonSummary | null;
  appliedSuccessSessionId: string | null;

  setMasterParsedFile: (file: ParsedExcelFile | null) => void;
  setNewParsedFile: (file: ParsedExcelFile | null) => void;
  useLiveMasterFromDatabase: () => void;
  updateMasterMapping: (key: string, col: string) => void;
  setFullMasterMapping: (mapping: Partial<ColumnMapping>) => void;
  updateNewMapping: (key: string, col: string) => void;
  setFullNewMapping: (mapping: Partial<ColumnMapping>) => void;
  resetMasterMappingToPreset: (presetKey: 'sqlDirect' | 'amharicCadastral' | 'propertyErp') => void;

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
  const [masterColumnMapping, setMasterColumnMapping] = useState<ColumnMapping>(
    PRESETS_DATABASE_STRUCTURE.sqlDirect.mapping
  );
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
      'identifier_code',
      'city',
      'sub_city',
      'woreda',
      'kebele',
      'house_number',
      'complex_no',
      'title',
      'tenant_name',
      'resident_name',
      'gender',
      'historical_use',
      'main_house',
      'bedroom_count',
      'bathroom_count',
      'kitchen_count',
      'service_room_count',
      'other_rooms_count',
      'total_rooms',
      'floor_level',
      'building_grade',
      'site_grade',
      'block_no',
      'parcel_no',
      'area_sqm',
      'rent_amount',
      'year_built',
      'year_renovated',
      'tenure_type',
      'work_status',
      'x_coordinate',
      'y_coordinate',
      'house_location',
      'mobile_phone',
      'remarks'
    ];
    const rows = liveTenants.map((t) => ({
      identifier_code: t.identifier_code || t.tenantCode,
      city: t.city || 'Addis Ababa',
      sub_city: t.sub_city || t.branch || '',
      woreda: t.woreda || '',
      kebele: t.kebele || '',
      house_number: t.house_number || t.unit || '',
      complex_no: t.complex_no || '',
      title: t.title || '',
      tenant_name: t.tenant_name || t.tenantName,
      resident_name: t.resident_name || t.tenant_name || t.tenantName,
      gender: t.gender || '',
      historical_use: t.historical_use || t.category || '',
      main_house: t.main_house || 'Main',
      bedroom_count: t.bedroom_count || 0,
      bathroom_count: t.bathroom_count || 0,
      kitchen_count: t.kitchen_count || 0,
      service_room_count: t.service_room_count || 0,
      other_rooms_count: t.other_rooms_count || 0,
      total_rooms: t.total_rooms || 0,
      floor_level: t.floor_level || t.floor || '',
      building_grade: t.building_grade || '',
      site_grade: t.site_grade || '',
      block_no: t.block_no || '',
      parcel_no: t.parcel_no || '',
      area_sqm: t.area_sqm || '',
      rent_amount: t.rent_amount !== undefined ? t.rent_amount : (t.rent || ''),
      year_built: t.year_built || '',
      year_renovated: t.year_renovated || '',
      tenure_type: t.tenure_type || '',
      work_status: t.work_status || t.status || '',
      x_coordinate: t.x_coordinate || '',
      y_coordinate: t.y_coordinate || '',
      house_location: t.house_location || '',
      mobile_phone: t.mobile_phone || t.phone || '',
      remarks: t.remarks || '',
      ...(t.rawFields || {})
    }));

    setMasterFile({
      fileName: 'master_property_registry.xlsx',
      fileSize: rows.length * 160,
      fileSizeBytes: rows.length * 160,
      headers,
      rows,
      totalRows: rows.length,
      detectedMapping: {
        tenantCode: 'identifier_code',
        identifierCode: 'identifier_code',
        city: 'city',
        subCity: 'sub_city',
        branch: 'sub_city',
        woreda: 'woreda',
        kebele: 'kebele',
        houseNumber: 'house_number',
        unit: 'house_number',
        complexNo: 'complex_no',
        title: 'title',
        tenantName: 'tenant_name',
        residentName: 'resident_name',
        gender: 'gender',
        historicalUse: 'historical_use',
        category: 'historical_use',
        mainHouse: 'main_house',
        bedroomCount: 'bedroom_count',
        bathroomCount: 'bathroom_count',
        kitchenCount: 'kitchen_count',
        serviceRoomCount: 'service_room_count',
        otherRoomsCount: 'other_rooms_count',
        totalRooms: 'total_rooms',
        floorLevel: 'floor_level',
        floor: 'floor_level',
        buildingGrade: 'building_grade',
        siteGrade: 'site_grade',
        blockNo: 'block_no',
        parcelNo: 'parcel_no',
        areaSqm: 'area_sqm',
        rentAmount: 'rent_amount',
        rent: 'rent_amount',
        yearBuilt: 'year_built',
        yearRenovated: 'year_renovated',
        tenureType: 'tenure_type',
        workStatus: 'work_status',
        status: 'work_status',
        xCoordinate: 'x_coordinate',
        yCoordinate: 'y_coordinate',
        houseLocation: 'house_location',
        mobilePhone: 'mobile_phone',
        phone: 'mobile_phone',
        remarks: 'remarks'
      },
      isTenantCodeDetected: true
    });
  };

  const updateMasterMapping = (key: string, col: string) => {
    const updated = {
      ...masterColumnMapping,
      [key]: col
    };
    if (key === 'tenantCode') updated.identifierCode = col;
    if (key === 'identifierCode') updated.tenantCode = col;
    if (key === 'subCity') updated.branch = col;
    if (key === 'branch') updated.subCity = col;
    if (key === 'houseNumber') updated.unit = col;
    if (key === 'unit') updated.houseNumber = col;
    if (key === 'floorLevel') updated.floor = col;
    if (key === 'floor') updated.floorLevel = col;
    if (key === 'mobilePhone') updated.phone = col;
    if (key === 'phone') updated.mobilePhone = col;
    if (key === 'rentAmount') updated.rent = col;
    if (key === 'rent') updated.rentAmount = col;
    if (key === 'workStatus') updated.status = col;
    if (key === 'status') updated.workStatus = col;
    if (key === 'historicalUse') updated.category = col;
    if (key === 'category') updated.historicalUse = col;

    setMasterColumnMapping(updated);

    if (masterFile) {
      const newMapping: any = {
        ...masterFile.detectedMapping,
        ...updated
      };
      setMasterFile({
        ...masterFile,
        detectedMapping: newMapping,
        isTenantCodeDetected: Boolean(newMapping.tenantCode || newMapping.identifierCode)
      });
    }
  };

  const setFullMasterMapping = (mapping: Partial<ColumnMapping>) => {
    const updated = { ...masterColumnMapping, ...mapping };
    setMasterColumnMapping(updated);
    if (masterFile) {
      const merged = { ...masterFile.detectedMapping, ...mapping };
      setMasterFile({
        ...masterFile,
        detectedMapping: merged as ColumnMapping,
        isTenantCodeDetected: Boolean(merged.tenantCode || merged.identifierCode)
      });
    }
  };

  const resetMasterMappingToPreset = (presetKey: 'sqlDirect' | 'amharicCadastral' | 'propertyErp') => {
    const preset = PRESETS_DATABASE_STRUCTURE[presetKey]?.mapping;
    if (!preset) return;
    setMasterColumnMapping(preset);
    if (masterFile) {
      setMasterFile({
        ...masterFile,
        detectedMapping: { ...preset },
        isTenantCodeDetected: Boolean(preset.tenantCode || preset.identifierCode)
      });
    }
  };

  const setFullNewMapping = (mapping: Partial<ColumnMapping>) => {
    if (!newFile) return;
    const merged = { ...newFile.detectedMapping, ...mapping };
    setNewFile({
      ...newFile,
      detectedMapping: merged as ColumnMapping,
      isTenantCodeDetected: Boolean(merged.tenantCode || merged.identifierCode)
    });
  };

  const updateNewMapping = (key: string, col: string) => {
    if (!newFile) return;
    const newMapping: any = {
      ...newFile.detectedMapping,
      [key]: col
    };
    if (key === 'tenantCode') newMapping.identifierCode = col;
    if (key === 'identifierCode') newMapping.tenantCode = col;
    if (key === 'subCity') newMapping.branch = col;
    if (key === 'branch') newMapping.subCity = col;
    if (key === 'houseNumber') newMapping.unit = col;
    if (key === 'unit') newMapping.houseNumber = col;
    if (key === 'floorLevel') newMapping.floor = col;
    if (key === 'floor') newMapping.floorLevel = col;
    if (key === 'mobilePhone') newMapping.phone = col;
    if (key === 'phone') newMapping.mobilePhone = col;
    if (key === 'rentAmount') newMapping.rent = col;
    if (key === 'rent') newMapping.rentAmount = col;
    if (key === 'workStatus') newMapping.status = col;
    if (key === 'status') newMapping.workStatus = col;
    if (key === 'historicalUse') newMapping.category = col;
    if (key === 'category') newMapping.historicalUse = col;

    setNewFile({
      ...newFile,
      detectedMapping: newMapping,
      isTenantCodeDetected: Boolean(newMapping.tenantCode || newMapping.identifierCode)
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
        masterColumnMapping,
        isComparing,
        comparisonItems,
        summary,
        appliedSuccessSessionId,
        setMasterParsedFile,
        setNewParsedFile,
        useLiveMasterFromDatabase,
        updateMasterMapping,
        setFullMasterMapping,
        updateNewMapping,
        setFullNewMapping,
        resetMasterMappingToPreset,
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

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Database,
  UploadCloud,
  SlidersHorizontal,
  Table,
  Layers,
  HelpCircle,
  Filter,
  Eye,
  Trash2,
  ExternalLink,
  Zap,
  Split,
  ChevronDown,
  Info,
  CheckSquare,
  Square,
  Save,
  FilePlus,
  AlertTriangle,
  X
} from 'lucide-react';
import { parseExcelFile } from '@/src/lib/excel/excelParser';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';
import {
  VlookupConfig,
  VlookupExecutionResult,
  VlookupMatchMode,
  VlookupNaHandling,
  VlookupFormulaType
} from '@/src/types/vlookup';
import { executeVlookup } from '@/src/lib/vlookup/vlookupEngine';
import { exportVlookupResultExcel } from '@/src/lib/vlookup/vlookupExcelExporter';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';

// Sample Preset 1: Bank Payment Slips (Payment records needing tenant names, branch & rent check)
const SAMPLE_BANK_PAYMENTS = [
  { 'Receipt_No': 'TXN-88201', 'Tenant_Code': 'ETH-AA-B1-001', 'Amount_Paid': 5000, 'Bank': 'CBE', 'Payment_Date': '2026-09-01' },
  { 'Receipt_No': 'TXN-88202', 'Tenant_Code': 'ETH-AA-B1-002', 'Amount_Paid': 7500, 'Bank': 'Dashen', 'Payment_Date': '2026-09-02' },
  { 'Receipt_No': 'TXN-88203', 'Tenant_Code': 'ETH-AA-B1-003', 'Amount_Paid': 4800, 'Bank': 'Awash', 'Payment_Date': '2026-09-03' },
  { 'Receipt_No': 'TXN-88204', 'Tenant_Code': 'ETH-AA-B2-015', 'Amount_Paid': 12000, 'Bank': 'CBE', 'Payment_Date': '2026-09-04' },
  { 'Receipt_No': 'TXN-88205', 'Tenant_Code': 'UNKNOWN-CODE-99', 'Amount_Paid': 3000, 'Bank': 'Abyssinia', 'Payment_Date': '2026-09-05' },
  { 'Receipt_No': 'TXN-88206', 'Tenant_Code': 'ETH-AA-B3-042', 'Amount_Paid': 6000, 'Bank': 'CBE', 'Payment_Date': '2026-09-06' },
  { 'Receipt_No': 'TXN-88207', 'Tenant_Code': 'ETH-AA-B4-088', 'Amount_Paid': 9500, 'Bank': 'Dashen', 'Payment_Date': '2026-09-07' },
  { 'Receipt_No': 'TXN-88208', 'Tenant_Code': 'INVALID-TENANT-X', 'Amount_Paid': 5500, 'Bank': 'CBE', 'Payment_Date': '2026-09-08' }
];

// Sample Preset 2: Municipal Water & Energy Inspection List
const SAMPLE_UTILITY_INSPECTION = [
  { 'Meter_No': 'WTR-AA-1001', 'House_No': 'HN-101', 'Meter_Status': 'Active', 'Kwh_Units': 420 },
  { 'Meter_No': 'WTR-AA-1002', 'House_No': 'HN-102', 'Meter_Status': 'Active', 'Kwh_Units': 680 },
  { 'Meter_No': 'WTR-AA-1003', 'House_No': 'HN-103', 'Meter_Status': 'Under Maintenance', 'Kwh_Units': 110 },
  { 'Meter_No': 'WTR-AA-1004', 'House_No': 'HN-999', 'Meter_Status': 'Inactive', 'Kwh_Units': 0 },
  { 'Meter_No': 'WTR-AA-1005', 'House_No': 'HN-104', 'Meter_Status': 'Active', 'Kwh_Units': 850 }
];

// Fallback Benchmark Master Records
const FALLBACK_BENCHMARK_ROWS = [
  { identifier_code: 'ETH-AA-B1-001', tenant_name: 'አቶ አበበ ከበደ', sub_city: 'ቦሌ', house_number: 'HN-101', historical_use: 'መኖሪያ ቤት', rent_amount: 5000, work_status: 'Active' },
  { identifier_code: 'ETH-AA-B1-002', tenant_name: 'ወ/ሮ ትዕግስት ኃይሌ', sub_city: 'ቦሌ', house_number: 'HN-102', historical_use: 'የድርጅት ቤት', rent_amount: 7500, work_status: 'Active' },
  { identifier_code: 'ETH-AA-B1-003', tenant_name: 'ዶ/ር ዳዊት ወልዴ', sub_city: 'ቦሌ', house_number: 'HN-103', historical_use: 'መኖሪያ ቤት', rent_amount: 4800, work_status: 'Active' },
  { identifier_code: 'ETH-AA-B2-015', tenant_name: 'አቶ ካሊድ ዑመር', sub_city: 'ቂርቆስ', house_number: 'HN-215', historical_use: 'የድርጅት ቤት', rent_amount: 12000, work_status: 'Active' },
  { identifier_code: 'ETH-AA-B3-042', tenant_name: 'ወ/ሪት ሄለን ታደሰ', sub_city: 'አራዳ', house_number: 'HN-342', historical_use: 'መኖሪያ ቤት', rent_amount: 6000, work_status: 'Active' },
  { identifier_code: 'ETH-AA-B4-088', tenant_name: 'አቶ ሳሙኤል ተፈራ', sub_city: 'ልደታ', house_number: 'HN-488', historical_use: 'የድርጅት ቤት', rent_amount: 9500, work_status: 'Active' }
];

/**
 * Intelligent helper to detect the best matching keys between two spreadsheets
 */
function detectBestLookupPair(sHeaders: string[], rHeaders: string[]): { sourceKey: string; refKey: string } {
  const candidateGroups = [
    ['tenant_code', 'tenantcode', 'identifier_code', 'identifier', 'code', 'መለያ', 'የተከራይ_መለያ'],
    ['house_no', 'house_number', 'unit', 'unit_no', 'ቤት_ቁጥር', 'ቤት ቁጥር'],
    ['meter_no', 'meter_number', 'ቆጣሪ_ቁጥር'],
    ['receipt_no', 'txn_no', 'voucher_no'],
    ['tenant_name', 'tenantname', 'name', 'resident_name', 'የተከራይ_ስም', 'ስም']
  ];

  let bestSource = sHeaders[0] || '';
  let bestRef = rHeaders[0] || '';
  let found = false;

  for (const group of candidateGroups) {
    const sMatch = sHeaders.find(sh => {
      const c = sh.toLowerCase().replace(/[\s\-_]+/g, '');
      return group.some(g => c.includes(g.replace(/[\s\-_]+/g, '')));
    });
    const rMatch = rHeaders.find(rh => {
      const c = rh.toLowerCase().replace(/[\s\-_]+/g, '');
      return group.some(g => c.includes(g.replace(/[\s\-_]+/g, '')));
    });

    if (sMatch && rMatch) {
      bestSource = sMatch;
      bestRef = rMatch;
      found = true;
      break;
    } else if (sMatch && !bestSource) {
      bestSource = sMatch;
    }
  }

  if (!found) {
    const rKey = rHeaders.find(rh => {
      const c = rh.toLowerCase().replace(/[\s\-_]+/g, '');
      return c === 'identifiercode' || c === 'tenantcode' || c === 'መለያ' || c === 'housenumber' || c === 'unit';
    });
    if (rKey) bestRef = rKey;
  }

  return { sourceKey: bestSource, refKey: bestRef };
}

export const VlookupView: React.FC = () => {
  const { newFile } = useComparison();
  const { user } = useAuth();

  // Tables State
  const [sourceData, setSourceData] = useState<{
    fileName: string;
    headers: string[];
    rows: Record<string, any>[];
  }>({
    fileName: 'Sample_Bank_Payments.xlsx',
    headers: Object.keys(SAMPLE_BANK_PAYMENTS[0]),
    rows: SAMPLE_BANK_PAYMENTS
  });

  const [referenceSourceType, setReferenceSourceType] = useState<'database' | 'file'>('database');
  const [referenceData, setReferenceData] = useState<{
    fileName: string;
    sheetName: string;
    headers: string[];
    rows: Record<string, any>[];
  }>({
    fileName: 'Live Master Database (ተከራይ ዳታቤዝ)',
    sheetName: 'Master_Registry',
    headers: Object.keys(FALLBACK_BENCHMARK_ROWS[0]),
    rows: FALLBACK_BENCHMARK_ROWS
  });

  // VLOOKUP Configuration State
  const [sourceKeyCol, setSourceKeyCol] = useState<string>('Tenant_Code');
  const [referenceKeyCol, setReferenceKeyCol] = useState<string>('identifier_code');
  const [selectedReturnCols, setSelectedReturnCols] = useState<string[]>([
    'tenant_name',
    'sub_city',
    'house_number',
    'historical_use',
    'rent_amount',
    'work_status'
  ]);
  const [matchMode, setMatchMode] = useState<VlookupMatchMode>('normalized');
  const [naHandling, setNaHandling] = useState<VlookupNaHandling>('Not Found');
  const [customNaValue, setCustomNaValue] = useState<string>('አልተገኘም (Not Found)');
  const [formulaType, setFormulaType] = useState<VlookupFormulaType>('VLOOKUP');

  // Execution & UI state
  const [result, setResult] = useState<VlookupExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<'all' | 'matched' | 'unmatched' | 'discrepancies'>('all');
  const [resultsSearch, setResultsSearch] = useState('');
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Enrichment Modal State
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [isEnrichingMaster, setIsEnrichingMaster] = useState(false);

  // File Input Refs
  const sourceFileRef = useRef<HTMLInputElement>(null);
  const referenceFileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Immediate Execution Engine
  const runVlookupNow = useCallback((
    src = sourceData,
    ref = referenceData,
    srcKey = sourceKeyCol,
    refKey = referenceKeyCol,
    returnCols = selectedReturnCols,
    mode = matchMode,
    na = naHandling,
    customNa = customNaValue,
    fType = formulaType
  ) => {
    if (!src.rows.length || !ref.rows.length || !srcKey || !refKey || !returnCols.length) {
      return;
    }

    setIsExecuting(true);
    const config: VlookupConfig = {
      sourceFileName: src.fileName,
      referenceFileName: ref.fileName,
      sourceKeyColumn: srcKey,
      referenceKeyColumn: refKey,
      returnColumns: returnCols,
      matchMode: mode,
      naHandling: na,
      customNaValue: na === 'custom' ? customNa : undefined,
      formulaType: fType,
      referenceSheetName: ref.sheetName || 'Master_Registry'
    };

    const res = executeVlookup(src.rows, ref.rows, config);
    setResult(res);
    setIsExecuting(false);
  }, [sourceData, referenceData, sourceKeyCol, referenceKeyCol, selectedReturnCols, matchMode, naHandling, customNaValue, formulaType]);

  // Load Live Tenants into Reference Table
  const reloadReferenceFromDatabase = useCallback(() => {
    const tenants = tenantDb.getTenants();
    if (tenants.length > 0) {
      const sample = tenants[0];
      const headers = Object.keys(sample).filter(k => k !== 'rawFields');
      const newRef = {
        fileName: `Master Tenant Database (${tenants.length} properties)`,
        sheetName: 'Master_Registry',
        headers,
        rows: tenants
      };
      setReferenceData(newRef);

      let targetKey = headers[0];
      if (headers.includes('identifier_code')) targetKey = 'identifier_code';
      else if (headers.includes('tenantCode')) targetKey = 'tenantCode';
      setReferenceKeyCol(targetKey);

      // Filter return cols to those existing in headers
      const validCols = selectedReturnCols.filter(c => headers.includes(c));
      const finalCols = validCols.length > 0 ? validCols : headers.filter(h => h !== targetKey).slice(0, 6);
      setSelectedReturnCols(finalCols);

      runVlookupNow(sourceData, newRef, sourceKeyCol, targetKey, finalCols);
    } else {
      const newRef = {
        fileName: 'Master Registry (Sample Benchmark)',
        sheetName: 'Master_Registry',
        headers: Object.keys(FALLBACK_BENCHMARK_ROWS[0]),
        rows: FALLBACK_BENCHMARK_ROWS
      };
      setReferenceData(newRef);
      setReferenceKeyCol('identifier_code');
      runVlookupNow(sourceData, newRef, sourceKeyCol, 'identifier_code', selectedReturnCols);
    }
  }, [sourceData, sourceKeyCol, selectedReturnCols, runVlookupNow]);

  // Initial load effect
  useEffect(() => {
    reloadReferenceFromDatabase();

    const unsub = tenantDb.subscribe(() => {
      if (referenceSourceType === 'database') {
        reloadReferenceFromDatabase();
      }
    });
    return () => unsub();
  }, [referenceSourceType]);

  // Auto-run when configuration parameters change
  useEffect(() => {
    if (sourceData.rows.length > 0 && referenceData.rows.length > 0 && sourceKeyCol && referenceKeyCol && selectedReturnCols.length > 0) {
      runVlookupNow();
    }
  }, [sourceKeyCol, referenceKeyCol, selectedReturnCols, matchMode, naHandling, customNaValue, formulaType]);

  // Auto-Match Key Columns intelligently
  const handleAutoDetectKeys = () => {
    const detected = detectBestLookupPair(sourceData.headers, referenceData.headers);
    if (detected.sourceKey) setSourceKeyCol(detected.sourceKey);
    if (detected.refKey) setReferenceKeyCol(detected.refKey);

    showToast(`ቁልፎች በራስ-ሰር ተገናኝተዋል: "${detected.sourceKey}" ↔ "${detected.refKey}"`);
    runVlookupNow(sourceData, referenceData, detected.sourceKey, detected.refKey, selectedReturnCols);
  };

  // Run the VLOOKUP manually
  const handleManualExecuteVlookup = () => {
    if (!sourceKeyCol || !referenceKeyCol) {
      alert('እባክዎ ሁለቱንም የማገናኛ ቁልፎች (Lookup Keys) ይምረጡ!');
      return;
    }
    if (selectedReturnCols.length === 0) {
      alert('እባክዎ ቢያንስ አንድ የሚመለስ አምድ (Return Column) ይምረጡ!');
      return;
    }

    runVlookupNow();
    showToast(`VLOOKUP ተከናውኗል! (${result?.summary.matchedCount ?? 0} ተገናኝተዋል)`);
  };

  // Load Source File from Upload
  const handleSourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      const newSrc = {
        fileName: file.name,
        headers: parsed.headers,
        rows: parsed.rows
      };
      setSourceData(newSrc);

      const detected = detectBestLookupPair(parsed.headers, referenceData.headers);
      const sKey = detected.sourceKey || parsed.headers[0];
      const rKey = detected.refKey || referenceKeyCol;
      setSourceKeyCol(sKey);
      setReferenceKeyCol(rKey);

      showToast(`የምንጭ ሰነድ ተጭኗል: ${file.name} (${parsed.rows.length} ረድፎች)`);
      runVlookupNow(newSrc, referenceData, sKey, rKey, selectedReturnCols);
    } catch (err: any) {
      alert(err.message || 'ፋይሉን መጫን አልተቻለም');
    }
  };

  // Load Reference File from Upload
  const handleReferenceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      setReferenceSourceType('file');
      const newRef = {
        fileName: file.name,
        sheetName: 'Reference',
        headers: parsed.headers,
        rows: parsed.rows
      };
      setReferenceData(newRef);

      const detected = detectBestLookupPair(sourceData.headers, parsed.headers);
      const rKey = detected.refKey || parsed.headers[0];
      const sKey = detected.sourceKey || sourceKeyCol;
      setReferenceKeyCol(rKey);
      setSourceKeyCol(sKey);

      const returnOptions = parsed.headers.filter(h => h !== rKey).slice(0, 6);
      setSelectedReturnCols(returnOptions);

      showToast(`የማጣቀሻ ሰነድ ተጭኗል: ${file.name} (${parsed.rows.length} ረድፎች)`);
      runVlookupNow(sourceData, newRef, sKey, rKey, returnOptions);
    } catch (err: any) {
      alert(err.message || 'ማጣቀሻ ፋይሉን መጫን አልተቻለም');
    }
  };

  // Load Presets
  const loadPreset = (type: 'bank' | 'utility') => {
    if (type === 'bank') {
      const newSrc = {
        fileName: 'Bank_Payments_Collection.xlsx',
        headers: Object.keys(SAMPLE_BANK_PAYMENTS[0]),
        rows: SAMPLE_BANK_PAYMENTS
      };
      setSourceData(newSrc);
      setSourceKeyCol('Tenant_Code');
      setReferenceKeyCol('identifier_code');
      const cols = ['tenant_name', 'sub_city', 'house_number', 'historical_use', 'rent_amount'];
      setSelectedReturnCols(cols);
      runVlookupNow(newSrc, referenceData, 'Tenant_Code', 'identifier_code', cols);
    } else {
      const newSrc = {
        fileName: 'Utility_Meters_Audit.xlsx',
        headers: Object.keys(SAMPLE_UTILITY_INSPECTION[0]),
        rows: SAMPLE_UTILITY_INSPECTION
      };
      setSourceData(newSrc);
      setSourceKeyCol('House_No');
      setReferenceKeyCol('house_number');
      const cols = ['tenant_name', 'sub_city', 'historical_use', 'rent_amount', 'work_status'];
      setSelectedReturnCols(cols);
      runVlookupNow(newSrc, referenceData, 'House_No', 'house_number', cols);
    }
    showToast('የሙከራ ናሙና መረጃ ተጭኗል');
  };

  // Load Uploaded File from Application Context
  const handleLoadContextFile = () => {
    if (!newFile) return;
    const newSrc = {
      fileName: newFile.fileName,
      headers: newFile.headers,
      rows: newFile.rows
    };
    setSourceData(newSrc);

    const detected = detectBestLookupPair(newFile.headers, referenceData.headers);
    const sKey = detected.sourceKey || newFile.headers[0];
    const rKey = detected.refKey || referenceKeyCol;
    setSourceKeyCol(sKey);
    setReferenceKeyCol(rKey);

    showToast(`የተጫነው ሰነድ ወደ ምንጭነት ተቀናብሯል: ${newFile.fileName}`);
    runVlookupNow(newSrc, referenceData, sKey, rKey, selectedReturnCols);
  };

  // Copy formula to clipboard
  const handleCopyFormula = () => {
    if (!result?.sampleFormula) return;
    navigator.clipboard.writeText(result.sampleFormula);
    setCopiedFormula(true);
    showToast('ፎርሙላው ወደ ቅንጥብ ሰሌዳ ተገልብጧል (Formula copied to clipboard!)');
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  // Data Enrichment: Commit looked-up attributes into Master Database
  const handleApplyEnrichmentToMaster = () => {
    if (!result || result.summary.matchedCount === 0) {
      alert('ምንም የተገናኙ መረጃዎች የሉም (No matched records to enrich).');
      return;
    }

    const activeUser: any = user || {
      id: 'usr-admin',
      name: 'Tesfu Niguse (Administrator)',
      email: 'tesfuniguse18@gmail.com',
      role: 'Admin'
    };

    setIsEnrichingMaster(true);
    let enrichedCount = 0;
    const matchedRows = result.rows.filter(r => r.isMatched && r.matchedReferenceRow);

    matchedRows.forEach(mr => {
      const refKeyVal = mr.matchedReferenceRow![result.config.referenceKeyColumn];
      if (!refKeyVal) return;

      const additionalFields: Record<string, any> = {};
      Object.entries(mr.originalRow).forEach(([k, v]) => {
        if (k !== result.config.sourceKeyColumn && v !== undefined && v !== '') {
          additionalFields[k] = v;
        }
      });

      try {
        const updated = tenantDb.updateSingleTenant(
          String(refKeyVal),
          { rawFields: additionalFields },
          activeUser
        );
        if (updated) enrichedCount++;
      } catch (e) {
        // Continue for partial matches
      }
    });

    tenantDb.addAuditLog(
      'VLOOKUP Data Enrichment Applied',
      `Enriched ${enrichedCount} master records with external attributes from ${sourceData.fileName}.`,
      activeUser
    );

    setIsEnrichingMaster(false);
    setEnrichModalOpen(false);
    showToast(`ዳታቤዝ ተበልጽጓል! ${enrichedCount} መረጃዎች ተዘምነዋል (${enrichedCount} records enriched)`);
    reloadReferenceFromDatabase();
  };

  // Data Enrichment: Register Unmatched Records as New Pending Tenants
  const handleAddUnmatchedToMaster = () => {
    if (!result || result.summary.unmatchedCount === 0) {
      alert('ምንም ያልተገናኙ መረጃዎች የሉም (No unmatched records to register).');
      return;
    }

    const activeUser: any = user || {
      id: 'usr-admin',
      name: 'Tesfu Niguse (Administrator)',
      email: 'tesfuniguse18@gmail.com',
      role: 'Admin'
    };

    const unmatchedRows = result.rows.filter(r => !r.isMatched);
    let addedCount = 0;
    const currentTenants = tenantDb.getTenants();

    const newTenantsList = [...currentTenants];

    unmatchedRows.forEach(ur => {
      const code = ur.lookupKey || `T-${Date.now().toString().slice(-5)}`;
      const name = ur.originalRow['Tenant_Name'] || ur.originalRow['Name'] || ur.originalRow['tenant_name'] || ur.originalRow['ስም'] || 'Unregistered Tenant';
      const unit = ur.originalRow['House_No'] || ur.originalRow['Unit'] || ur.originalRow['house_number'] || ur.originalRow['ቤት ቁጥር'] || 'Pending';
      const rent = Number(ur.originalRow['Amount_Paid'] || ur.originalRow['Rent'] || ur.originalRow['rent_amount'] || 0);

      const newRecord = {
        identifier_code: code,
        tenant_name: name,
        house_number: unit,
        tenantCode: code,
        tenantName: name,
        unit: unit,
        rent_amount: rent,
        work_status: 'Pending Verification',
        status: 'Active',
        rawFields: ur.originalRow,
        createdAt: new Date().toISOString()
      };

      newTenantsList.push(newRecord as any);
      addedCount++;
    });

    tenantDb.saveTenants(newTenantsList);
    tenantDb.addAuditLog(
      'VLOOKUP Unmatched Added',
      `Registered ${addedCount} unmatched records into master database from ${sourceData.fileName}.`,
      activeUser
    );

    showToast(`አዳዲስ ${addedCount} መረጃዎች ወደ ዳታቤዝ ተመዝግበዋል!`);
    reloadReferenceFromDatabase();
  };

  // Filtered Results
  const filteredRows = useMemo(() => {
    if (!result) return [];
    return result.rows.filter(r => {
      if (activeResultsTab === 'matched' && !r.isMatched) return false;
      if (activeResultsTab === 'unmatched' && r.isMatched) return false;
      if (activeResultsTab === 'discrepancies' && !r.hasDiscrepancies) return false;

      if (resultsSearch.trim()) {
        const q = resultsSearch.toLowerCase();
        const keyMatch = r.lookupKey.toLowerCase().includes(q);
        const sourceMatch = Object.values(r.originalRow).some(v => String(v).toLowerCase().includes(q));
        const pulledMatch = Object.values(r.pulledValues).some(v => String(v).toLowerCase().includes(q));
        if (!keyMatch && !sourceMatch && !pulledMatch) return false;
      }
      return true;
    });
  }, [result, activeResultsTab, resultsSearch]);

  const toggleReturnCol = (col: string) => {
    setSelectedReturnCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800">
              VLOOKUP Automator
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Excel Cross-Table Matcher · የቪሉካፕ ማገናኛ
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <Zap className="h-3 w-3" />
              <span>Instant Live Match</span>
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Automated Excel VLOOKUP & Data Enrichment
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 max-w-3xl">
            Match any external spreadsheet (Bank payments, Surveys, Utility bills) against your Master Registry using Identifier Code, House Number, or Name — without writing complex formulas.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400">ናሙና ሞክር:</span>
          <button
            onClick={() => loadPreset('bank')}
            className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
          >
            Bank Payments Slip
          </button>
          <button
            onClick={() => loadPreset('utility')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Utility House Audit
          </button>
        </div>
      </div>

      {/* Context Uploaded File Banner */}
      {newFile && sourceData.fileName !== newFile.fileName && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950">
                Active Uploaded File Detected: <span className="font-mono text-indigo-700">{newFile.fileName}</span>
              </div>
              <div className="text-[11px] text-indigo-700">
                {newFile.totalRows} rows ready for automated VLOOKUP matching against your Master Registry.
              </div>
            </div>
          </div>
          <button
            onClick={handleLoadContextFile}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            <span>Load Uploaded File as Source (ይህንን ተጠቀም)</span>
          </button>
        </div>
      )}

      {/* Step 1 & 2: Two Tables Configuration Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Source Table Card (Table 1) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lookup Source Table (የምንጭ ሰነድ)
                </h3>
                <p className="text-[11px] text-slate-500">
                  The dataset that needs additional columns looked up
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={sourceFileRef}
                onChange={handleSourceFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <button
                onClick={() => sourceFileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                <span>Upload Excel</span>
              </button>
            </div>
          </div>

          {/* Source File Info */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                {sourceData.fileName}
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold shrink-0">
              {sourceData.rows.length.toLocaleString()} rows · {sourceData.headers.length} cols
            </span>
          </div>

          {/* Lookup Key Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Lookup Key Column (የማገናኛ ቁልፍ):
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sourceKeyCol}
                onChange={(e) => setSourceKeyCol(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sourceData.headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Sample value in row 1: <strong className="font-mono text-slate-700">{String(sourceData.rows[0]?.[sourceKeyCol] ?? '—')}</strong>
            </p>
          </div>
        </div>

        {/* Reference Table Card (Table 2 - Table Array) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reference Table Array (የማጣቀሻ ሰንጠረዥ)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Master catalog containing the values to retrieve
                </p>
              </div>
            </div>

            {/* Reference Source Mode Buttons */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => {
                  setReferenceSourceType('database');
                  reloadReferenceFromDatabase();
                }}
                className={`rounded-md px-2 py-1 text-[11px] font-bold cursor-pointer transition ${
                  referenceSourceType === 'database'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Master DB
              </button>
              <button
                onClick={() => {
                  referenceFileRef.current?.click();
                }}
                className={`rounded-md px-2 py-1 text-[11px] font-bold cursor-pointer transition ${
                  referenceSourceType === 'file'
                    ? 'bg-white text-indigo-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <input
                type="file"
                ref={referenceFileRef}
                onChange={handleReferenceFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Reference Info */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                {referenceData.fileName}
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold shrink-0">
              {referenceData.rows.length.toLocaleString()} records · {referenceData.headers.length} cols
            </span>
          </div>

          {/* Reference Key Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Match Against Reference Key Column:
              </label>
              <button
                onClick={handleAutoDetectKeys}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-Detect Keys</span>
              </button>
            </div>
            <select
              value={referenceKeyCol}
              onChange={(e) => setReferenceKeyCol(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {referenceData.headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Sample value in row 1: <strong className="font-mono text-slate-700">{String(referenceData.rows[0]?.[referenceKeyCol] ?? '—')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Choose Return Columns (Columns to Pull) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Choose Return Columns (የሚመጡ አምዶች)
              </h3>
              <p className="text-[11px] text-slate-500">
                Select which attributes from the reference table to retrieve and append
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedReturnCols(referenceData.headers.filter(h => h !== referenceKeyCol))}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setSelectedReturnCols([])}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear All
            </button>
            <span className="text-slate-300">•</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              {selectedReturnCols.length} columns selected
            </span>
          </div>
        </div>

        {/* Checkbox Pills Grid */}
        <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
          {referenceData.headers.map(col => {
            const isSelected = selectedReturnCols.includes(col);
            const isKey = col === referenceKeyCol;
            return (
              <button
                key={col}
                type="button"
                onClick={() => !isKey && toggleReturnCol(col)}
                disabled={isKey}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isKey
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>{col}</span>
                {isKey && <span className="text-[10px] opacity-70">(Key)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: VLOOKUP Rules & Matching Parameters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
            4
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Matching Rules & Formula Options
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure how keys match and how missing rows (#N/A) are formatted
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          {/* Match Mode */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Match Sensitivity (የግጥሚያ ሁኔታ):
            </label>
            <select
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="normalized">Normalized (Case-Insensitive & Whitespace Trim)</option>
              <option value="exact">Exact Match (Excel FALSE / 0 Strict)</option>
              <option value="fuzzy">Fuzzy Similarity (Names & Typo Tolerance)</option>
            </select>
            <p className="mt-1 text-[10px] text-slate-400">
              {matchMode === 'normalized' && 'Ignores trailing spaces, casing & leading zeros for highest match success.'}
              {matchMode === 'exact' && 'Strict byte-by-byte matching like raw Excel FALSE.'}
              {matchMode === 'fuzzy' && 'Matches names or codes with typo tolerance and title stripping.'}
            </p>
          </div>

          {/* Missing #N/A Value Handling */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Missing Value Handling (#N/A):
            </label>
            <select
              value={naHandling}
              onChange={(e) => setNaHandling(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Not Found">"Not Found"</option>
              <option value="አልተገኘም">"አልተገኘም" (Amharic)</option>
              <option value="#N/A">Standard Excel "#N/A"</option>
              <option value="empty">Empty Blank Cell</option>
              <option value="0">Zero (0)</option>
              <option value="custom">Custom Text...</option>
            </select>
            {naHandling === 'custom' && (
              <input
                type="text"
                placeholder="Custom text for #N/A"
                value={customNaValue}
                onChange={(e) => setCustomNaValue(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-1.5 text-xs focus:outline-none"
              />
            )}
          </div>

          {/* Formula Type */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Excel Formula Syntax:
            </label>
            <select
              value={formulaType}
              onChange={(e) => setFormulaType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="VLOOKUP">Classic =VLOOKUP(...) with IFNA</option>
              <option value="XLOOKUP">Modern =XLOOKUP(...) (Office 365)</option>
              <option value="INDEX_MATCH">=INDEX(..., MATCH(...))</option>
            </select>
            <p className="mt-1 text-[10px] text-slate-400">
              Generates genuine copy-paste formulas compatible with Excel.
            </p>
          </div>
        </div>

        {/* Execution Run Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>
              Looking up <strong>{sourceKeyCol}</strong> in <strong>{sourceData.fileName}</strong> against <strong>{referenceKeyCol}</strong> in <strong>{referenceData.fileName}</strong>.
            </span>
          </div>

          <button
            onClick={handleManualExecuteVlookup}
            disabled={isExecuting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Matching...' : 'Re-Run VLOOKUP Matcher (ቪሉካፕ አከናውን)'}</span>
          </button>
        </div>
      </div>

      {/* Step 5: VLOOKUP Results & Live Analytics */}
      {result && (
        <div className="space-y-4">
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ጠቅላላ የተፈተሹ (Total)</div>
              <div className="mt-1 text-xl font-black text-slate-900">{result.summary.totalRows.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-slate-500">Source rows</div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">የተገኙ (Matched)</div>
              <div className="mt-1 text-xl font-black text-emerald-950">{result.summary.matchedCount.toLocaleString()}</div>
              <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                {result.summary.matchRatePercent}% Match Rate
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">ያልተገኙ (#N/A Missing)</div>
              <div className="mt-1 text-xl font-black text-rose-950">{result.summary.unmatchedCount.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-rose-700">Not in reference</div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">ልዩነቶች (Discrepancies)</div>
              <div className="mt-1 text-xl font-black text-amber-950">{result.summary.discrepanciesCount.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-amber-700">Source vs Master</div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">የተጨመሩ አምዶች (Columns)</div>
              <div className="mt-1 text-xl font-black text-indigo-950">+{result.config.returnColumns.length}</div>
              <div className="mt-1 text-[11px] text-indigo-700">Pulled into table</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">የፈጀበት ጊዜ (Speed)</div>
              <div className="mt-1 text-xl font-black text-slate-900">{result.summary.executionTimeMs} ms</div>
              <div className="mt-1 text-[11px] text-slate-500">Fast in-memory index</div>
            </div>
          </div>

          {/* Formula Display & Actions Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="rounded-lg bg-indigo-600 p-2 text-white shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                  Excel Formula Generated for Row 2:
                </div>
                <div className="font-mono text-xs font-bold text-indigo-950 truncate max-w-2xl bg-white/80 px-2.5 py-1 rounded-md border border-indigo-200 mt-0.5">
                  {result.sampleFormula}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleCopyFormula}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs cursor-pointer"
              >
                {copiedFormula ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFormula ? 'Copied!' : 'Copy Formula'}</span>
              </button>

              <button
                onClick={() => exportVlookupResultExcel(result, { includeFormulas: false })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Enriched Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => exportVlookupResultExcel(result, { includeFormulas: true })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                title="Exports workbook with live Excel formulas and embedded Reference Sheet"
              >
                <Download className="h-4 w-4" />
                <span>Export with Live Formulas</span>
              </button>

              {result.summary.unmatchedCount > 0 && (
                <button
                  onClick={() => exportVlookupResultExcel(result, { onlyUnmatched: true })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                  title="Export only records that failed the VLOOKUP (#N/A)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export #N/A Only</span>
                </button>
              )}
            </div>
          </div>

          {/* Data Enrichment Banner & Database Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  Data Enrichment Engine (ዳታቤዝ ማበልጸጊያ)
                </div>
                <div className="text-[11px] text-amber-800">
                  Save looked-up attributes back to the master database or register missing tenant records.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {result.summary.unmatchedCount > 0 && (
                <button
                  onClick={handleAddUnmatchedToMaster}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shadow-2xs cursor-pointer"
                >
                  <FilePlus className="h-4 w-4 text-rose-600" />
                  <span>Register {result.summary.unmatchedCount} #N/A into Database</span>
                </button>
              )}

              <button
                onClick={() => setEnrichModalOpen(true)}
                disabled={result.summary.matchedCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Enrich Master Database ({result.summary.matchedCount} Matched)</span>
              </button>
            </div>
          </div>

          {/* Results Table Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Table Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 flex-wrap">
                <button
                  onClick={() => setActiveResultsTab('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    activeResultsTab === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Records ({result.summary.totalRows})
                </button>
                <button
                  onClick={() => setActiveResultsTab('matched')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    activeResultsTab === 'matched'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matched ({result.summary.matchedCount})
                </button>
                <button
                  onClick={() => setActiveResultsTab('unmatched')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    activeResultsTab === 'unmatched'
                      ? 'bg-white text-rose-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  #N/A Missing ({result.summary.unmatchedCount})
                </button>
                {result.summary.discrepanciesCount > 0 && (
                  <button
                    onClick={() => setActiveResultsTab('discrepancies')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      activeResultsTab === 'discrepancies'
                        ? 'bg-white text-amber-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Discrepancies ({result.summary.discrepanciesCount})
                  </button>
                )}
              </div>

              {/* Table Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter key, name, unit..."
                  value={resultsSearch}
                  onChange={(e) => setResultsSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Results Grid Table */}
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center border-r border-slate-800">Row</th>
                    <th className="px-3 py-2.5 border-r border-slate-800">Status</th>
                    {/* Source Table Columns */}
                    {result.sourceHeaders.map(sh => (
                      <th
                        key={sh}
                        className={`px-3 py-2.5 border-r border-slate-800 ${
                          sh === result.config.sourceKeyColumn ? 'bg-indigo-950 font-black text-indigo-300' : ''
                        }`}
                      >
                        {sh}
                        {sh === result.config.sourceKeyColumn && ' (Key)'}
                      </th>
                    ))}
                    {/* Pulled Return Columns (Highlighted in Emerald) */}
                    {result.config.returnColumns.map(rc => (
                      <th key={rc} className="px-3 py-2.5 bg-emerald-950 text-emerald-200 border-r border-slate-800 font-bold">
                        <span className="text-[9px] uppercase tracking-wider block text-emerald-400">VLOOKUP</span>
                        {rc}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={result.outputHeaders.length + 2} className="p-8 text-center text-slate-400">
                        No rows matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.slice(0, 150).map((r, idx) => (
                      <tr
                        key={r.rowIndex}
                        className={`hover:bg-indigo-50/40 transition ${
                          !r.isMatched ? 'bg-rose-50/30' : r.hasDiscrepancies ? 'bg-amber-50/30' : idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                          {r.excelRowNumber}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 whitespace-nowrap">
                          {r.isMatched ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Matched</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <AlertCircle className="h-3 w-3" />
                              <span>#N/A</span>
                            </span>
                          )}
                        </td>

                        {/* Source Column Values */}
                        {result.sourceHeaders.map(sh => (
                          <td
                            key={sh}
                            className={`px-3 py-2 border-r border-slate-100 ${
                              sh === result.config.sourceKeyColumn ? 'font-mono font-bold text-indigo-700 bg-indigo-50/30' : ''
                            }`}
                          >
                            {String(r.originalRow[sh] ?? '—')}
                          </td>
                        ))}

                        {/* Looked Up Return Values */}
                        {result.config.returnColumns.map(rc => {
                          const val = r.pulledValues[rc];
                          const isNa = !r.isMatched;
                          return (
                            <td
                              key={rc}
                              className={`px-3 py-2 border-r border-slate-100 font-medium ${
                                isNa ? 'text-rose-600 font-mono font-bold bg-rose-50/20' : 'text-slate-900 bg-emerald-50/10'
                              }`}
                              title={r.formulas[rc]}
                            >
                              {val !== undefined && val !== '' ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredRows.length > 150 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                Displaying first 150 records of {filteredRows.length}. Download the enriched Excel file to view the full dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Data Enrichment to Master Database */}
      {enrichModalOpen && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Enrich Master Database (ዳታቤዝ አበልጽግ)
                </h3>
              </div>
              <button
                onClick={() => setEnrichModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                This action will merge the looked-up information from <strong>{sourceData.fileName}</strong> into your <strong>Master Tenant Database</strong> for all <strong>{result.summary.matchedCount} matched records</strong>.
              </p>
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>Enrichment Highlights:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Attributes from source rows will be saved to tenant records.</li>
                  <li>An audit log record will be generated with timestamp and user tag.</li>
                  <li>Existing primary identifiers remain preserved.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setEnrichModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEnrichmentToMaster}
                disabled={isEnrichingMaster}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
              >
                {isEnrichingMaster ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isEnrichingMaster ? 'Enriching...' : 'Confirm & Apply Enrichment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

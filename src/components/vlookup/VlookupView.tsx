import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Square
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

export const VlookupView: React.FC = () => {
  const { newFile } = useComparison();

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
    headers: [],
    rows: []
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

  // File Input Refs
  const sourceFileRef = useRef<HTMLInputElement>(null);
  const referenceFileRef = useRef<HTMLInputElement>(null);

  // Load Live Tenants into Reference Table
  const reloadReferenceFromDatabase = () => {
    const tenants = tenantDb.getTenants();
    if (tenants.length > 0) {
      const sample = tenants[0];
      const headers = Object.keys(sample).filter(k => k !== 'rawFields');
      setReferenceData({
        fileName: `Master Tenant Database (${tenants.length} properties)`,
        sheetName: 'Master_Registry',
        headers,
        rows: tenants
      });
      // Auto-set reference key to identifier_code or tenantCode
      if (headers.includes('identifier_code')) setReferenceKeyCol('identifier_code');
      else if (headers.includes('tenantCode')) setReferenceKeyCol('tenantCode');
    } else {
      // Benchmark fallback if local database has 0 records
      const fallbackRows = [
        { identifier_code: 'ETH-AA-B1-001', tenant_name: 'አቶ አበበ ከበደ', sub_city: 'ቦሌ', house_number: 'HN-101', historical_use: 'መኖሪያ ቤት', rent_amount: 5000, work_status: 'Active' },
        { identifier_code: 'ETH-AA-B1-002', tenant_name: 'ወ/ሮ ትዕግስት ኃይሌ', sub_city: 'ቦሌ', house_number: 'HN-102', historical_use: 'የድርጅት ቤት', rent_amount: 7500, work_status: 'Active' },
        { identifier_code: 'ETH-AA-B1-003', tenant_name: 'ዶ/ር ዳዊት ወልዴ', sub_city: 'ቦሌ', house_number: 'HN-103', historical_use: 'መኖሪያ ቤት', rent_amount: 4800, work_status: 'Active' },
        { identifier_code: 'ETH-AA-B2-015', tenant_name: 'አቶ ካሊድ ዑመር', sub_city: 'ቂርቆስ', house_number: 'HN-215', historical_use: 'የድርጅት ቤት', rent_amount: 12000, work_status: 'Active' },
        { identifier_code: 'ETH-AA-B3-042', tenant_name: 'ወ/ሪት ሄለን ታደሰ', sub_city: 'አራዳ', house_number: 'HN-342', historical_use: 'መኖሪያ ቤት', rent_amount: 6000, work_status: 'Active' },
        { identifier_code: 'ETH-AA-B4-088', tenant_name: 'አቶ ሳሙኤል ተፈራ', sub_city: 'ልደታ', house_number: 'HN-488', historical_use: 'የድርጅት ቤት', rent_amount: 9500, work_status: 'Active' }
      ];
      setReferenceData({
        fileName: 'Master Registry (Sample Fallback)',
        sheetName: 'Master_Registry',
        headers: Object.keys(fallbackRows[0]),
        rows: fallbackRows
      });
      setReferenceKeyCol('identifier_code');
    }
  };

  useEffect(() => {
    reloadReferenceFromDatabase();

    const unsub = tenantDb.subscribe(() => {
      if (referenceSourceType === 'database') {
        reloadReferenceFromDatabase();
      }
    });
    return () => unsub();
  }, [referenceSourceType]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-Match Key Columns intelligently
  const handleAutoDetectKeys = () => {
    const sHeaders = sourceData.headers;
    const rHeaders = referenceData.headers;

    let bestSource = sHeaders[0] || '';
    let bestRef = rHeaders[0] || '';

    // Check code matches
    const codeCandidates = ['tenant_code', 'tenantcode', 'identifier', 'identifier_code', 'code', 'መለያ', 'የተከራይ_መለያ'];
    for (const sh of sHeaders) {
      const clean = sh.toLowerCase().replace(/[\s\-_]+/g, '');
      if (codeCandidates.some(c => clean.includes(c))) {
        bestSource = sh;
        break;
      }
    }

    for (const rh of rHeaders) {
      const clean = rh.toLowerCase().replace(/[\s\-_]+/g, '');
      if (clean === 'identifiercode' || clean === 'tenantcode' || clean === 'መለያ') {
        bestRef = rh;
        break;
      }
    }

    setSourceKeyCol(bestSource);
    setReferenceKeyCol(bestRef);
    showToast(`ቁልፎች በራስ-ሰር ተገናኝተዋል: "${bestSource}" ↔ "${bestRef}"`);
  };

  // Run the VLOOKUP
  const handleExecuteVlookup = () => {
    if (!sourceKeyCol || !referenceKeyCol) {
      alert('እባክዎ ሁለቱንም የማገናኛ ቁልፎች (Lookup Keys) ይምረጡ!');
      return;
    }
    if (selectedReturnCols.length === 0) {
      alert('እባክዎ ቢያንስ አንድ የሚመለስ አምድ (Return Column) ይምረጡ!');
      return;
    }

    setIsExecuting(true);
    setTimeout(() => {
      const config: VlookupConfig = {
        sourceFileName: sourceData.fileName,
        referenceFileName: referenceData.fileName,
        sourceKeyColumn: sourceKeyCol,
        referenceKeyColumn: referenceKeyCol,
        returnColumns: selectedReturnCols,
        matchMode,
        naHandling,
        customNaValue: naHandling === 'custom' ? customNaValue : undefined,
        formulaType,
        referenceSheetName: referenceData.sheetName || 'Master'
      };

      const res = executeVlookup(sourceData.rows, referenceData.rows, config);
      setResult(res);
      setIsExecuting(false);
      showToast(`VLOOKUP ተጠናቋል! ${res.summary.matchedCount} ተገናኝተዋል (${res.summary.matchRatePercent}%)`);
    }, 200);
  };

  // Run immediately on initial load with sample preset
  useEffect(() => {
    if (sourceData.rows.length > 0 && referenceData.rows.length > 0 && !result) {
      handleExecuteVlookup();
    }
  }, [referenceData.rows]);

  // Load Source File from Upload
  const handleSourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      setSourceData({
        fileName: file.name,
        headers: parsed.headers,
        rows: parsed.rows
      });
      if (parsed.headers.length > 0) {
        setSourceKeyCol(parsed.headers[0]);
      }
      showToast(`የምንጭ ሰነድ ተጭኗል: ${file.name} (${parsed.rows.length} ረድፎች)`);
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
      setReferenceData({
        fileName: file.name,
        sheetName: 'Reference',
        headers: parsed.headers,
        rows: parsed.rows
      });
      if (parsed.headers.length > 0) {
        setReferenceKeyCol(parsed.headers[0]);
        setSelectedReturnCols(parsed.headers.slice(1, 6));
      }
      showToast(`የማጣቀሻ ሰነድ ተጭኗል: ${file.name} (${parsed.rows.length} ረድፎች)`);
    } catch (err: any) {
      alert(err.message || 'ማጣቀሻ ፋይሉን መጫን አልተቻለም');
    }
  };

  // Load Presets
  const loadPreset = (type: 'bank' | 'utility') => {
    if (type === 'bank') {
      setSourceData({
        fileName: 'Bank_Payments_Collection.xlsx',
        headers: Object.keys(SAMPLE_BANK_PAYMENTS[0]),
        rows: SAMPLE_BANK_PAYMENTS
      });
      setSourceKeyCol('Tenant_Code');
      setReferenceKeyCol('identifier_code');
      setSelectedReturnCols(['tenant_name', 'sub_city', 'house_number', 'rent_amount']);
    } else {
      setSourceData({
        fileName: 'Utility_Meters_Audit.xlsx',
        headers: Object.keys(SAMPLE_UTILITY_INSPECTION[0]),
        rows: SAMPLE_UTILITY_INSPECTION
      });
      setSourceKeyCol('House_No');
      setReferenceKeyCol('house_number');
      setSelectedReturnCols(['tenant_name', 'sub_city', 'historical_use', 'rent_amount', 'work_status']);
    }
    showToast('የሙከራ ናሙና መረጃ ተጭኗል');
  };

  // Copy formula to clipboard
  const handleCopyFormula = () => {
    if (!result?.sampleFormula) return;
    navigator.clipboard.writeText(result.sampleFormula);
    setCopiedFormula(true);
    showToast('ፎርሙላው ወደ ቅንጥብ ሰሌዳ ተገልብጧል (Formula copied to clipboard!)');
    setTimeout(() => setCopiedFormula(false), 2000);
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
              <span>Instant Lookup</span>
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
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                {sourceData.fileName}
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">
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
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                {referenceData.fileName}
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">
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

          <div className="flex items-center gap-2">
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
        <div className="flex flex-wrap gap-2 pt-1">
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
              {matchMode === 'fuzzy' && 'Matches names or codes with up to 80% similarity.'}
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
              <option value="VLOOKUP">Classic =VLOOKUP(...) with IFERROR</option>
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
            onClick={handleExecuteVlookup}
            disabled={isExecuting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Matching...' : 'Run VLOOKUP Matcher (ቪሉካፕ አከናውን)'}</span>
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

          {/* Results Table Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Table Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1">
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
                    {/* Pulled Return Columns (Highlighted in Purple/Emerald) */}
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
    </div>
  );
};

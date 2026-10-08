import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Settings2,
  Download,
  Trash2,
  Check,
  ChevronDown,
  Search,
  Building2,
  User,
  Home,
  Layers,
  Compass,
  RotateCcw,
  Tag,
  X,
  Table,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Code2
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { parseExcelFile } from '@/src/lib/excel/excelParser';
import { detectColumnMapping } from '@/src/lib/excel/columnDetector';
import { ParsedExcelFile, ColumnMapping } from '@/src/types/tenant';
import { exportBlankRegistryTemplateExcel } from '@/src/lib/excel/excelExporter';
import {
  PROPERTY_REGISTRY_COLUMNS,
  PRESETS_DATABASE_STRUCTURE,
  DBColumnDefinition
} from '@/src/lib/excel/databaseColumnMapping';

const DATABASE_COLUMNS = PROPERTY_REGISTRY_COLUMNS;

export const UploadView: React.FC = () => {
  const {
    masterFile,
    newFile,
    masterColumnMapping,
    setMasterParsedFile,
    setNewParsedFile,
    useLiveMasterFromDatabase,
    updateMasterMapping,
    setFullMasterMapping,
    updateNewMapping,
    setFullNewMapping,
    resetMasterMappingToPreset,
    executeComparison,
    navigate
  } = useComparison();

  const [masterLoading, setMasterLoading] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);

  // Column mapping modal state
  const [mappingModalTarget, setMappingModalTarget] = useState<'master' | 'new' | null>(null);
  const [mappingCategoryTab, setMappingCategoryTab] = useState<'all' | 'hierarchy' | 'occupant' | 'structure' | 'grading' | 'spatial'>('all');
  const [mappingSearch, setMappingSearch] = useState('');
  const [showQuickSchemaDrawer, setShowQuickSchemaDrawer] = useState(false);
  const [exportJsonSuccess, setExportJsonSuccess] = useState(false);
  const [customHeaderInputs, setCustomHeaderInputs] = useState<Record<string, string>>({});
  const [showCustomInputFor, setShowCustomInputFor] = useState<string | null>(null);

  const masterInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const handleMasterFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMasterLoading(true);
    setMasterError(null);
    try {
      const parsed = await parseExcelFile(file);
      setMasterParsedFile(parsed);
      if (!parsed.isTenantCodeDetected) {
        setMappingModalTarget('master');
      }
    } catch (err: any) {
      setMasterError(err.message || 'Unable to parse spreadsheet file.');
    } finally {
      setMasterLoading(false);
    }
  };

  const handleNewFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewLoading(true);
    setNewError(null);
    try {
      const parsed = await parseExcelFile(file);
      setNewParsedFile(parsed);
      if (!parsed.isTenantCodeDetected) {
        setMappingModalTarget('new');
      }
    } catch (err: any) {
      setNewError(err.message || 'Unable to parse spreadsheet file.');
    } finally {
      setNewLoading(false);
    }
  };

  // Drag and drop handlers for Master
  const [masterDragOver, setMasterDragOver] = useState(false);
  const handleMasterDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setMasterDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setMasterLoading(true);
    setMasterError(null);
    try {
      const parsed = await parseExcelFile(file);
      setMasterParsedFile(parsed);
      if (!parsed.isTenantCodeDetected) {
        setMappingModalTarget('master');
      }
    } catch (err: any) {
      setMasterError(err.message || 'Unable to parse spreadsheet file.');
    } finally {
      setMasterLoading(false);
    }
  };

  // Drag and drop handlers for New
  const [newDragOver, setNewDragOver] = useState(false);
  const handleNewDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setNewDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setNewLoading(true);
    setNewError(null);
    try {
      const parsed = await parseExcelFile(file);
      setNewParsedFile(parsed);
      if (!parsed.isTenantCodeDetected) {
        setMappingModalTarget('new');
      }
    } catch (err: any) {
      setNewError(err.message || 'Unable to parse spreadsheet file.');
    } finally {
      setNewLoading(false);
    }
  };

  const handleCompareClick = () => {
    if (!masterFile || !newFile) return;
    if (!masterFile.isTenantCodeDetected) {
      setMappingModalTarget('master');
      return;
    }
    if (!newFile.isTenantCodeDetected) {
      setMappingModalTarget('new');
      return;
    }
    const success = executeComparison();
    if (success) {
      navigate('compare');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const targetFileForMapping = useMemo(() => {
    if (mappingModalTarget === 'master') {
      if (masterFile) return masterFile;
      const expectedHeaders = Array.from(
        new Set(Object.values(masterColumnMapping).filter(Boolean) as string[])
      );
      return {
        fileName: 'Master Spreadsheet (Configure mapping before upload)',
        fileSize: 0,
        fileSizeBytes: 0,
        headers: expectedHeaders.length > 0 ? expectedHeaders : PROPERTY_REGISTRY_COLUMNS.map((c) => c.dbColumn),
        rows: [],
        totalRows: 0,
        detectedMapping: masterColumnMapping,
        isTenantCodeDetected: Boolean(masterColumnMapping.tenantCode || masterColumnMapping.identifierCode)
      } as ParsedExcelFile;
    }
    return newFile;
  }, [mappingModalTarget, masterFile, newFile, masterColumnMapping]);

  // Extract sample values from uploaded spreadsheet for visual verification
  const getSampleValues = (colName?: string, max = 3): string[] => {
    if (!colName || !targetFileForMapping || !targetFileForMapping.rows || targetFileForMapping.rows.length === 0) {
      return [];
    }
    const samples: string[] = [];
    for (const row of targetFileForMapping.rows) {
      const val = row[colName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        if (!samples.includes(strVal)) {
          samples.push(strVal);
          if (samples.length >= max) break;
        }
      }
    }
    return samples;
  };

  // Filter database columns in modal by search and category
  const filteredModalColumns = useMemo(() => {
    return DATABASE_COLUMNS.filter((col) => {
      if (mappingCategoryTab !== 'all' && col.category !== mappingCategoryTab) {
        return false;
      }
      if (mappingSearch.trim()) {
        const q = mappingSearch.toLowerCase().trim();
        const enMatch = col.labelEn.toLowerCase().includes(q);
        const amMatch = col.labelAm.toLowerCase().includes(q);
        const dbMatch = col.dbColumn.toLowerCase().includes(q);
        const keyMatch = col.key.toLowerCase().includes(q);
        const typeMatch = col.sqlType.toLowerCase().includes(q);
        const catMatch = col.categoryLabel.toLowerCase().includes(q);
        if (!enMatch && !amMatch && !dbMatch && !keyMatch && !typeMatch && !catMatch) return false;
      }
      return true;
    });
  }, [mappingCategoryTab, mappingSearch]);

  // Count mapped columns
  const mappedCount = useMemo(() => {
    if (!targetFileForMapping) return 0;
    const mapping = targetFileForMapping.detectedMapping as any;
    let count = 0;
    DATABASE_COLUMNS.forEach((col) => {
      if (mapping[col.key] || (col.key === 'tenantCode' && mapping.identifierCode)) {
        count++;
      }
    });
    return count;
  }, [targetFileForMapping]);

  // Master mapped count for Step 1 card badge
  const masterMappedCount = useMemo(() => {
    const mapping = (masterFile ? masterFile.detectedMapping : masterColumnMapping) as any;
    let count = 0;
    DATABASE_COLUMNS.forEach((col) => {
      if (mapping[col.key] || (col.key === 'tenantCode' && mapping.identifierCode)) {
        count++;
      }
    });
    return count;
  }, [masterFile, masterColumnMapping]);

  // Handle Preset Selection
  const handleApplyPreset = (presetKey: 'sqlDirect' | 'amharicCadastral' | 'propertyErp') => {
    if (mappingModalTarget === 'master') {
      resetMasterMappingToPreset(presetKey);
    } else {
      const preset = PRESETS_DATABASE_STRUCTURE[presetKey]?.mapping;
      if (preset) setFullNewMapping(preset);
    }
  };

  // Export JSON preset
  const handleExportMappingJson = () => {
    if (!targetFileForMapping) return;
    const mapping = targetFileForMapping.detectedMapping;
    const blob = new Blob([JSON.stringify(mapping, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mappingModalTarget || 'master'}_property_registry_mapping.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportJsonSuccess(true);
    setTimeout(() => setExportJsonSuccess(false), 2500);
  };

  // Handle Auto-Detect button in modal
  const handleAutoDetectModal = () => {
    if (!targetFileForMapping || targetFileForMapping.headers.length === 0) return;
    const detected = detectColumnMapping(targetFileForMapping.headers);
    if (mappingModalTarget === 'master') {
      setFullMasterMapping(detected.mapping);
    } else {
      setFullNewMapping(detected.mapping);
    }
  };

  // Handle Clear button in modal
  const handleClearModal = () => {
    if (!targetFileForMapping) return;
    DATABASE_COLUMNS.forEach((col) => {
      if (!col.required) {
        if (mappingModalTarget === 'master') {
          updateMasterMapping(col.key, '');
        } else {
          updateNewMapping(col.key, '');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span>Automated Excel Reconciliation Engine</span>
            <span>·</span>
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              STRUCTURE: property_registry
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Upload & Reconcile Lists
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Upload the Master Property/Tenant File and the Latest External Update File. The reconciliation engine maps columns to the standard <code className="font-mono text-indigo-600">property_registry</code> structure by unique Identifier Code (መለያ).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('vlookup')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Open VLOOKUP Automator (ቪሉካፕ)</span>
          </button>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================= Master Tenant List Uploader ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 1</span>
                <h2 className="text-base font-bold text-slate-900">Master Property & Tenant List</h2>
                <p className="text-xs text-slate-500">The authoritative master registry (Baseline file)</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setMappingModalTarget('master')}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/90 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-xs cursor-pointer"
                  title="Configure and edit Master File Column Mapping based on property registry structure"
                >
                  <Settings2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Edit Column Mapping</span>
                </button>
                <button
                  onClick={useLiveMasterFromDatabase}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Use all current active property records as master"
                >
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Use Stored Records</span>
                </button>
              </div>
            </div>

            {/* Dropzone or Uploaded Summary */}
            <div className="mt-5">
              {!masterFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setMasterDragOver(true);
                  }}
                  onDragLeave={() => setMasterDragOver(false)}
                  onDrop={handleMasterDrop}
                  onClick={() => masterInputRef.current?.click()}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                    masterDragOver
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={masterInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleMasterFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-slate-800">
                    Click to select Master Spreadsheet or drag & drop
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Supports .xlsx, .xls, .csv (Headers mapped to property_registry)
                  </div>
                  {masterLoading && (
                    <div className="mt-2 text-xs font-medium text-emerald-600 animate-pulse">
                      Parsing spreadsheet structure...
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span>✓ {masterFile.fileName}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-emerald-800">
                            {masterFile.totalRows.toLocaleString()} records
                          </span>
                          <span>·</span>
                          <span>{masterFile.headers.length} columns</span>
                          <span>·</span>
                          <span>{formatFileSize(masterFile.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setMasterParsedFile(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Detection Status & Schema Mapping Summary */}
                  <div className="mt-3.5 border-t border-emerald-100 pt-3 text-xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {masterFile.isTenantCodeDetected ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-slate-700">
                              Identifier (መለያ) mapped to: <strong className="font-semibold text-slate-900">"{masterFile.detectedMapping.tenantCode}"</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span className="text-amber-800 font-medium">
                              Identifier Code (መለያ) not detected automatically
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowQuickSchemaDrawer(!showQuickSchemaDrawer)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Table className="h-3 w-3 text-slate-500" />
                          <span>{showQuickSchemaDrawer ? 'Hide Schema Map' : 'Quick Schema Map'}</span>
                        </button>
                        <button
                          onClick={() => setMappingModalTarget('master')}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-700"
                        >
                          <Settings2 className="h-3 w-3 text-white" />
                          <span>Edit Column Mapping</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/70">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">
                          REGISTRY: property_registry
                        </span>
                        <span>{masterMappedCount} of 35 fields mapped</span>
                      </div>
                      <span className="text-emerald-800 font-semibold">
                        {Math.round((masterMappedCount / 35) * 100)}% coverage
                      </span>
                    </div>

                    {showQuickSchemaDrawer && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Table className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Property Registry (property_registry) Mapping Overview</span>
                          </span>
                          <button
                            onClick={() => setMappingModalTarget('master')}
                            className="text-[10px] font-semibold text-indigo-600 hover:underline"
                          >
                            Edit in Full Modal →
                          </button>
                        </div>
                        <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                          {DATABASE_COLUMNS.map((col) => {
                            const mapped = (masterFile.detectedMapping as any)[col.key] || (col.key === 'tenantCode' ? (masterFile.detectedMapping as any).identifierCode : '');
                            return (
                              <div key={col.key} className="py-1.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-mono text-[10px] text-indigo-700 font-semibold">{col.dbColumn}</span>
                                  <span className="text-slate-500 font-medium">({col.labelAm})</span>
                                  <span className="text-[9px] text-slate-400 font-mono">{col.sqlType}</span>
                                </div>
                                <div className="shrink-0">
                                  {mapped ? (
                                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                      ← "{mapped}"
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">(Unmapped)</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {masterError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{masterError}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
            <span>Standard: property_registry.xlsx</span>
            <button
              onClick={exportBlankRegistryTemplateExcel}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium"
            >
              <Download className="h-3 w-3" />
              <span>Download blank template (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ================= New / Latest Tenant List Uploader ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 2</span>
                <h2 className="text-base font-bold text-slate-900">Latest Property & Tenant Update</h2>
                <p className="text-xs text-slate-500">The update file downloaded from external sources</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Any Excel / CSV
              </span>
            </div>

            {/* Dropzone or Uploaded Summary */}
            <div className="mt-5">
              {!newFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setNewDragOver(true);
                  }}
                  onDragLeave={() => setNewDragOver(false)}
                  onDrop={handleNewDrop}
                  onClick={() => newInputRef.current?.click()}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                    newDragOver
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={newInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleNewFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-slate-800">
                    Click to select Latest Spreadsheet or drag & drop
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Supports .xlsx, .xls, .csv (Headers mapped to property_registry)
                  </div>
                  {newLoading && (
                    <div className="mt-2 text-xs font-medium text-indigo-600 animate-pulse">
                      Parsing spreadsheet structure...
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span>✓ {newFile.fileName}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-indigo-900">
                            {newFile.totalRows.toLocaleString()} records
                          </span>
                          <span>·</span>
                          <span>{newFile.headers.length} columns</span>
                          <span>·</span>
                          <span>{formatFileSize(newFile.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setNewParsedFile(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Detection Status */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-indigo-100 pt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      {newFile.isTenantCodeDetected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-slate-700">
                            Identifier (መለያ) mapped to: <strong className="font-semibold text-slate-900">"{newFile.detectedMapping.tenantCode}"</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-800 font-medium">
                            Identifier Code (መለያ) column not detected automatically
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setMappingModalTarget('new')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Edit Column Mapping</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {newError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{newError}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
            <span>External system or branch office export</span>
            <span className="text-slate-500">Supports .xlsx, .xls, .csv</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="text-sm font-bold text-slate-900">
            Ready to Reconcile Property Records?
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {masterFile && newFile
              ? `Ready to match ${masterFile.totalRows} master records against ${newFile.totalRows} incoming records.`
              : 'Please upload both files above or click "Load Demo Data Pair".'}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCompareClick}
            disabled={!masterFile || !newFile}
            className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-semibold shadow-xs transition ${
              masterFile && newFile
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Compare & Reconcile Lists</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ================= Master / Latest File Column Mapping Modal (Registry Structure Based) ================= */}
      {mappingModalTarget && targetFileForMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {mappingModalTarget === 'master' ? 'Master File' : 'Latest File'} Column Mapping
                  </h3>
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-700">
                    Standard Property Registry Fields
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Map spreadsheet columns from <span className="font-semibold text-slate-800">"{targetFileForMapping.fileName}"</span> ({targetFileForMapping.headers.length} available headers) to the official property registry fields.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setMappingModalTarget(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Presets & Controls Bar */}
            <div className="py-3 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Schema Mapping Presets:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={handleAutoDetectModal}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-2xs"
                    title="Run heuristic alias matching against uploaded headers"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    <span>Auto-Detect</span>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('sqlDirect')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                    title="Map 1:1 to exact standard column names (identifier_code, sub_city, etc.)"
                  >
                    <Table className="h-3 w-3 text-slate-500" />
                    <span>Standard Fields</span>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('amharicCadastral')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                    title="Map standard Ethiopian Cadastral Amharic headers (መለያ, ከተማ, ክ/ከተማ, etc.)"
                  >
                    <Building2 className="h-3 w-3 text-slate-500" />
                    <span>Amharic Cadastre</span>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('propertyErp')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                    title="Map standard English property system columns (Tenant Code, Unit, Branch, etc.)"
                  >
                    <Layers className="h-3 w-3 text-slate-500" />
                    <span>Commercial ERP</span>
                  </button>
                  <button
                    onClick={handleClearModal}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 shadow-2xs"
                    title="Reset all non-primary key mappings"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-400" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Search in modal */}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search registry fields (e.g. identifier_code, መለያ, rent, area)..."
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {mappingSearch && (
                    <button
                      onClick={() => setMappingSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Columns', count: 35 },
                  { id: 'hierarchy', label: '1. Administrative Hierarchy', count: 7 },
                  { id: 'occupant', label: '2. Occupants', count: 6 },
                  { id: 'structure', label: '3. Structure & Rooms', count: 8 },
                  { id: 'grading', label: '4. Cadastre & Rent', count: 10 },
                  { id: 'spatial', label: '5. Spatial GIS', count: 4 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMappingCategoryTab(tab.id as any)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                      mappingCategoryTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Mapped Count Progress Banner */}
            <div className="py-2 px-3 bg-slate-50 rounded-xl my-2 text-xs flex items-center justify-between text-slate-600 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {mappedCount} of 35 fields mapped
                </span>
                <span className="font-medium text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {Math.round((mappedCount / 35) * 100)}% field coverage
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {targetFileForMapping.headers.length} spreadsheet headers detected
              </div>
            </div>

            {/* Columns Mapping List based on registry structure */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {filteredModalColumns.map((col) => {
                const currentMappedCol =
                  (targetFileForMapping.detectedMapping as any)[col.key] ||
                  (col.key === 'tenantCode' ? (targetFileForMapping.detectedMapping as any).identifierCode : '') ||
                  '';

                const isRequiredKey = Boolean(col.required);
                const sampleValues = getSampleValues(currentMappedCol, 3);
                const isCustomMode = showCustomInputFor === col.key;

                return (
                  <div
                    key={col.key}
                    className={`rounded-xl border p-3 transition ${
                      isRequiredKey
                        ? 'border-indigo-300 bg-indigo-50/40'
                        : currentMappedCol
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {col.labelAm} ({col.labelEn})
                          </span>
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            property_registry.{col.dbColumn}
                          </span>
                          <span className="font-mono text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {col.sqlType}
                          </span>
                          {col.sqlConstraint === 'PRIMARY KEY' && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                              PRIMARY KEY UNIQUE *
                            </span>
                          )}
                          {col.sqlConstraint === 'NOT NULL' && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                              NOT NULL *
                            </span>
                          )}
                          {col.sqlConstraint === 'DEFAULT 0' && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                              DEFAULT 0
                            </span>
                          )}
                          {currentMappedCol && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Mapped
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500 leading-tight">
                          {col.hint}
                        </div>

                        {/* Live Sample Preview */}
                        {currentMappedCol && (
                          <div className="mt-2.5 flex items-center gap-2 text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                            <span className="font-semibold text-slate-500 shrink-0 text-[10px] uppercase tracking-wider">
                              Master Data Preview:
                            </span>
                            {sampleValues.length > 0 ? (
                              <div className="flex items-center gap-1.5 overflow-x-auto text-slate-800 font-mono text-[10px]">
                                {sampleValues.map((val, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-slate-800 shadow-2xs truncate max-w-[160px]"
                                    title={val}
                                  >
                                    "{val}"
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">
                                No preview rows loaded (will match column "{currentMappedCol}" upon upload)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Header Select Dropdown & Custom Input */}
                      <div className="w-full sm:w-72 shrink-0 space-y-1.5">
                        {isCustomMode ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Type exact column header..."
                              value={customHeaderInputs[col.key] ?? currentMappedCol}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomHeaderInputs({ ...customHeaderInputs, [col.key]: val });
                                if (mappingModalTarget === 'master') {
                                  updateMasterMapping(col.key, val);
                                } else {
                                  updateNewMapping(col.key, val);
                                }
                              }}
                              className="w-full rounded-lg border border-indigo-400 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => setShowCustomInputFor(null)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
                              title="Switch back to dropdown"
                            >
                              List
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={currentMappedCol}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__CUSTOM__') {
                                  setShowCustomInputFor(col.key);
                                  return;
                                }
                                if (mappingModalTarget === 'master') {
                                  updateMasterMapping(col.key, val);
                                } else {
                                  updateNewMapping(col.key, val);
                                }
                              }}
                              className={`w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                                currentMappedCol
                                  ? 'border-emerald-400 bg-white text-emerald-950 font-semibold'
                                  : 'border-slate-200 bg-white text-slate-500'
                              }`}
                            >
                              <option value="">(None / Do Not Map)</option>
                              {currentMappedCol && !targetFileForMapping.headers.includes(currentMappedCol) && (
                                <option value={currentMappedCol}>
                                  ✓ Custom: {currentMappedCol}
                                </option>
                              )}
                              {targetFileForMapping.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                              <option value="__CUSTOM__">✏️ Custom column name...</option>
                            </select>

                            {currentMappedCol && (
                              <button
                                onClick={() => {
                                  if (mappingModalTarget === 'master') {
                                    updateMasterMapping(col.key, '');
                                  } else {
                                    updateNewMapping(col.key, '');
                                  }
                                }}
                                className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 flex items-center justify-center shrink-0"
                                title="Clear column mapping"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 gap-3">
              <div className="text-[11px] text-slate-500">
                {targetFileForMapping.isTenantCodeDetected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valid: Primary Identifier Code (መለያ) is mapped.
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Please map Identifier Code (መለያ) to proceed with reconciliation.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMappingJson}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                  title="Download JSON mapping definition"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>{exportJsonSuccess ? 'Exported!' : 'Export JSON'}</span>
                </button>
                <button
                  onClick={() => setMappingModalTarget(null)}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Done & Save Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

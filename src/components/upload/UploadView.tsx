import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
  Settings2,
  Download,
  Trash2,
  Check,
  ChevronDown
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { parseExcelFile } from '@/src/lib/excel/excelParser';
import { ParsedExcelFile } from '@/src/types/tenant';
import {
  downloadDemoMasterExcel,
  downloadDemoNewSystemExcel
} from '@/src/lib/excel/demoDataGenerator';

export const UploadView: React.FC = () => {
  const {
    masterFile,
    newFile,
    setMasterParsedFile,
    setNewParsedFile,
    useLiveMasterFromDatabase,
    updateMasterMapping,
    updateNewMapping,
    executeComparison,
    loadDemoComparison,
    navigate
  } = useComparison();

  const [masterLoading, setMasterLoading] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);

  // Column mapping modal state
  const [mappingModalTarget, setMappingModalTarget] = useState<'master' | 'new' | null>(null);

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

  const targetFileForMapping = mappingModalTarget === 'master' ? masterFile : newFile;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Automated Excel Reconciliation
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Upload Tenant Lists
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Upload your existing Master Tenant List and the latest file downloaded from your property management system. The engine automatically matches records by Tenant Code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadDemoComparison();
              navigate('compare');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="h-4 w-4" />
            <span>Load Demo Data Pair</span>
          </button>
        </div>
      </div>

      {/* Two Upload Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================= Master Tenant List Uploader ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                <h2 className="text-base font-bold text-slate-900">Master Tenant List</h2>
                <p className="text-xs text-slate-500">The current baseline tenant database</p>
              </div>
              <button
                onClick={useLiveMasterFromDatabase}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                title="Use the 100 live tenants already stored in the system"
              >
                <Database className="h-3.5 w-3.5 text-indigo-600" />
                <span>Use Current Master DB</span>
              </button>
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
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={masterInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleMasterFileSelect}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-slate-800">
                    {masterLoading ? 'Reading spreadsheet...' : 'Click to upload or drag & drop Master'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Supports .xlsx, .xls, and .csv files
                  </div>
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

                  {/* Detection Status */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-emerald-100 pt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      {masterFile.isTenantCodeDetected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-slate-700">
                            Tenant Code mapped to: <strong className="font-semibold text-slate-900">"{masterFile.detectedMapping.tenantCode}"</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-800 font-medium">
                            Tenant Code column not detected automatically
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setMappingModalTarget('master')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Edit Mapping</span>
                    </button>
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

          <div className="mt-4 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Example: tenant_master.xlsx</span>
            <button
              onClick={downloadDemoMasterExcel}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600"
            >
              <Download className="h-3 w-3" />
              <span>Download sample master</span>
            </button>
          </div>
        </div>

        {/* ================= New / Latest Tenant List Uploader ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 2</span>
                <h2 className="text-base font-bold text-slate-900">Latest Tenant List</h2>
                <p className="text-xs text-slate-500">The latest file downloaded from the external system</p>
              </div>
              <button
                onClick={downloadDemoNewSystemExcel}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Sample Export</span>
              </button>
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
                    className="hidden"
                    onChange={handleNewFileSelect}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-slate-800">
                    {newLoading ? 'Reading spreadsheet...' : 'Click to upload or drag & drop Latest Export'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Supports .xlsx, .xls, and .csv files
                  </div>
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
                            Tenant Code mapped to: <strong className="font-semibold text-slate-900">"{newFile.detectedMapping.tenantCode}"</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-800 font-medium">
                            Tenant Code column not detected automatically
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setMappingModalTarget('new')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Edit Mapping</span>
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

          <div className="mt-4 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Example: tenant_list_2026-10-02.xlsx</span>
            <span className="text-slate-400">Contains new leases, renewals & updates</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 3</div>
          <div className="text-sm font-bold text-slate-900">Ready to Match & Compare?</div>
          <div className="text-xs text-slate-500">
            {masterFile && newFile
              ? `Ready to match ${masterFile.totalRows.toLocaleString()} master records against ${newFile.totalRows.toLocaleString()} external records.`
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
            <span>Compare Tenant Lists</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Column Selection / Mapping Interface (Requirement 7) */}
      {mappingModalTarget && targetFileForMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {mappingModalTarget === 'master' ? 'Master File' : 'Latest File'} Column Mapping
                </h3>
                <p className="text-xs text-slate-500">
                  Select which column corresponds to Tenant Code and common fields
                </p>
              </div>
              <button
                onClick={() => setMappingModalTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Primary Tenant Code Column (Required) */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
                <label className="block text-xs font-bold text-indigo-950">
                  Tenant Code Column <span className="text-rose-500">* (Required Unique Identifier)</span>
                </label>
                <div className="mt-1 text-[11px] text-indigo-700">
                  Identifies the tenant across both lists (e.g. T001, Tenant ID, Code)
                </div>
                <select
                  value={targetFileForMapping.detectedMapping.tenantCode || ''}
                  onChange={(e) => {
                    if (mappingModalTarget === 'master') {
                      updateMasterMapping('tenantCode', e.target.value);
                    } else {
                      updateNewMapping('tenantCode', e.target.value);
                    }
                  }}
                  className="mt-2 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Column --</option>
                  {targetFileForMapping.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Fields */}
              <div className="space-y-3 pt-2">
                {[
                  { key: 'tenantName', label: 'Tenant Name Column', hint: 'Name, Company Name, Shop Name' },
                  { key: 'unit', label: 'Unit / Space Column', hint: 'Unit, Shop Number, Suite' },
                  { key: 'status', label: 'Status Column', hint: 'Active, Inactive, Status' },
                  { key: 'phone', label: 'Phone Column', hint: 'Phone, Mobile, Telephone' },
                  { key: 'email', label: 'Email Column', hint: 'Email, Contact Email' },
                  { key: 'branch', label: 'Branch / Location Column', hint: 'Building, Property' },
                  { key: 'rent', label: 'Rent Column', hint: 'Base Rent, Monthly Rent' },
                  { key: 'contractStart', label: 'Contract Start Column', hint: 'Start Date, Lease Start' },
                  { key: 'contractEnd', label: 'Contract End Column', hint: 'End Date, Lease End' }
                ].map(({ key, label, hint }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800">{label}</div>
                      <div className="text-[10px] text-slate-400">{hint}</div>
                    </div>
                    <select
                      value={(targetFileForMapping.detectedMapping as any)[key] || ''}
                      onChange={(e) => {
                        if (mappingModalTarget === 'master') {
                          updateMasterMapping(key, e.target.value);
                        } else {
                          updateNewMapping(key, e.target.value);
                        }
                      }}
                      className="w-48 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">(None / Automatic)</option>
                      {targetFileForMapping.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setMappingModalTarget(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

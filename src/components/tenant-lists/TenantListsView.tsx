import React, { useState } from 'react';
import {
  FolderKanban,
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import {
  downloadDemoMasterExcel,
  downloadDemoNewSystemExcel
} from '@/src/lib/excel/demoDataGenerator';
import { exportUpdatedMasterExcel } from '@/src/lib/excel/excelExporter';

export const TenantListsView: React.FC = () => {
  const { navigate, loadDemoComparison } = useComparison();
  const tenants = tenantDb.getTenants();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Catalogs & File Repositories
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tenant Catalogs & Templates
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Download standard Excel templates, master database snapshots, and test datasets for reconciliation.
          </p>
        </div>

        <button
          onClick={() => exportUpdatedMasterExcel(tenants, 'Tenant_Master_Full_Catalog')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <Download className="h-4 w-4" />
          <span>Export Current Master ({tenants.length} tenants)</span>
        </button>
      </div>

      {/* Grid of Catalog Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Live Master Database */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Database className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                Live Version
              </span>
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">Live Master Catalog</h3>
            <p className="mt-1 text-xs text-slate-500">
              The primary system master containing all active, pending, and inactive tenant contracts across all properties.
            </p>

            <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Tenants:</span>
                <span className="font-bold text-slate-900">{tenants.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-mono text-slate-700">.xlsx (Excel)</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-700">October 2, 2026</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => exportUpdatedMasterExcel(tenants, 'Master_Catalog')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              <span>Download Live Master</span>
            </button>
            <button
              onClick={() => navigate('upload')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>Reconcile against this Master</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Demo 100 Master Sample */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                Baseline Sample
              </span>
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">Sample Master File</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pre-built sample spreadsheet containing 100 commercial leases ready to be used as Step 1 upload.
            </p>

            <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="font-mono text-slate-700">tenant_master_sample.xlsx</span>
              </div>
              <div className="flex justify-between">
                <span>Columns:</span>
                <span className="text-slate-700">14 columns</span>
              </div>
              <div className="flex justify-between">
                <span>Tenant Codes:</span>
                <span className="font-mono text-slate-700">T001 - T100</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={downloadDemoMasterExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Download tenant_master_sample.xlsx</span>
            </button>
          </div>
        </div>

        {/* External System Download Sample */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60">
                With Realistic Changes
              </span>
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">External System Export Sample</h3>
            <p className="mt-1 text-xs text-slate-500">
              Spreadsheet simulating a fresh download from an external property management system with 12 new tenants, 20 updates, 10 missing, and test edge cases.
            </p>

            <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="font-mono text-slate-700">tenant_new_system_sample.xlsx</span>
              </div>
              <div className="flex justify-between">
                <span>Discrepancies:</span>
                <span className="text-amber-800 font-semibold">12 New, 20 Updated, 10 Missing</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Cases:</span>
                <span className="text-slate-700">2 Duplicates, 2 Errors</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={downloadDemoNewSystemExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Download tenant_new_system_sample.xlsx</span>
            </button>

            <button
              onClick={() => {
                loadDemoComparison();
                navigate('compare');
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Test Reconciliation in 1 Click</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  Download,
  History,
  ShieldCheck,
  Building2,
  FileBarChart
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord, UploadSession } from '@/src/types/tenant';
import { exportUpdatedMasterExcel } from '@/src/lib/excel/excelExporter';

export const DashboardView: React.FC = () => {
  const { navigate, summary, comparisonItems } = useComparison();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [lastUpdateDate, setLastUpdateDate] = useState<string>('No updates yet');

  useEffect(() => {
    const list = tenantDb.getTenants();
    setTenants(list);
    setSessions(tenantDb.getSessions());
    const rawDate = tenantDb.getLastUpdateDate();
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          setLastUpdateDate(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        }
      } catch {
        setLastUpdateDate(rawDate);
      }
    } else {
      setLastUpdateDate('No updates recorded yet');
    }
  }, []);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => (t.work_status || t.status || '').toLowerCase() === 'active').length;
  const inactiveTenants = tenants.filter(t => {
    const s = (t.work_status || t.status || '').toLowerCase();
    return s === 'inactive' || s === 'vacant';
  }).length;

  // Real reconciliation summary stats (no fake default numbers)
  const newCount = summary ? summary.newCount : 0;
  const updatedCount = summary ? summary.updatedCount : 0;
  const missingCount = summary ? summary.missingCount : 0;

  // Dynamic property / sub-city breakdown from actual master records
  const propertyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    tenants.forEach((t) => {
      const location = t.sub_city || t.branch || 'Unassigned';
      counts[location] = (counts[location] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 5);
  }, [tenants]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <Building2 className="h-4 w-4" />
              <span>Commercial Lease Management</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tenant List Updater
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Reconcile master tenant lists with external system downloads automatically. Eliminates tedious Excel VLOOKUP workflows and catches discrepancies in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('upload')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Tenant List</span>
            </button>
            <button
              onClick={() => navigate('reports')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <FileBarChart className="h-4 w-4 text-indigo-600" />
              <span>FHC Report (ቅጽ - 01)</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid (Exact spec layout) */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {/* Total Tenants */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Tenants</span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {totalTenants.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Master registry</div>
            </div>

            {/* Active Tenants */}
            <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-4 transition hover:bg-emerald-50/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Active</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-900">
                {activeTenants.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 font-medium">Occupied units</div>
            </div>

            {/* Inactive Tenants */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-100/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Inactive</span>
                <XCircle className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-700">
                {inactiveTenants.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Vacated / pending</div>
            </div>

            {/* New Tenants */}
            <div className="rounded-xl border border-indigo-100/70 bg-indigo-50/40 p-4 transition hover:bg-indigo-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-900">New</span>
                <UserPlus className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-900">
                {newCount}
              </div>
              <div className="mt-1 text-[11px] text-indigo-600 font-medium">In latest file</div>
            </div>

            {/* Updated Tenants */}
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition hover:bg-amber-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-900">Updated</span>
                <RefreshCw className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-amber-900">
                {updatedCount}
              </div>
              <div className="mt-1 text-[11px] text-amber-700 font-medium">Field changes</div>
            </div>

            {/* Missing Tenants */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 transition hover:bg-rose-50/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-800">Missing</span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-rose-900">
                {missingCount}
              </div>
              <div className="mt-1 text-[11px] text-rose-600 font-medium">Protected (Safe)</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Last Update: <strong className="font-semibold text-slate-700">{lastUpdateDate}</strong></span>
            </div>

            {summary && (
              <button
                onClick={() => navigate('review')}
                className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Current reconciliation has {comparisonItems.length} records ready for review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Reconciliation Notification Callout if present */}
      {summary && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-950">
                Reconciliation Batch Ready for Approval
              </div>
              <div className="mt-0.5 text-xs text-indigo-700">
                Master List ({summary.totalMaster} records) vs New System Export ({summary.totalNew} records).
                Found <strong>{summary.newCount} New</strong>, <strong>{summary.updatedCount} Updated</strong>, <strong>{summary.missingCount} Missing</strong>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('compare')}
              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              Summary
            </button>
            <button
              onClick={() => navigate('review')}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Review Table
            </button>
          </div>
        </div>
      )}

      {/* Quick Automated Workflow Pipeline Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          Automated End-to-End Workflow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          How Tenant List Updater automates the manual Excel / VLOOKUP process:
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { step: '1', title: 'Upload Master', desc: 'Current master list or existing master Excel file' },
            { step: '2', title: 'Upload New File', desc: 'Latest file downloaded from external property system' },
            { step: '3', title: 'Tenant Code Match', desc: 'Auto-detects code columns & uses Maps for O(n) lookups' },
            { step: '4', title: 'Detect Changes', desc: 'Flags New, Updated fields, Unchanged & Missing' },
            { step: '5', title: 'Review & Safety', desc: 'Never auto-deletes missing records; Admin chooses action' },
            { step: '6', title: 'Export Clean Excel', desc: 'Generates updated master & segmented change reports' }
          ].map((item, idx) => (
            <div
              key={item.step}
              className="relative flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/20"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    {item.step}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Step {idx + 1}</span>
                </div>
                <div className="mt-2.5 text-xs font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-[11px] text-slate-500 leading-normal">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Sessions & Quick Master Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Reconciliation Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Update Sessions</h2>
              <p className="text-xs text-slate-500">History of reconciled tenant batches</p>
            </div>
            <button
              onClick={() => navigate('history')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Full History →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No update sessions recorded yet. Run your first reconciliation!
              </div>
            ) : (
              sessions.slice(0, 5).map((sess) => (
                <div key={sess.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-900">{sess.newFileName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>vs {sess.masterFileName}</span>
                      <span>·</span>
                      <span>By {sess.appliedBy || 'Admin'}</span>
                      <span>·</span>
                      <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      +{sess.summary.newCount} New
                    </span>
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {sess.summary.updatedCount} Upd
                    </span>
                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      {sess.summary.missingCount} Mis
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Master Catalog Quick Actions */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Current Master Tenant List</h2>
            <p className="text-xs text-slate-500">Live registry state</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <div className="text-xs font-medium text-slate-500">Total Registered Tenants</div>
                <div className="text-xl font-bold text-slate-900">{totalTenants}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {propertyBreakdown.length > 0
                    ? `Spread across ${propertyBreakdown.length} sub-cities/branches`
                    : 'Awaiting master spreadsheet upload'}
                </div>
              </div>

              {propertyBreakdown.length > 0 ? (
                <div className="rounded-xl border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1.5">
                  {propertyBreakdown.map(([loc, count]) => (
                    <div key={loc} className="flex justify-between items-center">
                      <span className="truncate max-w-[150px] font-medium text-slate-700">{loc}</span>
                      <span className="font-semibold text-slate-900">{count} {count === 1 ? 'record' : 'records'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No property records loaded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => exportUpdatedMasterExcel(tenants, 'Tenant_Master_Export')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export Master as Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => navigate('tenants')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              <span>Manage Tenants Master</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

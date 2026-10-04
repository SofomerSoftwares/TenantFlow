import React, { useState } from 'react';
import {
  GitCompare,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import {
  exportNewTenantsExcel,
  exportUpdatedTenantsExcel,
  exportMissingTenantsExcel,
  exportValidationErrorsExcel
} from '@/src/lib/excel/excelExporter';

export const CompareView: React.FC = () => {
  const {
    summary,
    comparisonItems,
    masterFile,
    newFile,
    applyApprovedChanges,
    appliedSuccessSessionId,
    loadDemoComparison,
    navigate
  } = useComparison();

  const { user, canApprove, switchRole } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAdminRequiredModal, setShowAdminRequiredModal] = useState(false);

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <GitCompare className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900">No Active Comparison Ready</h2>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Upload both a Master Tenant List and a Latest Export to run the automated Tenant Code comparison.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('upload')}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Upload Files
          </button>
          <button
            onClick={loadDemoComparison}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="h-4 w-4" />
            <span>Load Demo Comparison</span>
          </button>
        </div>
      </div>
    );
  }

  const handleApproveAndUpdate = () => {
    if (!user) return;
    setIsApplying(true);
    setTimeout(() => {
      applyApprovedChanges(user);
      setIsApplying(false);
      setShowConfirmModal(false);
    }, 400);
  };

  const hasIssues = summary.duplicateCount > 0 || summary.errorCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Tenant Code Matching Engine
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Comparison Summary
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Results comparing <strong className="font-semibold text-slate-700">{masterFile?.fileName || 'Master File'}</strong> ({summary.totalMaster.toLocaleString()} records) against <strong className="font-semibold text-slate-700">{newFile?.fileName || 'Latest File'}</strong> ({summary.totalNew.toLocaleString()} records).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('review')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <span>Review Changes Table</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Applied Success Banner */}
      {appliedSuccessSessionId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Update Successfully Applied to Master Database!
                </h3>
                <p className="mt-1 text-xs text-emerald-800">
                  Batch changes have been committed. History entries created and audit logs recorded. You can now download the updated Excel master or inspect history.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('tenants')}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-xs hover:bg-emerald-50"
              >
                View Master Tenants
              </button>
              <button
                onClick={() => navigate('history')}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner if duplicates or validation errors exist */}
      {hasIssues && !appliedSuccessSessionId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Attention Required: </span>
              {summary.duplicateCount > 0 && `${summary.duplicateCount} duplicate Tenant Codes detected. `}
              {summary.errorCount > 0 && `${summary.errorCount} records with validation errors. `}
              Please inspect in the <button onClick={() => navigate('review')} className="font-bold underline hover:text-amber-950">Review Table</button> before applying updates to ensure data integrity.
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Grid (Exact specification matching) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Master Records</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{summary.totalMaster.toLocaleString()}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total New Records</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{summary.totalNew.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportNewTenantsExcel(comparisonItems)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3 w-3 text-slate-400" />
              <span>Export New (.xlsx)</span>
            </button>
            <button
              onClick={() => exportUpdatedTenantsExcel(comparisonItems)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3 w-3 text-slate-400" />
              <span>Export Updated (.xlsx)</span>
            </button>
            <button
              onClick={() => exportMissingTenantsExcel(comparisonItems)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3 w-3 text-slate-400" />
              <span>Export Missing (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 6 Metric Breakdown Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* New Tenants */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between text-indigo-900">
              <span className="text-xs font-semibold">New Tenants</span>
              <UserPlus className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-950">{summary.newCount}</div>
            <div className="mt-1 text-[11px] text-indigo-600">Will be inserted</div>
          </div>

          {/* Updated Tenants */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
            <div className="flex items-center justify-between text-amber-900">
              <span className="text-xs font-semibold">Updated Tenants</span>
              <RefreshCw className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-950">{summary.updatedCount}</div>
            <div className="mt-1 text-[11px] text-amber-700">Fields changed</div>
          </div>

          {/* Unchanged Tenants */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-semibold">Unchanged Tenants</span>
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-800">{summary.unchangedCount}</div>
            <div className="mt-1 text-[11px] text-slate-500">Exact match</div>
          </div>

          {/* Missing Tenants */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between text-rose-900">
              <span className="text-xs font-semibold">Missing Tenants</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-950">{summary.missingCount}</div>
            <div className="mt-1 text-[11px] text-rose-600">Safe: Not deleted</div>
          </div>

          {/* Duplicate Codes */}
          <div className={`rounded-xl border p-4 ${summary.duplicateCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50/40'}`}>
            <div className="flex items-center justify-between text-slate-800">
              <span className="text-xs font-semibold">Duplicate Codes</span>
              <Copy className={`h-4 w-4 ${summary.duplicateCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div className={`mt-2 text-2xl font-bold ${summary.duplicateCount > 0 ? 'text-amber-900' : 'text-slate-800'}`}>
              {summary.duplicateCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Requires resolution</div>
          </div>

          {/* Validation Errors */}
          <div className={`rounded-xl border p-4 ${summary.errorCount > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-slate-50/40'}`}>
            <div className="flex items-center justify-between text-slate-800">
              <span className="text-xs font-semibold">Validation Errors</span>
              <AlertOctagon className={`h-4 w-4 ${summary.errorCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className={`mt-2 text-2xl font-bold ${summary.errorCount > 0 ? 'text-rose-900' : 'text-slate-800'}`}>
              {summary.errorCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Missing codes/dates</div>
          </div>
        </div>

        {/* Safety Rule Callout (Requirement 13) */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Safety Rule Enforced: Never automatically delete missing tenants</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 leading-normal">
            The {summary.missingCount} tenants present in Master but absent in the new external download are retained by default. Administrators can choose to Keep, Deactivate, or Remove them in the Review table.
          </div>
        </div>

        {/* Bottom Action Buttons (Requirement 12) */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={() => navigate('upload')}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel / Change Files</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('review')}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <span>Review Changes ({summary.updatedCount + summary.newCount})</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                if (!canApprove) {
                  setShowAdminRequiredModal(true);
                  return;
                }
                setShowConfirmModal(true);
              }}
              disabled={appliedSuccessSessionId !== null}
              className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-xs transition ${
                appliedSuccessSessionId
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : !canApprove
                  ? 'bg-slate-800 text-white hover:bg-slate-900 cursor-pointer'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              {!canApprove ? (
                <>
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Commit to Master (Admin Required)</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Approve & Update Master</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Required RBAC Modal */}
      {showAdminRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Administrator Approval Required
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-normal">
              Your current role (<strong>{user?.role}</strong>) allows comparing datasets and inspecting records. However, committing batch changes to the live Master Database requires an <strong>Administrator</strong>.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  switchRole('Admin');
                  setShowAdminRequiredModal(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Switch to Administrator (Test Mode)</span>
              </button>
              <button
                onClick={() => setShowAdminRequiredModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Confirm Master Update</h3>
            <p className="mt-2 text-xs text-slate-600 leading-normal">
              You are about to apply changes to the Master Tenant database:
            </p>
            <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>New Tenants to create:</span>
                <span className="font-bold text-indigo-600">{summary.newCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Existing Tenants to update:</span>
                <span className="font-bold text-amber-600">{summary.updatedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing Tenants handled safely:</span>
                <span className="font-bold text-slate-700">{summary.missingCount}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAndUpdate}
                disabled={isApplying}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                {isApplying ? 'Applying Batch...' : 'Confirm & Apply Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

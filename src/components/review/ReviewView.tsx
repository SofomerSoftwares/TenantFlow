import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  Check,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Wand2,
  Undo2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import {
  TenantComparisonItem,
  RecordChangeType,
  MissingTenantAction
} from '@/src/types/tenant';
import {
  exportUpdatedMasterExcel,
  exportNewTenantsExcel,
  exportUpdatedTenantsExcel,
  exportMissingTenantsExcel,
  exportChangeReportExcel,
  exportValidationErrorsExcel
} from '@/src/lib/excel/excelExporter';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { BulkResolveModal } from './BulkResolveModal';
import { analyzeHeuristicClusters } from '@/src/lib/comparison/heuristicMatcher';

type FilterTab = 'ALL' | 'NEW' | 'UPDATED' | 'UNCHANGED' | 'MISSING' | 'DUPLICATE' | 'ERROR' | 'HEURISTIC';

export const ReviewView: React.FC = () => {
  const {
    comparisonItems,
    summary,
    setItemStatus,
    setBulkStatus,
    setMissingAction,
    setBulkMissingAction,
    applyHeuristicResolutions,
    applyApprovedChanges,
    appliedSuccessSessionId,
    loadDemoComparison,
    navigate
  } = useComparison();

  const { user, canApprove, isReadOnly, switchRole } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showAdminRequiredModal, setShowAdminRequiredModal] = useState(false);

  // Bulk Resolve Heuristics State
  const [isBulkResolveModalOpen, setIsBulkResolveModalOpen] = useState(false);
  const [bulkResolveBanner, setBulkResolveBanner] = useState<{ message: string; count: number } | null>(null);

  // Pre-analyze heuristic patterns to show proactive badge
  const detectedHeuristicRules = useMemo(() => {
    return analyzeHeuristicClusters(comparisonItems);
  }, [comparisonItems]);

  const totalHeuristicMatchesCount = useMemo(() => {
    return detectedHeuristicRules.reduce((sum, r) => sum + r.itemCount, 0);
  }, [detectedHeuristicRules]);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    return comparisonItems.filter((item) => {
      // Tab filter
      if (activeFilter === 'HEURISTIC') {
        if (!item.heuristicTag) return false;
      } else if (activeFilter !== 'ALL' && item.changeType !== activeFilter) {
        return false;
      }

      // Search query filter (Tenant Code, Tenant Name, or Unit)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeMatch = item.tenantCode.toLowerCase().includes(query);
        const nameMatch = item.tenantName.toLowerCase().includes(query);
        const unitMatch = item.newRecord?.unit?.toLowerCase().includes(query) || item.masterRecord?.unit?.toLowerCase().includes(query);
        const tagMatch = item.heuristicTag?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !unitMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [comparisonItems, activeFilter, searchQuery]);

  // Bulk selection helpers
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));
  const someFilteredSelected = filteredItems.some((item) => selectedIds.has(item.id)) && !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRowIds(next);
  };

  const handleBulkApprove = () => {
    setBulkStatus(Array.from(selectedIds), 'approved');
  };

  const handleBulkReject = () => {
    setBulkStatus(Array.from(selectedIds), 'rejected');
  };

  const handleApplyHeuristicResolutions = (resolutions: {
    ruleId: string;
    ruleName: string;
    itemIds: string[];
    action: 'approve' | 'reject' | 'deactivate' | 'keep';
  }[]) => {
    const affected = applyHeuristicResolutions(resolutions);
    setBulkResolveBanner({
      message: `Bulk Resolve completed: successfully applied suggested resolutions to ${affected} tenant records across ${resolutions.length} pattern categories.`,
      count: affected
    });
  };

  const handleCommitUpdate = () => {
    if (!user) return;
    if (!canApprove) {
      setShowAdminRequiredModal(true);
      return;
    }
    setIsApplying(true);
    setTimeout(() => {
      applyApprovedChanges(user);
      setIsApplying(false);
    }, 400);
  };

  if (comparisonItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Filter className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900">No Records to Review</h2>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Run a comparison between a Master Tenant List and an external system export to populate this review table.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('upload')}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Upload Tenant Lists
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

  // Count per category
  const counts = {
    ALL: comparisonItems.length,
    NEW: comparisonItems.filter((i) => i.changeType === 'NEW').length,
    UPDATED: comparisonItems.filter((i) => i.changeType === 'UPDATED').length,
    UNCHANGED: comparisonItems.filter((i) => i.changeType === 'UNCHANGED').length,
    MISSING: comparisonItems.filter((i) => i.changeType === 'MISSING').length,
    DUPLICATE: comparisonItems.filter((i) => i.changeType === 'DUPLICATE').length,
    ERROR: comparisonItems.filter((i) => i.changeType === 'ERROR').length,
    HEURISTIC: comparisonItems.filter((i) => Boolean(i.heuristicTag)).length
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Reconciliation & Audit
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Review Changes
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Inspect individual field differences, leverage heuristic bulk resolution, verify missing records, and approve before committing to the Master database.
          </p>
        </div>

        {/* Action Controls & Bulk Resolve Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Smart Bulk Resolve Button */}
          <button
            onClick={() => setIsBulkResolveModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
            title="Scan dataset for identical, systematic difference patterns and bulk resolve with heuristics"
          >
            <Wand2 className="h-4 w-4 text-indigo-600" />
            <span>Bulk Resolve</span>
            {detectedHeuristicRules.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {detectedHeuristicRules.length} patterns ({totalHeuristicMatchesCount})
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Download Excel Reports</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Generate Excel Reports
                  </div>
                  <button
                    onClick={() => {
                      exportUpdatedMasterExcel(tenantDb.getTenants());
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 font-medium text-slate-800"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Tenant_List_Updated.xlsx</span>
                  </button>
                  <button
                    onClick={() => {
                      exportChangeReportExcel(comparisonItems, user?.name || 'Admin');
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 font-medium text-slate-800"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                    <span>Change_Report.xlsx</span>
                  </button>
                  <button
                    onClick={() => {
                      exportNewTenantsExcel(comparisonItems);
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                    <span>New_Tenants.xlsx</span>
                  </button>
                  <button
                    onClick={() => {
                      exportUpdatedTenantsExcel(comparisonItems);
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                    <span>Updated_Tenants.xlsx</span>
                  </button>
                  <button
                    onClick={() => {
                      exportMissingTenantsExcel(comparisonItems);
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                    <span>Missing_Tenants.xlsx</span>
                  </button>
                  <button
                    onClick={() => {
                      exportValidationErrorsExcel(comparisonItems);
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 text-rose-600 font-medium"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-rose-500" />
                    <span>Validation_Errors.xlsx</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleCommitUpdate}
            disabled={appliedSuccessSessionId !== null || isApplying}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold shadow-xs transition ${
              appliedSuccessSessionId
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : !canApprove
                ? 'bg-slate-800 text-white hover:bg-slate-900 cursor-pointer'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            {appliedSuccessSessionId ? (
              <>
                <Check className="h-4 w-4" />
                <span>Changes Committed</span>
              </>
            ) : isApplying ? (
              <span>Applying Updates...</span>
            ) : !canApprove ? (
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

      {/* Viewer Read-Only Notice Banner */}
      {isReadOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Viewer Read-Only Mode: </span>
              You have view and export permissions. Approving, rejecting, or applying bulk heuristic resolutions requires Staff or Admin access.
            </div>
          </div>
          <button
            onClick={() => switchRole('Staff')}
            className="font-bold underline text-amber-900 hover:text-amber-700 whitespace-nowrap"
          >
            Switch to Staff Role (Test)
          </button>
        </div>
      )}

      {/* Bulk Resolve Success Notification Banner */}
      {bulkResolveBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/90 p-4 text-xs text-indigo-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>{bulkResolveBanner.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('HEURISTIC')}
              className="font-bold underline hover:text-indigo-800"
            >
              Filter Heuristic Records ({bulkResolveBanner.count})
            </button>
            <button
              onClick={() => setBulkResolveBanner(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Review Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Interactive Filter Segmented Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'ALL', label: 'All', count: counts.ALL },
                { id: 'NEW', label: 'New', count: counts.NEW, color: 'text-indigo-600' },
                { id: 'UPDATED', label: 'Updated', count: counts.UPDATED, color: 'text-amber-600' },
                { id: 'UNCHANGED', label: 'Unchanged', count: counts.UNCHANGED, color: 'text-slate-500' },
                { id: 'MISSING', label: 'Missing', count: counts.MISSING, color: 'text-rose-600' },
                { id: 'DUPLICATE', label: 'Duplicate', count: counts.DUPLICATE, color: 'text-amber-700' },
                { id: 'ERROR', label: 'Errors', count: counts.ERROR, color: 'text-rose-700' },
                ...(counts.HEURISTIC > 0
                  ? [{ id: 'HEURISTIC', label: '✦ Heuristic Resolved', count: counts.HEURISTIC, color: 'text-indigo-700' }]
                  : [])
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as FilterTab)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        isActive ? 'text-slate-500 font-bold' : tab.color || 'text-slate-400'
                      }`}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Tenant Code, Name, or Tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someFilteredSelected;
                }}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Select All Visible ({filteredItems.length})</span>
            </label>

            {selectedIds.size > 0 && (
              <span className="text-slate-400">· {selectedIds.size} selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve Selected</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject Selected</span>
                </button>
              </>
            )}

            {/* Quick bulk missing handler if on missing tab */}
            {activeFilter === 'MISSING' && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Set All Missing:</span>
                <button
                  onClick={() => setBulkMissingAction('keep')}
                  className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 font-medium text-slate-700"
                >
                  Keep Active
                </button>
                <button
                  onClick={() => setBulkMissingAction('deactivate')}
                  className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 font-medium text-amber-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setBulkMissingAction('remove')}
                  className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 font-medium text-rose-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Review Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="w-10 px-4 py-3 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-3">Change Type</th>
                <th className="px-3 py-3">Tenant Code</th>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-3 py-3">Changed Fields</th>
                <th className="px-4 py-3">Old Value (Master)</th>
                <th className="px-4 py-3">New Value (Latest)</th>
                <th className="px-4 py-3 text-center">Review Action</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No tenant records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isExpanded = expandedRowIds.has(item.id);

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`transition ${
                          isSelected
                            ? 'bg-indigo-50/30'
                            : item.reviewStatus === 'rejected'
                            ? 'bg-slate-50 opacity-60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Change Type Badge */}
                        <td className="px-3 py-3 font-medium whitespace-nowrap">
                          {renderChangeTypeBadge(item.changeType)}
                        </td>

                        {/* Tenant Code */}
                        <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.tenantCode}
                        </td>

                        {/* Tenant Name */}
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>{item.tenantName}</div>
                          {item.newRecord?.unit && (
                            <div className="text-[11px] font-normal text-slate-400">
                              Unit {item.newRecord.unit} {item.newRecord.branch ? `· ${item.newRecord.branch}` : ''}
                            </div>
                          )}
                          {/* Heuristic Resolution Tag */}
                          {item.heuristicTag && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/60">
                                <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
                                <span>Heuristic: {item.heuristicTag}</span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Changed Fields Summary */}
                        <td className="px-3 py-3">
                          {item.changeType === 'UPDATED' ? (
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:underline"
                            >
                              <span>{item.diffs.length} field{item.diffs.length > 1 ? 's' : ''} changed</span>
                              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          ) : item.changeType === 'NEW' ? (
                            <span className="text-slate-500">All fields (New record)</span>
                          ) : item.changeType === 'MISSING' ? (
                            <div className="space-y-1">
                              <span className="text-rose-600 font-medium">Missing from file</span>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-400">Action:</span>
                                <select
                                  value={item.missingAction || 'keep'}
                                  onChange={(e) => setMissingAction(item.id, e.target.value as MissingTenantAction)}
                                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 focus:outline-none"
                                >
                                  <option value="keep">Keep (Safe)</option>
                                  <option value="deactivate">Deactivate</option>
                                  <option value="remove">Remove</option>
                                </select>
                              </div>
                            </div>
                          ) : item.changeType === 'DUPLICATE' ? (
                            <div className="text-amber-800 font-medium text-[11px]">
                              {item.issues?.[0] || 'Duplicate Code'}
                            </div>
                          ) : item.changeType === 'ERROR' ? (
                            <div className="text-rose-700 font-medium text-[11px]">
                              {item.issues?.join(', ') || 'Validation Error'}
                            </div>
                          ) : (
                            <span className="text-slate-400">No differences</span>
                          )}
                        </td>

                        {/* Old Value (Master) */}
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {item.changeType === 'UPDATED' && item.diffs.length > 0 ? (
                            <span>{item.diffs[0].label}: <strong className="font-semibold text-slate-700">{String(item.diffs[0].oldValue)}</strong></span>
                          ) : item.changeType === 'NEW' ? (
                            <span className="text-slate-400 italic">(Not in Master)</span>
                          ) : item.changeType === 'MISSING' ? (
                            <span className="text-slate-700 font-medium">{item.masterRecord?.status || 'Active'}</span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>

                        {/* New Value (Latest) */}
                        <td className="px-4 py-3 text-slate-900 max-w-xs truncate">
                          {item.changeType === 'UPDATED' && item.diffs.length > 0 ? (
                            <span>{item.diffs[0].label}: <strong className="font-semibold text-indigo-700">{String(item.diffs[0].newValue)}</strong></span>
                          ) : item.changeType === 'NEW' ? (
                            <span className="text-indigo-700 font-semibold">{item.newRecord?.unit || 'New Unit'}</span>
                          ) : item.changeType === 'MISSING' ? (
                            <span className="text-rose-600 font-medium">{item.missingAction === 'deactivate' ? 'Deactivated' : item.missingAction === 'remove' ? 'Removed' : 'Kept (Active)'}</span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>

                        {/* Review Action (Approve / Reject buttons) */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              onClick={() => setItemStatus(item.id, 'approved')}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                                item.reviewStatus === 'approved'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                              }`}
                              title="Approve this change"
                            >
                              <Check className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setItemStatus(item.id, 'rejected')}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                                item.reviewStatus === 'rejected'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-rose-700 hover:bg-slate-100'
                              }`}
                              title="Reject this change (will keep current master)"
                            >
                              <X className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>

                        {/* Details Action */}
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => navigate('tenant-detail', item.tenantCode)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View Tenant Master & History"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Field-Level Diff Panel */}
                      {isExpanded && item.diffs.length > 0 && (
                        <tr className="bg-amber-50/20 border-b border-slate-200">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-xs">
                              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                <span>Detailed Field Differences for {item.tenantCode} ({item.tenantName})</span>
                                <span className="text-[11px] text-slate-400 font-normal">{item.diffs.length} changes detected</span>
                              </div>

                              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                                      <th className="px-3 py-2">Field</th>
                                      <th className="px-3 py-2 text-rose-700 bg-rose-50/50">Previous Value (Master)</th>
                                      <th className="px-3 py-2 text-emerald-800 bg-emerald-50/50">Updated Value (New File)</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {item.diffs.map((diff, dIdx) => (
                                      <tr key={dIdx} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2 font-semibold text-slate-800">{diff.label}</td>
                                        <td className="px-3 py-2 font-mono text-rose-700 bg-rose-50/20">{String(diff.oldValue)}</td>
                                        <td className="px-3 py-2 font-mono font-bold text-emerald-800 bg-emerald-50/20">{String(diff.newValue)}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                            CHANGED
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
          <div>
            Showing <strong className="font-semibold text-slate-800">{filteredItems.length}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{comparisonItems.length}</strong> total records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('compare')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Summary
            </button>
            <button
              onClick={handleCommitUpdate}
              disabled={appliedSuccessSessionId !== null || isApplying}
              className={`rounded-lg px-4 py-1.5 font-semibold text-white shadow-xs transition ${
                appliedSuccessSessionId
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              {appliedSuccessSessionId ? 'Already Committed' : 'Approve & Update Master'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Resolve Assistant Modal */}
      <BulkResolveModal
        items={comparisonItems}
        isOpen={isBulkResolveModalOpen}
        onClose={() => setIsBulkResolveModalOpen(false)}
        onApplyResolutions={handleApplyHeuristicResolutions}
      />

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
              Your current role (<strong>{user?.role}</strong>) allows reviewing discrepancies, toggling differences, and running bulk resolution. However, committing updates to the live Master Database requires an <strong>Administrator</strong>.
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
    </div>
  );
};

function renderChangeTypeBadge(changeType: RecordChangeType) {
  switch (changeType) {
    case 'NEW':
      return (
        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/60">
          NEW
        </span>
      );
    case 'UPDATED':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60">
          UPDATED
        </span>
      );
    case 'UNCHANGED':
      return (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          UNCHANGED
        </span>
      );
    case 'MISSING':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200/60">
          MISSING
        </span>
      );
    case 'DUPLICATE':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
          DUPLICATE
        </span>
      );
    case 'ERROR':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-900 border border-rose-300">
          ERROR
        </span>
      );
  }
}

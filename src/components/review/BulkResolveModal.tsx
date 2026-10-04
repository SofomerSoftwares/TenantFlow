import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  X,
  ArrowRight,
  FileCheck,
  SlidersHorizontal,
  Info,
  Check
} from 'lucide-react';
import {
  TenantComparisonItem,
  HeuristicRule,
  MissingTenantAction
} from '@/src/types/tenant';
import { analyzeHeuristicClusters } from '@/src/lib/comparison/heuristicMatcher';

interface BulkResolveModalProps {
  items: TenantComparisonItem[];
  isOpen: boolean;
  onClose: () => void;
  onApplyResolutions: (resolutions: {
    ruleId: string;
    ruleName: string;
    itemIds: string[];
    action: 'approve' | 'reject' | 'deactivate' | 'keep';
  }[]) => void;
}

export const BulkResolveModal: React.FC<BulkResolveModalProps> = ({
  items,
  isOpen,
  onClose,
  onApplyResolutions
}) => {
  const heuristicRules = useMemo(() => {
    if (!isOpen) return [];
    return analyzeHeuristicClusters(items);
  }, [items, isOpen]);

  // Track which rule clusters are checked
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(() => {
    return new Set(heuristicRules.map(r => r.id));
  });

  // Track expanded sample drawers
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());

  // Keep selectedRuleIds in sync when rules change
  React.useEffect(() => {
    setSelectedRuleIds(new Set(heuristicRules.map(r => r.id)));
  }, [heuristicRules]);

  if (!isOpen) return null;

  const toggleRule = (ruleId: string) => {
    const next = new Set(selectedRuleIds);
    if (next.has(ruleId)) {
      next.delete(ruleId);
    } else {
      next.add(ruleId);
    }
    setSelectedRuleIds(next);
  };

  const toggleExpand = (ruleId: string) => {
    const next = new Set(expandedRuleIds);
    if (next.has(ruleId)) {
      next.delete(ruleId);
    } else {
      next.add(ruleId);
    }
    setExpandedRuleIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRuleIds.size === heuristicRules.length) {
      setSelectedRuleIds(new Set());
    } else {
      setSelectedRuleIds(new Set(heuristicRules.map(r => r.id)));
    }
  };

  // Calculate total affected records
  const totalAffectedRecords = useMemo(() => {
    const uniqueIds = new Set<string>();
    heuristicRules.forEach(rule => {
      if (selectedRuleIds.has(rule.id)) {
        rule.matchedItemIds.forEach(id => uniqueIds.add(id));
      }
    });
    return uniqueIds.size;
  }, [heuristicRules, selectedRuleIds]);

  const handleApply = () => {
    const payload = heuristicRules
      .filter(r => selectedRuleIds.has(r.id))
      .map(r => ({
        ruleId: r.id,
        ruleName: r.name,
        itemIds: r.matchedItemIds,
        action: r.suggestedAction
      }));

    onApplyResolutions(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Bulk Resolve Assistant
                </h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                  Heuristic Pattern Matching
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Identifies recurring, systematic difference patterns across large datasets and suggests high-confidence resolutions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Analysis Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
              <div className="text-xs text-indigo-950">
                Analyzed <strong>{items.length} records</strong>. Discovered{' '}
                <strong>{heuristicRules.length} systematic patterns</strong> covering{' '}
                <strong className="text-indigo-700 font-bold">
                  {heuristicRules.reduce((acc, r) => acc + r.itemCount, 0)} potential matches
                </strong>.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {selectedRuleIds.size === heuristicRules.length ? 'Deselect All' : 'Select All Patterns'}
              </button>
            </div>
          </div>

          {/* List of Heuristic Clusters */}
          {heuristicRules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              No repetitive heuristic patterns detected in the current comparison batch. Individual differences can still be approved or rejected directly in the table.
            </div>
          ) : (
            <div className="space-y-3.5">
              {heuristicRules.map((rule) => {
                const isSelected = selectedRuleIds.has(rule.id);
                const isExpanded = expandedRuleIds.has(rule.id);

                return (
                  <div
                    key={rule.id}
                    className={`rounded-xl border transition ${
                      isSelected
                        ? 'border-indigo-300 bg-indigo-50/20 shadow-xs'
                        : 'border-slate-200 bg-white opacity-85'
                    }`}
                  >
                    {/* Card Header Row */}
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRule(rule.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {rule.name}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                              {rule.category}
                            </span>
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                              {(rule.confidence * 100).toFixed(0)}% Confidence
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500 leading-normal">
                            {rule.description}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-semibold text-slate-700">
                              Affects: <strong className="text-indigo-700">{rule.itemCount} records</strong>
                            </span>
                            <span>·</span>
                            <span className="text-slate-500">
                              Suggested Action:{' '}
                              <strong className="uppercase font-bold text-emerald-800">
                                {rule.suggestedAction === 'deactivate' ? 'Deactivate (Lease Expired)' : 'Approve Modification'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(rule.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <span>{isExpanded ? 'Hide Examples' : `View ${rule.sampleItems.length} Examples`}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Sample Records Drawer */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-4 text-xs">
                        <div className="font-semibold text-slate-800 mb-2">
                          Sample Matched Records & Heuristic Rationale:
                        </div>
                        <div className="divide-y divide-slate-200/60 rounded-lg border border-slate-200 bg-white overflow-hidden">
                          {rule.sampleItems.map((sample, sIdx) => (
                            <div key={sIdx} className="p-3 text-[11px]">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900">{sample.tenantCode}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-semibold text-slate-800">{sample.tenantName}</span>
                                </div>
                                <span className="font-medium text-slate-500">Field: {sample.field}</span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-slate-600">
                                <div>
                                  <span className="text-slate-400">Old: </span>
                                  <span className="font-mono text-rose-700 bg-rose-50 px-1 py-0.5 rounded">
                                    {String(sample.oldValue)}
                                  </span>
                                </div>
                                <ArrowRight className="h-3 w-3 text-slate-300" />
                                <div>
                                  <span className="text-slate-400">New: </span>
                                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                                    {String(sample.newValue)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 text-[10px] text-slate-400 italic">
                                Logic: {sample.explanation}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-5 text-xs">
          <div className="text-slate-500">
            Selected <strong>{selectedRuleIds.size} pattern rules</strong> affecting{' '}
            <strong className="text-indigo-700 font-bold">{totalAffectedRecords} tenant records</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedRuleIds.size === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              <span>Apply Selected Resolutions ({totalAffectedRecords})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

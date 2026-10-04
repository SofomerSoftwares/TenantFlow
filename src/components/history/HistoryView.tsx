import React, { useState, useEffect } from 'react';
import {
  History,
  FileSpreadsheet,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Download,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { UploadSession } from '@/src/types/tenant';

export const HistoryView: React.FC = () => {
  const { navigate } = useComparison();
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessions(tenantDb.getSessions());
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Reconciliation Session Log
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Update History
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Record of every reconciliation executed, comparison inputs, results breakdown, and administrator approvals.
          </p>
        </div>

        <button
          onClick={() => navigate('upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <span>Start New Reconciliation</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Sessions Timeline Cards */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            No reconciliation sessions found. Upload files and approve changes to record history.
          </div>
        ) : (
          sessions.map((sess) => {
            const isExpanded = expandedSessionId === sess.id;
            const formattedDate = new Date(sess.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={sess.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{formattedDate}</span>
                      <span>·</span>
                      <span>Session ID: <strong className="font-mono text-slate-600">{sess.id}</strong></span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span>Master: <strong>{sess.masterFileName}</strong></span>
                      </div>
                      <span className="text-slate-300">vs</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                        <span>New File: <strong>{sess.newFileName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-800">Updated By</div>
                      <div className="text-slate-500">{sess.appliedBy || 'Admin User'}</div>
                    </div>

                    <button
                      onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Session Results Badges (Requirement 20: 24 New, 87 Updated, 19 Missing, 1,120 Unchanged) */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-indigo-50/60 p-3">
                    <div className="text-[11px] font-semibold text-indigo-900">New Tenants</div>
                    <div className="text-lg font-bold text-indigo-950">+{sess.summary.newCount}</div>
                    <div className="text-[10px] text-indigo-600">Added to Master</div>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 p-3">
                    <div className="text-[11px] font-semibold text-amber-900">Updated Tenants</div>
                    <div className="text-lg font-bold text-amber-950">{sess.summary.updatedCount}</div>
                    <div className="text-[10px] text-amber-700">Fields synchronized</div>
                  </div>

                  <div className="rounded-xl bg-rose-50/60 p-3">
                    <div className="text-[11px] font-semibold text-rose-900">Missing Tenants</div>
                    <div className="text-lg font-bold text-rose-950">{sess.summary.missingCount}</div>
                    <div className="text-[10px] text-rose-600">Safely retained</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold text-slate-700">Unchanged Tenants</div>
                    <div className="text-lg font-bold text-slate-800">{sess.summary.unchangedCount}</div>
                    <div className="text-[10px] text-slate-500">Identical records</div>
                  </div>
                </div>

                {/* Expandable Session Details */}
                {isExpanded && (
                  <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-600 space-y-2">
                    <div className="font-semibold text-slate-900">Reconciliation Parameters:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>Total Master Records Processed: <strong>{sess.summary.totalMaster}</strong></div>
                      <div>Total New File Records Processed: <strong>{sess.summary.totalNew}</strong></div>
                      <div>Duplicates Resolved: <strong>{sess.summary.duplicateCount || 0}</strong></div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => navigate('reports')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Inspect detailed field audit logs in Reports →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

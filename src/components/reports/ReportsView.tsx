import React, { useState, useMemo, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Filter,
  Search,
  Calendar,
  User,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantHistoryItem } from '@/src/types/tenant';
import { exportHistoryItemsExcel } from '@/src/lib/excel/excelExporter';

export const ReportsView: React.FC = () => {
  const { navigate } = useComparison();
  const [historyItems, setHistoryItems] = useState<TenantHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fieldFilter, setFieldFilter] = useState('ALL');

  useEffect(() => {
    setHistoryItems(tenantDb.getHistory());
  }, []);

  const distinctFields = useMemo(() => {
    const s = new Set<string>();
    historyItems.forEach((h) => s.add(h.field));
    return Array.from(s);
  }, [historyItems]);

  const filteredHistory = useMemo(() => {
    return historyItems.filter((item) => {
      if (typeFilter !== 'ALL' && item.changeType !== typeFilter) return false;
      if (fieldFilter !== 'ALL' && item.field !== fieldFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = item.tenantCode.toLowerCase().includes(q);
        const nameMatch = item.tenantName.toLowerCase().includes(q);
        const valMatch = item.newValue.toLowerCase().includes(q) || item.oldValue.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !valMatch) return false;
      }

      return true;
    });
  }, [historyItems, typeFilter, fieldFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Audit Trails & Reconciliation Logs
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Change Reports
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Complete audit trail of every field modification, lease change, new tenant insertion, and reconciliation session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportHistoryItemsExcel(filteredHistory)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Download Audit Report (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Tenant Code, Name, or Values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Change Types</option>
                <option value="NEW">NEW</option>
                <option value="UPDATED">UPDATED</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
                <option value="REMOVED">REMOVED</option>
              </select>

              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Fields</option>
                {distinctFields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Change Report Table (Requirement 17 columns) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Tenant Code</th>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-3 py-3">Field</th>
                <th className="px-4 py-3 text-rose-700 bg-rose-50/40">Old Value</th>
                <th className="px-4 py-3 text-emerald-800 bg-emerald-50/40">New Value</th>
                <th className="px-3 py-3">Change Type</th>
                <th className="px-3 py-3">Updated By</th>
                <th className="px-3 py-3">Updated Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No change records found. Changes applied during reconciliation are saved here.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => navigate('tenant-detail', item.tenantCode)}
                        className="hover:underline text-indigo-600"
                      >
                        {item.tenantCode}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.tenantName}</td>
                    <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{item.field}</td>
                    <td className="px-4 py-3 font-mono text-rose-700 bg-rose-50/20 max-w-xs truncate">{item.oldValue}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800 bg-emerald-50/20 max-w-xs truncate">{item.newValue}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {item.changeType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{item.updatedBy}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{item.updatedDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
          Showing <strong>{filteredHistory.length}</strong> change records
        </div>
      </div>
    </div>
  );
};

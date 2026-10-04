import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  History,
  Building2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';
import { exportUpdatedMasterExcel } from '@/src/lib/excel/excelExporter';

export const TenantsView: React.FC = () => {
  const { navigate } = useComparison();
  const { user, canManageTenants } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setTenants(tenantDb.getTenants());
  }, []);

  // Distinct branches
  const branches = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach((t) => {
      if (t.branch) set.add(t.branch);
    });
    return Array.from(set);
  }, [tenants]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (branchFilter !== 'ALL' && t.branch !== branchFilter) return false;
      if (statusFilter !== 'ALL' && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = t.tenantCode.toLowerCase().includes(q);
        const nameMatch = t.tenantName.toLowerCase().includes(q);
        const unitMatch = t.unit.toLowerCase().includes(q);
        const phoneMatch = t.phone ? t.phone.toLowerCase().includes(q) : false;
        if (!codeMatch && !nameMatch && !unitMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [tenants, branchFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / pageSize) || 1;
  const paginatedTenants = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPageNum, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Tenant Master Directory
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Master Tenants
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Authoritative registry of all commercial tenants, leased units, contact details, and historical lease records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportUpdatedMasterExcel(filteredTenants, 'Master_Tenants_List')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Master (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Tenant Code, Name, or Unit..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2">
              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Tenant Code</th>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No tenants found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.tenantCode} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {tenant.tenantCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{tenant.tenantName}</div>
                      {tenant.category && (
                        <div className="text-[11px] font-normal text-slate-400">{tenant.category}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {tenant.unit}
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {tenant.branch || '-'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {tenant.phone || '-'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          tenant.status.toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : '2026-03-20'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => navigate('tenant-detail', tenant.tenantCode)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => navigate('tenant-detail', tenant.tenantCode)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>History</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
          <div>
            Showing <strong className="font-semibold text-slate-800">{filteredTenants.length === 0 ? 0 : (currentPageNum - 1) * pageSize + 1}</strong> to{' '}
            <strong className="font-semibold text-slate-800">{Math.min(currentPageNum * pageSize, filteredTenants.length)}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{filteredTenants.length}</strong> tenants
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum(p => Math.max(p - 1, 1))}
              disabled={currentPageNum === 1}
              className={`rounded-lg border border-slate-200 bg-white p-1.5 ${
                currentPageNum === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-slate-700 font-semibold px-2">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageNum(p => Math.min(p + 1, totalPages))}
              disabled={currentPageNum === totalPages}
              className={`rounded-lg border border-slate-200 bg-white p-1.5 ${
                currentPageNum === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

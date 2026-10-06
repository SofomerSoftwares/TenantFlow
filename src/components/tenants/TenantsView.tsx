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
  Edit2,
  MapPin,
  Home,
  CheckCircle2,
  Layers,
  Coins
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';
import { exportUpdatedMasterExcel, exportBlankRegistryTemplateExcel } from '@/src/lib/excel/excelExporter';

export const TenantsView: React.FC = () => {
  const { navigate } = useComparison();
  const { user, canManageTenants } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [subCityFilter, setSubCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setTenants(tenantDb.getTenants());
  }, []);

  // Distinct Sub-cities (ክ/ከተማ)
  const subCities = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach((t) => {
      const city = t.sub_city || t.branch;
      if (city) set.add(city);
    });
    return Array.from(set);
  }, [tenants]);

  // Distinct Building Grades
  const buildingGrades = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach((t) => {
      if (t.building_grade) set.add(t.building_grade);
    });
    return Array.from(set);
  }, [tenants]);

  // Filtered properties
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const currentSubCity = t.sub_city || t.branch || '';
      if (subCityFilter !== 'ALL' && currentSubCity !== subCityFilter) return false;

      const currentStatus = t.work_status || t.status || '';
      if (statusFilter !== 'ALL' && !currentStatus.toLowerCase().includes(statusFilter.toLowerCase())) return false;

      if (gradeFilter !== 'ALL' && t.building_grade !== gradeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (t.identifier_code || t.tenantCode || '').toLowerCase().includes(q);
        const nameMatch = (t.tenant_name || t.tenantName || '').toLowerCase().includes(q);
        const resMatch = (t.resident_name || '').toLowerCase().includes(q);
        const houseMatch = (t.house_number || t.unit || '').toLowerCase().includes(q);
        const subCityMatch = currentSubCity.toLowerCase().includes(q);
        const woredaMatch = (t.woreda || '').toLowerCase().includes(q);
        const kebeleMatch = (t.kebele || '').toLowerCase().includes(q);
        const phoneMatch = (t.mobile_phone || t.phone || '').toLowerCase().includes(q);

        if (!codeMatch && !nameMatch && !resMatch && !houseMatch && !subCityMatch && !woredaMatch && !kebeleMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tenants, subCityFilter, statusFilter, gradeFilter, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = filteredTenants.length;
    const totalArea = filteredTenants.reduce((acc, curr) => acc + (Number(curr.area_sqm) || 0), 0);
    const totalRent = filteredTenants.reduce((acc, curr) => acc + (Number(curr.rent_amount || curr.rent) || 0), 0);
    const activeCount = filteredTenants.filter(t => (t.work_status || t.status || '').toLowerCase().includes('active')).length;
    return { totalCount, totalArea, totalRent, activeCount };
  }, [filteredTenants]);

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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              የንብረት እና ተከራይ መዝገብ · Property & Tenant Registry
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
              REGISTRY: property_registry
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Property Registry & Master Tenants
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Official municipal housing & property hierarchy registry including Sub-City, Woreda, Kebele, Cadastral, Room counts, and Rent registry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportBlankRegistryTemplateExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100"
            title="Download blank registry spreadsheet template with full 35 Amharic and English headers"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span>Blank Template (.xlsx)</span>
          </button>
          <button
            onClick={() => exportUpdatedMasterExcel(filteredTenants, 'Property_Registry_Master')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Registry (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Home className="h-4 w-4 text-indigo-600" />
            <span>Total Properties</span>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{stats.totalCount}</div>
          <div className="text-[11px] text-slate-400">Registered records</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Total Area (ስፋት)</span>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-950">
            {stats.totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²
          </div>
          <div className="text-[11px] text-slate-400">Total floor area</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Coins className="h-4 w-4 text-amber-600" />
            <span>Total Monthly Rent (ኪራይ)</span>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ETB {stats.totalRent.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400">Monthly lease revenue</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span>Active Occupancy</span>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{stats.activeCount}</div>
          <div className="text-[11px] text-slate-400">Active tenancy contracts</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Identifier, Tenant, House No, Woreda, Kebele, Phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sub-City Filter */}
              <select
                value={subCityFilter}
                onChange={(e) => {
                  setSubCityFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Sub-Cities (ክ/ከተማ)</option>
                {subCities.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Building Grade Filter */}
              {buildingGrades.length > 0 && (
                <select
                  value={gradeFilter}
                  onChange={(e) => {
                    setGradeFilter(e.target.value);
                    setCurrentPageNum(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Building Grades</option>
                  {buildingGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses (ሁኔታ)</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Registry Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">መለያ (Identifier)</th>
                <th className="px-4 py-3">ተከራይ / ነዋሪ (Tenant)</th>
                <th className="px-3 py-3">ክ/ከተማ / ወረዳ / ቀበሌ (Location)</th>
                <th className="px-3 py-3">ቤት ቁጥር (House No.)</th>
                <th className="px-3 py-3">ክፍሎች / ስፋት (Rooms & Area)</th>
                <th className="px-3 py-3">የኪራይ መጠን (Rent)</th>
                <th className="px-3 py-3">የስራ ሁኔታ (Status)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <div className="font-semibold text-slate-700">No Property Records in Master</div>
                    <div className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                      {tenants.length === 0
                        ? 'The master registry is clean with 0 records. Upload an Excel list in Upload & Reconcile to import records.'
                        : 'No records matched your search query or filter.'}
                    </div>
                    {tenants.length === 0 && (
                      <button
                        onClick={() => navigate('upload')}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                      >
                        Upload Master File
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant) => {
                  const idCode = tenant.identifier_code || tenant.tenantCode;
                  const tName = tenant.tenant_name || tenant.tenantName;
                  const resName = tenant.resident_name;
                  const subCity = tenant.sub_city || tenant.branch || 'Addis Ababa';
                  const houseNum = tenant.house_number || tenant.unit;
                  const rentVal = tenant.rent_amount !== undefined ? tenant.rent_amount : tenant.rent;
                  const statusVal = tenant.work_status || tenant.status || 'Active';

                  return (
                    <tr key={idCode} className="hover:bg-slate-50/70 transition">
                      {/* Identifier */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="text-indigo-600">{idCode}</div>
                        {tenant.complex_no && (
                          <div className="text-[10px] font-normal text-slate-400 font-sans">{tenant.complex_no}</div>
                        )}
                      </td>

                      {/* Tenant Name & Title */}
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {tenant.title && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.2">
                              {tenant.title}
                            </span>
                          )}
                          <span>{tName}</span>
                        </div>
                        {resName && resName !== tName && (
                          <div className="text-[11px] font-normal text-slate-500">
                            Resident: {resName}
                          </div>
                        )}
                        {tenant.historical_use && (
                          <div className="text-[10px] font-normal text-slate-400">
                            {tenant.historical_use}
                          </div>
                        )}
                      </td>

                      {/* Sub-City, Woreda, Kebele */}
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{subCity}</div>
                        <div className="text-[10px] text-slate-400">
                          {[tenant.woreda, tenant.kebele].filter(Boolean).join(' · ') || 'Woreda Center'}
                        </div>
                      </td>

                      {/* House Number & Floor */}
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                        <div className="font-mono font-semibold">{houseNum || 'N/A'}</div>
                        {tenant.floor_level && (
                          <div className="text-[10px] text-slate-400">{tenant.floor_level}</div>
                        )}
                      </td>

                      {/* Rooms & Area */}
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                        <div className="font-medium">
                          {tenant.total_rooms || (tenant.bedroom_count ? `${tenant.bedroom_count} Bed` : '-')} Rooms
                        </div>
                        {tenant.area_sqm && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tenant.area_sqm} m²
                          </div>
                        )}
                      </td>

                      {/* Rent */}
                      <td className="px-3 py-3 text-slate-900 font-semibold whitespace-nowrap">
                        {rentVal ? (
                          <>
                            <span className="text-[10px] text-slate-400 mr-1 font-normal">ETB</span>
                            <span>{Number(rentVal).toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            statusVal.toLowerCase().includes('active')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusVal}
                        </span>
                        {tenant.tenure_type && (
                          <div className="text-[9px] text-slate-400 truncate max-w-[110px]" title={tenant.tenure_type}>
                            {tenant.tenure_type}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => navigate('tenant-detail', idCode)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{paginatedTenants.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredTenants.length}</span> property records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-700">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageNum === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

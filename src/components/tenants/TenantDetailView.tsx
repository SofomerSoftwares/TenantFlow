import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  History,
  Tag,
  Coins,
  FileText,
  User,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Home,
  Layers,
  Compass,
  Check,
  AlertCircle
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord, TenantHistoryItem } from '@/src/types/tenant';

export const TenantDetailView: React.FC = () => {
  const { tenantCode: paramTenantCode } = useParams<{ tenantCode: string }>();
  const { selectedTenantCode, navigate } = useComparison();
  const { user, canManageTenants } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [history, setHistory] = useState<TenantHistoryItem[]>([]);

  const activeCode = paramTenantCode || selectedTenantCode;

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TenantRecord>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!activeCode) return;
    const found = tenantDb.getTenant(activeCode);
    if (found) {
      setTenant(found);
      setEditForm(found);
      setHistory(tenantDb.getHistory(activeCode));
    }
  }, [activeCode]);

  if (!tenant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Property Record Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">
          No property record was found matching identifier "{activeCode}".
        </p>
        <Link
          to="/tenants"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Property Registry
        </Link>
      </div>
    );
  }

  const handleSaveEdit = () => {
    if (!user || !tenant) return;
    setEditError(null);
    try {
      const updated = tenantDb.updateSingleTenant(tenant.identifier_code || tenant.tenantCode, editForm, user);
      setTenant(updated);
      setHistory(tenantDb.getHistory(tenant.identifier_code || tenant.tenantCode));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Error updating property record');
    }
  };

  const idCode = tenant.identifier_code || tenant.tenantCode;
  const tName = tenant.tenant_name || tenant.tenantName;
  const statusVal = tenant.work_status || tenant.status || 'Active';
  const rentVal = tenant.rent_amount !== undefined ? tenant.rent_amount : tenant.rent;

  return (
    <div className="space-y-6">
      {/* Navigation and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('tenants')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600">{idCode}</span>
              <span className="text-slate-300">·</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  statusVal.toLowerCase().includes('active')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {statusVal}
              </span>
              {tenant.sub_city && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {tenant.sub_city}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2 mt-0.5">
              {tenant.title && <span className="text-slate-400 font-normal text-lg">{tenant.title}</span>}
              <span>{tName}</span>
            </h1>
          </div>
        </div>

        {canManageTenants && (
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Edit Property Details</span>
              </button>
            )}
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Property record updated successfully! Changes recorded in audit trail.</span>
        </div>
      )}

      {editError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {editError}
        </div>
      )}

      {/* Grid of Section Cards matching user's SQL schema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Identification & Administrative Hierarchy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Identification & Administrative Hierarchy (መለያ እና አስተዳደር)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Hierarchy</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">መለያ (Identifier Code)</div>
              <div className="mt-1 font-mono font-bold text-slate-900">{idCode}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ከተማ (City)</div>
              <div className="mt-1 font-medium text-slate-800">{tenant.city || 'Addis Ababa'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ክ/ከተማ (Sub-City)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.sub_city || ''}
                  onChange={(e) => setEditForm({ ...editForm, sub_city: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-semibold text-slate-900">{tenant.sub_city || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ወረዳ (Woreda)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.woreda || ''}
                  onChange={(e) => setEditForm({ ...editForm, woreda: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.woreda || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ቀበሌ (Kebele)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.kebele || ''}
                  onChange={(e) => setEditForm({ ...editForm, kebele: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.kebele || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ቤት ቁጥር (House No.)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.house_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, house_number: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-mono font-bold text-slate-900">{tenant.house_number || tenant.unit || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የኮምፕሌክስ ወ./ቁጥር (Complex No.)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.complex_no || ''}
                  onChange={(e) => setEditForm({ ...editForm, complex_no: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.complex_no || '-'}</div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Occupant Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Occupant & Resident Details (የተከራይ / ነዋሪ ዝርዝር)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Occupants</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ማዕረግ (Title)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.title || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ጾታ (Gender)</div>
              {isEditing ? (
                <select
                  value={editForm.gender || 'M'}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                >
                  <option value="M">M (ወንድ)</option>
                  <option value="F">F (ሴት)</option>
                </select>
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.gender === 'F' ? 'Female (ሴት)' : 'Male (ወንድ)'}</div>
              )}
            </div>

            <div className="col-span-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የተከራይ ስም (Tenant Name)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.tenant_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, tenant_name: e.target.value, tenantName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs font-semibold"
                />
              ) : (
                <div className="mt-1 text-sm font-bold text-slate-900">{tName}</div>
              )}
            </div>

            <div className="col-span-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የነዋሪ ስም (Resident Name)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.resident_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, resident_name: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-medium text-slate-800">{tenant.resident_name || tName}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Mobile (ስልክ)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.mobile_phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, mobile_phone: e.target.value, phone: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-mono text-slate-800">{tenant.mobile_phone || tenant.phone || '-'}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የስራ ዓይነት/ሁኔታ (Work Status)</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.work_status || ''}
                  onChange={(e) => setEditForm({ ...editForm, work_status: e.target.value, status: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-semibold text-slate-900">{statusVal}</div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Property Structure & Usage */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                3. Property Structure & Room Breakdown (ክፍሎች እና አገልግሎት)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Rooms</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የቤት ታሪካዊ አገልግሎት</div>
              <div className="mt-1 font-semibold text-slate-900">{tenant.historical_use || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ዋና ቤት (Main House)</div>
              <div className="mt-1 font-medium text-slate-800">{tenant.main_house || 'Main'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-indigo-600 uppercase font-bold">ጠቅላላ ክፍል (Total Rooms)</div>
              <div className="mt-1 font-bold text-indigo-700 text-sm">{tenant.total_rooms || '-'} Rooms</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">የመኝታ ክፍል (Bedrooms)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.bedroom_count || 0}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">የመታጠቢያ ክፍል (Bathrooms)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.bathroom_count || 0}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">የኪችን ክፍል (Kitchen)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.kitchen_count || 0}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">የሰርቪስ ቤት (Service Rooms)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.service_room_count || 0}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">ሌላ ክፍል (Other Rooms)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.other_rooms_count || 0}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <div className="text-[10px] text-slate-400">የወለል ደረጃ (Floor Level)</div>
              <div className="font-bold text-slate-800 mt-0.5">{tenant.floor_level || tenant.floor || '-'}</div>
            </div>
          </div>
        </div>

        {/* 4. Grading, Cadastral & Area Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">
                4. Grading & Cadastral Information (ደረጃ እና ካዳስተር)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Cadastre</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የቤቱ ደረጃ (Building Grade)</div>
              <div className="mt-1 font-semibold text-slate-900">{tenant.building_grade || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የቦታ ደረጃ (Site Grade)</div>
              <div className="mt-1 font-semibold text-slate-900">{tenant.site_grade || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ብሎክ / ፓርሰል (Block & Parcel)</div>
              <div className="mt-1 font-mono text-slate-800">
                {[tenant.block_no, tenant.parcel_no].filter(Boolean).join(' / ') || '-'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">ስፋት (Area in m²)</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editForm.area_sqm || ''}
                  onChange={(e) => setEditForm({ ...editForm, area_sqm: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-mono font-bold text-emerald-700 text-sm">
                  {tenant.area_sqm ? `${tenant.area_sqm} m²` : '-'}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የኪራይ መጠን (Rent Amount)</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editForm.rent_amount || ''}
                  onChange={(e) => setEditForm({ ...editForm, rent_amount: Number(e.target.value), rent: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                />
              ) : (
                <div className="mt-1 font-bold text-slate-900 text-sm">
                  {rentVal ? `ETB ${Number(rentVal).toLocaleString()}` : '-'}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የይዞታ ዓይነት (Tenure Type)</div>
              <div className="mt-1 font-medium text-slate-800">{tenant.tenure_type || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የተገነባበት ዓ.ም (Year Built)</div>
              <div className="mt-1 font-medium text-slate-800">{tenant.year_built || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የታደሰበት ዓ.ም (Year Renovated)</div>
              <div className="mt-1 font-medium text-slate-800">{tenant.year_renovated || 'None'}</div>
            </div>
          </div>
        </div>

        {/* 5. Spatial Coordinates & Location Description */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                5. Spatial & Location Details (መገኛ እና ኮኦርዲኔት)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">GIS Coordinates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">X COORDINATE (Longitude)</div>
              <div className="mt-1 font-mono font-medium text-slate-800">{tenant.x_coordinate || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Y COORDINATE (Latitude)</div>
              <div className="mt-1 font-mono font-medium text-slate-800">{tenant.y_coordinate || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">የቤቱ መገኛ (Location Description)</div>
              <div className="mt-1 text-slate-800">{tenant.house_location || '-'}</div>
            </div>

            <div className="sm:col-span-3 border-t border-slate-100 pt-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Remark (ማስታወሻ)</div>
              <div className="mt-1 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {tenant.remarks || 'No remarks recorded.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field-Level Change History Audit Trail */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Property Change History (የለውጥ ታሪክ)</h2>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {history.length} audit {history.length === 1 ? 'event' : 'events'} recorded
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No modification history recorded yet for this property record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Field</th>
                  <th className="px-4 py-2.5">Previous Value</th>
                  <th className="px-4 py-2.5">Updated Value</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Updated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{h.updatedDate}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{h.field}</td>
                    <td className="px-4 py-2.5 text-rose-600 font-mono text-[11px]">{h.oldValue || '-'}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-mono text-[11px] font-semibold">{h.newValue}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {h.changeType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{h.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

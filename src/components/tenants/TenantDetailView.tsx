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
  DollarSign,
  FileText,
  User,
  CheckCircle2,
  Edit2,
  Save,
  X
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
        <h2 className="text-base font-bold text-slate-900">Tenant Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">
          No tenant was found matching code "{activeCode}".
        </p>
        <Link
          to="/tenants"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Master List
        </Link>
      </div>
    );
  }

  const handleSaveEdit = () => {
    if (!user || !tenant) return;
    setEditError(null);
    try {
      const updated = tenantDb.updateSingleTenant(tenant.tenantCode, editForm, user);
      setTenant(updated);
      setHistory(tenantDb.getHistory(tenant.tenantCode));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Error updating tenant');
    }
  };

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
              <span className="font-mono text-xs font-bold text-indigo-600">{tenant.tenantCode}</span>
              <span className="text-slate-300">·</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  tenant.status.toLowerCase() === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tenant.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {tenant.tenantName}
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
                <span>Edit Tenant Details</span>
              </button>
            )}
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Tenant details saved successfully! Changes recorded in audit trail.</span>
        </div>
      )}

      {editError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {editError}
        </div>
      )}

      {/* Main Tenant Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Tenant Information
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tenant Code */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tenant Code</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">{tenant.tenantCode}</div>
          </div>

          {/* Tenant Name */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tenant Name</div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.tenantName || ''}
                onChange={(e) => setEditForm({ ...editForm, tenantName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-sm font-semibold text-slate-900">{tenant.tenantName}</div>
            )}
          </div>

          {/* Unit / Space */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unit / Space</div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.unit || ''}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-sm font-semibold text-slate-900">{tenant.unit}</div>
            )}
          </div>

          {/* Status */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
            {isEditing ? (
              <select
                value={editForm.status || 'Active'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            ) : (
              <div className="mt-1 text-sm font-semibold text-slate-900">{tenant.status}</div>
            )}
          </div>

          {/* Branch / Property */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch / Property</div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.branch || ''}
                onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-xs text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{tenant.branch || 'Grand Central Plaza'}</span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-xs font-mono text-slate-700 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{tenant.phone || 'N/A'}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-xs text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{tenant.email || 'N/A'}</span>
              </div>
            )}
          </div>

          {/* Rent */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Rent</div>
            {isEditing ? (
              <input
                type="number"
                value={editForm.rent || ''}
                onChange={(e) => setEditForm({ ...editForm, rent: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            ) : (
              <div className="mt-1 text-xs font-semibold text-slate-900">
                {tenant.rent ? `$${Number(tenant.rent).toLocaleString()}/mo` : 'N/A'}
              </div>
            )}
          </div>
        </div>

        {/* Preserved Raw Custom Columns (Requirement 22: Flexible Tenant Fields) */}
        {tenant.rawFields && Object.keys(tenant.rawFields).length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-xs font-bold text-slate-800">Additional Preserved Fields</div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(tenant.rawFields).map(([k, v]) => {
                if (k.toLowerCase().includes('code') || k.toLowerCase().includes('tenant')) return null;
                return (
                  <div key={k} className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-[10px] font-medium text-slate-400 uppercase">{k}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-800">{String(v || '-')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Change History (Requirement 19: Date, Field, Old Value, New Value, Changed By) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Change History & Reconciliation Log</h2>
          </div>
          <span className="text-xs text-slate-400">{history.length} recorded modifications</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No field-level change history recorded yet for this tenant. Updates applied through reconciliation sessions will appear here.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Field Changed</th>
                  <th className="px-4 py-2.5 text-rose-700 bg-rose-50/40">Old Value</th>
                  <th className="px-4 py-2.5 text-emerald-800 bg-emerald-50/40">New Value</th>
                  <th className="px-4 py-2.5">Change Type</th>
                  <th className="px-4 py-2.5">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{h.updatedDate}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{h.field}</td>
                    <td className="px-4 py-3 font-mono text-rose-700 bg-rose-50/20">{h.oldValue || '(Empty)'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800 bg-emerald-50/20">{h.newValue}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {h.changeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{h.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

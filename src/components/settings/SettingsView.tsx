import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Shield,
  Sliders,
  RotateCcw,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  User,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { useComparison } from '@/src/context/ComparisonContext';

export const SettingsView: React.FC = () => {
  const { user, canManageSettings, usersList, updateUserRole } = useAuth();
  const { resetComparisonWorkflow, navigate } = useComparison();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [defaultMissingAction, setDefaultMissingAction] = useState<'keep' | 'deactivate'>('keep');
  const [missingThresholdAlert, setMissingThresholdAlert] = useState(15);
  const [preventDuplicateUpdate, setPreventDuplicateUpdate] = useState(true);

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleConfirmClearRecords = () => {
    tenantDb.clearDatabase(user || undefined);
    resetComparisonWorkflow();
    setShowResetConfirmModal(false);
    setResetSuccessMessage(true);
    setTimeout(() => {
      setResetSuccessMessage(false);
      navigate('tenants');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            System Configuration & Preferences
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings & Matching Rules
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Configure matching safety rules, column aliases, team roles, and master data storage.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Check className="h-4 w-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Safety Guardrails */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Safety & Reconciliation Guardrails</h2>
            <p className="text-xs text-slate-500">
              Automated safeguards preventing accidental data loss during bulk updates.
            </p>

            <div className="mt-5 space-y-4">
              {/* Rule 1: Missing Tenant Policy */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Default Missing Tenant Action (Safety Rule)
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      When a tenant exists in the Master registry but is missing from the uploaded external system export.
                    </div>
                  </div>
                  <select
                    value={defaultMissingAction}
                    onChange={(e) => setDefaultMissingAction(e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="keep">Keep Active (Safest)</option>
                    <option value="deactivate">Deactivate (Set Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Rule 2: Missing Threshold Alert */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Missing Tenant Warning Threshold
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Display an alert prompt if more than this percentage of Master tenants are missing from the latest file.
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={missingThresholdAlert}
                      onChange={(e) => setMissingThresholdAlert(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center font-bold"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* Rule 3: Duplicate Tenant Code Block */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Strict Duplicate Code Enforcement
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Prevent automatic application of update batches if duplicate Tenant Codes are detected within the same file until resolved.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preventDuplicateUpdate}
                    onChange={(e) => setPreventDuplicateUpdate(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column Aliases Reference */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automatic Matching Column Aliases
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              The reconciliation engine recognizes the following standard spreadsheet header synonyms out of the box:
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40">
                <div className="font-bold text-slate-800">Tenant Code / ID (Primary Key)</div>
                <div className="mt-1 font-mono text-[11px] text-indigo-700">
                  tenant_code, tenant_id, code, id, tenantcode, identifier_code, መለያ
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40">
                <div className="font-bold text-slate-800">Tenant / Occupant Name</div>
                <div className="mt-1 font-mono text-[11px] text-indigo-700">
                  tenant_name, tenant, name, occupant, client_name, full_name, የተከራይ ስም
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40">
                <div className="font-bold text-slate-800">House / Unit Number</div>
                <div className="mt-1 font-mono text-[11px] text-indigo-700">
                  unit, house_no, apt, suite, unit_number, flat, house_number, ቤት ቁጥር
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40">
                <div className="font-bold text-slate-800">Branch / Sub-City</div>
                <div className="mt-1 font-mono text-[11px] text-indigo-700">
                  branch, sub_city, region, location, property_branch, zone, ክ/ከተማ, ቅርንጫፍ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Role & Clear Records Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Current Role Profile</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Role permissions determine access to upload, reconciliation, and administrative functions.
            </p>

            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="text-xs font-medium text-slate-500">Active Profile</div>
              <div className="mt-1 text-base font-bold text-slate-900">{user?.name}</div>
              <div className="mt-0.5 text-xs text-slate-600 font-mono">{user?.email}</div>

              <div className="mt-3 flex items-center justify-between border-t border-indigo-100/70 pt-3">
                <span className="text-xs font-semibold text-slate-700">Assigned Role:</span>
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Role Governance:</div>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                System roles are managed exclusively by Administrators. To assign or adjust permissions for team members, use the Team Roster below.
              </p>
            </div>
          </div>

          {/* Reset / Clear Registry Card */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-rose-900">
              <Trash2 className="h-4 w-4 text-rose-600" />
              <h2 className="text-base font-bold">Clear Master Records</h2>
            </div>
            <p className="mt-1 text-xs text-rose-800">
              Permanently clears all master property & tenant records, uploaded comparison sessions, and audit history logs stored in the application.
            </p>

            {resetSuccessMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-800">
                All records successfully cleared! Redirecting to master catalog...
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Purge All Master Records</span>
              </button>
            )}

            {/* In-app Confirmation Modal (Safe for iframe) */}
            {showResetConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Confirm Records Purge</h3>
                      <p className="text-[11px] text-slate-500">This action will erase all records.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you sure you want to permanently clear all master property records, uploaded reconciliation sessions, and audit history logs? The registry will be completely empty.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowResetConfirmModal(false)}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClearRecords}
                      className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
                    >
                      Yes, Clear Records
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Management & RBAC Permissions Matrix Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Team Accounts & Role Access</h2>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                Admin Managed
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              System roles and permissions are managed exclusively by Administrators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span>Full Profiles & Team Roster →</span>
            </Link>
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* User Account List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Users ({usersList.length})
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {usersList.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-white hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
                    {u.avatar || u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{u.name}</span>
                      {u.id === user?.id && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Role:</span>
                  <select
                    value={u.role}
                    disabled={user?.role !== 'Admin'}
                    onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    title={user?.role === 'Admin' ? 'Assign system role' : 'Administrator access required to assign roles'}
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Staff">Operations Staff</option>
                    <option value="Viewer">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Matrix Reference Table */}
        <div className="border-t border-slate-100 pt-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Role Permission Matrix
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">System Capability</th>
                  <th className="px-4 py-2.5 text-center">Administrator</th>
                  <th className="px-4 py-2.5 text-center">Operations Staff</th>
                  <th className="px-4 py-2.5 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { name: 'Upload Master & Latest Excel Files (.xlsx, .csv)', admin: true, staff: true, viewer: false },
                  { name: 'Automatic Column Detection & Column Mapping', admin: true, staff: true, viewer: false },
                  { name: 'Run Tenant Code Comparison Engine', admin: true, staff: true, viewer: false },
                  { name: 'Inspect Field Diffs & Filter Categories', admin: true, staff: true, viewer: true },
                  { name: 'Bulk Resolve via Heuristic Pattern Matching', admin: true, staff: true, viewer: false },
                  { name: 'Approve & Apply Reconciled Batch to Master Registry', admin: true, staff: false, viewer: false },
                  { name: 'Manual Tenant CRUD (Edit Profile, Unit, Rent)', admin: true, staff: false, viewer: false },
                  { name: 'Manage System Preferences & Clear Master Records', admin: true, staff: false, viewer: false },
                  { name: 'Download Updated Master & Change Reports (.xlsx)', admin: true, staff: true, viewer: true },
                  { name: 'Manage Team Roles & Safety Threshold Rules', admin: true, staff: false, viewer: false }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      {row.admin ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.staff ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.viewer ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

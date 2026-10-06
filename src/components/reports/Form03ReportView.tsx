import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Check,
  Building2,
  Home,
  HelpCircle,
  CheckCircle2,
  Search,
  Users,
  Layers,
  FileText,
  UserPlus,
  X,
  PieChart,
  DollarSign
} from 'lucide-react';
import {
  Form03ReportDocument,
  Form03TypologyKey
} from '@/src/types/form03Report';
import {
  form03Db,
  INITIAL_FORM_03_DATA,
  getAvailableBranches
} from '@/src/lib/database/form03Store';
import { exportForm03Excel } from '@/src/lib/excel/form03ExcelExporter';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';
import { classifyTenantForForm02 } from '@/src/lib/database/form02Store';
import { resolveBranchInfo } from '@/src/lib/database/reportStore';

export const Form03ReportView: React.FC = () => {
  const [report, setReport] = useState<Form03ReportDocument>(INITIAL_FORM_03_DATA);
  const [liveTenants, setLiveTenants] = useState<TenantRecord[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEnglishHelp, setShowEnglishHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'records'>('matrix');
  const [savedToast, setSavedToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isSyncing, setIsSyncing] = useState(false);

  // Tenant Add / Edit Modal State
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Partial<TenantRecord> | null>(null);
  const [tenantFormState, setTenantFormState] = useState<{
    code: string;
    name: string;
    branch: string;
    category: 'residential' | 'commercial';
    typology: Form03TypologyKey;
    houseNumber: string;
    rent: number;
    isOccupied: boolean;
  }>({
    code: '',
    name: '',
    branch: '1',
    category: 'residential',
    typology: 'apartment',
    houseNumber: '',
    rent: 5000,
    isOccupied: true
  });

  // Records Filter
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsOccupancyFilter, setRecordsOccupancyFilter] = useState<'ALL' | 'occupied' | 'vacant'>('ALL');
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<'ALL' | 'residential' | 'commercial'>('ALL');
  const [recordsTypologyFilter, setRecordsTypologyFilter] = useState<string>('ALL');

  // Load report and listen for changes
  const reloadData = (branchOverride?: string) => {
    const tenants = tenantDb.getTenants();
    setLiveTenants(tenants);

    const b = branchOverride !== undefined ? branchOverride : selectedBranch;
    if (tenants.length > 0) {
      const calculated = form03Db.generateFromTenants(tenants, b);
      setReport(calculated);
    } else {
      const current = form03Db.getReport();
      setReport(current);
    }
  };

  useEffect(() => {
    reloadData();

    const unsubscribe = tenantDb.subscribe((updatedTenants) => {
      setLiveTenants(updatedTenants);
      if (updatedTenants.length > 0) {
        const updated = form03Db.generateFromTenants(updatedTenants, selectedBranch);
        setReport(updated);
      } else {
        const benchmark = form03Db.resetToBenchmark();
        setReport(benchmark);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedBranch]);

  const showToast = (message: string) => {
    setSavedToast({ message, show: true });
    setTimeout(() => setSavedToast({ message: '', show: false }), 3000);
  };

  // Branch list
  const availableBranches = useMemo(() => {
    return getAvailableBranches(liveTenants);
  }, [liveTenants]);

  const handleBranchChange = (newBranch: string) => {
    setSelectedBranch(newBranch);
    setIsSyncing(true);
    setTimeout(() => {
      const updated = form03Db.generateFromTenants(liveTenants, newBranch);
      setReport(updated);
      setIsSyncing(false);
      showToast(newBranch === 'ALL' ? 'ሁሉንም ቅርንጫፎች በማካተት ቅጽ 3 ተሰልቷል' : `ቅጽ 3 ለቅርንጫፍ ${newBranch} ተዘምኗል`);
    }, 200);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const tenants = tenantDb.getTenants();
      setLiveTenants(tenants);
      if (tenants.length > 0) {
        const updated = form03Db.generateFromTenants(tenants, selectedBranch);
        setReport(updated);
        showToast(`ቅጽ 3 በ ${tenants.length} የተከራይና የቤቶች መረጃዎች ላይ ተመስርቶ ተዘጋጅቷል`);
      } else {
        const benchmark = form03Db.resetToBenchmark();
        setReport(benchmark);
        showToast('የቅጽ 3 መረጃ ተዘምኗል');
      }
      setIsSyncing(false);
    }, 300);
  };

  // Clear local database records if requested by user
  const handleClearLocalData = () => {
    if (window.confirm('እርግጠኛ ነዎት ሁሉንም የአካባቢ ዳታቤዝ መረጃዎች (Local Database Data) ማጥፋት ይፈልጋሉ?')) {
      tenantDb.clearAllData();
      setLiveTenants([]);
      const benchmark = form03Db.resetToBenchmark();
      setReport(benchmark);
      showToast('የአካባቢው ዳታቤዝ መረጃዎች ሙሉ በሙሉ ተሰርዘዋል (Local Database Data Purged)');
    }
  };

  const handleCellChange = (
    sn: number,
    section: 'residential' | 'commercial',
    field: 'houseCount' | 'tenantCount',
    value: string
  ) => {
    const num = parseInt(value, 10);
    const validNum = isNaN(num) || num < 0 ? 0 : num;
    const updated = form03Db.updateCell(sn, section, field, validNum);
    setReport(updated);
  };

  const handleRemarksChange = (sn: number, val: string) => {
    const updated = form03Db.updateRemarks(sn, val);
    setReport(updated);
  };

  const handleSignatureChange = (
    person: 'preparedBy' | 'verifiedBy' | 'approvedBy',
    field: 'name' | 'signature' | 'dateEth',
    value: string
  ) => {
    const updated = form03Db.updateSignatures({
      [person]: {
        ...report.signatures[person],
        [field]: value
      }
    });
    setReport(updated);
  };

  const handleCellDrilldown = (
    typoKey: Form03TypologyKey | 'ALL',
    cat: 'residential' | 'commercial' | 'ALL',
    occupancyOnly?: 'occupied' | 'vacant' | 'ALL'
  ) => {
    setRecordsTypologyFilter(typoKey);
    setRecordsCategoryFilter(cat);
    if (occupancyOnly && occupancyOnly !== 'ALL') {
      setRecordsOccupancyFilter(occupancyOnly);
    } else {
      setRecordsOccupancyFilter('ALL');
    }
    setActiveTab('records');
  };

  // Modal Handlers
  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    const defaultBranch = selectedBranch !== 'ALL' ? selectedBranch : '1';
    setTenantFormState({
      code: `ETH-FHC-B${defaultBranch}-${Date.now().toString().slice(-4)}`,
      name: '',
      branch: defaultBranch,
      category: 'residential',
      typology: 'apartment',
      houseNumber: `HN-${Math.floor(100 + Math.random() * 900)}`,
      rent: 5000,
      isOccupied: true
    });
    setTenantModalOpen(true);
  };

  const handleOpenEditTenant = (t: TenantRecord) => {
    const c = classifyTenantForForm02(t);
    const isOcc =
      t.status !== 'Vacant' &&
      t.status !== 'Inactive' &&
      Boolean(t.tenant_name || t.tenantName);

    setEditingTenant(t);
    setTenantFormState({
      code: t.identifier_code || t.tenantCode || '',
      name: t.tenant_name || t.tenantName || '',
      branch: t.branch || t.sub_city || '1',
      category: c.mainCategory,
      typology: (c.typology as Form03TypologyKey) || 'apartment',
      houseNumber: t.house_number || t.unit || '',
      rent: Number(t.rent_amount || t.rent || 5000),
      isOccupied: isOcc
    });
    setTenantModalOpen(true);
  };

  const handleSaveTenant = () => {
    if (!tenantFormState.code.trim()) {
      alert('እባክዎ መለያ ኮድ ያስገቡ (Code is required)');
      return;
    }

    const isCommercial = tenantFormState.category === 'commercial';
    const status = tenantFormState.isOccupied ? 'Active' : 'Vacant';
    const workStatus = tenantFormState.isOccupied ? 'Active Lease' : 'Vacant Unit (ክፍት ቤት)';
    const name = tenantFormState.isOccupied ? (tenantFormState.name.trim() || 'Tenant') : 'Vacant Unit';

    form03Db.addOrUpdateTenant({
      identifier_code: tenantFormState.code.trim(),
      tenantCode: tenantFormState.code.trim(),
      tenant_name: name,
      tenantName: name,
      branch: tenantFormState.branch.trim(),
      sub_city: tenantFormState.branch.trim(),
      historical_use: isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት',
      category: isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት',
      typology: tenantFormState.typology,
      house_number: tenantFormState.houseNumber.trim(),
      unit: tenantFormState.houseNumber.trim(),
      status,
      work_status: workStatus,
      rent_amount: tenantFormState.rent,
      rent: tenantFormState.rent,
      remarks: tenantFormState.isOccupied ? undefined : 'ክፍት ቤት'
    });

    setTenantModalOpen(false);
    showToast('ተከራይ/ቤት በተሳካ ሁኔታ ተመዝግቧል! ቅጽ 3 ወዲያውኑ ተሰልቷል');
  };

  const handleDeleteTenant = (code: string) => {
    if (window.confirm(`እርግጠኛ ነዎት ተከራይ/ቤት ${code} እንዲሰረዝ ይፈልጋሉ?`)) {
      form03Db.deleteTenant(code);
      showToast('ተከራይ ተሰርዟል! ቅጽ 3 ተዘምኗል');
    }
  };

  // Branch filtered tenants for live display
  const branchFilteredTenants = useMemo(() => {
    if (selectedBranch === 'ALL') return liveTenants;
    return liveTenants.filter(t => {
      const bInfo = resolveBranchInfo(t.sub_city || t.branch || t.city);
      return bInfo.branchCode === selectedBranch || bInfo.branchName.toLowerCase().includes(selectedBranch.toLowerCase());
    });
  }, [liveTenants, selectedBranch]);

  // Filtered tenants for Records tab
  const filteredRecords = useMemo(() => {
    return branchFilteredTenants.filter(t => {
      const c = classifyTenantForForm02(t);
      const isOccupied =
        t.status !== 'Vacant' &&
        t.status !== 'Inactive' &&
        Boolean(t.tenant_name || t.tenantName) &&
        !t.remarks?.includes('ክፍት ቤት');

      const matchesSearch =
        !recordsSearch.trim() ||
        (t.tenant_name || '').toLowerCase().includes(recordsSearch.toLowerCase()) ||
        (t.tenantCode || '').toLowerCase().includes(recordsSearch.toLowerCase()) ||
        (t.identifier_code || '').toLowerCase().includes(recordsSearch.toLowerCase()) ||
        (t.house_number || '').toLowerCase().includes(recordsSearch.toLowerCase());

      const matchesOccupancy =
        recordsOccupancyFilter === 'ALL' ||
        (recordsOccupancyFilter === 'occupied' && isOccupied) ||
        (recordsOccupancyFilter === 'vacant' && !isOccupied);

      const matchesCategory =
        recordsCategoryFilter === 'ALL' || c.mainCategory === recordsCategoryFilter;

      const matchesTypo =
        recordsTypologyFilter === 'ALL' || c.typology === recordsTypologyFilter;

      return matchesSearch && matchesOccupancy && matchesCategory && matchesTypo;
    });
  }, [branchFilteredTenants, recordsSearch, recordsOccupancyFilter, recordsCategoryFilter, recordsTypologyFilter]);

  const vacantCount = useMemo(() => {
    return Math.max(0, report.totals.grandTotal.houseCount - report.totals.grandTotal.tenantCount);
  }, [report.totals]);

  const occupancyRate = useMemo(() => {
    if (!report.totals.grandTotal.houseCount) return '0.0';
    return ((report.totals.grandTotal.tenantCount / report.totals.grandTotal.houseCount) * 100).toFixed(1);
  }, [report.totals]);

  const totalRentValue = useMemo(() => {
    return branchFilteredTenants.reduce((sum, t) => sum + (Number(t.rent_amount || t.rent) || 0), 0);
  }, [branchFilteredTenants]);

  const handleExportExcel = () => {
    exportForm03Excel(report, branchFilteredTenants);
    showToast('Excel ፋይል በተሳካ ሁኔታ ወርዷል (.xlsx)');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNum = (val: number) => {
    return (val || 0).toLocaleString();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {savedToast.show && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{savedToast.message}</span>
        </div>
      )}

      {/* Top Banner & Official Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-800 to-slate-900 text-white shadow-md ring-4 ring-indigo-50">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  {report.formNumber}
                </span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  የፌዴራል ቤቶች ኮርፖሬሽን (FHC Official)
                </span>
                {liveTenants.length > 0 ? (
                  <span className="rounded-md bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 border border-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Master Data ({branchFilteredTenants.length} Properties)</span>
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                    No Tenant Records (ባዶ መዝገብ)
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                {report.topHeaderAmharic} — {report.titleAmharic}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {report.titleEnglish} · የቤቶች ብዛት እና የተከራዮች ብዛት ንፅፅር (Units vs Active Tenants Occupancy)
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">ቅርንጫፍ:</span>
              <select
                value={selectedBranch}
                onChange={e => handleBranchChange(e.target.value)}
                className="text-xs font-bold text-indigo-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ALL">ሁሉም ቅርንጫፎች (All Branches)</option>
                {availableBranches.map(b => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.count} ቤቶች)
                  </option>
                ))}
                {availableBranches.length === 0 && (
                  <>
                    <option value="1">ቅርንጫፍ 1 (ቦሌ - Bole)</option>
                    <option value="2">ቅርንጫፍ 2 (ቂርቆስ - Kirkos)</option>
                    <option value="3">ቅርንጫፍ 3 (አራዳ - Arada)</option>
                  </>
                )}
              </select>
            </div>

            {liveTenants.length > 0 ? (
              <>
                <button
                  onClick={handleOpenAddTenant}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Unit/Tenant (ቤት/ተከራይ መዝግብ)</span>
                </button>
                <button
                  onClick={handleClearLocalData}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                  title="Remove all local database records"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>Remove Local Data (ዳታ አጥፋ)</span>
                </button>
              </>
            ) : (
              <a
                href="/upload"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
                title="Upload master tenant Excel file"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Tenant Excel (የተከራዮች ሰነድ ጫን)</span>
              </a>
            )}

            <button
              onClick={() => setShowEnglishHelp(!showEnglishHelp)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                showEnglishHelp
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>English {showEnglishHelp ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                isEditMode
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Done Editing</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Matrix</span>
                </>
              )}
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              title="Recalculate report strictly based on current tenant database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Update from Tenants</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tenant Connection Notice */}
        <div className="mt-4 flex flex-wrap items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>
              {liveTenants.length > 0 ? (
                <span>
                  <strong>ሪፖርቱ በቀጥታ ከተከራዮች መዝገብ ጋር ተገናኝቷል:</strong> በማስተር መዝገብ ውስጥ ያሉ{' '}
                  <span className="font-bold text-indigo-700">{branchFilteredTenants.length.toLocaleString()}</span> ቤቶችና ተከራዮች
                  ተመድበው ቅጽ 3 ላይ ተሰልተዋል። (ምጣኔ/Occupancy: <strong>{occupancyRate}%</strong> · ክፍት ቤቶች/Vacant: <strong>{vacantCount}</strong>)
                </span>
              ) : (
                <span>
                  <strong>የተከራይ መረጃ የለም (Empty Local Database):</strong> በማስተር ተከራዮች መዝገብ ውስጥ ምንም መረጃ የለም።
                  ሪፖርቱ በተጨባጭ ተከራዮች ላይ ተመስርቶ እንዲሰላ እባክዎ ዋናውን የኤክሴል ሰነድ ይጫኑ ወይም አዲስ ተከራይ ይመዝግቡ።
                </span>
              )}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
            የተመረጠው ቅርንጫፍ: {report.branchName}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div
            onClick={() => handleCellDrilldown('apartment', 'ALL')}
            className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 hover:bg-indigo-100/60 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700">
              <span>ጠቅላላ ቤቶች (Total Houses)</span>
              <Home className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="mt-1 text-2xl font-black text-indigo-950">
              {formatNum(report.totals.grandTotal.houseCount)}
            </div>
            <div className="text-[10px] text-indigo-600 font-medium">የተመዘገቡ ቤቶች ድምር</div>
          </div>

          <div
            onClick={() => handleCellDrilldown('apartment', 'ALL', 'occupied')}
            className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 hover:bg-emerald-100/60 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>የተከራዩ ቤቶች (Occupied)</span>
              <Users className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-950">
              {formatNum(report.totals.grandTotal.tenantCount)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">ተከራይ ያላቸው ንቁ ቤቶች</div>
          </div>

          <div
            onClick={() => {
              setRecordsOccupancyFilter('vacant');
              setActiveTab('records');
            }}
            className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 hover:bg-rose-100/60 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700">
              <span>ክፍት ቤቶች (Vacant Units)</span>
              <PieChart className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="mt-1 text-2xl font-black text-rose-950">
              {formatNum(vacantCount)}
            </div>
            <div className="text-[10px] text-rose-600 font-medium">ተከራይ ያልተመደበላቸው</div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700">
              <span>የተያዙ ቤቶች ምጣኔ (Rate)</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="mt-1 text-2xl font-black text-purple-950">
              {occupancyRate}%
            </div>
            <div className="text-[10px] text-purple-600 font-medium">የተከራዩ ቤቶች ፐርሰንት</div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700">
              <span>ወርሃዊ ኪራይ (Total Rent)</span>
              <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-xl font-black text-amber-950 truncate">
              {formatNum(totalRentValue)} ETB
            </div>
            <div className="text-[10px] text-amber-700 font-medium">የቅርንጫፉ ጠቅላላ ገቢ</div>
          </div>
        </div>

        {/* Tab Switcher: Matrix vs Supporting Records */}
        <div className="mt-6 flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>ቅጽ - 03 ኦፊሴላዊ ሰንጠረዥ (Form 03 Matrix Grid)</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
              activeTab === 'records'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>ተዛማጅ የተከራይና ቤቶች ዝርዝር (Supporting Records: {filteredRecords.length})</span>
          </button>
        </div>
      </div>

      {/* View Content based on Tab */}
      {activeTab === 'matrix' ? (
        <div className="space-y-6">
          {/* Main Matrix Document Container */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            {/* Document Header Text */}
            <div className="mb-4 text-center">
              <h2 className="text-lg font-black text-slate-900 tracking-wide">
                {report.topHeaderAmharic}
              </h2>
              <h3 className="text-base font-bold text-slate-900">
                {report.titleAmharic}
              </h3>
              {showEnglishHelp && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  {report.titleEnglish}
                </p>
              )}
            </div>

            {/* Scrollable Matrix Table replicating Excel Grid Layout */}
            <div className="overflow-x-auto rounded-xl border border-slate-400 bg-slate-50 shadow-inner">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  {/* Row 1: Main Category Headers */}
                  <tr className="bg-slate-300 border-b border-slate-400 text-slate-900 font-bold">
                    <th
                      rowSpan={2}
                      className="border-r border-slate-400 p-2 text-center align-middle font-bold text-slate-950 min-w-[50px] bg-slate-300"
                    >
                      <span className="block">ተ/ቁ</span>
                      {showEnglishHelp && <span className="block text-[10px] text-slate-600 font-normal">S.N</span>}
                    </th>
                    <th
                      rowSpan={2}
                      className="border-r border-slate-400 p-2 text-center align-middle font-black text-slate-950 min-w-[130px] bg-slate-300"
                    >
                      የቤቶች ዓይነት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-600 font-normal">Type of Houses</span>}
                    </th>

                    {/* መኖሪያ (Residential) */}
                    <th
                      colSpan={2}
                      className="border-r-2 border-r-slate-400 p-2 text-center font-black text-slate-950 bg-slate-300 min-w-[170px]"
                    >
                      መኖሪያ
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Residential</span>}
                    </th>

                    {/* ድርጅት (Commercial / Enterprise) */}
                    <th
                      colSpan={2}
                      className="border-r-2 border-r-slate-400 p-2 text-center font-black text-slate-950 bg-slate-300 min-w-[170px]"
                    >
                      ድርጅት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Commercial</span>}
                    </th>

                    {/* ጠቅላላ ድምር (Grand Total) */}
                    <th
                      colSpan={2}
                      className="border-r border-slate-400 p-2 text-center font-black text-slate-950 bg-slate-300 min-w-[170px]"
                    >
                      ጠቅላላ ድምር
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Grand Total</span>}
                    </th>

                    {/* ምርመራ (Remarks) */}
                    <th
                      rowSpan={2}
                      className="p-2 text-center align-middle font-black text-slate-950 min-w-[110px] bg-slate-300"
                    >
                      ምርመራ
                      {showEnglishHelp && <span className="block text-[10px] text-slate-600 font-normal">Remarks</span>}
                    </th>
                  </tr>

                  {/* Row 2: Sub-headers (የቤት ብዛት / የተከራይ ብዛት) */}
                  <tr className="bg-slate-200 border-b-2 border-slate-400 text-[11px] font-bold text-slate-900">
                    {/* Residential */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[85px]">
                      የቤት ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">House Count</span>}
                    </th>
                    <th className="border-r-2 border-r-slate-400 p-1.5 min-w-[85px]">
                      የተከራይ ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Tenant Count</span>}
                    </th>

                    {/* Commercial */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[85px]">
                      የቤት ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">House Count</span>}
                    </th>
                    <th className="border-r-2 border-r-slate-400 p-1.5 min-w-[85px]">
                      የተከራይ ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Tenant Count</span>}
                    </th>

                    {/* Grand Total */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[85px] bg-slate-250 font-black text-slate-950">
                      የቤት ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-700 font-normal">House Count</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[85px] bg-slate-250 font-black text-slate-950">
                      የተከራይ ብዛት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-700 font-normal">Tenant Count</span>}
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-300 text-slate-800 font-medium">
                  {report.rows.map((row) => (
                    <tr
                      key={row.sn}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-300"
                    >
                      {/* ተ/ቁ */}
                      <td className="border-r border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50 text-center">
                        {row.sn}
                      </td>

                      {/* የቤቶች ዓይነት */}
                      <td className="border-r border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50 text-left pl-4">
                        <span className="font-bold">{row.typologyLabelAm}</span>
                        {showEnglishHelp && (
                          <span className="text-[10px] text-slate-500 font-normal ml-1.5">
                            ({row.typologyLabelEn})
                          </span>
                        )}
                      </td>

                      {/* ================= RESIDENTIAL ================= */}
                      {isEditMode ? (
                        <>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.houseCount}
                              onChange={e => handleCellChange(row.sn, 'residential', 'houseCount', e.target.value)}
                              className="w-16 text-center rounded border border-slate-300 p-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r-2 border-r-slate-400 p-1">
                            <input
                              type="number"
                              value={row.residential.tenantCount}
                              onChange={e => handleCellChange(row.sn, 'residential', 'tenantCount', e.target.value)}
                              className="w-16 text-center rounded border border-slate-300 p-1 text-xs font-semibold"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() => handleCellDrilldown(row.typologyKey, 'residential', 'ALL')}
                            className="border-r border-slate-300 p-2.5 font-semibold hover:bg-indigo-100 hover:text-indigo-900 cursor-pointer transition-colors"
                            title="Click to view supporting residential houses"
                          >
                            {formatNum(row.residential.houseCount)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown(row.typologyKey, 'residential', 'occupied')}
                            className="border-r-2 border-r-slate-400 p-2.5 font-semibold hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer transition-colors"
                            title="Click to view supporting residential occupied tenants"
                          >
                            {formatNum(row.residential.tenantCount)}
                          </td>
                        </>
                      )}

                      {/* ================= COMMERCIAL ================= */}
                      {isEditMode ? (
                        <>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.houseCount}
                              onChange={e => handleCellChange(row.sn, 'commercial', 'houseCount', e.target.value)}
                              className="w-16 text-center rounded border border-slate-300 p-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r-2 border-r-slate-400 p-1">
                            <input
                              type="number"
                              value={row.commercial.tenantCount}
                              onChange={e => handleCellChange(row.sn, 'commercial', 'tenantCount', e.target.value)}
                              className="w-16 text-center rounded border border-slate-300 p-1 text-xs font-semibold"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() => handleCellDrilldown(row.typologyKey, 'commercial', 'ALL')}
                            className="border-r border-slate-300 p-2.5 font-semibold hover:bg-indigo-100 hover:text-indigo-900 cursor-pointer transition-colors"
                            title="Click to view supporting commercial houses"
                          >
                            {formatNum(row.commercial.houseCount)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown(row.typologyKey, 'commercial', 'occupied')}
                            className="border-r-2 border-r-slate-400 p-2.5 font-semibold hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer transition-colors"
                            title="Click to view supporting commercial occupied tenants"
                          >
                            {formatNum(row.commercial.tenantCount)}
                          </td>
                        </>
                      )}

                      {/* ================= GRAND TOTAL ================= */}
                      <td
                        onClick={() => handleCellDrilldown(row.typologyKey, 'ALL', 'ALL')}
                        className="border-r border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50 hover:bg-indigo-100 hover:text-indigo-900 cursor-pointer transition-colors"
                        title="Click to view all supporting houses of this typology"
                      >
                        {formatNum(row.grandTotal.houseCount)}
                      </td>
                      <td
                        onClick={() => handleCellDrilldown(row.typologyKey, 'ALL', 'occupied')}
                        className="border-r border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer transition-colors"
                        title="Click to view all supporting occupied tenants of this typology"
                      >
                        {formatNum(row.grandTotal.tenantCount)}
                      </td>

                      {/* ================= REMARKS ================= */}
                      <td className="p-2 text-slate-500 text-[11px] text-left">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={row.remarks || ''}
                            onChange={e => handleRemarksChange(row.sn, e.target.value)}
                            placeholder="ምርመራ ጻፍ"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          <span>{row.remarks || ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Grand Total Row */}
                  <tr className="bg-slate-200 border-t-2 border-slate-400 font-black text-slate-950 text-xs">
                    <td colSpan={2} className="border-r border-slate-400 p-3 text-center bg-slate-300">
                      ጠቅላላ ድምር (Grand Total)
                    </td>

                    {/* Residential Totals */}
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'residential', 'ALL')}
                      className="border-r border-slate-400 p-2.5 hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      {formatNum(report.totals.residential.houseCount)}
                    </td>
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'residential', 'occupied')}
                      className="border-r-2 border-r-slate-400 p-2.5 hover:bg-emerald-100 cursor-pointer transition-colors text-emerald-900"
                    >
                      {formatNum(report.totals.residential.tenantCount)}
                    </td>

                    {/* Commercial Totals */}
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'commercial', 'ALL')}
                      className="border-r border-slate-400 p-2.5 hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      {formatNum(report.totals.commercial.houseCount)}
                    </td>
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'commercial', 'occupied')}
                      className="border-r-2 border-r-slate-400 p-2.5 hover:bg-emerald-100 cursor-pointer transition-colors text-emerald-900"
                    >
                      {formatNum(report.totals.commercial.tenantCount)}
                    </td>

                    {/* Grand Totals */}
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'ALL', 'ALL')}
                      className="border-r border-slate-400 p-2.5 bg-slate-300 text-indigo-950 text-sm hover:bg-indigo-200 cursor-pointer transition-colors"
                    >
                      {formatNum(report.totals.grandTotal.houseCount)}
                    </td>
                    <td
                      onClick={() => handleCellDrilldown('apartment', 'ALL', 'occupied')}
                      className="border-r border-slate-400 p-2.5 bg-slate-300 text-emerald-950 text-sm hover:bg-emerald-200 cursor-pointer transition-colors"
                    >
                      {formatNum(report.totals.grandTotal.tenantCount)}
                    </td>

                    <td className="p-2.5 text-center text-slate-600 font-semibold text-[11px]">
                      {occupancyRate}% Occupied
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Footer Signature Block */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. ያዘጋጀው (Prepared By) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>{report.signatures.preparedBy.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Prepared By</span>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">ስም:</span>
                        <input
                          type="text"
                          value={report.signatures.preparedBy.name}
                          onChange={e => handleSignatureChange('preparedBy', 'name', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">ቀን:</span>
                        <input
                          type="text"
                          value={report.signatures.preparedBy.dateEth}
                          onChange={e => handleSignatureChange('preparedBy', 'dateEth', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ስም:</span>
                        <span className="font-bold text-slate-900">{report.signatures.preparedBy.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ፊርማ:</span>
                        <span className="font-mono text-indigo-700 italic">{report.signatures.preparedBy.signature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ቀን:</span>
                        <span className="text-slate-700 font-medium">{report.signatures.preparedBy.dateEth}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. ያረጋገጠው (Verified By) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>{report.signatures.verifiedBy.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Verified By</span>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">ስም:</span>
                        <input
                          type="text"
                          value={report.signatures.verifiedBy.name}
                          onChange={e => handleSignatureChange('verifiedBy', 'name', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">ቀን:</span>
                        <input
                          type="text"
                          value={report.signatures.verifiedBy.dateEth}
                          onChange={e => handleSignatureChange('verifiedBy', 'dateEth', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ስም:</span>
                        <span className="font-bold text-slate-900">{report.signatures.verifiedBy.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ፊርማ:</span>
                        <span className="font-mono text-indigo-700 italic">{report.signatures.verifiedBy.signature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ቀን:</span>
                        <span className="text-slate-700 font-medium">{report.signatures.verifiedBy.dateEth}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. የፀደቀው (Approved By) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>{report.signatures.approvedBy.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Approved By</span>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">ስም:</span>
                        <input
                          type="text"
                          value={report.signatures.approvedBy.name}
                          onChange={e => handleSignatureChange('approvedBy', 'name', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">ቀን:</span>
                        <input
                          type="text"
                          value={report.signatures.approvedBy.dateEth}
                          onChange={e => handleSignatureChange('approvedBy', 'dateEth', e.target.value)}
                          className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ስም:</span>
                        <span className="font-bold text-slate-900">{report.signatures.approvedBy.name || 'አቶ ዳዊት ወልዴ'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ፊርማ:</span>
                        <span className="text-slate-400 italic">___________________</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ቀን:</span>
                        <span className="text-slate-700 font-medium">{report.signatures.approvedBy.dateEth}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Supporting Tenant Records Tab */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Supporting Tenant & Property Records ({filteredRecords.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Individual houses and active tenants dynamically classified into Form 03 typologies.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, code, house no..."
                    value={recordsSearch}
                    onChange={e => setRecordsSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={recordsOccupancyFilter}
                  onChange={e => setRecordsOccupancyFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Units (የተከራዩና ክፍት ቤቶች)</option>
                  <option value="occupied">የተከራየ ብቻ (Occupied with Tenant)</option>
                  <option value="vacant">ክፍት ብቻ (Vacant Units)</option>
                </select>

                <select
                  value={recordsCategoryFilter}
                  onChange={e => setRecordsCategoryFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories (ሁሉም ምድብ)</option>
                  <option value="residential">የመኖሪያ ቤት (Residential)</option>
                  <option value="commercial">የድርጅት ቤት (Commercial)</option>
                </select>

                <select
                  value={recordsTypologyFilter}
                  onChange={e => setRecordsTypologyFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Typologies (ሁሉም የቤቱ ዓይነት)</option>
                  <option value="apartment">አፓርትማ (Apartment)</option>
                  <option value="tinRoof">ቆርቆሮ (Tin Roof)</option>
                  <option value="villa">ቪላ (Villa)</option>
                  <option value="standardHouse">ተራ ቤት (Standard House)</option>
                  <option value="hostel">ሆስቴል (Hostel)</option>
                  <option value="hall">አዳራሽ (Hall)</option>
                  <option value="shenshan">ሸንሻን (Shenshan / Stall)</option>
                  <option value="garage">ጋራዥ (Garage)</option>
                </select>

                <button
                  onClick={handleOpenAddTenant}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add Record</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">ተ.ቁ</th>
                    <th className="p-3">መለያ (Code)</th>
                    <th className="p-3">የተከራይ ስም (Tenant Name)</th>
                    <th className="p-3">ቅርንጫፍ (Branch)</th>
                    <th className="p-3">የይዞታ ሁኔታ (Status)</th>
                    <th className="p-3">ዋና ምድብ</th>
                    <th className="p-3">የቤቱ ዓይነት (Typology)</th>
                    <th className="p-3">ቤት ቁጥር</th>
                    <th className="p-3">ወርሃዊ ኪራይ (Rent)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-slate-400">
                        {branchFilteredTenants.length === 0 ? (
                          <div className="space-y-3">
                            <div className="font-medium text-slate-700">No tenant records exist in the local database for this branch.</div>
                            <div className="text-xs text-slate-400">Upload your master Excel file or add tenants to view live dynamic records.</div>
                            <div className="flex items-center justify-center gap-3">
                              <a
                                href="/upload"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Upload Tenant Excel</span>
                              </a>
                              <button
                                onClick={handleOpenAddTenant}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span>Register Property / Tenant</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          'No records match your filter criteria.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.slice(0, 100).map((t, idx) => {
                      const c = classifyTenantForForm02(t);
                      const isOccupied =
                        t.status !== 'Vacant' &&
                        t.status !== 'Inactive' &&
                        Boolean(t.tenant_name || t.tenantName) &&
                        !t.remarks?.includes('ክፍት ቤት');

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-mono font-semibold text-indigo-700">
                            {t.identifier_code || t.tenantCode}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {isOccupied ? (
                              t.tenant_name || t.tenantName
                            ) : (
                              <span className="italic text-rose-600 font-normal">
                                — (ክፍት ቤት / Vacant House)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {t.branch || t.sub_city || '1'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isOccupied
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isOccupied ? 'የተከራየ (Occupied)' : 'ያልተከራየ (Vacant)'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                c.mainCategory === 'residential'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {c.mainCategory === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">{c.typologyLabelAm}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({c.typologyLabelEn})</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{t.house_number || t.unit || '-'}</td>
                          <td className="p-3 font-semibold text-slate-900">
                            {t.rent_amount || t.rent ? `${Number(t.rent_amount || t.rent).toLocaleString()} ETB` : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditTenant(t)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                title="Edit Tenant / Property"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(t.identifier_code || t.tenantCode)}
                                className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {filteredRecords.length > 100 && (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  Showing first 100 records of {filteredRecords.length}. Export to Excel to view the complete catalog.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Tenant / Unit */}
      {tenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <span>{editingTenant ? 'Edit Property / Tenant (መረጃ አሻሽል)' : 'Add Property / Tenant (አዲስ መዝግብ)'}</span>
              </h3>
              <button
                onClick={() => setTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">መለያ ኮድ (Identifier Code)</label>
                <input
                  type="text"
                  value={tenantFormState.code}
                  onChange={e => setTenantFormState({ ...tenantFormState, code: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">የይዞታ ሁኔታ (Occupancy Status)</label>
                <select
                  value={tenantFormState.isOccupied ? 'occupied' : 'vacant'}
                  onChange={e => setTenantFormState({ ...tenantFormState, isOccupied: e.target.value === 'occupied' })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="occupied">የተከራየ (Occupied by Tenant)</option>
                  <option value="vacant">ክፍት ቤት (Vacant Unit)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700">
                  {tenantFormState.isOccupied ? 'የተከራይ ስም (Tenant Name)' : 'የቤቱ ስያሜ / መግለጫ (Unit Description)'}
                </label>
                <input
                  type="text"
                  value={tenantFormState.name}
                  onChange={e => setTenantFormState({ ...tenantFormState, name: e.target.value })}
                  placeholder={tenantFormState.isOccupied ? 'e.g. አበበ ከበደ' : 'Vacant Unit (ክፍት ቤት)'}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ዋና ምድብ (Category)</label>
                <select
                  value={tenantFormState.category}
                  onChange={e =>
                    setTenantFormState({
                      ...tenantFormState,
                      category: e.target.value as any,
                      typology: e.target.value === 'residential' ? 'apartment' : 'standardHouse'
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="residential">የመኖሪያ ቤት (Residential)</option>
                  <option value="commercial">የድርጅት ቤት (Commercial)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">የቤቱ ዓይነት (Typology)</label>
                <select
                  value={tenantFormState.typology}
                  onChange={e => setTenantFormState({ ...tenantFormState, typology: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-900"
                >
                  <option value="apartment">አፓርትማ (Apartment)</option>
                  <option value="tinRoof">ቆርቆሮ (Tin Roof)</option>
                  <option value="villa">ቪላ (Villa)</option>
                  <option value="standardHouse">ተራ ቤት (Standard House)</option>
                  <option value="hostel">ሆስቴል (Hostel)</option>
                  <option value="hall">አዳራሽ (Hall)</option>
                  <option value="shenshan">ሸንሻን (Shenshan / Stall)</option>
                  <option value="garage">ጋራዥ (Garage)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ቅርንጫፍ / ክ/ከተማ (Branch / Sub-city)</label>
                <input
                  type="text"
                  value={tenantFormState.branch}
                  onChange={e => setTenantFormState({ ...tenantFormState, branch: e.target.value })}
                  placeholder="e.g. 1, ቦሌ, ቂርቆስ"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ቤት ቁጥር (House No.)</label>
                <input
                  type="text"
                  value={tenantFormState.houseNumber}
                  onChange={e => setTenantFormState({ ...tenantFormState, houseNumber: e.target.value })}
                  placeholder="e.g. HN-104"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700">ወርሃዊ ኪራይ በብር (Monthly Rent ETB)</label>
                <input
                  type="number"
                  value={tenantFormState.rent}
                  onChange={e => setTenantFormState({ ...tenantFormState, rent: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setTenantModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTenant}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                {editingTenant ? 'Update Record & Recalculate Form 03' : 'Save Record & Update Form 03'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

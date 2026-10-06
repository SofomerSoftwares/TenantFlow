import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
  Home,
  Briefcase,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Save,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Eye,
  Table,
  CheckSquare,
  Users,
  Layers,
  FileText,
  UserPlus,
  X
} from 'lucide-react';
import {
  Form02ReportDocument,
  Form02BranchRow,
  Form02BuildingTypology,
  TenantForm02Classification
} from '@/src/types/form02Report';
import {
  form02Db,
  INITIAL_FORM_02_DATA,
  classifyTenantForForm02,
  computeSummaryGrandTotals
} from '@/src/lib/database/form02Store';
import { exportForm02Excel } from '@/src/lib/excel/form02ExcelExporter';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';

export const Form02ReportView: React.FC = () => {
  const [report, setReport] = useState<Form02ReportDocument>(INITIAL_FORM_02_DATA);
  const [liveTenants, setLiveTenants] = useState<TenantRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEnglishHelp, setShowEnglishHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'records'>('matrix');
  const [savedToast, setSavedToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [newBranchModalOpen, setNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Tenant Add / Edit Modal State
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Partial<TenantRecord> | null>(null);
  const [tenantFormState, setTenantFormState] = useState<{
    code: string;
    name: string;
    branch: string;
    category: 'residential' | 'commercial';
    typology: Form02BuildingTypology;
    houseNumber: string;
    rent: number;
  }>({
    code: '',
    name: '',
    branch: '1',
    category: 'residential',
    typology: 'apartment',
    houseNumber: '',
    rent: 5000
  });

  // Records Filter
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<'ALL' | 'residential' | 'commercial'>('ALL');
  const [recordsTypologyFilter, setRecordsTypologyFilter] = useState<string>('ALL');

  // Load report and listen for changes
  const reloadData = () => {
    const tenants = tenantDb.getTenants();
    setLiveTenants(tenants);

    if (tenants.length > 0) {
      const calculated = form02Db.generateFromTenants(tenants);
      setReport(calculated);
    } else {
      const current = form02Db.getReport();
      setReport(current);
    }
  };

  useEffect(() => {
    reloadData();

    const unsubscribe = tenantDb.subscribe((updatedTenants) => {
      setLiveTenants(updatedTenants);
      if (updatedTenants.length > 0) {
        const updated = form02Db.generateFromTenants(updatedTenants);
        setReport(updated);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showToast = (message: string) => {
    setSavedToast({ message, show: true });
    setTimeout(() => setSavedToast({ message: '', show: false }), 3000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const tenants = tenantDb.getTenants();
      setLiveTenants(tenants);
      if (tenants.length > 0) {
        const updated = form02Db.generateFromTenants(tenants);
        setReport(updated);
        showToast(`ቅጽ 2 በ ${tenants.length} የተከራይ መረጃዎች ላይ ተመስርቶ ተዘጋጅቷል (Updated from Tenants)`);
      } else {
        const benchmark = form02Db.resetToBenchmark();
        setReport(benchmark);
        showToast('የማስተር ሪፖርት ኦፊሴላዊ መረጃ ተጭኗል (Benchmark Loaded)');
      }
      setIsSyncing(false);
    }, 400);
  };

  const handleResetToBenchmark = () => {
    const reset = form02Db.resetToBenchmark();
    setReport(reset);
    showToast('ኦፊሴላዊ የቅጽ - 02 ናሙና ተመልሷል (Restored Benchmark)');
  };

  // Clear local database records if requested by user
  const handleClearLocalData = () => {
    if (window.confirm('እርግጠኛ ነዎት ሁሉንም የአካባቢ ዳታቤዝ መረጃዎች (Local Database Data) ማጥፋት ይፈልጋሉ?')) {
      tenantDb.clearAllData();
      setLiveTenants([]);
      const benchmark = form02Db.resetToBenchmark();
      setReport(benchmark);
      showToast('የአካባቢው ዳታቤዝ መረጃዎች ሙሉ በሙሉ ተሰርዘዋል (Local Database Data Purged)');
    }
  };

  const handleCellChange = (
    rowId: string,
    section: 'residential' | 'commercial',
    field: string,
    value: string
  ) => {
    const num = parseInt(value, 10);
    const validNum = isNaN(num) || num < 0 ? 0 : num;
    const updated = form02Db.updateCell(rowId, section, field, validNum);
    setReport(updated);
  };

  const handleSignatureChange = (
    person: 'preparedBy' | 'verifiedBy' | 'approvedBy',
    field: 'name' | 'signature' | 'dateEth',
    value: string
  ) => {
    const updated = form02Db.updateSignatures({
      [person]: {
        ...report.signatures[person],
        [field]: value
      }
    });
    setReport(updated);
  };

  const handleAddBranch = () => {
    if (!newBranchName.trim()) return;
    const updated = form02Db.addBranchRow(newBranchName.trim());
    setReport(updated);
    setNewBranchName('');
    setNewBranchModalOpen(false);
    showToast('አዲስ ቅርንጫፍ ተጨምሯል');
  };

  const handleDeleteBranch = (rowId: string) => {
    if (confirm('እርግጠኛ ነዎት ይህ ቅርንጫፍ እንዲሰረዝ ይፈልጋሉ?')) {
      const updated = form02Db.deleteBranchRow(rowId);
      setReport(updated);
      showToast('ቅርንጫፉ ተሰርዟል');
    }
  };

  // Clicking on any cell drilldowns to the corresponding records in Tab 2
  const handleCellDrilldown = (cat: 'residential' | 'commercial', typo: Form02BuildingTypology) => {
    setRecordsCategoryFilter(cat);
    setRecordsTypologyFilter(typo);
    setActiveTab('records');
  };

  // Open modal to add a tenant
  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setTenantFormState({
      code: `ETH-FHC-B1-NEW-${Date.now().toString().slice(-4)}`,
      name: '',
      branch: '1',
      category: 'residential',
      typology: 'apartment',
      houseNumber: '',
      rent: 6500
    });
    setTenantModalOpen(true);
  };

  // Open modal to edit existing tenant
  const handleOpenEditTenant = (t: TenantRecord) => {
    const classified = classifyTenantForForm02(t);
    setEditingTenant(t);
    setTenantFormState({
      code: t.identifier_code || t.tenantCode,
      name: t.tenant_name || t.tenantName,
      branch: t.sub_city || t.branch || '1',
      category: classified.mainCategory,
      typology: classified.typology,
      houseNumber: t.house_number || t.unit || '',
      rent: Number(t.rent_amount || t.rent || 5000)
    });
    setTenantModalOpen(true);
  };

  const handleSaveTenant = () => {
    if (!tenantFormState.name.trim()) {
      alert('እባክዎ የተከራይ ስም ያስገቡ (Please enter tenant name)');
      return;
    }

    const payload: Partial<TenantRecord> = {
      identifier_code: tenantFormState.code,
      tenantCode: tenantFormState.code,
      tenant_name: tenantFormState.name,
      tenantName: tenantFormState.name,
      sub_city: tenantFormState.branch,
      branch: tenantFormState.branch,
      category: tenantFormState.category === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት',
      historical_use: tenantFormState.category === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት',
      typology: tenantFormState.typology,
      house_number: tenantFormState.houseNumber || 'HN-101',
      unit: tenantFormState.houseNumber || 'HN-101',
      rent_amount: tenantFormState.rent,
      rent: tenantFormState.rent
    };

    form02Db.addOrUpdateTenant(payload);
    setTenantModalOpen(false);
    showToast(`ተከራይ ${tenantFormState.name} ተቀምጧል! ቅጽ 2 ወዲያውኑ ተዘምኗል።`);
  };

  const handleDeleteTenant = (code: string) => {
    if (confirm(`እርግጠኛ ነዎት ይህን ተከራይ (${code}) መሰረዝ ይፈልጋሉ?`)) {
      form02Db.deleteTenant(code);
      showToast(`ተከራይ ${code} ተሰርዟል! ቅጽ 2 ተዘምኗል።`);
    }
  };

  const summaryTotals = useMemo(() => {
    return computeSummaryGrandTotals(report.rows);
  }, [report.rows]);

  // Classified Tenants for Drilldown
  const classifiedTenants: TenantForm02Classification[] = useMemo(() => {
    return liveTenants.map(t => classifyTenantForForm02(t));
  }, [liveTenants]);

  const filteredTenants = useMemo(() => {
    return classifiedTenants.filter(t => {
      const matchesSearch =
        !recordsSearch.trim() ||
        t.tenantName.toLowerCase().includes(recordsSearch.toLowerCase()) ||
        t.tenantCode.toLowerCase().includes(recordsSearch.toLowerCase()) ||
        t.houseNumber.toLowerCase().includes(recordsSearch.toLowerCase());

      const matchesCat =
        recordsCategoryFilter === 'ALL' || t.mainCategory === recordsCategoryFilter;

      const matchesTypo =
        recordsTypologyFilter === 'ALL' || t.typology === recordsTypologyFilter;

      return matchesSearch && matchesCat && matchesTypo;
    });
  }, [classifiedTenants, recordsSearch, recordsCategoryFilter, recordsTypologyFilter]);

  const handleExportExcel = () => {
    exportForm02Excel(report, liveTenants);
    showToast('Excel ፋይል በተሳካ ሁኔታ ወርዷል (.xlsx)');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNum = (val: number) => {
    if (val === 0) return '-';
    return val.toLocaleString();
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

      {/* Top Banner & Official Ethiopian Corporation Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-md ring-4 ring-indigo-50">
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
                    <span>Live Tenant Driven ({liveTenants.length} Records)</span>
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                    Sheet Benchmark Mode
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                {report.titleAmharic}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {report.titleEnglish} · የቤቶች ብዛት በተከራዮች መረጃ መሰረት (Housing Count Based on Master Tenants)
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {liveTenants.length > 0 ? (
              <button
                onClick={handleClearLocalData}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                title="Remove all local database records"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Remove Local Data (ዳታ አጥፋ)</span>
              </button>
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
              <span>English Guides {showEnglishHelp ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
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
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Recalculate report strictly based on current tenant database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Update from Tenants</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tenant Connection Notice */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>
              {liveTenants.length > 0 ? (
                <span>
                  <strong>ሪፖርቱ በቀጥታ ከተከራዮች መዝገብ ጋር ተገናኝቷል:</strong> በማስተር መዝገብ ውስጥ ያሉ{' '}
                  <span className="font-bold text-indigo-700">{liveTenants.length.toLocaleString()}</span> ተከራዮች
                  ተመድበው ቅጽ 2 ላይ ተሰልተዋል። ማንኛውም የተከራይ ለውጥ ወይም ጭማሪ እዚህ ወዲያውኑ ይንጸባረቃል።
                </span>
              ) : (
                <span>
                  <strong>የተከራይ መረጃ የለም (Empty Local Database):</strong> በማስተር ተከራዮች መዝገብ ውስጥ ምንም መረጃ የለም።
                  ሪፖርቱ በተጨባጭ ተከራዮች ላይ ተመስርቶ እንዲሰላ እባክዎ ዋናውን የኤክሴል ሰነድ ይጫኑ።
                </span>
              )}
            </span>
          </div>

          {liveTenants.length > 0 && (
            <button
              onClick={handleOpenAddTenant}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Tenant</span>
            </button>
          )}
        </div>

        {/* Metric Summary Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <div className="text-[11px] font-semibold text-indigo-700">ጠቅላላ ቤቶች ብዛት (Total)</div>
            <div className="mt-1 text-2xl font-black text-indigo-950">
              {summaryTotals.grandTotal.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600">Across All Categories</div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="text-[11px] font-semibold text-emerald-800">የመኖሪያ ቤት (Residential)</div>
            <div className="mt-1 text-2xl font-black text-emerald-950">
              {summaryTotals.residential.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-700">
              {((summaryTotals.residential.total / (summaryTotals.grandTotal.total || 1)) * 100).toFixed(1)}% of inventory
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
            <div className="text-[11px] font-semibold text-amber-800">የድርጅት ቤት (Enterprise)</div>
            <div className="mt-1 text-2xl font-black text-amber-950">
              {summaryTotals.commercial.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-700">
              {((summaryTotals.commercial.total / (summaryTotals.grandTotal.total || 1)) * 100).toFixed(1)}% of inventory
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] font-semibold text-slate-700">ቅርንጫፎች (Branches)</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{report.rows.length}</div>
            <div className="text-[10px] text-slate-500">Reporting branch offices</div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-purple-800">ተራ ቤት (Ordinary Houses)</div>
            <div className="mt-1 text-2xl font-black text-purple-950">
              {summaryTotals.grandTotal.standardHouse.toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-700">Highest building typology</div>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>ኦፊሴላዊ የሰንጠረዥ ፎርማት (Official Form 02 Matrix)</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
              activeTab === 'records'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>ዝርዝር የተከራዮች መረጃ (Supporting Tenant Records - {liveTenants.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: OFFICIAL FORM 02 MATRIX ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-300 bg-white p-4 lg:p-6 shadow-sm overflow-hidden">
            {/* Document Header Text matching image */}
            <div className="text-center pb-4">
              <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">
                {report.titleAmharic}
              </h2>
              {showEnglishHelp && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Federal Housing Corporation · Housing Inventory Administered by Branch (Form - 02)
                </p>
              )}
            </div>

            {/* Scrollable Matrix Table replicating Excel Grid Layout */}
            <div className="overflow-x-auto rounded-xl border border-slate-400 bg-slate-50 shadow-inner">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  {/* Row 1: Section Title across columns */}
                  <tr className="bg-slate-300 border-b border-slate-400 text-slate-900 font-bold">
                    <th
                      rowSpan={3}
                      className="border-r border-slate-400 p-2 text-center align-middle font-bold text-slate-950 min-w-[42px] bg-slate-300"
                    >
                      <span className="block">ተ/ቁ</span>
                      {showEnglishHelp && <span className="block text-[10px] text-slate-600 font-normal">S.N</span>}
                    </th>
                    <th
                      className="border-r border-slate-400 p-2 text-center align-middle font-bold text-slate-950 min-w-[100px] bg-slate-300"
                    >
                      ቅርንጫፍ ጽ/ቤት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-600 font-normal">Branch Office</span>}
                    </th>
                    <th
                      colSpan={26}
                      className="border-r border-slate-400 p-2.5 text-center text-sm font-black text-slate-950 bg-slate-300"
                    >
                      {report.sectionTitleAmharic}
                      {showEnglishHelp && (
                        <span className="block text-[10px] text-slate-700 font-normal">
                          (Current Number of Corporation Houses in Branch)
                        </span>
                      )}
                    </th>
                  </tr>

                  {/* Row 2: Level 2 Categories (Residential, Commercial, Grand Total) */}
                  <tr className="bg-slate-300 border-b border-slate-400 font-bold text-slate-900">
                    <th className="border-r border-slate-400 p-1 bg-slate-300 text-slate-700 font-medium text-[11px]">
                      1
                    </th>
                    {/* Residential: 6 columns */}
                    <th
                      colSpan={6}
                      className="border-r-2 border-r-slate-500 p-2 text-center font-black text-slate-950 bg-slate-300"
                    >
                      የመኖሪያ ቤት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Residential</span>}
                    </th>

                    {/* Commercial: 10 columns */}
                    <th
                      colSpan={10}
                      className="border-r-2 border-r-slate-500 p-2 text-center font-black text-slate-950 bg-slate-300"
                    >
                      የድርጅት ቤት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Enterprise / Commercial</span>}
                    </th>

                    {/* Grand Total: 10 columns */}
                    <th
                      colSpan={10}
                      className="p-2 text-center font-black text-slate-950 bg-slate-300"
                    >
                      ጠቅላላ ብዛት
                      {showEnglishHelp && <span className="block text-[10px] text-slate-700 font-normal">Total Count</span>}
                    </th>
                  </tr>

                  {/* Row 3: Level 3 Typologies Header */}
                  <tr className="bg-slate-200 border-b-2 border-slate-400 text-[11px] font-bold text-slate-900">
                    <th className="border-r border-slate-400 p-1.5 bg-slate-200">
                      {/* Sub-header blank under branch */}
                    </th>

                    {/* Residential Sub-columns */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      አፓርትማ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Apt</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      ቆርቆሮ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Tin</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      ቪላ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Villa</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[60px]">
                      ተራ ቤት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Ord.</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      ሆስቴል
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Hostel</span>}
                    </th>
                    <th className="border-r-2 border-r-slate-500 p-1.5 min-w-[65px] bg-slate-250 font-black text-slate-950">
                      ድምር
                      {showEnglishHelp && <span className="block text-[9px] text-slate-700 font-normal">Total</span>}
                    </th>

                    {/* Commercial Sub-columns */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      አፓርትማ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Apt</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ቆርቆሮ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Tin</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ቪላ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Villa</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[60px]">
                      ተራ ቤት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Ord.</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      ሸንሻን
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Shenshan</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      አዳራሽ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Hall</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      መጋዘን
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Store</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ጋራዥ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Garage</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ሆስቴል
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Hostel</span>}
                    </th>
                    <th className="border-r-2 border-r-slate-500 p-1.5 min-w-[65px] bg-slate-250 font-black text-slate-950">
                      ድምር
                      {showEnglishHelp && <span className="block text-[9px] text-slate-700 font-normal">Total</span>}
                    </th>

                    {/* Grand Total Sub-columns */}
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      አፓርትማ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Apt</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ቆርቆሮ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Tin</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ቪላ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Villa</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[60px]">
                      ተራ ቤት
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Ord.</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[55px]">
                      ሸንሻን
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Shenshan</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      አዳራሽ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Hall</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      መጋዘን
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Store</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ጋራዥ
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Garage</span>}
                    </th>
                    <th className="border-r border-slate-400 p-1.5 min-w-[50px]">
                      ሆስቴል
                      {showEnglishHelp && <span className="block text-[9px] text-slate-600 font-normal">Hostel</span>}
                    </th>
                    <th className="p-1.5 min-w-[70px] bg-slate-300 font-black text-slate-950">
                      ድምር
                      {showEnglishHelp && <span className="block text-[9px] text-slate-700 font-normal">Grand Total</span>}
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-300 text-slate-800 font-medium">
                  {report.rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-300"
                    >
                      {/* ተ/ቁ */}
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50 text-center">
                        {row.sn}
                      </td>

                      {/* ቅርንጫፍ / ድምር */}
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50 text-center flex items-center justify-between">
                        <span>{report.rows.length === 1 ? 'ድምር' : row.branchName || row.branchCode}</span>
                        {isEditMode && report.rows.length > 1 && (
                          <button
                            onClick={() => handleDeleteBranch(row.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Delete this branch row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>

                      {/* ================= RESIDENTIAL CELLS ================= */}
                      {isEditMode ? (
                        <>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.apartment}
                              onChange={e => handleCellChange(row.id, 'residential', 'apartment', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.tinRoof}
                              onChange={e => handleCellChange(row.id, 'residential', 'tinRoof', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.villa}
                              onChange={e => handleCellChange(row.id, 'residential', 'villa', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.standardHouse}
                              onChange={e => handleCellChange(row.id, 'residential', 'standardHouse', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.residential.hostel}
                              onChange={e => handleCellChange(row.id, 'residential', 'hostel', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() => handleCellDrilldown('residential', 'apartment')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting residential apartment tenants"
                          >
                            {formatNum(row.residential.apartment)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('residential', 'tinRoof')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting residential tin roof tenants"
                          >
                            {formatNum(row.residential.tinRoof)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('residential', 'villa')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting residential villa tenants"
                          >
                            {formatNum(row.residential.villa)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('residential', 'standardHouse')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting residential standard house tenants"
                          >
                            {formatNum(row.residential.standardHouse)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('residential', 'hostel')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting residential hostel tenants"
                          >
                            {formatNum(row.residential.hostel)}
                          </td>
                        </>
                      )}
                      <td className="border-r-2 border-r-slate-500 p-2 font-black text-slate-950 bg-slate-100">
                        {formatNum(row.residential.total)}
                      </td>

                      {/* ================= COMMERCIAL CELLS ================= */}
                      {isEditMode ? (
                        <>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.apartment}
                              onChange={e => handleCellChange(row.id, 'commercial', 'apartment', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.tinRoof}
                              onChange={e => handleCellChange(row.id, 'commercial', 'tinRoof', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.villa}
                              onChange={e => handleCellChange(row.id, 'commercial', 'villa', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.standardHouse}
                              onChange={e => handleCellChange(row.id, 'commercial', 'standardHouse', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.shenshan}
                              onChange={e => handleCellChange(row.id, 'commercial', 'shenshan', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.hall}
                              onChange={e => handleCellChange(row.id, 'commercial', 'hall', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.warehouse}
                              onChange={e => handleCellChange(row.id, 'commercial', 'warehouse', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.garage}
                              onChange={e => handleCellChange(row.id, 'commercial', 'garage', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <input
                              type="number"
                              value={row.commercial.hostel}
                              onChange={e => handleCellChange(row.id, 'commercial', 'hostel', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 p-0.5 text-xs font-semibold"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'apartment')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial apartment tenants"
                          >
                            {formatNum(row.commercial.apartment)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'tinRoof')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial tin roof tenants"
                          >
                            {formatNum(row.commercial.tinRoof)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'villa')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial villa tenants"
                          >
                            {formatNum(row.commercial.villa)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'standardHouse')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial standard house tenants"
                          >
                            {formatNum(row.commercial.standardHouse)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'shenshan')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial shenshan tenants"
                          >
                            {formatNum(row.commercial.shenshan)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'hall')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial hall tenants"
                          >
                            {formatNum(row.commercial.hall)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'warehouse')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial warehouse tenants"
                          >
                            {formatNum(row.commercial.warehouse)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'garage')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial garage tenants"
                          >
                            {formatNum(row.commercial.garage)}
                          </td>
                          <td
                            onClick={() => handleCellDrilldown('commercial', 'hostel')}
                            className="border-r border-slate-300 p-2 font-semibold hover:bg-indigo-50/70 hover:text-indigo-700 cursor-pointer transition-colors"
                            title="Click to view supporting commercial hostel tenants"
                          >
                            {formatNum(row.commercial.hostel)}
                          </td>
                        </>
                      )}
                      <td className="border-r-2 border-r-slate-500 p-2 font-black text-slate-950 bg-slate-100">
                        {formatNum(row.commercial.total)}
                      </td>

                      {/* ================= GRAND TOTAL CELLS (AUTO-COMPUTED) ================= */}
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.apartment)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.tinRoof)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.villa)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.standardHouse)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.shenshan)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.hall)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.warehouse)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.garage)}
                      </td>
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-900 bg-slate-50">
                        {formatNum(row.grandTotal.hostel)}
                      </td>
                      <td className="p-2 font-black text-indigo-950 bg-indigo-50/70">
                        {formatNum(row.grandTotal.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Totals Row (Displayed when multiple branches exist) */}
                  {report.rows.length > 1 && (
                    <tr className="bg-slate-200 border-t-2 border-slate-400 font-black text-slate-950">
                      <td className="border-r border-slate-400 p-2 bg-slate-300"></td>
                      <td className="border-r border-slate-400 p-2 bg-slate-300 font-black">ድምር (Total)</td>

                      {/* Res totals */}
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.residential.apartment)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.residential.tinRoof)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.residential.villa)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.residential.standardHouse)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.residential.hostel)}</td>
                      <td className="border-r-2 border-r-slate-500 p-2 bg-slate-300">{formatNum(summaryTotals.residential.total)}</td>

                      {/* Com totals */}
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.apartment)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.tinRoof)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.villa)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.standardHouse)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.shenshan)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.hall)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.warehouse)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.garage)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.commercial.hostel)}</td>
                      <td className="border-r-2 border-r-slate-500 p-2 bg-slate-300">{formatNum(summaryTotals.commercial.total)}</td>

                      {/* Grand Totals */}
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.apartment)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.tinRoof)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.villa)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.standardHouse)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.shenshan)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.hall)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.warehouse)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.garage)}</td>
                      <td className="border-r border-slate-300 p-2">{formatNum(summaryTotals.grandTotal.hostel)}</td>
                      <td className="p-2 bg-indigo-100 font-black text-indigo-950 text-sm">
                        {formatNum(summaryTotals.grandTotal.total)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Branch Button in Edit Mode */}
            {isEditMode && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <button
                  onClick={() => setNewBranchModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Branch Row (አዲስ ቅርንጫፍ ጨምር)</span>
                </button>
                <div className="text-xs text-slate-500 italic">
                  * Note: Cell totals and grand totals are automatically calculated.
                </div>
              </div>
            )}

            {/* ================= SIGNATURE AND APPROVAL BOXES ================= */}
            <div className="mt-12 pt-6 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                የማረጋገጫና የማጽደቂያ ፊርማዎች (Signatures & Verification Section)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Box 1: ያዘጋጀው (Prepared By) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-black text-slate-900">ያዘጋጀው</span>
                    <span className="text-[11px] text-slate-500">Prepared By</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ስም:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.preparedBy.name}
                          onChange={e => handleSignatureChange('preparedBy', 'name', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
                        />
                      ) : (
                        <span className="font-bold text-slate-950 text-sm">
                          {report.signatures.preparedBy.name || 'አማዋደሽ መላኩ'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ፊርማ:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.preparedBy.signature}
                          onChange={e => handleSignatureChange('preparedBy', 'signature', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Signed / ፊርማ"
                        />
                      ) : (
                        <div className="flex-1 border-b border-dashed border-slate-400 py-1 text-slate-700 italic font-mono text-xs">
                          {report.signatures.preparedBy.signature || 'አማዋደሽ (Signed)'}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ቀን:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.preparedBy.dateEth}
                          onChange={e => handleSignatureChange('preparedBy', 'dateEth', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="text-slate-800 font-semibold">
                          {report.signatures.preparedBy.dateEth || '30/04/2018 ዓ.ም'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Box 2: ያረጋገጠው (Verified By) */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 ring-1 ring-indigo-200">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <span className="text-sm font-black text-indigo-950">ያረጋገጠው</span>
                    <span className="text-[11px] text-indigo-700 font-medium">Verified By</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ስም:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.verifiedBy.name}
                          onChange={e => handleSignatureChange('verifiedBy', 'name', e.target.value)}
                          className="flex-1 rounded-md border border-indigo-300 px-2 py-1 text-xs font-semibold"
                        />
                      ) : (
                        <span className="font-bold text-indigo-950 text-sm">
                          {report.signatures.verifiedBy.name || 'ተስፋዬ ንጉሴ'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ፊርማ:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.verifiedBy.signature}
                          onChange={e => handleSignatureChange('verifiedBy', 'signature', e.target.value)}
                          className="flex-1 rounded-md border border-indigo-300 px-2 py-1 text-xs"
                          placeholder="Signed / ፊርማ"
                        />
                      ) : (
                        <div className="flex-1 border-b border-dashed border-indigo-400 py-1 text-indigo-900 italic font-mono text-xs">
                          {report.signatures.verifiedBy.signature || 'ተስፋዬ (Verified)'}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ቀን:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.verifiedBy.dateEth}
                          onChange={e => handleSignatureChange('verifiedBy', 'dateEth', e.target.value)}
                          className="flex-1 rounded-md border border-indigo-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="text-slate-800 font-semibold">
                          {report.signatures.verifiedBy.dateEth || '30/04/2018 ዓ.ም'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Box 3: የፀደቀው (Approved By) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-black text-slate-900">የፀደቀው</span>
                    <span className="text-[11px] text-slate-500">Approved By</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ስም:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.approvedBy.name}
                          onChange={e => handleSignatureChange('approvedBy', 'name', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
                          placeholder="ስም አስገባ"
                        />
                      ) : (
                        <span className="font-bold text-slate-950 text-sm">
                          {report.signatures.approvedBy.name || '____________________'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ፊርማ:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.approvedBy.signature}
                          onChange={e => handleSignatureChange('approvedBy', 'signature', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="ፊርማ"
                        />
                      ) : (
                        <div className="flex-1 border-b border-dashed border-slate-400 py-1 text-slate-400 italic text-xs">
                          {report.signatures.approvedBy.signature || '____________________'}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 w-12">ቀን:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={report.signatures.approvedBy.dateEth}
                          onChange={e => handleSignatureChange('approvedBy', 'dateEth', e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="text-slate-800 font-semibold">
                          {report.signatures.approvedBy.dateEth || '30/04/2018 ዓ.ም'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DETAILED RECORD DRILLDOWN ================= */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>የተከራዮች ዝርዝር መረጃ (Supporting Tenant Records)</span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                    {filteredTenants.length} Records
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredTenants.length} of {classifiedTenants.length} classified records from the active master registry
                </p>
              </div>

              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenAddTenant}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Tenant</span>
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, code, house no..."
                    value={recordsSearch}
                    onChange={e => setRecordsSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

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
                  <option value="shenshan">ሸንሻን (Shenshan / Stall)</option>
                  <option value="hall">አዳራሽ (Hall)</option>
                  <option value="warehouse">መጋዘን (Warehouse)</option>
                  <option value="garage">ጋራዥ (Garage)</option>
                  <option value="hostel">ሆስቴል (Hostel)</option>
                </select>
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
                    <th className="p-3">ዋና ምድብ</th>
                    <th className="p-3">የቤቱ ዓይነት (Typology)</th>
                    <th className="p-3">ቤት ቁጥር</th>
                    <th className="p-3">ወርሃዊ ኪራይ (Rent)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-400">
                        {liveTenants.length === 0 ? (
                          <div className="space-y-3">
                            <div className="font-medium text-slate-700">No tenant records exist in the local database.</div>
                            <div className="text-xs text-slate-400">Upload your master Excel file or add tenants to view live dynamic records.</div>
                            <a
                              href="/upload"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Upload Tenant Excel</span>
                            </a>
                          </div>
                        ) : (
                          'No tenant records match your filter criteria.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.slice(0, 100).map((t, idx) => {
                      const fullRecord = liveTenants.find(
                        r => (r.identifier_code || r.tenantCode) === t.tenantCode
                      );
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-mono font-semibold text-indigo-700">{t.tenantCode}</td>
                          <td className="p-3 font-semibold text-slate-900">{t.tenantName}</td>
                          <td className="p-3 text-slate-600">{t.branchName}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                t.mainCategory === 'residential'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {t.mainCategory === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">{t.typologyLabelAm}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({t.typologyLabelEn})</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{t.houseNumber || '-'}</td>
                          <td className="p-3 font-semibold text-slate-900">
                            {t.rent ? `${t.rent.toLocaleString()} ETB` : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {fullRecord && (
                                <button
                                  onClick={() => handleOpenEditTenant(fullRecord)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Edit tenant details"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTenant(t.tenantCode)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete tenant"
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
              {filteredTenants.length > 100 && (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  Showing first 100 records of {filteredTenants.length}. Use Excel export to view full dataset.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Tenant */}
      {tenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <span>{editingTenant ? 'Edit Tenant (ተከራይ አሻሽል)' : 'Add Tenant (አዲስ ተከራይ መዝግብ)'}</span>
              </h3>
              <button
                onClick={() => setTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
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
                <label className="font-semibold text-slate-700">የተከራይ ስም (Tenant Name)</label>
                <input
                  type="text"
                  value={tenantFormState.name}
                  onChange={e => setTenantFormState({ ...tenantFormState, name: e.target.value })}
                  placeholder="e.g. አበበ ከበደ"
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
                <label className="font-semibold text-slate-700">የቤቱ ዓይነት (Typology in Form 02)</label>
                <select
                  value={tenantFormState.typology}
                  onChange={e => setTenantFormState({ ...tenantFormState, typology: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-900"
                >
                  {tenantFormState.category === 'residential' ? (
                    <>
                      <option value="apartment">አፓርትማ (Apartment)</option>
                      <option value="tinRoof">ቆርቆሮ (Tin Roof)</option>
                      <option value="villa">ቪላ (Villa)</option>
                      <option value="standardHouse">ተራ ቤት (Ordinary / Standard)</option>
                      <option value="hostel">ሆስቴል (Hostel)</option>
                    </>
                  ) : (
                    <>
                      <option value="apartment">አፓርትማ (Apartment)</option>
                      <option value="tinRoof">ቆርቆሮ (Tin Roof)</option>
                      <option value="villa">ቪላ (Villa)</option>
                      <option value="standardHouse">ተራ ቤት (Ordinary / Standard)</option>
                      <option value="shenshan">ሸንሻን (Shenshan / Stall)</option>
                      <option value="hall">አዳራሽ (Hall)</option>
                      <option value="warehouse">መጋዘን (Warehouse)</option>
                      <option value="garage">ጋራዥ (Garage)</option>
                      <option value="hostel">ሆስቴል (Hostel)</option>
                    </>
                  )}
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
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTenant}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                {editingTenant ? 'Update Tenant & Recalculate Form 02' : 'Save Tenant & Update Form 02'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Branch Row */}
      {newBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Branch Row (አዲስ ቅርንጫፍ ጨምር)</h3>
            <p className="text-xs text-slate-500">
              Enter the name or code of the branch office to append to Form 02.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700">የቅርንጫፍ ስም ወይም ቁጥር (Branch Name / Code)</label>
              <input
                type="text"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="e.g. 2, ቅርንጫፍ 2, ቦሌ"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNewBranchModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBranch}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Add Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Form02ReportView;

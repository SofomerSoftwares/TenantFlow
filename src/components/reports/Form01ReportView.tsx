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
  Building2,
  Home,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Table,
  Users,
  UserPlus,
  X,
  PieChart,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Form01ReportDocument,
  Form01BranchRow,
  Form01CategoryCounts,
  TenantForm01Classification,
  Form01DispositionType
} from '@/src/types/report';
import {
  reportDb,
  INITIAL_FORM_01_DATA,
  SUB_CITY_BRANCH_MAPPINGS
} from '@/src/lib/database/reportStore';
import { exportForm01Excel, exportForm01DisaggregatedExcel } from '@/src/lib/excel/form01ExcelExporter';
import { tenantDb } from '@/src/lib/database/tenantStore';
import { TenantRecord } from '@/src/types/tenant';

export const Form01ReportView: React.FC = () => {
  const [report, setReport] = useState<Form01ReportDocument>(INITIAL_FORM_01_DATA);
  const [liveTenants, setLiveTenants] = useState<TenantRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEnglishHelp, setShowEnglishHelp] = useState(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'records'>('matrix');
  const [savedToast, setSavedToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isSyncing, setIsSyncing] = useState(false);

  // New Branch Modal
  const [newBranchModalOpen, setNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');

  // Tenant Add / Edit Modal State
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Partial<TenantRecord> | null>(null);
  const [tenantFormState, setTenantFormState] = useState<{
    code: string;
    name: string;
    branch: string;
    category: 'residential' | 'commercial';
    disposition: Form01DispositionType;
    houseNumber: string;
    rent: number;
    remarks: string;
  }>({
    code: '',
    name: '',
    branch: 'Bole',
    category: 'residential',
    disposition: 'active',
    houseNumber: '',
    rent: 5000,
    remarks: ''
  });

  // Records Tab Filters
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsBranchFilter, setRecordsBranchFilter] = useState('ALL');
  const [recordsCategoryFilter, setRecordsCategoryFilter] = useState<'ALL' | 'residential' | 'commercial'>('ALL');
  const [recordsDispositionFilter, setRecordsDispositionFilter] = useState<string>('ALL');

  // Branch & View Filter Controls for Matrix
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [showAllOfficialBranches, setShowAllOfficialBranches] = useState<boolean>(true);

  // Load report and listen for changes
  const reloadData = () => {
    const tenants = tenantDb.getTenants();
    setLiveTenants(tenants);
    const calculated = reportDb.generateFromTenants(tenants, showAllOfficialBranches);
    setReport(calculated);
  };

  useEffect(() => {
    reloadData();

    // Subscribe to any updates in the tenant table
    const unsubscribe = tenantDb.subscribe((updatedTenants) => {
      setLiveTenants(updatedTenants);
      const updatedReport = reportDb.generateFromTenants(updatedTenants, showAllOfficialBranches);
      setReport(updatedReport);
    });

    return () => {
      unsubscribe();
    };
  }, [showAllOfficialBranches]);

  const showToast = (message: string) => {
    setSavedToast({ message, show: true });
    setTimeout(() => setSavedToast({ message: '', show: false }), 2500);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const tenants = tenantDb.getTenants();
      setLiveTenants(tenants);
      const calculated = reportDb.generateFromTenants(tenants, showAllOfficialBranches);
      setReport(calculated);
      setIsSyncing(false);
      showToast(`ቅጽ 1 በተከራይ ዳታቤዝ መረጃዎች መሰረት ተዘምኗል (${tenants.length} ቤቶች)!`);
    }, 300);
  };

  const handleClearLocalData = () => {
    if (window.confirm('እርግጠኛ ነዎት ሁሉንም የአካባቢ ዳታቤዝ መረጃዎች (Local Database Data) ማጥፋት ይፈልጋሉ?')) {
      tenantDb.clearAllData();
      setLiveTenants([]);
      const baseline = reportDb.generateFromTenants([], showAllOfficialBranches);
      setReport(baseline);
      showToast('የአካባቢው ዳታቤዝ መረጃዎች ሙሉ በሙሉ ተሰርዘዋል (Local Database Purged)');
    }
  };

  const handleSaveReport = (updated: Form01ReportDocument) => {
    setReport(updated);
    reportDb.saveReport(updated);
    showToast('የቅጽ - 01 ለውጦች ተቀምጠዋል!');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const updated = reportDb.addBranchRow(newBranchName.trim(), newBranchCode.trim() || undefined);
    setReport(updated);
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchModalOpen(false);
    showToast('አዲስ ቅርንጫፍ ተጨምሯል');
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (window.confirm(`ቅርንጫፍ ${name} እንዲሰረዝ እርግጠኛ ነዎት?`)) {
      const updated = reportDb.deleteBranchRow(id);
      setReport(updated);
      showToast(`ቅርንጫፍ ${name} ተሰርዟል`);
    }
  };

  // Tenant Add / Edit Handlers
  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setTenantFormState({
      code: `ETH-AA-B1-${Date.now().toString().slice(-4)}`,
      name: '',
      branch: 'ቅርንጫፍ 1 (ቦሌ - Bole)',
      category: 'residential',
      disposition: 'active',
      houseNumber: `HN-${Math.floor(100 + Math.random() * 900)}`,
      rent: 5000,
      remarks: ''
    });
    setTenantModalOpen(true);
  };

  const handleOpenEditTenant = (item: TenantForm01Classification) => {
    const raw = liveTenants.find(
      t => (t.identifier_code || t.tenantCode) === item.tenantCode
    );

    setEditingTenant(raw || { identifier_code: item.tenantCode });
    setTenantFormState({
      code: item.tenantCode,
      name: item.tenantName,
      branch: item.branchName,
      category: item.category,
      disposition: item.disposition,
      houseNumber: item.unit || '',
      rent: item.rent || 5000,
      remarks: raw?.remarks || ''
    });
    setTenantModalOpen(true);
  };

  const handleSaveTenant = () => {
    if (!tenantFormState.code.trim()) {
      alert('መለያ ኮድ ያስፈልጋል (Code is required)');
      return;
    }

    const isCommercial = tenantFormState.category === 'commercial';
    let workStatus = 'Active Lease';
    let status = 'Active';

    switch (tenantFormState.disposition) {
      case 'demolished':
        workStatus = 'Demolished for Infrastructure (በልማት የፈረሰ)';
        status = 'Inactive';
        break;
      case 'transferred':
        workStatus = 'Transferred by Decision to Agency (ለሌላ ተቋም በውሳኔ የተሰጠ)';
        status = 'Inactive';
        break;
      case 'sold':
        workStatus = 'Sold by Corporation (በሽያጭ የተላለፈ)';
        status = 'Inactive';
        break;
      case 'merged':
        workStatus = 'Merged Unit (የተቀላቀለ)';
        status = 'Inactive';
        break;
      case 'privatized':
        workStatus = 'Privatized by Board Decision (በፕራይቬታይዜሽን ውሳኔ)';
        status = 'Inactive';
        break;
      case 'court':
        workStatus = 'Court Decision Restitution (በፍርድ ቤት ውሳኔ)';
        status = 'Inactive';
        break;
      case 'other':
        workStatus = 'Inactive / Vacated (ሌላ የወጣ)';
        status = 'Inactive';
        break;
      case 'active':
      default:
        workStatus = 'Active Lease';
        status = 'Active';
        break;
    }

    reportDb.addOrUpdateTenant({
      identifier_code: tenantFormState.code.trim(),
      tenantCode: tenantFormState.code.trim(),
      tenant_name: tenantFormState.name.trim() || 'Tenant',
      tenantName: tenantFormState.name.trim() || 'Tenant',
      sub_city: tenantFormState.branch,
      branch: tenantFormState.branch,
      house_number: tenantFormState.houseNumber.trim(),
      unit: tenantFormState.houseNumber.trim(),
      category: isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት',
      historical_use: isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት',
      rent_amount: tenantFormState.rent,
      rent: tenantFormState.rent,
      work_status: workStatus,
      status,
      remarks: tenantFormState.remarks.trim() || workStatus
    });

    setTenantModalOpen(false);
    showToast('መረጃው ተመዝግቧል! ቅጽ 1 ወዲያውኑ ተሰልቷል');
  };

  const handleDeleteTenant = (code: string) => {
    if (window.confirm(`እርግጠኛ ነዎት መዝገብ ${code} እንዲሰረዝ ይፈልጋሉ?`)) {
      reportDb.deleteTenant(code);
      showToast('መዝገቡ ተሰርዟል! ቅጽ 1 ተዘምኗል');
    }
  };

  const handleUpdateNumberField = (
    rowId: string,
    categoryKey: keyof Form01BranchRow,
    subField: 'residential' | 'commercial',
    valStr: string
  ) => {
    const num = Math.max(0, parseInt(valStr, 10) || 0);
    const updatedRows = report.rows.map(r => {
      if (r.id !== rowId) return r;

      const cat = { ...(r[categoryKey] as Form01CategoryCounts) };
      cat[subField] = num;
      cat.total = (subField === 'residential' ? num : cat.residential) + (subField === 'commercial' ? num : cat.commercial);

      const updatedRow = {
        ...r,
        [categoryKey]: cat
      };

      // Recalculate total exited if one of the exit reasons was changed
      if (categoryKey !== 'inBranchOffice' && categoryKey !== 'totalExited' && categoryKey !== 'remainingActive') {
        const categories: (keyof Form01BranchRow)[] = [
          'demolished',
          'transferredByDecision',
          'sold',
          'merged',
          'other',
          'privatized',
          'courtDecision'
        ];
        let totRes = 0;
        let totCom = 0;
        categories.forEach(k => {
          const item = (k === categoryKey ? cat : (updatedRow[k] as Form01CategoryCounts));
          totRes += item.residential;
          totCom += item.commercial;
        });
        updatedRow.totalExited = {
          residential: totRes,
          commercial: totCom,
          total: totRes + totCom
        };
      }

      // Recalculate remaining active
      const inRes = updatedRow.inBranchOffice.residential;
      const inCom = updatedRow.inBranchOffice.commercial;
      const exitRes = updatedRow.totalExited.residential;
      const exitCom = updatedRow.totalExited.commercial;

      updatedRow.remainingActive = {
        residential: Math.max(0, inRes - exitRes),
        commercial: Math.max(0, inCom - exitCom),
        total: Math.max(0, (inRes + inCom) - (exitRes + exitCom))
      };

      return updatedRow;
    });

    handleSaveReport({ ...report, syncMode: 'manual', rows: updatedRows });
  };

  // Filtered rows for the matrix table based on branch selection and zero-record visibility
  const displayedRows = useMemo(() => {
    let list = report.rows;
    if (!showAllOfficialBranches && liveTenants.length > 0) {
      list = list.filter(r => r.inBranchOffice.total > 0);
    }
    if (selectedBranchFilter !== 'ALL') {
      list = list.filter(r => r.branchName === selectedBranchFilter || r.branchCode === selectedBranchFilter);
    }
    return list;
  }, [report.rows, showAllOfficialBranches, selectedBranchFilter, liveTenants.length]);

  // Grand Totals Computation dynamically derived from displayed matrix rows
  const totals = useMemo(() => {
    const t = {
      inBranchOffice: { residential: 0, commercial: 0, total: 0 },
      demolished: { residential: 0, commercial: 0, total: 0 },
      transferredByDecision: { residential: 0, commercial: 0, total: 0 },
      sold: { residential: 0, commercial: 0, total: 0 },
      merged: { residential: 0, commercial: 0, total: 0 },
      other: { residential: 0, commercial: 0, total: 0 },
      privatized: { residential: 0, commercial: 0, total: 0 },
      courtDecision: { residential: 0, commercial: 0, total: 0 },
      totalExited: { residential: 0, commercial: 0, total: 0 },
      remainingActive: { residential: 0, commercial: 0, total: 0 }
    };

    displayedRows.forEach(r => {
      t.inBranchOffice.residential += r.inBranchOffice.residential;
      t.inBranchOffice.commercial += r.inBranchOffice.commercial;
      t.inBranchOffice.total += r.inBranchOffice.total;

      t.demolished.residential += r.demolished.residential;
      t.demolished.commercial += r.demolished.commercial;
      t.demolished.total += r.demolished.total;

      t.transferredByDecision.residential += r.transferredByDecision.residential;
      t.transferredByDecision.commercial += r.transferredByDecision.commercial;
      t.transferredByDecision.total += r.transferredByDecision.total;

      t.sold.residential += r.sold.residential;
      t.sold.commercial += r.sold.commercial;
      t.sold.total += r.sold.total;

      t.merged.residential += r.merged.residential;
      t.merged.commercial += r.merged.commercial;
      t.merged.total += r.merged.total;

      t.other.residential += r.other.residential;
      t.other.commercial += r.other.commercial;
      t.other.total += r.other.total;

      t.privatized.residential += r.privatized.residential;
      t.privatized.commercial += r.privatized.commercial;
      t.privatized.total += r.privatized.total;

      t.courtDecision.residential += r.courtDecision.residential;
      t.courtDecision.commercial += r.courtDecision.commercial;
      t.courtDecision.total += r.courtDecision.total;

      t.totalExited.residential += r.totalExited.residential;
      t.totalExited.commercial += r.totalExited.commercial;
      t.totalExited.total += r.totalExited.total;

      const remRes = r.remainingActive?.residential ?? Math.max(0, r.inBranchOffice.residential - r.totalExited.residential);
      const remCom = r.remainingActive?.commercial ?? Math.max(0, r.inBranchOffice.commercial - r.totalExited.commercial);
      t.remainingActive.residential += remRes;
      t.remainingActive.commercial += remCom;
      t.remainingActive.total += (remRes + remCom);
    });

    return t;
  }, [displayedRows]);

  // Classified supporting tenant records for drill-down
  const tenantClassifications = useMemo(() => {
    return reportDb.getTenantBreakdown(liveTenants);
  }, [liveTenants]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return tenantClassifications.filter(item => {
      if (recordsBranchFilter !== 'ALL' && item.branchName !== recordsBranchFilter) {
        return false;
      }
      if (recordsCategoryFilter !== 'ALL' && item.category !== recordsCategoryFilter) {
        return false;
      }
      if (recordsDispositionFilter !== 'ALL') {
        if (recordsDispositionFilter === 'exited') {
          if (item.disposition === 'active') return false;
        } else if (item.disposition !== recordsDispositionFilter) {
          return false;
        }
      }
      if (recordsSearch.trim()) {
        const q = recordsSearch.toLowerCase();
        const match =
          item.tenantCode.toLowerCase().includes(q) ||
          item.tenantName.toLowerCase().includes(q) ||
          item.branchName.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q) ||
          item.woreda.toLowerCase().includes(q) ||
          item.workStatus.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tenantClassifications, recordsBranchFilter, recordsCategoryFilter, recordsDispositionFilter, recordsSearch]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    tenantClassifications.forEach(t => set.add(t.branchName));
    return Array.from(set).sort();
  }, [tenantClassifications]);

  const fmt = (n?: number) => (n ?? 0).toLocaleString();

  const handleDrillDownFilter = (
    branchName?: string,
    disposition?: string,
    category?: 'residential' | 'commercial' | 'ALL'
  ) => {
    if (branchName) setRecordsBranchFilter(branchName); else setRecordsBranchFilter('ALL');
    if (disposition && disposition !== 'all') {
      setRecordsDispositionFilter(disposition);
    } else {
      setRecordsDispositionFilter('ALL');
    }
    if (category) setRecordsCategoryFilter(category); else setRecordsCategoryFilter('ALL');
    setActiveTab('records');
  };

  const totalMonthlyRent = useMemo(() => {
    return liveTenants.reduce((sum, t) => sum + (Number(t.rent_amount || t.rent) || 0), 0);
  }, [liveTenants]);

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {savedToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{savedToast.message}</span>
        </div>
      )}

      {/* Top Header & Context */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800">
              {report.formNumber}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Federal Housing Corporation · የፌዴራል ቤቶች ኮርፖሬሽን
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
              <Table className="h-3 w-3" />
              <span>
                {liveTenants.length > 0
                  ? `Populated from Master Tenant Data (${liveTenants.length} properties)`
                  : 'Master Tenant Data: 0 records'}
              </span>
            </span>
            {report.syncMode === 'manual' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                <Edit3 className="h-3 w-3" />
                <span>Manual Overrides Applied</span>
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {report.titleAmharic}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 font-medium">
            {report.titleEnglish}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-3xl">
            Official government reporting matrix tracking branch housing stocks (መኖሪያ vs ድርጅት) and disaggregated exit dispositions (በልማት የፈረሱ፣ ለሌላ ተቋም፣ በሽያጭ፣ የተቀላቀሉ፣ በፕራይቬታይዜሽን፣ በፍርድ ቤት)።
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Form 01 Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Supporting Records ({liveTenants.length})</span>
            </button>
          </div>

          {/* Branch Filter Dropdown */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-normal">ቅርንጫፍ:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => {
                setSelectedBranchFilter(e.target.value);
                if (e.target.value !== 'ALL') {
                  setRecordsBranchFilter(e.target.value);
                }
              }}
              className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ሁሉም ቅርንጫፎች (All Branches)</option>
              {SUB_CITY_BRANCH_MAPPINGS.map(b => (
                <option key={b.branchCode} value={b.branchName}>{b.branchName}</option>
              ))}
            </select>
          </div>

          {/* All 11 Official Branches vs Active Toggle */}
          <button
            onClick={() => setShowAllOfficialBranches(!showAllOfficialBranches)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              showAllOfficialBranches
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle between showing all 11 official corporation branches or only branches with records"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{showAllOfficialBranches ? '11 Branches' : 'Active Only'}</span>
          </button>

          {liveTenants.length > 0 ? (
            <>
              <button
                onClick={handleOpenAddTenant}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Record (ቤት/እንቅስቃሴ መዝግብ)</span>
              </button>
              <button
                onClick={handleClearLocalData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                title="Remove all local database records"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Remove Local Data (ዳታ አጥፋ)</span>
              </button>
            </>
          ) : (
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Master Excel (ሰነድ ጫን)</span>
            </Link>
          )}

          <button
            onClick={() => setShowEnglishHelp(!showEnglishHelp)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              showEnglishHelp
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle English translation hints under Amharic titles"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>English {showEnglishHelp ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Force re-sync and recalculate Form 01 figures directly from the updated master tenant table"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Update from Tenants'}</span>
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              isEditMode
                ? 'border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Allows editing cells manually for formal administrative submission adjustments"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-600" />
            <span>{isEditMode ? 'Finish Editing' : 'Edit Matrix Inline'}</span>
          </button>

          <button
            onClick={() => exportForm01Excel(report)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            title="Export official formatted Ethiopian Form 01 Excel workbook"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Live Data Source Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Table className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Live Data Source: Master Tenant Database
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-700">Auto-Synchronized</span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated across <strong>{report.rows.length}</strong> branch administrative zones with{' '}
              <strong>{liveTenants.length}</strong> total active & exited properties recorded.
              {report.lastSyncedAt && ` Last updated: ${new Date(report.lastSyncedAt).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveTenants.length === 0 ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Upload Master Excel</span>
            </Link>
          ) : (
            <button
              onClick={handleOpenAddTenant}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Record</span>
            </button>
          )}

          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <span>Reconcile New Tenant File</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div
          onClick={() => handleDrillDownFilter(undefined, 'all')}
          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ጠቅላላ ቤቶች (Total)</div>
          <div className="mt-1 text-xl font-black text-slate-900">{fmt(totals.inBranchOffice.total)}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Res: {fmt(totals.inBranchOffice.residential)} · Com: {fmt(totals.inBranchOffice.commercial)}
          </div>
        </div>

        <div
          onClick={() => handleDrillDownFilter(undefined, 'active')}
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">በስራ ላይ ያሉ (Remaining)</div>
          <div className="mt-1 text-xl font-black text-emerald-950">{fmt(totals.remainingActive.total)}</div>
          <div className="mt-1 text-[11px] text-emerald-700">
            Res: {fmt(totals.remainingActive.residential)} · Com: {fmt(totals.remainingActive.commercial)}
          </div>
        </div>

        <div
          onClick={() => handleDrillDownFilter(undefined, 'exited')}
          className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs hover:border-rose-300 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">ከቅርንጫፍ የወጡ (Total Exited)</div>
          <div className="mt-1 text-xl font-black text-rose-950">{fmt(totals.totalExited.total)}</div>
          <div className="mt-1 text-[11px] text-rose-700">
            Res: {fmt(totals.totalExited.residential)} · Com: {fmt(totals.totalExited.commercial)}
          </div>
        </div>

        <div
          onClick={() => handleDrillDownFilter(undefined, 'demolished')}
          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">በልማት የፈረሱ (Demolished)</div>
          <div className="mt-1 text-xl font-bold text-slate-800">{fmt(totals.demolished.total)}</div>
          <div className="mt-1 text-[11px] text-slate-500">Res: {fmt(totals.demolished.residential)} · Com: {fmt(totals.demolished.commercial)}</div>
        </div>

        <div
          onClick={() => handleDrillDownFilter(undefined, 'transferred')}
          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">በውሳኔ የተሰጡ (Transferred)</div>
          <div className="mt-1 text-xl font-bold text-slate-800">{fmt(totals.transferredByDecision.total)}</div>
          <div className="mt-1 text-[11px] text-slate-500">Res: {fmt(totals.transferredByDecision.residential)} · Com: {fmt(totals.transferredByDecision.commercial)}</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">ወርሃዊ ኪራይ (Monthly Rent)</div>
          <div className="mt-1 text-lg font-black text-amber-950 truncate">{fmt(totalMonthlyRent)} ETB</div>
          <div className="mt-1 text-[11px] text-amber-700">ከንቁ ተከራዮች የሚሰበሰብ</div>
        </div>
      </div>

      {/* Main View Tabs */}
      {activeTab === 'matrix' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Header Card inside Report */}
          <div className="border-b border-slate-200 bg-slate-50/60 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                Official Ethiopian Federal Housing Corporation Matrix
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {report.titleAmharic}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Baseline: <strong className="text-slate-700">{report.baselineDateEth}</strong></span>
                <span>•</span>
                <span>Cutoff: <strong className="text-slate-700">{report.cutoffDateEth}</strong></span>
                <span>•</span>
                <span>Branches: <strong className="text-slate-700">{report.rows.length} Active Zones</strong></span>
              </div>
            </div>

            {isEditMode && (
              <button
                onClick={() => setNewBranchModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Branch Row</span>
              </button>
            )}
          </div>

          {/* Empty State vs Full Table */}
          {report.rows.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                The Master Tenant Table Currently Has 0 Records
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                This official Form 01 report dynamically populates from your updated tenant table. Upload your master Excel file or add properties to generate the full branch reconciliation matrix.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/upload"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Upload & Reconcile Tenant File</span>
                </Link>
                <button
                  onClick={handleOpenAddTenant}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register First Property</span>
                </button>
              </div>
            </div>
          ) : (
            /* Responsive Matrix Table with 3-Tier Government Header */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* 3-Tier Official Government Header */}
                <thead>
                  {/* Tier 1 Header */}
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 text-[11px]">
                    <th rowSpan={3} className="px-3 py-3 border-r border-slate-800 text-center w-12 sticky left-0 z-20 bg-slate-900">
                      ተ.ቁ
                      {showEnglishHelp && <div className="text-[9px] font-normal text-slate-300">S/N</div>}
                    </th>
                    <th rowSpan={3} className="px-4 py-3 border-r border-slate-800 min-w-[200px] sticky left-12 z-20 bg-slate-900">
                      ቅርንጫፍ
                      {showEnglishHelp && <div className="text-[9px] font-normal text-slate-300">Branch Office</div>}
                    </th>
                    <th colSpan={3} className="px-3 py-2 border-r border-slate-800 text-center bg-indigo-950/80">
                      በቅርንጫፉ ጽ/ቤት የሚገኙ ቤቶች ብዛት እስከ...ሰኔ
                      {showEnglishHelp && <div className="text-[9px] font-normal text-indigo-300">Housing Units Administered in Branch Office</div>}
                    </th>
                    <th colSpan={24} className="px-3 py-2 border-r border-slate-800 text-center bg-rose-950/70">
                      {report.cutoffDateEth} በተለያየ መንገድ ከኮርፖሬሽኑ የወጡ ቤቶች ብዛት
                      {showEnglishHelp && <div className="text-[9px] font-normal text-rose-300">Disaggregated Units Exited from Corporation by Reason</div>}
                    </th>
                    <th colSpan={3} className="px-3 py-2 border-r border-slate-800 text-center bg-emerald-950/80">
                      ቀሪ በስራ ላይ ያሉ ቤቶች
                      {showEnglishHelp && <div className="text-[9px] font-normal text-emerald-300">Remaining Active Units</div>}
                    </th>
                    <th rowSpan={3} className="px-3 py-3 text-center min-w-[140px]">
                      ምርመራ
                      {showEnglishHelp && <div className="text-[9px] font-normal text-slate-300">Remarks</div>}
                    </th>
                    {isEditMode && (
                      <th rowSpan={3} className="px-2 py-3 text-center w-12 bg-amber-950 text-amber-300">
                        ድርጊት
                      </th>
                    )}
                  </tr>

                  {/* Tier 2 Header */}
                  <tr className="bg-slate-800 text-slate-100 border-b border-slate-700 text-[10px] font-semibold text-center">
                    {/* In Branch Office Placeholder */}
                    <th colSpan={3} className="border-r border-slate-700 bg-indigo-900/60 py-1.5">
                      ጠቅላላ የተመዘገቡ
                    </th>

                    {/* 8 Exit Categories */}
                    <th colSpan={3} className="border-r border-slate-700 bg-rose-900/40 py-1.5">
                      በልማት የፈረሱ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-rose-300">Demolished</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-amber-900/40 py-1.5">
                      ለሌላ ተቋም በውሳኔ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-amber-300">Transferred by Decision</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-indigo-900/40 py-1.5">
                      በሽያጭ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-indigo-300">Transferred by Sale</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-purple-900/40 py-1.5">
                      የተቀላቀሉ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-purple-300">Merged</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-slate-700/60 py-1.5">
                      ሌላ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-slate-300">Other Exited</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-cyan-900/40 py-1.5">
                      በፕራይቬታይዜሽን ውሳኔ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-cyan-300">Privatized</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-teal-900/40 py-1.5">
                      በፍርድ ቤት ውሳኔ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-teal-300">Court Decision</div>}
                    </th>
                    <th colSpan={3} className="border-r border-slate-700 bg-red-900/60 py-1.5">
                      በጠቅላላው ከቅርንጫፉ
                      {showEnglishHelp && <div className="text-[8px] font-normal text-red-300">Total Exited</div>}
                    </th>

                    {/* Remaining Active */}
                    <th colSpan={3} className="border-r border-slate-700 bg-emerald-900/60 py-1.5">
                      ቀሪ በስራ ላይ
                    </th>
                  </tr>

                  {/* Tier 3 Header (መኖሪያ, ድርጅት, ድምር repeated across all groups) */}
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] font-bold text-center">
                    {/* In Branch */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-indigo-50 font-black text-indigo-900">ድምር</th>

                    {/* 1. Demolished */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-rose-50 font-black text-rose-900">ድምር</th>

                    {/* 2. Transferred */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-amber-50 font-black text-amber-900">ድምር</th>

                    {/* 3. Sold */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-indigo-50 font-black text-indigo-900">ድምር</th>

                    {/* 4. Merged */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-purple-50 font-black text-purple-900">ድምር</th>

                    {/* 5. Other */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-slate-100 font-black text-slate-900">ድምር</th>

                    {/* 6. Privatized */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-cyan-50 font-black text-cyan-900">ድምር</th>

                    {/* 7. Court */}
                    <th className="px-2 py-1 border-r border-slate-200">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-teal-50 font-black text-teal-900">ድምር</th>

                    {/* 8. Total Exited */}
                    <th className="px-2 py-1 border-r border-slate-200 font-bold text-red-700">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200 font-bold text-red-700">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-400 bg-red-100 font-black text-red-950">ድምር</th>

                    {/* Remaining Active */}
                    <th className="px-2 py-1 border-r border-slate-200 font-bold text-emerald-800">መኖሪያ</th>
                    <th className="px-2 py-1 border-r border-slate-200 font-bold text-emerald-800">ድርጅት</th>
                    <th className="px-2 py-1 border-r border-slate-300 bg-emerald-100 font-black text-emerald-950">ድምር</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={32} className="py-8 text-center text-slate-500 font-medium text-xs">
                        ምንም ቅርንጫፍ አልተገኘም (No branches match the selected filter).
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row, idx) => {
                    const rem = row.remainingActive || {
                      residential: Math.max(0, row.inBranchOffice.residential - row.totalExited.residential),
                      commercial: Math.max(0, row.inBranchOffice.commercial - row.totalExited.commercial),
                      total: Math.max(0, row.inBranchOffice.total - row.totalExited.total)
                    };

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-indigo-50/40 transition text-center ${
                          idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-slate-500 border-r border-slate-100 sticky left-0 z-10 bg-inherit font-bold">
                          {row.sn}
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-900 border-r border-slate-100 text-left sticky left-12 z-10 bg-inherit">
                          <button
                            onClick={() => handleDrillDownFilter(row.branchName, 'all', 'ALL')}
                            className="text-left hover:text-indigo-600 transition flex items-center justify-between w-full group cursor-pointer"
                            title="Click to view all supporting records for this branch"
                          >
                            <span>{row.branchName}</span>
                            <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 text-indigo-500" />
                          </button>
                        </td>

                        {/* In Branch Office */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'all', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 font-medium cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition-colors"
                          title="Click to inspect residential units in branch"
                        >
                          {fmt(row.inBranchOffice.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'all', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 font-medium cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition-colors"
                          title="Click to inspect commercial units in branch"
                        >
                          {fmt(row.inBranchOffice.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'all', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-indigo-50/40 font-bold text-indigo-900 cursor-pointer hover:bg-indigo-200 transition-colors"
                          title="Click to inspect all units in branch"
                        >
                          {fmt(row.inBranchOffice.total)}
                        </td>

                        {/* 1. Demolished */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'demolished', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-rose-100 hover:text-rose-900 transition-colors"
                        >
                          {fmt(row.demolished.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'demolished', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-rose-100 hover:text-rose-900 transition-colors"
                        >
                          {fmt(row.demolished.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'demolished', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-rose-50/40 font-bold text-rose-900 cursor-pointer hover:bg-rose-200 transition-colors"
                        >
                          {fmt(row.demolished.total)}
                        </td>

                        {/* 2. Transferred */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'transferred', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-amber-100 hover:text-amber-900 transition-colors"
                        >
                          {fmt(row.transferredByDecision.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'transferred', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-amber-100 hover:text-amber-900 transition-colors"
                        >
                          {fmt(row.transferredByDecision.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'transferred', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-amber-50/40 font-bold text-amber-900 cursor-pointer hover:bg-amber-200 transition-colors"
                        >
                          {fmt(row.transferredByDecision.total)}
                        </td>

                        {/* 3. Sold */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'sold', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition-colors"
                        >
                          {fmt(row.sold.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'sold', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition-colors"
                        >
                          {fmt(row.sold.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'sold', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-indigo-50/40 font-bold text-indigo-900 cursor-pointer hover:bg-indigo-200 transition-colors"
                        >
                          {fmt(row.sold.total)}
                        </td>

                        {/* 4. Merged */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'merged', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-purple-100 hover:text-purple-900 transition-colors"
                        >
                          {fmt(row.merged.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'merged', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-purple-100 hover:text-purple-900 transition-colors"
                        >
                          {fmt(row.merged.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'merged', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-purple-50/40 font-bold text-purple-900 cursor-pointer hover:bg-purple-200 transition-colors"
                        >
                          {fmt(row.merged.total)}
                        </td>

                        {/* 5. Other */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'other', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          {fmt(row.other.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'other', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          {fmt(row.other.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'other', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-slate-100 font-bold text-slate-800 cursor-pointer hover:bg-slate-300 transition-colors"
                        >
                          {fmt(row.other.total)}
                        </td>

                        {/* 6. Privatized */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'privatized', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-cyan-100 hover:text-cyan-900 transition-colors"
                        >
                          {fmt(row.privatized.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'privatized', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-cyan-100 hover:text-cyan-900 transition-colors"
                        >
                          {fmt(row.privatized.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'privatized', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-cyan-50/40 font-bold text-cyan-900 cursor-pointer hover:bg-cyan-200 transition-colors"
                        >
                          {fmt(row.privatized.total)}
                        </td>

                        {/* 7. Court */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'court', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-teal-100 hover:text-teal-900 transition-colors"
                        >
                          {fmt(row.courtDecision.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'court', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 cursor-pointer hover:bg-teal-100 hover:text-teal-900 transition-colors"
                        >
                          {fmt(row.courtDecision.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'court', 'ALL')}
                          className="px-2 py-1 border-r border-slate-200 bg-teal-50/40 font-bold text-teal-900 cursor-pointer hover:bg-teal-200 transition-colors"
                        >
                          {fmt(row.courtDecision.total)}
                        </td>

                        {/* 8. Total Exited */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'exited', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 font-semibold text-red-700 cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          {fmt(row.totalExited.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'exited', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 font-semibold text-red-700 cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          {fmt(row.totalExited.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'exited', 'ALL')}
                          className="px-2 py-1 border-r border-slate-300 bg-red-50/60 font-black text-red-950 cursor-pointer hover:bg-red-200 transition-colors"
                        >
                          {fmt(row.totalExited.total)}
                        </td>

                        {/* Remaining Active */}
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'active', 'residential')}
                          className="px-2 py-1 border-r border-slate-100 font-semibold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
                        >
                          {fmt(rem.residential)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'active', 'commercial')}
                          className="px-2 py-1 border-r border-slate-100 font-semibold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
                        >
                          {fmt(rem.commercial)}
                        </td>
                        <td
                          onClick={() => handleDrillDownFilter(row.branchName, 'active', 'ALL')}
                          className="px-2 py-1 border-r border-slate-300 bg-emerald-50/70 font-black text-emerald-950 cursor-pointer hover:bg-emerald-200 transition-colors"
                        >
                          {fmt(rem.total)}
                        </td>

                        {/* Remarks */}
                        <td className="px-3 py-2 text-slate-500 text-[11px] text-left">
                          {row.remarks || '—'}
                        </td>

                        {/* Inline Delete Button (if in Edit Mode) */}
                        {isEditMode && (
                          <td className="px-2 py-1 text-center bg-amber-50">
                            <button
                              onClick={() => handleDeleteBranch(row.id, row.branchName)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="Delete branch row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

                {/* Grand Totals Row */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-center">
                    <td colSpan={2} className="px-4 py-3 text-left font-black text-sm uppercase tracking-wide border-r border-slate-800 sticky left-0 z-10 bg-slate-900">
                      ድምር (Grand Totals)
                    </td>

                    {/* In Branch */}
                    <td
                      onClick={() => handleDrillDownFilter('ALL', 'all', 'residential')}
                      className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-indigo-900 transition-colors"
                    >
                      {fmt(totals.inBranchOffice.residential)}
                    </td>
                    <td
                      onClick={() => handleDrillDownFilter('ALL', 'all', 'commercial')}
                      className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-indigo-900 transition-colors"
                    >
                      {fmt(totals.inBranchOffice.commercial)}
                    </td>
                    <td
                      onClick={() => handleDrillDownFilter('ALL', 'all', 'ALL')}
                      className="px-2 py-2 border-r border-slate-700 bg-indigo-900 font-black text-indigo-100 cursor-pointer hover:bg-indigo-800 transition-colors"
                    >
                      {fmt(totals.inBranchOffice.total)}
                    </td>

                    {/* 1. Demolished */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'demolished', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-rose-900 transition-colors">{fmt(totals.demolished.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'demolished', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-rose-900 transition-colors">{fmt(totals.demolished.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'demolished', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-rose-900 font-black text-rose-100 cursor-pointer hover:bg-rose-800 transition-colors">{fmt(totals.demolished.total)}</td>

                    {/* 2. Transferred */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'transferred', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-amber-900 transition-colors">{fmt(totals.transferredByDecision.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'transferred', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-amber-900 transition-colors">{fmt(totals.transferredByDecision.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'transferred', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-amber-900 font-black text-amber-100 cursor-pointer hover:bg-amber-800 transition-colors">{fmt(totals.transferredByDecision.total)}</td>

                    {/* 3. Sold */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'sold', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-indigo-900 transition-colors">{fmt(totals.sold.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'sold', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-indigo-900 transition-colors">{fmt(totals.sold.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'sold', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-indigo-900 font-black text-indigo-100 cursor-pointer hover:bg-indigo-800 transition-colors">{fmt(totals.sold.total)}</td>

                    {/* 4. Merged */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'merged', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-purple-900 transition-colors">{fmt(totals.merged.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'merged', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-purple-900 transition-colors">{fmt(totals.merged.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'merged', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-purple-900 font-black text-purple-100 cursor-pointer hover:bg-purple-800 transition-colors">{fmt(totals.merged.total)}</td>

                    {/* 5. Other */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'other', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-slate-700 transition-colors">{fmt(totals.other.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'other', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-slate-700 transition-colors">{fmt(totals.other.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'other', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-slate-800 font-black text-slate-100 cursor-pointer hover:bg-slate-700 transition-colors">{fmt(totals.other.total)}</td>

                    {/* 6. Privatized */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'privatized', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-cyan-900 transition-colors">{fmt(totals.privatized.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'privatized', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-cyan-900 transition-colors">{fmt(totals.privatized.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'privatized', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-cyan-900 font-black text-cyan-100 cursor-pointer hover:bg-cyan-800 transition-colors">{fmt(totals.privatized.total)}</td>

                    {/* 7. Court */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'court', 'residential')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-teal-900 transition-colors">{fmt(totals.courtDecision.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'court', 'commercial')} className="px-2 py-2 border-r border-slate-800 cursor-pointer hover:bg-teal-900 transition-colors">{fmt(totals.courtDecision.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'court', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-teal-900 font-black text-teal-100 cursor-pointer hover:bg-teal-800 transition-colors">{fmt(totals.courtDecision.total)}</td>

                    {/* 8. Total Exited */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'exited', 'residential')} className="px-2 py-2 border-r border-slate-800 font-black text-red-400 cursor-pointer hover:bg-red-950 transition-colors">{fmt(totals.totalExited.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'exited', 'commercial')} className="px-2 py-2 border-r border-slate-800 font-black text-red-400 cursor-pointer hover:bg-red-950 transition-colors">{fmt(totals.totalExited.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'exited', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-red-950 font-black text-red-200 cursor-pointer hover:bg-red-900 transition-colors">{fmt(totals.totalExited.total)}</td>

                    {/* Remaining Active */}
                    <td onClick={() => handleDrillDownFilter('ALL', 'active', 'residential')} className="px-2 py-2 border-r border-slate-800 font-black text-emerald-400 cursor-pointer hover:bg-emerald-950 transition-colors">{fmt(totals.remainingActive.residential)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'active', 'commercial')} className="px-2 py-2 border-r border-slate-800 font-black text-emerald-400 cursor-pointer hover:bg-emerald-950 transition-colors">{fmt(totals.remainingActive.commercial)}</td>
                    <td onClick={() => handleDrillDownFilter('ALL', 'active', 'ALL')} className="px-2 py-2 border-r border-slate-700 bg-emerald-950 font-black text-emerald-200 cursor-pointer hover:bg-emerald-900 transition-colors">{fmt(totals.remainingActive.total)}</td>

                    <td className="px-3 py-2 text-center text-slate-400 font-normal">
                      Master Aggregation
                    </td>
                    {isEditMode && <td className="bg-slate-900"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Footer Signature Block */}
          <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6 text-xs text-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">ያዘጋጀው (Prepared By):</div>
                <div className="font-medium text-slate-800">{report.preparedBy}</div>
                <div className="text-[11px] text-slate-400">ፊርማ: _________________  ቀን: _________</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">ያረጋገጠው (Verified By):</div>
                <div className="font-medium text-slate-800">{report.verifiedBy}</div>
                <div className="text-[11px] text-slate-400">ፊርማ: _________________  ቀን: _________</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">የፀደቀው (Approved By):</div>
                <div className="font-medium text-slate-800">{report.approvedBy}</div>
                <div className="text-[11px] text-slate-400">ፊርማ: _________________  ቀን: _________</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Supporting Records Tab */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supporting Property & Tenant Records ({filteredRecords.length})
              </h3>
              <p className="text-xs text-slate-500">
                Individual properties and tenants dynamically classified into branch inventories and movement categories.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, name, branch, unit..."
                  value={recordsSearch}
                  onChange={(e) => setRecordsSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={recordsBranchFilter}
                onChange={(e) => setRecordsBranchFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Branches (ሁሉም ቅርንጫፎች)</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={recordsCategoryFilter}
                onChange={(e) => setRecordsCategoryFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories (ሁሉም ምድብ)</option>
                <option value="residential">Residential Only (መኖሪያ)</option>
                <option value="commercial">Commercial Only (ድርጅት)</option>
              </select>

              {/* Disposition Filter */}
              <select
                value={recordsDispositionFilter}
                onChange={(e) => setRecordsDispositionFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Dispositions (ሁሉም ሁኔታ)</option>
                <option value="active">በስራ ላይ ያሉ (Active Lease)</option>
                <option value="exited">ከኮርፖሬሽኑ የወጡ በጠቅላላ (All Exited)</option>
                <option value="demolished">በልማት የፈረሱ (Demolished)</option>
                <option value="transferred">ለሌላ ተቋም በውሳኔ (Transferred)</option>
                <option value="sold">በሽያጭ የተላለፉ (Sold)</option>
                <option value="merged">የተቀላቀሉ (Merged)</option>
                <option value="privatized">በፕራይቬታይዜሽን (Privatized)</option>
                <option value="court">በፍርድ ቤት ውሳኔ (Court Decision)</option>
                <option value="other">ሌላ ከኮርፖሬሽኑ የወጡ (Other Exited)</option>
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

          {/* Drill-Down Records Table */}
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {liveTenants.length === 0 ? (
                <div className="space-y-3">
                  <div className="font-semibold text-slate-700">No property or tenant records in local database.</div>
                  <div className="text-slate-400">Upload your master Excel file or register properties to view live records.</div>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to="/upload"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload Master Excel</span>
                    </Link>
                    <button
                      onClick={handleOpenAddTenant}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Property Record</span>
                    </button>
                  </div>
                </div>
              ) : (
                'No matching tenant records found for the selected filters.'
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-3 py-2.5">Identifier Code</th>
                    <th className="px-3 py-2.5">Tenant / Occupant Name</th>
                    <th className="px-3 py-2.5">Branch / Sub-City</th>
                    <th className="px-3 py-2.5">Location / Unit</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Form 01 Movement</th>
                    <th className="px-3 py-2.5 text-right">Monthly Rent</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.slice(0, 100).map((item, idx) => (
                    <tr key={`${item.tenantCode}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                        {item.tenantCode}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {item.tenantName}
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-medium">
                        {item.branchName}
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-mono">
                        {item.unit || item.woreda ? `${item.unit} (${item.woreda})` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            item.category === 'residential'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.categoryLabelAm} ({item.categoryLabelEn})
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            item.disposition === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.disposition === 'demolished'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.disposition === 'transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.disposition === 'sold'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.dispositionLabelAm}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                        {item.rent ? `ETB ${fmt(item.rent)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditTenant(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(item.tenantCode)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length > 100 && (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  Showing first 100 records of {filteredRecords.length}. Export to Excel to view the complete catalog.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add or Edit Property / Exit Record */}
      {tenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <span>{editingTenant ? 'Edit Property / Movement Record' : 'Add Property / Movement Record'}</span>
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
                <label className="font-semibold text-slate-700">ቅርንጫፍ / ክ/ከተማ (Branch Office)</label>
                <select
                  value={tenantFormState.branch}
                  onChange={e => setTenantFormState({ ...tenantFormState, branch: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {SUB_CITY_BRANCH_MAPPINGS.map(b => (
                    <option key={b.branchCode} value={b.branchName}>
                      {b.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700">የተከራይ / ባለይዞታ ስም (Tenant Name)</label>
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
                  onChange={e => setTenantFormState({ ...tenantFormState, category: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="residential">የመኖሪያ ቤት (Residential)</option>
                  <option value="commercial">የድርጅት ቤት (Commercial)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">የይዞታ ሁኔታ / እንቅስቃሴ (Movement Disposition)</label>
                <select
                  value={tenantFormState.disposition}
                  onChange={e => setTenantFormState({ ...tenantFormState, disposition: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="active">በስራ ላይ ያለ (Active Lease)</option>
                  <option value="demolished">በልማት የፈረሰ (Demolished)</option>
                  <option value="transferred">ለሌላ ተቋም በውሳኔ የተሰጠ (Transferred)</option>
                  <option value="sold">በሽያጭ የተላለፈ (Sold)</option>
                  <option value="merged">የተቀላቀለ (Merged)</option>
                  <option value="privatized">በፕራይቬታይዜሽን ውሳኔ (Privatized)</option>
                  <option value="court">በፍርድ ቤት ውሳኔ (Court Decision)</option>
                  <option value="other">ሌላ ከኮርፖሬሽኑ የወጣ (Other Exited)</option>
                </select>
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

              <div>
                <label className="font-semibold text-slate-700">ወርሃዊ ኪራይ በብር (Monthly Rent ETB)</label>
                <input
                  type="number"
                  value={tenantFormState.rent}
                  onChange={e => setTenantFormState({ ...tenantFormState, rent: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700">ምርመራ / ማስታወሻ (Remarks)</label>
                <input
                  type="text"
                  value={tenantFormState.remarks}
                  onChange={e => setTenantFormState({ ...tenantFormState, remarks: e.target.value })}
                  placeholder="e.g. በውሳኔ ቁጥር 41/2018 መሠረት..."
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
                {editingTenant ? 'Update Record & Recalculate Form 01' : 'Save Record & Update Form 01'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {newBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add New Branch Office</h3>
            <p className="mt-1 text-xs text-slate-500">
              Add a branch zone to the Form 01 report matrix.
            </p>

            <form onSubmit={handleAddBranch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Branch Name (ቅርንጫፍ)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ቅርንጫፍ 12 (ቦሌ አየር መንገድ)"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Branch Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 12"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBranchModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

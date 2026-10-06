import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart, Table, FileText, Users, Building2 } from 'lucide-react';
import { Form01ReportView } from './Form01ReportView';
import { Form02ReportView } from './Form02ReportView';
import { Form03ReportView } from './Form03ReportView';

export const ReportsView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawForm = searchParams.get('form');
  const initialForm: '01' | '02' | '03' = rawForm === '01' || rawForm === '02' || rawForm === '03' ? rawForm : '03';
  const [selectedForm, setSelectedForm] = useState<'01' | '02' | '03'>(initialForm);

  const handleSelectForm = (form: '01' | '02' | '03') => {
    setSelectedForm(form);
    setSearchParams({ form });
  };

  return (
    <div className="space-y-6">
      {/* Top Report Selector Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                የፌዴራል ቤቶች ኮርፖሬሽን ኦፊሴላዊ ሪፖርቶች (Federal Housing Corporation Reports)
              </div>
              <div className="text-[11px] text-slate-500">
                Standardized governmental inventory, tenant occupancy, and branch typology forms
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200">
            {/* Form 03 (Newest: Houses vs Tenants) */}
            <button
              onClick={() => handleSelectForm('03')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedForm === '03'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span>ቅጽ - 03 (ቤቶችና ተከራዮች ብዛት)</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">
                Active
              </span>
            </button>

            {/* Form 02 */}
            <button
              onClick={() => handleSelectForm('02')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedForm === '02'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-indigo-600" />
              <span>ቅጽ - 02 (የቤቶች ብዛት በቅርንጫፍ)</span>
            </button>

            {/* Form 01 */}
            <button
              onClick={() => handleSelectForm('01')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedForm === '01'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              <span>ቅጽ - 01 (ይዞታና እንቅስቃሴ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Report */}
      {selectedForm === '03' && <Form03ReportView />}
      {selectedForm === '02' && <Form02ReportView />}
      {selectedForm === '01' && <Form01ReportView />}
    </div>
  );
};

export default ReportsView;

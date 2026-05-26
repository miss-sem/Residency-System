import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SingleReportDoc, MultiReportDoc, SingleDayDoc } from '../../components/ReportPDF';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import EmptyState from '../../components/EmptyState';
import { formatWeek, formatDate, DAYS, DAY_LABELS } from '../../utils/helpers';
import {
  Download, FileText, CheckSquare, Square, Loader2,
  Eye, X, ChevronDown, ChevronRight,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const getQuarterKey = (dateStr) => {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
};

const STATUS_BAR = { submitted: 'bg-blue-400', reviewed: 'bg-green-400' };

/* ── Modal preview ───────────────────────────────────────────────────────── */
const PreviewModal = ({ url, title, onClose, onDownload, downloading }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
    onClick={onClose}
  >
    <div
      className="bg-white shadow-2xl flex flex-col w-full max-w-4xl h-[90vh] animate-slide-up"
      style={{ animationFillMode: 'both' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700 truncate max-w-[400px]">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline disabled:opacity-50"
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Download
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      <iframe src={url} className="flex-1 w-full border-0" title="Report Preview" />
    </div>
  </div>
);

/* ── Main component ──────────────────────────────────────────────────────── */
const GenerateReport = () => {
  const { user } = useAuth();
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reportType, setReportType] = useState('weekly'); // weekly | daily | quarterly
  const [selected,   setSelected]   = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(null); // reportId or "reportId-day"
  const [downloading1, setDownloading1] = useState(null);

  // modal
  const [modal, setModal] = useState(null); // { url, title, reportId, day? }

  // daily: expanded weeks
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    reportAPI.getMyReports({})
      .then(({ data }) => {
        setReports((data.reports ?? []).filter(r => r.status !== 'draft'));
      })
      .finally(() => setLoading(false));
  }, []);

  // reset selections when switching type
  const switchType = (t) => { setReportType(t); setSelected(new Set()); setExpanded(new Set()); };

  /* ── selection helpers ── */
  const allSelected = reports.length > 0 && selected.size === reports.length;
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(reports.map(r => r._id)));
  const toggle      = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  /* ── close modal ── */
  const closeModal = () => {
    if (modal?.url) URL.revokeObjectURL(modal.url);
    setModal(null);
  };

  /* ── get full report ── */
  const getFullReport = (id) =>
    reportAPI.getMyReport(id).then(r => ({ ...r.data.report, resident: user }));

  /* ── preview weekly ── */
  const handlePreviewWeekly = async (e, reportId) => {
    e.stopPropagation();
    if (previewing) return;
    const key = reportId;
    setPreviewing(key);
    try {
      const full = await getFullReport(reportId);
      const blob = await pdf(<SingleReportDoc report={full} />).toBlob();
      const url  = URL.createObjectURL(blob);
      closeModal();
      setModal({ url, title: `${full.unit} — ${formatWeek(full.weekStartDate)}`, reportId });
    } finally { setPreviewing(null); }
  };

  /* ── preview daily ── */
  const handlePreviewDay = async (e, reportId, day) => {
    e.stopPropagation();
    if (previewing) return;
    const key = `${reportId}-${day}`;
    setPreviewing(key);
    try {
      const full = await getFullReport(reportId);
      const blob = await pdf(<SingleDayDoc report={full} day={day} />).toBlob();
      const url  = URL.createObjectURL(blob);
      closeModal();
      setModal({ url, title: `${DAY_LABELS[day]} — ${full.unit} ${formatWeek(full.weekStartDate)}`, reportId, day });
    } finally { setPreviewing(null); }
  };

  /* ── download from modal ── */
  const handleModalDownload = async () => {
    if (!modal || downloading1) return;
    setDownloading1('modal');
    try {
      const full = await getFullReport(modal.reportId);
      const doc  = modal.day
        ? <SingleDayDoc report={full} day={modal.day} />
        : <SingleReportDoc report={full} />;
      const blob = await pdf(doc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = modal.day
        ? `LogBook_${full.unit?.replace(/\s+/g,'_')}_${DAY_LABELS[modal.day]}.pdf`
        : `LogBook_${full.unit?.replace(/\s+/g,'_')}_${formatDate(full.weekStartDate)}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } finally { setDownloading1(null); }
  };

  /* ── download selected ── */
  const handleDownload = async () => {
    if (selected.size === 0 || generating) return;
    setGenerating(true);
    try {
      const ids  = [...selected];
      const full = await Promise.all(ids.map(id => getFullReport(id)));
      const doc  = full.length === 1 ? <SingleReportDoc report={full[0]} /> : <MultiReportDoc reports={full} />;
      const blob = await pdf(doc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = full.length === 1
        ? `LogBook_${full[0].unit?.replace(/\s+/g,'_')}_${formatDate(full[0].weekStartDate)}.pdf`
        : `LogBook_Reports_${formatDate(new Date())}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } finally { setGenerating(false); }
  };

  /* ── download quarterly ── */
  const handleQuarterDownload = async (quarterReports) => {
    if (generating) return;
    setGenerating(true);
    try {
      const full = await Promise.all(quarterReports.map(r => getFullReport(r._id)));
      const doc  = full.length === 1 ? <SingleReportDoc report={full[0]} /> : <MultiReportDoc reports={full} />;
      const blob = await pdf(doc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `LogBook_${getQuarterKey(quarterReports[0].weekStartDate).replace(' ','_')}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } finally { setGenerating(false); }
  };

  /* ── quarterly grouping ── */
  const quarters = (() => {
    const map = {};
    reports.forEach(r => {
      const key = getQuarterKey(r.weekStartDate);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).map(([label, items]) => ({ label, items }));
  })();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-5">

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} className="text-primary" /> My Reports
        </h1>
        <p className="text-sm text-gray-400 mt-1">Preview and download your submitted reports as PDF</p>
      </div>

      {/* Type tabs */}
      <div
        className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit animate-slide-up"
        style={{ animationDelay: '40ms', animationFillMode: 'both' }}
      >
        {[
          { key: 'weekly',    label: 'Weekly'    },
          { key: 'daily',     label: 'Daily'     },
          { key: 'quarterly', label: 'Quarterly' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchType(key)}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200
              ${reportType === key
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports to generate"
          description="Submit a weekly report first before downloading a PDF."
        />
      ) : (

        /* ── Weekly ── */
        reportType === 'weekly' ? (
          <div
            className="card overflow-hidden animate-slide-up"
            style={{ animationDelay: '80ms', animationFillMode: 'both' }}
          >
            {/* toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <button onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
                {allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{selected.size} selected</span>
                  <button onClick={handleDownload} disabled={generating} className="btn-primary text-xs disabled:opacity-60">
                    {generating ? <><Loader2 size={12} className="animate-spin" /> Generating…</> : <><Download size={12} /> Download PDF</>}
                  </button>
                </div>
              )}
            </div>

            {reports.map((r, i) => {
              const isSelected = selected.has(r._id);
              const isLoading  = previewing === r._id;
              return (
                <div key={r._id}
                  onClick={() => toggle(r._id)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-150
                    ${i !== 0 ? 'border-t border-gray-100' : ''}
                    ${isSelected ? 'bg-primary/[0.04]' : 'hover:bg-gray-50'}`}
                >
                  <div className={`flex-shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                    {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                  </div>
                  <div className={`w-[3px] h-10 flex-shrink-0 rounded-full ${STATUS_BAR[r.status] ?? 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UnitBadge unit={r.unit} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{formatWeek(r.weekStartDate)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted {formatDate(r.submittedAt)}
                      {r.status === 'reviewed' && ` · Reviewed ${formatDate(r.reviewedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={(e) => handlePreviewWeekly(e, r._id)} disabled={!!previewing} title="Preview"
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-40">
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        /* ── Daily ── */
        ) : reportType === 'daily' ? (
          <div
            className="card overflow-hidden animate-slide-up"
            style={{ animationDelay: '80ms', animationFillMode: 'both' }}
          >
            {reports.map((r, i) => {
              const isOpen = expanded.has(r._id);
              return (
                <div key={r._id} className={i !== 0 ? 'border-t border-gray-100' : ''}>
                  {/* Week row */}
                  <button
                    onClick={() => setExpanded(prev => {
                      const next = new Set(prev);
                      next.has(r._id) ? next.delete(r._id) : next.add(r._id);
                      return next;
                    })}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-[3px] h-10 flex-shrink-0 rounded-full ${STATUS_BAR[r.status] ?? 'bg-gray-200'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UnitBadge unit={r.unit} />
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{formatWeek(r.weekStartDate)}</p>
                    </div>
                    {isOpen
                      ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
                  </button>

                  {/* Day rows */}
                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100">
                      {DAYS.map(day => {
                        const key      = `${r._id}-${day}`;
                        const hasData  = !!r.days?.[day]?.activities?.trim();
                        const isLoading = previewing === key;
                        return (
                          <div key={day}
                            className="flex items-center gap-4 pl-14 pr-5 py-2.5 border-b border-gray-100 last:border-0">
                            <p className={`text-sm flex-1 ${hasData ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                              {DAY_LABELS[day]}
                              {!hasData && <span className="text-xs ml-2 text-gray-300">— no entry</span>}
                            </p>
                            <button
                              onClick={(e) => handlePreviewDay(e, r._id, day)}
                              disabled={!!previewing || !hasData}
                              title="Preview day"
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-30"
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        /* ── Quarterly ── */
        ) : (
          <div className="space-y-5 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            {quarters.map(({ label, items }) => (
              <div key={label} className="card overflow-hidden">
                {/* Quarter header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                  <div>
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-400 ml-2">{items.length} report{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => handleQuarterDownload(items)}
                    disabled={generating}
                    className="btn-primary text-xs disabled:opacity-60"
                  >
                    {generating ? <><Loader2 size={12} className="animate-spin" /> Generating…</> : <><Download size={12} /> Download {label}</>}
                  </button>
                </div>

                {/* Reports in quarter */}
                {items.map((r, i) => (
                  <div key={r._id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className={`w-[3px] h-8 flex-shrink-0 rounded-full ${STATUS_BAR[r.status] ?? 'bg-gray-200'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <UnitBadge unit={r.unit} />
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-gray-500">{formatWeek(r.weekStartDate)}</p>
                    </div>
                    <button
                      onClick={(e) => handlePreviewWeekly(e, r._id)}
                      disabled={!!previewing}
                      title="Preview"
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      {previewing === r._id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal preview */}
      {modal && (
        <PreviewModal
          url={modal.url}
          title={modal.title}
          onClose={closeModal}
          onDownload={handleModalDownload}
          downloading={downloading1 === 'modal'}
        />
      )}
    </div>
  );
};

export default GenerateReport;

import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SingleReportDoc, MultiReportDoc } from '../../components/ReportPDF';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import EmptyState from '../../components/EmptyState';
import { formatWeek, formatDate } from '../../utils/helpers';
import { Download, FileText, CheckSquare, Square, Loader2, Eye, X } from 'lucide-react';

const GenerateReport = () => {
  const { user } = useAuth();
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [previewing,   setPreviewing]   = useState(null); // report _id currently loading preview
  const [previewUrl,   setPreviewUrl]   = useState(null); // blob URL shown in modal
  const [downloading1, setDownloading1] = useState(null); // report _id being single-downloaded

  useEffect(() => {
    reportAPI.getMyReports({})
      .then(({ data }) => {
        const nonDraft = (data.reports ?? []).filter(r => r.status !== 'draft');
        setReports(nonDraft);
      })
      .finally(() => setLoading(false));
  }, []);

  const allSelected = reports.length > 0 && selected.size === reports.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(reports.map(r => r._id)));
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSingleDownload = async (e, reportId) => {
    e.stopPropagation();
    setDownloading1(reportId);
    try {
      const full = await reportAPI.getMyReport(reportId).then(r => ({ ...r.data.report, resident: user }));
      const blob = await pdf(<SingleReportDoc report={full} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GHS_Report_${full.unit?.replace(/\s+/g, '_')}_${formatDate(full.weekStartDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading1(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handlePreview = async (e, reportId) => {
    e.stopPropagation();
    setPreviewing(reportId);
    try {
      const full = await reportAPI.getMyReport(reportId).then(r => ({ ...r.data.report, resident: user }));
      const blob = await pdf(<SingleReportDoc report={full} />).toBlob();
      const url  = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } finally {
      setPreviewing(null);
    }
  };

  const handleDownload = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      const ids = [...selected];
      const fullReports = await Promise.all(
        ids.map(id => reportAPI.getMyReport(id).then(r => ({ ...r.data.report, resident: user })))
      );

      const doc = fullReports.length === 1
        ? <SingleReportDoc report={fullReports[0]} />
        : <MultiReportDoc reports={fullReports} />;

      const blob = await pdf(doc).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fullReports.length === 1
        ? `GHS_Report_${fullReports[0].unit?.replace(/\s+/g, '_')}_${formatDate(fullReports[0].weekStartDate)}.pdf`
        : `GHS_Reports_${formatDate(new Date())}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">

      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} className="text-primary" /> Generate Report
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Preview a report before downloading, or select reports and download as PDF
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports to generate"
          description="Submit a weekly report first before downloading a PDF."
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 animate-slide-up"
            style={{ animationDelay: '60ms', animationFillMode: 'both' }}>

            <button onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
              {allSelected
                ? <CheckSquare size={16} className="text-primary" />
                : <Square size={16} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>

            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <span className="text-xs text-gray-400 font-medium">
                  {selected.size} report{selected.size > 1 ? 's' : ''} selected
                </span>
              )}
              {selected.size > 0 && (
                <button
                  onClick={handleDownload}
                  disabled={generating}
                  className="btn-primary text-sm disabled:opacity-60">
                  {generating
                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                    : <><Download size={14} /> Download PDF</>}
                </button>
              )}
            </div>
          </div>

          {/* Report list */}
          <div className="card overflow-hidden animate-slide-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            {reports.map((r, i) => {
              const isSelected  = selected.has(r._id);
              const isPreviewing = previewing === r._id;
              return (
                <div key={r._id}
                  onClick={() => toggle(r._id)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-150
                    ${i !== 0 ? 'border-t border-gray-100' : ''}
                    ${isSelected ? 'bg-primary/[0.03]' : 'hover:bg-gray-50'}`}>

                  {/* Checkbox */}
                  <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>

                  {/* Status accent bar */}
                  <div className={`w-1 h-10 flex-shrink-0
                    ${r.status === 'reviewed' ? 'bg-green-400' : 'bg-blue-400'}`} />

                  {/* Info */}
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

                  {/* Per-row action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handlePreview(e, r._id)}
                      disabled={isPreviewing || !!previewing}
                      title="Preview report"
                      className="w-8 h-8 flex items-center justify-center text-gray-400
                                 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      {isPreviewing
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Eye size={18} />}
                    </button>
                    <button
                      onClick={(e) => handleSingleDownload(e, r._id)}
                      disabled={downloading1 === r._id || !!downloading1}
                      title="Download this report"
                      className="w-8 h-8 flex items-center justify-center text-gray-400
                                 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      {downloading1 === r._id
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Download size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-300 mt-4 text-center animate-fade-in"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            Select reports above then click Download PDF — or Preview to view before downloading
          </p>
        </>
      )}
      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
          onClick={closePreview}>
          <div className="relative w-full max-w-4xl h-[90vh] bg-white flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Report Preview</p>
              <button onClick={closePreview}
                className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* PDF iframe */}
            <iframe
              src={previewUrl}
              className="flex-1 w-full"
              title="Report Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateReport;

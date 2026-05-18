import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SingleReportDoc } from '../../components/ReportPDF';
import { DAYS, DAY_LABELS, formatDate, formatWeek } from '../../utils/helpers';
import { ArrowLeft, MessageSquare, Calendar, Send, Trash2, Download, Loader2, Pencil } from 'lucide-react';

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('monday');
  const [submitting,  setSubmitting]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    reportAPI.getMyReport(id)
      .then(({ data }) => { setReport(data.report); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportAPI.submitReport(id);
      setReport(r => ({ ...r, status: 'submitted' }));
    } finally { setSubmitting(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const reportWithResident = { ...report, resident: user };
      const blob = await pdf(<SingleReportDoc report={reportWithResident} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GHS_Report_${report.unit?.replace(/\s+/g, '_')}_${formatDate(report.weekStartDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft?')) return;
    setDeleting(true);
    try {
      await reportAPI.deleteReport(id);
      navigate('/resident/reports');
    } finally { setDeleting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!report) return <div className="p-8 text-gray-400">Report not found.</div>;

  const isDraft = report.status === 'draft';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/resident/reports')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to reports
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UnitBadge unit={report.unit} />
            <StatusBadge status={report.status} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{formatWeek(report.weekStartDate)}</h1>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Calendar size={11} /> Created {formatDate(report.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDraft ? (
            <>
              <button onClick={handleDelete} disabled={deleting}
                className="btn-ghost text-red-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => navigate(`/resident/reports/${id}/edit`)}
                className="btn-outline">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            </>
          ) : (
            <button onClick={handleDownload} disabled={downloading} className="btn-primary">
              {downloading
                ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                : <><Download size={14} /> Download PDF</>}
            </button>
          )}
        </div>
      </div>

      {/* Day tabs */}
      <div className="card mb-5 overflow-hidden animate-slide-up">
        <div className="flex border-b border-gray-100">
          {DAYS.map(day => {
            const filled = report.days?.[day]?.activities?.trim();
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 relative
                  ${activeDay === day ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                {DAY_LABELS[day].slice(0, 3)}
                {filled && <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-green-400 rounded-full" />}
                {activeDay === day && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
        <div className="p-6 animate-fade-in" key={activeDay}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">{DAY_LABELS[activeDay]}</h3>
          <div className="space-y-4">
            <div>
              <p className="label">Activities</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 min-h-[80px]">
                {report.days?.[activeDay]?.activities || <span className="text-gray-300 italic">No activities recorded</span>}
              </p>
            </div>
            <div>
              <p className="label">Competencies Acquired</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 min-h-[60px]">
                {report.days?.[activeDay]?.competenciesAcquired || <span className="text-gray-300 italic">None recorded</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional notes */}
      {report.additionalNotes && (
        <div className="card p-6 mb-5 animate-slide-up" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <p className="label">Additional Notes</p>
          <p className="text-sm text-gray-600 leading-relaxed">{report.additionalNotes}</p>
        </div>
      )}

      {/* Feedback */}
      {report.status === 'reviewed' && (
        <div className="card p-6 border-l-4 border-l-primary animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-primary" />
            <p className="text-sm font-bold text-gray-800">Admin Feedback</p>
            <span className="text-[10px] text-gray-400">· {formatDate(report.reviewedAt)}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {report.adminFeedback || <span className="italic text-gray-400">No feedback provided</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewReport;

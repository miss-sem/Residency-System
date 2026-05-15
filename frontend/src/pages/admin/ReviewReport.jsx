import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { DAYS, DAY_LABELS, formatDate, formatWeek } from '../../utils/helpers';
import { ArrowLeft, Calendar, CheckCircle, MessageSquare, Send } from 'lucide-react';

const ReviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('monday');
  const [reviewed, setReviewed]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { adminFeedback: '' } });

  useEffect(() => {
    reportAPI.getReport(id)
      .then(({ data }) => {
        setReport(data.report);
        if (data.report.status === 'reviewed') setReviewed(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async ({ adminFeedback }) => {
    await reportAPI.reviewReport(id, { adminFeedback });
    setReviewed(true);
    setReport(r => ({ ...r, status: 'reviewed', adminFeedback, reviewedAt: new Date() }));
  };

  if (loading) return <LoadingSpinner />;
  if (!report)  return <div className="p-8 text-gray-400">Report not found.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/admin/reports')}
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
          <h1 className="text-xl font-bold text-gray-800">{report.resident?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatWeek(report.weekStartDate)}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Calendar size={11} /> Submitted {formatDate(report.submittedAt)}
          </p>
        </div>
        {reviewed && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 text-green-600 text-sm font-medium animate-fade-in">
            <CheckCircle size={15} /> Reviewed
          </div>
        )}
      </div>

      {/* Day tabs */}
      <div className="card mb-5 overflow-hidden animate-slide-up">
        <div className="flex border-b border-gray-100">
          {DAYS.map(day => {
            const filled = report.days?.[day]?.activities?.trim();
            return (
              <button key={day} type="button" onClick={() => setActiveDay(day)}
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

      {/* Feedback form */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={15} className="text-primary" />
          <h2 className="text-sm font-bold text-gray-800">
            {reviewed ? 'Feedback Submitted' : 'Add Feedback & Mark as Reviewed'}
          </h2>
        </div>

        {reviewed ? (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4">
            {report.adminFeedback || <span className="italic text-gray-400">No feedback provided</span>}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <textarea
              className={`textarea mb-1 ${errors.adminFeedback ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
              rows={4}
              placeholder="Write your feedback for the resident..."
              {...register('adminFeedback', { required: 'Feedback is required before marking as reviewed' })}
            />
            {errors.adminFeedback && (
              <p className="text-xs text-red-500 mb-3">{errors.adminFeedback.message}</p>
            )}
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={15} />}
                Submit & Mark Reviewed
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewReport;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { DAYS, DAY_LABELS, formatDate, formatWeek } from '../../utils/helpers';
import { ArrowLeft, Calendar, CheckCircle, MessageSquare, Send } from 'lucide-react';

const ReviewReport = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const isReviewer = user?.role === 'reviewer';

  const [report,        setReport]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeDay,     setActiveDay]     = useState('monday');
  const [reviewed,      setReviewed]      = useState(false);
  const [adminContact,  setAdminContact]  = useState(null);
  const [comment,       setComment]       = useState('');
  const [commentSent,   setCommentSent]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const [reviewerComments, setReviewerComments] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { adminFeedback: '' } });

  useEffect(() => {
    const fetches = [reportAPI.getReport(id), messageAPI.getReportComments(id)];
    if (isReviewer) fetches.push(messageAPI.getAdminContact());
    Promise.all(fetches)
      .then(([rep, comments, contact]) => {
        setReport(rep.data.report);
        if (rep.data.report.status === 'reviewed') setReviewed(true);
        setReviewerComments(comments.data.messages);
        if (contact) setAdminContact(contact.data.user);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async ({ adminFeedback }) => {
    await reportAPI.reviewReport(id, { adminFeedback });
    setReviewed(true);
    setReport(r => ({ ...r, status: 'reviewed', adminFeedback, reviewedAt: new Date() }));
  };

  const sendComment = async () => {
    if (!comment.trim() || !adminContact) return;
    setSending(true);
    try {
      await messageAPI.sendMessage({ receiverId: adminContact._id, content: comment.trim(), reportId: id });
      setCommentSent(true);
      setComment('');
    } finally {
      setSending(false);
    }
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

      {/* Admin feedback (visible to both, read-only for reviewer) */}
      {(reviewed || !isReviewer) && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-800">
              {reviewed ? 'Admin Feedback' : 'Add Feedback & Mark as Reviewed'}
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
      )}

      {/* Reviewer comments — visible to admin */}
      {!isReviewer && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-800">Reviewer Comments</h2>
            {reviewerComments.length > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {reviewerComments.length}
              </span>
            )}
          </div>

          {reviewerComments.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 text-center">No reviewer comments yet.</p>
          ) : (
            <div className="space-y-3">
              {reviewerComments.map((m) => (
                <div key={m._id} className="flex items-start gap-3 animate-fade-in">
                  <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-purple-500">
                      {m.sender?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{m.sender?.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviewer comment box */}
      {isReviewer && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-800">Leave a Comment for Admin</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Your comment will be attached to this report and visible to admin on the report page.
          </p>

          {commentSent ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 animate-fade-in">
              <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">Comment added to report.</p>
              <button onClick={() => setCommentSent(false)}
                className="ml-auto text-xs text-gray-400 hover:text-primary transition-colors">
                Send another
              </button>
            </div>
          ) : (
            <>
              <textarea
                className="textarea mb-3"
                rows={4}
                placeholder={`Comment on this ${report.unit} report…`}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={sendComment}
                  disabled={sending || !comment.trim()}
                  className="btn-primary">
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />}
                  Send Comment
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewReport;

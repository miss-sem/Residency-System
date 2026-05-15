import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, CheckCircle, Clock, Bell, Plus, ChevronRight, MessageSquare } from 'lucide-react';
import { formatWeek, formatDate } from '../../utils/helpers';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getMyDashboard()
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const hasUnread = stats?.unreadFeedback > 0;

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Here's your activity overview</p>
        </div>
        <button onClick={() => navigate('/resident/reports/new')} className="btn-primary">
          <Plus size={16} /> New Report
        </button>
      </div>

      {/* Unread feedback alert */}
      {hasUnread && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-primary/5 border border-primary/20 rounded-2xl animate-slide-up cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => navigate('/resident/reports')}>
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              You have {stats.unreadFeedback} new feedback {stats.unreadFeedback === 1 ? 'notification' : 'notifications'}
            </p>
            <p className="text-xs text-gray-400">Click to view your reviewed reports</p>
          </div>
          <ChevronRight size={16} className="text-primary" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Submitted"  value={stats?.submitted}  icon={FileText}     color="blue"   delay={0} />
        <StatCard label="Reviewed"   value={stats?.reviewed}   icon={CheckCircle}  color="green"  delay={60} />
        <StatCard label="Drafts"     value={stats?.drafts}     icon={Clock}        color="amber"  delay={120} />
        <StatCard label="Unread Feedback" value={stats?.unreadFeedback} icon={Bell} color="primary" delay={180} />
      </div>

      {/* Recent feedback */}
      {stats?.recentFeedback?.length > 0 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" /> Recent Feedback
            </h2>
            <button onClick={() => navigate('/resident/reports')} className="text-xs text-primary font-medium hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentFeedback.map((r) => (
              <div key={r._id}
                onClick={() => navigate(`/resident/reports/${r._id}`)}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/2 transition-all duration-200 cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UnitBadge unit={r.unit} />
                    {!r.feedbackRead && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-1.5">{formatWeek(r.weekStartDate)}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{r.adminFeedback}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-[10px] text-gray-400">{formatDate(r.reviewedAt)}</p>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;

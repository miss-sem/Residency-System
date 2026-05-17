import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { reportAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationPanel from '../../components/NotificationPanel';
import {
  FileText, CheckCircle, Clock, TrendingUp,
  ChevronRight, Calendar, BookOpen, Bell,
} from 'lucide-react';
import { formatWeek } from '../../utils/helpers';

/* ── Animated counter ─────────────────────────────────────────── */
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
};

/* ── Stat card ────────────────────────────────────────────────── */
const ACCENT = {
  primary: {
    bg: 'bg-primary/5', icon: 'text-primary', num: 'text-primary',
    border: 'border-t-primary', glow: 'hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)]',
  },
  green: {
    bg: 'bg-green-50', icon: 'text-green-500', num: 'text-green-600',
    border: 'border-t-green-400', glow: 'hover:shadow-[0_8px_30px_rgba(22,163,74,0.15)]',
  },
  blue: {
    bg: 'bg-blue-50', icon: 'text-blue-500', num: 'text-blue-600',
    border: 'border-t-blue-400', glow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
  },
  amber: {
    bg: 'bg-amber-50', icon: 'text-amber-500', num: 'text-amber-600',
    border: 'border-t-amber-400', glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
  },
};

const StatCard = ({ label, value, icon: Icon, accent, delay = 0 }) => {
  const count = useCountUp(value ?? 0);
  const c = ACCENT[accent] || ACCENT.primary;

  return (
    <div
      className={`card p-5 flex flex-col gap-4 animate-slide-up border-t-2 ${c.border} ${c.glow}
        hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 cursor-default`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
      </div>
      <p className={`text-4xl font-bold ${c.num} leading-none tabular-nums`}>{count}</p>
    </div>
  );
};

/* ── Unit progress bar ────────────────────────────────────────── */
const UnitBar = ({ unit, count, max, delay }) => {
  const barRef = useRef(null);
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, delay + 120);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div
      className="group animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600 font-medium truncate pr-2 group-hover:text-primary transition-colors duration-200">{unit}</span>
        <span className={`text-xs font-bold flex-shrink-0 transition-colors duration-200 ${count > 0 ? 'text-primary' : 'text-gray-300'}`}>
          {count} {count === 1 ? 'report' : 'reports'}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 overflow-hidden rounded-full">
        <div
          ref={barRef}
          className="h-full bg-primary transition-all duration-[800ms] ease-out rounded-full"
          style={{ width: '0%' }}
        />
      </div>
    </div>
  );
};

/* ── Activity item ────────────────────────────────────────────── */
const STATUS_DOT   = { draft: 'bg-gray-300',  submitted: 'bg-blue-400',  reviewed: 'bg-green-400'  };
const STATUS_LABEL = { draft: 'Draft',         submitted: 'Submitted',    reviewed: 'Reviewed'       };
const STATUS_TEXT  = { draft: 'text-gray-500', submitted: 'text-blue-600',reviewed: 'text-green-600' };
const STATUS_BORDER= { draft: 'hover:border-l-gray-300', submitted: 'hover:border-l-blue-400', reviewed: 'hover:border-l-green-500' };

const ActivityItem = ({ report, onClick, delay }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary/[0.03]
      transition-all duration-200 text-left animate-fade-in border-b border-gray-50 last:border-0
      border-l-[3px] border-l-transparent ${STATUS_BORDER[report.status]}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[report.status]}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-700 truncate">{report.unit}</p>
      <p className="text-xs text-gray-400 mt-0.5">{formatWeek(report.weekStartDate)}</p>
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${STATUS_TEXT[report.status]}`}>
      {STATUS_LABEL[report.status]}
    </span>
    <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
  </button>
);

/* ── Notifications widget ─────────────────────────────────────── */
const NotifWidget = ({ unread, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-11 h-11 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-full
      flex items-center justify-center cursor-pointer hover:bg-white hover:border-primary/30
      hover:shadow-md hover:scale-110 transition-all duration-300 animate-fade-in group"
    style={{ animationDelay: '80ms', animationFillMode: 'both' }}
  >
    <Bell size={17} className="text-primary group-hover:scale-110 transition-transform duration-200" />
    {unread > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold
        rounded-full flex items-center justify-center leading-none animate-pulse">
        {unread > 9 ? '9+' : unread}
      </span>
    )}
  </button>
);

/* ── Greeting helpers ─────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ── Dashboard ────────────────────────────────────────────────── */
const ResidentDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { notifications, unread } = useNotifications();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    reportAPI.getMyDashboard()
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const unitMax      = Math.max(1, ...(stats?.unitsCoverage?.map(u => u.count) ?? [1]));
  const unitsCovered = stats?.unitsCoverage?.filter(u => u.count > 0).length ?? 0;
  const totalUnits   = stats?.unitsCoverage?.length ?? 6;
  const coveragePct  = Math.round((unitsCovered / totalUnits) * 100);

  return (
    <div className="h-full p-5 sm:p-6 lg:p-8 animate-fade-in space-y-5">

      {/* ── Hero ── */}
      <div
        className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up relative z-10"
        style={{
          animationFillMode: 'both',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f6ff 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-primary/[0.07] rounded-full animate-[pulse_5s_ease-in-out_infinite]" />
          <div className="absolute -bottom-10 right-16 w-32 h-32 bg-primary/[0.05] rounded-full animate-[pulse_7s_ease-in-out_1.5s_infinite]" />
          <div className="absolute top-4 right-48 w-20 h-20 bg-primary/[0.04] rounded-full animate-[pulse_6s_ease-in-out_3s_infinite]" />
        </div>

        <div className="relative z-10">
          <p
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5 animate-fade-in"
            style={{ animationDelay: '80ms', animationFillMode: 'both' }}
          >
            {todayLabel()}
          </p>
          <h1
            className="text-3xl font-bold text-gray-900 mb-1 animate-slide-up"
            style={{ animationDelay: '120ms', animationFillMode: 'both' }}
          >
            {greeting()},{' '}
            <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p
            className="text-sm text-gray-400 animate-fade-in"
            style={{ animationDelay: '180ms', animationFillMode: 'both' }}
          >
            Track your progress, one week at a time.
          </p>
        </div>

        <div ref={notifRef} className="relative z-10 flex-shrink-0">
          <NotifWidget unread={unread} onClick={() => setShowNotifs(v => !v)} />
          {showNotifs && (
            <NotificationPanel
              onClose={() => setShowNotifs(false)}
              className="absolute top-full right-0 mt-2 w-80"
            />
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={stats?.total}     icon={FileText}    accent="primary" delay={80}  />
        <StatCard label="Reviewed"      value={stats?.reviewed}  icon={CheckCircle} accent="green"   delay={150} />
        <StatCard label="Submitted"     value={stats?.submitted} icon={TrendingUp}  accent="blue"    delay={220} />
        <StatCard label="Drafts"        value={stats?.drafts}    icon={Clock}       accent="amber"   delay={290} />
      </div>

      {/* ── Coverage + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Units coverage — slides in from left */}
        <div
          className="card p-6 animate-slide-in-left hover:shadow-md transition-shadow duration-300"
          style={{ animationDelay: '340ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={15} className="text-primary" /> Units Coverage
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{unitsCovered} of {totalUnits} units covered</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary leading-none">{coveragePct}%</p>
              <p className="text-[10px] text-gray-400 mt-0.5">complete</p>
            </div>
          </div>

          {/* Overall bar */}
          <div className="w-full h-2.5 bg-gray-100 overflow-hidden rounded-full mb-6">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${coveragePct}%` }}
            />
          </div>

          <div className="space-y-4">
            {(stats?.unitsCoverage ?? []).map((u, i) => (
              <UnitBar key={u.unit} unit={u.unit} count={u.count} max={unitMax} delay={380 + i * 70} />
            ))}
          </div>
        </div>

        {/* Recent activity — slides in from right */}
        <div
          className="card overflow-hidden animate-slide-in-right flex flex-col hover:shadow-md transition-shadow duration-300"
          style={{ animationDelay: '340ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={15} className="text-primary" /> Recent Activity
            </h2>
            <button
              onClick={() => navigate('/resident/reports')}
              className="text-xs text-primary font-medium hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex-1">
            {(stats?.recentReports ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FileText size={30} className="text-gray-200" />
                <p className="text-sm text-gray-400">No reports yet</p>
                <button
                  onClick={() => navigate('/resident/reports/new')}
                  className="text-xs text-primary font-semibold hover:underline mt-1"
                >
                  Create your first report
                </button>
              </div>
            ) : (
              (stats?.recentReports ?? []).map((r, i) => (
                <ActivityItem
                  key={r._id}
                  report={r}
                  onClick={() => navigate(`/resident/reports/${r._id}`)}
                  delay={410 + i * 60}
                />
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResidentDashboard;

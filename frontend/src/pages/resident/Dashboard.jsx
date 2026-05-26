import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { reportAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationPanel from '../../components/NotificationPanel';
import {
  FileText, CheckCircle, Clock, TrendingUp, BookOpen, Bell, Pencil, Plus,
} from 'lucide-react';
import { formatWeek } from '../../utils/helpers';

/* ── Animated counter ───────────────────────────────────────────── */
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
};

/* ── SVG ring progress ──────────────────────────────────────────── */
const RingProgress = ({ pct, size = 72, stroke = 6, color = '#2563EB' }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDash(circ * Math.min(pct, 1)), 150);
    return () => clearTimeout(t);
  }, [circ, pct]);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
};

/* ── Donut chart (conic-gradient) ───────────────────────────────── */
const DonutChart = ({ reviewed, submitted, drafts, total }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 250); return () => clearTimeout(t); }, []);

  const rP = total > 0 ? (reviewed  / total) * 100 : 0;
  const sP = total > 0 ? (submitted / total) * 100 : 0;
  const dP = total > 0 ? (drafts    / total) * 100 : 0;

  const gradient = ready && total > 0
    ? `conic-gradient(
        #22c55e 0% ${rP}%,
        #3b82f6 ${rP}% ${rP + sP}%,
        #f59e0b ${rP + sP}% ${rP + sP + dP}%,
        #e5e7eb ${rP + sP + dP}% 100%
      )`
    : 'conic-gradient(#e5e7eb 0% 100%)';

  const segments = [
    { label: 'Reviewed',  color: 'bg-green-400', value: reviewed },
    { label: 'Submitted', color: 'bg-blue-400',  value: submitted },
    { label: 'Drafts',    color: 'bg-amber-400', value: drafts },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: 148, height: 148 }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: gradient, transition: 'background 1s ease' }}
        />
        <div className="absolute inset-[24px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-bold text-gray-800 leading-none">{total}</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-medium">total</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {segments.map(({ label, color, value }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-lg font-bold text-gray-700 leading-none">{value}</span>
            <span className="text-[10px] text-gray-400 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Stat card ──────────────────────────────────────────────────── */
const STAT_STYLES = {
  primary: { bg: 'bg-primary/5',  icon: 'text-primary',   num: 'text-primary',   border: 'border-t-primary',   glow: 'hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)]'  },
  green:   { bg: 'bg-green-50',   icon: 'text-green-500', num: 'text-green-600', border: 'border-t-green-400', glow: 'hover:shadow-[0_8px_30px_rgba(22,163,74,0.12)]'   },
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-500',  num: 'text-blue-600',  border: 'border-t-blue-400',  glow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]'  },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500', num: 'text-amber-600', border: 'border-t-amber-400', glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]'  },
};

const StatCard = ({ label, value, icon: Icon, accent, delay = 0 }) => {
  const count = useCountUp(value ?? 0);
  const c = STAT_STYLES[accent] || STAT_STYLES.primary;
  return (
    <div
      className={`card p-5 flex flex-col gap-3 animate-slide-up border-t-2 ${c.border} ${c.glow}
        hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 cursor-default`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={15} className={c.icon} />
        </div>
      </div>
      <p className={`text-4xl font-bold ${c.num} leading-none tabular-nums`}>{count}</p>
    </div>
  );
};

/* ── Unit bar ───────────────────────────────────────────────────── */
const UnitBar = ({ unit, count, max, delay }) => {
  const barRef = useRef(null);
  const pct    = max > 0 ? Math.round((count / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="group animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600 font-medium truncate pr-2 group-hover:text-primary transition-colors">{unit}</span>
        <span className={`text-xs font-bold flex-shrink-0 ${count > 0 ? 'text-primary' : 'text-gray-300'}`}>
          {count} {count === 1 ? 'report' : 'reports'}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div ref={barRef} className="h-full bg-primary rounded-full transition-all duration-[800ms] ease-out" style={{ width: '0%' }} />
      </div>
    </div>
  );
};

/* ── Bell widget ────────────────────────────────────────────────── */
const NotifWidget = ({ unread, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-10 h-10 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-full
      flex items-center justify-center hover:bg-white hover:border-primary/30 hover:shadow-md
      hover:scale-110 transition-all duration-300"
  >
    <Bell size={16} className="text-primary" />
    {unread > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold
        rounded-full flex items-center justify-center animate-pulse">
        {unread > 9 ? '9+' : unread}
      </span>
    )}
  </button>
);

/* ── Helpers ────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ── Dashboard ──────────────────────────────────────────────────── */
const ResidentDashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { unread }  = useNotifications();
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

  const total        = stats?.total      ?? 0;
  const reviewed     = stats?.reviewed   ?? 0;
  const submitted    = stats?.submitted  ?? 0;
  const draftsCount  = stats?.drafts     ?? 0;
  const unitMax      = Math.max(1, ...(stats?.unitsCoverage?.map(u => u.count) ?? [1]));
  const unitsCovered = stats?.unitsCoverage?.filter(u => u.count > 0).length ?? 0;
  const totalUnits   = stats?.unitsCoverage?.length ?? 6;
  const coveragePct  = Math.round((unitsCovered / totalUnits) * 100);
  const reviewedPct  = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const draftsList   = (stats?.recentReports ?? []).filter(r => r.status === 'draft');

  return (
    <div className="p-5 sm:p-6 lg:p-8 animate-fade-in space-y-5">

      {/* ── Hero ── */}
      <div
        className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6
          animate-slide-up relative z-50"
        style={{
          animationFillMode: 'both',
          background: 'linear-gradient(135deg, #ffffff 0%, #eef5ff 55%, #dbeafe 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] -z-10">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-primary/[0.06] rounded-full animate-[pulse_5s_ease-in-out_infinite]" />
          <div className="absolute -bottom-10 right-24 w-44 h-44 bg-primary/[0.04] rounded-full animate-[pulse_7s_ease-in-out_1.5s_infinite]" />
          <div className="absolute top-6 right-60 w-28 h-28 bg-primary/[0.03] rounded-full animate-[pulse_6s_ease-in-out_3s_infinite]" />
        </div>

        <div className="relative z-10 flex-1">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2"
            style={{ animationDelay: '60ms' }}>
            {todayLabel()}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
            {greeting()},{' '}
            <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-gray-400">Track your progress, one week at a time.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <RingProgress pct={reviewedPct / 100} size={76} stroke={7} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-gray-800 leading-none">{reviewedPct}%</span>
                <span className="text-[9px] text-gray-400">reviewed</span>
              </div>
            </div>
          </div>

          <div ref={notifRef} className="relative">
            <NotifWidget unread={unread} onClick={() => setShowNotifs(v => !v)} />
            {showNotifs && (
              <NotificationPanel
                onClose={() => setShowNotifs(false)}
                className="absolute top-full right-0 mt-2 w-80"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={total}        icon={FileText}    accent="primary" delay={80}  />
        <StatCard label="Reviewed"      value={reviewed}     icon={CheckCircle} accent="green"   delay={140} />
        <StatCard label="Drafts"        value={draftsCount}  icon={Clock}       accent="amber"   delay={200} />
        <StatCard label="Submitted"     value={submitted}    icon={TrendingUp}  accent="blue"    delay={260} />
      </div>

      {/* ── Middle: breakdown + drafts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Report breakdown donut */}
        <div
          className="card p-6 flex flex-col animate-slide-in-left hover:shadow-md transition-shadow duration-300"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-6">
            <FileText size={15} className="text-primary" /> Report Breakdown
          </h2>
          <div className="flex flex-1 items-center justify-center py-2">
            {total === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center">
                  <span className="text-sm text-gray-300 font-medium">No data</span>
                </div>
                <p className="text-xs text-gray-400">Submit your first report to see stats</p>
              </div>
            ) : (
              <DonutChart reviewed={reviewed} submitted={submitted} drafts={draftsCount} total={total} />
            )}
          </div>
        </div>

        {/* Drafts / Continue writing */}
        <div
          className="card overflow-hidden flex flex-col animate-slide-in-right hover:shadow-md transition-shadow duration-300"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock size={15} className="text-amber-500" /> Continue Writing
            </h2>
            {draftsList.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                {draftsList.length} draft{draftsList.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {draftsList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 px-6">
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center">
                <Plus size={22} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No drafts in progress</p>
              <p className="text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">
                Start a new report and save it as a draft to continue later
              </p>
              <button
                onClick={() => navigate('/resident/reports/new')}
                className="btn-primary text-xs mt-1">
                <Plus size={13} /> New Report
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 divide-y divide-gray-50">
                {draftsList.map((r, i) => (
                  <div
                    key={r._id}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors animate-fade-in"
                    style={{ animationDelay: `${320 + i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{r.unit}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatWeek(r.weekStartDate)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/resident/reports/${r._id}/edit`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary
                        hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40">
                <button
                  onClick={() => navigate('/resident/reports/new')}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  <Plus size={12} /> Start new report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Units coverage ── */}
      <div
        className="card p-6 animate-slide-up hover:shadow-md transition-shadow duration-300"
        style={{ animationDelay: '400ms', animationFillMode: 'both' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={15} className="text-primary" /> Units Coverage
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{unitsCovered} of {totalUnits} units covered</p>
          </div>
          <div className="relative">
            <RingProgress pct={coveragePct / 100} size={56} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{coveragePct}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {(stats?.unitsCoverage ?? []).map((u, i) => (
            <UnitBar key={u.unit} unit={u.unit} count={u.count} max={unitMax} delay={440 + i * 70} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default ResidentDashboard;

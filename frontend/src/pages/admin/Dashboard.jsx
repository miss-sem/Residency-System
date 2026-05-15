import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import UnitBadge from '../../components/UnitBadge';
import {
  Users, FileText, CheckCircle, Clock,
  ChevronRight, TrendingUp, PieChart, Building2,
} from 'lucide-react';
import { formatWeek } from '../../utils/helpers';

/* ── Animated count-up ─────────────────────────────────────────────────── */
const useCountUp = (target, delay = 0) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === null || target === undefined) return;
    let interval;
    const timer = setTimeout(() => {
      let current = 0;
      const step = Math.max(target / 50, 1);
      interval = setInterval(() => {
        current = Math.min(current + step, target);
        setCount(Math.floor(current));
        if (current >= target) clearInterval(interval);
      }, 16);
    }, delay);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [target, delay]);
  return count;
};

/* ── Stat card ──────────────────────────────────────────────────────────── */
const COLORS = {
  primary: { ring: 'bg-primary/10',  text: 'text-primary',    bar: 'bg-primary' },
  amber:   { ring: 'bg-amber-50',    text: 'text-amber-500',  bar: 'bg-amber-400' },
  green:   { ring: 'bg-green-50',    text: 'text-green-500',  bar: 'bg-green-500' },
  blue:    { ring: 'bg-blue-50',     text: 'text-blue-500',   bar: 'bg-blue-500' },
};

const StatCard = ({ label, value, icon: Icon, color = 'primary', delay = 0, sub }) => {
  const count = useCountUp(value ?? 0, delay);
  const c = COLORS[color];
  return (
    <div className="card p-5 animate-slide-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 flex items-center justify-center ${c.ring}`}>
          <Icon size={18} className={c.text} />
        </div>
        <div className={`h-1 w-10 ${c.bar} opacity-30 self-end`} />
      </div>
      <p className="text-3xl font-bold text-gray-800 leading-none mb-1.5 tabular-nums">{count}</p>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
    </div>
  );
};

/* ── Animated bar (weekly chart) ────────────────────────────────────────── */
const AnimatedBar = ({ pct, delay }) => {
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(pct), 400 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-700 ease-out"
      style={{ height: `${h}%` }} />
  );
};

/* ── Weekly bar chart ───────────────────────────────────────────────────── */
const WeeklyChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  return (
    <div className="flex items-end gap-2.5 h-36">
      {data.map((w, i) => (
        <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 h-4">{w.count > 0 ? w.count : ''}</span>
          <div className="w-full relative bg-gray-100" style={{ height: '90px' }}>
            <AnimatedBar pct={(w.count / max) * 100} delay={i * 80} />
          </div>
          <span className="text-[9px] text-gray-400 text-center leading-tight whitespace-nowrap">{fmt(w.week)}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Donut ring (SVG) ───────────────────────────────────────────────────── */
const DonutRing = ({ reviewed, pending }) => {
  const total = reviewed + pending;
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(total > 0 ? (reviewed / total) * 100 : 0), 500);
    return () => clearTimeout(t);
  }, [reviewed, total]);

  return (
    <div className="flex items-center justify-center py-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3.2" />
          {total > 0 && (
            <>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.2"
                pathLength="100"
                strokeDasharray={`${pct} ${100 - pct}`}
                className="transition-all duration-1000 ease-out" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3.2"
                pathLength="100"
                strokeDasharray={`${100 - pct} ${pct}`}
                strokeDashoffset={`-${pct}`}
                className="transition-all duration-1000 ease-out" />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 tabular-nums">{total}</span>
          <span className="text-[10px] text-gray-400">total</span>
        </div>
      </div>
    </div>
  );
};

/* ── Dept bar ───────────────────────────────────────────────────────────── */
const DeptBar = ({ dept, count, max, delay }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((count / max) * 100), 500 + delay);
    return () => clearTimeout(t);
  }, [count, max, delay]);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600 font-medium truncate">{dept || 'Unassigned'}</span>
        <span className="text-xs font-bold text-gray-500 flex-shrink-0">{count}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 overflow-hidden">
        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
};

/* ── Dashboard ──────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr  = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      reportAPI.getAllReports({ status: 'submitted' }),
    ]).then(([s, r]) => {
      setStats(s.data);
      setPending(r.data.reports.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const reviewed = stats?.reviewed ?? 0;
  const submitted = stats?.submitted ?? 0;
  const deptMax = stats?.deptBreakdown?.length
    ? Math.max(...stats.deptBreakdown.map(d => d.count))
    : 1;
  const reviewedPct = (reviewed + submitted) > 0
    ? Math.round((reviewed / (reviewed + submitted)) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <p className="text-xs text-gray-400 font-medium mb-1">{dateStr}</p>
        <h1 className="text-2xl font-bold text-gray-800">
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Overview of residency programme</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Residents" value={stats?.totalResidents} icon={Users}       color="primary" delay={0}   />
        <StatCard label="Total Reports"   value={stats?.totalReports}   icon={FileText}    color="blue"    delay={80}  sub="Submitted & reviewed" />
        <StatCard label="Pending Review"  value={stats?.pendingReview}  icon={Clock}       color="amber"   delay={160} />
        <StatCard label="Reviewed"        value={stats?.reviewed}       icon={CheckCircle} color="green"   delay={240} />
      </div>

      {/* Middle row: weekly chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Weekly submissions bar chart */}
        <div className="card p-6 lg:col-span-2 animate-slide-up"
          style={{ animationDelay: '280ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" /> Weekly Submissions
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Reports submitted over the last 6 weeks</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary" />
              <span className="text-[10px] text-gray-400">Submissions</span>
            </div>
          </div>
          {stats?.weeklyTrend?.length ? (
            <WeeklyChart data={stats.weeklyTrend} />
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-gray-300">No data yet</div>
          )}
        </div>

        {/* Donut status chart */}
        <div className="card p-6 animate-slide-up"
          style={{ animationDelay: '320ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
            <PieChart size={15} className="text-primary" /> Submission Status
          </h2>
          <DonutRing reviewed={reviewed} pending={submitted} />
          <div className="space-y-2.5 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">Reviewed</span>
              </div>
              <span className="text-xs font-bold text-gray-700 tabular-nums">
                {reviewed}
                <span className="text-gray-300 font-normal ml-1">({reviewedPct}%)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">Pending Review</span>
              </div>
              <span className="text-xs font-bold text-gray-700 tabular-nums">
                {submitted}
                <span className="text-gray-300 font-normal ml-1">({100 - reviewedPct}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: dept breakdown + pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Department breakdown */}
        <div className="card p-6 animate-slide-up"
          style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-5">
            <Building2 size={15} className="text-primary" /> Submissions by Department
          </h2>
          {stats?.deptBreakdown?.length > 0 ? (
            <div className="space-y-4">
              {stats.deptBreakdown.map((d, i) => (
                <DeptBar key={d._id ?? i} dept={d._id} count={d.count} max={deptMax} delay={i * 80} />
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-gray-300">
              No submissions yet
            </div>
          )}
        </div>

        {/* Pending reviews */}
        <div className="card p-6 animate-slide-up"
          style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-700">Pending Reviews</h2>
            <button onClick={() => navigate('/admin/reports')}
              className="text-xs text-primary font-semibold hover:underline">
              View all
            </button>
          </div>

          {pending.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle size={30} className="text-green-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-300 mt-0.5">No reports awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((r, i) => (
                <div key={r._id}
                  onClick={() => navigate(`/admin/reports/${r._id}`)}
                  className="flex items-center gap-3 p-3 border border-gray-100 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${420 + i * 50}ms`, animationFillMode: 'both' }}>
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {r.resident?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{r.resident?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">{formatWeek(r.weekStartDate)}</span>
                      <span className="text-gray-200">·</span>
                      <UnitBadge unit={r.unit} />
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../../services/api';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  FileText, TrendingUp,
} from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const STATUS_DOT = {
  draft:     'bg-gray-300',
  submitted: 'bg-blue-400',
  reviewed:  'bg-green-400',
};
const STATUS_LABEL = {
  draft:     { label: 'Draft',     color: 'text-gray-500 bg-gray-100'  },
  submitted: { label: 'Submitted', color: 'text-blue-600 bg-blue-50'   },
  reviewed:  { label: 'Reviewed',  color: 'text-green-600 bg-green-50' },
};

const isWeekday = (d) => d.getDay() >= 1 && d.getDay() <= 5;

const snapToMonday = (date) => {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
};

const toKey = (date) => {
  const d = snapToMonday(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/* ── Animated count ──────────────────────────────────────────── */
const useCountUp = (target) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 600, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
};

const SummaryRow = ({ status, label, count, delay }) => {
  const animated = useCountUp(count);
  return (
    <div className="flex items-center justify-between animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-gray-700 tabular-nums">{animated}</span>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────── */
const ResidentCalendar = () => {
  const navigate = useNavigate();
  const [view, setView]         = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [reports, setReports]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [slideDir, setSlideDir] = useState(null);
  const [gridKey, setGridKey]   = useState(0);

  useEffect(() => {
    reportAPI.getMyReports({})
      .then(({ data }) => setReports(data.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  const reportMap = {};
  for (const r of reports) {
    if (r.weekStartDate) reportMap[toKey(r.weekStartDate)] = r;
  }

  const changeMonth = (dir) => {
    setSlideDir(dir);
    setView(v => {
      if (dir === 'prev') return v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 };
      return v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 };
    });
    setGridKey(k => k + 1);
    setSelected(null);
  };

  const getCells = () => {
    const first   = new Date(view.year, view.month, 1);
    const lastDay = new Date(view.year, view.month + 1, 0).getDate();
    let startDow  = first.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const cells = [];
    for (let i = startDow; i > 0; i--)
      cells.push({ d: new Date(view.year, view.month, 1 - i), cur: false });
    for (let i = 1; i <= lastDay; i++)
      cells.push({ d: new Date(view.year, view.month, i), cur: true });
    let next = 1;
    while (cells.length % 7 !== 0)
      cells.push({ d: new Date(view.year, view.month + 1, next++), cur: false });
    return cells;
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells = getCells();

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtWeek = (iso) => {
    const start = new Date(iso);
    const end   = new Date(start); end.setDate(end.getDate() + 4);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const slideAnim = slideDir === 'next' ? 'animate-slide-in-right'
    : slideDir === 'prev' ? 'animate-slide-in-back'
    : 'animate-fade-in';

  const totalReviewed  = reports.filter(r => r.status === 'reviewed').length;
  const totalSubmitted = reports.filter(r => r.status === 'submitted').length;
  const totalDraft     = reports.filter(r => r.status === 'draft').length;
  const coveragePct    = reports.length > 0 ? Math.round((totalReviewed / reports.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-5">

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalIcon size={20} className="text-primary" /> Submission Calendar
        </h1>
        <p className="text-sm text-gray-400 mt-1">Track which weeks you've submitted reports</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap animate-fade-in"
        style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
        {Object.entries(STATUS_DOT).map(([status, dot]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            {STATUS_LABEL[status].label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200" />
          No report
        </div>
      </div>

      {/* Main row: Calendar + Summary */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Calendar card ── */}
        <div className="flex-1 card overflow-hidden animate-slide-up hover:shadow-md transition-shadow duration-300"
          style={{ animationDelay: '80ms', animationFillMode: 'both' }}>

          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg text-gray-400 hover:scale-110">
              <ChevronLeft size={17} />
            </button>
            <span key={`${view.month}-${view.year}`}
              className="text-sm font-bold text-gray-800 animate-fade-in">
              {MONTH_NAMES[view.month]} {view.year}
            </span>
            <button onClick={() => changeMonth('next')}
              className="p-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg text-gray-400 hover:scale-110">
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {DAY_HEADERS.map((h, i) => (
              <div key={h}
                className={`py-2.5 text-center text-[10px] font-bold uppercase tracking-wide
                  ${i >= 5 ? 'text-gray-300' : 'text-gray-400'}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div key={gridKey} className={`grid grid-cols-7 ${slideAnim}`}
            style={{ animationFillMode: 'both' }}>
            {cells.map(({ d, cur }, idx) => {
              const key      = toKey(d);
              const report   = reportMap[key];
              const weekday  = isWeekday(d);
              const isSat    = d.getDay() === 6;
              const isSun    = d.getDay() === 0;
              const isToday  = d.getTime() === today.getTime();
              // only highlight weekday cells of the selected week
              const isSel    = selected?.key === key && weekday;
              const rowDelay = Math.floor(idx / 7) * 30;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!cur || !weekday) return;
                    setSelected(report ? { key, report } : null);
                  }}
                  disabled={!cur || !weekday}
                  className={`relative flex flex-col items-center justify-start py-2 min-h-[58px]
                    border-b border-r border-gray-50 transition-all duration-200 animate-fade-in
                    ${!cur ? 'opacity-20' : ''}
                    ${isSat || isSun ? 'bg-gray-50/40 cursor-default' : ''}
                    ${isSel ? 'bg-primary/[0.06]' : weekday && report ? 'hover:bg-gray-50 hover:scale-[1.01] cursor-pointer' : weekday ? 'hover:bg-gray-50/80 cursor-pointer' : ''}`}
                  style={{ animationDelay: `${rowDelay}ms`, animationFillMode: 'both' }}
                >
                  <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200
                    ${isToday
                      ? 'bg-primary text-white font-bold shadow-[0_0_0_3px_rgba(37,99,235,0.18)] animate-[pulse_2.5s_ease-in-out_infinite]'
                      : isSel
                        ? 'text-primary font-bold ring-2 ring-primary/25'
                        : isSat || isSun
                          ? 'text-gray-300'
                          : cur ? 'text-gray-700' : 'text-gray-300'}`}>
                    {d.getDate()}
                  </span>

                  {/* Only show dot on weekdays */}
                  {report && weekday && (
                    <span className={`w-2 h-2 rounded-full mt-1 transition-all duration-200
                      ${STATUS_DOT[report.status]}
                      ${isSel ? 'scale-125 ring-2 ring-offset-1 ring-green-200' : 'group-hover:scale-110'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Inline week details (appears below grid when a week is selected) */}
          {selected && (
            <div key={selected.key}
              className="border-t border-primary/10 bg-primary/[0.025] px-5 py-4 animate-slide-up"
              style={{ animationFillMode: 'both' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-bold text-gray-800">{fmtWeek(selected.report.weekStartDate)}</p>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${STATUS_LABEL[selected.report.status].color}`}>
                    {STATUS_LABEL[selected.report.status].label}
                  </span>
                  {selected.report.unit && (
                    <span className="text-xs text-gray-500 font-medium">{selected.report.unit}</span>
                  )}
                  {selected.report.submittedAt && (
                    <span className="text-xs text-gray-400">Submitted {fmtDate(selected.report.submittedAt)}</span>
                  )}
                  {selected.report.reviewedAt && (
                    <span className="text-xs text-gray-400">· Reviewed {fmtDate(selected.report.reviewedAt)}</span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/resident/reports/${selected.report._id}`)}
                  className="btn-primary text-xs flex-shrink-0">
                  <FileText size={12} /> View Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary card ── */}
        <div className="w-full lg:w-60 flex-shrink-0 card p-5 animate-slide-in-right"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}>

          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-primary" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Summary</p>
          </div>

          {reports.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Review rate</span>
                <span className="font-bold text-primary">{coveragePct}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${coveragePct}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <SummaryRow status="draft"     label="Draft"     count={totalDraft}     delay={200} />
            <SummaryRow status="submitted" label="Submitted" count={totalSubmitted} delay={260} />
            <SummaryRow status="reviewed"  label="Reviewed"  count={totalReviewed}  delay={320} />
            <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between animate-fade-in"
              style={{ animationDelay: '380ms', animationFillMode: 'both' }}>
              <span className="text-xs text-gray-500 font-medium">Total weeks</span>
              <span className="text-xs font-bold text-gray-700 tabular-nums">{reports.length}</span>
            </div>
          </div>

          {!selected && (
            <div className="mt-5 pt-4 border-t border-gray-100 text-center animate-fade-in"
              style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2 animate-[pulse_3s_ease-in-out_infinite]">
                <CalIcon size={16} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 leading-snug">Click a weekday with a dot to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentCalendar;

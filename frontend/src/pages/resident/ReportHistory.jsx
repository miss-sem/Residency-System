import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, ChevronRight, Bell, Calendar, Search } from 'lucide-react';
import { formatWeek, getMondayOfWeek } from '../../utils/helpers';

const STATUS_FILTERS = ['all', 'draft', 'submitted', 'reviewed'];

const WEEK_PRESETS = [
  { label: 'All time',  value: 'all' },
  { label: 'This week', value: 'this' },
  { label: 'Custom',    value: 'custom' },
];

const STATUS_BAR = {
  draft:     'bg-gray-300',
  submitted: 'bg-blue-500',
  reviewed:  'bg-green-500',
};

const buildParams = (statusFilter, weekPreset, customFrom, customTo) => {
  const params = {};
  if (statusFilter !== 'all') params.status = statusFilter;

  if (weekPreset === 'this') {
    const mon = getMondayOfWeek();
    params.weekFrom = mon;
    params.weekTo   = mon;
  } else if (weekPreset === 'last4') {
    const mon = getMondayOfWeek();
    const d   = new Date(mon);
    d.setDate(d.getDate() - 21);
    params.weekFrom = d.toISOString().split('T')[0];
    params.weekTo   = mon;
  } else if (weekPreset === 'custom') {
    if (customFrom) params.weekFrom = customFrom;
    if (customTo)   params.weekTo   = customTo;
  }
  return params;
};

const ReportHistory = () => {
  const navigate = useNavigate();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // filter state
  const [statusFilter, setStatus]   = useState('all');
  const [weekPreset, setWeekPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');

  // params that were last actually fetched
  const [fetchedParams, setFetchedParams] = useState(null);

  const doFetch = (params) => {
    setLoading(true);
    setFetchedParams(params);
    reportAPI.getMyReports(params)
      .then(({ data }) => setReports(data.reports))
      .finally(() => setLoading(false));
  };

  // initial load
  useEffect(() => { doFetch({}); }, []);

  const handleStatusChange = (f) => {
    setStatus(f);
    // re-fetch with new status but keep current week filter (except custom stays as-is)
    if (weekPreset !== 'custom') {
      doFetch(buildParams(f, weekPreset, customFrom, customTo));
    }
  };

  const handlePresetChange = (p) => {
    setWeekPreset(p);
    if (p === 'custom') {
      // pre-fill sensible defaults so the inputs aren't blank
      const today  = new Date().toISOString().split('T')[0];
      const mon4   = new Date(getMondayOfWeek());
      mon4.setDate(mon4.getDate() - 21);
      const from4  = mon4.toISOString().split('T')[0];
      setCustomFrom(prev => prev || from4);
      setCustomTo(prev => prev || today);
      // don't auto-fetch — user must click Apply
    } else {
      doFetch(buildParams(statusFilter, p, customFrom, customTo));
    }
  };

  const handleApplyCustom = () => {
    doFetch(buildParams(statusFilter, 'custom', customFrom, customTo));
  };

  const isFiltered = statusFilter !== 'all' || weekPreset !== 'all';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">My Reports</h1>
        <p className="text-sm text-gray-400">Track all your weekly submissions</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 shadow-card p-4 mb-6 flex flex-wrap items-start gap-x-6 gap-y-3">

        {/* Status */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-14">Status</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => handleStatusChange(f)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize border transition-all duration-200
                  ${statusFilter === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-100" />

        {/* Week */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-14 flex items-center gap-1">
            <Calendar size={11} /> Week
          </span>
          <div className="flex flex-wrap gap-1">
            {WEEK_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePresetChange(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold border transition-all duration-200
                  ${weekPreset === p.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {weekPreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleApplyCustom}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white border border-primary transition-all hover:bg-primary/90"
              >
                <Search size={11} /> Apply
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-4">
          {reports.length} report{reports.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No reports found"
          description={isFiltered
            ? 'No reports match the selected filters.'
            : 'Start by creating your first weekly report.'}
          action={!isFiltered && (
            <button onClick={() => navigate('/resident/reports/new')} className="btn-primary">
              Create First Report
            </button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {reports.map((r, i) => (
            <div
              key={r._id}
              onClick={() => navigate(`/resident/reports/${r._id}`)}
              className="card card-hover flex items-stretch overflow-hidden cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              <div className={`w-1 flex-shrink-0 ${STATUS_BAR[r.status] ?? 'bg-gray-200'}`} />
              <div className="flex items-center gap-4 px-4 py-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 mb-1.5">
                    {formatWeek(r.weekStartDate)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <UnitBadge unit={r.unit} />
                    <StatusBadge status={r.status} size="sm" />
                    {r.status === 'reviewed' && !r.feedbackRead && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5">
                        <Bell size={9} /> New feedback
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportHistory;

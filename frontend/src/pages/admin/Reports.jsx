import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI, adminAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import UnitBadge from '../../components/UnitBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, ChevronRight, Search, X, Calendar } from 'lucide-react';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi';
import Select from '../../components/Select';
import { formatWeek, getMondayOfWeek, DEPARTMENTS, UNITS } from '../../utils/helpers';

const STATUS_FILTERS = ['all', 'pending review', 'reviewed'];

const STATUS_BAR = {
  draft:     'bg-gray-300',
  submitted: 'bg-blue-500',
  reviewed:  'bg-green-500',
};

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-primary/10">
      <Icon size={20} className="text-primary" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 leading-none mb-1">{value ?? '—'}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);

const buildParams = (status, department, unit, weekPreset, customFrom, customTo, search) => {
  const p = {};
  if (status !== 'all') p.status = status === 'pending review' ? 'submitted' : status;
  if (department)        p.department = department;
  if (unit)              p.unit       = unit;
  if (search)            p.search     = search;
  if (weekPreset === 'this') {
    const mon = getMondayOfWeek();
    p.weekFrom = mon;
    p.weekTo   = mon;
  } else if (weekPreset === 'custom') {
    if (customFrom) p.weekFrom = customFrom;
    if (customTo)   p.weekTo   = customTo;
  }
  return p;
};

const Reports = () => {
  const navigate = useNavigate();

  const [stats, setStats]           = useState(null);
  const [status,     setStatus]     = useState('all');
  const [department, setDepartment] = useState('');
  const [unit,       setUnit]       = useState('');
  const [weekPreset, setWeekPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [search,     setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const doFetch = (params) => {
    setLoading(true);
    reportAPI.getAllReports(params)
      .then(({ data }) => setReports(data.reports))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (weekPreset === 'custom') return;
    doFetch(buildParams(status, department, unit, weekPreset, customFrom, customTo, search));
  }, [status, department, unit, weekPreset, search]);

  const handleApplyCustom = () =>
    doFetch(buildParams(status, department, unit, 'custom', customFrom, customTo, search));

  const handleSearch = () => setSearch(searchInput);

  const handleClearSearch = () => { setSearchInput(''); setSearch(''); };

  const handlePresetChange = (p) => {
    setWeekPreset(p);
    if (p === 'custom') {
      if (!customFrom) {
        const d = new Date(getMondayOfWeek());
        d.setDate(d.getDate() - 21);
        setCustomFrom(d.toISOString().split('T')[0]);
      }
      if (!customTo) setCustomTo(new Date().toISOString().split('T')[0]);
    }
  };

  const clearFilters = () => {
    setStatus('all'); setDepartment(''); setUnit('');
    setWeekPreset('all'); setCustomFrom(''); setCustomTo('');
    setSearch(''); setSearchInput('');
  };

  const isFiltered = status !== 'all' || department || unit || weekPreset !== 'all' || search;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">All Reports</h1>
        <p className="text-sm text-gray-400">Review and manage resident submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Reports"  value={stats?.totalReports} icon={HiOutlineDocumentText} />
        <StatCard label="Pending Review"   value={stats?.submitted}    icon={HiOutlineClock} />
        <StatCard label="Reviewed"       value={stats?.reviewed}     icon={HiOutlineCheckCircle} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 shadow-card p-4 mb-6 space-y-3">

        {/* Row 1: Search + Week + Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email or department..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 focus:outline-none focus:border-primary text-gray-700 placeholder-gray-300"
            />
            {searchInput && (
              <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 text-xs font-semibold bg-primary text-white border border-primary hover:bg-primary/90 transition-all">
            Search
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* Week filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
              <Calendar size={11} /> Week
            </span>
            <div className="flex gap-1">
              {[{ label: 'All time', value: 'all' }, { label: 'This week', value: 'this' }, { label: 'Custom', value: 'custom' }].map(p => (
                <button key={p.value} onClick={() => handlePresetChange(p.value)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all duration-200
                    ${weekPreset === p.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {weekPreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary" />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary" />
                <button onClick={handleApplyCustom}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-white border border-primary hover:bg-primary/90 transition-all">
                  Apply
                </button>
              </div>
            )}
          </div>

          {isFiltered && (
            <button onClick={clearFilters}
              className="ml-auto px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-all">
              Clear all
            </button>
          )}
        </div>

        {/* Row 2: Status */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 flex-shrink-0">Status</span>
          <div className="flex flex-1 gap-1">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setStatus(f)}
                className={`flex-1 py-2 text-xs font-semibold capitalize border transition-all duration-200
                  ${status === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Department + Unit */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 flex-shrink-0">Department</span>
            <div className="flex-1 sm:flex-none sm:min-w-[220px]">
              <Select
                options={['All departments', ...DEPARTMENTS]}
                value={department || 'All departments'}
                onChange={v => setDepartment(v === 'All departments' ? '' : v)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 flex-shrink-0 sm:w-auto">Unit</span>
            <div className="flex-1 sm:flex-none sm:min-w-[180px]">
              <Select
                options={['All units', ...UNITS]}
                value={unit || 'All units'}
                onChange={v => setUnit(v === 'All units' ? '' : v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-4">
          {reports.length} report{reports.length !== 1 ? 's' : ''} found
          {isFiltered && <span className="ml-1 text-primary font-medium">(filtered)</span>}
        </p>
      )}

      {/* Table */}
      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No reports found"
          description={isFiltered ? 'No reports match the selected filters.' : 'No reports have been submitted yet.'} />
      ) : (
        <div className="card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="w-1"></th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Resident</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Department</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Unit</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Week</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Submitted</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Status</th>
                  <th className="px-2 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r._id}
                    onClick={() => navigate(`/admin/reports/${r._id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${i * 25}ms`, animationFillMode: 'both' }}>
                    <td className="p-0 w-1">
                      <div className={`w-1 min-h-[56px] ${STATUS_BAR[r.status] ?? 'bg-gray-200'}`} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{r.resident?.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{r.resident?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.resident?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{r.resident?.department || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4"><UnitBadge unit={r.unit} /></td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{formatWeek(r.weekStartDate)}</td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-3 py-4"><ChevronRight size={15} className="text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

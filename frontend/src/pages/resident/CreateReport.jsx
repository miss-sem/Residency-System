import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportAPI } from '../../services/api';
import { UNITS, DAYS, DAY_LABELS, getMondayOfWeek } from '../../utils/helpers';
import {
  Save, Send, ChevronDown, BookOpen, Check,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ─── Unit custom dropdown ───────────────────────────────────────────────── */
const UnitSelect = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-3 text-sm bg-white border text-left
          transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer
          ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/15'}
          ${!value ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <span className="truncate">{value || 'Select a unit...'}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 shadow-xl max-h-52 overflow-y-auto">
          {UNITS.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => { onChange(u); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150
                ${value === u ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-primary/10 hover:text-primary'}`}
            >
              <span>{u}</span>
              {value === u && <Check size={14} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Custom date picker ─────────────────────────────────────────────────── */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

const parseLocal = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const snapToMonday = (date) => {
  const d   = new Date(date);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
};

const WeekPicker = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const selected = parseLocal(value);

  const [view, setView] = useState(() => {
    const base = selected || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const prevMonth = () =>
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () =>
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const getCells = () => {
    const first   = new Date(view.year, view.month, 1);
    const lastDay = new Date(view.year, view.month + 1, 0).getDate();
    let startDow  = first.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Mon-based offset

    const cells = [];
    for (let i = startDow; i > 0; i--)
      cells.push({ d: new Date(view.year, view.month, 1 - i), cur: false });
    for (let i = 1; i <= lastDay; i++)
      cells.push({ d: new Date(view.year, view.month, i), cur: true });
    let next = 1;
    while (cells.length < 42)
      cells.push({ d: new Date(view.year, view.month + 1, next++), cur: false });
    return cells;
  };

  const handleSelect = (date) => {
    const mon = snapToMonday(date);
    onChange(toLocalISO(mon));
    // Keep view on the month of the selected Monday
    setView({ year: mon.getFullYear(), month: mon.getMonth() });
    setOpen(false);
  };

  const displayLabel = selected
    ? selected.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const today = new Date();

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-sm bg-white border text-left
          transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer
          ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/15'}
          ${!selected ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <Calendar size={15} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1">{displayLabel || 'Select week start...'}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 shadow-2xl p-4 w-[268px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 transition-colors rounded">
              <ChevronLeft size={15} className="text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {MONTH_NAMES[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 transition-colors rounded">
              <ChevronRight size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-[10px] font-bold text-gray-400 py-1">{h}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {getCells().map(({ d, cur }, i) => {
              const isSelected = isSameDay(d, selected);
              const isToday    = isSameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className={`h-8 w-full text-xs font-medium transition-all duration-150 rounded
                    ${isSelected
                      ? 'bg-primary text-white font-semibold'
                      : isToday
                        ? 'text-primary font-bold hover:bg-primary/10'
                        : cur
                          ? 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                          : 'text-gray-300 hover:bg-gray-50'}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-3 border-t border-gray-100 pt-2">
            Picks the Monday of the selected week
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
const CreateReport = () => {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState('monday');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      unit: '',
      weekStartDate: getMondayOfWeek(),
      days: {
        monday:    { activities: '', competenciesAcquired: '' },
        tuesday:   { activities: '', competenciesAcquired: '' },
        wednesday: { activities: '', competenciesAcquired: '' },
        thursday:  { activities: '', competenciesAcquired: '' },
        friday:    { activities: '', competenciesAcquired: '' },
      },
      additionalNotes: '',
    },
  });

  const watchUnit      = watch('unit');
  const watchWeek      = watch('weekStartDate');
  const watchDays      = watch('days');
  const dayCompletion  = DAYS.filter(d => watchDays[d]?.activities?.trim()).length;

  const save = async (data, andSubmit = false) => {
    setServerError('');
    try {
      const { data: res } = await reportAPI.createReport({ ...data, status: 'draft' });
      if (andSubmit) await reportAPI.submitReport(res.report._id);
      navigate('/resident/reports');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const onDraft  = handleSubmit((data) => save(data, false));
  const onSubmit = async (data) => {
    setSubmitting(true);
    await save(data, true);
    setSubmitting(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">New Weekly Report</h1>
        <p className="text-sm text-gray-400">Fill in your activities for each day, then save or submit</p>
      </div>

      {serverError && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-sm text-red-600 animate-fade-in">
          {serverError}
        </div>
      )}

      <form noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

          {/* ── Left col: Meta ── */}
          <div className="card p-6 animate-slide-up">
            <div className="space-y-5">

              {/* Unit */}
              <div>
                <label className="label">Unit</label>
                <input type="hidden" {...register('unit', { required: 'Please select a unit' })} />
                <UnitSelect
                  value={watchUnit}
                  onChange={(val) => setValue('unit', val, { shouldValidate: true })}
                  error={!!errors.unit}
                />
                {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>}
              </div>

              {/* Week Starting */}
              <div>
                <label className="label">Week Starting</label>
                <input type="hidden" {...register('weekStartDate', { required: 'Week start date is required' })} />
                <WeekPicker
                  value={watchWeek}
                  onChange={(val) => setValue('weekStartDate', val, { shouldValidate: true })}
                  error={!!errors.weekStartDate}
                />
                {errors.weekStartDate && <p className="mt-1 text-xs text-red-500">{errors.weekStartDate.message}</p>}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-400 font-medium">Days filled</span>
                  <span className="text-xs font-semibold text-gray-600">{dayCompletion} / 5</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(dayCompletion / 5) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ── Right col: Day tabs + notes + actions ── */}
          <div
            className="card overflow-hidden animate-slide-up"
            style={{ animationDelay: '40ms', animationFillMode: 'both' }}
          >
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {DAYS.map(day => {
                const filled = watchDays[day]?.activities?.trim().length > 0;
                return (
                  <button type="button" key={day} onClick={() => setActiveDay(day)}
                    className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 relative
                      ${activeDay === day ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                    {DAY_LABELS[day].slice(0, 3)}
                    {filled && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-green-400 rounded-full" />}
                    {activeDay === day && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                  </button>
                );
              })}
            </div>

            <div className="p-6 space-y-5 animate-fade-in" key={activeDay}>
              <h3 className="text-sm font-bold text-gray-700">{DAY_LABELS[activeDay]}</h3>

              <div>
                <label className="label">Activities</label>
                <textarea
                  className="textarea"
                  rows={5}
                  placeholder="Describe what you did today..."
                  {...register(`days.${activeDay}.activities`)}
                />
              </div>

              <div>
                <label className="label">Competencies Acquired</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="What skills or knowledge did you gain?"
                  {...register(`days.${activeDay}.competenciesAcquired`)}
                />
              </div>

              <div>
                <label className="label flex items-center gap-1.5"><BookOpen size={12} /> Additional Notes</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Any additional observations or remarks for the week..."
                  {...register('additionalNotes')}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end pt-1">
                <button type="button" onClick={onDraft} disabled={isSubmitting || submitting} className="btn-outline">
                  {isSubmitting && !submitting
                    ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <Save size={15} />}
                  Save Draft
                </button>
                <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || submitting} className="btn-primary">
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />}
                  Submit Report
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default CreateReport;

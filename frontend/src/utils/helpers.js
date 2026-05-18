export const DEPARTMENTS = [
  'Internal Medicine',
  'Surgery',
  'Paediatrics & Child Health',
  'Obstetrics & Gynaecology',
  'Emergency Medicine',
  'Family Medicine',
  'Public Health',
  'Psychiatry',
  'Radiology',
  'Anaesthesiology',
  'Ophthalmology',
  'Ear, Nose & Throat (ENT)',
  'Orthopedic Surgery',
  'Neurology',
  'Neurosurgery',
  'Cardiology',
  'Dermatology',
  'Gastroenterology',
  'Nephrology',
  'Pulmonology',
  'Endocrinology',
  'Oncology',
  'Urology',
  'Infectious Disease',
  'Pathology',
  'Community Health',
];

export const UNITS = [
  'EPI',
  'Orientation',
  'Health Promotion',
  'Nutrition',
  'Port Health',
  'Non-Communicable Health',
];

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};

export const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-600',     dot: 'bg-blue-500' },
  reviewed:  { label: 'Reviewed',  color: 'bg-green-50 text-green-600',   dot: 'bg-green-500' },
};

export const UNIT_COLORS = {
  'EPI':                    'bg-rose-50 text-rose-600 border-rose-100',
  'Orientation':            'bg-purple-50 text-purple-600 border-purple-100',
  'Health Promotion':       'bg-blue-50 text-blue-600 border-blue-100',
  'Nutrition':              'bg-amber-50 text-amber-600 border-amber-100',
  'Port Health':            'bg-teal-50 text-teal-600 border-teal-100',
  'Non-Communicable Health':'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatWeek = (date) => {
  if (!date) return '—';
  const start = new Date(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

export const getMondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

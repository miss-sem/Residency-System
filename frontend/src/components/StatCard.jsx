const StatCard = ({ label, value, icon: Icon, color = 'primary', delay = 0 }) => {
  const colors = {
    primary: 'bg-primary/8 text-primary',
    blue:    'bg-blue-50 text-blue-500',
    green:   'bg-green-50 text-green-500',
    amber:   'bg-amber-50 text-amber-500',
    purple:  'bg-purple-50 text-purple-500',
  };

  return (
    <div
      className="card card-hover p-6 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
        </div>
        <div className={`p-3 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;

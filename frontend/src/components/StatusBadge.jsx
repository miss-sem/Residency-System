import { STATUS_CONFIG } from '../utils/helpers';

const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.color} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'submitted' ? 'animate-pulse-dot' : ''}`} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;

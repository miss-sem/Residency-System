import { UNIT_COLORS } from '../utils/helpers';

const UnitBadge = ({ unit }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${UNIT_COLORS[unit] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
    {unit}
  </span>
);

export default UnitBadge;

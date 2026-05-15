const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon size={28} className="text-gray-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 mb-5 text-center max-w-xs">{description}</p>}
    {action}
  </div>
);

export default EmptyState;

const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-primary rounded-full animate-spin`} />
  );
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }
  return <div className="flex justify-center items-center py-12">{spinner}</div>;
};

export default LoadingSpinner;

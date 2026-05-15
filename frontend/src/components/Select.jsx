import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({ options, value, onChange, onBlur, placeholder = 'Select...', error, disabled }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect]   = useState(null);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const handleToggle = () => {
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
    setOpen(o => !o);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onBlur={onBlur}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm bg-white border text-left
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}
          ${!value ? 'text-gray-400' : 'text-gray-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && rect && (
        <div
          style={{
            position: 'fixed',
            top:   rect.bottom,
            left:  rect.left,
            width: rect.width,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 shadow-xl max-h-56 overflow-y-auto"
        >
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150
                ${value === option
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'}`}
            >
              <span>{option}</span>
              {value === option && <Check size={14} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;

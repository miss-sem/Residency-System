import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../utils/helpers';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, ChevronDown, Check } from 'lucide-react';

const DeptSelect = ({ value, onChange, error }) => {
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
        className={`w-full flex items-center justify-between px-4 py-3 text-sm bg-white border text-left
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer
          ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}
          ${!value ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <span className="truncate">{value || 'Select a department...'}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
          {DEPARTMENTS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => { onChange(d); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150
                ${value === d ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-primary/10 hover:text-primary'}`}
            >
              <span>{d}</span>
              {value === d && <Check size={14} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [dept, setDept]               = useState('');
  const [deptError, setDeptError]     = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const handleDeptChange = (v) => { setDept(v); if (v) setDeptError(''); };

  const onSubmit = async ({ name, email, password }) => {
    if (!dept) { setDeptError('Please select a department'); return; }
    setServerError('');
    try {
      await registerUser({ name, email, department: dept, password });
      navigate('/resident/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1.5">Create account</h2>
        <p className="text-sm text-gray-400">Fill in your details to get started</p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 animate-fade-in">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Full name</label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className={`w-full pl-10 pr-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.name
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('name', { required: 'Full name is required' })}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Email address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.email
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Department</label>
          <DeptSelect value={dept} onChange={handleDeptChange} error={!!deptError} />
          {deptError && <p className="mt-1.5 text-xs text-red-500">{deptError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-11 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.password
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Confirm password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-11 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.confirmPassword
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600
                     text-white text-sm font-semibold py-3.5 transition-all duration-200
                     shadow-primary hover:shadow-lg active:scale-[0.98] disabled:opacity-60 mt-2">
          {isSubmitting
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <> Create account <ArrowRight size={15} /> </>}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </>
  );
};

export default Register;

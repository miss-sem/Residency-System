import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const WORDS = ['Welcome.', 'Hello!'];

const useTypewriter = () => {
  const [text, setText]     = useState('');
  const [phase, setPhase]   = useState('typing');
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const current = WORDS[wordIdx];
    if (phase === 'typing') {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), 110);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('deleting'), 1300);
      return () => clearTimeout(t);
    }
    if (text.length > 0) {
      const t = setTimeout(() => setText(text.slice(0, -1)), 70);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setWordIdx(i => (i + 1) % WORDS.length);
      setPhase('typing');
    }, 350);
    return () => clearTimeout(t);
  }, [text, phase, wordIdx]);

  return text;
};

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [showPwd, setShowPwd]         = useState(false);
  const [serverError, setServerError] = useState('');
  const heading = useTypewriter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/resident/reports/new', { replace: true });
    } catch (err) {
      setServerError(
        err.response?.status === 401
          ? 'Invalid email or password'
          : err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1.5">
          {heading}<span className="typewriter-cursor">|</span>
        </h2>
        <p className="text-sm text-gray-400">Enter your credentials to access your account</p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 animate-fade-in">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off" className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Email address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              autoComplete="off"
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.email || serverError
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
          <label className="block text-xs font-semibold text-gray-600 mb-2">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-11 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.password || serverError
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

        <button type="submit" disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600
                     text-white text-sm font-semibold py-3.5 transition-all duration-200
                     shadow-primary hover:shadow-lg active:scale-[0.98] disabled:opacity-60 mt-2">
          {isSubmitting
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <> Sign in <ArrowRight size={15} /> </>}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-8">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
      </p>
    </>
  );
};

export default Login;

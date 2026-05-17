import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const onSubmit = async ({ name, email, password }) => {
    setServerError('');
    try {
      await registerUser({ name, email, password });
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
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 animate-fade-in">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
          <p className="text-sm text-blue-600">{serverError}</p>
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
                  ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('name', { required: 'Full name is required' })}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-blue-500">{errors.name.message}</p>}
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
                  ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-blue-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.password
                  ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-blue-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Confirm password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                transition-all duration-200 focus:outline-none focus:ring-2
                ${errors.confirmPassword
                  ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
            />
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-blue-500">{errors.confirmPassword.message}</p>}
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

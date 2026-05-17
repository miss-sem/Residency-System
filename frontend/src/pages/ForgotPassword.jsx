import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authExtAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { email: '' } });

  const onSubmit = async (data) => {
    try {
      await authExtAPI.forgotPassword(data.email);
      setEmail(data.email);
      setSent(true);
    } catch (_) {
      setSent(true); // always show success for security
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-[380px] animate-fade-in">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">LB</span>
          </div>
          <span className="text-sm font-bold text-gray-800">LogBook System</span>
        </div>

        {sent ? (
          <div className="animate-fade-in">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-400 mb-6">
              We sent a password reset link to <span className="font-semibold text-gray-600">{email}</span>.
              The link expires in 1 hour.
            </p>
            <Link to="/login"
              className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1.5">Forgot password?</h2>
              <p className="text-sm text-gray-400">Enter your email and we'll send you a reset link</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
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

              <button type="submit" disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600
                           text-white text-sm font-semibold py-3.5 transition-all duration-200
                           shadow-primary hover:shadow-lg active:scale-[0.98] disabled:opacity-60">
                {isSubmitting
                  ? <Loader2 size={15} className="animate-spin" />
                  : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Remember it?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

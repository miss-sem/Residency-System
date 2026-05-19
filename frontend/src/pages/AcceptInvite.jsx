import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authExtAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const AcceptInvite = () => {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const { loginWithToken }        = useAuth();
  const [serverError, setServerError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;
    authExtAPI.getInviteInfo(token)
      .then(({ data }) => setInviteEmail(data.email))
      .catch(() => {});
  }, [token]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async ({ password }) => {
    setServerError('');
    try {
      const { data } = await authExtAPI.acceptInvite({ token, password });
      loginWithToken(data.token, data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invite link is invalid or has expired');
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
          <span className="text-sm font-bold text-gray-800">LogBook</span>
        </div>

        <>
            <div className="mb-8">
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-5">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1.5">
                Set your password
              </h2>
              <p className="text-sm text-gray-400">
                You've been invited as a reviewer. Create a password to activate your account.
              </p>
            </div>

            {serverError && (
              <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 animate-fade-in">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                <p className="text-sm text-blue-600">{serverError}</p>
              </div>
            )}

            {!token && (
              <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-100 text-sm text-blue-600">
                Invalid or missing invite token.{' '}
                <Link to="/login" className="font-semibold underline">Go to sign in</Link>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {inviteEmail && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} /> Your sign-in email
                    </span>
                  </label>
                  <div className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 text-gray-500 select-all">
                    {inviteEmail}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">Use this email to sign in after activating your account.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Lock size={11} /> Password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                    transition-all focus:outline-none focus:ring-2
                    ${errors.password
                      ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                      : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                />
                {errors.password && <p className="mt-1.5 text-xs text-blue-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Lock size={11} /> Confirm password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 text-sm bg-white border text-gray-800 placeholder-gray-300
                    transition-all focus:outline-none focus:ring-2
                    ${errors.confirmPassword
                      ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100'
                      : 'border-gray-200 focus:border-primary focus:ring-primary/15'}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === watch('password') || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-blue-500">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600
                           text-white text-sm font-semibold py-3.5 transition-all duration-200
                           shadow-primary hover:shadow-lg active:scale-[0.98] disabled:opacity-60">
                {isSubmitting
                  ? <Loader2 size={15} className="animate-spin" />
                  : <> Activate account <ArrowRight size={15} /> </>}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </>
      </div>
    </div>
  );
};

export default AcceptInvite;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { authAPI, authExtAPI, reportAPI } from '../services/api';
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { formatWeek } from '../utils/helpers';

const FeedbackBanner = ({ type, message }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 border text-sm animate-fade-in mt-5
      ${isSuccess
        ? 'bg-green-50 border-green-100 text-green-700'
        : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
      {isSuccess ? <CheckCircle size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
      {message}
    </div>
  );
};

const STATUS_DOT   = { draft: 'bg-gray-300',  submitted: 'bg-blue-400',  reviewed: 'bg-green-400'  };
const STATUS_LABEL = { draft: 'Draft',         submitted: 'Submitted',    reviewed: 'Reviewed'       };
const STATUS_TEXT  = { draft: 'text-gray-500', submitted: 'text-blue-600',reviewed: 'text-green-600' };
const STATUS_BORDER= { draft: 'hover:border-l-gray-300', submitted: 'hover:border-l-blue-400', reviewed: 'hover:border-l-green-500' };

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    if (user?.role === 'resident') {
      reportAPI.getMyDashboard()
        .then(({ data }) => setRecentReports(data.recentReports ?? []))
        .catch(() => {});
    }
  }, [user?.role]);

  // Profile form
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } =
    useForm({ defaultValues: { name: user?.name || '' } });

  const onProfile = async (data) => {
    setProfileMsg({ type: '', text: '' });
    try {
      const { data: res } = await authAPI.updateProfile({ name: data.name });
      updateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
  };

  // Password form
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    watch: watchPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const onPassword = async (data) => {
    setPwdMsg({ type: '', text: '' });
    try {
      await authExtAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      resetPwd();
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Settings</h1>
        <p className="text-sm text-gray-400">Manage your account details and security</p>
      </div>

      {user?.role === 'resident' && (
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={15} className="text-primary" /> Recent Activity
            </h2>
            <button onClick={() => navigate('/resident/reports')}
              className="text-xs text-primary font-medium hover:underline">
              View all
            </button>
          </div>
          {recentReports.filter(r => r.status !== 'reviewed').length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">No active reports.</p>
          ) : (
            recentReports.filter(r => r.status !== 'reviewed').map((r) => (
              <button
                key={r._id}
                onClick={() => navigate(`/resident/reports/${r._id}`)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary/[0.03]
                  transition-all duration-200 text-left border-b border-gray-50 last:border-0
                  border-l-[3px] border-l-transparent ${STATUS_BORDER[r.status]}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[r.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{r.unit}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatWeek(r.weekStartDate)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${STATUS_TEXT[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left: Account Info + Profile */}
        <div className="space-y-6">

          {/* Account Info card */}
          <div className="card p-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Account</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleProfile(onProfile)} noValidate className="card p-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Profile</p>
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5"><User size={11} /> Full Name</label>
                <input
                  className={`input ${profileErrors.name ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
                  {...regProfile('name', { required: 'Name is required' })}
                />
                {profileErrors.name && <p className="mt-1 text-xs text-blue-500">{profileErrors.name.message}</p>}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>
            </div>

            <FeedbackBanner type={profileMsg.type} message={profileMsg.text} />

            <div className="flex justify-end mt-5">
              <button type="submit" disabled={profileSubmitting} className="btn-primary">
                {profileSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right: Change Password */}
        <form onSubmit={handlePwd(onPassword)} noValidate className="card p-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Change Password</p>
          <p className="text-xs text-gray-400 mb-5">Use a strong password with at least 6 characters</p>

          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-1.5"><Lock size={11} /> Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${pwdErrors.currentPassword ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
                  {...regPwd('currentPassword', { required: 'Current password is required' })}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.currentPassword && <p className="mt-1 text-xs text-blue-500">{pwdErrors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Lock size={11} /> New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${pwdErrors.newPassword ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
                  {...regPwd('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.newPassword && <p className="mt-1 text-xs text-blue-500">{pwdErrors.newPassword.message}</p>}
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Lock size={11} /> Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${pwdErrors.confirmPassword ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
                  {...regPwd('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: v => v === watchPwd('newPassword') || 'Passwords do not match',
                  })}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.confirmPassword && <p className="mt-1 text-xs text-blue-500">{pwdErrors.confirmPassword.message}</p>}
            </div>
          </div>

          <FeedbackBanner type={pwdMsg.type} message={pwdMsg.text} />

          <div className="flex justify-end mt-5">
            <button type="submit" disabled={pwdSubmitting} className="btn-primary">
              {pwdSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

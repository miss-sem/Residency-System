import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { DEPARTMENTS } from '../utils/helpers';
import Select from '../components/Select';
import { User, Briefcase, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [success,     setSuccess]     = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name:            user?.name || '',
      department:      user?.department || '',
      currentPassword: '',
      newPassword:     '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSuccess('');
    try {
      const payload = { name: data.name, department: data.department };
      if (data.newPassword) {
        if (!data.currentPassword) {
          setServerError('Enter your current password to set a new one.');
          return;
        }
        payload.currentPassword = data.currentPassword;
        payload.newPassword     = data.newPassword;
      }
      const { data: res } = await authAPI.updateProfile(payload);
      updateUser(res.user);
      reset({
        name:            res.user.name,
        department:      res.user.department || '',
        currentPassword: '',
        newPassword:     '',
      });
      setShowCurrent(false);
      setShowNew(false);
      setSuccess('Your account has been updated successfully.');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed. Please try again.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Settings</h1>
        <p className="text-sm text-gray-400">Manage your account details and password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left column */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="card p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Account Info</p>
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

            {/* Profile */}
            <div className="card p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Profile</p>
              <div className="space-y-4">
                <div>
                  <label className="label flex items-center gap-1.5"><User size={11} /> Full Name</label>
                  <input
                    className={`input ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label flex items-center gap-1.5"><Briefcase size={11} /> Department</label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={DEPARTMENTS}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select a department..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Change Password */}
          <div className="card p-6 self-start">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Change Password</p>
            <p className="text-xs text-gray-400 mb-5">Leave both fields blank to keep your current password</p>
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5"><Lock size={11} /> Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input pr-11"
                    {...register('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5"><Lock size={11} /> New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-11 ${errors.newPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                    {...register('newPassword', {
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="mt-6 flex items-center gap-2.5 px-4 py-3 bg-green-50 border border-green-100 text-sm text-green-700 animate-fade-in">
            <CheckCircle size={15} className="flex-shrink-0" />
            {success}
          </div>
        )}
        {serverError && (
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-100 text-sm text-red-600 animate-fade-in">
            {serverError}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

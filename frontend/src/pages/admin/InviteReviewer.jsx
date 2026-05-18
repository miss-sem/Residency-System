import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authExtAPI } from '../../services/api';
import { UserPlus, User, Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InviteReviewer = () => {
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState('');
  const [error, setError]   = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { name: '', email: '' } });

  const onSubmit = async (data) => {
    setError('');
    try {
      await authExtAPI.inviteReviewer(data);
      setSentTo(data.email);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation. Please try again.');
    }
  };

  const handleAnother = () => { setSentTo(''); setError(''); reset(); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-800">Invite Reviewer</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          The reviewer will receive an email with a link to access the admin portal directly
        </p>
      </div>

      {sentTo ? (
        <div className="card p-8 text-center animate-fade-in">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="text-base font-semibold text-gray-800 mb-1">Invitation sent!</p>
          <p className="text-sm text-gray-400 mb-6">
            An access link has been sent to{' '}
            <span className="font-semibold text-gray-600">{sentTo}</span>.
            They can click it to enter the admin portal directly.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleAnother} className="btn-primary">
              <UserPlus size={14} /> Invite Another
            </button>
            <button onClick={handleAnother} className="btn-outline">
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">New Reviewer</p>
              <p className="text-xs text-gray-400">An invite link will be sent to their email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="label flex items-center gap-1.5"><User size={11} /> Full Name</label>
              <input
                placeholder="Dr. Jane Smith"
                className={`input ${errors.name ? 'border-blue-300 focus:border-blue-400' : ''}`}
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="mt-1 text-xs text-blue-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Mail size={11} /> Email Address</label>
              <input
                type="email"
                placeholder="reviewer@example.com"
                className={`input ${errors.email ? 'border-blue-300 focus:border-blue-400' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-blue-500">{errors.email.message}</p>}
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-red-50 border border-red-100 animate-fade-in">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InviteReviewer;

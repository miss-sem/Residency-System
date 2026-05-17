import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authExtAPI } from '../services/api';
import Modal from './Modal';
import { User, Mail, UserPlus, CheckCircle, Loader2 } from 'lucide-react';

const InviteModal = ({ isOpen, onClose }) => {
  const [sent, setSent]         = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: { name: '', email: '' } });

  const onSubmit = async (data) => {
    try {
      await authExtAPI.inviteReviewer(data);
      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleClose = () => {
    setSent(false);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Reviewer" size="sm">
      {sent ? (
        <div className="text-center py-4 animate-fade-in">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Invitation sent!</p>
          <p className="text-xs text-gray-400 mb-5">
            An invite link has been sent to <span className="font-semibold text-gray-600">{sentEmail}</span>.
            It expires in 48 hours.
          </p>
          <button onClick={handleClose} className="btn-primary w-full">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <p className="text-xs text-gray-400 -mt-1">
            The reviewer will receive an email to set up their account and can then review student reports.
          </p>
          <div>
            <label className="label flex items-center gap-1.5"><User size={11} /> Reviewer Name</label>
            <input
              placeholder="Dr. Jane Smith"
              className={`input ${errors.name ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="mt-1 text-xs text-blue-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Mail size={11} /> Email Address</label>
            <input
              type="email"
              placeholder="reviewer@example.com"
              className={`input ${errors.email ? 'border-blue-300 focus:border-blue-400 focus:ring-blue-100' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-blue-500">{errors.email.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Send Invitation
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default InviteModal;

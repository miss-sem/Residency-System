import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authExtAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const ReviewerAccess = () => {
  const [params]         = useSearchParams();
  const navigate         = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setError('Invalid invitation link.'); return; }

    authExtAPI.reviewerAccess(token)
      .then(({ data }) => {
        loginWithToken(data.token, data.user);
        navigate('/admin/dashboard', { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-6">
        {error ? (
          <>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Link expired or invalid</p>
            <p className="text-xs text-gray-400">{error}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Accessing portal…</p>
            <Loader2 size={18} className="animate-spin text-primary mx-auto mt-3" />
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewerAccess;

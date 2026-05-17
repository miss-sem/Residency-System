import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login    from '../pages/Login';
import Register from '../pages/Register';

const FORMS = { '/login': Login, '/signup': Register };

const AuthLayout = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [displayPath, setDisplayPath] = useState(location.pathname);
  const [phase, setPhase]             = useState('idle');
  const [forward, setForward]         = useState(true);
  const prevPath = useRef(location.pathname);

  // Redirect already-authenticated users away from auth pages
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin')    navigate('/admin/dashboard',      { replace: true });
    if (user.role === 'resident') navigate('/resident/dashboard', { replace: true });
  }, [user]);

  useEffect(() => {
    const next = location.pathname;
    const prev = prevPath.current;
    if (next === prev || !FORMS[next]) return;

    prevPath.current = next;
    setForward(next === '/signup');
    setPhase('exiting');

    const t = setTimeout(() => {
      setDisplayPath(next);
      setPhase('entering');
      const t2 = setTimeout(() => setPhase('idle'), 340);
      return () => clearTimeout(t2);
    }, 230);

    return () => clearTimeout(t);
  }, [location.pathname]);

  const animClass =
    phase === 'exiting'  ? (forward ? 'auth-exit-left'  : 'auth-exit-right')  :
    phase === 'entering' ? (forward ? 'auth-enter-right' : 'auth-enter-left') : '';

  const Form = FORMS[displayPath] || Login;

  return (
    <div className="min-h-screen flex">

      {/* Left panel — stays static, never re-renders */}
      <div className="hidden lg:flex w-[52%] relative overflow-hidden flex-col justify-between p-14">
        <img src="/sign-in.jpg" alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_15%]" />

        <div className="relative z-10" />
        <div className="relative z-10 auth-text-enter">
          <h1
            className="text-5xl font-bold text-white leading-[1.1] mb-4 tracking-tight whitespace-nowrap"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.40)' }}
          >
Log<span className="text-white/80">Book</span>
          </h1>
          <p
            className="text-white text-sm leading-relaxed max-w-xs auth-sub-enter"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.50)' }}
          >
            Submit weekly activity logs and receive feedback from your instructor.
          </p>
        </div>
        {/* <p
          className="relative z-10 text-white/60 text-xs auth-footer-enter"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
        >
          LogBook System · {new Date().getFullYear()}
        </p> */}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] p-8 overflow-hidden">
        <div className={`w-full max-w-[380px] ${animClass}`}>

          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            {/* <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">LB</span>
            </div> */}
          </div>

          <Form />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

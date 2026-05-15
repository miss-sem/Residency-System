import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Login    from '../pages/Login';
import Register from '../pages/Register';

const FORMS = { '/login': Login, '/signup': Register };

const AuthLayout = () => {
  const location = useLocation();
  const [displayPath, setDisplayPath] = useState(location.pathname);
  const [phase, setPhase]             = useState('idle');
  const [forward, setForward]         = useState(true);
  const prevPath = useRef(location.pathname);

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
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(145deg, rgba(196,30,62,0.65) 0%, rgba(217,34,67,0.60) 50%, rgba(160,24,48,0.70) 100%)' }} />

        <div className="relative z-10">
          <img src="/ghs-logo.png" alt="GHS Logo" className="h-14 w-14 object-contain" />
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-4 tracking-tight whitespace-nowrap">
            Residency <span className="text-white/60">System</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Submit weekly activity logs and receive feedback from your supervising administrator.
          </p>
        </div>
        <p className="relative z-10 text-white/30 text-xs">
          Ghana Health Service · {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] p-8 overflow-hidden">
        <div className={`w-full max-w-[380px] ${animClass}`}>

          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <img src="/ghs-logo.png" alt="GHS Logo" className="h-11 w-11 object-contain" />
          </div>

          <Form />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

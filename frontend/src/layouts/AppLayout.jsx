import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

const AppLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed height, never scrolls */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-300 h-full
        lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main area — only this scrolls */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <img src="/ghs-logo.png" alt="GHS Logo" className="h-8 w-8 object-contain" />
          <span className="text-sm font-bold text-gray-800">Residency System</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

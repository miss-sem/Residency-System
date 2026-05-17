import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Search, Trash2 } from 'lucide-react';
import { HiOutlineUserGroup } from 'react-icons/hi';

const Residents = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [residents, setResidents]   = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const loadTotal = () => {
    adminAPI.getResidents('').then(({ data }) => setTotalCount(data.residents.length));
  };

  const loadFiltered = (q = '') => {
    setLoading(true);
    adminAPI.getResidents(q)
      .then(({ data }) => setResidents(data.residents))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTotal(); loadFiltered(); }, []);

  useEffect(() => {
    const t = setTimeout(() => loadFiltered(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteResident(selected._id);
      setSelected(null);
      loadTotal();
      loadFiltered(search);
    } finally { setDeleting(false); }
  };

  const isFiltered = !!search;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Residents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage students</p>
      </div>

      {/* Stat card */}
      <div className="card p-5 flex items-center gap-4 mb-6 max-w-xs">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-primary/10">
          <HiOutlineUserGroup size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800 leading-none mb-1">
            {isFiltered ? residents.length : totalCount}
          </p>
          <p className="text-xs text-gray-400">Total Students</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10 w-full sm:w-64"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isFiltered && (
          <button onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-primary transition-colors underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : residents.length === 0 ? (
        <EmptyState icon={Users} title="No residents found"
          description={isFiltered ? 'No residents match the filter.' : 'Residents can sign up at the registration page.'} />
      ) : (
        <div className="card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Name', 'Email', 'Role', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {residents.map((r, i) => (
                  <tr key={r._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{r.name[0].toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{r.email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5
                        ${r.role === 'reviewer'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-primary/10 text-primary'}`}>
                        {r.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <button onClick={() => setSelected(r)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Remove Resident" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to remove <strong>{selected?.name}</strong>? This will also delete all their reports.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setSelected(null)} className="btn-outline">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="btn-primary !bg-red-500 hover:!bg-red-600 !shadow-none">
            {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Remove
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Residents;

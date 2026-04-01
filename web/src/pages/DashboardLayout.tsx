import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_SLUG = import.meta.env.VITE_SLUG ?? 'barbershop-napoli';

const navItems = [
  { to: '/admin/agenda', label: 'Agenda', icon: '📅' },
  { to: '/admin/clients', label: 'Clienti', icon: '👥' },
  { to: '/admin/staff', label: 'Staff', icon: '💈' },
  { to: '/admin/services', label: 'Servizi', icon: '✂️' },
];

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="text-white font-bold text-lg">BarberFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <a
            href={`/${DEFAULT_SLUG}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <span>🌐</span>
            Portale clienti
          </a>
          <div className="px-3 py-1 text-xs text-gray-500 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full text-left"
          >
            <span>🚪</span>
            Esci
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

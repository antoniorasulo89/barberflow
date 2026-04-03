import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_SLUG = import.meta.env.VITE_SLUG ?? 'barbershop-napoli';

const navItems = [
  { to: '/admin/agenda', label: 'Agenda', icon: 'Agenda' },
  { to: '/admin/clients', label: 'Clienti', icon: 'Clienti' },
  { to: '/admin/staff', label: 'Staff', icon: 'Staff' },
  { to: '/admin/services', label: 'Servizi', icon: 'Servizi' },
];

export default function DashboardLayout() {
  const { logout, user, tenantSlug } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const customerPortalHref = `/${tenantSlug ?? DEFAULT_SLUG}`;

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-[#f4efe6] text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Chiudi menu"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 font-semibold text-white shadow-lg shadow-brand-900/20">
              BF
            </div>
            <div>
              <div className="text-base font-semibold text-white">BarberFlow</div>
              <div className="text-xs text-white/55">Agenda, clienti e servizi in un unico posto</div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Workspace</div>
            <div className="mt-2 text-sm font-medium text-white/85">{tenantSlug ?? 'Tenant attivo'}</div>
            <div className="mt-1 text-xs text-white/50">Pensato per un uso quotidiano, rapido e senza passaggi superflui.</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-900/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="min-w-14 text-xs uppercase tracking-[0.18em] text-white/45">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 px-4 py-5">
          <a
            href={customerPortalHref}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="min-w-14 text-xs uppercase tracking-[0.18em] text-white/45">Link</span>
            Portale clienti
          </a>
          <div className="px-4 text-xs text-white/40">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="min-w-14 text-xs uppercase tracking-[0.18em] text-white/45">Exit</span>
            Esci
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f4efe6]/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              Menu
            </button>
            <div className="text-sm font-semibold text-slate-900">BarberFlow Admin</div>
            <a
              href={customerPortalHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              Portale
            </a>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

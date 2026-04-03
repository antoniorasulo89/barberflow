import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ slug: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.slug, form.email, form.password);
      navigate('/admin/agenda');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Credenziali non valide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#1f1408_0%,_#3d2912_20%,_#f4efe6_20%,_#f4efe6_100%)] p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div className="order-2 rounded-[32px] border border-white/70 bg-white p-8 shadow-xl shadow-brand-900/10 lg:order-2 lg:p-10">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              Admin workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Accedi alla dashboard BarberFlow</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Inserisci le credenziali del workspace per accedere ad agenda, clienti, staff e servizi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID workspace</label>
              <input
                className="input"
                placeholder="es. barberflow-demo"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
              />
              <p className="mt-2 text-xs text-slate-500">Serve solo a identificare il tuo spazio di lavoro multi-sede.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="input"
                type="email"
                placeholder="nome@azienda.it"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Inserisci la password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi alla dashboard'}
            </button>
          </form>
        </div>

        <div className="order-1 rounded-[32px] bg-[linear-gradient(180deg,_rgba(31,20,8,0.96)_0%,_rgba(61,41,18,0.92)_100%)] px-5 py-6 text-white shadow-xl shadow-black/10 lg:order-1 lg:px-7 lg:py-8">
          <div className="max-w-md">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              Dashboard admin
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">
              Agenda e operativita in un unico accesso.
            </h2>
            <div className="mt-6 space-y-3 text-sm text-white/80">
              <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">Agenda giorno, settimana e mese</div>
              <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">Clienti, staff e servizi in un solo workspace</div>
              <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">Accesso rapido senza schermate superflue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

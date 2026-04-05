import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Logo } from '../components/common/Logo';
import { Loader2 } from 'lucide-react';

export function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    accept_terms: false,
    newsletter_opt_in: false,
  });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accept_terms) {
      toast.error('Você deve aceitar os termos de uso.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.signup(form);
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      toast.error(axiosErr.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-[#1e1e1e] border border-white/10 rounded-xl !px-5 !py-4 text-[15px] text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-sm';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans selection:bg-violet-500/30">
      {/* Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111] overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--tw-gradient-stops))] from-indigo-900/20 via-[#111] to-[#111]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Logo size="xl" className="mb-8" animated />
          <h2 className="text-3xl font-medium text-white tracking-tight mb-4">
            Participe do Mymir
          </h2>
          <p className="text-gray-400 text-center max-w-sm text-lg leading-relaxed">
            Sua trilha sonora para as tendências de inteligência artificial em
            um só lugar.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Logo size="md" className="mb-4" animated />
          </div>

          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-semibold text-white tracking-wide !mb-3">
              Criar conta
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              Tenha acesso gratuito à inteligência de ponta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col !gap-7">
            <div className="flex flex-col !gap-3">
              <label className="text-sm font-medium text-gray-300">
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col !gap-3">
              <label className="text-sm font-medium text-gray-300">
                Informe o seu e-mail
              </label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col !gap-3">
              <label className="text-sm font-medium text-gray-300">
                Digite sua senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col !gap-5 !mt-3 bg-[#141414] !p-6 rounded-xl border border-white/5">
              <label className="flex items-center !gap-4 text-sm text-gray-400 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.accept_terms}
                  onChange={(e) => set('accept_terms', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-[#1e1e1e] accent-violet-600 cursor-pointer transition-colors shrink-0"
                />
                <span className="leading-snug group-hover:text-gray-300 transition-colors">
                  Li e aceito os termos de serviço e a política de privacidade.
                </span>
              </label>
              <label className="flex items-center !gap-4 text-sm text-gray-400 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.newsletter_opt_in}
                  onChange={(e) => set('newsletter_opt_in', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-[#1e1e1e] accent-violet-600 cursor-pointer transition-colors shrink-0"
                />
                <span className="leading-snug group-hover:text-gray-300 transition-colors">
                  Receba resumos semanais de projetos e notícias.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-70 disabled:cursor-not-allowed text-white text-[16px] font-semibold !py-4 rounded-xl transition-all !mt-6 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Criar minha conta'
              )}
            </button>
          </form>

          <p className="text-center text-[15px] text-gray-400 mt-12">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Acesse aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

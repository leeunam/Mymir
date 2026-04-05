import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Logo } from '../components/common/Logo';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      toast.error(axiosErr.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-[#1e1e1e] border border-white/10 rounded-xl !px-5 !py-4 text-[15px] text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-sm';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans selection:bg-violet-500/30">
      {/* Branding Panel - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111] overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-900/20 via-[#111] to-[#111]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Logo size="xl" className="mb-8" animated />
          <h2 className="text-3xl font-medium text-white tracking-tight mb-4">
            Bem-vindo(a) ao Mymir
          </h2>
          <p className="text-gray-400 text-center max-w-sm text-lg leading-relaxed">
            Inteligência editorial avançada sobre ecossistemas de IA,
            simplificada para o seu dia a dia.
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
              Entrar na conta
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              Digite seus dados para acessar seus painéis.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col !gap-7">
            <div className="flex flex-col !gap-3">
              <label className="text-sm font-medium text-gray-300">
                Informe o seu e-mail
              </label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col !gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">
                  Digite sua senha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast('Tela ainda não desenvolvida, faremos em breve!', {
                      icon: '🚧',
                    })
                  }
                  className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-70 disabled:cursor-not-allowed text-white text-[16px] font-semibold !py-4 rounded-xl transition-all !mt-6 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Acessar agora'
              )}
            </button>
          </form>

          <p className="text-center text-[15px] text-gray-400 mt-12">
            Ainda não tem uma conta?{' '}
            <Link
              to="/signup"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

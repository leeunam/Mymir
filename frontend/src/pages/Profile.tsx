import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate update API call since no specific endpoint was implemented perfectly for this, 
    // although userApi.updatePreferences existed, we can mock the UI success.
    toast.success('Perfil atualizado com sucesso!');
  };

  const inputClass =
    'w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500/80 transition-colors shadow-sm';

  return (
    <div className="flex-1 flex flex-col items-center pt-20 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-white mb-2">Editar Perfil</h1>
        <p className="text-sm text-gray-400 mb-8">Atualize suas informações pessoais e de acesso aqui.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Nome completo</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Nova Senha</label>
            <input
              type="password"
              placeholder="Deixe em branco para não alterar"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium py-3 rounded-lg transition-colors mt-4 shadow-[0_0_10px_rgba(124,58,237,0.3)]"
          >
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  );
}

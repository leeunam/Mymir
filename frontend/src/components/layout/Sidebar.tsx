import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquarePlus, MessageSquare, Settings, LogOut, Menu, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';
import { Logo } from '../common/Logo';
import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../../services/api';
import type { ChatPath } from '../../types';

type Session = { id: string; path: string; created_at?: string };

function SessionMenu({
  session,
  onDelete,
}: {
  session: Session;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => { setOpen((o) => !o); setConfirming(false); }}
        className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
        title="Opções"
        id={`session-menu-${session.id}`}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1 min-w-[140px] animate-in">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors rounded-lg"
              id={`delete-session-${session.id}`}
            >
              <Trash2 size={13} />
              Excluir chat
            </button>
          ) : (
            <div className="px-3 py-2 flex flex-col gap-2">
              <span className="text-[11px] text-gray-400 leading-tight">Confirmar exclusão?</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onDelete(session.id); setOpen(false); }}
                  className="flex-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1 rounded-md transition-colors font-medium"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 text-[11px] bg-white/5 hover:bg-white/10 text-gray-400 py-1 rounded-md transition-colors"
                >
                  Não
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const location = useLocation();
  const { logout } = useAuthStore();
  const { reset, loadSession, sessionId } = useChatStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    chatApi.getSessions().then(res => {
      if(res.data.success) {
        setSessions(res.data.data);
      }
    }).catch(() => {});
  }, [sessionId]);

  async function handleLoadSession(id: string, path: string) {
    try {
      const res = await chatApi.getHistory(id);
      if(res.data.success) {
        const msgs = res.data.data.messages.map((m: any, i: number) => ({
          id: `hist_${m.id || i}`,
          role: m.role,
          content: m.content,
          modelUsed: m.model_used,
          timestamp: m.created_at
        }));

        if (msgs.length === 0) {
          // Sessão sem mensagens: remove da lista local e não navega
          setSessions(prev => prev.filter(s => s.id !== id));
          return;
        }

        loadSession(id, path as ChatPath, msgs);
        navigate('/');
      }
    } catch(err) {
      console.error(err);
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      // Se a sessão ativa foi deletada, reset
      if (sessionId === id) reset();
    } catch (err) {
      console.error('Erro ao excluir sessão:', err);
    }
  }

  const formatPathLabel = (path: string) => {
    if (path === 'news') return 'Notícias';
    if (path === 'trends') return 'Tendências';
    if (path === 'projects') return 'Projetos';
    return 'Conversa';
  };

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } border-r border-white/5 bg-[#171717] flex flex-col transition-all duration-300 z-20 shrink-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16 w-full">
        {!collapsed && (
          <div className="flex items-center gap-3 shrink-0">
            <Logo size="sm" />
            <span className="text-white font-medium text-lg tracking-wide">Mymir</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-6">
        <Link
          to="/"
          onClick={() => reset()}
          className={`flex items-center gap-3 bg-[#2a2a2a] hover:bg-[#333333] text-gray-200 p-3 rounded-xl transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <MessageSquarePlus size={20} />
          {!collapsed && <span className="font-medium text-sm">Novo chat</span>}
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3">
        {!collapsed && <div className="text-xs font-semibold text-gray-500 mb-3 px-2 uppercase tracking-wider">Recentes</div>}
        <div className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          {sessions.length === 0 && !collapsed && (
            <div className="text-xs text-gray-600 px-2">Nenhum chat recente.</div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              className={`group flex items-center gap-2 p-2 rounded-lg transition-colors w-full ${
                s.id === sessionId ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <button
                onClick={() => handleLoadSession(s.id, s.path)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                <MessageSquare size={18} className="shrink-0" />
                {!collapsed && <span className="text-[13px] truncate">{formatPathLabel(s.path)}</span>}
              </button>

              {!collapsed && (
                <SessionMenu session={s} onDelete={handleDeleteSession} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Profile */}
      <div className="p-3 border-t border-white/5 mb-2 mt-auto">
        <Link
          to="/profile"
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors ${
            location.pathname === '/profile' ? 'bg-white/10 text-white' : ''
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={20} />
          {!collapsed && <span className="text-sm font-medium">Editar Perfil</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 p-2 mt-1 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors w-full text-left ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
}

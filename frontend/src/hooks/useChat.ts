import { chatApi } from '../services/api';
import { useChatStore } from '../store/chat.store';
import type { ChatPath } from '../types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// uuid não vem com o vite por padrão, usar alternativa simples
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat() {
  const store = useChatStore();

  const pathMessages: Record<string, string> = {
    news: 'Busque e apresente as principais notícias de inteligência artificial dos últimos 7 dias',
    trends: 'Analise e apresente as principais tendências de inteligência artificial dos últimos 7 dias',
    projects: 'Busque e apresente os projetos de inteligência artificial em destaque dos últimos 7 dias',
  };

  async function selectPath(path: ChatPath) {
    const sessionId = genId();
    store.setSession(sessionId, path);
    store.setLoading(true);
    store.addMessage({ role: 'assistant', content: '', isLoading: true });

    try {
      const res = await chatApi.send({
        path,
        message: pathMessages[path] ?? path,
        session_id: sessionId,
        model_pref: 'auto',
        source_pref: [],
      });
      store.replaceLoading(res.data.response, res.data.model_used);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const msg =
        axiosErr.response?.data?.detail || 'Erro ao conectar com o assistente';
      store.replaceLoading(`Erro: ${msg}`);
      toast.error(msg);
    }
  }

  async function sendFollowUp(message: string) {
    if (!message.trim() || store.isLoading) return;

    store.addMessage({ role: 'user', content: message });
    store.addMessage({ role: 'assistant', content: '', isLoading: true });
    store.setLoading(true);

    try {
      const res = await chatApi.send({
        path: 'followup',
        message,
        session_id: store.sessionId,
        model_pref: 'auto',
        source_pref: [],
      });
      store.replaceLoading(res.data.response, res.data.model_used);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const msg = axiosErr.response?.data?.detail || 'Erro ao enviar mensagem';
      store.replaceLoading(`Erro: ${msg}`);
      toast.error(msg);
    }
  }

  return {
    ...store,
    selectPath,
    sendFollowUp,
  };
}

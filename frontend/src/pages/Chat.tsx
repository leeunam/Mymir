import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '../store/auth.store';
import { AssistantOrb } from '../components/assistant/AssistantOrb';
import { PathSelector } from '../components/assistant/PathSelector';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import type { ChatPath } from '../types';
import { Toaster } from 'react-hot-toast';
import { User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ChatPage() {
  const [showPaths, setShowPaths] = useState(false);
  const { messages, isLoading, path, selectPath, sendFollowUp } = useChat();
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handlePathSelect(p: ChatPath) {
    setShowPaths(false);
    await selectPath(p);
  }

  return (
    <div className="flex flex-col h-full bg-[#111111] relative">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            color: '#e5e7eb',
            border: '1px solid #333',
            fontSize: '13px',
          },
        }}
      />

      {/* Título e Configurações (Canto Superior Direito) */}
      <div className="absolute top-5 right-5 md:top-8 md:right-8 z-50 flex items-center gap-4">
        <Link 
          to="/profile" 
          title="Configurações e Perfil"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1e1e1e] border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:scale-105"
        >
          <User size={18} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 w-full">
        <div className="max-w-4xl mx-auto h-full flex flex-col w-full">
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col items-center justify-center gap-10 min-h-[70vh]"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-medium text-white mb-2">
                    Olá, {user?.name?.split(' ')[0] || 'convidado'}
                  </h1>
                  <p className="text-gray-400 text-lg">Por onde começamos?</p>
                </div>

                <div className="relative w-full flex justify-center mt-8">
                  <AssistantOrb
                    onClick={() => setShowPaths((v) => !v)}
                    isLoading={isLoading}
                  />
                  <AnimatePresence>
                    {showPaths && <PathSelector onSelect={handlePathSelect} onClose={() => setShowPaths(false)} />}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5 pb-4"
              >
                {path && (
                  <div className="flex justify-center mb-6">
                    <span className="text-xs text-gray-400 bg-[#1e1e1e] border border-white/5 px-4 py-1.5 rounded-full shadow-sm">
                      {path === 'news' && 'Notícias principais'}
                      {path === 'trends' && 'Tendências e análise'}
                      {path === 'projects' && 'Projetos em destaque'}
                      {path === 'followup' && 'Conversa contínua'}
                    </span>
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {hasMessages && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="px-4 md:px-8 pb-6 pt-2 shrink-0 bg-[#111111] z-10 w-full"
          >
            <div className="max-w-4xl mx-auto w-full">
              <ChatInput onSend={sendFollowUp} disabled={isLoading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

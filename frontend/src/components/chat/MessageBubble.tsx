import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import type { ChatMessage } from '../../types';
import { TypingIndicator } from './TypingIndicator';
import { User } from 'lucide-react';
import { Logo } from '../common/Logo';
import { exportToPdf } from '../../utils/exportPdf';
import { useChatStore } from '../../store/chat.store';

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1v8M4 6l3 3 3-3M2 11h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const [exporting, setExporting] = useState(false);
  const path = useChatStore((s) => s.path);

  async function handleExport() {
    if (exporting || !message.content) return;
    setExporting(true);
    try {
      await exportToPdf(message.content, path || 'news');
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-4 w-full md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`shrink-0 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-[#1e1e1e] border border-white/10 text-gray-400 w-8 h-8 shadow-sm p-1.5'
              : 'bg-transparent text-white'
          }`}
        >
          {isUser ? <User size={16} /> : <Logo size="sm" />}
        </div>

        {/* Bubble + Export button */}
        <div className="flex flex-col gap-2 w-full">
          <div
            className={`px-5 py-4 text-[15px] leading-relaxed rounded-3xl ${
              isUser
                ? 'bg-[#262626] border border-white/5 text-gray-100 rounded-tr-sm'
                : 'bg-[#18181b]/50 border border-white/5 text-gray-200 rounded-tl-sm w-full font-light'
            }`}
          >
            {message.isLoading ? (
              <TypingIndicator />
            ) : isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-white/10 prose-headings:text-gray-100 prose-a:text-violet-400 prose-strong:text-gray-200 max-w-none text-[15px]">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}

            {message.modelUsed &&
              !message.isLoading &&
              message.modelUsed !== 'cache' && (
                <div className="mt-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider flex justify-end gap-1.5 items-center">
                  <span>Model: {message.modelUsed}</span>
                </div>
              )}
          </div>

          {/* Botão exportar PDF — apenas mensagens do assistente prontas */}
          {!isUser && !message.isLoading && message.content && (
            <div className="flex justify-end pr-1">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={handleExport}
                disabled={exporting}
                title="Exportar como PDF"
                className={`
                  group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  border border-white/5 bg-white/5
                  text-gray-500 hover:text-violet-400
                  hover:border-violet-500/40 hover:bg-violet-500/5
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {exporting ? (
                  <motion.div
                    className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <DownloadIcon />
                )}
                <span className="text-xs">
                  {exporting ? 'Gerando...' : 'Exportar PDF'}
                </span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

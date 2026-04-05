import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-end gap-3 bg-[#1e1e1e] border border-white/10 rounded-[28px] px-5 py-3.5 shadow-xl shadow-black/40 focus-within:border-white/20 focus-within:bg-[#222] transition-colors duration-200"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Pergunte ou comente algo..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent text-[15px] text-gray-200 placeholder-gray-500 outline-none resize-none disabled:opacity-40 leading-relaxed min-h-[24px] pt-0.5"
        style={{ maxHeight: '160px' }}
        onInput={(e) => {
          const t = e.target as HTMLTextAreaElement;
          t.style.height = 'auto';
          t.style.height = t.scrollHeight + 'px';
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
          value.trim() 
            ? 'bg-white text-black hover:bg-gray-200' 
            : 'bg-[#2a2a2a] text-gray-500 disabled:opacity-50'
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

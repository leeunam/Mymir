import { motion } from 'framer-motion'
import type { ChatPath } from '../../types'
import { Sparkles, TrendingUp, Cpu } from 'lucide-react'

const paths = [
  {
    id: 'news' as ChatPath,
    label: 'Notícias',
    desc: 'Principais do setor (7d)',
    color: 'border-violet-500/40 hover:border-violet-400 text-violet-400 bg-[#141414]/90',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    icon: <Sparkles size={28} />,
  },
  {
    id: 'trends' as ChatPath,
    label: 'Tendências',
    desc: 'Análise de mercado (7d)',
    color: 'border-indigo-500/40 hover:border-indigo-400 text-indigo-400 bg-[#141414]/90',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]',
    icon: <TrendingUp size={28} />,
  },
  {
    id: 'projects' as ChatPath,
    label: 'Projetos',
    desc: 'Destaques recentes (7d)',
    color: 'border-blue-500/40 hover:border-blue-400 text-blue-400 bg-[#141414]/90',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    icon: <Cpu size={28} />,
  },
]

export function PathSelector({ onSelect, onClose }: { onSelect: (p: ChatPath) => void, onClose: () => void }) {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div 
        className="flex flex-col md:flex-row gap-6 items-center justify-center p-4 max-w-5xl" 
        onClick={(e) => e.stopPropagation()}
      >
        {paths.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              delay: i * 0.08,
            }}
            onClick={() => {
              onSelect(p.id)
            }}
            className={`flex flex-col items-center justify-center gap-4 w-52 h-64 md:w-60 md:h-[280px] rounded-3xl border transition-all duration-300 group hover:-translate-y-2 ${p.color} ${p.hoverShadow}`}
          >
            <div className="mb-2 p-5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              {p.icon}
            </div>
            <span className="text-xl font-medium text-gray-100 group-hover:text-white transition-colors tracking-wide">
              {p.label}
            </span>
            <span className="text-sm text-gray-400 text-center px-6 leading-relaxed">
              {p.desc}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
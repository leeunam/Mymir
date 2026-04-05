import { motion } from 'framer-motion';
import { Logo } from '../common/Logo';

interface Props {
  onClick: () => void;
  isLoading: boolean;
}

export function AssistantOrb({ onClick, isLoading }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-5 cursor-pointer select-none"
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        {/* Anéis externos pulsantes */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-violet-500/10"
            style={{ width: 96 + i * 32, height: 96 + i * 32 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{
              duration: 2.5,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Orbe principal */}
        <motion.div
          className="relative rounded-full flex items-center justify-center bg-transparent z-10"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          animate={isLoading ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 1.2, repeat: isLoading ? Infinity : 0 }}
        >
          <Logo size="lg" animated />
        </motion.div>
      </div>

      <motion.p
        className="text-xs text-gray-100 tracking-widest uppercase"
        animate={{ opacity: [0.9, 0.6, 0.9] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {isLoading ? 'processando' : 'Clique no botão acima para começar'}
      </motion.p>
    </div>
  );
}

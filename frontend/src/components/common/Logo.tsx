import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export function Logo({ className = '', size = 'md', animated = false }: LogoProps) {
  const sizes = {
    sm: { outer: 'w-8 h-8', innerRing: 'w-3 h-3', dot: 'w-1 h-1', shadow: '0 0 10px rgba(139, 92, 246, 0.2)' },
    md: { outer: 'w-16 h-16', innerRing: 'w-6 h-6', dot: 'w-1.5 h-1.5', shadow: '0 0 20px rgba(139, 92, 246, 0.25)' },
    lg: { outer: 'w-24 h-24', innerRing: 'w-10 h-10', dot: 'w-2.5 h-2.5', shadow: '0 0 35px rgba(139, 92, 246, 0.3)' },
    xl: { outer: 'w-32 h-32', innerRing: 'w-14 h-14', dot: 'w-3.5 h-3.5', shadow: '0 0 50px rgba(139, 92, 246, 0.35)' },
  };

  const s = sizes[size];

  return (
    <div
      className={`relative rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center shrink-0 ${s.outer} ${className}`}
      style={{ boxShadow: s.shadow }}
    >
      <motion.div
        className={`absolute rounded-full border border-white/20 border-t-white/40 ${s.innerRing}`}
        animate={animated ? { rotate: 360 } : {}}
        transition={animated ? { duration: 6, repeat: Infinity, ease: 'linear' } : {}}
      />
      <div className={`rounded-full bg-white flex shrink-0 ${s.dot}`} style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
    </div>
  );
}

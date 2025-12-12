'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Animated Card Component with glass-morphism and hover effects
 */
export function AnimatedCard({ 
  children, 
  className, 
  delay = 0,
  glassmorphism = false,
  ...props 
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay }}
      className={cn('origin-center', className)}
    >
      <Card 
        className={cn(
          'transition-all duration-300',
          glassmorphism && 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-slate-700/50 shadow-xl',
          !glassmorphism && 'bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700',
          'hover:shadow-2xl'
        )}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
}


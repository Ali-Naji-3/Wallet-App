'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Motion Wrapper for staggered animations
 */
export function MotionWrapper({ 
  children, 
  className,
  stagger = true,
  ...props 
}) {
  return (
    <motion.div
      variants={stagger ? containerVariants : undefined}
      initial="hidden"
      animate="visible"
      className={cn('w-full', className)}
      {...props}
    >
      {stagger ? (
        children
      ) : (
        <motion.div variants={itemVariants}>
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Motion Item for staggered children
 */
export function MotionItem({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}


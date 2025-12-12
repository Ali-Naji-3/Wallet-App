'use client';

import CountUp from 'react-countup';
import { cn } from '@/lib/utils';

/**
 * Animated Counter Component using react-countup
 */
export function AnimatedCounter({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1.5,
  className = '',
  separator = ',',
  ...props
}) {
  // Ensure value is a valid number
  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  return (
    <span className={cn('inline-block', className)} {...props}>
      {prefix}
      <CountUp
        end={numValue}
        decimals={decimals}
        duration={duration}
        separator={separator}
        suffix={suffix}
        enableScrollSpy={false}
      />
    </span>
  );
}


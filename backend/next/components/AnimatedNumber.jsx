'use client';

import { useEffect, useState } from 'react';

/**
 * Animated number counter component
 * Smoothly animates from old value to new value
 */
export function AnimatedNumber({ 
  value, 
  duration = 800,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '0';
    
    if (decimals === 0) {
      return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return val.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <span className={`${className} ${isAnimating ? 'transition-all duration-150' : ''}`}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}


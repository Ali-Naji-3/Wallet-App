'use client';

/**
 * Animated Background Component with moving gradient
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Moving gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"
        style={{ 
          animation: 'gradientMove 20s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        style={{ 
          animation: 'gradientMove 25s ease-in-out infinite',
          animationDelay: '5s',
        }}
      />
      <div 
        className="absolute top-1/2 left-0 w-72 h-72 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse"
        style={{ 
          animation: 'gradientMove 30s ease-in-out infinite',
          animationDelay: '10s',
        }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}


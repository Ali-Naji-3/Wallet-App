// Suppress RSC payload warnings in development
// This is a harmless Next.js warning for client components
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out RSC payload warnings
    if (
      args[0]?.includes?.('Failed to fetch RSC payload') ||
      args[0]?.includes?.('Falling back to browser navigation')
    ) {
      // Suppress this specific warning
      return;
    }
    originalError.apply(console, args);
  };
}





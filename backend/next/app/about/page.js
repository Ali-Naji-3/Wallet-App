/**
 * SSG Example - Static Site Generation
 * This page is pre-built at build time
 * Perfect for static content that doesn't change
 */

export const metadata = {
  title: 'About FXWallet',
  description: 'Learn about FXWallet',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About FXWallet</h1>
        <div className="space-y-4 text-lg">
          <p>
            FXWallet is a modern cryptocurrency and multi-currency wallet application.
          </p>
          <p>
            Built with Next.js, featuring SSG (Static Site Generation) for optimal performance.
          </p>
          <p>
            This page is pre-rendered at build time, making it load instantly!
          </p>
        </div>
      </div>
    </div>
  );
}


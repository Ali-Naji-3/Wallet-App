export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">FXWallet - Next.js Features Demo</h1>
        
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">SSG - Static Site Generation</h2>
            <p className="mb-4">Pre-built pages that load instantly</p>
            <a href="/about" className="text-blue-500 underline">View About Page (SSG)</a>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">ISR - Incremental Static Regeneration</h2>
            <p className="mb-4">Pre-built pages that update automatically</p>
            <a href="/fx-rates" className="text-blue-500 underline">View FX Rates (ISR)</a>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">SSR - Server-Side Rendering</h2>
            <p className="mb-4">Pages generated fresh on each request</p>
            <a href="/dashboard-ssr" className="text-blue-500 underline">View Dashboard (SSR)</a>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">CSR - Client-Side Rendering</h2>
            <p className="mb-4">Data fetched in the browser</p>
            <a href="/dashboard-csr" className="text-blue-500 underline">View Dashboard (CSR)</a>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">SWR - Stale-While-Revalidate</h2>
            <p className="mb-4">Cached data with automatic background updates</p>
            <a href="/dashboard-swr" className="text-blue-500 underline">View Dashboard (SWR)</a>
            <br />
            <a href="/fx-rates-swr" className="text-blue-500 underline">View FX Rates (SWR)</a>
          </div>
        </div>
      </div>
    </div>
  );
}

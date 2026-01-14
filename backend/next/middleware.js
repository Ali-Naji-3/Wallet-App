import { NextResponse } from 'next/server';

export function middleware(request) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }

    // For actual requests, add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }

  // Explicitly allow root path
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};


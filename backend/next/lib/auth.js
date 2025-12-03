import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing env JWT_SECRET');
  }
  return secret;
}

export function parseBearer(authorization) {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function verifyToken(token) {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  // Handle both 'id' and 'sub' (Express uses 'sub', Next.js uses 'id')
  const userId = decoded?.id || decoded?.sub;
  return { id: Number(userId), email: decoded?.email };
}


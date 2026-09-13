import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../db.js';

const ROLE_RANK = { VIEWER: 0, EDITOR: 1, ADMIN: 2 };

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = user;
  } catch {
    // ignore invalid token on optional auth
  }
  next();
}

export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (ROLE_RANK[req.user.role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: `Requires ${minRole} role or higher` });
    }
    next();
  };
}

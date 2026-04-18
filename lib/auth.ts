import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-env';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_COOKIE = 'admin_session';
const TOKEN_EXPIRY_HOURS = 24;

interface AdminToken {
  username: string;
  iat: number;
  exp: number;
}

/**
 * Verify admin credentials
 */
export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Generate JWT token
 */
export function generateToken(expiryHours: number = TOKEN_EXPIRY_HOURS): string {
  const token = jwt.sign(
    { username: ADMIN_USERNAME },
    JWT_SECRET,
    { expiresIn: `${expiryHours}h` }
  );
  return token;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AdminToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY_HOURS * 60 * 60,
    path: '/',
  });
}

/**
 * Get session from cookies
 */
export async function getSession(): Promise<AdminToken | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Clear session
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Generate shareable token link
 */
export function generateTokenLink(baseUrl: string, expiryHours: number = 168): string {
  const token = generateToken(expiryHours);
  return `${baseUrl}/admin/login?token=${token}`;
}

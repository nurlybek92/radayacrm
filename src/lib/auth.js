import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'crm-default-super-secret-key-32-chars-long!';
const KEY = crypto.scryptSync(SECRET, 'salt', 32);
const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';

export function encryptSession(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}.${authTag}.${encrypted}`;
}

export function decryptSession(sessionStr) {
  try {
    if (!sessionStr) return null;
    const [ivHex, authTagHex, encryptedHex] = sessionStr.split('.');
    if (!ivHex || !authTagHex || !encryptedHex) return null;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Session decryption error:', err);
    return null;
  }
}

// Get the current user session (server-side helper)
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('crm_session')?.value;
    return decryptSession(sessionCookie);
  } catch (e) {
    return null;
  }
}

// Set a new session cookie
export async function setSession(data) {
  const sessionCookie = encryptSession(data);
  const cookieStore = await cookies();
  cookieStore.set('crm_session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

// Destroy the session cookie
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set('crm_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

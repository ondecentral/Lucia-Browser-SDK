import { v4 as uuidv4 } from 'uuid';

import Logger from './logger';
import Store from './store';

const SESSION_STORAGE_KEY = 'luci_session';
const logger = new Logger(Store.store);

/**
 * Creates a cryptographic hash of a string using SHA-256
 * @param string The string to hash
 * @returns Promise that resolves to the hash
 */
export async function hash(string: string): Promise<string> {
  try {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (e) {
    logger.log('error', (e as Error).message);
    throw e;
  }
}

/**
 * Retrieves session data from sessionStorage
 * @returns Session data object or null if no session exists
 */
export function getSessionData(): {
  id: string;
  hash: string;
  serverSessionId: string | null;
  timestamp: number;
} | null {
  try {
    const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch (e) {
    logger.log('error', 'Error retrieving session data:', e);
    return null;
  }
}

/**
 * Stores a new session ID in sessionStorage
 * @param serverSessionId Optional server session ID
 * @returns Promise that resolves to the newly created session object
 */
export async function storeSessionID(serverSessionId: string | null = null): Promise<{
  id: string;
  hash: string;
  serverSessionId: string | null;
  timestamp: number;
}> {
  const clientSessionId = generateSessionID();
  // TODO: Consider removing the hash function
  const sessionHash = await hash(clientSessionId);

  const sessionData = {
    id: clientSessionId,
    hash: sessionHash,
    serverSessionId,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Checks if the current session is valid (exists in sessionStorage)
 * @returns Boolean indicating if the session is valid
 */
export function isSessionValid(): boolean {
  return !!getSessionData();
}

/**
 * Generates a new session ID using UUID
 * @returns Unique session ID
 */
export function generateSessionID(): string {
  return uuidv4();
}

/**
 * Retrieves the LuciaID data from localStorage
 * @returns LuciaID string or null if not found
 */
export function getLidData(): string | null {
  return localStorage.getItem('lid');
}

/**
 * Gets the current user ID from localStorage
 * @returns User ID or null if not found
 */
export function getUser(): string | null {
  return localStorage.getItem('luc_uid');
}

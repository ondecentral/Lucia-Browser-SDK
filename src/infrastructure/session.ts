import { v4 as uuidv4 } from 'uuid';

import Logger from './logger';
import Store from './store';

const SESSION_STORAGE_KEY = 'luci_session';
const logger = new Logger(Store.store);

/**
 * Retrieves session data from sessionStorage
 * @returns Session data object or null if no session exists
 */
export function getSessionData(): {
  id: string;
  hash?: string;
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
 * Stores a new client session ID in sessionStorage (before init call)
 * No hash is generated - hash comes from backend after init
 * @returns The newly created session object
 */
export function storeSessionID(): {
  id: string;
  timestamp: number;
} {
  const clientSessionId = generateSessionID();

  const sessionData = {
    id: clientSessionId,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Updates session storage with server-provided session data (after init call)
 * @param serverSession Server session object containing hash and id
 * @returns The updated session object
 */
export function updateSessionFromServer(serverSession: { hash: string; id: string }): {
  id: string;
  hash: string;
  timestamp: number;
} {
  const sessionData = {
    id: serverSession.id,
    hash: serverSession.hash,
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
  const lid = localStorage.getItem('lid');
  // Handle edge case where previous SDK version stored "undefined" as a string
  if (lid === 'undefined' || lid === 'null') {
    localStorage.removeItem('lid');
    return null;
  }
  return lid;
}

/**
 * Gets the current user ID from localStorage
 * @returns User ID or null if not found
 */
export function getUser(): string | null {
  const uid = localStorage.getItem('luc_uid');
  // Handle edge case where previous SDK version stored "undefined" as a string
  if (uid === 'undefined' || uid === 'null') {
    localStorage.removeItem('luc_uid');
    return null;
  }
  return uid;
}

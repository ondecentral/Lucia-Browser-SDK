import { v4 as uuidv4 } from 'uuid';

import Logger from '../../utils/logger';
import {
  isSessionValid,
  getSessionData,
  getLidData,
  storeSessionID,
  updateSessionFromServer,
  generateSessionID,
  getUser,
} from '../../utils/session';

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock the Logger class
jest.mock('../../utils/logger');

describe('Session Manager', () => {
  // Mock Date.now() for stable tests
  const mockCurrentTimestamp = 1626847200000; // 2021-07-21

  let originalSessionStorage: Storage;
  let mockSessionStorage: { [key: string]: string };
  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };
  let logMock: jest.SpyInstance;
  let originalTextEncoder: any;
  let mockTextEncoderInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the log method
    logMock = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    // Ensure UUID mock is returning expected value
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

    // Mock Date.now
    jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentTimestamp);

    // Setup mock sessionStorage
    mockSessionStorage = {};
    originalSessionStorage = global.sessionStorage;

    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: jest.fn().mockImplementation((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn().mockImplementation((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn().mockImplementation((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn().mockImplementation(() => {
          mockSessionStorage = {};
        }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });

    // Setup mock localStorage
    mockLocalStorage = {};
    originalLocalStorage = global.localStorage;

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn().mockImplementation((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn().mockImplementation((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn().mockImplementation((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn().mockImplementation(() => {
          mockLocalStorage = {};
        }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });

    // Save original TextEncoder
    originalTextEncoder = global.TextEncoder;

    // Create a mock TextEncoder instance
    mockTextEncoderInstance = {
      encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    };

    // Mock TextEncoder constructor
    global.TextEncoder = jest.fn().mockImplementation(() => mockTextEncoderInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.sessionStorage = originalSessionStorage;
    global.localStorage = originalLocalStorage;
    global.TextEncoder = originalTextEncoder;
  });

  describe('isSessionValid', () => {
    it('should return false when no session data exists', () => {
      expect(isSessionValid()).toBe(false);
    });

    it('should return true when session is valid', () => {
      const validSession = {
        id: 'client123',
        timestamp: mockCurrentTimestamp,
      };

      mockSessionStorage['luci_session'] = JSON.stringify(validSession);

      expect(isSessionValid()).toBe(true);
    });

    it('should return true when session has hash from backend', () => {
      const validSession = {
        id: 'client123',
        hash: 'backend-hash-123',
        timestamp: mockCurrentTimestamp,
      };

      mockSessionStorage['luci_session'] = JSON.stringify(validSession);

      expect(isSessionValid()).toBe(true);
    });
  });

  describe('getSessionData', () => {
    it('should return null when no session data exists', () => {
      expect(getSessionData()).toBeNull();
    });

    it('should return session data when it exists without hash', () => {
      const sessionData = {
        id: 'client123',
        timestamp: mockCurrentTimestamp,
      };

      mockSessionStorage['luci_session'] = JSON.stringify(sessionData);

      expect(getSessionData()).toEqual(sessionData);
    });

    it('should return session data when it exists with hash from backend', () => {
      const sessionData = {
        id: 'client123',
        hash: 'backend-hash-123',
        timestamp: mockCurrentTimestamp,
      };

      mockSessionStorage['luci_session'] = JSON.stringify(sessionData);

      expect(getSessionData()).toEqual(sessionData);
    });

    it('should handle JSON parsing errors gracefully', () => {
      // Set invalid JSON
      mockSessionStorage['luci_session'] = '{invalid-json';

      expect(getSessionData()).toBeNull();

      // Verify logger.log was called with error
      expect(logMock).toHaveBeenCalledWith('error', 'Error retrieving session data:', expect.any(Error));
    });
  });

  describe('getLidData', () => {
    it('should return null when no lid exists', () => {
      expect(getLidData()).toBeNull();
    });

    it('should return lid when it exists', () => {
      const lidValue = 'test-lid-123';
      mockLocalStorage['lid'] = lidValue;

      expect(getLidData()).toBe(lidValue);
    });
  });

  describe('storeSessionID', () => {
    it('should store a new session with generated client ID (no hash)', () => {
      const result = storeSessionID();

      expect(result).toEqual({
        id: 'mock-uuid',
        timestamp: mockCurrentTimestamp,
      });

      // Verify sessionStorage was updated
      expect(mockSessionStorage['luci_session']).toBeTruthy();
      expect(JSON.parse(mockSessionStorage['luci_session'])).toEqual({
        id: 'mock-uuid',
        timestamp: mockCurrentTimestamp,
      });
    });

    it('should not generate a hash on the client side', () => {
      const result = storeSessionID();

      // Ensure no hash property exists
      expect('hash' in result).toBe(false);

      const storedSession = JSON.parse(mockSessionStorage['luci_session']);
      expect('hash' in storedSession).toBe(false);
    });
  });

  describe('updateSessionFromServer', () => {
    it('should update session storage with server-provided data', () => {
      const serverSession = {
        hash: '99442d0d97d565dde60f2d3b196309622b55a3c5220bd89ed37eb1ee6bdeca4d',
        id: '7CC64140-7F41-4F66-B31C-9219FCBE20C1',
      };

      const result = updateSessionFromServer(serverSession);

      expect(result).toEqual({
        id: serverSession.id,
        hash: serverSession.hash,
        timestamp: mockCurrentTimestamp,
      });

      // Verify sessionStorage was updated
      expect(mockSessionStorage['luci_session']).toBeTruthy();
      const storedSession = JSON.parse(mockSessionStorage['luci_session']);
      expect(storedSession).toEqual({
        id: serverSession.id,
        hash: serverSession.hash,
        timestamp: mockCurrentTimestamp,
      });
    });

    it('should overwrite existing session data', () => {
      // Set initial session
      const initialSession = {
        id: 'old-client-id',
        hash: 'old-hash',
        timestamp: mockCurrentTimestamp - 1000,
      };
      mockSessionStorage['luci_session'] = JSON.stringify(initialSession);

      // Update with server session
      const serverSession = {
        hash: 'new-server-hash',
        id: 'new-server-id',
      };

      const result = updateSessionFromServer(serverSession);

      expect(result.id).toBe(serverSession.id);
      expect(result.hash).toBe(serverSession.hash);
      expect(result.timestamp).toBe(mockCurrentTimestamp);

      // Verify old session was replaced
      const storedSession = JSON.parse(mockSessionStorage['luci_session']);
      expect(storedSession.id).not.toBe(initialSession.id);
      expect(storedSession.hash).not.toBe(initialSession.hash);
    });
  });

  describe('generateSessionID', () => {
    it('should generate a UUID', () => {
      expect(generateSessionID()).toBe('mock-uuid');
    });
  });

  describe('getUser', () => {
    it('should return null when no user exists', () => {
      expect(getUser()).toBeNull();
    });

    it('should return user when it exists', () => {
      const userValue = 'user@example.com';
      mockLocalStorage['luc_uid'] = userValue;

      expect(getUser()).toBe(userValue);
    });
  });
});

/* eslint-disable dot-notation, eslint-comments/disable-enable-pair */
import { v4 as uuidv4 } from 'uuid';

import Logger from '../../utils/logger';
import {
  isSessionExpired,
  isSessionValid,
  getSessionData,
  getLidData,
  storeSessionID,
  incrementSessionExpiry,
  getExpiry,
  generateSessionID,
  getUser,
  hash,
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
  const mockExpiredTimestamp = mockCurrentTimestamp - 31 * 60 * 1000; // 31 minutes ago (beyond expiry)
  const mockValidTimestamp = mockCurrentTimestamp - 15 * 60 * 1000; // 15 minutes ago (within expiry)

  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };
  let logMock: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the log method
    logMock = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    // Ensure UUID mock is returning expected value
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

    // Mock Date.now
    jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentTimestamp);

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

    // Mock crypto.subtle.digest
    Object.defineProperty(global.crypto, 'subtle', {
      value: {
        digest: jest.fn().mockImplementation(() => {
          // Mock a SHA-256 hash result (32 bytes)
          const buffer = new ArrayBuffer(32);
          const view = new Uint8Array(buffer);
          // Fill with predictable values
          for (let i = 0; i < 32; i += 1) {
            view[i] = i;
          }
          return Promise.resolve(buffer);
        }),
      },
      configurable: true,
    });

    // Mock TextEncoder
    global.TextEncoder = jest.fn().mockImplementation(() => ({
      encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.localStorage = originalLocalStorage;
  });

  describe('hash', () => {
    it('should return a hexadecimal string hash', async () => {
      const result = await hash('test-string');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA-256 hash is 64 hex characters

      // The hash should be consistent with our mock implementation
      expect(result).toBe('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
    });

    it('should handle different input strings', async () => {
      // Our mock always returns the same hash, but we can verify the TextEncoder was called
      const input1 = 'test-string-1';
      const input2 = 'test-string-2';

      await hash(input1);
      await hash(input2);

      // Verify TextEncoder was called twice
      expect(TextEncoder).toHaveBeenCalledTimes(2);

      // Verify crypto.subtle.digest was called twice
      expect(crypto.subtle.digest).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      // Mock TextEncoder to throw an error
      const originalTextEncoder = global.TextEncoder;
      global.TextEncoder = jest.fn().mockImplementation(() => {
        throw new Error('Mock encoding error');
      });

      // Test that hash properly rejects when TextEncoder throws
      await expect(hash('test-string')).rejects.toThrow('Mock encoding error');

      // Verify logger.log was called with error
      expect(logMock).toHaveBeenCalledWith('error', expect.any(String));

      // Restore original implementations
      global.TextEncoder = originalTextEncoder;
    });
  });

  describe('isSessionExpired', () => {
    it('should return true for timestamps older than 30 minutes', () => {
      expect(isSessionExpired(mockExpiredTimestamp)).toBe(true);
    });

    it('should return false for timestamps within 30 minutes', () => {
      expect(isSessionExpired(mockValidTimestamp)).toBe(false);
    });
  });

  describe('isSessionValid', () => {
    it('should return false when no session data exists', () => {
      expect(isSessionValid()).toBe(false);
    });

    it('should return false when session has expired', () => {
      const expiredSession = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockExpiredTimestamp,
      };

      mockLocalStorage['lucia_session'] = JSON.stringify(expiredSession);

      expect(isSessionValid()).toBe(false);
    });

    it('should return true when session is valid', () => {
      const validSession = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockValidTimestamp,
      };

      mockLocalStorage['lucia_session'] = JSON.stringify(validSession);

      expect(isSessionValid()).toBe(true);
    });
  });

  describe('getSessionData', () => {
    it('should return null when no session data exists', () => {
      expect(getSessionData()).toBeNull();
    });

    it('should return session data when it exists', () => {
      const sessionData = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockCurrentTimestamp,
      };

      mockLocalStorage['lucia_session'] = JSON.stringify(sessionData);

      expect(getSessionData()).toEqual(sessionData);
    });

    it('should handle JSON parsing errors gracefully', () => {
      // Set invalid JSON
      mockLocalStorage['lucia_session'] = '{invalid-json';

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
    it('should store a new session with generated client ID', () => {
      const result = storeSessionID();

      expect(result).toEqual({
        clientSessionId: 'mock-uuid',
        serverSessionId: null,
        timestamp: mockCurrentTimestamp,
      });

      // Verify localStorage was updated
      expect(mockLocalStorage['lucia_session']).toBeTruthy();
      expect(JSON.parse(mockLocalStorage['lucia_session'])).toEqual({
        clientSessionId: 'mock-uuid',
        serverSessionId: null,
        timestamp: mockCurrentTimestamp,
      });
    });

    it('should store a new session with provided server ID', () => {
      const serverSessionId = 'server-provided-id';
      const result = storeSessionID(serverSessionId);

      expect(result).toEqual({
        clientSessionId: 'mock-uuid',
        serverSessionId,
        timestamp: mockCurrentTimestamp,
      });

      // Verify localStorage was updated
      expect(JSON.parse(mockLocalStorage['lucia_session'])).toEqual({
        clientSessionId: 'mock-uuid',
        serverSessionId,
        timestamp: mockCurrentTimestamp,
      });
    });
  });

  describe('incrementSessionExpiry', () => {
    it('should return null when no session exists', () => {
      expect(incrementSessionExpiry()).toBeNull();
    });

    it('should update timestamp of existing session', () => {
      // Setup existing session with old timestamp
      const oldSession = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockValidTimestamp,
      };

      mockLocalStorage['lucia_session'] = JSON.stringify(oldSession);

      const result = incrementSessionExpiry();

      // Should have updated timestamp but kept other data
      expect(result).toEqual({
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockCurrentTimestamp,
      });

      // Verify localStorage was updated
      expect(JSON.parse(mockLocalStorage['lucia_session'])).toEqual({
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockCurrentTimestamp,
      });
    });
  });

  describe('getExpiry', () => {
    it('should return null when no session exists', () => {
      expect(getExpiry()).toBeNull();
    });

    it('should return timestamp of existing session', () => {
      const sessionData = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: mockCurrentTimestamp,
      };

      mockLocalStorage['lucia_session'] = JSON.stringify(sessionData);

      expect(getExpiry()).toBe(mockCurrentTimestamp);
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
      mockLocalStorage['user'] = userValue;

      expect(getUser()).toBe(userValue);
    });
  });
});

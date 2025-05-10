/* eslint-disable dot-notation, eslint-comments/disable-enable-pair */
import { v4 as uuidv4 } from 'uuid';

import Logger from '../../utils/logger';
import {
  isSessionValid,
  getSessionData,
  getLidData,
  storeSessionID,
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

  describe('hash', () => {
    let subtleCryptoMock: any;
    let originalSubtleCrypto: any;

    beforeEach(() => {
      // Save original subtle crypto
      originalSubtleCrypto = crypto.subtle;

      // Create a predictable mock buffer for the digest result
      const buffer = new ArrayBuffer(32);
      const view = new Uint8Array(buffer);
      // Fill with predictable values
      for (let i = 0; i < 32; i += 1) {
        view[i] = i;
      }

      // Create a mock for crypto.subtle
      subtleCryptoMock = {
        digest: jest.fn().mockResolvedValue(buffer),
      };

      // Replace crypto.subtle with our mock
      Object.defineProperty(crypto, 'subtle', {
        value: subtleCryptoMock,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original crypto.subtle
      Object.defineProperty(crypto, 'subtle', {
        value: originalSubtleCrypto,
        configurable: true,
      });
    });

    it('should return a hexadecimal string hash', async () => {
      const result = await hash('test-string');

      // Verify TextEncoder was used
      expect(global.TextEncoder).toHaveBeenCalled();
      expect(mockTextEncoderInstance.encode).toHaveBeenCalledWith('test-string');

      // Verify crypto.subtle.digest was called with the encoded data
      expect(subtleCryptoMock.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA-256 hash is 64 hex characters

      // The hash should be consistent with our mock implementation
      expect(result).toBe('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
    });

    it('should handle different input strings', async () => {
      const input1 = 'test-string-1';
      const input2 = 'test-string-2';

      await hash(input1);
      await hash(input2);

      // Verify TextEncoder.encode was called for each input
      expect(mockTextEncoderInstance.encode).toHaveBeenCalledWith(input1);
      expect(mockTextEncoderInstance.encode).toHaveBeenCalledWith(input2);

      // Verify crypto.subtle.digest was called twice
      expect(subtleCryptoMock.digest).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      // Setup TextEncoder to throw an error
      mockTextEncoderInstance.encode.mockImplementationOnce(() => {
        throw new Error('Mock encoding error');
      });

      // Test that hash properly rejects when TextEncoder throws
      await expect(hash('test-string')).rejects.toThrow('Mock encoding error');

      // Verify logger.log was called with error
      expect(logMock).toHaveBeenCalledWith('error', 'Mock encoding error');
    });

    it('should handle crypto.subtle.digest rejections', async () => {
      // Setup crypto.subtle.digest to reject
      const digestError = new Error('Digest error');
      subtleCryptoMock.digest.mockRejectedValueOnce(digestError);

      // Test that hash properly rejects when digest rejects
      await expect(hash('test-string')).rejects.toThrow('Digest error');

      // Verify that the error was logged
      expect(logMock).toHaveBeenCalledWith('error', 'Digest error');
    });
  });

  describe('isSessionValid', () => {
    it('should return false when no session data exists', () => {
      expect(isSessionValid()).toBe(false);
    });

    it('should return true when session is valid', () => {
      const validSession = {
        id: 'client123',
        hash: 'session-hash-123',
        serverSessionId: 'server456',
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

    it('should return session data when it exists', () => {
      const sessionData = {
        id: 'client123',
        hash: 'session-hash-123',
        serverSessionId: 'server456',
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
    beforeEach(() => {
      // Mock the hash function to return a predictable value
      jest.spyOn(global.crypto.subtle, 'digest').mockImplementation(() => {
        const buffer = new ArrayBuffer(32);
        const view = new Uint8Array(buffer);
        // Fill with predictable values
        for (let i = 0; i < 32; i += 1) {
          view[i] = i;
        }
        return Promise.resolve(buffer);
      });
    });

    it('should store a new session with generated client ID', async () => {
      const result = await storeSessionID();

      const expectedHash = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

      expect(result).toEqual({
        id: 'mock-uuid',
        hash: expectedHash,
        serverSessionId: null,
        timestamp: mockCurrentTimestamp,
      });

      // Verify sessionStorage was updated
      expect(mockSessionStorage['luci_session']).toBeTruthy();
      expect(JSON.parse(mockSessionStorage['luci_session'])).toEqual({
        id: 'mock-uuid',
        hash: expectedHash,
        serverSessionId: null,
        timestamp: mockCurrentTimestamp,
      });
    });

    it('should store a new session with provided server ID', async () => {
      const serverSessionId = 'server-provided-id';
      const result = await storeSessionID(serverSessionId);

      const expectedHash = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

      expect(result).toEqual({
        id: 'mock-uuid',
        hash: expectedHash,
        serverSessionId,
        timestamp: mockCurrentTimestamp,
      });

      // Verify sessionStorage was updated
      expect(JSON.parse(mockSessionStorage['luci_session'])).toEqual({
        id: 'mock-uuid',
        hash: expectedHash,
        serverSessionId,
        timestamp: mockCurrentTimestamp,
      });
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

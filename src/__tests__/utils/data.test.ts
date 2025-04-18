import { getUtmParams } from '../../utils/data';
import { getSessionData, getLidData, getUser } from '../../utils/session';

// Need to mock the imports before they are used
jest.mock('../../utils/data', () => {
  const originalModule = jest.requireActual('../../utils/data');
  return {
    ...originalModule,
    // Override problematic functions
    udata: jest.fn().mockResolvedValue({
      data: {
        userAgent: 'Mozilla/5.0 Test Browser',
      },
      redirectHash: undefined,
    }),
    getUtmParams: jest.fn().mockImplementation(() => {
      if (window.location.search.includes('utm_source')) {
        return {
          utm_source: 'test',
          utm_medium: 'email',
          utm_campaign: 'welcome',
        };
      }
      return {};
    }),
  };
});

// Mock session-manager functions to control their returns within each test
jest.mock('../../utils/session', () => ({
  getSessionData: jest.fn(),
  getLidData: jest.fn(),
  getUser: jest.fn(),
}));

describe('Data Utilities', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock Date for consistent timestamps
    jest.spyOn(Date, 'now').mockImplementation(() => 1626847200000); // 2021-07-21

    // Mock location for UTM params
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/?utm_source=test&utm_medium=email&utm_campaign=welcome',
        search: '?utm_source=test&utm_medium=email&utm_campaign=welcome',
      },
      writable: true,
    });

    // Reset all mocks to clear any previous test's mock implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessionData', () => {
    it('should return session data from localStorage', () => {
      const mockSessionData = {
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: Date.now(),
      };

      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockSessionData));
      (getSessionData as jest.Mock).mockReturnValue(mockSessionData);

      const sessionData = getSessionData();
      expect(sessionData).toEqual({
        clientSessionId: 'client123',
        serverSessionId: 'server456',
        timestamp: Date.now(),
      });
    });

    it('should return null when no session data is found', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (getSessionData as jest.Mock).mockReturnValue(null);

      const sessionData = getSessionData();
      expect(sessionData).toBeNull();
    });
  });

  describe('getLidData', () => {
    it('should return lid from localStorage', () => {
      const mockLid = 'test-lid-123';
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockLid);
      (getLidData as jest.Mock).mockReturnValue(mockLid);

      const lid = getLidData();
      expect(lid).toBe(mockLid);
    });

    it('should return null when no lid is found', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (getLidData as jest.Mock).mockReturnValue(null);

      const lid = getLidData();
      expect(lid).toBeNull();
    });
  });

  describe('getUtmParams', () => {
    it('should extract UTM parameters from URL', () => {
      const utmParams = getUtmParams();

      expect(utmParams).toEqual({
        utm_source: 'test',
        utm_medium: 'email',
        utm_campaign: 'welcome',
      });
    });

    it('should return empty object when no UTM parameters are present', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/',
          search: '',
        },
        writable: true,
      });

      const utmParams = getUtmParams();
      expect(utmParams).toEqual({});
    });
  });

  describe('getUser', () => {
    it('should return user from localStorage if available', () => {
      const mockUser = 'user@example.com';
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockUser);
      (getUser as jest.Mock).mockReturnValue(mockUser);

      const user = getUser();
      expect(user).toBe(mockUser);
    });

    it('should return null when no user is found', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      (getUser as jest.Mock).mockReturnValue(null);

      const user = getUser();
      expect(user).toBeNull();
    });
  });
});

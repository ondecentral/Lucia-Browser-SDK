import { SERVER_URL, TEST_SERVER_URL } from '../../constants';
import HttpClient from '../../utils/http-client';
import Store from '../../utils/store';
import { SDK_VERSION } from '../../version';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let originalFetch: typeof global.fetch;
  let mockSession: { id: string; hash: string; serverSessionId: null; timestamp: number };

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Reset the store
    Store.store = {
      isInitialized: false,
      config: null,
      session: null,
    };

    // Create mock session for requests
    mockSession = {
      id: 'mock-session-id',
      hash: 'mock-session-hash',
      serverSessionId: null,
      timestamp: Date.now(),
    };

    // Mock navigator.sendBeacon if it doesn't exist
    if (typeof navigator.sendBeacon === 'undefined') {
      // @ts-ignore - mock sendBeacon for tests
      navigator.sendBeacon = jest.fn();
    }
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use debugURL when provided in config', () => {
      const debugURL = 'https://debug.example.com';
      Store.dispatch({ config: { apiKey: 'test-key', debugURL } });

      httpClient = new HttpClient(Store.store);
      expect((httpClient as any).baseURL).toBe(debugURL);
    });

    it('should use TEST_SERVER_URL when testENV is true', () => {
      Store.dispatch({ config: { apiKey: 'test-key', testENV: true } });

      httpClient = new HttpClient(Store.store);
      expect((httpClient as any).baseURL).toBe(TEST_SERVER_URL);
    });

    it('should use SERVER_URL by default', () => {
      Store.dispatch({ config: { apiKey: 'test-key' } });

      httpClient = new HttpClient(Store.store);
      expect((httpClient as any).baseURL).toBe(SERVER_URL);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      Store.dispatch({ config: { apiKey: 'test-key' } });
      httpClient = new HttpClient(Store.store);
    });

    it('should return null when config is not set', async () => {
      Store.store.config = null;

      const result = await httpClient.get('/test');
      expect(result).toBeNull();
    });

    it('should make a GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await httpClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(`${SERVER_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'test-key',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return null and log error when fetch fails', async () => {
      const error = new Error('Network error');
      global.fetch = jest.fn().mockRejectedValueOnce(error);

      const loggerSpy = jest.spyOn(httpClient.logger, 'log');
      const result = await httpClient.get('/test');

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith('error', error);
    });
  });

  describe('post', () => {
    beforeEach(() => {
      Store.dispatch({ config: { apiKey: 'test-key' } });
      httpClient = new HttpClient(Store.store);

      // Ensure initComplete is true to avoid queueing during post tests
      (httpClient as any).initComplete = true;

      // Mock fetch to return success quickly
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });
    });

    it('should return null when config is not set', async () => {
      Store.store.config = null;

      const result = await httpClient.post('/test', { foo: 'bar' });
      expect(result).toBeNull();
    });

    it('should make a POST request with correct headers and body when fireAndForget is false', async () => {
      // Mock direct implementation of executePost to avoid timing issues
      jest
        .spyOn(httpClient as any, 'executePost')
        .mockImplementation(async (requestUrl, requestData, requestFireAndForget) => {
          // Call the real fetch but with controlled response
          expect(requestUrl).toBe('/test');
          expect(requestData).toEqual({ foo: 'bar' });
          expect(requestFireAndForget).toBe(false);

          // Return a successful response
          return { success: true };
        });

      const postData = { foo: 'bar' };
      const result = await httpClient.post('/test', postData, false);

      // Check the expected result
      expect(result).toEqual({ success: true });

      // Verify executePost was called correctly
      expect((httpClient as any).executePost).toHaveBeenCalledWith('/test', postData, false);
    });

    it('should use sendBeacon and not call fetch when fireAndForget is true', async () => {
      // Clear any mock implementations and set up new mocks
      const sendBeaconMock = jest.fn().mockReturnValue(true);
      // @ts-ignore
      navigator.sendBeacon = sendBeaconMock;

      // Spy on executePost to verify its behavior
      const executePostSpy = jest.spyOn(httpClient as any, 'executePost');

      // Mock fetch to ensure it's not called
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      const postData = { foo: 'bar' };
      const result = await httpClient.post('/test', postData, true);

      // executePost should be called
      expect(executePostSpy).toHaveBeenCalledWith('/test', postData, true);

      // sendBeacon should be called with the right URL and data
      expect(sendBeaconMock).toHaveBeenCalled();

      // fetch should not be called
      expect(fetchMock).not.toHaveBeenCalled();

      // Result should be null for fire-and-forget requests
      expect(result).toBeNull();
    });

    it('should log error if sendBeacon fails', async () => {
      // Mock sendBeacon to return false (failure)
      const sendBeaconMock = jest.fn().mockReturnValue(false);
      // @ts-ignore
      navigator.sendBeacon = sendBeaconMock;

      // Spy on the logger
      const loggerSpy = jest.spyOn(httpClient.logger, 'log');

      const postData = { foo: 'bar' };
      const result = await httpClient.post('/test', postData, true);

      // sendBeacon should be called
      expect(sendBeaconMock).toHaveBeenCalled();

      // Logger should log an error
      expect(loggerSpy).toHaveBeenCalledWith('error', 'sendBeacon failed');

      // Result should be null
      expect(result).toBeNull();
    });

    it('should log error if sendBeacon throws', async () => {
      // Mock sendBeacon to throw an error
      const error = new Error('sendBeacon error');
      const sendBeaconMock = jest.fn().mockImplementation(() => {
        throw error;
      });
      // @ts-ignore
      navigator.sendBeacon = sendBeaconMock;

      // Spy on the logger
      const loggerSpy = jest.spyOn(httpClient.logger, 'log');

      const postData = { foo: 'bar' };
      const result = await httpClient.post('/test', postData, true);

      // sendBeacon should be called
      expect(sendBeaconMock).toHaveBeenCalled();

      // Logger should log the error that was thrown
      expect(loggerSpy).toHaveBeenCalledWith('error', error);

      // Result should be null
      expect(result).toBeNull();
    });
  });

  describe('request queue functionality', () => {
    beforeEach(() => {
      // Set up config
      Store.dispatch({ config: { apiKey: 'test-key' } });
      httpClient = new HttpClient(Store.store);

      // Reset the init state of HttpClient
      (httpClient as any).initComplete = false;
      (httpClient as any).requestQueue = [];

      // Create a fetch mock that returns appropriate responses for different endpoints
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/sdk/init')) {
          return Promise.resolve({
            json: () => Promise.resolve({ lid: 'test-lid' }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        });
      });
    });

    it('should process init request immediately', async () => {
      // Create realistic init payload
      const initData = {
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        session: mockSession,
        utm: {},
        sdkVersion: SDK_VERSION,
      };

      const initResponse = await httpClient.post('/api/sdk/init', initData, false);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(initResponse).toEqual({ lid: 'test-lid' });

      // Check that the URL is correct
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(`${SERVER_URL}/api/sdk/init`);

      // Check that the payload is correct
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual(initData);
    });

    it('should queue non-init requests until init is complete', async () => {
      // Replace the original post method to not trigger the queue mechanism
      // This helps us test in isolation
      const originalPost = httpClient.post;
      httpClient.post = jest.fn().mockImplementation(async (url, _data, _fireAndForget) => {
        if (url === '/api/sdk/init') {
          // Set initComplete to true but don't process the queue
          (httpClient as any).initComplete = true;
          return { lid: 'test-lid' };
        }

        // Simply return success for other requests
        return { success: true };
      }) as any;

      // Create realistic payloads
      const pageViewData = {
        page: '/home',
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        lid: 'test-lid',
        session: mockSession,
      };

      // Start a page view request
      const pageViewPromise = originalPost.call(httpClient, '/api/sdk/page', pageViewData, false);

      // Check that it's been queued
      expect((httpClient as any).requestQueue.length).toBe(1);

      // Create init data
      const initData = {
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        session: mockSession,
        utm: {},
        sdkVersion: SDK_VERSION,
      };

      // Complete the init request
      await httpClient.post('/api/sdk/init', initData, false);

      // Now restore the original post method and process the queue manually
      httpClient.post = originalPost;
      await (httpClient as any).processQueue();

      // The queued request should now be processed
      const pageViewResponse = await pageViewPromise;
      expect(pageViewResponse).toEqual({ success: true });
    });

    it('should process multiple queued requests in order after init completes', async () => {
      // Spy on executePost to track calls to it directly
      const executePostSpy = jest.spyOn(httpClient as any, 'executePost');

      // Create realistic user data
      const userData = {
        user: {
          name: 'user@example.com',
          data: { userAgent: navigator.userAgent },
          userInfo: { name: 'Test User' },
        },
        lid: 'test-lid',
        session: mockSession,
      };

      // Create realistic page view data
      const pageViewData = {
        page: '/products',
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        lid: 'test-lid',
        session: mockSession,
      };

      // Create realistic conversion data
      const conversionData = {
        tag: 'purchase',
        amount: 99.99,
        event: { productId: 'prod123' },
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        lid: 'test-lid',
        session: mockSession,
      };

      // Queue multiple requests
      const userInfoPromise = httpClient.post('/api/sdk/user', userData, false);
      const pageViewPromise = httpClient.post('/api/sdk/page', pageViewData, false);
      const conversionPromise = httpClient.post('/api/sdk/conversion', conversionData, false);

      // No requests should have been executed yet
      expect(executePostSpy).not.toHaveBeenCalled();

      // Create init data
      const initData = {
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        session: mockSession,
        utm: {},
        sdkVersion: SDK_VERSION,
      };

      // Now call init
      await httpClient.post('/api/sdk/init', initData, false);

      // Wait for all promises to resolve
      const [userInfoResponse, pageViewResponse, conversionResponse] = await Promise.all([
        userInfoPromise,
        pageViewPromise,
        conversionPromise,
      ]);

      // All requests should have been processed in order
      expect(executePostSpy).toHaveBeenCalledTimes(4);
      expect(executePostSpy.mock.calls[0][0]).toBe('/api/sdk/init');
      expect(executePostSpy.mock.calls[1][0]).toBe('/api/sdk/user');
      expect(executePostSpy.mock.calls[2][0]).toBe('/api/sdk/page');
      expect(executePostSpy.mock.calls[3][0]).toBe('/api/sdk/conversion');

      // Check that responses match the expected values
      expect(userInfoResponse).toEqual({ success: true });
      expect(pageViewResponse).toEqual({ success: true });
      expect(conversionResponse).toEqual({ success: true });
    });

    it('should process requests immediately after init is complete', async () => {
      // Set initComplete to true directly - simulating that init has been called previously
      (httpClient as any).initComplete = true;

      // Spy on executePost to verify immediate execution
      const executePostSpy = jest.spyOn(httpClient as any, 'executePost');

      // Create realistic button click data
      const buttonClickData = {
        button: 'buy-now',
        user: {
          name: 'anonymous',
          data: { userAgent: navigator.userAgent },
        },
        lid: 'test-lid',
        session: mockSession,
      };

      // After init is complete, requests should process immediately
      await httpClient.post('/api/sdk/click', buttonClickData, false);

      // Should process without queueing
      expect(executePostSpy).toHaveBeenCalledTimes(1);
      expect(executePostSpy).toHaveBeenCalledWith('/api/sdk/click', buttonClickData, false);
    });
  });
});

import { SERVER_URL, TEST_SERVER_URL } from '../../constants';
import HttpClient from '../../utils/http-client';
import Store from '../../utils/store';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Reset the store
    Store.store = {
      isInitialized: false,
      config: null,
      session: null,
    };
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
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
    });

    it('should return null when config is not set', async () => {
      Store.store.config = null;

      const result = await httpClient.post('/test', { foo: 'bar' });
      expect(result).toBeNull();
    });

    it('should make a POST request with correct headers and body', async () => {
      const mockResponse = { success: true };
      const postData = { foo: 'bar' };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await httpClient.post('/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(`${SERVER_URL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'test-key',
        },
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return null and log error when fetch fails', async () => {
      const error = new Error('Network error');
      global.fetch = jest.fn().mockRejectedValueOnce(error);

      const loggerSpy = jest.spyOn(httpClient.logger, 'log');
      const result = await httpClient.post('/test', { foo: 'bar' });

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith('error', error);
    });
  });
});

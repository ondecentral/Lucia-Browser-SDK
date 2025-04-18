import BaseClass from '../../base';
import HttpClient from '../../utils/http-client';
import Logger from '../../utils/logger';
import Store from '../../utils/store';

// Mock the dependencies
jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

describe('BaseClass', () => {
  let baseInstance: BaseClass;
  const mockConfig = { apiKey: 'test-key', testENV: false };

  beforeEach(() => {
    // Reset Store before each test
    Store.store = {
      isInitialized: false,
      config: null,
      session: null,
    };

    // Clear and reset mocks
    jest.clearAllMocks();

    // Create a spy on Store.dispatch
    jest.spyOn(Store, 'dispatch');
  });

  it('should store the config in the Store', () => {
    baseInstance = new BaseClass(mockConfig);

    expect(Store.dispatch).toHaveBeenCalledWith({ config: mockConfig });
    expect(Store.store.config).toEqual(mockConfig);
  });

  it('should initialize with HttpClient', () => {
    baseInstance = new BaseClass(mockConfig);

    expect(HttpClient).toHaveBeenCalledWith(Store.store);
    expect(baseInstance.httpClient).toBeDefined();
  });

  it('should initialize with Logger', () => {
    baseInstance = new BaseClass(mockConfig);

    expect(Logger).toHaveBeenCalledWith(Store.store);
    expect(baseInstance.logger).toBeDefined();
  });

  it('should provide access to Store.store', () => {
    baseInstance = new BaseClass(mockConfig);

    expect(baseInstance.store).toBe(Store.store);
  });

  it('should provide access to Store.dispatch', () => {
    baseInstance = new BaseClass(mockConfig);

    expect(baseInstance.dispatch).toBe(Store.dispatch);
  });
});

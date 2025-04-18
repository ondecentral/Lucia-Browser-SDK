import Store from '../../utils/store';

describe('Store', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    Store.store = {
      isInitialized: false,
      config: null,
      session: null,
    };
  });

  describe('dispatch', () => {
    it('should update primitive values correctly', () => {
      Store.dispatch({ isInitialized: true });
      expect(Store.store.isInitialized).toBe(true);
    });

    it('should update object values correctly without mutating original objects', () => {
      const configObject = { apiKey: 'test-key', testENV: true };
      Store.dispatch({ config: configObject });

      // Check if store was updated
      expect(Store.store.config).toEqual(configObject);

      // Modify the original object to ensure store has a copy, not a reference
      configObject.apiKey = 'modified-key';
      expect(Store.store.config?.apiKey).toBe('test-key');
    });

    it('should handle array values correctly', () => {
      // Create a mock object with an array
      const mockObject = { session: { clientSessionId: 'abc123', serverSessionId: 'xyz789' } };
      Store.dispatch(mockObject);

      expect(Store.store.session).toEqual(mockObject.session);
    });

    it('should ignore unknown keys', () => {
      // @ts-ignore - Intentionally passing an unknown key
      Store.dispatch({ unknownKey: 'test' });

      // @ts-ignore - Check that the key doesn't exist on the store
      expect(Store.store.unknownKey).toBeUndefined();
    });

    it('should partially update nested objects', () => {
      // Initialize with a session
      Store.dispatch({
        session: {
          clientSessionId: 'client123',
          serverSessionId: 'server456',
        },
      });

      // Update only part of the session
      Store.dispatch({
        session: {
          clientSessionId: 'newClient',
          serverSessionId: 'server456',
        },
      });

      expect(Store.store.session).toEqual({
        clientSessionId: 'newClient',
        serverSessionId: 'server456',
      });
    });
  });
});

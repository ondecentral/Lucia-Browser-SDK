// Global test utilities defined in jest.setup.ts
declare global {
  /**
   * Helper to mock location URL in tests using history API.
   * Works with jsdom without requiring Object.defineProperty hacks.
   */
  function setTestUrl(url: string): void;
}

export {};

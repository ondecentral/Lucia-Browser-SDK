import { detectSolanaProvider } from '../../../features/web3/solana';

describe('Solana Provider Detection', () => {
  let originalSolana: any;
  let originalSolflare: any;
  let originalPhantom: any;

  beforeEach(() => {
    originalSolana = (window as any).solana;
    originalSolflare = (window as any).solflare;
    originalPhantom = (window as any).phantom;

    delete (window as any).solana;
    delete (window as any).solflare;
    delete (window as any).phantom;
  });

  afterEach(() => {
    if (originalSolana !== undefined) {
      (window as any).solana = originalSolana;
    } else {
      delete (window as any).solana;
    }
    if (originalSolflare !== undefined) {
      (window as any).solflare = originalSolflare;
    } else {
      delete (window as any).solflare;
    }
    if (originalPhantom !== undefined) {
      (window as any).phantom = originalPhantom;
    } else {
      delete (window as any).phantom;
    }
  });

  describe('detectSolanaProvider', () => {
    it('should return null when no Solana provider exists', () => {
      expect(detectSolanaProvider()).toBeNull();
    });

    it('should detect Phantom via window.phantom.solana', () => {
      (window as any).phantom = { solana: {} };
      expect(detectSolanaProvider()).toBe('Phantom');
    });

    it('should detect Solflare via window.solflare', () => {
      (window as any).solflare = {};
      expect(detectSolanaProvider()).toBe('Solflare');
    });

    it('should detect Phantom via window.solana.isPhantom', () => {
      (window as any).solana = { isPhantom: true };
      expect(detectSolanaProvider()).toBe('Phantom');
    });

    it('should prioritize Phantom over Solflare when both exist', () => {
      (window as any).phantom = { solana: {} };
      (window as any).solflare = {};
      expect(detectSolanaProvider()).toBe('Phantom');
    });

    it('should return null for window.solana without isPhantom', () => {
      (window as any).solana = { isConnected: true };
      expect(detectSolanaProvider()).toBeNull();
    });
  });
});

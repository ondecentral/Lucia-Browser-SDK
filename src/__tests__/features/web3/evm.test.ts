import { detectEvmProvider } from '../../../features/web3/evm';

describe('EVM Provider Detection', () => {
  let originalEthereum: any;
  let originalBinanceChain: any;

  beforeEach(() => {
    originalEthereum = window.ethereum;
    originalBinanceChain = (window as any).BinanceChain;

    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true });
    Object.defineProperty(window, 'BinanceChain', { value: undefined, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'ethereum', { value: originalEthereum, writable: true });
    Object.defineProperty(window, 'BinanceChain', { value: originalBinanceChain, writable: true });
  });

  describe('detectEvmProvider', () => {
    it('should return null when no ethereum provider exists', () => {
      expect(detectEvmProvider()).toBeNull();
    });

    it('should detect MetaMask', () => {
      Object.defineProperty(window, 'ethereum', { value: { isMetaMask: true }, writable: true });
      expect(detectEvmProvider()).toBe('MetaMask');
    });

    it('should detect Coinbase Wallet via isCoinbaseWallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isCoinbaseWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('Coinbase Wallet');
    });

    it('should detect Coinbase Wallet via isCoinbase', () => {
      Object.defineProperty(window, 'ethereum', { value: { isCoinbase: true }, writable: true });
      expect(detectEvmProvider()).toBe('Coinbase Wallet');
    });

    it('should detect WalletConnect', () => {
      Object.defineProperty(window, 'ethereum', { value: { isWalletConnect: true }, writable: true });
      expect(detectEvmProvider()).toBe('WalletConnect');
    });

    it('should detect Trust Wallet via isTrust', () => {
      Object.defineProperty(window, 'ethereum', { value: { isTrust: true }, writable: true });
      expect(detectEvmProvider()).toBe('Trust Wallet');
    });

    it('should detect Trust Wallet via isTrustWallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isTrustWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('Trust Wallet');
    });

    it('should detect imToken', () => {
      Object.defineProperty(window, 'ethereum', { value: { isImToken: true }, writable: true });
      expect(detectEvmProvider()).toBe('imToken');
    });

    it('should detect Brave Wallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isBraveWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('Brave Wallet');
    });

    it('should detect TokenPocket', () => {
      Object.defineProperty(window, 'ethereum', { value: { isTokenPocket: true }, writable: true });
      expect(detectEvmProvider()).toBe('TokenPocket');
    });

    it('should detect Status', () => {
      Object.defineProperty(window, 'ethereum', { value: { isStatus: true }, writable: true });
      expect(detectEvmProvider()).toBe('Status');
    });

    it('should detect Tally via isTally', () => {
      Object.defineProperty(window, 'ethereum', { value: { isTally: true }, writable: true });
      expect(detectEvmProvider()).toBe('Tally');
    });

    it('should detect Tally via isTallyWallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isTallyWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('Tally');
    });

    it('should detect AlphaWallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isAlphaWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('AlphaWallet');
    });

    it('should detect Opera', () => {
      Object.defineProperty(window, 'ethereum', { value: { isOpera: true }, writable: true });
      expect(detectEvmProvider()).toBe('Opera');
    });

    it('should detect Coin98', () => {
      Object.defineProperty(window, 'ethereum', { value: { isCoin98: true }, writable: true });
      expect(detectEvmProvider()).toBe('Coin98');
    });

    it('should detect MathWallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isMathWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('MathWallet');
    });

    it('should detect 1inch Wallet via iOS flag', () => {
      Object.defineProperty(window, 'ethereum', { value: { isOneInchIOSWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('1inch Wallet');
    });

    it('should detect 1inch Wallet via Android flag', () => {
      Object.defineProperty(window, 'ethereum', { value: { isOneInchAndroidWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('1inch Wallet');
    });

    it('should detect Rainbow', () => {
      Object.defineProperty(window, 'ethereum', { value: { isRainbow: true }, writable: true });
      expect(detectEvmProvider()).toBe('Rainbow');
    });

    it('should detect Frame', () => {
      Object.defineProperty(window, 'ethereum', { value: { isFrame: true }, writable: true });
      expect(detectEvmProvider()).toBe('Frame');
    });

    it('should detect Binance Chain Wallet', () => {
      Object.defineProperty(window, 'ethereum', { value: {}, writable: true });
      Object.defineProperty(window, 'BinanceChain', { value: {}, writable: true });
      expect(detectEvmProvider()).toBe('Binance Chain Wallet');
    });

    it('should detect MetaMask via _metamask property', () => {
      const eth = { _metamask: {} };
      Object.defineProperty(window, 'ethereum', { value: eth, writable: true });
      expect(detectEvmProvider()).toBe('MetaMask');
    });

    it('should return null for unknown provider', () => {
      Object.defineProperty(window, 'ethereum', { value: { request: jest.fn() }, writable: true });
      expect(detectEvmProvider()).toBeNull();
    });

    it('should prioritize specific wallet over isMetaMask compat flag', () => {
      // Brave sets isBraveWallet AND isMetaMask for dapp compat
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isBraveWallet: true },
        writable: true,
      });
      expect(detectEvmProvider()).toBe('Brave Wallet');
    });

    it('should detect MetaMask when only isMetaMask is set', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true },
        writable: true,
      });
      expect(detectEvmProvider()).toBe('MetaMask');
    });

    it('should prioritize Rainbow over isMetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isRainbow: true },
        writable: true,
      });
      expect(detectEvmProvider()).toBe('Rainbow');
    });

    it('should prioritize Trust Wallet over isMetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isTrust: true },
        writable: true,
      });
      expect(detectEvmProvider()).toBe('Trust Wallet');
    });

    it('should detect Rabby', () => {
      Object.defineProperty(window, 'ethereum', { value: { isRabby: true }, writable: true });
      expect(detectEvmProvider()).toBe('Rabby');
    });

    it('should prioritize Rabby over isMetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isRabby: true },
        writable: true,
      });
      expect(detectEvmProvider()).toBe('Rabby');
    });

    it('should detect Zerion', () => {
      Object.defineProperty(window, 'ethereum', { value: { isZerion: true }, writable: true });
      expect(detectEvmProvider()).toBe('Zerion');
    });

    it('should detect Phantom EVM', () => {
      Object.defineProperty(window, 'ethereum', { value: { isPhantom: true }, writable: true });
      expect(detectEvmProvider()).toBe('Phantom');
    });

    it('should detect OKX Wallet', () => {
      Object.defineProperty(window, 'ethereum', { value: { isOkxWallet: true }, writable: true });
      expect(detectEvmProvider()).toBe('OKX Wallet');
    });

    it('should detect Bitget Wallet via isBitKeep', () => {
      Object.defineProperty(window, 'ethereum', { value: { isBitKeep: true }, writable: true });
      expect(detectEvmProvider()).toBe('Bitget Wallet');
    });

    it('should detect SafePal', () => {
      Object.defineProperty(window, 'ethereum', { value: { isSafePal: true }, writable: true });
      expect(detectEvmProvider()).toBe('SafePal');
    });

    it('should detect Frontier', () => {
      Object.defineProperty(window, 'ethereum', { value: { isFrontier: true }, writable: true });
      expect(detectEvmProvider()).toBe('Frontier');
    });

    it('should detect XDEFI', () => {
      Object.defineProperty(window, 'ethereum', { value: { isXDEFI: true }, writable: true });
      expect(detectEvmProvider()).toBe('XDEFI');
    });

    it('should detect Enkrypt', () => {
      Object.defineProperty(window, 'ethereum', { value: { isEnkrypt: true }, writable: true });
      expect(detectEvmProvider()).toBe('Enkrypt');
    });
  });
});

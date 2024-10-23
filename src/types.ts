export interface Config {
  apiKey: string;
  debug?: boolean;
  testENV?: boolean;
}

export interface SDK {
  init: (config: Config) => void;
  userInfo?: (user: unknown, userInfo: unknown) => Promise<void>;
  pageView?: (page: string) => Promise<void>;
  trackConversion?: (eventTag: string, amount: number, eventDetails: unknown) => Promise<void>;
  buttonClick?: (button: unknown) => Promise<void>;
  sendWalletInfo?: (walletAddress: string, chainId: number | string) => Promise<void>;
  checkMetaMaskConnection?: () => boolean;
}

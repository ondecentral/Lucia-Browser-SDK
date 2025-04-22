export interface Config {
  apiKey: string;
  debug?: boolean;
  testENV?: boolean;
  debugURL?: string;
}

export interface SDK {
  init: (config: Config) => Promise<LuciaSDKClass>;
  userInfo: (user: string, userInfo: object) => Promise<void>;
  pageView: (page: string) => Promise<void>;
  trackConversion: (eventTag: string, amount: number, eventDetails: object) => Promise<void>;
  buttonClick: (button: string) => Promise<void>;
  sendWalletInfo: (
    walletAddress: string,
    chainId: number | string,
    walletName?: 'Metamask' | 'Phantom',
  ) => Promise<void>;
  checkMetaMaskConnection: () => boolean;
  VERSION: string;
}

export interface LuciaSDKClass extends Omit<SDK, 'init' | 'VERSION'> {
  init: () => void;
}

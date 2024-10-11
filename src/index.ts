import LuciaSDKClass from './core';
import { Config, SDK } from './types';

const LuciaSDK: SDK = {
  init: (config: Config) => {
    if (typeof window === 'undefined') return;

    const userConfig = config || {};

    const instance = new LuciaSDKClass(userConfig);
    LuciaSDK.userInfo = instance.userInfo;
    LuciaSDK.pageView = instance.pageView;
    LuciaSDK.trackConversion = instance.trackConversion;
    LuciaSDK.buttonClick = instance.buttonClick;
    LuciaSDK.sendWalletInfo = instance.sendWalletInfo;
    LuciaSDK.checkMetaMaskConnection = instance.checkMetaMaskConnection;
  },
};

export default LuciaSDK;

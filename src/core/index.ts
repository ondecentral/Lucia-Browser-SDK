import BaseClass from '../base';
import { getLidData, getSessionData, getUser, udata } from '../utils/data';

class LuciaSDK extends BaseClass {
  authenticate() {
    this.httpClient.post('/api/key/auth', {});
  }

  async init() {
    const data = await this.httpClient.post<{ lid: string }>('/api/sdk/init', {
      user: {
        name: getUser(),
        data: await udata(),
      },
      session: getSessionData(),
    });
    if (data) {
      localStorage.setItem('lid', data.lid);
    }
  }

  async userInfo(user: object, userInfo: unknown) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/user', {
      user: {
        name: user,
        data: await udata(),
        userInfo,
      },
      lid,
      session,
    });
  }

  async pageView(page: string) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/page', {
      page,
      user: {
        name: getUser(),
        data: await udata(),
      },
      lid,
      session,
    });
  }

  async trackConversion(eventTag: string, amount: number, eventDetails: unknown) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/conversion', {
      tag: eventTag,
      amount,
      event: eventDetails,
      user: {
        name: getUser(),
        data: await udata(),
      },
      lid,
      session,
    });
  }

  async buttonClick(button: unknown) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/click', {
      button,
      user: {
        name: getUser(),
        data: await udata(),
      },
      lid,
      session,
    });
  }

  async sendWalletInfo(walletAddress: string, chainId: number | string) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/wallet', {
      walletAddress,
      chainId,
      user: {
        name: getUser(),
        data: await udata(),
      },
      lid,
      session,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  checkMetaMaskConnection() {
    // Check if MetaMask is installed and connected
    return window.ethereum && window.ethereum.isConnected() && window.ethereum.selectedAddress;
  }
}

export default LuciaSDK;

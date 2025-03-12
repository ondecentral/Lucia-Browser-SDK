import BaseClass from '../base';
import { getLidData, getSessionData, getUser, getUtmParams, udata } from '../utils/data';

class LuciaSDK extends BaseClass {
  authenticate() {
    this.httpClient.post('/api/key/auth', {});
  }

  /**
   * Initializes the SDK with the provided configuration
   */
  async init() {
    const data = await this.httpClient.post<{ lid: string }>('/api/sdk/init', {
      user: {
        name: getUser(),
        data: await udata(),
      },
      session: getSessionData(),
      utm: getUtmParams(),
    });
    if (data) {
      localStorage.setItem('lid', data.lid);
    }
  }

  /**
   * Sends user information to the server
   * @param userId The user's ID, e.g. email, wallet address, etc.
   * @param userInfo Additional user information, e.g. name, contact details, etc.
   */
  async userInfo(userId: string, userInfo: object) {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/user', {
      user: {
        name: userId,
        data: await udata(),
        userInfo,
      },
      lid,
      session,
    });
  }

  /**
   * Sends page view information to the server
   * @param page The page that the user is currently on
   */
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

  /**
   * Sends conversion information to the server
   * @param eventTag The tag of the event that was triggered, e.g. 'purchase', 'signup', etc.
   * @param amount The amount of the conversion, e.g. purchase amount, etc.
   * @param eventDetails Additional details about the event, e.g. product details, etc.
   */
  async trackConversion(eventTag: string, amount: number, eventDetails: object) {
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

  /**
   * Sends button click information to the server
   * @param button The button that was clicked
   */
  async buttonClick(button: string) {
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

  /**
   * Sends wallet information to the server
   * @param walletAddress The wallet address of the user
   * @param chainId The chain ID of the wallet
   */
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

import BaseClass from '../base';
import { getBrowserData, getUtmParams, getWalletData } from '../utils/data';
import { getSessionData, getLidData, getUser, storeSessionID } from '../utils/session';

class LuciaSDK extends BaseClass {
  authenticate() {
    this.httpClient.post('/api/key/auth', {});
  }

  /**
   * Initializes the SDK with the provided configuration
   */
  async init() {
    // Ensure a session exists before making the init request
    let session = getSessionData();
    if (!session) {
      session = await storeSessionID();
    }

    const data = getBrowserData();
    const url = new URL(window.location.href);
    const redirectHash = url.searchParams.get('lucia');
    const walletData = await getWalletData();

    const result = await this.httpClient.post<{ lid: string }>(
      '/api/sdk/init',
      {
        user: {
          name: getUser(),
        },
        data,
        walletData,
        session,
        redirectHash,
        utm: getUtmParams(),
      },
      false,
    );
    if (result) {
      localStorage.setItem('lid', result.lid);
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

    if (userId) {
      localStorage.setItem('luc_uid', userId);
    }

    await this.httpClient.post('/api/sdk/user', {
      user: {
        name: userId,
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
  async sendWalletInfo(walletAddress: string, chainId: number | string, walletName?: 'Phantom' | 'Metamask') {
    const lid = getLidData();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/wallet', {
      walletAddress,
      chainId,
      walletName,
      user: {
        name: getUser(),
      },
      lid,
      session,
    });
  }

  /**
   * Track a user acquisition event when a user signs up or logs in
   * @param userId - Unique identifier for the user
   * @param acquisitionData - Optional additional data about the acquisition
   */
  async trackUserAcquisition(userId: string, acquisitionData: object = {}) {
    const browserData = getBrowserData();
    const utmParams = getUtmParams();
    const session = getSessionData();
    
    await this.httpClient.post('/api/sdk/acquisition', {
      user: {
        name: userId
      },
      session,
      data: {
        timestamp: new Date().toISOString(),
        browserData,
        utmParams,
        ...acquisitionData
      }
    });
  }

  /**
   * Checks if MetaMask is installed and connected
   * @returns false if MetaMask is not connected, otherwise returns the wallet address
   */
  // eslint-disable-next-line class-methods-use-this
  checkMetaMaskConnection() {
    return window.ethereum && window.ethereum.isConnected() && window.ethereum.selectedAddress;
  }
}

export default LuciaSDK;

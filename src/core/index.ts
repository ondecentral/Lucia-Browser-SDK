import BaseClass from '../base';
import { ClickEventMetadata } from '../types';
import { ClickTracker, ClickEventData, AutoTrackClicksConfig } from '../utils/click-tracker';
import { getBrowserData, getUtmParams, getWalletData } from '../utils/data';
import { getSessionData, getLidData, getUser, storeSessionID, updateSessionFromServer } from '../utils/session';

class LuciaSDK extends BaseClass {
  private clickTracker: ClickTracker | null = null;

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
      session = storeSessionID();
    }

    const data = await getBrowserData();
    const url = new URL(window.location.href);
    const redirectHash = url.searchParams.get('lucia');
    const walletData = await getWalletData();

    // Prepare session payload - only include hash if it exists (from backend)
    const sessionPayload: { id: string; hash?: string } = { id: session.id };
    if (session.hash) {
      sessionPayload.hash = session.hash;
    }

    const result = await this.httpClient.post<{ lid: string; session: { hash: string; id: string } }>(
      '/api/sdk/init',
      {
        user: {
          name: getUser(),
        },
        data,
        walletData,
        session: sessionPayload,
        redirectHash,
        utm: getUtmParams(),
      },
      false,
    );
    if (result) {
      // Store the lid from server response - only if it's a valid string
      // Prevents storing "undefined" as a string when result.lid is undefined
      if (result.lid) {
        localStorage.setItem('lid', result.lid);
      }

      // Update session storage with server-provided session data
      if (result.session) {
        updateSessionFromServer(result.session);
      }
    }

    // Initialize auto-tracking if configured
    this.initAutoTracking();
  }

  /**
   * Initialize automated click tracking if enabled
   */
  private initAutoTracking(): void {
    // Destroy existing tracker if any
    if (this.clickTracker) {
      this.clickTracker.destroy();
      this.clickTracker = null;
    }

    const autoTrackConfig = this.store.config?.autoTrackClicks;

    if (!autoTrackConfig) {
      return;
    }

    // Normalize config to object format
    let config: AutoTrackClicksConfig;
    if (typeof autoTrackConfig === 'boolean') {
      config = { enabled: autoTrackConfig };
    } else {
      config = autoTrackConfig;
    }

    // Only initialize if enabled
    if (config.enabled !== false) {
      this.clickTracker = new ClickTracker(
        this.store.config!,
        config,
        this.handleAutoTrackedClick.bind(this),
        this.logger,
      );

      this.logger.log('log', 'Auto-tracking initialized', config);
    }
  }

  /**
   * Handle automatically tracked click events
   */
  private handleAutoTrackedClick(data: ClickEventData): void {
    const metadata: ClickEventMetadata = {
      elementType: data.elementType,
      text: data.text,
      href: data.href,
      meta: data.meta,
    };

    this.buttonClick(data.button, metadata);
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

    const payload: any = {
      user: {
        name: userId,
        userInfo,
      },
      session,
    };

    // Only include lid if it has a value
    if (lid) {
      payload.lid = lid;
    }

    await this.httpClient.post('/api/sdk/user', payload);
  }

  /**
   * Sends page view information to the server
   * @param page The page that the user is currently on
   */
  async pageView(page: string) {
    const lid = getLidData();
    const session = getSessionData();

    const payload: any = {
      page,
      user: {
        name: getUser(),
      },
      session,
    };

    // Only include lid if it has a value
    if (lid) {
      payload.lid = lid;
    }

    await this.httpClient.post('/api/sdk/page', payload);
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

    const payload: any = {
      tag: eventTag,
      amount,
      event: eventDetails,
      user: {
        name: getUser(),
      },
      session,
    };

    // Only include lid if it has a value
    if (lid) {
      payload.lid = lid;
    }

    await this.httpClient.post('/api/sdk/conversion', payload);
  }

  /**
   * Sends button click information to the server
   * @param button The button identifier that was clicked
   * @param metadata Optional metadata about the click event (elementType, text, href, meta)
   */
  async buttonClick(button: string, metadata?: ClickEventMetadata) {
    const lid = getLidData();
    const session = getSessionData();

    const payload: any = {
      button,
      user: {
        name: getUser(),
      },
      session,
    };

    // Only include lid if it has a value
    if (lid) {
      payload.lid = lid;
    }

    // Add metadata if provided (from auto-tracking or manual calls)
    if (metadata) {
      if (metadata.elementType) payload.elementType = metadata.elementType;
      if (metadata.text) payload.text = metadata.text;
      if (metadata.href !== undefined) payload.href = metadata.href;
      if (metadata.meta) payload.meta = metadata.meta;
      payload.timestamp = Date.now();
    }

    await this.httpClient.post('/api/sdk/click', payload);
  }

  /**
   * Sends wallet information to the server
   * @param walletAddress The wallet address of the user
   * @param chainId The chain ID of the wallet
   */
  async sendWalletInfo(walletAddress: string, chainId: number | string, walletName?: 'Phantom' | 'Metamask') {
    const lid = getLidData();
    const session = getSessionData();

    const payload: any = {
      walletAddress,
      chainId,
      walletName,
      user: {
        name: getUser(),
      },
      session,
    };

    // Only include lid if it has a value
    if (lid) {
      payload.lid = lid;
    }

    await this.httpClient.post('/api/sdk/wallet', payload);
  }

  /**
   * Track a user acquisition event when a user signs up or logs in
   * @param userId - Unique identifier for the user
   * @param acquisitionData - Optional additional data about the acquisition
   */
  async trackUserAcquisition(userId: string, acquisitionData: object = {}) {
    const browserData = await getBrowserData();
    const utmParams = getUtmParams();
    const session = getSessionData();

    await this.httpClient.post('/api/sdk/acquisition', {
      user: {
        name: userId,
      },
      session,
      data: {
        timestamp: new Date().toISOString(),
        browserData,
        utmParams,
        ...acquisitionData,
      },
    });
  }

  /**
   * Checks if MetaMask is installed and connected
   * @returns true if MetaMask is connected, false otherwise
   */
  // eslint-disable-next-line class-methods-use-this
  checkMetaMaskConnection(): boolean {
    return !!(window.ethereum?.isConnected?.() && window.ethereum?.selectedAddress);
  }

  /**
   * Clean up SDK resources (mainly for testing)
   */
  destroy() {
    if (this.clickTracker) {
      this.clickTracker.destroy();
      this.clickTracker = null;
    }
  }
}

export default LuciaSDK;

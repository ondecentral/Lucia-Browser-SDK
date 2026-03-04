import BaseClass from '../base';
import { autoTrackerRegistry, clickTrackerRegistration, ClickEventData } from '../features/auto-tracking';
import { getBrowserData, getUtmParams } from '../features/fingerprinting';
import {
  startEIP6963Discovery,
  getEIP6963ConnectedWallets,
  getEIP6963Providers,
  onEIP6963Announce,
} from '../features/web3/eip6963';
import type { EIP6963ProviderDetail } from '../features/web3/eip6963';
import { detectEvmProvider } from '../features/web3/evm';
import { detectSolanaProvider } from '../features/web3/solana';
import { getSessionData, getLidData, getUser, storeSessionID, updateSessionFromServer } from '../infrastructure';
import {
  ClickEventMetadata,
  WalletInfoOptions,
  UserInfoPayload,
  PageViewPayload,
  ConversionPayload,
  ClickPayload,
  WalletPayload,
} from '../types';

// Register trackers at module load time
autoTrackerRegistry.register(clickTrackerRegistration);

class LuciaSDK extends BaseClass {
  /** Addresses already sent this session — avoids redundant POSTs */
  private sentWallets = new Set<string>();

  /** Stored listener references for cleanup */
  private walletListenerCleanups: Array<() => void> = [];

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

    // Start EIP-6963 discovery early so wallets can announce during network time.
    // Best-effort — some CSP policies could block custom event dispatch.
    try {
      startEIP6963Discovery();
    } catch {
      /* non-fatal */
    }

    const data = await getBrowserData();
    const url = new URL(window.location.href);
    const redirectHash = url.searchParams.get('lucia');

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
        session: sessionPayload,
        redirectHash,
        utm: getUtmParams(),
      },
      false,
    );
    if (result) {
      // Store the lid from server response - only if it's a valid string
      if (result.lid) {
        localStorage.setItem('lid', result.lid);
      }

      // Update session storage with server-provided session data
      if (result.session) {
        updateSessionFromServer(result.session);
      }
    }

    // Initialize all configured auto-trackers via registry
    autoTrackerRegistry.initAll(
      this.store.config!,
      {
        clicks: this.handleAutoTrackedClick.bind(this),
      },
      this.logger,
    );

    // Wallet detection runs AFTER init response (lid + session hash are available)
    // Auto-detect is best-effort — failures must not break init
    await this.autoDetectWallets();
    this.setupWalletListeners();
  }

  /**
   * Handle automatically tracked click events
   */
  private handleAutoTrackedClick(data: unknown): void {
    const clickData = data as ClickEventData;
    const metadata: ClickEventMetadata = {
      elementType: clickData.elementType,
      text: clickData.text,
      href: clickData.href,
      meta: clickData.meta,
    };

    this.buttonClick(clickData.button, metadata);
  }

  /**
   * Auto-detect already-connected wallets and send them to the backend.
   * Runs after init so lid and session hash are available.
   * Each chain is independent — one failing must not block the other.
   *
   * EIP-6963 is the PRIMARY path for EVM wallets. The legacy
   * window.ethereum.selectedAddress check is the FALLBACK for wallets
   * that don't support EIP-6963.
   */
  private async autoDetectWallets(): Promise<void> {
    let eip6963Found = false;

    // EVM — EIP-6963 primary path
    try {
      const wallets = await getEIP6963ConnectedWallets();
      for (const w of wallets) {
        eip6963Found = true;
        await this.sendWalletInfo(w.address, { provider: w.providerName, providerRdns: w.providerRdns });
      }
    } catch {
      // EIP-6963 detection failed — fall through to legacy
    }

    // EVM — legacy fallback (only if EIP-6963 found nothing)
    if (!eip6963Found && window.ethereum?.selectedAddress) {
      try {
        const provider = detectEvmProvider();
        await this.sendWalletInfo(window.ethereum.selectedAddress, { provider: provider ?? undefined });
      } catch {
        // EVM auto-detection failed — non-fatal, continue to Solana
      }
    }

    // Solana — check window.solana for already-connected wallet (unchanged)
    if (window.solana?.isConnected && window.solana?.publicKey) {
      try {
        const provider = detectSolanaProvider();
        await this.sendWalletInfo(window.solana.publicKey.toString(), { provider: provider ?? undefined });
      } catch {
        // Solana auto-detection failed — non-fatal
      }
    }

    // Attach per-provider accountsChanged listeners for EIP-6963 providers
    this.setupEIP6963AccountListeners();
  }

  /**
   * Set up event listeners for wallet connection changes.
   * EVM: per-provider accountsChanged via EIP-6963 (preferred), or
   *      window.ethereum accountsChanged as fallback.
   * Solana: connect fires when wallet connects.
   */
  private setupWalletListeners(): void {
    // EIP-6963: listen for late-arriving providers
    const cleanupAnnounce = onEIP6963Announce((detail) => {
      this.handleLateEIP6963Provider(detail);
    });
    this.walletListenerCleanups.push(cleanupAnnounce);

    // EVM: legacy accountsChanged on window.ethereum — only needed when NO
    // EIP-6963 providers exist. When EIP-6963 providers are present, the
    // per-provider listeners (attachEIP6963AccountsChanged) already cover
    // accountsChanged with correct attribution. The legacy listener would
    // just fire redundantly on the same global that EIP-6963 already wraps.
    if (window.ethereum?.on && getEIP6963Providers().size === 0) {
      const handler = (accounts: unknown) => {
        const accts = accounts as string[];
        if (accts[0]) {
          const addr = accts[0];
          const provider = detectEvmProvider();
          this.sendWalletInfo(addr, { provider: provider ?? undefined }).catch(() => {});
        }
      };
      window.ethereum.on('accountsChanged', handler);
      this.walletListenerCleanups.push(() => {
        window.ethereum?.removeListener?.('accountsChanged', handler);
      });
    }

    // Solana: connect (unchanged)
    if (window.solana?.on) {
      const handler = () => {
        if (window.solana?.publicKey) {
          const provider = detectSolanaProvider();
          this.sendWalletInfo(window.solana.publicKey.toString(), { provider: provider ?? undefined }).catch(() => {});
        }
      };
      window.solana.on('connect', handler);
      this.walletListenerCleanups.push(() => {
        window.solana?.removeListener?.('connect', handler);
      });
    }
  }

  /**
   * Attach accountsChanged listeners to each EIP-6963 provider that
   * returned accounts. The provider name is known from the EIP-6963 info,
   * so attribution is guaranteed correct.
   */
  private setupEIP6963AccountListeners(): void {
    const allProviders = getEIP6963Providers();
    for (const [, detail] of allProviders) {
      this.attachEIP6963AccountsChanged(detail);
    }
  }

  /**
   * Handle a late-arriving EIP-6963 provider: check for connected accounts
   * and attach accountsChanged.
   */
  private handleLateEIP6963Provider(detail: EIP6963ProviderDetail): void {
    const { info, provider } = detail;
    // Check for already-connected accounts
    if (provider.request) {
      provider
        .request({ method: 'eth_accounts' })
        .then((accounts: unknown) => {
          const addrs = accounts as string[];
          if (Array.isArray(addrs)) {
            for (const addr of addrs) {
              if (typeof addr === 'string' && addr.length > 0) {
                this.sendWalletInfo(addr, { provider: info.name, providerRdns: info.rdns }).catch(() => {});
              }
            }
          }
        })
        .catch(() => {});
    }
    // Attach accountsChanged
    this.attachEIP6963AccountsChanged(detail);
  }

  /**
   * Attach an accountsChanged listener to a single EIP-6963 provider.
   */
  private attachEIP6963AccountsChanged(detail: EIP6963ProviderDetail): void {
    const { info, provider } = detail;
    if (!provider.on) return;

    const handler = (accounts: unknown) => {
      const accts = accounts as string[];
      if (Array.isArray(accts)) {
        for (const addr of accts) {
          if (typeof addr === 'string' && addr.length > 0) {
            this.sendWalletInfo(addr, { provider: info.name, providerRdns: info.rdns }).catch(() => {});
          }
        }
      }
    };

    provider.on('accountsChanged', handler);
    this.walletListenerCleanups.push(() => {
      provider.removeListener?.('accountsChanged', handler);
    });
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

    const payload: UserInfoPayload = {
      user: {
        name: userId,
        userInfo,
      },
      session,
      ...(lid && { lid }),
    };

    await this.httpClient.post('/api/sdk/user', payload);
  }

  /**
   * Sends page view information to the server
   * @param page The page that the user is currently on
   */
  async pageView(page: string) {
    const lid = getLidData();
    const session = getSessionData();

    const payload: PageViewPayload = {
      page,
      user: {
        name: getUser(),
      },
      session,
      ...(lid && { lid }),
    };

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

    const payload: ConversionPayload = {
      tag: eventTag,
      amount,
      event: eventDetails,
      user: {
        name: getUser(),
      },
      session,
      ...(lid && { lid }),
    };

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

    const payload: ClickPayload = {
      button,
      user: {
        name: getUser(),
      },
      session,
      ...(lid && { lid }),
      ...(metadata && {
        ...(metadata.elementType && { elementType: metadata.elementType }),
        ...(metadata.text && { text: metadata.text }),
        ...(metadata.href !== undefined && { href: metadata.href }),
        ...(metadata.meta && { meta: metadata.meta }),
        timestamp: Date.now(),
      }),
    };

    await this.httpClient.post('/api/sdk/click', payload);
  }

  /**
   * Sends wallet information to the server. Thin pipe — no validation or classification.
   *
   * Supports both new and old calling patterns:
   *   New: sendWalletInfo(address, { provider, connectorType, chainId })
   *   Old: sendWalletInfo(address, chainId, walletName)
   *
   * @param walletAddress The wallet address
   * @param optionsOrChainId Options object or legacy chainId
   * @param walletName Legacy wallet name (mapped to provider)
   */
  async sendWalletInfo(
    walletAddress: string,
    optionsOrChainId?: WalletInfoOptions | number | string,
    walletName?: string,
  ) {
    if (!walletAddress || typeof walletAddress !== 'string') return;

    // Normalize for dedup: EVM addresses are case-insensitive, but wallets return
    // mixed-case (checksummed) or lowercase depending on the code path.
    // Solana addresses are base58 (case-sensitive) — leave as-is.
    const dedupKey = walletAddress.startsWith('0x') ? walletAddress.toLowerCase() : walletAddress;

    // Session-scoped dedup — skip if already sent this address
    if (this.sentWallets.has(dedupKey)) return;
    // Add optimistically to prevent rapid double-fire; remove on failure so retry is possible
    this.sentWallets.add(dedupKey);

    // Normalize: support both new options object and old (chainId, walletName) signature
    let options: WalletInfoOptions = {};
    if (optionsOrChainId && typeof optionsOrChainId === 'object') {
      options = optionsOrChainId;
    } else if (optionsOrChainId !== undefined) {
      options = {
        chainId: typeof optionsOrChainId === 'number' ? optionsOrChainId : undefined,
        provider: walletName,
      };
    }

    const lid = getLidData();
    const session = getSessionData();

    const payload: WalletPayload = {
      walletAddress,
      provider: options.provider ?? null,
      providerRdns: options.providerRdns ?? null,
      connectorType: options.connectorType ?? null,
      ...(options.chainId != null && { chainId: options.chainId }),
      // Backward compat: send walletName if provider came from old-style walletName arg
      ...(walletName && { walletName }),
      user: {
        name: getUser(),
      },
      session,
      ...(lid && { lid }),
    };

    try {
      await this.httpClient.post('/api/sdk/wallet', payload);
    } catch (err) {
      // POST failed — remove from dedup set so the next attempt can retry
      this.sentWallets.delete(dedupKey);
      throw err;
    }
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
  checkMetaMaskConnection(): boolean {
    return !!(window.ethereum?.isConnected?.() && window.ethereum?.selectedAddress);
  }

  /**
   * Clean up SDK resources
   */
  destroy() {
    autoTrackerRegistry.destroyAll();
    // Clean up wallet event listeners
    this.walletListenerCleanups.forEach((cleanup) => cleanup());
    this.walletListenerCleanups = [];
    this.sentWallets.clear();
  }
}

export default LuciaSDK;

/**
 * Automated click tracking implementation
 * Provides zero-config click tracking with element-level control
 */

import Logger from './logger';
import { defaultPrivacyGuard, PrivacyGuard } from './privacy';

import { Config } from '../types';

export interface AutoTrackClicksConfig {
  enabled?: boolean;
  selectors?: string[];
  ignore?: string[];
}

export interface ClickEventData {
  button: string;
  elementType: string;
  text?: string;
  href?: string | null;
  meta?: Record<string, string>;
  timestamp: number;
}

/**
 * Default selectors for trackable elements
 */
const DEFAULT_SELECTORS = ['button', 'a[href]', '[role="button"]'];

/**
 * Default ignore selectors (in addition to privacy guard)
 */
const DEFAULT_IGNORE = ['[data-lucia-ignore]', '[data-lucia-track="false"]'];

/**
 * Default debounce time in milliseconds
 */
const DEFAULT_DEBOUNCE_MS = 500;

/**
 * ClickTracker handles automated click event tracking
 */
export class ClickTracker {
  private config: AutoTrackClicksConfig;

  private sdkConfig: Config;

  private logger: Logger;

  private privacyGuard: PrivacyGuard;

  private debounceTimers: Map<Element, number> = new Map();

  private trackingCallback: (data: ClickEventData) => void;

  private listenerAttached = false;

  private boundHandleClick: ((event: MouseEvent) => void) | null = null;

  constructor(
    sdkConfig: Config,
    autoTrackConfig: AutoTrackClicksConfig,
    trackingCallback: (data: ClickEventData) => void,
    logger: Logger,
  ) {
    this.sdkConfig = sdkConfig;
    this.config = {
      enabled: autoTrackConfig.enabled ?? true,
      selectors: autoTrackConfig.selectors ?? DEFAULT_SELECTORS,
      ignore: autoTrackConfig.ignore ?? DEFAULT_IGNORE,
    };
    this.trackingCallback = trackingCallback;
    this.logger = logger;
    this.privacyGuard = defaultPrivacyGuard;

    if (this.config.enabled) {
      this.attachListener();
    }
  }

  /**
   * Attach the delegated click event listener
   */
  private attachListener(): void {
    if (this.listenerAttached) {
      return;
    }

    if (typeof document === 'undefined') {
      this.logger.log('warn', 'ClickTracker: document not available, cannot attach listener');
      return;
    }

    this.boundHandleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.boundHandleClick, {
      passive: true,
      capture: false,
    });

    this.listenerAttached = true;
    this.logger.log('log', 'ClickTracker: Delegated click listener attached');
  }

  /**
   * Handle click events via delegation
   */
  private handleClick(event: MouseEvent): void {
    // Check if tracking is enabled
    if (!this.config.enabled) {
      return;
    }

    const target = event.target as Element;
    if (!target) return;

    // Find the trackable element (might be an ancestor of the clicked element)
    const trackableElement = this.findTrackableElement(target);
    if (!trackableElement) return;

    // Check if element should be ignored
    if (this.shouldIgnore(trackableElement)) {
      this.logger.log('log', 'ClickTracker: Element ignored', trackableElement);
      return;
    }

    // Check if element is sensitive
    if (this.privacyGuard.isSensitive(trackableElement)) {
      this.logger.log('warn', 'ClickTracker: Sensitive element not tracked', trackableElement);
      return;
    }

    // Apply debouncing
    if (this.isDebounced(trackableElement)) {
      this.logger.log('log', 'ClickTracker: Click debounced', trackableElement);
      return;
    }

    // Extract tracking data and send
    const trackingData = this.extractTrackingData(trackableElement);
    if (trackingData) {
      this.logger.log('log', 'ClickTracker: Tracking click', trackingData);
      this.trackingCallback(trackingData);
    }
  }

  /**
   * Find the trackable element starting from the clicked element
   * Uses native closest() for optimized DOM traversal
   */
  private findTrackableElement(element: Element): Element | null {
    const selectors = this.config.selectors || DEFAULT_SELECTORS;

    // Add [data-lucia-track] to ensure explicit tracking works on any element type
    const allSelectors = [...selectors, '[data-lucia-track]:not([data-lucia-track="false"])'];
    const combinedSelector = allSelectors.join(', ');

    try {
      // Use native closest() for optimal performance
      const trackableElement = element.closest(combinedSelector);

      // Ensure we don't traverse beyond document.body
      if (trackableElement && trackableElement !== document.body && document.body.contains(trackableElement)) {
        return trackableElement;
      }

      return null;
    } catch (e) {
      // Fallback to iterative approach if selector is invalid
      this.logger.log('warn', 'ClickTracker: Invalid combined selector, using fallback', e);

      let current: Element | null = element;
      while (current && current !== document.body) {
        if (this.isTrackable(current)) {
          return current;
        }
        current = current.parentElement;
      }

      return null;
    }
  }

  /**
   * Check if an element matches any of the trackable selectors
   */
  private isTrackable(element: Element): boolean {
    const selectors = this.config.selectors || DEFAULT_SELECTORS;

    return selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        this.logger.log('warn', `ClickTracker: Invalid selector "${selector}"`, e);
        return false;
      }
    });
  }

  /**
   * Check if an element should be ignored
   */
  private shouldIgnore(element: Element): boolean {
    const ignoreSelectors = this.config.ignore || DEFAULT_IGNORE;

    return ignoreSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        this.logger.log('warn', `ClickTracker: Invalid ignore selector "${selector}"`, e);
        return false;
      }
    });
  }

  /**
   * Check if element is currently debounced
   * Updates debounce timer if not debounced
   */
  private isDebounced(element: Element): boolean {
    const now = Date.now();
    const lastClick = this.debounceTimers.get(element);

    if (lastClick && now - lastClick < DEFAULT_DEBOUNCE_MS) {
      return true;
    }

    this.debounceTimers.set(element, now);

    // Clean up old timers periodically
    if (this.debounceTimers.size > 100) {
      this.cleanupDebounceTimers();
    }

    return false;
  }

  /**
   * Clean up old debounce timers
   */
  private cleanupDebounceTimers(): void {
    const now = Date.now();
    const entries = Array.from(this.debounceTimers.entries());

    entries.forEach(([element, timestamp]) => {
      if (now - timestamp > DEFAULT_DEBOUNCE_MS * 2) {
        this.debounceTimers.delete(element);
      }
    });
  }

  /**
   * Extract tracking data from an element
   */
  private extractTrackingData(element: Element): ClickEventData | null {
    const identifier = this.getElementIdentifier(element);

    if (!identifier) {
      this.logger.log('warn', 'ClickTracker: Could not generate identifier for element', element);
      return null;
    }

    const data: ClickEventData = {
      button: identifier,
      elementType: this.getElementType(element),
      timestamp: Date.now(),
    };

    // Extract text content if available
    const textContent = element.textContent?.trim();
    if (textContent) {
      // Check for sensitive data in text
      if (!this.privacyGuard.containsSensitiveData(textContent)) {
        data.text = this.sanitizeText(textContent);
      }
    }

    // Extract href for links
    if (element.tagName.toLowerCase() === 'a') {
      data.href = element.getAttribute('href');
    } else {
      data.href = null;
    }

    // Extract metadata from data-lucia-meta-* attributes
    const meta = this.extractMetadata(element);
    if (meta && Object.keys(meta).length > 0) {
      data.meta = meta;
    }

    return data;
  }

  /**
   * Get a unique identifier for the element
   * Priority: data-lucia-track > id > name > aria-label > href > text (with warning)
   */
  private getElementIdentifier(element: Element): string | null {
    // 1. Explicit tracking ID
    const trackId = element.getAttribute('data-lucia-track');
    if (trackId && trackId !== 'false') {
      return trackId;
    }

    // 2. Element ID
    const id = element.getAttribute('id');
    if (id) {
      return id;
    }

    // 3. Name attribute
    const name = element.getAttribute('name');
    if (name) {
      return name;
    }

    // 4. ARIA label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // 5. For links, try href
    if (element.tagName.toLowerCase() === 'a') {
      const href = element.getAttribute('href');
      if (href) {
        return `link:${href}`;
      }
    }

    // 6. Fallback to text content (with warning)
    const textContent = element.textContent?.trim();
    if (textContent) {
      if (this.sdkConfig.debug) {
        this.logger.log(
          'warn',
          `ClickTracker: Using text content as identifier for element. Consider adding data-lucia-track attribute.`,
          element,
        );
      }
      return `text:${this.sanitizeText(textContent).substring(0, 50)}`;
    }

    // 7. Last resort: generate CSS path
    const cssPath = this.generateCSSPath(element);
    if (this.sdkConfig.debug) {
      this.logger.log(
        'warn',
        `ClickTracker: Using CSS path as identifier. Consider adding data-lucia-track attribute.`,
        element,
      );
    }
    return `path:${cssPath}`;
  }

  /**
   * Get the element type (button, link, etc.)
   */
  // eslint-disable-next-line class-methods-use-this
  private getElementType(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'a') {
      return 'link';
    }

    if (tagName === 'button') {
      return 'button';
    }

    const role = element.getAttribute('role');
    if (role) {
      return role;
    }

    return tagName;
  }

  /**
   * Sanitize text content (trim, limit length, normalize whitespace)
   */
  // eslint-disable-next-line class-methods-use-this
  private sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ').substring(0, 100);
  }

  /**
   * Generate a CSS path for an element (simplified version)
   */
  // eslint-disable-next-line class-methods-use-this
  private generateCSSPath(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      // Add ID if available
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break; // ID is unique, stop here
      }

      // Add classes if available
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 2);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Extract metadata from data-lucia-meta-* attributes
   */
  // eslint-disable-next-line class-methods-use-this
  private extractMetadata(element: Element): Record<string, string> | null {
    const meta: Record<string, string> = {};
    const { attributes } = element;

    Array.from(attributes).forEach((attr) => {
      if (attr.name.startsWith('data-lucia-meta-')) {
        const key = attr.name.replace('data-lucia-meta-', '');
        // Convert kebab-case to camelCase
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        meta[camelKey] = attr.value;
      }
    });

    return Object.keys(meta).length > 0 ? meta : null;
  }

  /**
   * Enable tracking
   */
  enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.attachListener();
      this.logger.log('log', 'ClickTracker: Enabled');
    }
  }

  /**
   * Disable tracking
   */
  disable(): void {
    this.config.enabled = false;
    this.logger.log('log', 'ClickTracker: Disabled');
    // Note: We don't remove the listener to avoid re-attachment complexity
    // The handleClick method will check config.enabled
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Remove event listener if attached
    if (this.listenerAttached && this.boundHandleClick && typeof document !== 'undefined') {
      document.removeEventListener('click', this.boundHandleClick);
      this.listenerAttached = false;
    }

    this.debounceTimers.clear();
    this.boundHandleClick = null;
    this.logger.log('log', 'ClickTracker: Destroyed');
  }
}

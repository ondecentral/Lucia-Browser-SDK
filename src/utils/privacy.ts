/**
 * Privacy utilities for automated click tracking
 * Handles sensitive element detection and text sanitization
 */

/**
 * List of sensitive input selectors that should never be tracked
 */
const SENSITIVE_SELECTORS = [
  'input[type="password"]',
  'input[type="text"][autocomplete*="cc-"]',
  'input[type="text"][autocomplete*="card"]',
  'input[type="text"][name*="card"]',
  'input[type="text"][name*="cvv"]',
  'input[type="text"][name*="cvc"]',
  'input[name*="ssn"]',
  'input[name*="social"]',
  '[data-sensitive]',
  '[data-private]',
];

/**
 * Patterns that indicate potentially sensitive text content
 */
const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, // Credit card
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email (partial PII)
];

/**
 * Privacy guard class for detecting sensitive elements and content
 */
export class PrivacyGuard {
  private sensitiveSelectors: string[];

  constructor(additionalSelectors: string[] = []) {
    this.sensitiveSelectors = [...SENSITIVE_SELECTORS, ...additionalSelectors];
  }

  /**
   * Check if an element or its ancestors are sensitive
   * @param element Element to check
   * @returns true if element should not be tracked
   */
  isSensitive(element: Element): boolean {
    // Check if element itself matches sensitive selectors
    const elementMatches = this.sensitiveSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        // Invalid selector, skip
        return false;
      }
    });

    if (elementMatches) {
      return true;
    }

    // Check if any ancestor matches sensitive selectors
    let current = element.parentElement;
    while (current) {
      const currentElement = current; // Capture for closure
      const ancestorMatches = this.sensitiveSelectors.some((selector) => {
        try {
          return currentElement.matches(selector);
        } catch (e) {
          // Invalid selector, skip
          return false;
        }
      });

      if (ancestorMatches) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  }

  /**
   * Check if text content contains sensitive patterns
   * @param text Text to check
   * @returns true if text appears to contain sensitive data
   */
  // eslint-disable-next-line class-methods-use-this
  containsSensitiveData(text: string): boolean {
    if (!text) return false;

    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
  }

  /**
   * Sanitize text by removing or masking potentially sensitive content
   * @param text Text to sanitize
   * @returns Sanitized text
   */
  // eslint-disable-next-line class-methods-use-this
  sanitizeText(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // Replace potential SSNs
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');

    // Replace potential credit card numbers
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');

    // Optionally mask emails (keep domain for context)
    sanitized = sanitized.replace(/\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, '***@$2');

    return sanitized;
  }
}

/**
 * Default privacy guard instance
 */
export const defaultPrivacyGuard = new PrivacyGuard();

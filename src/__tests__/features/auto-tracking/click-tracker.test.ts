/**
 * @jest-environment jsdom
 */

import { ClickTracker, ClickEventData } from '../../../features/auto-tracking/click-tracker';
import Logger from '../../../infrastructure/logger';
import Store from '../../../infrastructure/store';
import { Config } from '../../../types';

describe('ClickTracker', () => {
  let clickTracker: ClickTracker;
  let trackedEvents: ClickEventData[];
  let mockLogger: Logger;
  let mockConfig: Config;

  beforeEach(() => {
    // Clear the document body first
    document.body.innerHTML = '';

    // Reset tracked events
    trackedEvents = [];

    mockConfig = {
      apiKey: 'test-key',
      debug: false,
    };

    Store.dispatch({ config: mockConfig });
    mockLogger = new Logger(Store.store);

    const trackingCallback = (data: ClickEventData) => {
      trackedEvents.push(data);
    };

    clickTracker = new ClickTracker(mockConfig, { enabled: true }, trackingCallback, mockLogger);
  });

  afterEach(() => {
    if (clickTracker) {
      clickTracker.destroy();
    }
    // Clear document body after tests
    document.body.innerHTML = '';
  });

  describe('Element Identification', () => {
    it('should identify element by data-lucia-track', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'signup-btn');
      button.textContent = 'Sign Up';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('signup-btn');
    });

    it('should fallback to id if no data-lucia-track', () => {
      const button = document.createElement('button');
      button.id = 'submit-button';
      button.textContent = 'Submit';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('submit-button');
    });

    it('should fallback to name attribute', () => {
      const button = document.createElement('button');
      button.name = 'submit';
      button.textContent = 'Submit';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('submit');
    });

    it('should fallback to aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close dialog');
      button.textContent = 'X';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('Close dialog');
    });

    it('should use href for links', () => {
      const link = document.createElement('a');
      link.href = '/pricing';
      link.textContent = 'Pricing';
      document.body.appendChild(link);

      link.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('link:/pricing');
    });

    it('should fallback to text content with warning', () => {
      const button = document.createElement('button');
      button.textContent = 'Click Me';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toContain('text:Click Me');
    });
  });

  describe('Element Type Detection', () => {
    it('should detect button type', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].elementType).toBe('button');
    });

    it('should detect link type', () => {
      const link = document.createElement('a');
      link.href = '/test';
      link.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(link);

      link.click();

      expect(trackedEvents[0].elementType).toBe('link');
    });

    it('should detect role attribute', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      div.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(div);

      div.click();

      expect(trackedEvents[0].elementType).toBe('button');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract data-lucia-meta-* attributes', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'cta');
      button.setAttribute('data-lucia-meta-variant', 'primary');
      button.setAttribute('data-lucia-meta-location', 'hero');
      button.setAttribute('data-lucia-meta-experiment-id', 'exp-123');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].meta).toEqual({
        variant: 'primary',
        location: 'hero',
        experimentId: 'exp-123',
      });
    });

    it('should handle kebab-case to camelCase conversion', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      button.setAttribute('data-lucia-meta-test-value', 'abc');
      button.setAttribute('data-lucia-meta-another-test-value', 'xyz');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].meta).toEqual({
        testValue: 'abc',
        anotherTestValue: 'xyz',
      });
    });

    it('should include text content if available', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      button.textContent = 'Click Here';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].text).toBe('Click Here');
    });

    it('should include href for links', () => {
      const link = document.createElement('a');
      link.href = '/pricing';
      link.setAttribute('data-lucia-track', 'pricing-link');
      document.body.appendChild(link);

      link.click();

      expect(trackedEvents[0].href).toBe('/pricing');
    });

    it('should set href to null for non-links', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].href).toBeNull();
    });
  });

  describe('Ignore List', () => {
    it('should ignore elements with data-lucia-ignore', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-ignore', '');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(0);
    });

    it('should ignore elements with data-lucia-track="false"', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'false');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(0);
    });

    it('should respect custom ignore selectors', () => {
      // Destroy the default tracker first to avoid conflicts
      clickTracker.destroy();

      const customTracker = new ClickTracker(
        mockConfig,
        {
          enabled: true,
          ignore: ['[data-lucia-ignore]', '.no-track'],
        },
        (data) => trackedEvents.push(data),
        mockLogger,
      );

      const button = document.createElement('button');
      button.className = 'no-track';
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(0);

      customTracker.destroy();
    });
  });

  describe('Custom Selectors', () => {
    it('should track custom selectors', () => {
      // Destroy the default tracker first
      clickTracker.destroy();

      const customTracker = new ClickTracker(
        mockConfig,
        {
          enabled: true,
          selectors: ['.custom-button', '.cta'],
        },
        (data) => trackedEvents.push(data),
        mockLogger,
      );

      const div = document.createElement('div');
      div.className = 'custom-button';
      div.setAttribute('data-lucia-track', 'custom');
      document.body.appendChild(div);

      div.click();

      expect(trackedEvents).toHaveLength(1);

      customTracker.destroy();
    });

    it('should not track elements not matching selectors', () => {
      // Destroy the default tracker first
      clickTracker.destroy();

      const customTracker = new ClickTracker(
        mockConfig,
        {
          enabled: true,
          selectors: ['.only-this'],
        },
        (data) => trackedEvents.push(data),
        mockLogger,
      );

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(0);

      customTracker.destroy();
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid clicks on the same element', () =>
      new Promise<void>((done) => {
        const button = document.createElement('button');
        button.setAttribute('data-lucia-track', 'test');
        document.body.appendChild(button);

        // Click 3 times rapidly
        button.click();
        button.click();
        button.click();

        // Only first click should be tracked
        expect(trackedEvents).toHaveLength(1);

        // After debounce timeout, another click should be tracked
        setTimeout(() => {
          button.click();
          expect(trackedEvents).toHaveLength(2);
          done();
        }, 600);
      }));
  });

  describe('Event Delegation', () => {
    it('should track clicks on child elements', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'parent');

      const span = document.createElement('span');
      span.textContent = 'Click';
      button.appendChild(span);

      document.body.appendChild(button);

      // Click on the span child
      span.click();

      // Should track the parent button
      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].button).toBe('parent');
    });
  });

  describe('Enable/Disable', () => {
    it('should not track when disabled', () => {
      // Destroy the default tracker first
      clickTracker.destroy();

      const disabledTracker = new ClickTracker(
        mockConfig,
        { enabled: false },
        (data) => trackedEvents.push(data),
        mockLogger,
      );

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents).toHaveLength(0);

      disabledTracker.destroy();
    });

    it('should enable tracking after being disabled', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      document.body.appendChild(button);

      clickTracker.disable();
      button.click();
      expect(trackedEvents).toHaveLength(0);

      clickTracker.enable();
      button.click();
      expect(trackedEvents).toHaveLength(1);
    });
  });

  describe('Text Sanitization', () => {
    it('should sanitize and trim text content', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      button.textContent = '  Multiple   Spaces   Here  ';
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].text).toBe('Multiple Spaces Here');
    });

    it('should limit text length', () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test');
      button.textContent = 'A'.repeat(200);
      document.body.appendChild(button);

      button.click();

      expect(trackedEvents[0].text?.length).toBeLessThanOrEqual(100);
    });
  });
});

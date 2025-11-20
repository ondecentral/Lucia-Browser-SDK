/**
 * @jest-environment jsdom
 */

import { PrivacyGuard } from '../../utils/privacy';

describe('PrivacyGuard', () => {
  let privacyGuard: PrivacyGuard;

  beforeEach(() => {
    privacyGuard = new PrivacyGuard();
  });

  describe('isSensitive', () => {
    it('should detect password inputs as sensitive', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(privacyGuard.isSensitive(input)).toBe(true);
    });

    it('should detect credit card inputs as sensitive', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('autocomplete', 'cc-number');
      expect(privacyGuard.isSensitive(input)).toBe(true);
    });

    it('should detect inputs with card in name as sensitive', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'cardNumber';
      expect(privacyGuard.isSensitive(input)).toBe(true);
    });

    it('should detect data-sensitive attribute', () => {
      const div = document.createElement('div');
      div.setAttribute('data-sensitive', 'true');
      expect(privacyGuard.isSensitive(div)).toBe(true);
    });

    it('should detect sensitive ancestors', () => {
      const form = document.createElement('form');
      form.setAttribute('data-private', 'true');

      const button = document.createElement('button');
      form.appendChild(button);

      expect(privacyGuard.isSensitive(button)).toBe(true);
    });

    it('should return false for non-sensitive elements', () => {
      const button = document.createElement('button');
      expect(privacyGuard.isSensitive(button)).toBe(false);
    });
  });

  describe('containsSensitiveData', () => {
    it('should detect SSN patterns', () => {
      expect(privacyGuard.containsSensitiveData('My SSN is 123-45-6789')).toBe(true);
    });

    it('should detect credit card patterns', () => {
      expect(privacyGuard.containsSensitiveData('Card: 1234 5678 9012 3456')).toBe(true);
      expect(privacyGuard.containsSensitiveData('Card: 1234-5678-9012-3456')).toBe(true);
    });

    it('should detect email addresses', () => {
      expect(privacyGuard.containsSensitiveData('Contact: user@example.com')).toBe(true);
    });

    it('should return false for non-sensitive text', () => {
      expect(privacyGuard.containsSensitiveData('Click here to continue')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(privacyGuard.containsSensitiveData('')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should mask SSN patterns', () => {
      const result = privacyGuard.sanitizeText('My SSN is 123-45-6789');
      expect(result).toContain('***-**-****');
      expect(result).not.toContain('123-45-6789');
    });

    it('should mask credit card patterns', () => {
      const result = privacyGuard.sanitizeText('Card: 1234 5678 9012 3456');
      expect(result).toContain('****-****-****-****');
      expect(result).not.toContain('1234 5678 9012 3456');
    });

    it('should mask email addresses but preserve domain', () => {
      const result = privacyGuard.sanitizeText('Email: user@example.com');
      expect(result).toContain('***@example.com');
      expect(result).not.toContain('user@example.com');
    });

    it('should handle multiple sensitive patterns', () => {
      const result = privacyGuard.sanitizeText('SSN: 123-45-6789, Email: test@test.com');
      expect(result).toContain('***-**-****');
      expect(result).toContain('***@test.com');
    });

    it('should return empty string for empty input', () => {
      expect(privacyGuard.sanitizeText('')).toBe('');
    });
  });

  describe('custom selectors', () => {
    it('should accept additional sensitive selectors', () => {
      const customGuard = new PrivacyGuard(['.sensitive-class', '#sensitive-id']);

      const div = document.createElement('div');
      div.className = 'sensitive-class';
      expect(customGuard.isSensitive(div)).toBe(true);

      const span = document.createElement('span');
      span.id = 'sensitive-id';
      expect(customGuard.isSensitive(span)).toBe(true);
    });
  });
});

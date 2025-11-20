[![Commitizen-friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Lucia JavaScript Library

The Lucia JavaScript Library is a set of methods attached to a global `LuciaSDK` object intended to be used by websites wishing to send data to Lucia Ad Attribution.

## Installation

### Install via npm

You can use `npm` or `yarn` to install this library:

```
npm install lucia-sdk
```

or

```
yarn add lucia-sdk
```

### Install via CDN

You can add the following script to use global `LuciaSDK` object.

**Option 1: Auto-initialization (Recommended)**

The SDK will automatically initialize when you provide the `data-api-key` attribute:

```html
<script src="https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js" data-api-key="your-api-key-here"></script>
```

Optional configuration attributes:

- `data-api-key` (required) - Your Lucia API key
- `data-debug-url` (optional) - Custom debug endpoint URL
- `data-auto-track-clicks` (optional) - Enable automatic click tracking (`"true"` or `"false"`)
- `data-track-selectors` (optional) - Custom CSS selectors for click tracking (comma-separated)

**Option 2: Manual initialization**

Load the script without attributes and initialize programmatically:

```html
<script src="https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js"></script>
<script>
  LuciaSDK.init({
    apiKey: 'your-api-key-here',
    debugURL: 'https://custom-debug-url.com', // optional
  });
</script>
```

## Usage

### Initialize the SDK

#### For CDN (Manual Initialization)

```javascript
LuciaSDK.init({
  apiKey: 'your-api-key-here',
  debugURL: 'https://custom-debug-url.com', // optional
});
```

#### For npm/yarn Installation

```javascript
import LuciaSDK from 'lucia-sdk';

await LuciaSDK.init({
  apiKey: 'your-api-key-here',
  autoTrackClicks: true, // optional: enable automatic click tracking
});
```

#### For Next.js

The SDK seamlessly works with Next.js using both CDN auto-init and npm import:

```jsx
import Script from 'next/script';
import LuciaSDK from 'lucia-sdk';

export default function Page() {
  const handleClick = () => {
    // NPM import works with CDN-initialized instance
    LuciaSDK.buttonClick('cta-button');
  };

  return (
    <>
      <Script
        src="https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js"
        data-api-key="your-api-key-here"
        strategy="afterInteractive"
      />
      <button onClick={handleClick}>Click me</button>
    </>
  );
}
```

### Automated Click Tracking

Lucia SDK provides zero-config automated click tracking. When enabled, it automatically tracks clicks on buttons, links, and other interactive elements.

#### Enable via CDN

```html
<script
  src="https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js"
  data-api-key="your-api-key-here"
  data-auto-track-clicks="true"
></script>
```

#### Enable Programmatically

```javascript
await LuciaSDK.init({
  apiKey: 'your-api-key-here',
  autoTrackClicks: true, // Enable with defaults
});

// Or with custom configuration
await LuciaSDK.init({
  apiKey: 'your-api-key-here',
  autoTrackClicks: {
    enabled: true,
    selectors: ['button', '.cta', '[data-track]'], // Custom selectors
    ignore: ['.no-track'], // Elements to ignore
  },
});
```

#### Element-Level Control

Add tracking attributes to specific elements:

```html
<!-- Explicit tracking with custom identifier -->
<button data-lucia-track="signup-cta">Sign Up</button>

<!-- Add metadata to tracked clicks -->
<button data-lucia-track="purchase-btn" data-lucia-meta-variant="primary" data-lucia-meta-location="hero">
  Buy Now
</button>

<!-- Ignore specific elements -->
<button data-lucia-ignore>Don't Track This</button>
```

**Default Tracked Elements:**

- `<button>` elements
- `<a>` elements with `href` attribute
- Elements with `role="button"`
- Any element with `data-lucia-track` attribute

**Privacy Features:**

- Automatically ignores password inputs
- Skips credit card fields
- Filters sensitive data from text content
- Respects `data-lucia-ignore` attribute

### Track events

Page views, conversions, and user information can be tracked using the following methods:

```javascript
LuciaSDK.userInfo('john@email.com', {
  //user details
  first_name: 'John',
  last_name: 'Doe',
  phone: '123-456-7890',
});

LuciaSDK.pageView('landing-page');

LuciaSDK.trackConversion(
  'purchase', // event tag
  500, // amount
  {
    //event details
    product_id: 'bag_123',
    quantity: 1,
    brand: 'Nike',
  },
);

// Manual click tracking (optional with auto-tracking enabled)
LuciaSDK.buttonClick('cta-button', {
  elementType: 'button',
  text: 'Sign Up Now',
  meta: { variant: 'primary', location: 'hero' },
});

LuciaSDK.sendWalletInfo('0x1234567890', 59141);
```

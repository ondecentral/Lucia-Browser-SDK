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

LuciaSDK.buttonClick('cta-button');

LuciaSDK.sendWalletInfo('0x1234567890', 59141);
```

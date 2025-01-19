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

```
<script src="https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js"></script>
```

## Usage

### Initialize the SDK

```javascript
LuciaSDK.init({
  apiKey,
});
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

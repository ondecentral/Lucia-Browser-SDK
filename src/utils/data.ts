import CryptoJS from 'crypto-js';

import { getConnectedWalletAddress, getWalletName, getExtendedProviderInfo } from './evm';
import { getConnectedSolanaWallet, getSolanaWalletName } from './solana';

export async function udata() {
  let pluginsLength;
  let plugins;
  let pluginNames;

  try {
    pluginsLength = navigator.plugins.length;
    plugins = navigator.plugins;
    pluginNames = [];
    for (let i = 0; i < pluginsLength; i += 1) {
      pluginNames[i] = plugins[i].name;
    }
  } catch (e) {
    console.log((e as Error).message);
  }

  // not yet working

  // const { ApplePaySession, matchMedia } = window
  // var applePay;
  // if (typeof ApplePaySession?.canMakePayments !== 'function') {
  //     applePay = false
  // }

  // try {
  //    ApplePaySession.canMakePayments() ? applePay = true : applePay = false
  // } catch (error) {
  //    console.log(error.message)
  // }
  let colorDepth;
  try {
    colorDepth = window.screen.colorDepth;
  } catch (e) {
    console.log((e as Error).message);
  }

  // function doesMatch(value) {
  //     return matchMedia(`(prefers-contrast: ${value})`).matches
  // }
  //  var contrast;
  // try{
  //     if (doesMatch('no-preference')) {
  //         contrast = 'None';
  //       }
  //       if (doesMatch('high') || doesMatch('more')) {
  //         contrast = 'More';
  //       }
  //       if (doesMatch('low') || doesMatch('less')) {
  //         contrast = 'Less';
  //       }
  //       if (doesMatch('forced')) {
  //         contrast = 'ForcedColors';
  //       }
  // }catch(e){
  //     console.log((e as Error).message)
  // }

  // var gamut;
  // for (const g of ['rec2020', 'p3', 'srgb']) {
  //     if (matchMedia(`(color-gamut: ${g})`).matches) {
  //         gamut = g
  //     }
  //   }

  let indexedDB;
  try {
    indexedDB = window.indexedDB;
  } catch (e) {
    console.log((e as Error).message);
  }

  let localStorage;
  let openDB;

  try {
    localStorage = window.localStorage;
    openDB = (window as any).openDatabase;
  } catch (e) {
    console.log((e as Error).message);
  }
  // var sourceId;

  // //private click measurement

  // try{
  //     const link = document.createElement('a')
  //     sourceId = link.attributionSourceId ?? link.attributionsourceid
  // }catch(e){
  //     console.log((e as Error).message)
  // }

  let mem;
  try {
    mem = (navigator as any).deviceMemory;
  } catch (e) {
    console.log((e as Error).message);
  }

  let cores;
  try {
    cores = navigator.hardwareConcurrency;
  } catch (e) {
    console.log((e as Error).message);
  }
  let lang;
  try {
    lang = navigator.language;
  } catch (e) {
    console.log((e as Error).message);
  }
  let scale;
  try {
    scale = window.devicePixelRatio;
  } catch (e) {
    console.log((e as Error).message);
  }

  let encoding;
  try {
    encoding = (TextDecoder as any).encoding;
  } catch (e) {
    console.log((e as Error).message);
  }

  let timeZone;
  const date = new Date();
  try {
    timeZone = -date.getTimezoneOffset() / 60;
  } catch (e) {
    console.log((e as Error).message);
  }

  let screenWidth;
  try {
    screenWidth = window.screen.width;
  } catch (e) {
    console.log((e as Error).message);
  }
  let screenHeight;
  try {
    screenHeight = window.screen.height;
  } catch (e) {
    console.log((e as Error).message);
  }

  let navPer;
  try {
    navPer = (navigator.permissions as any).webglVersion;
  } catch (e) {
    console.log((e as Error).message);
  }

  let renderedPer;
  try {
    renderedPer = (navigator.permissions as any).RENDERER;
  } catch (e) {
    console.log((e as Error).message);
  }

  let cpuClass;
  try {
    cpuClass = (navigator as any).cpuClass;
  } catch (e) {
    console.log((e as Error).message);
  }

  let geoPer;
  try {
    geoPer = (navigator.permissions as any).geolocation;
  } catch (e) {
    console.log((e as Error).message);
  }

  let availHeight;

  try {
    availHeight = window.screen.availHeight;
  } catch (e) {
    console.log((e as Error).message);
  }

  let availWidth;
  try {
    availWidth = window.screen.availWidth;
  } catch (e) {
    console.log((e as Error).message);
  }

  let screenOrientationType;
  try {
    screenOrientationType = window.screen.orientation.type;
  } catch (e) {
    console.log((e as Error).message);
  }

  let screenOrientationAngle;
  try {
    screenOrientationAngle = window.screen.orientation.angle;
  } catch (e) {
    console.log((e as Error).message);
  }

  let src;
  let hVal;
  // canvas
  try {
    const canvas = document.createElement('canvas');
    canvas.id = 'canvasLucia';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.rect(20, 20, 150, 100);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.fillStyle = 'rgb(0,255,255)';
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      const txt = 'abz190#$%^@£éú';
      ctx.textBaseline = 'top';
      ctx.font = '17px "Arial 17"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgb(255,5,5)';
      ctx.rotate(0.03);
      ctx.fillText(txt, 4, 17);
      ctx.fillStyle = 'rgb(155,255,5)';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'red';
      ctx.fillRect(20, 12, 100, 5);
      src = canvas.toDataURL();
      hVal = CryptoJS.SHA256(src).toString(CryptoJS.enc.Hex);
    }
  } catch (e) {
    console.log((e as Error).message);
  }

  // to check if device is touch enabled
  function fingerprint_touch() {
    let bolTouchEnabled;
    let bolOut;

    bolTouchEnabled = false;
    bolOut = null;

    try {
      if (document.createEvent('TouchEvent')) {
        bolTouchEnabled = true;
      }
      bolOut = bolTouchEnabled;
      return bolOut;
    } catch (ignore) {
      bolOut = bolTouchEnabled;
      return bolOut;
    }
  }

  function metaMaskAvailable() {
    try {
      if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
        return true;
      }
    } catch (e) {
      console.log((e as Error).message);
    }
    return false;
  }
  const solAddress = await getConnectedSolanaWallet();
  const ethAddress = await getConnectedWalletAddress();
  const walletName = await getWalletName();
  const solWalletName = await getSolanaWalletName();
  const providerInfo = await getExtendedProviderInfo();

  const url = new URL(window.location.href);
  const redirectHash = url.searchParams.get('lucia');

  return {
    redirectHash,
    data: {
      isMetaMaskInstalled: metaMaskAvailable(),
      walletAddress: ethAddress,
      solanaAddress: solAddress,
      providerInfo,
      walletName,
      solWalletName,
      touch: fingerprint_touch(),
      memory: mem,
      cores,
      language: lang,
      devicePixelRatio: scale,
      encoding,
      timezone: timeZone,
      pluginsLength,
      pluginNames,
      screenWidth,
      screenHeight,
      navPer,
      renderedPer,
      geoPer,
      availHeight,
      availWidth,
      screenOrientationType,
      screenOrientationAngle,
      uniqueHash: hVal,
      colorDepth,
      cpuClass,
      indexedDB,
      openDB,
      localStorage,
    },
  };
}

export function getUtmParams() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const utmObject: Record<string, string> = {};

  params.forEach((value, key) => {
    if (key.startsWith('utm_') || key.includes('id') || key === 'ref' || key === 'source') {
      utmObject[key] = value;
    }
  });

  return utmObject;
}

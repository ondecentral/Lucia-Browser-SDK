import { LuciaSDKClass } from './types';

interface Window {
  ethereum?: any; // Or a more specific type if available
  LuciaSDK?: SDK;
  __luciaInstance?: LuciaSDKClass;
}

export class LuciaSDK {
  apiKey: string;

  clientId: string;

  constructor(apiKey: string, clientId: string) {
    this.apiKey = apiKey;
    this.clientId = clientId;
  }

  debug() {
    // eslint-disable-next-line no-console
    console.log('debug', {
      apiKey: this.apiKey,
      clientId: this.clientId,
    });
  }
}

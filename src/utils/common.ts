export function getchainId(walletName: WappetProviders) {
  if (walletName === 'Phantom') {
    return 101;
  } else if (walletName === 'Metamask') {
    return 1;
  } else throw ' wallet not supported';
}

type WappetProviders = 'Phantom' | 'Metamask';

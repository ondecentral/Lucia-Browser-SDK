import { Config } from '../types';

interface State {
  isInitialized: boolean;
  config: Config | null;
  session: {
    clientSessionId: string | null;
    serverSessionId: string | null;
  } | null;
}

const initialState: State = {
  isInitialized: false,
  config: null,
  session: null,
};

class Store {
  static store = initialState;

  static dispatch(payload: Partial<State>) {
    (Object.keys(payload) as Array<keyof State>).forEach((key: keyof State) => {
      if (Object.keys(Store.store).includes(key)) {
        const value = payload[key]!;
        // @ts-ignore
        Store.store[key] = typeof value === 'object' ? (Array.isArray(value) ? [...value] : { ...value }) : value;
      }
    });
  }
}

export default Store;

declare global {
  interface Window {
    simpleCart?: any;
  }
}

export interface PrintfulProduct {
  id: string;
  name: string;
}

export {};

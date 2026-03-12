declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request<T = unknown>(args: {
        method: string;
        params?: unknown[];
      }): Promise<T>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: any[]) => void
      ) => void;
    };
  }
}

export {};

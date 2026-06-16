import { Eip1193Provider } from 'ethers';

interface MetaMaskEthereumProvider extends Eip1193Provider {
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskEthereumProvider;
  }
}

export {};

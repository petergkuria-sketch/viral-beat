import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider, Eip1193Provider } from 'ethers';
import type {} from '../types/ethereum';

// Base Sepolia testnet configuration
const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in decimal
const BASE_SEPOLIA_CONFIG = {
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
};

// VBToken contract ABI (minimal for balance and transfer)
const VBT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  provider: BrowserProvider | null;
  vbtBalance: string;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBaseSepolia: () => Promise<void>;
  getVBTBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
  contractAddress?: string; // VBToken contract address (optional for now)
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children, contractAddress }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [vbtBalance, setVbtBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const getEthereum = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  };

  // Connect wallet
  const connectWallet = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const newProvider = new BrowserProvider(ethereum);
      const network = await newProvider.getNetwork();

      setAccount(accounts[0]);
      setChainId(`0x${network.chainId.toString(16)}`);
      setProvider(newProvider);

      // Check if on Base Sepolia
      if (`0x${network.chainId.toString(16)}` !== BASE_SEPOLIA_CHAIN_ID) {
        console.warn('Not on Base Sepolia network');
      }

      // Get VBT balance if contract address is provided
      if (contractAddress && accounts[0]) {
        await getVBTBalanceForAccount(newProvider, accounts[0]);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setVbtBalance('0');
    setError(null);
  };

  // Switch to Base Sepolia network
  const switchToBaseSepolia = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      setError(null);
      // Try to switch to Base Sepolia
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_CONFIG],
          });
        } catch (addError: any) {
          console.error('Error adding Base Sepolia network:', addError);
          setError(addError.message || 'Failed to add Base Sepolia network');
        }
      } else {
        console.error('Error switching network:', switchError);
        setError(switchError.message || 'Failed to switch network');
      }
    }
  };

  // Get VBT balance for a specific account
  const getVBTBalanceForAccount = async (prov: BrowserProvider, addr: string) => {
    if (!contractAddress) {
      setVbtBalance('0');
      return;
    }

    try {
      const contract = new ethers.Contract(contractAddress, VBT_ABI, prov);
      const balance = await contract.balanceOf(addr);
      const formattedBalance = ethers.formatEther(balance);
      setVbtBalance(formattedBalance);
    } catch (err) {
      console.error('Error fetching VBT balance:', err);
      setVbtBalance('0');
    }
  };

  // Get VBT balance for current account
  const getVBTBalance = async () => {
    if (!provider || !account) return;
    await getVBTBalanceForAccount(provider, account);
  };

  // Listen for account changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accountsArray[0]);
        if (provider && contractAddress) {
          getVBTBalanceForAccount(provider, accountsArray[0]);
        }
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      setChainId(newChainId as string);
      // Reload to avoid state inconsistencies
      window.location.reload();
    };

    if (ethereum.on && ethereum.removeListener) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [provider, contractAddress]);

  // Auto-connect if previously connected
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length > 0) {
          connectWallet();
        }
      })
      .catch(console.error);
  }, []);

  const value: Web3ContextType = {
    account,
    chainId,
    provider,
    vbtBalance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToBaseSepolia,
    getVBTBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

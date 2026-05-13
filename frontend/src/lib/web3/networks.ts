export interface NetworkConfig {
  chainId: number;
  hexChainId: string;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  currency: { name: string; symbol: string; decimals: 18 };
}

const HARDHAT_LOCAL: NetworkConfig = {
  chainId: 31337,
  hexChainId: "0x7a69",
  name: "Hardhat Local",
  rpcUrl: "http://localhost:8545",
  currency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const SEPOLIA: NetworkConfig = {
  chainId: 11155111,
  hexChainId: "0xaa36a7",
  name: "Sepolia",
  rpcUrl: "https://rpc.sepolia.org",
  blockExplorer: "https://sepolia.etherscan.io",
  currency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
};

export const KNOWN_NETWORKS: Record<number, NetworkConfig> = {
  [HARDHAT_LOCAL.chainId]: HARDHAT_LOCAL,
  [SEPOLIA.chainId]: SEPOLIA,
};

const ENV_DEFAULT = Number(import.meta.env?.PUBLIC_DEFAULT_CHAIN_ID);
export const DEFAULT_NETWORK: NetworkConfig =
  KNOWN_NETWORKS[ENV_DEFAULT] ?? HARDHAT_LOCAL;

export function networkFor(chainId: number | null): NetworkConfig | null {
  return chainId == null ? null : KNOWN_NETWORKS[chainId] ?? null;
}

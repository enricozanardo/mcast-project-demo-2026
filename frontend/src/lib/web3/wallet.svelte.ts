import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { DEFAULT_NETWORK, networkFor, type NetworkConfig } from "./networks";

class WalletState {
  account = $state<string | null>(null);
  chainId = $state<number | null>(null);
  provider = $state<BrowserProvider | null>(null);
  signer = $state<JsonRpcSigner | null>(null);
  connecting = $state(false);
  error = $state<string | null>(null);

  get isConnected(): boolean {
    return this.account !== null && this.provider !== null;
  }

  get network(): NetworkConfig | null {
    return networkFor(this.chainId);
  }

  get wrongNetwork(): boolean {
    return this.isConnected && this.network === null;
  }

  async connect(targetChainId: number = DEFAULT_NETWORK.chainId): Promise<void> {
    if (typeof window === "undefined" || !window.ethereum) {
      this.error = "MetaMask not detected. Install the browser extension.";
      return;
    }
    this.connecting = true;
    this.error = null;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
      this.provider = provider;
      this.account = accounts[0] ?? null;

      const net = await provider.getNetwork();
      this.chainId = Number(net.chainId);

      if (this.chainId !== targetChainId) {
        await this.switchTo(targetChainId);
      }

      this.signer = await provider.getSigner();
      this._installListeners();
    } catch (e) {
      this.error = mapError(e);
    } finally {
      this.connecting = false;
    }
  }

  disconnect(): void {
    this.account = null;
    this.signer = null;
    this.provider = null;
    this.chainId = null;
    this.error = null;
  }

  async switchTo(chainId: number): Promise<void> {
    const cfg = networkFor(chainId);
    if (!cfg) {
      this.error = `Unknown chainId ${chainId}`;
      return;
    }
    if (typeof window === "undefined" || !window.ethereum) return;
    const eth = window.ethereum;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: cfg.hexChainId }],
      });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: cfg.hexChainId,
              chainName: cfg.name,
              rpcUrls: [cfg.rpcUrl],
              nativeCurrency: cfg.currency,
              blockExplorerUrls: cfg.blockExplorer ? [cfg.blockExplorer] : undefined,
            },
          ],
        });
      } else {
        this.error = mapError(e);
      }
    }
  }

  private _listenersInstalled = false;
  private _installListeners() {
    if (this._listenersInstalled || typeof window === "undefined") return;
    const eth = window.ethereum;
    if (!eth?.on) return;

    eth.on("accountsChanged", (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? [];
      this.account = accounts[0] ?? null;
      if (!this.account) this.disconnect();
    });
    eth.on("chainChanged", (...args: unknown[]) => {
      const hex = args[0] as string;
      this.chainId = Number.parseInt(hex, 16);

      if (this.provider) {
        this.provider.getSigner().then((s) => (this.signer = s));
      }
    });
    this._listenersInstalled = true;
  }
}

function mapError(e: unknown): string {
  const err = e as { code?: number; message?: string };
  if (err.code === 4001) return "Request rejected in MetaMask.";
  if (err.code === -32002) return "MetaMask is already processing a request.";

  if (err.message?.includes("same RPC endpoint")) {
    return (
      "MetaMask already has a network using this RPC URL " +
      "(usually the preinstalled \"Localhost 8545\"). " +
      "Open MetaMask -> Settings -> Networks, delete that entry, " +
      "then click Connect again."
    );
  }
  return err.message ?? String(e);
}

export const wallet = new WalletState();

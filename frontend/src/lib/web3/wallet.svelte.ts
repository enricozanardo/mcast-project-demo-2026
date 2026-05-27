import { BrowserProvider, type Eip1193Provider, type JsonRpcSigner } from "ethers";
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
      const eth = window.ethereum;
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      this.account = accounts[0] ?? null;

      const currentChainId = await this._readChainId(eth);
      if (currentChainId !== targetChainId) {
        await this._switchOrAddChain(eth, targetChainId);
      }

      // Build provider AFTER the chain switch so ethers caches the
      // correct network. Otherwise the next call throws
      // "network changed: <old> => <new>".
      await this._rebuildProvider(eth);
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
    if (typeof window === "undefined" || !window.ethereum) return;
    const eth = window.ethereum;
    try {
      await this._switchOrAddChain(eth, chainId);
    } catch (e) {
      this.error = mapError(e);
      return;
    }
    // Rebuild on switch too, in case someone calls switchTo() outside of connect().
    if (this.account) {
      await this._rebuildProvider(eth);
    }
  }

  private async _switchOrAddChain(eth: Eip1193Provider, chainId: number): Promise<void> {
    const cfg = networkFor(chainId);
    if (!cfg) {
      throw new Error(`Unknown chainId ${chainId}`);
    }
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
        throw e;
      }
    }
  }

  private async _readChainId(eth: Eip1193Provider): Promise<number> {
    const hex = (await eth.request({ method: "eth_chainId" })) as string;
    return Number.parseInt(hex, 16);
  }

  private async _rebuildProvider(eth: Eip1193Provider): Promise<void> {
    const chainId = await this._readChainId(eth);
    this.chainId = chainId;
    const provider = new BrowserProvider(eth, chainId);
    this.provider = provider;
    try {
      this.signer = await provider.getSigner();
    } catch {
      this.signer = null;
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
      const newChainId = Number.parseInt(hex, 16);
      // Recreate the provider so ethers' cached network matches the live
      // chain; otherwise every subsequent call rejects with
      // "network changed: <old> => <new>".
      this.chainId = newChainId;
      if (window.ethereum && this.account) {
        void this._rebuildProvider(window.ethereum);
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

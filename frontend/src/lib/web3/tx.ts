import {
  JsonRpcApiProvider,
  JsonRpcProvider,
  type Contract,
  type Eip1193Provider,
  type JsonRpcSigner,
  type Log,
  type LogDescription,
  type TransactionReceipt,
  Interface,
} from "ethers";
import { networkFor } from "./networks";


export interface TxLikeError {
  code?: number | string;
  reason?: string;
  shortMessage?: string;
  message?: string;
  info?: { error?: { message?: string } };
}


export function mapTxError(e: unknown): string {
  if (e == null) return "Transaction failed.";
  if (typeof e === "string") return e;
  if (typeof e !== "object") return String(e);
  const err = e as TxLikeError;


  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return "You rejected the transaction in MetaMask.";
  }
  if (err.code === -32002) {
    return "MetaMask is already showing a request. Open it and finish that one first.";
  }
  // ethers v6 wraps revert reasons in `shortMessage` / `reason`.
  if (err.shortMessage) return err.shortMessage;
  if (err.reason) return err.reason;
  // Hardhat node sometimes nests revert info here:
  const inner = err.info?.error?.message;
  if (inner) return inner;
  return err.message ?? "Transaction failed.";
}


export function explorerTx(chainId: number | null, txHash: string | null): string | null {
  if (!chainId || !txHash) return null;
  const cfg = networkFor(chainId);
  if (!cfg?.blockExplorer) return null;
  return `${cfg.blockExplorer}/tx/${txHash}`;
}


export type TxStatus = "idle" | "sending" | "mining" | "success" | "error";


export function toHexQuantity(v: bigint): string {
  // EIP-1474 quantity encoding: "0x0" for zero, no leading zeros otherwise.
  if (v === 0n) return "0x0";
  if (v < 0n) throw new Error("negative quantity");
  return "0x" + v.toString(16);
}

export interface SendTxOptions {
  /** ETH (in wei) to attach to the transaction. */
  value?: bigint;
  /** Override gas limit (else we estimate via the RPC and pad 20%). */
  gasLimit?: bigint;
}

/**
 * Resolve the chain's HTTP RPC URL from the signer's provider, so we can do
 * read-side work (estimateGas, getTransactionCount) without going through
 * MetaMask. MetaMask's caches go stale after a hardhat restart and surface
 * as "Internal JSON-RPC error" on otherwise-valid txs.
 */
function readRpcUrlFor(signer: JsonRpcSigner): string | null {
  const provider = signer.provider as JsonRpcApiProvider | null;
  if (!provider) return null;
  try {
    const chainId = Number(provider._network.chainId);
    return networkFor(chainId)?.rpcUrl ?? null;
  } catch {
    return null;
  }
}

export async function sendTx(
  contract: Contract,
  method: string,
  args: ReadonlyArray<unknown>,
  opts: SendTxOptions = {},
): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask provider not available.");
  }
  const eth = window.ethereum as Eip1193Provider;

  const signer = contract.runner as JsonRpcSigner | null;
  if (!signer || typeof signer.getAddress !== "function") {
    throw new Error("Contract is not bound to a signer.");
  }
  const from = (await signer.getAddress()).toLowerCase();
  const to = await contract.getAddress();
  const data = contract.interface.encodeFunctionData(method, args as unknown[]);

  // Use a direct RPC connection for the read-only prep work (gas + nonce).
  // This sidesteps MetaMask's stale-cache "Internal JSON-RPC error" after a
  // local node restart, and gives us a fully-specified tx for MetaMask to
  // just sign and broadcast.
  const rpcUrl = readRpcUrlFor(signer);
  const readProvider = rpcUrl ? new JsonRpcProvider(rpcUrl) : null;

  try {
    let gasLimit = opts.gasLimit;
    if (gasLimit === undefined) {
      const estimate = readProvider
        ? await readProvider.estimateGas({
            from,
            to,
            data,
            ...(opts.value !== undefined ? { value: opts.value } : {}),
          })
        : await contract.getFunction(method).estimateGas(...args, {
            from,
            ...(opts.value !== undefined ? { value: opts.value } : {}),
          });
      gasLimit = (estimate * 12n) / 10n;
    }

    const params: Record<string, string> = {
      from,
      to,
      data,
      gas: toHexQuantity(gasLimit),
    };
    if (opts.value !== undefined) {
      params.value = toHexQuantity(opts.value);
    }

    // Pin the nonce from the live chain so MetaMask's tracker (which can
    // be one step behind after a hardhat restart) doesn't reject the tx.
    if (readProvider) {
      const nonce = await readProvider.getTransactionCount(from, "pending");
      params.nonce = toHexQuantity(BigInt(nonce));
    }

    const hash = (await eth.request({
      method: "eth_sendTransaction",
      params: [params],
    })) as string;

    return hash;
  } finally {
    readProvider?.destroy();
  }
}


export async function waitReceipt(
  provider: { waitForTransaction(h: string): Promise<TransactionReceipt | null> },
  hash: string,
): Promise<TransactionReceipt> {
  const receipt = await provider.waitForTransaction(hash);
  if (!receipt) throw new Error(`Transaction ${hash} was dropped.`);
  return receipt;
}

export function findEvent(
  iface: Interface,
  receipt: TransactionReceipt,
  eventName: string,
): LogDescription | null {
  for (const log of receipt.logs as ReadonlyArray<Log>) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === eventName) return parsed;
    } catch {
      // Not one of ours; skip.
    }
  }
  return null;
}

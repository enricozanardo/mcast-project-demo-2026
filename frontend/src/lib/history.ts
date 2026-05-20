
import type { EventLog, Log } from "ethers";

export type HistoryKind = "RobotMinted" | "PriceUpdated" | "RobotPurchased";

export interface HistoryEntry {
  kind: HistoryKind;
  blockNumber: number;
  txHash: string;
  args: Record<string, unknown>;
}

/** A minimal log shape so we can unit-test without ethers types. */
export interface HistoryLog {
  fragment: { name: string };
  blockNumber: number;
  transactionIndex: number;
  transactionHash: string;
  args: ReadonlyArray<unknown> & Record<string, unknown>;
}

export function buildHistory(
  minted: HistoryLog[],
  updates: HistoryLog[],
  sales: HistoryLog[],
): HistoryEntry[] {
  return [...minted, ...updates, ...sales]
    .sort(
      (a, b) =>
        a.blockNumber - b.blockNumber ||
        a.transactionIndex - b.transactionIndex,
    )
    .map((log) => ({
      kind: log.fragment.name as HistoryKind,
      blockNumber: log.blockNumber,
      txHash: log.transactionHash,
      args: extractArgs(log.args),
    }));
}

function extractArgs(args: ReadonlyArray<unknown> & Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(args)) {
    if (/^\d+$/.test(k)) continue; // skip positional dupes
    out[k] = args[k];
  }
  return out;
}


export function asHistoryLogs(events: ReadonlyArray<EventLog | Log>): HistoryLog[] {
  return (events as unknown as HistoryLog[]).filter((e) => "fragment" in e && e.fragment);
}

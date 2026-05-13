import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ADDR_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "frontend",
  "src",
  "lib",
  "contracts",
  "addresses.json",
);

export interface DeployedAddresses {
  RobotCredits: string;
  TokenSale: string;
  RobotMarketplace: string;
}

export function persistAddresses(chainId: number, addrs: DeployedAddresses): void {
  let current: Record<string, Record<string, string>> = {};
  if (existsSync(ADDR_FILE)) {
    current = JSON.parse(readFileSync(ADDR_FILE, "utf8"));
  } else {
    mkdirSync(dirname(ADDR_FILE), { recursive: true });
  }
  current[String(chainId)] = { ...addrs };
  writeFileSync(ADDR_FILE, JSON.stringify(current, null, 2) + "\n");
  console.log(`[deploy] wrote chainId ${chainId} addresses to ${ADDR_FILE}`);
}

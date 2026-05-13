import { Contract, type ContractRunner } from "ethers";
import RobotCreditsArtifact from "$lib/contracts/RobotCredits.json";
import TokenSaleArtifact from "$lib/contracts/TokenSale.json";
import RobotMarketplaceArtifact from "$lib/contracts/RobotMarketplace.json";
import addresses from "$lib/contracts/addresses.json";

type AddressMap = Record<string, Record<string, string>>;
const ADDR = addresses as AddressMap;

export function addressFor(
  chainId: number,
  name: "RobotCredits" | "TokenSale" | "RobotMarketplace",
): string {
  const byChain = ADDR[String(chainId)];
  if (!byChain) throw new Error(`No deployment for chainId ${chainId}`);
  const addr = byChain[name];
  if (!addr || /^0x0+$/.test(addr)) {
    throw new Error(
      `Address for ${name} on chainId ${chainId} is not set. ` +
        "Did you run scripts/export-abi.ts after deploying?",
    );
  }
  return addr;
}

export function robotCredits(runner: ContractRunner, chainId: number): Contract {
  return new Contract(addressFor(chainId, "RobotCredits"), RobotCreditsArtifact.abi, runner);
}

export function tokenSale(runner: ContractRunner, chainId: number): Contract {
  return new Contract(addressFor(chainId, "TokenSale"), TokenSaleArtifact.abi, runner);
}

export function robotMarketplace(runner: ContractRunner, chainId: number): Contract {
  return new Contract(
    addressFor(chainId, "RobotMarketplace"),
    RobotMarketplaceArtifact.abi,
    runner,
  );
}

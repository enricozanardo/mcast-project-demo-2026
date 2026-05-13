/**
 * Reads the freshly compiled artifacts from `artifacts/contracts/*.sol/*.json`
 * and writes lean ABI files into the SvelteKit front-end's
 * `frontend/src/lib/contracts/` folder.
 *
 *   npx hardhat run scripts/export-abi.ts
 *
 * Run this AFTER `npx hardhat compile` whenever the contract
 * interface changes. You do *not* need to re-run it after a redeploy:
 * `deploy-local.ts` and `deploy-sepolia.ts` write `addresses.json`
 * themselves, and the ABIs only depend on the Solidity source.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const artifactsDir = resolve(here, "..", "..", "artifacts", "src", "contracts");
const outDir = resolve(here, "..", "..", "frontend", "src", "lib", "contracts");

const CONTRACTS = [
  { name: "RobotCredits",     fileName: "RobotCredits.sol" },
  { name: "TokenSale",        fileName: "TokenSale.sol" },
  { name: "RobotMarketplace", fileName: "RobotMarketplace.sol" },
];

function main() {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  for (const c of CONTRACTS) {
    const artifactPath = resolve(artifactsDir, c.fileName, `${c.name}.json`);
    if (!existsSync(artifactPath)) {
      console.error(
        `[export-abi] missing artifact ${artifactPath}\n` +
          `             run 'npx hardhat compile' first.`,
      );
      process.exit(1);
    }
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
      contractName: string;
      abi: unknown[];
    };
    const out = resolve(outDir, `${c.name}.json`);
    writeFileSync(
      out,
      JSON.stringify({ contractName: artifact.contractName, abi: artifact.abi }, null, 2),
    );
    console.log(`[export-abi] ${c.name} -> ${out}`);
  }

  // Make sure the addresses file exists so the front-end imports don't
  // break before the first deploy. The deploy scripts overwrite it with
  // real addresses on every run.
  const addrFile = resolve(outDir, "addresses.json");
  if (!existsSync(addrFile)) {
    writeFileSync(
      addrFile,
      JSON.stringify(
        {
          "31337": {
            RobotCredits: "0x0000000000000000000000000000000000000000",
            TokenSale: "0x0000000000000000000000000000000000000000",
            RobotMarketplace: "0x0000000000000000000000000000000000000000",
          },
        },
        null,
        2,
      ),
    );
    console.log(
      `[export-abi] created placeholder ${addrFile}; run deploy-local.ts to populate it.`,
    );
  } else {
    console.log(`[export-abi] kept existing ${addrFile}`);
  }
}

main();

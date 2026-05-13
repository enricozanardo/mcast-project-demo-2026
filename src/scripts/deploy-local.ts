import { network } from "hardhat";
import { persistAddresses } from "./lib/persist-addresses.ts";

const HARDHAT_CHAIN_ID = 31337;

const TOKENS_PER_ETH = 100n;

// A tiny on-chain SVG; we encode it as a `data:image/svg+xml;base64,...`
// URI directly inside the script so we don't need IPFS or a backend.
function svgFor(name: string, accent: string): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#0F4C81"/>
  <rect x="40" y="60" width="120" height="100" rx="14" fill="${accent}"/>
  <circle cx="80"  cy="100" r="10" fill="#fff"/>
  <circle cx="120" cy="100" r="10" fill="#fff"/>
  <rect x="70" y="135" width="60" height="10" fill="#fff" rx="4"/>
  <text x="100" y="40" text-anchor="middle"
        font-family="monospace" font-size="14" fill="#fff">${name}</text>
</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const DEMO_ROBOTS = [
  { name: "RX-7",   accent: "#D97706", price: 25n }, // 25 RCRED
  { name: "BB-9",   accent: "#10B981", price: 50n },
  { name: "M-808",  accent: "#EF4444", price: 75n },
];

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log(
    "Deployer ETH balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
  );

  // 1. RobotCredits
  const Credits = await ethers.getContractFactory("RobotCredits");
  const token = await Credits.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("RobotCredits deployed at:", tokenAddress);

  // 2. TokenSale
  const Sale = await ethers.getContractFactory("TokenSale");
  const sale = await Sale.deploy(tokenAddress, TOKENS_PER_ETH, deployer.address);
  await sale.waitForDeployment();
  const saleAddress = await sale.getAddress();
  console.log("TokenSale     deployed at:", saleAddress);

  // 3. Hand minting authority over to TokenSale.
  const tx = await token.transferOwnership(saleAddress);
  await tx.wait();
  console.log("RobotCredits ownership transferred to TokenSale");

  // 4. Marketplace (paid in RCRED).
  const Mkt = await ethers.getContractFactory("RobotMarketplace");
  const mkt = await Mkt.deploy(tokenAddress);
  await mkt.waitForDeployment();
  const mktAddress = await mkt.getAddress();
  console.log("RobotMarketplace deployed at:", mktAddress);

  // 5. Seed 3 demo robots so the front-end has something to render.
  for (const r of DEMO_ROBOTS) {
    const priceWei = ethers.parseEther(r.price.toString());
    const seedTx = await mkt.mintRobot(r.name, svgFor(r.name, r.accent), priceWei);
    const receipt = await seedTx.wait();
    console.log(`  minted '${r.name}' (price ${r.price} RCRED) tx=${receipt?.hash}`);
  }

  persistAddresses(HARDHAT_CHAIN_ID, {
    RobotCredits: tokenAddress,
    TokenSale: saleAddress,
    RobotMarketplace: mktAddress,
  });

  console.log("\n--- Summary ----------------------------------------------");
  console.log(`RCRED       : ${tokenAddress}`);
  console.log(`Sale        : ${saleAddress}`);
  console.log(`Marketplace : ${mktAddress}`);
  console.log(`Rate        : 1 ETH = ${TOKENS_PER_ETH} RCRED`);
  console.log(`Robots      : ${DEMO_ROBOTS.length} seeded`);
  console.log("----------------------------------------------------------");
  console.log("Addresses persisted -- next, regenerate ABIs (only needed");
  console.log("after a contract change):");
  console.log("  npx hardhat run scripts/export-abi.ts");
  console.log("Try it from the Hardhat console:");
  console.log("  const sale = await ethers.getContractAt('TokenSale',        '" + saleAddress + "')");
  console.log("  const mkt  = await ethers.getContractAt('RobotMarketplace', '" + mktAddress + "')");
  console.log("  await sale.buyTokens({ value: ethers.parseEther('0.5') })");
  console.log("  await (await ethers.getContractAt('RobotCredits','" + tokenAddress + "')).approve(mkt.target, ethers.parseEther('25'))");
  console.log("  await mkt.buyRobot(0)");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

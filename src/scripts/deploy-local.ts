import { network } from "hardhat"

const TOKENS_PER_ETH = 100n;

async function main() {
 const { ethers } = await network.connect();
 const [deployer] = await ethers.getSigners();
 
 console.log("Deployer:", deployer.address);
 console.log(
  "Deployer ETH balance",
  ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 
 );

 const Credits = await ethers.getContractFactory("RobotCredits");
 const token = await Credits.deploy(deployer.address);
 await token.waitForDeployment();
 const tokenAddress = await token.getAddress();
 console.log("RobotCredits deployed at: ", tokenAddress);


 // TokenSale
 const Sale = await ethers.getContractFactory("TokenSale");
 const sale = await Sale.deploy(tokenAddress, TOKENS_PER_ETH, deployer.address);
 await sale.waitForDeployment();
 const saleAddress = await sale.getAddress();
 console.log("Token sale deployed at:", saleAddress);

 // Authority
 const tx = await token.transferOwnership(saleAddress);
 await tx.wait()
 console.log("RobotCredits ownership tranferred to TokenSale");

 console.log("\n--- Summary -----------------------------------");
 console.log(`RCRED : ${tokenAddress}`);
 console.log(`Sale  : ${saleAddress}`);
 console.log(`Rate  : 1 ETH = ${TOKENS_PER_ETH} RCRED`);
 console.log(" ------------------------------------------------");





}


main().catch((err) => {
 console.log(err);
 process.exitCode = 1;
});

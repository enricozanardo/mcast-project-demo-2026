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
}


main().catch((err) => {
 console.log(err);
 process.exitcode = 1;
});

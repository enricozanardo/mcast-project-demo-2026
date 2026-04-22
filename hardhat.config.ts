import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";


export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  paths: {
   sources: "src/contracts",
   tests: "src/test",
  },
  solidity: {
    profiles: {
     default: {
       version: "0.8.28",
     },
    },
  },
  networks: {
   hardhatMainet: {
     type: "edr-simulated",
     chainType: "l1",
   },
   localhost: {
     type: "http",
     chainType: "l1",
     url: "http://127.0.0.1:8545",
   },
  },
}); 
